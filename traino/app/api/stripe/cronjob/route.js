export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { stripe } from '@/app/api/stripe/connect';

export async function GET() {
  fetch('https://traino.nu/php/aimedpayout.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /* 
  try {
    const paymentIntentId = 'din_payment_intent_id'; // Hämta PaymentIntent ID
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    console.log('Payment captured on future date:', paymentIntent);
  } catch (error) {
    console.error('Error capturing payment:', error);
  } 
    */
}
