import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const DEBUG = process.env.DEBUG === 'true'; // Set to true for debugging

DEBUG && console.log('Stripe key loaded:', !!process.env.STRIPE_SECRET_KEY); // ✅ Confirm the key is loaded

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function getConnectAccountWithEmail(email) {
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const params = { limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;

    DEBUG && console.log(`Fetching accounts. starting_after: ${startingAfter || 'null'}`);
    const accounts = await stripe.accounts.list(params);
    DEBUG && console.log(`Fetched ${accounts.data.length} accounts`);

    for (const account of accounts.data) {
      DEBUG && console.log(`Checking account: ${account.email}`);
      if (account.email?.toLowerCase() === email.toLowerCase()) {
        console.log('✅ Match found!', account.id);
        return account.id;
      }
    }

    hasMore = accounts.has_more;
    if (hasMore && accounts.data.length > 0) {
      startingAfter = accounts.data[accounts.data.length - 1].id;
    } else {
      break;
    }
  }

  DEBUG && console.log('❌ No matching account found');
  return null;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { email } = body;

    DEBUG && console.log('Received request for email:', email);

    const accounts = await stripe.accounts.list({ limit: 100 });
    const emails = accounts.data.map((c) => c.email);
    DEBUG && console.log('Accounts emails:', emails);

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const customerId = await getConnectAccountWithEmail(email);

    if (customerId) {
      return NextResponse.json({ customerId });
    } else {
      return NextResponse.json({ error: 'No accounts found with the provided email' }, { status: 404 });
    }
  } catch (error) {
    console.error('❌ Error in POST /api/stripe/getstripeid', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
