/* ABECO Uren — service worker (relatieve paden, werkt in een submap op GitHub Pages) */
const CACHE = 'abeco-uren-v53';
const CORE = [
  './',
  './index.html',
  './support.js',
  './manifest.json',
  './assets/abeco-logo.png',
  './assets/fonts/Poppins-Regular.ttf',
  './assets/fonts/Poppins-SemiBold.ttf',
  './assets/fonts/SpaceGrotesk-Medium.ttf',
  './assets/fonts/SpaceGrotesk-Bold.ttf',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon-180.png',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', (e) => {
  // NIET automatisch skipWaiting: de nieuwe versie wacht tot de gebruiker op "Verversen" tikt.
  // Eigen bestanden ALTIJD vers van de server halen (cache:'reload'), zodat we nooit een oude
  // versie uit het HTTP-cachegeheugen van de browser opslaan.
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(CORE.map((u) => {
        var req = (u.charAt(0) === '.') ? new Request(u, { cache: 'reload' }) : u;
        return c.add(req);
      })))
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        try {
          if (res && (res.ok || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
        } catch (_) {}
        return res;
      }).catch(() => {
        // offline fallback voor paginanavigatie
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'offline' });
      });
    })
  );
});
