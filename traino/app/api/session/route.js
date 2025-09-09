export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../serverfetch';
import { DEBUG } from '../secretcontext';
import { apiAuth } from '../apiauth';

export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Session Received method:', req.method);

  if (req.method !== 'POST') {
    return NextResponse.json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
  }

  try {
    const body = await req.json();
    DEBUG && console.log('API/Session POST Received body:', JSON.stringify(body));

    if (!body) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    const response = await serverFetch(
      'https://traino.nu/php/check_session.php',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      null,
      false,
      sessionId,
    );

    DEBUG && console.log('API/Session POST response:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin/Session Error in POST API:', error);

    // Forward the error response back to the proxy or higher-level context
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
});
