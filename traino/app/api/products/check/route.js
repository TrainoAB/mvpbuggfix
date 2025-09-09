export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../../serverfetch';
import { DEBUG } from '../../secretcontext';
import { apiAuth } from '../../apiauth';

export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Products/Check Received method:', req.method);

  const body = await req.json();
  DEBUG && console.log('API/Login POST Received body:', JSON.stringify(body));

  if (!body) {
    return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
  }

  const apiUrl = new URL(`https://traino.nu/php/check_product.php`);

  DEBUG && console.log('API/Products/Check POST URL:', apiUrl);
  const cookieHeader = req.headers.xcookie || '';
  try {
    const data = await serverFetch(
      apiUrl.toString(),
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      null,
      false,
      sessionId,
      cookieHeader,
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin/Products/Check Error in POST API:', error);

    // Forward the error response back to the proxy or higher-level context
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
});
