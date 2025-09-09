export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../../serverfetch';
import { DEBUG } from '../../secretcontext';
import { apiAuth } from '../../apiauth';

export const GET = apiAuth(async (req, sessionId) => {
  try {
    DEBUG && console.log('API/Licenses/:', req.method);
    const cookieHeader = req.headers.xcookie || '';

    const data = await serverFetch(
      'https://traino.nu/php/getuser_files.php',
      {
        method: 'GET',
      },
      false,
      sessionId,
      cookieHeader,
    );

    return NextResponse.json(data);
  } catch (error) {
    DEBUG && console.log('API/Licenses serverFetch error', error?.message, error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
