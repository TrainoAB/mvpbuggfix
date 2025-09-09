'use client';
import StripeElements from '@/app/components/Checkout/StripeElements';

export default function TestStripePayment() {
  async function onPaymentResult(result) {
    console.log('Payment result:', result);
    if (result.error) {
      // Handle payment error
      console.error(result.error.message);
      // Optionally, display the error to the user
      alert(`Payment failed: ${result.error.message}`);
    } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
      // Payment succeeded
      console.log('Payment succeeded:', result.paymentIntent);
      // Notify the user about the successful payment
      alert('Payment successful!');
    } else {
      // Handle other statuses (e.g., 'processing', 'requires_action', etc.)
      console.log('Payment status:', result.paymentIntent?.status || result.error?.message);
    }
  }

  const selectedProducts = {
    trainer_id: 175,
    user_id: 20168,
    user_email: 'fredrik@diam.se',
    user_alias: 'fredrikberglund',
    product_id: 41080,
    product_type: 'trainprogram',
    category_link: 'cs2',
    duration: 60,
    price: 1245,
    currency: 'sek',
  };

  return (
    <main>
      <StripeElements
        onPaymentResult={onPaymentResult}
        amount={selectedProducts.price}
        selectedProducts={selectedProducts}
      />
    </main>
  );
}
