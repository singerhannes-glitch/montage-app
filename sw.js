// Offline-Cache der Montage-App. Bei jeder Aenderung an den Dateien VERSION hochzaehlen.
const VERSION = 'montage-v4';
const DATEIEN = [
  './', 'index.html', 'style.css', 'app.js', 'ai.js', 'store.js', 'i18n.js', 'ui-en.js',
  'export-pdf.js', 'export-xlsx.js', 'libs/jspdf.umd.min.js', 'libs/exceljs.min.js',
  'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Erst aus dem Cache (schnell, offline), im Hintergrund still aktualisieren, wenn Netz da ist.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const netz = fetch(req).then(res => {
        if (res && res.ok) { const kopie = res.clone(); caches.open(VERSION).then(c => c.put(req, kopie)); }
        return res;
      }).catch(() => hit);
      return hit || netz;
    })
  );
});
