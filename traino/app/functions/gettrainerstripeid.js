/* // MARK: Get Trainer Stripe ID
export async function getTrainerStripeId(bodyData) {
  // Returns Trainer Stripe ID
  const urlPath = `${baseUrl}/api/stripe/gettrainerstripe_id`;
  const data = await addData(urlPath, bodyData);
  const trainerStripeId = data.stripeId.replace(/[\r\n]+$/g, '').trim();
  DEBUG && console.log('Get Stripe ID:', trainerStripeId);
  return trainerStripeId;
}
 */

import { getTrainerID } from './fetchDataFunctions';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

export async function getTrainerStripeId(bodyData) {
  DEBUG && console.log('RUNNING getTrainerStripeId');

  try {
    // Define the endpoint URL
    const urlPath = `${baseUrl}/api/stripe/gettrainerstripe_id`;

    // Perform the fetch request
    const response = await getTrainerID(bodyData);

    // Check if the response is okay
    // if (!response.ok) {
    //   throw new Error(`Failed to fetch trainer Stripe ID: ${response.status} ${response.statusText}`);
    // }

    // Parse the JSON response
    const data = response;

    DEBUG && console.log('data from getTrainerStripdeId:', data);

    // Ensure stripeId exists in the response
    if (!data.stripeId) {
      throw new Error('Response does not contain a stripeId field');
    }

    // Clean up and return the Stripe ID
    const trainerStripeId = data.stripeId.replace(/[\r\n]+$/g, '').trim();

    DEBUG && console.log('Trainer id after trim:', trainerStripeId);

    DEBUG && console.log('Retrieved Trainer Stripe ID:', trainerStripeId);

    return trainerStripeId;
  } catch (error) {
    console.error('Error in get Trainer StripeId:', error.message);
    throw new Error('Unable to retrieve Trainer Stripe ID. ' + error.message);
  }
}
