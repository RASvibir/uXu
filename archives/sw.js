/* uXu landing PWA — network-first shell so Quick Nav / flair updates show up. */
const CACHE = 'uxu-landing-v3';
const LANDING = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/uxu-192.png',
  './icons/uxu-512.png',
  './icons/uxu-180.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(LANDING)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isLandingRequest(url) {
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const leaf = path.split('/').filter(Boolean).pop() || '';
  if (leaf === 'uXu' || leaf === 'index.html' || leaf === '') {
    if (/\/(CyberCat-Sunflower|RTFM|seed-13|icons)\b/i.test(url.pathname)) return false;
    return true;
  }
  return false;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (/\/(CyberCat-Sunflower|RTFM|seed-13)\//i.test(url.pathname)) return;

  // Navigate: network first, fall back to cache (was cache-first — hid nav updates)
  if (req.mode === 'navigate' && isLandingRequest(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (LANDING.some((p) => url.pathname.endsWith(p.replace('./', '/')))) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
});
