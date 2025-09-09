export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '../serverfetch';
import { DEBUG } from '../secretcontext';
import { apiAuth } from '../apiauth';

// POST / Save a booking
export const POST = apiAuth(async (req, sessionId) => {
  console.log('=== API/BOOKING ROUTE START ===');
  console.log('API/Booking Received method:', req.method);
  console.log('Session ID:', sessionId ? `${sessionId.substring(0, 20)}...` : 'NO SESSION');

  try {
    const body = await req.json();
    console.log('API/Booking POST Received body:', JSON.stringify(body, null, 2));

    if (!body) {
      console.error('Request body is empty');
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    console.log('Calling serverFetch to PHP backend...');
    const response = await serverFetch(
      'https://traino.nu/php/booking.php',
      {
        method: 'POST',
        body: JSON.stringify(body), // Use the original 'data' from the function parameter
      },
      null,
      false,
      sessionId,
    );

    console.log('=== API/BOOKING PHP RESPONSE ===');
    console.log('API/Booking response:', JSON.stringify(response, null, 2));
    console.log('Response type:', typeof response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('=== API/BOOKING ROUTE ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);

    return NextResponse.json(
      {
        error: 'Booking failed',
        message: error.message,
        details: error.stack,
      },
      { status: 500 },
    );
  }
});
