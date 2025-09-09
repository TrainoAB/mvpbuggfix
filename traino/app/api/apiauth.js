export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { allowedIps } from './ipwhitelist';
import { validateToken } from './tokengen';
import { DEBUG, DEVELOPMENT_MODE, SERVER_SECRET, validateServerSecret } from './secretcontext';

export function apiAuth(handler) {
  return async (request) => {
    DEBUG && console.log('ApiAuth: Original request headers:', Object.fromEntries(request.headers.entries()));
    DEBUG && console.log('ApiAuth: xcookie from original:', request.headers.get('xcookie'));

    // If you want IP whitelist on api calls
    /*
    const clientIp = request.headers.get('x-forwarded-for') || request.ip;
    if (!allowedIps.includes(clientIp)) {
      return NextResponse.json({ error: 'IP not allowed' }, { status: 403 });
    }
    */

    if (!validateServerSecret(SERVER_SECRET)) {
      return NextResponse.json({ error: 'API Auth: Invalid Server Secret' }, { status: 401 });
    }

    let sessionId = '';

    console.log('API Auth: DEVELOPMENT_MODE', DEVELOPMENT_MODE);

    // Extract session ID from Authorization header regardless of development mode
    let authHeader = request.headers.get('authorization');
    console.log('API Auth: Header', authHeader);

    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    if (authHeader) {
      const trainoIx = authHeader.indexOf('TrainoStarPower');
      console.log('API Auth: trainoIx', trainoIx);

      if (trainoIx >= 0) {
        sessionId = authHeader.slice(0, trainoIx);
        authHeader = authHeader.slice(trainoIx);
        console.log('API Auth: Extracted sessionId', sessionId);
        console.log('API Auth: Remaining authHeader', authHeader);
      }

      if (!DEVELOPMENT_MODE) {
        // Only validate in production mode
        if (!authHeader || !authHeader.startsWith('TrainoStarPower')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const bearer = authHeader.slice('TrainoStarPower'.length);
        DEBUG && console.log('Bearer:', bearer, 'Server Secret:', SERVER_SECRET);

        if (SERVER_SECRET !== bearer) {
          return NextResponse.json({ error: 'API Auth: Invalid Server Secret Key' }, { status: 401 });
        }
      }
    }

    let newRequest;

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      // For requests with body
      newRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        duplex: 'half',
      });
    } else {
      // For GET/HEAD requests without body
      newRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
      });
    }

    DEBUG && console.log('ApiAuth: New request headers:', Object.fromEntries(newRequest.headers.entries()));
    DEBUG && console.log('ApiAuth: xcookie from new request:', newRequest.headers.get('xcookie'));

    return handler(newRequest, sessionId);
  };
}
