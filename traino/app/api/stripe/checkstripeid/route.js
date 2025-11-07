export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { DEBUG } from '../../secretcontext';
import { serverFetch } from '../../serverfetch';
import { apiAuth } from '../../apiauth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16',
});

export const POST = apiAuth(async (req, sessionId) => {
  try {
    const { email } = await req.json();
    DEBUG && console.log('✅ Route received email:', email);

    // 🔹 Hämta token från requestens Authorization-header
    const authHeader = req.headers.get('authorization');
    DEBUG && console.log('Auth header from request:', authHeader);

    // 🔹 1. Hämta stripe_id från din PHP-backend
    const dbResponse = await serverFetch('https://traino.nu/php/checkstripeid.php', {
      method: 'POST',
      headers: {
        Authorization: authHeader || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    DEBUG && console.log('✅ Response from PHP checkstripeid:', dbResponse);

    // 🔹 2. Kolla om stripe_id finns
    if (!dbResponse || !dbResponse.stripe_id) {
      DEBUG && console.log('⚠️ No stripe_id found for user');
      return NextResponse.json({ hasStripeAccount: false });
    }

    // 🔹 3. Validera om kontot fortfarande existerar i Stripe (valfritt)
    try {
      const account = await stripe.accounts.retrieve(dbResponse.stripe_id);
      DEBUG && console.log('✅ Stripe account status:', account.details_submitted ? 'Active' : 'Incomplete');
    } catch (stripeError) {
      DEBUG && console.log('⚠️ Stripe account not found or invalid:', stripeError.message);
      return NextResponse.json({ hasStripeAccount: false });
    }

    // 🔹 4. Returnera “inloggad” status
    return NextResponse.json({
      hasStripeAccount: true,
      stripe_id: dbResponse.stripe_id,
    });
  } catch (error) {
    console.error('❌ Stripe route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
