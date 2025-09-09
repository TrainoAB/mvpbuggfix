export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../serverfetch';
import { DEBUG } from '../secretcontext';
import { apiAuth } from '../apiauth';

// POST / Check Email
export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Check Email Received method:', req.method);

  if (req.method !== 'POST') {
    return NextResponse.json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
  }

  try {
    const body = await req.json();
    DEBUG && console.log('API/Check Email POST Received body:', JSON.stringify(body));

    if (!body) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    // Validate email parameter
    if (!body.email || typeof body.email !== 'string' || body.email.trim() === '') {
      DEBUG && console.log('Invalid or empty email parameter:', body.email);
      return NextResponse.json({ error: 'Email parameter is required and cannot be empty' }, { status: 400 });
    }

    // Trim the email to remove whitespace
    const trimmedEmail = body.email.trim();
    const requestBody = { ...body, email: trimmedEmail };

    const response = await serverFetch(
      'https://traino.nu/php/check_email.php',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      },
      null,
      false,
      sessionId,
    );

    DEBUG && console.log('API/Check Email response:', response);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
