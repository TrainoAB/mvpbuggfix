export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '@/app/api/serverfetch';
import { DEBUG } from '@/app/api/secretcontext';
import { apiAuth } from '@/app/api/apiauth';

// POST / Products/Delete
export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Users/Delete Received method:', req.method);

  const cookieHeader = req.headers.xcookie || '';

  if (req.method !== 'POST') {
    return NextResponse.json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
  }

  try {
    const body = await req.json();
    DEBUG && console.log('API/Users/Delete POST Received body:', JSON.stringify(body));

    if (!body) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    const response = await serverFetch(
      'https://traino.nu/php/delete_user.php',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      null,
      false,
      sessionId,
      cookieHeader,
    );

    DEBUG && console.log('API/Users/Delete response:', response);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
