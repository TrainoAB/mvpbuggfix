export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '@/app/api/serverfetch';
import { DEBUG } from '@/app/api/secretcontext';
import { apiAuth } from '@/app/api/apiauth';

export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/User Received method:', req.method);

  const cookieHeader = req.headers.get('xcookie') || '';
  DEBUG && console.log('API/User Cookie Header:', cookieHeader);

  try {
    const requestBody = await req.json();

    DEBUG && console.log('API/User Update body:', req.method, requestBody);
    DEBUG && console.log('API/User Update ID:', requestBody.id);

    const response = await serverFetch(
      `https://traino.nu/php/updateuser.php?id=${requestBody.id}`,
      {
        method: 'UPDATE',
        body: JSON.stringify(requestBody),
      },
      null,
      false,
      sessionId,
      cookieHeader,
    );

    DEBUG && console.log('API/User Update Response', response);

    return NextResponse.json(response);
  } catch (error) {
    DEBUG && console.error('Error:', error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
