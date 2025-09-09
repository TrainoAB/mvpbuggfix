export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../serverfetch';
import { DEBUG } from '../secretcontext';
import { apiAuth } from '../apiauth';

export const GET = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Categories Received method:', req.method, 'sessionId:', sessionId);

  try {
    const response = await serverFetch(
      'https://traino.nu/php/getcategories.php',
      {
        method: 'GET',
      },
      null,
      false,
      sessionId,
    );

    DEBUG && console.log('API/Categories GET response:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin/Categories Error in GET API:', error);

    // Forward the error response back to the proxy or higher-level context
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
});
