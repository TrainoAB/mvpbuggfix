export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../serverfetch';
import { DEBUG } from '../secretcontext';
import { apiAuth } from '../apiauth';

export const GET = apiAuth(async (req, sessionId) => {
  try {
    DEBUG && console.log('API/READ Review Received method:', req.method);
    const cookieHeader = req.headers.xcookie || '';
    const { searchParams } = new URL(req.url);
    const userid = searchParams.get('id');
    const data = await serverFetch(
      `https://traino.nu/php/getreviews.php?id=${userid}`,
      {
        method: 'GET',
      },
      null,
      false,
      sessionId,
      cookieHeader,
    );

    return NextResponse.json(data);
  } catch (error) {
    DEBUG && console.log('API/READREVIEW/serverfetch error', error?.message, error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
