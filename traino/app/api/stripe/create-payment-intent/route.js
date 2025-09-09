export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { stripe } from '../connect';
import { getTrainerStripeId } from '../../../functions/gettrainerstripeid';
import { DEBUG } from '../../../functions/functions';

export async function POST(request) {
  try {
    const requestBody = await request.json();
    DEBUG && console.log('Request body', requestBody);
    const { priceId, metadata, currency } = requestBody;

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
    const applicationFeeAmount = Math.round(amount * 0.15); // Calculate 15% application fee
    DEBUG && console.log('applicationFeeAmount', applicationFeeAmount);
    console.log('product type', product_type);

    // Determine capture method based on product type
    const shouldAutoCapture = product_type === 'dietprogram' || product_type === 'trainprogram';
    const captureMethod = shouldAutoCapture ? 'automatic' : 'manual';

    DEBUG && console.log(`Product type: ${product_type}, Capture method: ${captureMethod}`);

    // Create a Payment Intent with conditional capture method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      capture_method: captureMethod, // Automatic for diet/train programs, manual for others
      application_fee_amount: applicationFeeAmount, // Set the application fee amount
      transfer_data: {
        destination: trainerStripeId, // Use the fetched trainer's Stripe ID
      },
      metadata: {
        priceId: priceId, // Include it here for reference
        product_id: product_id,
        trainer_id: trainer_id,
        category_link: category_link,
        product_type: product_type,
        user_id: user_id,
      },
    });

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
