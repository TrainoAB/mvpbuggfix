export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../../../serverfetch';
import { DEBUG } from '../../../secretcontext';
import { apiAuth } from '../../../apiauth';

export const GET = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Licenses Delete Received method:', req.method);

  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const id = searchParams.get('id');

    DEBUG && console.log('API/Licenses Delete searchParams:', searchParams);
    DEBUG && console.log('API/Licenses Delete ID:', id);

    const response = await serverFetch(
      `https://traino.nu/php/admin_deletelicense.php`,
      {
        method: 'DELETE',
      },
      searchParams,
      false,
      sessionId,
    );

    DEBUG && console.log('API/Licenses Response', response);

    return NextResponse.json(response);
  } catch (error) {
    DEBUG && console.error('Error:', error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
