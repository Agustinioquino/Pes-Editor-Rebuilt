// PES Editor: permite instalarlo como app y abrirlo sin internet.
// Siempre intenta traer la versión más nueva; si no hay conexión, usa la última guardada.
const CACHE = 'pes-editor-v0.020';
const CORE = ['./', './index.html', './manifest.webmanifest', './css/editor.css', './js/pescrypt.js', './js/pesdata.js', './js/validate.js', './js/tables.js', './js/dds.js', './js/faces.js', './js/pitch.js', './js/extras.js', './js/matches.js', './js/natcall.js', './js/ftexenc.js', './js/kitfont.js', './js/kitmat.js', './js/kitstudio.js', './js/kitpack.js', './js/kit3d.js', './js/luadata.js', './js/siderdb.js', './js/intro.js', './js/news.js', './js/help.js', './js/app.js', './js/motion.js', './js/fonts.js', './js/logos.js', './js/mptags.js', './js/music.js', './js/mpyt.js', './js/sfxdata.js', './js/ticker.js', './js/gfx.js', './js/ui.js', './assets/pes6-fondo.jpg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-180.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok && !u.pathname.includes('/music/')) { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
