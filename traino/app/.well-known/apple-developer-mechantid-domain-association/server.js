// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });

const paymentMethodDomain = await stripe.paymentMethodDomains.create({
  domain_name: 'stage.traino.nu',
});
