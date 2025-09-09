export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../serverfetch';
import { DEBUG } from '../secretcontext';
import { apiAuth } from '../apiauth';

// POST / Check Email
export const GET = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Confirm Email Received method:', req.method);

  const { url, method, headers } = req;
  const searchParams = new URL(url).searchParams;

  const apiUrl = new URL(`https://traino.nu/php/confirmemail.php`);

  DEBUG && console.log('API/Confirm Email GET searchParams:', searchParams);
  DEBUG && console.log('API/Confirm Email GET URL:', apiUrl);

  try {
    const response = await serverFetch(
      apiUrl.toString(),
      {
        method: 'GET',
      },
      searchParams,
      false,
      sessionId,
    );

    DEBUG && console.log('API/Confirm Email response:', response);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
