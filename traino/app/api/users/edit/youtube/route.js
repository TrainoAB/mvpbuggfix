export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '@/app/api/serverfetch';
import { DEBUG } from '@/app/api/secretcontext';
import { apiAuth } from '@/app/api/apiauth';

export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/User/Edit/Youtube Received method:', req.method);

  const cookieHeader = req.headers.xcookie || '';

  try {
    const requestBody = await req.json();

    DEBUG && console.log('API/User/Edit/Youtube Update body:', req.method, requestBody);
    DEBUG && console.log('API/User/Edit/Youtube Update ID:', requestBody.id);
    DEBUG && console.log('API/User/Edit/Youtube Update YoutubeID:', requestBody.youtube_id);

    const response = await serverFetch(
      `https://traino.nu/php/updateyoutubecover.php`,
      {
        method: 'POST',
        body: JSON.stringify({
          id: requestBody.id,
          youtube_id: requestBody.youtube_id,
        }),
      },
      null,
      false,
      sessionId,
      cookieHeader,
    );

    DEBUG && console.log('API/User/Edit/Youtube Update Response', response);

    return NextResponse.json(response);
  } catch (error) {
    DEBUG && console.error('Error:', error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
