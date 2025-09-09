export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '@/app/api/serverfetch';
import { DEBUG } from '@/app/api/secretcontext';
import { apiAuth } from '@/app/api/apiauth';

export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Products/Bounds Received method:', req.method);

  const { url, method, headers } = req;
  const searchParams = new URL(url).searchParams;

  try {
    const body = await req.json();
    DEBUG && console.log('API/Products/Bounds POST Received body:', JSON.stringify(body));

    if (!body) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    const response = await serverFetch(
      'https://traino.nu/php/getproducts_bounds.php',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      searchParams,
      false,
      sessionId,
    );

    DEBUG && console.log('API/Products/Bounds response:', response);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
