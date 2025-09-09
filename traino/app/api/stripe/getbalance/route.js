export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { stripe } from '@/app/api/stripe/connect';

export async function POST(req) {
  const body = await req.json();
  const { stripe_id } = body;

  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: stripe_id, // Connected Account ID
    });

    return NextResponse.json({ balance }, { status: 200 });
  } catch (err) {
    console.error('Error getting balance from Stripe:', err);
    return NextResponse.json({ error: `Error: ${err.message}` }, { status: 500 });
  }
}
