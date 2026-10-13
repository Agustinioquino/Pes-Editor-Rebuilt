// PES Editor: permite instalarlo como app y abrirlo sin internet.
// Archivos del editor: siempre pregunta a GitHub si hay una versión más nueva (sin usar la copia de 10 minutos
// del navegador); si no hay conexión, usa la última guardada.
// Fotos y escudos de internet: se guardan la primera vez y después salen de acá, al instante y también sin conexión.
importScripts('js/files.js');
const CACHE = 'pes-editor-v' + APP_VER, IMG = 'pes-editor-img', IMG_MAX = 6000;
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_FILES.map(f => new Request(f, { cache: 'no-cache' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== IMG).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
let trimAt = 0;
function imgTrim() { // no dejar que crezca sin límite: se borran las más viejas
  if (Date.now() - trimAt < 60000) return; trimAt = Date.now();
  caches.open(IMG).then(c => c.keys().then(ks => Promise.all(ks.slice(0, Math.max(0, ks.length - IMG_MAX)).map(k => c.delete(k)))));
}
function img(e) {
  const req = e.request;
  return caches.open(IMG).then(c => c.match(req).then(hit => {
    // una copia "opaca" (sin permiso de lectura) no sirve si la página necesita leer los píxeles
    if (hit && (hit.type !== 'opaque' || req.mode === 'no-cors')) return hit;
    return fetch(req).then(r => { if (r.ok || r.type === 'opaque') { c.put(req, r.clone()); imgTrim(); } return r; }).catch(() => hit || Response.error());
  }));
}
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || !/^https?:$/.test(u.protocol)) return;
  if (u.origin !== location.origin) { if (req.destination === 'image') e.respondWith(img(e)); return; }
  if (u.pathname.includes('/music/') || req.headers.has('range')) return;
  const nav = req.mode === 'navigate';
  e.respondWith(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin', redirect: nav ? 'manual' : 'follow' })
    .then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); } return r; })
    .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
});
// "Borrar caché" desde la página
self.addEventListener('message', e => { if (e.data === 'clear') e.waitUntil(caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k))))); });
