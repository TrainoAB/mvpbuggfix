export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { DEBUG } from '../../secretcontext';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('API/stripe/onboarding: Missing required environment variable: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16',
});

export async function POST(request) {
  console.log('Running onboarding in LIVE mode!');
  try {
    const data = await request.json(); // Parse the request body as JSON
    console.log('Parsed data:', data);

    if (!data.email && !data.switch_account) {
      return NextResponse.json({ error: 'Missing required fields: email' }, { status: 400 });
    }

    let account;
    if (data.stripe_id !== null && typeof data.stripe_id === 'string' && data.stripe_id.trim() !== '') {
      console.log('Retrieving existing Stripe account:', data.stripe_id);
      account = await stripe.accounts.retrieve(data.stripe_id);
    } else {
      console.log('Creating new Stripe account for:', data.email || 'account switching');
      console.log('Trainer ID for metadata:', data.trainer_id);
      console.log('Switch account mode:', data.switch_account);

      const createAccountParams = {
        country: 'SE',
        type: 'express',
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          trainer_id: data.trainer_id ? data.trainer_id.toString() : 'undefined',
        },
      };

      // If this is account switching, add the switching_account flag to metadata
      if (data.switch_account === true) {
        createAccountParams.metadata.switching_account = 'true';
        console.log('=== ACCOUNT SWITCHING DETECTED ===');
        console.log('Adding switching_account metadata flag');
        console.log('User can now create new Stripe account or sign into existing one');
        console.log('Connection will be made via trainer_id:', data.trainer_id);
      }

      // Do NOT pre-fill email. This allows the user to choose to create a new Stripe account
      // or log in with any existing Stripe account, which is crucial for account switching.
      // The connection will be made via webhooks using the trainer_id in metadata.
      console.log('=== CREATING STRIPE ACCOUNT (NO EMAIL PRE-FILL) ===');
      console.log('Trainer ID for metadata:', data.trainer_id);
      console.log('Account creation params:', JSON.stringify(createAccountParams, null, 2));

      account = await stripe.accounts.create(createAccountParams);

      console.log('=== ACCOUNT CREATED SUCCESSFULLY ===');
      console.log('Account ID:', account.id);
      console.log('Account email:', account.email);
      console.log('Account metadata:', JSON.stringify(account.metadata, null, 2));
      console.log('Country:', account.country);
      console.log('Type:', account.type);
    }

    // Determine refresh and return URLs - always use production URL for live Stripe
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    // We need to get the trainer's alias to construct the proper return URL
    // For now, we'll use a generic payments URL that redirects to the correct trainer page
    const refreshUrl = `${baseUrl}/trainer/payments-redirect?cancelled=true`;
    const returnUrl = `${baseUrl}/trainer/payments-redirect?stripe_id=${account.id}`;

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    // REMOVED: Immediate Stripe ID saving
    // The Stripe ID will be set only after user completes onboarding and returns via redirect
    // This ensures proper flow: Stripe onboarding → redirect → payments-redirect → payments page
    console.log('Stripe account created but not saved to database yet - waiting for redirect completion');

    return NextResponse.json(
      {
        url: accountLink.url,
        accountId: account.id,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('Error processing Stripe request:', err);
    return NextResponse.json({ error: `Onboarding Error: ${err.message}` }, { status: 500 });
  }
}
