const { NextResponse } = require('next/server');

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

    // Start processing up to maxConcurrency events
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
        console.log(
          `✅ Processed event: ${event.type}. Total processed: ${this.processedEvents + 1}`,
        );
      }
      return { json: () => ({ received: true }), status: 200 };
    } catch (err) {
      console.error(`❌ Error processing event: ${event.type}`, err);
      if (retries < this.maxRetries) {
        setTimeout(() => {
          this.queue.push({ event, res, retries: retries + 1 });
          this.processQueue();
        }, this.retryDelay * Math.pow(2, retries)); // Exponential backoff
        return { json: () => ({ status: 'retrying' }), status: 202 };
      } else {
        console.error(`❌ Max retries reached for event: ${event.type}`);
        return {
          json: () => ({ error: `Max retries reached for event: ${event.type}` }),
          status: 500,
        };
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

// Simulate event handlers
const eventHandlers = {
  'product.created': async () => await new Promise((resolve) => setTimeout(resolve, 100)),
  'product.updated': async () => await new Promise((resolve) => setTimeout(resolve, 150)),
  'product.deleted': async () => await new Promise((resolve) => setTimeout(resolve, 120)),
  'price.created': async () => await new Promise((resolve) => setTimeout(resolve, 80)),
  'price.updated': async () => await new Promise((resolve) => setTimeout(resolve, 90)),
  'price.deleted': async () => await new Promise((resolve) => setTimeout(resolve, 70)),
  'checkout.session.completed': async () =>
    await new Promise((resolve) => setTimeout(resolve, 200)),
  'payment_intent.succeeded': async () => await new Promise((resolve) => setTimeout(resolve, 180)),
  'payment_intent.created': async () => await new Promise((resolve) => setTimeout(resolve, 130)),
  'charge.succeeded': async () => await new Promise((resolve) => setTimeout(resolve, 160)),
  'charge.updated': async () => await new Promise((resolve) => setTimeout(resolve, 140)),
};

function createMockEvent() {
  const eventTypes = Object.keys(eventHandlers);
  const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  return {
    type: randomType,
    data: {
      object: {
        id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      },
    },
  };
}

async function simulateWebhooks(numEvents, maxConcurrency) {
  const queue = new QueueEvent(maxConcurrency);
  const startTime = Date.now();

  for (let i = 0; i < numEvents; i++) {
    const mockEvent = createMockEvent();
    await queue.addEvent(mockEvent, {});
  }

  // Wait for all events to be processed or timeout after 120 seconds
  await new Promise((resolve, reject) => {
    const checkComplete = setInterval(() => {
      console.log(`Processed events: ${queue.getProcessedEventsCount()}/${numEvents}`);
      if (queue.getProcessedEventsCount() === numEvents) {
        clearInterval(checkComplete);
        clearTimeout(timeout);
        resolve();
      }
    }, 1000);

    const timeout = setTimeout(() => {
      clearInterval(checkComplete);
      reject(new Error('Simulation timed out after 200 seconds'));
    }, 200000);
  });

  const endTime = Date.now();
  const totalTime = (endTime - startTime) / 1000; // in seconds

  console.log(`Processed ${numEvents} events in ${totalTime} seconds`);
  console.log(`Average processing time: ${totalTime / numEvents} seconds per event`);
  console.log(`Events per second: ${numEvents / totalTime}`);
}

// Run the simulation
const numEvents = 1000;
const maxConcurrency = 10;
const DEBUG = true;

console.log(`Starting simulation with ${numEvents} events and concurrency of ${maxConcurrency}`);
simulateWebhooks(numEvents, maxConcurrency)
  .then(() => console.log('Simulation complete'))
  .catch(console.error);
