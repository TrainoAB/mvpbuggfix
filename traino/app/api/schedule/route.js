export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../serverfetch';
import { DEBUG } from '../secretcontext';
import { apiAuth } from '../apiauth';

// GET schedule
export const GET = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Schedule Received method:', req.method);

  const { url, method, headers } = await req;
  const searchParams = new URL(url).searchParams;

  // Construct the final URL for the external API
  const apiUrl = new URL(`https://traino.nu/php/getschedule.php`);

  DEBUG && console.log('API/Schedule GET searchParams:', searchParams);
  DEBUG && console.log('API/Schedule GET URL:', apiUrl);
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

/*
// POST / Save a schedule
export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Schedule Received method:', req.method);

  if (req.method !== 'POST') {
    // Handle any other HTTP method
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { url, method, headers } = await req;
  const searchParams = new URL(url).searchParams;

  // Extract query parameters dynamically
  const clientQueryParams = {};
  for (const [key, value] of searchParams.entries()) {
    clientQueryParams[key] = value;
  }

  // Construct the final URL for the external API
  const apiUrl = new URL(`https://traino.nu/php/getschedule.php`);

  // Append searchParams to apiUrl
  for (const [key, value] of Object.entries(clientQueryParams)) {
    apiUrl.searchParams.append(key, value);
  }

  DEBUG && console.log('API/Schedule POST searchParams:', searchParams);
  DEBUG && console.log('API/Schedule POST URL:', apiUrl.toString());

  try {
    const data = await serverFetch(apiUrl.toString(), {
        method: 'GET',
      },
      null, false,
      sessionId
    );

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
*/
