export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '@/app/api/serverfetch';
import { DEBUG } from '@/app/api/secretcontext';
import { apiAuth } from '@/app/api/apiauth';

// POST / Products/Create
export const POST = apiAuth(async (req, sessionId) => {
  console.log('API/Products/Create Received method:', req.method);
  console.log('API/Products/Create sessionId from apiAuth:', sessionId);

  if (req.method !== 'POST') {
    return NextResponse.json({ error: `Method ${req.method} Not Allowed` }, { status: 405 });
  }

  try {
    const body = await req.json();
    DEBUG && console.log('API/Products/Create POST Received body:', JSON.stringify(body));

    if (!body) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    // Make direct call to PHP with session ID
    const response = await fetch('https://traino.nu/php/createproduct.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${sessionId}TrainoStarPower${process.env.SERVER_SECRET}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    DEBUG && console.log('API/Products/Create response:', result);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
