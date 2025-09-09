export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../../serverfetch';
import { DEBUG } from '../../secretcontext';
import { apiAuth } from '../../apiauth';

export const GET = apiAuth(async (req, sessionId) => {
  try {
    //const requestBody = await req.json();
    const searchParams = new URL(req.url).searchParams;

    DEBUG && console.log('API/map/areaproducts Received method:', req.method, searchParams);
    const cookieHeader = req.headers.xcookie || '';

    const data = await serverFetch(
      'https://traino.nu/php/getproducts_area.php',
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
    DEBUG && console.log('API/map/areaproducts serverFetch error', error?.message, error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
