export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '@/app/api/serverfetch';
import { DEBUG } from '@/app/api/secretcontext';
import { apiAuth } from '@/app/api/apiauth';

export const GET = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Products/HasBought/Check Received method:', req.method);

  const { url, method, headers } = req;
  const searchParams = new URL(url).searchParams;

  const apiUrl = new URL(`https://traino.nu/php/check_hasboughtproduct.php`);

  DEBUG && console.log('API/Products/HasBought/Check GET searchParams:', searchParams);
  DEBUG && console.log('API/Products/HasBought/Check GET URL:', apiUrl);
  const cookieHeader = req.headers.xcookie || '';
  try {
    const data = await serverFetch(
      apiUrl.toString(),
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
    console.error('Admin/Products/HasBought/Check Error in GET API:', error);

    // Forward the error response back to the proxy or higher-level context
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
});
