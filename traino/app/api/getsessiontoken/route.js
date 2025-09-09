export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { SERVER_SECRET, DEBUG } from '../secretcontext';
import { generateRandomToken } from '../tokengen';

let tokenVersion = 0;

export async function GET() {
  try {
    const sessionObject = {
      token: generateRandomToken(SERVER_SECRET, DEBUG),
      tokenVersion: ++tokenVersion,
    };
    return NextResponse.json(sessionObject, { status: 200 });
  } catch (error) {
    console.error('Error generating session object:', error);
    return NextResponse.json({ error: 'Failed to generate session object' }, { status: 500 });
  }
}
