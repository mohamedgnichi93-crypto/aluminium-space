const CACHE = 'alu-space-__SW_VERSION__';
const PRECACHE = ['/', '/manifest.json', '/logo-aluminium-space.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => { }))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (!url.protocol.startsWith('http')) return;

  // Network-first for Supabase API and dynamic routes
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/api')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request) ?? new Response('Offline', { status: 503 }))
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images, videos, fonts)
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|mp4|woff2?|ttf|ico)$/)) {
    e.respondWith(
      caches.match(e.request)
        .then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE).then(cache => {
              cache.put(e.request, responseToCache);
            });
            return response;
          });
        })
        .catch(() => new Response('Offline', { status: 503 }))
    );
    return;
  }

  // Network-first for HTML pages (always fresh)
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request) ?? caches.match('/'))
  );
});
