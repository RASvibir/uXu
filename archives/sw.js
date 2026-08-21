/* uXu landing PWA — icons/manifest only. HTML always from network. */
const CACHE = 'uxu-landing-v4';
const ASSETS = [
  './manifest.webmanifest',
  './icons/uxu-192.png',
  './icons/uxu-512.png',
  './icons/uxu-180.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isLandingNavigate(url) {
  if (/\/(CyberCat-Sunflower|Ledger|Starter|RTFM|seed-13|icons)\b/i.test(url.pathname)) return false;
  const leaf = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop() || '';
  return leaf === 'uXu' || leaf === 'index.html' || leaf === '';
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (/\/(CyberCat-Sunflower|Ledger|Starter|RTFM|seed-13)\//i.test(url.pathname)) return;

  // Never cache the console HTML — Quick Nav / docs must stay fresh
  if (req.mode === 'navigate' && isLandingNavigate(url)) {
    event.respondWith(fetch(req));
    return;
  }

  if (url.pathname.endsWith('/index.html') || url.pathname.endsWith('/uXu/') || /\/uXu$/.test(url.pathname.replace(/\/+$/, ''))) {
    event.respondWith(fetch(req));
    return;
  }

  if (ASSETS.some((p) => url.pathname.endsWith(p.replace('./', '/')))) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
    );
  }
});
