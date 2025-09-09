import { precacheAndRoute } from 'workbox-precaching';
import { setCacheNameDetails } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Set up cache name details
setCacheNameDetails({
  prefix: 'next-js-app',
  suffix: 'v1',
});

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Set up background sync
const bgSyncPlugin = new BackgroundSyncPlugin('my-queue', {
  maxRetentionTime: 24 * 60, // 24 hours
});

// Set up network first strategy with background sync
registerRoute(
  ({ event }) => event.request.destination === 'document',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [bgSyncPlugin],
  }),
);

// Set up offline fallback
registerRoute(
  ({ event }) => event.request.destination === 'document',
  new NetworkFirst({
    cacheName: 'offline-fallback',
    plugins: [
      {
        async handle({ event, cache }) {
          const offlineFallback = await cache.match('offline.html');
          return offlineFallback || Response.error();
        },
      },
    ],
  }),
);

// Handle push notifications
self.addEventListener('push', (event) => {
  const notificationData = event.data.json();
  const title = notificationData.title;
  const body = notificationData.body;
  const icon = notificationData.icon;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      tag: 'next-js-app-notification',
    }),
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const url = notification.data.url;

  event.waitUntil(clients.openWindow(url));
});

// Handle service worker updates
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
