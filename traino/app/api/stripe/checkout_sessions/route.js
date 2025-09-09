export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { DEBUG, baseUrl } from '../../secretcontext';

import { stripe } from '../connect';
import { getTrainerStripeId } from '../../../functions/gettrainerstripeid';

export async function POST(request) {
  try {
    const requestBody = await request.json();
    const { customerEmail } = requestBody;
    DEBUG && console.log('Request body:', JSON.stringify(requestBody));

    const product_id = requestBody.product.id;
    const trainer_id = requestBody.product.trainer_id;
    DEBUG && console.log('product_id', product_id);
    DEBUG && console.log('trainer_id', trainer_id);

    // Get Stripe ID for trainer
    const bodyData = { trainer_id }; // Adjust as needed for `getTrainerStripeId`
    DEBUG && console.log('bodyData sent to getTrainerStripeId:', bodyData);
    const response = await getTrainerStripeId(bodyData);

    DEBUG && console.log('Response from stripe id', response);

    const trainerStripeId = response.stripeId?.replace(/[\r\n]/g, '').trim();
    DEBUG && console.log('trainerStripeId:', trainerStripeId);
    if (!trainerStripeId) throw new Error('trainerStripeId is invalid');

    async function getPriceIdForProduct(product_id) {
      const prices = await stripe.prices.list({ product: product_id, active: true });
      DEBUG && console.log('Prices list for product:', prices);

      if (!prices.data || prices.data.length === 0) {
        throw new Error('No active prices found for the product');
      }

      return prices.data[0].id;
    }

    const priceId = await getPriceIdForProduct(product_id);
    DEBUG && console.log('Retrieved priceId:', priceId);

    const priceDetails = await stripe.prices.retrieve(priceId);
    DEBUG && console.log('Price details:', priceDetails);

    const amount = priceDetails.unit_amount;
    const applicationFeeAmount = Math.round(amount * 0.15);
    DEBUG && console.log('Amount:', amount, 'Application Fee:', applicationFeeAmount);

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId, // Use the retrieved price ID
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success`,
      cancel_url: `${baseUrl}/checkout/canceled`,
      automatic_tax: { enabled: true },
      locale: 'sv',
      customer_email: customerEmail,
      payment_intent_data: {
        capture_method: 'manual', // Set capture method to manual to delay the transfer
        application_fee_amount: applicationFeeAmount, // Set the application fee amount
        metadata: { product_id, product: JSON.stringify(requestBody) },
        transfer_data: {
          destination: 'acct_1Q0Pr6PYX6nA2EAv', // Replace with the connected account ID
          // desitnation: trainerStripeId,
        },
      },
    });

    DEBUG && console.log('Session created:', session);

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    DEBUG && console.error('API/Stripe Checkout Session Error:', error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
