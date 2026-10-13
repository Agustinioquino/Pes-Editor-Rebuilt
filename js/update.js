// ===================== Versión nueva y caché =====================
// Al abrir la página se anota la "huella" de los archivos del editor (ETag y fecha de cada uno, sin pasar por
// ninguna caché). Cada 10 minutos, y al volver a la pestaña, se compara: si cambió, se publicó una versión nueva
// y aparece una barra para actualizar. La fecha más nueva de esos archivos es la "actualización" que se ve arriba.
// Abierto desde el .zip (file://) no hace nada.
const UPD = { on: /^https?:$/.test(location.protocol), base: null, when: 0, last: 0, busy: false, bar: false };
async function updPrint() {
  const hs = await Promise.all(APP_FILES.map(f => fetch(f, { method: 'HEAD', cache: 'no-store' }).then(r => r.ok ? r.headers : null).catch(() => null)));
  if (hs.some(h => !h)) return null; // sin conexión o un archivo que no está: mejor no decir nada
  let when = 0; const sig = hs.map(h => { const m = Date.parse(h.get('last-modified') || ''); if (m > when) when = m; return (h.get('etag') || '') + '|' + (h.get('last-modified') || '') + '|' + (h.get('content-length') || ''); }).join('\n');
  return { sig, when };
}
const updDate = (t, short) => { const d = new Date(t), en = LANG === 'en', mo = (en ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] : ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'])[d.getMonth()]; return d.getDate() + ' ' + mo + (short ? '' : ' ' + d.getFullYear()) + ' · ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
function updShowDate() {
  const el = document.getElementById('appDate'); if (!el || !UPD.when) return;
  el.textContent = (LANG === 'en' ? 'Upd. ' : 'Act. ') + updDate(UPD.when, true); el.title = LANG === 'en' ? 'Date of the editor version you are viewing' : 'Fecha de la versión del editor que estás viendo'; el.hidden = false; if (typeof uiCacheFill === 'function') uiCacheFill();
}
async function updCheck() {
  if (!UPD.on || UPD.busy || UPD.bar || !navigator.onLine) return;
  UPD.busy = true; UPD.last = Date.now();
  try {
    const p = await updPrint(); if (!p) return;
    if (!UPD.base) { UPD.base = p.sig; UPD.when = p.when; updShowDate(); return; }
    if (p.sig !== UPD.base) updBar(p.when);
  } finally { UPD.busy = false; }
}
function updBar(when) {
  UPD.bar = true;
  const b = document.createElement('div'); b.className = 'updbar'; b.setAttribute('role', 'status');
  b.innerHTML = `<span class="updico" aria-hidden="true">⬆️</span><span><b>Hay una versión nueva del editor</b>${when ? ` <span class="sub" data-noi18n>${LANG === 'en' ? 'from' : 'del'} ${updDate(when)}.</span>` : ''}</span>
    <button class="btn small primary" type="button" id="updGo">Actualizar ahora</button><button class="btn small ghost" type="button" id="updLater">Más tarde</button>`;
  document.body.appendChild(b); requestAnimationFrame(() => b.classList.add('on'));
  b.querySelector('#updGo').onclick = () => updReload();
  b.querySelector('#updLater').onclick = () => { b.classList.remove('on'); setTimeout(() => b.remove(), 250); setTimeout(() => { UPD.bar = false; }, 30 * 60000); };
}
const updUnsaved = () => { const s = document.getElementById('bSave'); return !!(s && !s.disabled); };
async function updReload() {
  if (updUnsaved() && !confirm(tr('Tenés cambios sin guardar en el EDIT. Si actualizás ahora se pierden.') + '\n' + tr('¿Actualizar igual?'))) return;
  try { const r = await navigator.serviceWorker?.getRegistration(); if (r) await r.update(); } catch { }
  location.reload();
}
// ---- "Borrar caché" (en Apariencia) ----
async function cacheInfo() {
  const out = { imgs: 0, mb: 0 };
  try { if (window.caches) out.imgs = (await (await caches.open('pes-editor-img')).keys()).length; } catch { }
  try { const e = await navigator.storage?.estimate(); if (e) out.mb = e.usage / 1048576; } catch { }
  return out;
}
async function cacheClear() {
  const warn = updUnsaved() ? '\n\n' + tr('Ojo: tenés cambios sin guardar en el EDIT y se van a perder.') : '';
  if (!confirm(tr('Se borran los archivos guardados del editor y las fotos y escudos descargados, y la página se recarga con la última versión.') + '\n' + tr('Tus ajustes, tus valores y el EDIT no se tocan.') + warn)) return;
  try { if (window.caches) for (const k of await caches.keys()) await caches.delete(k); } catch { }
  try { for (const r of await navigator.serviceWorker?.getRegistrations() || []) await r.unregister(); } catch { }
  location.reload();
}
if (UPD.on) {
  setTimeout(updCheck, 4000);
  setInterval(updCheck, 10 * 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - UPD.last > 2 * 60000) updCheck(); });
  window.addEventListener('online', () => updCheck());
}
