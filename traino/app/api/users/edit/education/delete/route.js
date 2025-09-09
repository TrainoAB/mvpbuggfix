export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '@/app/api/serverfetch';
import { DEBUG } from '@/app/api/secretcontext';
import { apiAuth } from '@/app/api/apiauth';

export const GET = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Education Delete Received method:', req.method);

  const cookieHeader = req.headers.xcookie || '';

  try {
    const searchParams = new URL(req.url).searchParams;
    const id = searchParams.get('id');

    DEBUG && console.log('API/Education Delete searchParams:', searchParams);
    DEBUG && console.log('API/Education Delete ID:', id);

    const response = await serverFetch(
      `https://traino.nu/php/delete_education.php?id=${id}`,
      {
        method: 'DELETE',
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
