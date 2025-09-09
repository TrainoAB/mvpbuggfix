// Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../serverfetch';
import { DEBUG } from '../secretcontext';
import { apiAuth } from '../apiauth';

export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/ACCOUNT DELETION EMAIL Received method:', req.method);

  const requestBody = await req.json();
  DEBUG && console.log('API/ACCOUNT DELETION EMAIL Request Body:', requestBody);

  try {
    const response = await serverFetch(
      `https://traino.nu/php/send_account_deletion_email.php`,
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

    DEBUG && console.log('API/account deletion email response:', response);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
