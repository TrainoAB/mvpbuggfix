export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { stripe } from '../connect';
import { getTrainerStripeId } from '../../../functions/gettrainerstripeid';
import { DEBUG } from '../../../functions/functions';

export async function POST(request) {
  try {
    const requestBody = await request.json();
    DEBUG && console.log('Request body', requestBody);
    const { priceId, metadata, currency, idempotencyKey } = requestBody;

    DEBUG && console.log('Request body', requestBody);

    const { product_id, trainer_id, product_type, user_id, category_link } = metadata;

    DEBUG &&
      console.log('Metadata:', {
        product_id,
        trainer_id,
        product_type,
        user_id,
        category_link,
      });

    const bodyData = { trainer_id };

    const response = await getTrainerStripeId(bodyData);

    const trainerStripeId = response;
    DEBUG && console.log('user_id inside checkout', user_id);
    DEBUG && console.log('trainerStripeId', trainerStripeId);
    DEBUG && console.log('product_id', product_id);
    // Retrieve the price ID for the given product ID
    /*  const priceId = await getPriceIdForProduct(product_id); */
    DEBUG && console.log('priceId', priceId);
    DEBUG;
    const priceDetails = await stripe.prices.retrieve(priceId);
    const amount = priceDetails.unit_amount; // Assuming the price is in the smallest currency unit (e.g., cents for USD)

    // Calculate 85/15 split for payout tracking
    const grossAmount = amount; // Full amount paid by customer
    const trainerAmount = Math.round(grossAmount * 0.85); // 85% to trainer
    const platformFee = Math.round(grossAmount * 0.15); // 15% to platform

    DEBUG && console.log('Payment split:', { grossAmount, trainerAmount, platformFee });
    console.log('product type', product_type);

    // TEMP: Force automatic capture to ensure funds move
    // TODO: Revisit manual capture flow with cron after session completion
    const captureMethod = 'automatic';
    DEBUG && console.log(`Product type: ${product_type}, Capture method forced to: ${captureMethod}`);

    // Create a Payment Intent - 100% of funds stay in Traino account
    // Trainer payout will be processed separately via Stripe Transfers API
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amount,
        currency: currency,
        capture_method: captureMethod, // Temporarily automatic
        metadata: {
          priceId: priceId,
          product_id: product_id,
          trainer_id: trainer_id,
          category_link: category_link,
          product_type: product_type,
          user_id: user_id,
          trainer_amount: trainerAmount.toString(),
          platform_fee: platformFee.toString(),
          trainer_stripe_id: trainerStripeId, // Store for later payout
        },
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    );

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (err) {
    console.error('API/Create-Payment-Intenet Error: ', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
/* 
async function getPriceIdForProduct(product_id) {
  DEBUG && console.log('Inside getPriceIdForProduct', product_id);

  const prices = await stripe.prices.list({
    product: product_id,
    active: true,
  });
  DEBUG && console.log('prices', prices);

  if (prices.data.length === 0) {
    DEBUG && console.log('No active prices found for the product');
    throw new Error('No active prices found for the product');
  }

  // Assuming you want the first price in the list
  DEBUG && console.log(' Prices.data[0].id', prices.data[0].id);

  return prices.data[0].id;
}
 */
