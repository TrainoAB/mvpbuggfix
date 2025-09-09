import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16',
});

const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

export async function POST(req) {
  DEBUG && console.log('API/Stripe/Gettrainerstripe_id_email Received method:', req.method);
  const body = await req.json();
  const email = body.email;

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Normalize email (trim and lowercase)
  const normalizedEmail = email.toLowerCase().trim();
  DEBUG && console.log('API/Stripe/Gettrainerstripe_id_email Original email:', email);
  DEBUG && console.log('API/Stripe/Gettrainerstripe_id_email Normalized email:', normalizedEmail);

  let hasMore = true;
  let startingAfter = null;
  let totalAccountsChecked = 0;

  try {
    while (hasMore) {
      const params = { limit: 100 };
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const accounts = await stripe.accounts.list(params);
      totalAccountsChecked += accounts.data.length;

      DEBUG && console.log(`Checking ${accounts.data.length} accounts (total checked: ${totalAccountsChecked})`);

      // Check for exact match first
      let foundAccount = accounts.data.find((account) => account.email === normalizedEmail);

      // If no exact match, try case-insensitive comparison
      if (!foundAccount) {
        foundAccount = accounts.data.find(
          (account) => account.email && account.email.toLowerCase().trim() === normalizedEmail,
        );
      }

      if (foundAccount) {
        DEBUG && console.log('Found matching account:', foundAccount.id, 'with email:', foundAccount.email);
        return NextResponse.json({ accountId: foundAccount.id }, { status: 200 });
      }

      hasMore = accounts.has_more;
      startingAfter = accounts.data.length ? accounts.data[accounts.data.length - 1].id : null;
    }

    DEBUG &&
      console.log(
        `API/Stripe/Gettrainerstripe_id_email Account not found after checking ${totalAccountsChecked} accounts`,
      );
    return NextResponse.json(
      {
        error: 'Account not found',
        details: `Searched ${totalAccountsChecked} Stripe accounts for email: ${normalizedEmail}`,
      },
      { status: 404 },
    );
  } catch (error) {
    DEBUG && console.log('API/Stripe/Gettrainerstripe_id_email Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
