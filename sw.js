const CACHE = 'snappdf-v2';

// Files to pre-cache for offline use
const PRECACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// CDN files to cache on first use
const CDN_HOSTS = [
  'cdn.tailwindcss.com',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isCDN = CDN_HOSTS.some(h => url.hostname.includes(h));

  if (isCDN) {
    // Stale-while-revalidate for CDN assets
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        const fetchPromise = fetch(e.request).then(res => {
          cache.put(e.request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Cache-first for local files
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
