export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../../serverfetch';
import { DEBUG } from '../../secretcontext';
import { apiAuth } from '../../apiauth';

export const GET = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Admin/Stats Received method:', req.method);
  const cookieHeader = req.headers.xcookie || '';

  try {
    const data = await serverFetch(
      'https://traino.nu/php/admin_stats.php',
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
    console.error('API/Admin/Stats Error in GET API:', error);

    // Forward the error response back to the proxy or higher-level context
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
});
