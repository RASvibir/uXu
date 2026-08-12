/* uXu landing PWA — caches 0?0 shell only; archive subfolders stay network. */
const CACHE = 'uxu-landing-v1';
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
  // Only handle the Pages site root shell — not CyberCat or other archives.
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const base = path.endsWith('/uXu') ? path : path;
  // Match /uXu, /uXu/, /uXu/index.html (and local equivalents)
  const leaf = base.split('/').filter(Boolean).pop() || '';
  if (leaf === 'uXu' || leaf === 'index.html' || leaf === '') {
    // Exclude known archive subpaths
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

  // Never hijack nested archive navigations/assets
  if (/\/(CyberCat-Sunflower|RTFM|seed-13)\//i.test(url.pathname)) return;

  if (req.mode === 'navigate' && isLandingRequest(url)) {
    event.respondWith(
      caches.match('./index.html').then((hit) => hit || fetch(req))
    );
    return;
  }

  if (LANDING.some((p) => url.pathname.endsWith(p.replace('./', '/')))) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
    );
  }
});
