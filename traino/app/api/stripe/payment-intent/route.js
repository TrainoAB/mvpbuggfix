import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey, { apiVersion: '2020-08-27' });

// Named export for POST method
export async function POST(req) {
  try {
    const body = await req.json();
    const { amount, currency } = body;

    // Create a PaymentIntent with automatic payment methods
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // Amount in smallest unit of the currency (e.g., cents)
      currency,
      automatic_payment_methods: { enabled: true }, // Enables payment options available in the region
    });

    return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
