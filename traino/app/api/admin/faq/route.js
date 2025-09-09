export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../../serverfetch';
import { DEBUG } from '../../secretcontext';
import { apiAuth } from '../../apiauth';

export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/FAQ Received method:', req.method);
  DEBUG && console.log('API/FAQ Received url:', req.url);

  try {
    // Parse the request body correctly
    const body = await req.json();
    const url = req.url;

    DEBUG && console.log('API/FAQ body:', body);
    DEBUG && console.log('API/FAQ URL:', url);

    if (!url) {
      throw new Error('URL is missing from the request body');
    }

    const searchParams = new URL(url).searchParams;

    DEBUG && console.log('API/FAQ searchParams:', searchParams.toString());

    const response = await serverFetch(
      'https://traino.nu/php/admin_faq.php',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      searchParams,
      false,
      sessionId,
    );

    DEBUG && console.log('API/FAQ Response', response);

    return NextResponse.json(response);
  } catch (error) {
    DEBUG && console.error('API/FAQ Error:', error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
