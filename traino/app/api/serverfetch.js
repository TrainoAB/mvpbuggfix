import { generateRandomToken } from './tokengen.js';
import { DEBUG, API_KEY, baseUrl } from './secretcontext';

// Helper function to get cookie value (works in both client and server)
function getCookie(name) {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') {
    return null; // Return null in server-side environment
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Simple AES encryption for session ID (browser-compatible)
async function encryptSessionId(sessionId, apiKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(sessionId);

  // Use a key derived from API_KEY
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiKey.slice(0, 32).padEnd(32, '0')),
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, keyMaterial, data);

  // Combine IV + encrypted data and convert to base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

// Simple AES decryption for session ID (browser-compatible)
async function decryptSessionId(encryptedData, apiKey) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Use a key derived from API_KEY
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiKey.slice(0, 32).padEnd(32, '0')),
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );

  // Decode base64 and extract IV + encrypted data
  const combined = new Uint8Array(
    atob(encryptedData)
      .split('')
      .map((c) => c.charCodeAt(0)),
  );
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, keyMaterial, encrypted);

  return decoder.decode(decrypted);
}

// Function to set encrypted session cookie
export async function setSessionCookie(sessionId, days = 90, apiKey = null) {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') {
    DEBUG && console.log('Cannot set cookie in server environment');
    return;
  }

  // Use provided API key or fallback to imported one
  const keyToUse = apiKey || API_KEY;

  if (!keyToUse) {
    console.error('No API key available for session encryption');
    return;
  }

  try {
    const encryptedSessionId = await encryptSessionId(sessionId, keyToUse);
    const expiryDate = new Date();
    expiryDate.setTime(expiryDate.getTime() + days * 24 * 60 * 60 * 1000);

    document.cookie = `loginSessionId=${encryptedSessionId}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict; Secure`;
    DEBUG && console.log('Session cookie set successfully');
  } catch (error) {
    console.error('Failed to set session cookie:', error);
  }
}

// Function to clear session cookie
export function clearSessionCookie() {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') {
    DEBUG && console.log('Cannot clear cookie in server environment');
    return;
  }

  document.cookie = 'loginSessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure';
  DEBUG && console.log('Session cookie cleared');
}

export async function serverFetch(
  endpoint,
  options = {},
  query = null,
  useOldApiKey = false,
  sessionId = '',
  cookieHeader = '',
) {
  DEBUG && console.log('serverFetch:', endpoint, sessionId, options, useOldApiKey);
  let responseText = null; // Declare outside try block so it's accessible in catch

  try {
    const API_KEY_GEN = generateRandomToken(API_KEY);
    DEBUG && console.log('API KEY from env ', API_KEY);
    DEBUG && console.log('API KEY Generated ', API_KEY_GEN);

    // Get session ID if not provided and not using old API key
    if (!sessionId && !useOldApiKey) {
      // Try to get session ID from cookie first (only in browser environment)
      const loginSessionCookie = getCookie('loginSessionId');
      if (loginSessionCookie) {
        // Decrypt the session ID from cookie
        try {
          sessionId = await decryptSessionId(loginSessionCookie, API_KEY);
          DEBUG && console.log('serverFetch got sessionId from cookie:', sessionId);
        } catch (error) {
          DEBUG && console.log('Failed to decrypt session from cookie:', error);
          // Continue to fallback
        }
      }

      // Fallback to getting token from API if no valid session in cookie
      if (!sessionId) {
        const url = `${baseUrl}/api/getsessiontoken`;
        const response = await fetch(url);
        const sessionObject = await response.json();
        DEBUG && console.log('serverFetch get sessionId from API:', sessionObject);
        sessionId = sessionObject.token;
      }
    }

    // Ensure we have a sessionId for non-old API calls
    if (!useOldApiKey && !sessionId) {
      throw new Error('No session ID available for API call');
    }

    let url = endpoint;

    // Add query parameters if they exist
    if (query) {
      const queryString = typeof query === 'string' ? query : new URLSearchParams(query).toString();
      url += `?${queryString}`;
    }

    DEBUG && console.log('[serverFetch] Cookie header in fetchOptions:', cookieHeader);

    const fetchOptions = {
      ...options,
      headers: {
        ...options.headers,
        //Authorization: useOldApiKey ? `${API_KEY}` : `TrainoStarPower${API_KEY_GEN}`,
        Authorization: useOldApiKey ? `${API_KEY}` : `${sessionId}TrainoStarPower${API_KEY_GEN}`,
        'Content-Type': 'application/json',
        Origin: baseUrl || 'http://localhost:3000', // Use current origin or fallback
        ...(cookieHeader ? { xcookie: cookieHeader } : {}),
      },
      // credentials: 'include',
    };

    // Ensure `body` is properly formatted
    if (options.body && typeof options.body !== 'string') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    DEBUG && console.log('serverFetch: Request URL:', url);
    DEBUG && console.log('serverFetch: Request Options:', fetchOptions);

    const response = await fetch(url, fetchOptions);

    DEBUG && console.log('Server fetch response status', response.status);

    // Get response text
    responseText = await response.text();
    DEBUG && console.log('Response text was:', responseText);

    // Clean HTML error messages and warnings from the response
    // This removes PHP error/warning messages that can break JSON parsing
    const cleanJsonText = responseText
      .replace(/<br\s*\/?>/gi, '\n') // Replace <br> with newlines
      .replace(/<b>.*?<\/b>/gi, '') // Remove <b> tags and content
      .replace(/^\s*Deprecated:.*$/gm, '') // Remove deprecation warnings
      .replace(/^\s*Warning:.*$/gm, '') // Remove warnings
      .replace(/^\s*Notice:.*$/gm, '') // Remove notices
      .replace(/^\s*Fatal error:.*$/gm, '') // Remove fatal errors
      .replace(/^\s*Parse error:.*$/gm, '') // Remove parse errors
      .replace(/^\s*Error:.*$/gm, '') // Remove other errors
      .trim();

    // Find the first valid JSON object/array in the cleaned text
    let jsonStartIndex = -1;
    for (let i = 0; i < cleanJsonText.length; i++) {
      if (cleanJsonText[i] === '{' || cleanJsonText[i] === '[') {
        jsonStartIndex = i;
        break;
      }
    }

    let data;
    if (jsonStartIndex >= 0) {
      const jsonText = cleanJsonText.substring(jsonStartIndex);
      DEBUG && console.log('Cleaned JSON text:', jsonText);
      data = JSON.parse(jsonText);
    } else {
      // If no JSON found, try parsing the entire cleaned text
      data = JSON.parse(cleanJsonText);
    }

    DEBUG && console.log('Parsed JSON:', data);

    if (!response.ok) {
      console.error('serverFetch: Server returned an error:', data); // Log the entire error response

      // Extract error message properly from the response
      let errorMessage = 'Server returned an error';
      if (data && typeof data === 'object') {
        if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        } else {
          errorMessage = JSON.stringify(data);
        }
      } else if (data && typeof data === 'string') {
        errorMessage = data;
      }

      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    // Log the error for debugging
    DEBUG && console.error('Error in serverFetch:', error);
    DEBUG && console.error('Response text was:', responseText);

    // Throw the error again to propagate it up
    throw error;
  }
}
