export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../../serverfetch';
import { DEBUG } from '../../secretcontext';
import { apiAuth } from '../../apiauth';

// POST / Save a booking
export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Stripe/Updatestripeid Received method:', req.method);
  // DEBUG && console.log('ASession ID:', sessionId);
  try {
    const body = await req.json();
    DEBUG && console.log('API/Stripe/Updatestripeid POST Received body:', JSON.stringify(body));

    if (!body) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }
    DEBUG && console.log('Start fetch...');
    const response = await serverFetch(
      'https://traino.nu/php/updatestripeid.php',
      {
        method: 'POST',
        body: JSON.stringify(body), // Use the original 'data' from the function parameter
      },
      null,
      false,
      sessionId,
    );

    DEBUG && console.log('API/Stripe/Updatestripeid response:', response);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
