'use client';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useEffect, useState, React } from 'react';
import { getCookie } from '@/app/functions/functions';
import { getUserDetails } from '../../functions/functions';
import { DEBUG } from '../../functions/functions';
import { useAppState } from '@/app/hooks/useAppState';
import { addBoughtProduct, addBooking } from '../../functions/fetchDataFunctions';

import { set } from 'date-fns';
import { stripePromise } from '../../api/stripe/connect';

import StripeElements from './StripeElements';
import CheckoutReceipt from './CheckoutReceipt';
import CheckoutButton from './CheckoutButton';
import Confirmation from '@/app/components/Confirmation';

import './CheckoutContainer.css';

export default function CheckoutContainer({
  onClose,
  type,
  selectedProducts,
  children,
  paymentDone,
  setPaymentDone,
  saveItem = null,
}) {
  const { baseUrl, sessionObject, userData, useTranslations, language } = useAppState(); // This should be inside the function
  const [loading, setLoading] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [onPayment, setOnPayment] = useState(false);

  const [user_email, setUserEmail] = useState('');
  const [user_id, setUser_id] = useState('');

  const [startPayment, setStartPayment] = useState(false);

  const [success, setSuccess] = useState(false);

  const [confirmationObject, setConfirmationObject] = useState([]);

  const [paymentIntentId, setPaymentIntentId] = useState(null);

  const { translate } = useTranslations('bookbuy', language);

  DEBUG && console.log('Selected Product');
  DEBUG && console.table(selectedProducts[0]);

  const newSelectedProducts = selectedProducts[0];

  // Helper function to extract user-friendly error message
  const extractErrorMessage = (error, userLanguage = 'en') => {
    console.log('Extracting error message from:', error, 'for language:', userLanguage);

    if (!error) {
      return userLanguage === 'sv' ? 'Okänt fel uppstod' : 'Unknown error occurred';
    }

    // The error message should already be properly parsed by fetchDataFunctions.js
    // But let's handle additional cases just in case
    if (error.message) {
      console.log('Using error.message:', error.message);
      return error.message;
    }

    // If error is a string, return it directly
    if (typeof error === 'string') {
      console.log('Using error string:', error);
      return error;
    }

    // Fallback
    console.log('No message found, using fallback');
    return userLanguage === 'sv' ? 'Okänt fel uppstod' : 'Unknown error occurred';
  };

  // Test function to validate error parsing (temporary for debugging)
  const testErrorParsing = () => {
    const testError = new Error(
      '{"en":"Time slot conflict detected. The requested time (06:00:00 - 06:15:00) overlaps with existing bookings: Existing booking: 06:00:00 - 06:15:00","sv":"Tidskonflikt upptäckt. Den begärda tiden (06:00:00 - 06:15:00) överlappar med befintliga bokningar: Existing booking: 06:00:00 - 06:15:00"}',
    );

    console.log('=== Testing Error Parsing ===');
    console.log('Test error:', testError);
    console.log('English result:', extractErrorMessage(testError, 'en'));
    console.log('Swedish result:', extractErrorMessage(testError, 'sv'));
    console.log('=== End Test ===');
  };

  // Test error parsing on component mount (remove this after testing)
  useEffect(() => {
    // Only run test in development and once
    if (DEBUG && typeof window !== 'undefined' && !window.errorParsingTested) {
      window.errorParsingTested = true;
      testErrorParsing();
    }
  }, []);

  const handlePaymentStart = async () => {
    setStartPayment(true);
    setOnPayment(true);

    try {
      const response = await fetch('http://localhost/create_mollie_payment.php', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Något gick fel vid betalning');
      }

      const checkoutUrl = await response.text();

      // Skicka vidare till Mollie checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      alert(error.message);
    }
  };

  if (type === 'success') {
    // When redirected from stripe. Set storedProduct to the one saved during payment
    const storedProduct = JSON.parse(sessionStorage.getItem('product_under_payment'));
    selectedProducts = storedProduct;
    DEBUG && console.log('storedProduct and selectedProducts', storedProduct, selectedProducts);

    // logic to use booking data after booking is done
  }

  useEffect(() => {
    const calculateCost = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/stripe/calculate_costs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedProducts }),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        DEBUG && console.log('Cost', data);
        setTotalCost(data.totalCost);
      } catch (error) {
        console.error('Failed to calculate cost:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateCost();
  }, [selectedProducts]);

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const userId = getCookie('user_id');
        DEBUG && console.log('User ID:', userId);
        if (!userId) {
          throw new Error('User ID not found in cookis');
        }
        setUser_id(userId); // Set the userId state variable
        DEBUG && console.log('User ID inside fetchUserEmail:', userId);
        const userDetails = await getUserDetails(userId);
        setUserEmail(userDetails.email);

        DEBUG && console.log('User email:', userDetails.email);
      } catch (err) {
        console.error('Error fetching user email: ', err);
        setError('Failed to fetch user email');
      }
    };
    fetchUserEmail();
  }, [sessionObject, baseUrl]);

  /*
  const CheckoutForm = (event) => {
    DEBUG && console.log('CheckoutForm entered');
    DEBUG && console.log('user_id', user_id);

    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (event) => {
      event.preventDefault();

      if (!stripe || !elements) {
        return;
      }

      const cardElement = elements.getElement(CardElement);
      DEBUG && console.log('cardElement', cardElement);
      DEBUG && console.log('trainerId', selectedProducts[0].trainer_id);
      DEBUG && console.log('selectedProducts', selectedProducts);
      DEBUG && console.log('user_id', user_id);
      DEBUG && console.log('userEmail', userEmail);
      const response = await fetch('/api/stripe/create-s', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user_id, // Use the user_id prop
          totalCost: totalCost,
          product_id: selectedProducts[0].id,
          //product_id: "8193", <--- Detta är ett produkt id som kan användas för att testa
          trainer_id: selectedProducts[0].trainer_id,
          // trainer_id: "175", <--- Detta är ett trainer id som kan användas för att testa
          productType: selectedProducts[0].product_type,
          //productType: "trainingpass" <--- Detta är en produkttyp som kan användas för att testa,
          currency: 'sek',
        }),
      });

      const { clientSecret } = await response.json();

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        if (result.paymentIntent.status === 'requires_capture' || result.paymentIntent.status === 'succeeded') {
          setSuccess(true);
        }
      }
    };

    return (
      <>
        <form onSubmit={handleSubmit}>
          <CardElement />
          <button type="submit" disabled={!stripe}>
            Book Session
          </button>

          {error && <div>{error}</div>}
          {success && <div>Payment authorized! Your session is booked.</div>}
        </form>
      </>
    );
  };
*/

  // MARK: On Payment Result
  async function onPaymentResult(result) {
    DEBUG && console.log('Payment result:', result);
    DEBUG && console.log('saveItem:', saveItem);
    if (result.success) {
      // Payment successful
      if (
        selectedProducts[0].product_type === 'onlinetraining' ||
        selectedProducts[0].product_type === 'trainingpass'
      ) {
        // MARK: Save Booking
        if (saveItem === null) {
          alert('Error');
          return;
        }

        setConfirmationObject({
          text: translate('book_thebookinghasbeensavedsuccessfully', language),
          title: translate('book_bookdone', language),
          onCloseText: translate('done', language),
        });

        const saveBooking = async () => {
          setLoading(true);

          try {
            console.log('=== SAVE BOOKING START ===');
            console.log('User Agent:', navigator.userAgent);
            console.log(
              'Is Mobile:',
              /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            );
            console.log('SaveItem before modification:', JSON.stringify(saveItem, null, 2));
            console.log('PaymentIntentId:', paymentIntentId);
            console.log('Booking start time:', saveItem.booking.start);
            console.log('Booking end time:', saveItem.booking.end);

            saveItem.booking.payment_intent_id = paymentIntentId;

            console.log('SaveItem after adding payment IDs:', JSON.stringify(saveItem, null, 2));

            /* saveItem console log example 
            {
              "user_id": "2010045",
              "booking": {
                "start": "2025-01-14T11:30:00.000Z",
                "end": "2025-01-14T12:00:00.000Z",
                "price": "1000",
                "pass_amount": 1,
                "pass_set_id": 46,
                "trainer_id": 2010056,
                "pass_repeat_id": "677cff146c4085.35538747e92b15f87483e",
                "category_id": 2,
                "category_name": "Counter-Strike 2",
                "category_link": "cs2",
                "duration": 30,
                "isbooked": false,
                "product_type": "trainingpass",
                "payment_intent_id": "pi_3QQuXeB6BhcrxipT1K7oX4YA",
              }
            } */

            console.log('Calling addBooking with data...');
            const data = await addBooking(saveItem);
            console.log('AddBooking response received:', JSON.stringify(data, null, 2));

            if (data && data.success) {
              console.log('Booking saved successfully!');
              setSuccess(true);
              setOnPayment(false);
            } else {
              console.error('Booking failed - no success in response:', data);
              throw new Error(`Booking failed: ${data?.message || 'Unknown error'}`);
            }

            // alert(translate('book_thebookinghasbeensavedsuccessfully', language));
          } catch (error) {
            console.error('=== SAVE BOOKING ERROR ===');
            console.error('Error type:', typeof error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Full error object:', error);

            // Try to get more details from the error
            if (error.response) {
              console.error('Error response:', error.response);
            }
            if (error.cause) {
              console.error('Error cause:', error.cause);
            }

            // Log the raw error message for debugging
            console.log('Raw error for parsing:', JSON.stringify(error));
            console.log('Raw error message for parsing:', JSON.stringify(error.message));
            console.log('Current language:', language);

            // Extract user-friendly error message using helper function
            const errorMessage = extractErrorMessage(error, language);
            console.log('Final extracted error message:', errorMessage);

            const errorPrefix = language === 'sv' ? 'Bokningsfel' : 'Booking error';
            alert(`${errorPrefix}: ${errorMessage}`);

            // Close payment modal on error
            setOnPayment(false);
            setStartPayment(false);
          } finally {
            console.log('=== SAVE BOOKING END ===');
            setLoading(false);
          }
        };
        saveBooking();
      } else {
        // If product is clipcard or program

        setConfirmationObject({
          text: 'Du kan nu gå vidare. Du hittar din produkt i din profil.',
          title: 'Köpet gick igenom',
          onCloseText: 'Klar',
        });

        const newItem = {
          product: selectedProducts[0].product_type,
          price: selectedProducts[0].price,
          buyer_id: selectedProducts[0].user_id,
          buyer_email: selectedProducts[0].user_email,
          total: selectedProducts[0].total,
          item: {
            id: selectedProducts[0].product_id,
            user_id: selectedProducts[0].trainer_id,
            product_type: selectedProducts[0].product_type,
            product_id_link: selectedProducts[0].product_id_link ? selectedProducts[0].product_id_link : null,
          },
          user_id: selectedProducts[0].user_id,
          clipcard_amount: selectedProducts[0].clipcard_amount ? selectedProducts[0].clipcard_amount : null,
        };

        DEBUG && console.log('Send data:', newItem);

        const buyProduct = async () => {
          try {
            const data = await addBoughtProduct(newItem);

            if (data.success) {
              DEBUG && console.log(data);
              setSuccess(true);
              setOnPayment(false);
            }
          } catch (error) {
            console.error('Buy error:', error);
            alert(translate('unexpectederror', language));
          } finally {
            setLoading(false);
          }
        };

        buyProduct();
      }
    } else {
      // Handle payment error
      console.error(result.message);
      // Optionally, display the error to the user
      alert(`Payment failed: ${result.message}`);
    }
  }

  const handleCloseConfirmation = () => {
    setSuccess(false);
    setPaymentDone(true);
  };

  const handleCloseStripeElements = () => {
    setOnPayment(false);
    setStartPayment(false);
    onClose(false);
    setPaymentDone(true);
  };

  const handleClose = () => {
    onClose(false);
    if (selectedProducts[0].product_type !== 'clipcard') {
      setPaymentDone(true);
    }
  };

  // MARK: Markup
  return (
    <>
      {/* Stripe Payment Success */}
      {success && (
        <Confirmation
          onClose={handleCloseConfirmation}
          onCloseText={confirmationObject.onCloseText}
          title={confirmationObject.title}
          text={confirmationObject.text}
        />
      )}

      {/* Stripe Elements Payment Modal */}
      {/* {onPayment && !success && (
        <StripeElements
          onCancel={handleCloseStripeElements}
          onPaymentResult={onPaymentResult}
          amount={totalCost}
          selectedProducts={newSelectedProducts}
          setPaymentIntentId={setPaymentIntentId}
        />
      )} */}

      {!startPayment && (
        <>
          <main id="checkout">
            <div id="checkout-container">
              <div className="categorytop">
                <div></div>
                <h1>Checkout</h1>
                <div></div>
              </div>
              <div className="content">
                {type === 'checkout' ? (
                  <>
                    <CheckoutReceipt selectedProducts={selectedProducts} totalCost={totalCost} />

                    {/*  ??? Don't know what this is for 
                <hr />
                <Elements stripe={stripePromise}>
                  <CheckoutForm userEmail={userEmail} user_id={user_id} />
                </Elements>
                <hr />  */}
                    <div className="buttons">
                      <button className="button onlyborder" onClick={handleClose}>
                        Cancel
                      </button>
                      {!loading ? (
                        <>
                          <button className="button" onClick={handlePaymentStart} disabled={loading}>
                            Pay
                          </button>
                          {/* 
                    <CheckoutButton
                      onStartPayment={handlePaymentStart}
                      selectedProducts={selectedProducts}
                      totalCost={totalCost}
                  />
                  
                  */}
                        </>
                      ) : (
                        <div className="button">Loading...</div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <CheckoutReceipt selectedProducts={selectedProducts} totalCost={totalCost} />
                    <hr />
                  </>
                )}
                {children}
              </div>
            </div>
            <div className="darkoverlay" onClick={handleClose}></div>
          </main>
        </>
      )}
    </>
  );
}
