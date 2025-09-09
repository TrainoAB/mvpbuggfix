import { NextResponse } from 'next/server';
import { serverFetch } from '@/app/api/serverfetch';
import { DEBUG } from '@/app/api/secretcontext';
import { apiAuth } from '@/app/api/apiauth';

// GET schedule
export const GET = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Education Received method:', req.method);

  const { url, method, headers } = await req;
  const searchParams = new URL(url).searchParams;

  // Construct the final URL for the external API
  const apiUrl = new URL(`https://traino.nu/php/geteducations.php`);

  DEBUG && console.log('API/Education GET searchParams:', searchParams);
  DEBUG && console.log('API/Education GET URL:', apiUrl);
  const cookieHeader = req.headers.xcookie || '';
  try {
    const data = await serverFetch(
      apiUrl,
      {
        method: 'GET',
      },
      searchParams,
      false,
      sessionId,
      cookieHeader,
    );

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
