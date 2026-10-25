// Service worker de SimonCraft: permite jugar sin internet después de la primera carga.
const VERSION = 'simoncraft-v5';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'style.css',
  'data.js', 'world.js', 'app.js',
  'icon-32.png', 'icon-180.png', 'icon-192.png', 'icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Nunca guardar en caché las llamadas a Apps Script (ranking en vivo)
  if (url.hostname.endsWith('script.google.com') || url.hostname.endsWith('googleusercontent.com')) return;

  // Imágenes de Pokémon y fuentes: caché primero, red de respaldo
  if (url.hostname === 'raw.githubusercontent.com' || url.hostname.includes('fonts.')) {
    e.respondWith(
      caches.open(VERSION).then(async c => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        c.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // Archivos del juego: red primero (para recibir actualizaciones), caché si no hay internet
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match('index.html')))
    );
  }
});
