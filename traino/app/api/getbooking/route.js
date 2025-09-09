export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { serverFetch } from '@/app/api/serverfetch';
import { DEBUG } from '@/app/api/secretcontext';
import { apiAuth } from '@/app/api/apiauth';

export const GET = apiAuth(async (req, sessionId) => {
  try {
    const { url, method, headers } = await req;

    const searchParams = new URL(url).searchParams;

    const response = await serverFetch(
      'https://traino.nu/php/getbooking.php',
      {
        method: 'GET',
      },
      searchParams,
      false,
      sessionId,
    );

    DEBUG && console.log('API/Get User Bookings response:', response);

    return NextResponse.json(response);
  } catch (error) {
    DEBUG && console.error('Error:', error.message, error.stack);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
});
