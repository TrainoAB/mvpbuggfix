import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: process.env.STRIPE_API_VERSION ?? '2024-06-20',
  appInfo: { name: 'Traino', version: '0.9.0' },
  maxNetworkRetries: 2,
  timeout: 10000,
});

// Browser-only loader for Stripe.js
let stripePromise;
export async function getStripe() {
  if (typeof window === 'undefined') return null;
  const { loadStripe } = await import('@stripe/stripe-js');
  stripePromise ??= loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  return stripePromise;
}
