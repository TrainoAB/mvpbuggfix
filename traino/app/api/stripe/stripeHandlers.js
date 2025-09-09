const DEBUG = process.env.DEBUG_LOGS;
const CONVERT_TO_SEK = 100;

// Global state object
let globalState = {
  sessionId: 'N/A',
  paymentIntentId: 'N/A',
  receiptUrl: 'N/A',
  status: 'N/A',
  chargeId: 'N/A',
  amountTotal: 0,
  customerEmail: 'N/A',
  trainerId: 'N/A',
  traineeId: 'N/A',
  productInfo: 'N/A',
};

async function updateGlobalStateFromSession(session) {
  console.log('Received session:', session);
  const { id, metadata } = session;
  if (!metadata) {
    console.error('Metadata is undefined in session:', session);
    return;
  }
  const { trainerId, traineeId, productInfo } = metadata;
  console.log('Extracted metadata:', { trainerId, traineeId, productInfo });

  globalState = {
    ...globalState,
    sessionId: id,
    trainerId: trainerId || globalState.trainerId,
    traineeId: traineeId || globalState.traineeId,
    productInfo: productInfo || globalState.productInfo,
  };

  console.log('Updated globalState:', globalState);
}

// Utility functions
const epochToDate = (epoch) => new Date(epoch * 1000).toISOString().slice(0, 19).replace('T', ' ');

// Database integration
async function sendToDatabase(data) {
  try {
    const response = await fetch('https://traino.nu/php/transactions.php?crud=create', {
      method: 'POST',
      headers: {
        Authorization: process.env.NEXT_PUBLIC_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`HTTP status: ${response.status}`);

    const result = await response.json();
    console.log('Database response:', result);
    return result;
  } catch (error) {
    console.error('Error sending data to database:', error);
    throw error;
  }
}

// Event handlers
export const handleProductCreated = (product) => console.log(`Product created: ${product.id}`);
export const handleProductUpdated = (product) => console.log(`Product updated: ${product.id}`);
export const handleProductDeleted = (product) => console.log(`Product deleted: ${product.id}`);
export const handlePriceCreated = (price) => console.log(`Price created: ${price.id}`);
export const handlePriceUpdated = (price) => console.log(`Price updated: ${price.id}`);
export const handlePriceDeleted = (price) => console.log(`Price deleted: ${price.id}`);

export async function handleCheckoutSessionCompleted(session) {
  const { id, payment_intent, status, amount_total, created } = session;

  // Update globalState with session details
  await updateGlobalStateFromSession(session);

  console.log(`Checkout session completed: ${id}`);
  console.log(`Payment Intent: ${payment_intent}`);
  console.log(`Payment Status: ${status}`);
  console.log(`Amount: ${amount_total / CONVERT_TO_SEK} KR`);
  console.log(`Created: ${epochToDate(created)}`);
}

export async function handlePaymentIntentSucceeded(paymentIntent) {
  const { id, status, created } = paymentIntent;
  globalState = { ...globalState, paymentIntentId: id, status };

  console.log(`Payment intent succeeded: ${id}`);
  console.log(`Payment Status: ${status}`);
  console.log(`Created: ${epochToDate(created)}`);
}

export const handlePaymentIntentCreated = (paymentIntent) => console.log(`Payment intent created: ${paymentIntent.id}`);

export const handleChargeUpdated = (charge) => console.log(`Charge updated: ${charge.id}`);

export async function handleChargeSucceeded(charge) {
  const { id, payment_intent, status, amount, receipt_url, created, billing_details } = charge;
  globalState = {
    ...globalState,
    chargeId: id,
    paymentIntentId: payment_intent,
    status,
    amountTotal: amount / CONVERT_TO_SEK,
    receiptUrl: receipt_url,
    customerEmail: billing_details.email,
  };

  await updateGlobalStateFromSession(charge);

  console.log(`Charge succeeded: ${id}`);
  console.log(`Payment Intent: ${payment_intent}`);
  console.log(`Payment Status: ${status}`);
  console.log(`Amount: ${amount} KR`);
  console.log(`Receipt URL: ${receipt_url}`);
  console.log(`Customer Email: ${billing_details.email}`);
  console.log(`Created: ${epochToDate(created)}`);

  await sendToDatabase(
    JSON.stringify({
      trainer_id: globalState.trainerId,
      trainee_id: globalState.traineeId,
      session_id: globalState.sessionId,
      charge_id: globalState.chargeId,
      payment_intent_id: globalState.paymentIntentId,
      status: globalState.status,
      price: globalState.amountTotal / CONVERT_TO_SEK,
      receipt_url: globalState.receiptUrl,
      email: globalState.customerEmail,
      productinfo: globalState.productInfo,
    }),
  );
}

export { DEBUG };
