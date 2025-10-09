export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '@/app/api/serverfetch';
import { DEBUG } from '@/app/api/secretcontext';
import { apiAuth } from '@/app/api/apiauth';

export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Education Delete Received method:', req.method);

  const cookieHeader = req.headers.xcookie || '';

  try {
    const requestBody = await req.json();

    DEBUG && console.log('API/Education Delete searchParams:', req.method, requestBody);
    DEBUG && console.log('API/Education Delete ID:', requestBody.id);

    const response = await serverFetch(
      `https://traino.nu/php/delete_education.php`,
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      },
      null,
      false,
      sessionId,
      cookieHeader,
    );

    DEBUG && console.log('API/Education Delete Response', response);

    return NextResponse.json(response);
  } catch (error) {
    DEBUG && console.error('Error:', error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
