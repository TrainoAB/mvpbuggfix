export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { addBoughtProduct } from '@/app/functions/fetchDataFunctions.js';

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export async function POST(req) {
  const sig = req.headers.get('stripe-signature');
  const getSessionObject = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/getsessiontoken`;
      console.log('Layout - ', url);
      const response = await fetch(url);
      const contentType = response.headers.get('Content-Type');

      console.log(`Response Status: ${response.status}`);
      console.log(`Content-Type: ${contentType}`);

      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error(`Error Stripe Webhook - fetching session object: ${response.status} - ${response.statusText}`);
      }

      const sessionObject = await response.json();
      return sessionObject;
    } catch (error) {
      console.error('API/Stripe/Webhook/getSessionObject:', error.message);
      throw new Error('API/Stripe/Webhook/getSessionObject: Failed to fetch session object');
    }
  };

  let event;
  const sessionObject = await getSessionObject();
  try {
    const rawBody = await req.text();
    console.log('Raw body:', rawBody);
    console.log('Signature:', sig);

    if (!sig) {
      throw new Error('No stripe-signature header value was provided.');
    }

    event = stripeInstance.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('Successfully verified event:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Log all events for debugging
  console.log('=== WEBHOOK EVENT RECEIVED ===');
  console.log('Event type:', event.type);
  console.log('Event ID:', event.id);
  console.log('Event object type:', event.data.object?.object);
  console.log('Event object ID:', event.data.object?.id);
  if (event.data.object?.metadata) {
    console.log('Event object metadata:', JSON.stringify(event.data.object.metadata, null, 2));
  }

  // Handle the event
  switch (event.type) {
    case 'account.created':
      console.log('Webhook: Account created entered');
      const createdAccount = event.data.object;
      if (account.charges_enabled) {
        console.log('Onboarding complete for account:', createdAccount.id);
        console.log('account email:', createdAccount.email);

        fetch('https://traino.nu/php/updatestripeid.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stripe_id: createdAccount.id,
            email: createdAccount.email,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then((data) => {
            console.log('User account status updated successfully:', data);
          })
          .catch((error) => {
            console.error('Error updating user account status:', error);
          });
      } else {
        console.log('Onboarding still incomplete for account:', account.id);
      }
      // Handle account creation logic here, such as saving the account details to your database
      break;

    case 'account.updated':
      console.log('Webhook: Account updated entered');

      const updatedAccount = event.data.object;
      console.log('Account updated:', updatedAccount);

      if (
        updatedAccount.details_submitted === true ||
        (updatedAccount.charges_enabled === true && updatedAccount.details_submitted === true)
      ) {
        // Is true after last step of stripe account set-up or when charges are enabled
        console.log('Stripe account setup completed, updating database...');
        console.log('Account details_submitted:', updatedAccount.details_submitted);
        console.log('Account charges_enabled:', updatedAccount.charges_enabled);
        console.log('Account metadata:', updatedAccount.metadata);

        // === ENHANCED DEBUGGING FOR ACCOUNT SWITCHING ===
        console.log('=== WEBHOOK ACCOUNT UPDATE DEBUG ===');
        console.log('Account ID:', updatedAccount.id);
        console.log('Account email:', updatedAccount.email);
        console.log('Account metadata full object:', JSON.stringify(updatedAccount.metadata, null, 2));
        console.log('Metadata trainer_id:', updatedAccount.metadata?.trainer_id);
        console.log('Metadata switching_account:', updatedAccount.metadata?.switching_account);
        console.log('Details submitted:', updatedAccount.details_submitted);
        console.log('Charges enabled:', updatedAccount.charges_enabled);

        // Check if this is account switching (has trainer_id and switching_account flag)
        const isAccountSwitching =
          updatedAccount.metadata &&
          updatedAccount.metadata.trainer_id &&
          updatedAccount.metadata.trainer_id !== 'undefined' &&
          updatedAccount.metadata.switching_account === 'true';

        // Check if we have trainer_id available (regardless of switching_account flag)
        const hasTrainerId =
          updatedAccount.metadata &&
          updatedAccount.metadata.trainer_id &&
          updatedAccount.metadata.trainer_id !== 'undefined';

        console.log('Is account switching detected:', isAccountSwitching);
        console.log('Has trainer_id in metadata:', hasTrainerId);

        let updatePromise;

        if (hasTrainerId) {
          console.log('Updating by trainer_id (preferred method):', updatedAccount.metadata.trainer_id);
          const updateData = {
            stripe_id: updatedAccount.id,
            trainer_id: updatedAccount.metadata.trainer_id,
          };
          console.log(
            'Making request to updatestripeidbytrainerid.php with data:',
            JSON.stringify(updateData, null, 2),
          );

          // Always use trainer_id when available (more reliable than email)
          updatePromise = fetch('https://traino.nu/php/updatestripeidbytrainerid.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          });
        } else {
          console.log('Fallback: Regular account update - updating by email');
          // Fallback to email only when trainer_id is not available
          updatePromise = fetch('https://traino.nu/php/updatestripeid.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              stripe_id: updatedAccount.id,
              email: updatedAccount.email,
            }),
          });
        }

        updatePromise
          .then((response) => {
            console.log('Update response status:', response.status);
            console.log('Update response ok:', response.ok);
            return response.json();
          })
          .then((data) => {
            console.log('Stripe ID update response data:', JSON.stringify(data, null, 2));
            if (isAccountSwitching) {
              console.log('✅ Account switching update completed successfully');
            }

            // Also update the stripe_account status to 1 if we have trainer_id
            if (hasTrainerId) {
              console.log('Using trainer_id from metadata for status update:', updatedAccount.metadata.trainer_id);
              return fetch('https://traino.nu/php/changeuserstripestatus.php', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  trainer_id: updatedAccount.metadata.trainer_id,
                }),
              });
            } else {
              console.log('No valid trainer_id in metadata, trying to find user by email');
              // Fallback: try to find user by email and update stripe_account status
              return fetch('https://traino.nu/php/updatestripeaccountbyemail.php', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: updatedAccount.email,
                }),
              }).catch((error) => {
                console.log('Email fallback failed:', error.message);
                return Promise.resolve({ json: () => ({ warning: 'Email fallback failed' }) });
              });
            }
          })
          .then((response) => response.json())
          .then((data) => console.log('Stripe account status updated:', data))
          .catch((error) => console.error('Error updating Stripe status:', error));
      }
      break;

    case 'account.deleted':
      const deletedAccount = event.data.object;
      console.log('Account deleted:', deletedAccount.id);
      console.log('account email:', deletedAccount.email);

      fetch('https://traino.nu/php/removestripeid.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: deletedAccount.email,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then((data) => {
          console.log('Stripe ID removed successfully:', data);
        })
        .catch((error) => {
          console.error('Error removing Stripe ID:', error);
        });
      break;

    case 'capability.updated':
      const accountUpdated = event.data.object;
      fetch('https://traino.nu/php/changeuserstripestatus.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainer_id: accountUpdated.trainer_id,
        }),
      })
        .then((response) => response.json())
        .then((data) => console.log(data))
        .catch((error) => console.error('Error:', error));
      break;

    case 'payment_intent.payment_failed':
      const paymentIntentFailed = event.data.object;
      console.log('Payment failed for payment intent:', paymentIntentFailed.id);
      // Add your logic to handle failed payment here
      break;

    case 'charge.succeeded':
      const chargeSucceeded = event.data.object;
      console.log('Charge Succeeded:', chargeSucceeded);
      const paymentMethodId = chargeSucceeded.payment_method;
      const paymentMethod = await stripeInstance.paymentMethods.retrieve(paymentMethodId);
      console.log('Payment Method: ', paymentMethod);
      console.log('Session object that we trust:', sessionObject.token);
      console.log('Charge Succeeded:', chargeSucceeded.metadata);
      console.log('Customer email', chargeSucceeded.customer_email);
      // Handle successful charge logic here
      try {
        const response = await fetch(`https://traino.nu/api/proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: 'https://traino.nu/api/uploadpurchase',
            method: 'POST',
            headers: {
              Authorization: `Bearer ${sessionObject.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              trainee_id: chargeSucceeded.metadata.user_id, // Assuming user_id is stored in metadata
              booking: {
                product_type: chargeSucceeded.metadata.productType, // Assuming product_type is stored in metadata
                product_id: chargeSucceeded.metadata.product_id, // Assuming product_id is stored in metadata
                trainer_id: chargeSucceeded.metadata.trainer_id, // Assuming trainer_id is stored in metadata
                // pass_set_id: "", // Assuming pass_set_id is stored in metadata
                // pass_repeat_id: "", // Assuming pass_repeat_id is stored in metadata
                // start: "", // Assuming start is stored in metadata
                // end: "", // Assuming end is stored in metadata
                // rrule: "", // Assuming rrule is stored in metadata as a JSON string
              },
              payment_intent_id: chargeSucceeded.payment_intent, // Correctly capturing the Payment Intent ID
              payment_method: paymentMethod.type,
            }),
          }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log('Booking saved successfully:', data);
      } catch (error) {
        console.error('Error saving booking:', error);
      }
      break;

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;

      console.log('Payment Intent Succeeded:', paymentIntent);

      // Retrieve the payment intent ID and other relevant information
      const paymentIntentId = paymentIntent.id;

      // Update your database to mark the payment as completed
      // Example: Update the payment status in your transactions table
      try {
        const response = await fetch(`https://traino.nu/api/proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: 'https://traino.nu/api/updatePaymentStatus_completed',
            method: 'POST',
            headers: {
              Authorization: `Bearer ${sessionObject.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              payment_intent_id: paymentIntentId,
            }),
          }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
        console.log('Payment status updated successfully:', responseData);
      } catch (error) {
        console.error('Error updating payment status:', error);
      }

      break;

    case 'checkout.session.completed':
      // Add your logic to handle completed checkout session here
      try {
        const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: 'https://traino.nu/php/addtransaction.php',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: session.metadata.user_id, // Assuming user_id is stored in metadata
              booking: {
                product_type: session.metadata.product_type, // Assuming product_type is stored in metadata
                product_id: session.metadata.product_id, // Assuming product_id is stored in metadata
                trainer_id: session.metadata.trainer_id, // Assuming trainer_id is stored in metadata
              },
              stripe_order_id: session.id, // Adding stripe_order_id from session.id
            }),
          }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log('Booking saved successfully:', data);
      } catch (error) {
        console.error('Error saving booking:', error);
      }
      break;

    case 'charge.succeeded':
      console.log('Charge succeeded for charge:', event.data.object.id);
      const product = JSON.parse(event.data.object.metadata.product);

      const newItem = {
        product: product.product.product,
        price: product.product.price,
        item: product.product, // Här finns all info om köpta produkten
        buyer_id: product.customerId,
        buyer_email: product.customerEmail,
      };
      console.log('newItem:', newItem);

      try {
        const data = await addBoughtProduct(newItem);
        DEBUG && console.log('Bought product:', data);
        if (data.productfound) {
          alert(data.productfound);
        }
        // TODO: Make a better done message
        if (data.success) {
          alert('Product bought successfully');
        }
      } catch (error) {
        console.error('Error saving booking:', error);
      }

      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
