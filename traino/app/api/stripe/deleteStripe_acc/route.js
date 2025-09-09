import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16',
});

export async function POST(request) {
  try {
    console.log('Deleting Stripe account...');
    const body = await request.json();

    const stripeId = body.stripeId;
    console.log('Stripe ID:', stripeId);

    // Check if accountId is provided
    if (!stripeId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // Delete the Stripe account
    await stripe.accounts.del(stripeId);

    return NextResponse.json({ success: true, message: 'Account deleted successfully' }, { status: 200 });
  } catch (err) {
    console.error('Error deleting account: ', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}