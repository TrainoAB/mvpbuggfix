import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
    try {
        const { paymentIntentId } = await request.json();
        console.log('Received paymentIntentId:', paymentIntentId);

        if (!paymentIntentId) {
            return new Response(JSON.stringify({ error: 'Payment Intent ID is required' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }

        const canceledPaymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
        console.log('Canceled payment intent:', canceledPaymentIntent);

        return new Response(JSON.stringify({ success: true, message: 'Payment intent canceled successfully' }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (err) {
        console.error('Error cancelling order: ', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}