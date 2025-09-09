export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../serverfetch';
import { DEBUG } from '../secretcontext';
import { apiAuth } from '../apiauth';

// POST / Save a booking
export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Signup Received method:', req.method);

  try {
    const body = await req.json();
    DEBUG && console.log('API/Signup POST Received body:', JSON.stringify(body));

    if (!body) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    const response = await serverFetch(
      'https://traino.nu/php/signup.php',
      {
        method: 'POST',
        body: JSON.stringify(body), // Use the original 'data' from the function parameter
      },
      null,
      false,
      sessionId,
    );

    DEBUG && console.log('API/Signup response:', response);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
