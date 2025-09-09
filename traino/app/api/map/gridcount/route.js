export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../../serverfetch';
import { DEBUG } from '../../secretcontext';
import { apiAuth } from '../../apiauth';

export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/map/gridcount Received method:', req.method);

  try {
    const requestBody = await req.json();
    const searchParams = new URL(req.url).searchParams;

    DEBUG && console.log('API/map/gridcount Received method:', req.method, requestBody, searchParams);

    const data = await serverFetch(
      'https://traino.nu/php/getproductscount_grid.php',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      },
      searchParams,
      false,
      sessionId,
    );

    return NextResponse.json(data);
  } catch (error) {
    DEBUG && console.log('API/map/gridcount serverFetch error', error?.message, error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
