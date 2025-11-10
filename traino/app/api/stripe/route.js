export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  DEBUG,
  handleChargeSucceeded,
  handleChargeUpdated,
  handleCheckoutSessionCompleted,
  handlePaymentIntentCreated,
  handlePaymentIntentSucceeded,
  handlePriceCreated,
  handlePriceDeleted,
  handlePriceUpdated,
  handleProductCreated,
  handleProductDeleted,
  handleProductUpdated,
  handleChargeRefunded,
  handleChargeRefundUpdated,
} from './stripeHandlers';

// Initalize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16',
});

// Event Handlers to ensure the correct event type from stripeHandlers.js
const eventHandlers = {
  'product.created': handleProductCreated,
  'product.updated': handleProductUpdated,
  'product.deleted': handleProductDeleted,
  'price.created': handlePriceCreated,
  'price.updated': handlePriceUpdated,
  'price.deleted': handlePriceDeleted,
  'checkout.session.completed': handleCheckoutSessionCompleted,
  'payment_intent.succeeded': handlePaymentIntentSucceeded,
  'payment_intent.created': handlePaymentIntentCreated,
  'charge.succeeded': handleChargeSucceeded,
  'charge.updated': handleChargeUpdated,
  'charge.refunded': handleChargeRefunded,
  'charge.refund.updated': handleChargeRefundUpdated,
};

// Event Processor class to ensure minimal bottlenecks when Stripe fires Webhook to us
// -------------------
// - Possible improvements:
// - Add a rate limiter to prevent abuse
// - Add a queue size limit to prevent memory leaks
// - Add a timeout to prevent long running events from blocking the queue
// - Add a mechanism to handle events that are not processed, in case of downtime
// - Circular Buffer would greatly improve performance
// -------------------
class QueueEvent {
  constructor(maxConcurrency = 10) {
    this.queue = [];
    this.isProcessing = false;
    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.activeEvents = 0;
    this.maxConcurrency = maxConcurrency;
    this.processedEvents = 0;
  }

  async addEvent(event, res) {
    this.queue.push({ event, res, retries: 0 });
    if (DEBUG) {
      console.log(`🔔 ${event.type} added to the queue. Queue size: ${this.queue.length}`);
    }
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const processNext = async () => {
      if (this.queue.length === 0 || this.activeEvents >= this.maxConcurrency) {
        if (this.activeEvents === 0) {
          this.isProcessing = false;
        }
        return;
      }

      const { event, res, retries } = this.queue.shift();
      this.activeEvents++;

      try {
        await this.processEvent(event, res, retries);
      } finally {
        this.activeEvents--;
        this.processedEvents++;
        processNext();
      }
    };

    const processingPromises = [];
    for (let i = 0; i < this.maxConcurrency; i++) {
      processingPromises.push(processNext());
    }

    await Promise.all(processingPromises);
  }

  async processEvent(event, res, retries) {
    try {
      const eventData = event.data.object;
      await eventHandlers[event.type](eventData);
      if (DEBUG) {
        console.log(`✅ Processed event: ${event.type}. Total processed: ${this.processedEvents + 1}`);
      }
      return NextResponse.json({ received: true }, { status: 200 });
    } catch (err) {
      console.error(`❌ Error processing event: ${event.type}`, err);
      if (retries < this.maxRetries) {
        setTimeout(() => {
          this.queue.push({ event, res, retries: retries + 1 });
          this.processQueue();
        }, this.retryDelay * Math.pow(2, retries));
        return NextResponse.json({ status: 'retrying' }, { status: 202 });
      } else {
        console.error(`❌ Max retries reached for event: ${event.type}`);
        return NextResponse.json({ error: `Max retries reached for event: ${event.type}` }, { status: 500 });
      }
    }
  }

  getActiveEventsCount() {
    return this.activeEvents;
  }

  getProcessedEventsCount() {
    return this.processedEvents;
  }
}

// Initialize the Queue System
const eventQueue = new QueueEvent(10);

// POST request to Stripe with required data and returns a response
export async function POST(req) {
  let event;

  try {
    // Format the request into raw body (Exported configs is deprecated in NextJS 14.2)
    const rawBody = await req.text();

    if (!rawBody || rawBody.length === 0) {
      console.error('❌ No webhook payload received');
      return NextResponse.json({ error: 'No webhook payload received' }, { status: 400 });
    }

    const sig = req.headers.get('stripe-signature');

    if (!sig) {
      console.error('❌ Missing Stripe signature header');
      return NextResponse.json({ error: 'Missing Stripe signature header' }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ Missing Stripe webhook secret environment variable');
      return NextResponse.json({ error: 'Missing Stripe webhook secret environment variable' }, { status: 400 });
    }

    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    DEBUG && console.log(`✅ Webhook received: ${event.type}`);

    if (eventHandlers[event.type]) {
      // Enqueue processing and immediately acknowledge to Stripe to avoid timeouts
      eventQueue.addEvent(event);
      return NextResponse.json({ received: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: `Unsupported event type: ${event.type}` }, { status: 400 });
    }
  } catch (err) {
    console.error(`❌ Webhook error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 500 });
  }
}
