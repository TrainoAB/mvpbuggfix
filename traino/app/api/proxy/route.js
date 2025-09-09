export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { DEBUG, SERVER_SECRET, validateServerSecret, API_KEY, baseUrl } from '../secretcontext';
import crypto from 'crypto';

// Server-side AES decryption for session ID (matching client-side implementation)
function decryptSessionIdServer(encryptedData) {
  try {
    // Use a key derived from API_KEY (same as client)
    const keyString = API_KEY.slice(0, 32).padEnd(32, '0');
    const key = Buffer.from(keyString, 'utf8').subarray(0, 32); // Ensure exactly 32 bytes

    // Decode base64 and extract IV + encrypted data
    const combined = Buffer.from(encryptedData, 'base64');
    const iv = combined.slice(0, 12); // IV is first 12 bytes
    const encryptedWithTag = combined.slice(12); // Rest is encrypted data + auth tag

    // For AES-GCM, the auth tag is the last 16 bytes
    const authTag = encryptedWithTag.slice(-16);
    const encryptedBuffer = encryptedWithTag.slice(0, -16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedBuffer, null, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    DEBUG && console.log('Server-side decryption failed:', error);
    return null;
  }
}

export const POST = async (req) => {
  DEBUG && console.log('=== PROXY ROUTE CALLED ===');
  try {
    let sessionIdFromCookie = req.cookies.get('loginSessionId')?.value || '';

    DEBUG && console.log('PROXY incoming encrypted sessionId in cookie:', sessionIdFromCookie);

    const allCookies = req.cookies.getAll();
    const enudataCookie = allCookies.find((c) => c.name === 'enudata');
    const cookieHeader = enudataCookie ? `enudata=${enudataCookie.value}` : '';
    DEBUG && console.log('PROXY cookieHeader string:', cookieHeader, typeof cookieHeader);

    // If we have an encrypted session cookie, decrypt it
    let decryptedSessionId = '';
    if (sessionIdFromCookie) {
      try {
        decryptedSessionId = decryptSessionIdServer(sessionIdFromCookie);
        DEBUG &&
          console.log('PROXY decrypted sessionId:', decryptedSessionId ? `Success: ${decryptedSessionId}` : 'Failed');
        if (!decryptedSessionId) {
          console.log('Decryption failed, using empty session ID');
          decryptedSessionId = '';
        }
      } catch (error) {
        console.log('Failed to decrypt session cookie:', error.message);
        decryptedSessionId = '';
      }
    } else {
      console.log('PROXY no session cookie found');
    }

    const { url, method, headers, body } = await req.json();
    DEBUG && console.log('Parsed JSON in Proxy:', { url, method, headers, body });

    if (!validateServerSecret(SERVER_SECRET)) {
      DEBUG && console.error('Proxy: Invalid Secret');
      return NextResponse.json({ error: 'Invalid Secret' }, { status: 401 });
    }

    DEBUG && console.log('[Proxy] Forwarding cookie to serverFetch:', allCookies);

    const fetchOptions = {
      method: method || 'GET',
      headers: {
        xcookie: cookieHeader,
        ...headers,
        Authorization: `${decryptedSessionId}TrainoStarPower${SERVER_SECRET}`,
        Origin: baseUrl || 'http://localhost:3000', // Use current origin or fallback
      },
      credentials: 'include', // Include cookies in the request
    };

    DEBUG && console.log('PROXY sending Authorization header:', fetchOptions.headers.Authorization);

    // Conditionally add body if present
    if (body) {
      fetchOptions.body = body;
    }

    DEBUG && console.log('Proxy Fetch:', url);
    DEBUG && console.log('Proxy fetch options:', fetchOptions);

    const response = await fetch(url, fetchOptions);

    // Get response data regardless of status code
    const responseData = await response.json();

    if (!response.ok) {
      DEBUG && console.log('Proxy response error:', response.status, response.statusText);
      DEBUG && console.log('Proxy response data:', responseData);

      // Return the actual error response with the appropriate status code
      return NextResponse.json(responseData, { status: response.status });
    }

    const nextResp = NextResponse.json(responseData);

    const isLoggedIn = !!responseData.session_id && !!responseData.id;
    const isLoggedOut = false && !!responseData.isLoggedOut; // TODO: Make this correct after logout

    // For login success, we'll let the frontend handle setting the encrypted cookie
    // The proxy doesn't need to set the session cookie anymore since we're using client-side encryption
    if (isLoggedOut) {
      // Only clear cookie on logout
      const cookie = {
        name: 'loginSessionId',
        value: '',
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        expires: new Date(Date.now() - 24 * 3600 * 1000),
      };
      nextResp.cookies.set(cookie);
      DEBUG && console.log('PROXY cookie cleared for logout');
    }

    return nextResp;
  } catch (error) {
    console.error('Proxy fetch error:', error);
    return NextResponse.json({ error: 'Error fetching data', error }, { status: 500 });
  }
};
