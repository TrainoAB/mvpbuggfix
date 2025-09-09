export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../serverfetch';
import { DEBUG } from '../secretcontext';
import { apiAuth } from '../apiauth';

// GET schedule
export const GET = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Clipcards Received method:', req.method);

  const { url, method, headers } = await req;
  const searchParams = new URL(url).searchParams;

  // Construct the final URL for the external API
  const apiUrl = new URL(`https://traino.nu/php/getclipcards.php`);

  DEBUG && console.log('API/Clipcards GET searchParams:', searchParams);
  DEBUG && console.log('API/Clipcards GET URL:', apiUrl);
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
