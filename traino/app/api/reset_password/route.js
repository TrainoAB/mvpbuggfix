export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../serverfetch';
import { DEBUG } from '../secretcontext';
import { apiAuth } from '../apiauth';

export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Reset password Received method:', req.method);

  const requestBody = await req.json();
  DEBUG && console.log('API/Reset password Request Body:', requestBody);

  try {
    const response = await serverFetch(
      `https://traino.nu/php/resetpassword.php`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      null,
      false,
      sessionId,
    );

    DEBUG && console.log('API/Reset password response:', response);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
