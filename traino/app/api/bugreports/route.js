export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../serverfetch';
import { DEBUG } from '../secretcontext';
import { apiAuth } from '../apiauth';

export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Bug Report Received method:', req.method);

  try {
    const requestBody = await req.json();

    DEBUG && console.log('API/Bug Report body:', req.method, requestBody);

    const response = await serverFetch(
      'https://traino.nu/php/insert_bugreport.php',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      },
      null,
      false,
      sessionId,
    );

    DEBUG && console.log('API/Bug Report Response', response);

    return NextResponse.json(response);
  } catch (error) {
    DEBUG && console.error('Error:', error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
