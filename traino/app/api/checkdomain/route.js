export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { serverFetch } from '../serverfetch';
import { DEBUG } from '../secretcontext';
import { apiAuth } from '../apiauth';

// POST / check email domain
export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/CheckEmailDomain Received method:', req.method);

  if (req.method !== 'POST') {
    return NextResponse.json(
      { error: `Method ${req.method} Not Allowed` },
      { status: 405 }
    );
  }

  try {
    const body = await req.json();
    DEBUG && console.log('API/CheckEmailDomain POST Received body:', JSON.stringify(body));

    if (!body || !body.email) {
      return NextResponse.json(
        { error: 'Missing email in request body' },
        { status: 400 }
      );
    }

    const response = await serverFetch(
      'https://traino.nu/php/check_domain.php',  // ← DITT PHP-SCRIPT
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      null,
      false,
      sessionId
    );

    DEBUG && console.log('API/CheckEmailDomain response:', response);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
