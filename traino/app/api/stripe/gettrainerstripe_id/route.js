export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../../serverfetch';
import { DEBUG } from '../../secretcontext';
import { apiAuth } from '../../apiauth';

export const POST = apiAuth(async (req, sessionId) => {
  try {
    const body = await req.json();
    const { trainer_id } = body;
    DEBUG && console.log('Parsed request body:', body);
    DEBUG && console.log('trainer_id:', trainer_id);
    const cookieHeader = req.headers.xcookie || '';

    const response = await serverFetch(
      'https://traino.nu/php/gettrainerstripe_id.php',
      {
        method: 'POST',
        body: JSON.stringify({ trainer_id }),
      },
      null,
      false,
      sessionId,
      cookieHeader,
    );

    DEBUG && console.log('API/Get Trainer Stripe ID response:', response);

    return NextResponse.json(response);
  } catch (error) {
    DEBUG && console.error('Error:', error.message, error.stack);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
