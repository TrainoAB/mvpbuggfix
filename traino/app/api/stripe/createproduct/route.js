export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import { DEBUG } from '@/app/api/secretcontext';

import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const POST = async (req) => {
  DEBUG && console.log('API/Stripe/Create Product Received method:', req.method);

  try {
    const body = await req.json();
    DEBUG && console.log('API/Stripe/Create Product POST Received body:', JSON.stringify(body));

    if (!body) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    const { data, object } = body;

    const name = `${object.alias} ${object.id} ${object.product_type} ${object.category_link} ${object.duration}`;

    // Create the Stripe product
    const product = await stripe.products.create({
      id: data.id,
      name: name,
      description: object.description,
      metadata: {
        name: name,
        product_id: object.id,
        trainer_id: object.trainer_id,
        product_type: object.product_type,
        duration: object.duration,
        category_link: object.category_link,
      },
    });

    // Create the Stripe price
    const price = await stripe.prices.create({
      unit_amount: object.price * 100, // Stripe uses the smallest currency unit
      currency: 'sek',
      product: product.id,
    });

    const productId = product.id;
    const priceId = price.id;

    DEBUG && console.log('Success! productId:', productId, 'priceId:', priceId);

    if (!productId || !priceId) {
      return NextResponse.json({ message: `API/Create Product: Missing variables` }, { status: 400 });
    }

    return NextResponse.json({ message: `Product created`, productId: productId, priceId: priceId }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
};
