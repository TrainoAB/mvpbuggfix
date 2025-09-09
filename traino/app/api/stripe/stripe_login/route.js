export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  if (request.method === 'POST') {
    return new NextResponse(`Method ${request.method} Not Allowed`, {
      status: 405,
      headers: {
        Allow: 'POST',
        'Content-Type': 'application/json',
      },
    });
  }
  try {
    const { accountId } = request.body;
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return NextResponse.json({ url: loginLink.url }, { status: 200 });
  } catch (err) {
    console.error('Error creating Stripe login link:', err);
    return NextResponse.json({ error: `Error: ${err.message}` }, { status: 500 });
  }
}
