export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../../../serverfetch';
import { DEBUG } from '../../../secretcontext';
import { apiAuth } from '../../../apiauth';

export const GET = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Products/Mapcount Received method:', req.method);

  const { url, method, headers } = req;
  const searchParams = new URL(url).searchParams;

  const apiUrl = new URL(`https://traino.nu/php/getproductcount_type.php`);

  DEBUG && console.log('API/Products/Mapcount GET searchParams:', searchParams);
  DEBUG && console.log('API/Products/Mapcount GET URL:', apiUrl);
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
    console.error('API/Products/Mapcount Error in GET API:', error);

    // Forward the error response back to the proxy or higher-level context
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
});
