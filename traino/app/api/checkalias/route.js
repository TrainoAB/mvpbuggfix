export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../serverfetch';
import { DEBUG } from '../secretcontext';
import { apiAuth } from '../apiauth';

// POST / Check Alias
export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Check Alias Received method:', req.method);

  if (req.method !== 'POST') {
    return NextResponse.json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
  }

  try {
    const body = await req.json();
    DEBUG && console.log('API/Check Alias POST Received body:', JSON.stringify(body));

    if (!body) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    const response = await serverFetch(
      'https://traino.nu/php/check_alias.php',
      {
        method: 'POST',
        body: JSON.stringify(body), // Use the original 'data' from the function parameter
      },
      null,
      false,
      sessionId,
    );

    DEBUG && console.log('API/Check Alias response:', response);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
