/*
 * Smomo service worker.
 * Strategy:
 *  - Navigations: network-first, fall back to cached page, then the /offline shell.
 *  - Static assets (Next build output, icons, fonts, images): stale-while-revalidate.
 *  - Everything else (API, Supabase, POST/auth): passes straight through to the network.
 * Bump CACHE_VERSION whenever the precache list or strategy changes.
 */
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `smomo-static-${CACHE_VERSION}`;
const PAGES_CACHE = `smomo-pages-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

// Minimal shell precached on install so the app can boot offline.
const PRECACHE_URLS = [OFFLINE_URL, '/icons/icon-192.png', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== PAGES_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Let the page trigger an immediate activation of a waiting worker.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/assets/') ||
    /\.(?:css|js|woff2?|ttf|otf|png|jpe?g|gif|svg|webp|avif|ico)$/.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only ever handle same-origin GETs. API/Supabase/analytics and any
  // non-GET (auth, mutations) go straight to the network, untouched.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // App-router navigations: network-first, cache the result, fall back offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(PAGES_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || (await caches.match(OFFLINE_URL)) || Response.error();
        }),
    );
    return;
  }

  // Static assets: serve from cache, refresh in the background.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response && response.status === 200) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});

// ── Web Push (wired for the future; no-op until a VAPID key + subscriptions exist) ──
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Smomo', body: event.data.text() };
  }
  const title = payload.title || 'Smomo';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      icon: payload.icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: payload.url || '/app' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/app';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(target) && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
