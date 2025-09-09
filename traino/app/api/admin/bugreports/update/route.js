export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../../../serverfetch';
import { DEBUG } from '../../../secretcontext';
import { apiAuth } from '../../../apiauth';

export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Bug Report Received method:', req.method);

  try {
    const searchParams = new URL(req.url).searchParams;
    const id = searchParams.get('id');
    const requestBody = await req.json();

    DEBUG && console.log('API/Bug Report Update body:', req.method, requestBody);
    DEBUG && console.log('API/Bug Report Update ID:', id);

    const response = await serverFetch(
      `https://traino.nu/php/admin_updatebugreport.php?id=${id}`,
      {
        method: 'UPDATE',
        body: JSON.stringify(requestBody),
      },
      null,
      false,
      sessionId,
    );

    DEBUG && console.log('API/Bug Report Update Response', response);

    return NextResponse.json(response);
  } catch (error) {
    DEBUG && console.error('Error:', error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
