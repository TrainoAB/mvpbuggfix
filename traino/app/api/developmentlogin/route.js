export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const providedPassword = searchParams.get('password');

  // Retrieve the password from environment variables
  const correctPassword = process.env.PASSWORD;

  // Check if the provided password matches the correct password
  if (providedPassword === correctPassword) {
    return NextResponse.json({ success: true, message: 'Password is correct.' });
  } else {
    return NextResponse.json({ success: false, message: 'Password is incorrect.' }, { status: 401 });
  }
}
