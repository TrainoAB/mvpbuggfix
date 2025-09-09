export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { stripe } from '../connect';
import { DEBUG } from '../../../functions/functions';

export async function POST(request) {
  try {
    const requestBody = await request.json();
    DEBUG && console.log('Refund/Cancel request body:', requestBody);

    const {
      paymentIntentId,
      reason = 'requested_by_customer',
      metadata = {},
      // Optional booking details for time validation
      booked_date,
      starttime,
    } = requestBody;

    if (!paymentIntentId) {
      throw new Error('Payment intent ID is required');
    }

    DEBUG && console.log('Processing refund/cancel for payment intent:', paymentIntentId);

    // Validate 24-hour rule if booking details are provided
    if (booked_date && starttime) {
      const bookingDateTime = new Date(`${booked_date} ${starttime}`);
      const now = new Date();
      const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60); // Convert milliseconds to hours

      DEBUG && console.log('Booking date/time:', bookingDateTime);
      DEBUG && console.log('Hours until booking:', hoursUntilBooking);

      if (hoursUntilBooking <= 24) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Refund not allowed: Booking is within 24 hours',
            code: 'booking_too_soon',
            type: 'validation_error',
            hours_until_booking: hoursUntilBooking,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
    }

    // First, retrieve the payment intent to check its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    DEBUG && console.log('Payment intent status:', paymentIntent.status);

    // Additional validation: Only allow refunds for trainingpass and onlinetraining
    if (paymentIntent.metadata && paymentIntent.metadata.product_type) {
      const productType = paymentIntent.metadata.product_type;
      const refundableTypes = ['trainingpass', 'onlinetraining'];

      if (!refundableTypes.includes(productType)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Refund not allowed for product type: ${productType}`,
            code: 'product_not_refundable',
            type: 'validation_error',
            product_type: productType,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
    }

    let result = {};

    if (paymentIntent.status === 'requires_capture') {
      // For uncaptured payments (manual capture), cancel the payment intent
      DEBUG && console.log('Canceling uncaptured payment intent:', paymentIntentId);

      const canceledPaymentIntent = await stripe.paymentIntents.cancel(paymentIntentId, {
        cancellation_reason: reason,
      });

      result = {
        type: 'canceled',
        payment_intent_id: paymentIntentId,
        status: canceledPaymentIntent.status,
        amount: canceledPaymentIntent.amount / 100, // Convert from cents
        currency: canceledPaymentIntent.currency,
        canceled_at: canceledPaymentIntent.canceled_at,
      };
    } else if (paymentIntent.status === 'succeeded') {
      // For captured payments, create a refund
      DEBUG && console.log('Creating refund for captured payment intent:', paymentIntentId);

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: reason,
        metadata: {
          ...metadata,
          refund_reason: 'Account deletion - automatic refund',
        },
      });

      result = {
        type: 'refunded',
        payment_intent_id: paymentIntentId,
        refund_id: refund.id,
        status: refund.status,
        amount: refund.amount / 100, // Convert from cents
        currency: refund.currency,
        created: refund.created,
      };
    } else {
      // Handle other statuses
      DEBUG && console.log('Payment intent status not eligible for refund/cancel:', paymentIntent.status);

      result = {
        type: 'skipped',
        payment_intent_id: paymentIntentId,
        status: paymentIntent.status,
        reason: `Payment intent status: ${paymentIntent.status} - not eligible for refund or cancellation`,
        amount: paymentIntent.amount / 100,
      };
    }

    DEBUG && console.log('Refund/Cancel result:', result);

    return new Response(
      JSON.stringify({
        success: true,
        result: result,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (err) {
    console.error('API/Refund-Payment Error:', err);

    // Return detailed error information
    const errorResponse = {
      success: false,
      error: err.message,
      code: err.code || 'unknown_error',
      type: err.type || 'api_error',
    };

    DEBUG && console.log('Refund error response:', errorResponse);

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
