export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../serverfetch';
import { DEBUG } from '../secretcontext';
import { apiAuth } from '../apiauth';

export const GET = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/FAQ Received method:', req.method);

  if (req.method !== 'GET') {
    return NextResponse.json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
  }

  try {
    const { url, method, headers, body } = await req;
    const searchParams = new URL(url).searchParams;

    // Construct the final URL for the external API
    const apiUrl = new URL(`https://traino.nu/php/faq_search.php`);

    DEBUG && console.log('API/FAQ searchParams:', searchParams);
    DEBUG && console.log('API/FAQ URL:', apiUrl.toString());

    const response = await serverFetch(
      apiUrl.toString(),
      {
        method: 'GET',
      },
      searchParams,
      false,
      sessionId,
    );

    DEBUG && console.log('API/FAQ Response', response);
    // if (!response.ok) {
    //   throw new Error('Network response was not ok');

    // }

    // const data = await response;
    DEBUG && console.log('API/FAQ Success:', response);

    return NextResponse.json(response);
  } catch (error) {
    DEBUG && console.error('Error:', error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
