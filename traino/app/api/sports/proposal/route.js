export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../../serverfetch';
import { DEBUG } from '../../secretcontext';
import { apiAuth } from '../../apiauth';

export const POST = apiAuth(async (req, sessionId) => {
  try {
    const body = await req.json();
    DEBUG && console.log('API/sports/proposal POST Received body:', JSON.stringify(body));

    if (!body) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    const response = await serverFetch(
      'https://traino.nu/php/add_sport_proposal.php',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      null,
      false,
      sessionId,
    );

    DEBUG && console.log('API/sports/proposal Add sport proposal response:', response);

    return NextResponse.json(response, {
      status: response.error ? 400 : 200,
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
