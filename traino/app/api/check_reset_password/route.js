export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../serverfetch';
import { DEBUG } from '../secretcontext';
import { apiAuth } from '../apiauth';

export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Check Reset Password Received method:', req.method);

  const requestBody = await req.json();
  DEBUG && console.log('API/Check Reset Password data:', requestBody);

  try {
    const response = await serverFetch(
      `https://traino.nu/php/check_resetpassword.php`,
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

    DEBUG && console.log('API/Check Reset Password response:', response);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
