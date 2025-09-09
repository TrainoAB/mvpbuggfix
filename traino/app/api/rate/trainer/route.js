export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '@/app/api/serverfetch';
import { DEBUG } from '@/app/api/secretcontext';
import { apiAuth } from '@/app/api/apiauth';

export const POST = apiAuth(async (req, sessionId) => {
  DEBUG && console.log('API/Rate Trainer Received method:', req.method);
  try {
    // Get the incoming JSON body directly
    const body = await req.json();
    DEBUG && console.log('API/Rate Trainer POST Received body:', JSON.stringify(body));

    // Log received data
    DEBUG && console.log('API/Rate Trainer Received action:', body.action);

    let url = '';

    // Determine the URL and body based on the action
    if (body.action === 'saveRating') {
      url = 'https://traino.nu/php/saverating.php';
    } else if (body.action === 'saveRatingDescription') {
      url = 'https://traino.nu/php/saveratingtext.php';
    } else {
      throw new Error('Invalid action');
    }

    // Make the server fetch call
    const response = await serverFetch(
      url,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      null,
      false,
      sessionId,
    );

    DEBUG && console.log(`API/Rate Trainer ${body.action} response:`, response);

    // Return the response
    return NextResponse.json(response);
  } catch (error) {
    // Log the error and return a 400 response
    DEBUG && console.error('Error in API/Rate Trainer:', error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
