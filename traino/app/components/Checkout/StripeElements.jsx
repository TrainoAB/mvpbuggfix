'use client';
import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';

import { loadStripe } from '@stripe/stripe-js';
import { DEBUG, baseUrl } from '../../functions/functions';
import Loader from '../Loader';

import './StripeElements.css';

// Load Stripe with your publishable key
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = loadStripe(publishableKey);

export default function StripeElements({ onCancel, onPaymentResult, selectedProducts, amount, setPaymentIntentId }) {
  const [clientSecret, setClientSecret] = useState('');
  const [modalLoading, setModalLoading] = useState(true);

  // Create a payment intent on the server
  useEffect(() => {
    DEBUG && console.log('Selected Products Stripe Elements:', selectedProducts);
    fetch(`${baseUrl}/api/stripe/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency: selectedProducts.currency,
        priceId: selectedProducts.priceId,
        customerEmail: selectedProducts.user_email,
        metadata: {
          priceId: selectedProducts.priceId,
          product_id: selectedProducts.product_id,
          trainer_id: selectedProducts.trainer_id,
          product_type: selectedProducts.product_type,
          user_id: selectedProducts.user_id,
          category_link: selectedProducts.category_link,
          name: selectedProducts.name,
        },
      }),
    })
      .then(async (response) => {
        // Check if the response status is not OK
        if (!response.ok) {
          let errorMessage;
          try {
            // Attempt to parse the error message from the response
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || 'Unknown error occurred';
          } catch (e) {
            // If response.json() fails, provide a generic error message
            errorMessage = `StripeElements - HTTP Error ${response.status}: ${response.statusText}`;
          }
          throw new Error(`StripeElements - Server Error: ${errorMessage}`);
        }

        // Parse JSON from the response if no errors
        return response.json();
      })
      .then((data) => {
        console.log('stripe elements data:', data);
        console.log('stripe elements clientsecret:', data.clientSecret);
        console.log('stripe elements paymentintentit:', data.paymentIntentId);

        // Ensure the expected fields exist in the response data
        if (!data.clientSecret || !data.paymentIntentId) {
          throw new Error('StripeElements - Invalid response data: Missing clientSecret or paymentIntentId');
        }

        // Set the necessary state
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      })
      .catch((error) => {
        // Catch both server-side and network errors
        if (error instanceof TypeError) {
          console.error('StripeElements - Network Error:', error.message);
        } else {
          console.error('StripeElements - Error fetching client secret:', error.message);
        }
      })
      .finally(() => {
        // Ensure modal loading is turned off
        setModalLoading(false);
      });
  }, [amount, selectedProducts]);

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
    locale: 'sv', // Localized to Swedish
  };

  // MARK: Markup
  return (
    <>
      <div className="stripe-modal">
        <div className="modal-content">
          {modalLoading ? (
            <div style={{ height: '100%', marginTop: '5rem' }}>
              <Loader />
            </div>
          ) : (
            <>
              <div className="logo"></div>
              {clientSecret && (
                <Elements stripe={stripePromise} options={options}>
                  <div>
                    <PaymentRequestButtonWrapper
                      amount={amount}
                      currency="sek"
                      onPaymentResult={onPaymentResult}
                      clientSecret={clientSecret}
                    />
                    <PaymentForm
                      clientSecret={clientSecret} // Pass clientSecret here
                      onPaymentResult={onPaymentResult}
                      onCancel={onCancel}
                    />
                  </div>
                </Elements>
              )}
            </>
          )}
        </div>
        <div className="darkoverlay" onClick={onCancel}></div>
      </div>
    </>
  );
}

function PaymentForm({ clientSecret, onPaymentResult, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(true);

  const handleReady = () => {
    setLoading(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements || !clientSecret) {
      setLoading(false);
      console.error('Missing Stripe.js or Elements or clientSecret');
      return;
    }

    // Confirm the payment intent
    const paymentResult = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${baseUrl}/checkout/success`,
      },
      redirect: 'if_required',
    });

    setLoading(false);

    if (paymentResult.error) {
      onPaymentResult({ success: false, message: paymentResult.error.message });
    } else if (paymentResult.paymentIntent?.status === 'succeeded') {
      onPaymentResult({ success: true, message: 'Payment successfully captured!' });
    } else if (paymentResult.paymentIntent?.status === 'requires_capture') {
      onPaymentResult({ success: true, message: 'Payment authorized, awaiting capture.' });
    } else if (paymentResult.paymentIntent?.status === 'canceled') {
      onPaymentResult({ success: false, message: 'Payment was canceled.' });
    } else {
      onPaymentResult({ success: false, message: 'Payment failed or awaiting payment method.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="scrolling">
        <PaymentElement onReady={handleReady} />
      </div>
      <div className="column2">
        <button className="button onlyborder" onClick={onCancel}>
          Cancel
        </button>
        {loading ? (
          <button className="button" disabled>
            Loading...
          </button>
        ) : (
          <button
            className="button"
            type="submit"
            disabled={!stripe || loading} // Disable until PaymentElement is loaded
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        )}
      </div>
    </form>
  );
}

function PaymentRequestButtonWrapper({ amount, currency, onPaymentResult, clientSecret }) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [paymentRequestEnabled, setPaymentRequestEnabled] = useState(false);

  useEffect(() => {
    if (!stripe) return;

    // Create a payment request object
    const pr = stripe.paymentRequest({
      country: 'SE', // Adjust to your region
      currency,
      total: {
        label: 'Total',
        amount, // Amount in the smallest unit (e.g., cents)
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Check if the payment request is available (e.g., Apple Pay, Google Pay)
    pr.canMakePayment().then((result) => {
      DEBUG && console.log('canMakePayment result:', result);
      if (result) {
        setPaymentRequest(pr);
        setPaymentRequestEnabled(true); // Enable the button if supported
      }
    });
  }, [stripe, amount, currency]);

  if (!paymentRequestEnabled) return null;

  // Handle payment result
  paymentRequest?.on('paymentmethod', async (event) => {
    event.preventDefault();
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: event.paymentMethod.id,
    });

    if (error) {
      event.complete('fail');
      onPaymentResult({ success: false, message: error.message });
    } else if (paymentIntent.status === 'succeeded') {
      event.complete('success');
      onPaymentResult({ success: true, message: 'Payment successful!' });
    } else {
      event.complete('fail');
      onPaymentResult({ success: false, message: 'Payment failed or canceled.' });
    }
  });

  // MARK: Apple pay and so on
  return (
    <PaymentRequestButtonElement
      options={{
        paymentRequest: paymentRequest,
        style: {
          paymentRequestButton: {
            type: 'default', // Default, book, buy, or donate
            theme: 'dark', // Light or light-outline
            height: '48px',
          },
        },
      }}
    />
  );
}
