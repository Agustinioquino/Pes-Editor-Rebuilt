// ===================== Versión nueva y caché =====================
// Al abrir la página se anota la "huella" de los archivos del editor (ETag y fecha de cada uno, pidiéndolos con una
// marca única para que ni el navegador ni la red de GitHub devuelvan una copia vieja). Cada 3 minutos con la pestaña
// a la vista, y al volver a ella, se compara: si cambió, se publicó una versión nueva y aparece una barra para actualizar.
// Además se mira el último cambio de main en GitHub: apenas aparece uno nuevo se revisa cada 30 segundos hasta que
// GitHub Pages lo termina de publicar. La fecha más nueva de esos archivos es la "actualización" que se ve arriba.
// Antes de recargar se pregunta si guardar: en el juego o en el caché del navegador (y al volver, el trabajo sigue ahí).
// Abierto desde el .zip (file://) no hace nada.
const UPD = { on: /^https?:$/.test(location.protocol), base: null, when: 0, last: 0, busy: false, bar: false, sha: null, shaAt: 0, msg: '', fast: 0 };
// usuario/repositorio en GitHub, sacado de la dirección (usuario.github.io/Repositorio/)
UPD.repo = (() => { const h = location.hostname.match(/^([\w-]+)\.github\.io$/i), r = location.pathname.split('/').filter(Boolean)[0]; return h && r ? h[1] + '/' + r : null; })();
const updBust = f => f + (f.includes('?') ? '&' : '?') + '_=' + Date.now();
async function updPrint() {
  const hs = await Promise.all(APP_FILES.map(f => fetch(updBust(f), { method: 'HEAD', cache: 'no-store' }).then(r => r.ok ? r.headers : null).catch(() => null)));
  if (hs.some(h => !h)) return null; // sin conexión o un archivo que no está: mejor no decir nada
  let when = 0; const sig = hs.map(h => { const m = Date.parse(h.get('last-modified') || ''); if (m > when) when = m; return (h.get('etag') || '') + '|' + (h.get('last-modified') || '') + '|' + (h.get('content-length') || ''); }).join('\n');
  return { sig, when };
}
// el último cambio subido a main (la API pública de GitHub; si el navegador ya lo tiene, GitHub contesta "sin cambios")
async function updSha() {
  if (!UPD.repo) return null;
  try {
    const r = await fetch(`https://api.github.com/repos/${UPD.repo}/commits/main`, { cache: 'no-cache', headers: { Accept: 'application/vnd.github+json' } });
    if (!r.ok) return null; const j = await r.json();
    return { sha: j.sha, msg: ((j.commit && j.commit.message) || '').split('\n')[0].replace(/\s*\(#\d+\)\s*$/, '').trim() };
  } catch { return null; }
}
const updDate = (t, short) => { const d = new Date(t), en = LANG === 'en', mo = (en ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] : ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'])[d.getMonth()]; return d.getDate() + ' ' + mo + (short ? '' : ' ' + d.getFullYear()) + ' · ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
function updShowDate() {
  const el = document.getElementById('appDate'); if (!el || !UPD.when) return;
  el.textContent = (LANG === 'en' ? 'Upd. ' : 'Act. ') + updDate(UPD.when, true); el.title = LANG === 'en' ? 'Date of the editor version you are viewing' : 'Fecha de la versión del editor que estás viendo'; el.hidden = false; if (typeof uiCacheFill === 'function') uiCacheFill();
}
// now: revisar ya (al abrir, al volver a la pestaña); si no, solo cuando toca según el ritmo
async function updCheck(now) {
  if (!UPD.on || UPD.busy || UPD.bar || !navigator.onLine) return;
  if (!now && document.visibilityState === 'hidden') return;
  const t = Date.now(); UPD.busy = true;
  try {
    if (UPD.repo && t - UPD.shaAt >= 3 * 60000) {
      UPD.shaAt = t; const s = await updSha();
      if (s && s.sha) { if (!UPD.sha) UPD.sha = s.sha; else if (s.sha !== UPD.sha) { UPD.sha = s.sha; UPD.msg = s.msg; UPD.fast = t; } }
    }
    // hay un cambio nuevo en main que GitHub Pages todavía está publicando: mirar seguido un rato
    const every = UPD.fast && t - UPD.fast < 15 * 60000 ? 30000 : 3 * 60000;
    if (!now && UPD.base && t - UPD.last < every) return;
    UPD.last = t;
    const p = await updPrint(); if (!p) return;
    if (!UPD.base) { UPD.base = p.sig; UPD.when = p.when; updShowDate(); return; }
    if (p.sig !== UPD.base) { UPD.fast = 0; updBar(p.when); }
  } finally { UPD.busy = false; }
}
function updBar(when) {
  UPD.bar = true;
  const b = document.createElement('div'); b.className = 'updbar'; b.setAttribute('role', 'status');
  b.innerHTML = `<span class="updico" aria-hidden="true">⬆️</span><span class="updtxt"><b>Hay una versión nueva del editor</b>${when ? ` <span class="sub" data-noi18n>${LANG === 'en' ? 'from' : 'del'} ${updDate(when)}.</span>` : ''}<span class="updmsg" data-noi18n></span></span>
    <button class="btn small primary" type="button" id="updGo">Actualizar ahora</button><button class="btn small ghost" type="button" id="updLater">Más tarde</button>`;
  document.body.appendChild(b); requestAnimationFrame(() => b.classList.add('on'));
  // qué cambió: el título del último cambio de main (escrito en español en GitHub)
  const msg = m => { const el = b.querySelector('.updmsg'); if (el && m) { el.textContent = '«' + m + '»'; el.title = m; } };
  if (UPD.msg) msg(UPD.msg); else updSha().then(s => s && msg(s.msg));
  b.querySelector('#updGo').onclick = () => updReload();
  b.querySelector('#updLater').onclick = () => { b.classList.remove('on'); setTimeout(() => b.remove(), 250); setTimeout(() => { UPD.bar = false; }, 30 * 60000); };
}
const updUnsaved = () => !!(typeof S !== 'undefined' && S.f && pending());
// recarga pidiendo todo de nuevo a GitHub: la marca ?fresh= hace que el service worker no use ninguna copia guardada
function updGo() {
  UNLOAD_OK = true; // ya se preguntó qué hacer con los cambios: que el aviso de salida no frene la recarga
  const u = new URL(location.href); u.searchParams.set('fresh', Date.now().toString(36)); location.replace(u.href);
}
async function updReload() {
  if (!await sessAsk('upd')) return;
  try { const r = await navigator.serviceWorker?.getRegistration(); if (r) await r.update(); } catch { }
  updGo();
}
// ---- "Borrar caché" (en Apariencia) ----
async function cacheInfo() {
  const out = { imgs: 0, mb: 0 };
  try { if (window.caches) out.imgs = (await (await caches.open('pes-editor-img')).keys()).length; } catch { }
  try { const e = await navigator.storage?.estimate(); if (e) out.mb = e.usage / 1048576; } catch { }
  return out;
}
async function cacheClear() {
  if (updUnsaved()) { if (!await sessAsk('clear')) return; }
  else {
    if (!confirm(tr('Se borran los archivos guardados del editor y las fotos y escudos descargados, y la página se recarga con la última versión.') + '\n' + tr('Tus ajustes, tus valores y el EDIT no se tocan.'))) return;
    await sessSave();
  }
  try { if (window.caches) for (const k of await caches.keys()) await caches.delete(k); } catch { }
  try { for (const r of await navigator.serviceWorker?.getRegistrations() || []) await r.unregister(); } catch { }
  updGo();
}

// ===================== Tu trabajo en el caché del navegador =====================
// Antes de recargar (versión nueva o Borrar caché) se guarda en este navegador (IndexedDB) el EDIT tal como está:
// el archivo original, los datos con tus cambios, el historial de Deshacer y en qué pantalla estabas.
// Al volver a abrir el mismo EDIT se recupera solo y se borra del caché. Dura un día.
const SESS = { key: 'session', max: 24 * 3600000, snap: undefined };
function sessSnap() {
  if (typeof S === 'undefined' || !S.f) return null;
  let hist = S.hist, hp = S.hp, savedHp = S.savedHp, size = 0;
  for (const h of hist) for (const w of ['before', 'after']) for (const [, b] of h[w] || []) size += b.length;
  // un historial enorme (agregar muchos jugadores copia bloques grandes) no entra: se guardan los cambios sin Deshacer
  if (size > 160 * 1048576) { hist = []; hp = 0; savedHp = pending() ? -1 : 0; }
  return {
    v: 1, t: Date.now(), name: S.name, folder: !!S.editHandle, mtime: S.mtime || 0, orig: S.orig, data: S.d, desc: S.f.desc, serial: S.f.serial,
    hist, hp, savedHp, backedUp: S.backedUp,
    ui: { tab: S.tab, team: S.team, teamByTab: S.teamByTab, ttab: S.ttab, ptab: S.ptab, player: S.player, pSrc: S.pSrc, dbPlayer: S.dbPlayer, y: Math.round(window.scrollY) },
  };
}
// guarda y confirma que quedó escrito (idbSet no avisa si falla, por ejemplo sin espacio)
async function sessSave() {
  const s = sessSnap(); if (!s) return true;
  try {
    const db = await idb();
    await new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(s, SESS.key); tx.oncomplete = res; tx.onerror = tx.onabort = () => rej(tx.error || new Error('abort')); });
    return true;
  } catch { return false; }
}
async function sessPeek() {
  if (SESS.snap !== undefined) return SESS.snap;
  let s = null; try { s = await idbGet(SESS.key); } catch { }
  if (s && (s.v !== 1 || !s.orig || !s.data || Date.now() - s.t > SESS.max)) { sessDrop(); s = null; }
  return (SESS.snap = s || null);
}
function sessDrop() {
  SESS.snap = null;
  idb().then(db => db.transaction('kv', 'readwrite').objectStore('kv').delete(SESS.key)).catch(() => { });
}
// antes de recargar: si hay cambios sin guardar, preguntar qué hacer. Devuelve false si hay que cancelar.
async function sessAsk(why) {
  if (typeof S === 'undefined' || !S.f) return true;
  if (!pending()) { await sessSave(); return true; } // nada que preguntar: igual se guarda dónde estabas y el Deshacer
  const n = S.savedHp < 0 ? 0 : Math.abs(S.hp - S.savedHp), upd = why === 'upd', bye = why === 'close';
  setTimeout(() => { const c = document.querySelector('.sesscard'); if (c) c.focus(); }, 60);
  const k = await choiceBox({
    title: upd ? '⬆️ ' + tr('Actualizar el editor') : bye ? '🚪 ' + tr('Salir del editor') : why === 'reload' ? '🔄 ' + tr('Recargar el editor') : '🧹 ' + tr('Borrar caché y recargar'),
    html: `<p>${n ? tr(n === 1 ? 'Tenés 1 cambio sin guardar en el EDIT.' : `Tenés ${n} cambios sin guardar en el EDIT.`) : tr('Tenés cambios sin guardar en el EDIT.')} ${tr(bye ? '¿Querés guardarlos antes de salir?' : '¿Querés guardarlos antes de recargar la página?')}</p>
      <div class="sessopts"><button type="button" class="sesscard" data-k="cache"><b>🗂 ${tr(bye ? 'Guardar en el caché y salir' : 'Guardar en el caché y recargar')}</b><span>${tr(bye ? 'Quedan guardados en la app y vuelven solos la próxima vez que abras este EDIT (durante un día), con Deshacer incluido. El EDIT del juego no se toca.' : 'Quedan guardados en este navegador y al recargar vuelven solos, con Deshacer incluido. El EDIT del juego no se toca.')}</span></button>
      <button type="button" class="sesscard" data-k="game"><b>💾 ${tr(bye ? (S.dir ? 'Guardar en el juego y salir' : 'Guardar copia y salir') : S.dir ? 'Guardar en el juego y recargar' : 'Guardar copia y recargar')}</b><span>${tr(S.dir ? 'Se escriben en el EDIT del juego, como con el botón Guardar.' : 'Se descarga el EDIT con tus cambios, como con el botón Guardar.')}</span></button></div>`,
    options: [{ k: 'drop', label: tr(upd ? 'Actualizar sin guardar' : bye ? 'Salir sin guardar' : 'Recargar sin guardar'), cls: 'ghost' }, { k: 'no', label: tr('Cancelar') }],
  });
  if (k === 'no') return false;
  if (k === 'drop') { sessDrop(); return true; } // el cuadro ya lo dice: se pierden
  if (k === 'game') {
    await save(); if (pending()) return false; // no se guardó (error o lo cancelaste): no se recarga
    if (!S.dir) await new Promise(r => setTimeout(r, 1500)); // que la descarga arranque antes de recargar
  }
  toast(tr('Guardando tu trabajo en el caché…'), 8000);
  if (!await sessSave() && pending()) { toast(tr('No se pudo guardar en el caché del navegador (¿falta espacio?). No recargué para que no pierdas nada.'), 9000); return false; }
  return true;
}
// pone el EDIT como estaba al guardarlo en el caché. dataless: solo la pantalla (el juego cambió el EDIT y no había nada sin guardar)
function sessApply(s, dataless) {
  if (!dataless) {
    openBytes(s.orig, s.name);
    if (s.data.length !== S.d.length) return false;
    S.d.set(s.data); S.f.desc = s.desc; S.f.serial = s.serial;
    S.ix = PD.index(S.d, S.f.game); rebuildTeamOf(); natCache.clear();
    S.hist = s.hist || []; S.hp = s.hp || 0; S.savedHp = s.savedHp ?? S.hp; S.backedUp = !!s.backedUp;
    if (s.mtime) S.mtime = s.mtime;
  }
  const u = s.ui || {};
  if (['teams', 'nats', 'players', 'wepes', 'file', 'news', 'ideas'].includes(u.tab)) S.tab = u.tab;
  if (u.teamByTab) S.teamByTab = u.teamByTab;
  if (u.team != null && S.ix.teamById.has(u.team)) S.team = u.team;
  for (const k of ['ttab', 'ptab', 'pSrc', 'dbPlayer']) if (u[k] != null) S[k] = u[k];
  if (u.player != null && (S.ix.byId.has(u.player) || S.pSrc !== 'edit')) S.player = u.player;
  for (const [id, k] of [['tTeams', 'teams'], ['tNats', 'nats'], ['tPlayers', 'players'], ['tWepes', 'wepes'], ['tFile', 'file'], ['tNews', 'news'], ['tIdeas', 'ideas']]) { const b = $(id); if (b) b.setAttribute('aria-selected', String(k === S.tab)); }
  RATE_GEN++; updateTop(); render();
  if (u.y) setTimeout(() => window.scrollTo({ top: u.y }), 400);
  return true;
}
const sessMsg = s => { const n = s.savedHp < 0 ? 0 : Math.abs(s.hp - s.savedHp); return s.savedHp === s.hp ? tr('Volviste a donde estabas. Deshacer sigue funcionando.') : n ? tr(n === 1 ? 'Recuperé 1 cambio sin guardar del caché.' : `Recuperé ${n} cambios sin guardar del caché.`) : tr('Recuperé tus cambios sin guardar del caché.'); };
// al abrir la página: si el trabajo guardado era de un archivo abierto a mano (modo copia), se recupera directo
async function sessResume() {
  const s = await sessPeek(); if (!s || s.folder) return false;
  introShow(); introStep(tr('Recuperando tu trabajo guardado en el caché…'));
  try { S.dir = null; S.editHandle = null; if (!sessApply(s)) throw new Error(); }
  catch { sessDrop(); introStep(tr('No se pudo recuperar el trabajo del caché.'), 'err'); return false; }
  sessDrop(); introDone(sessMsg(s)); if (s.savedHp !== s.hp) toast(sessMsg(s) + ' ' + tr('Modo copia: tocá Guardar copia para descargarlos.'), 7000);
  return true;
}
// el EDIT que hay que abrir de la carpeta del juego: el mismo que estaba abierto antes de recargar
const sessWants = edits => { const s = SESS.snap; return s && s.folder ? edits.find(e => e.path + '\\EDIT00000000' === s.name) : null; };
// recién abierto un EDIT de la carpeta del juego: si es el del caché, se recupera
function sessAfterOpen(diskMtime) {
  const s = SESS.snap; if (!s || !s.folder || s.name !== S.name) return null;
  const changed = s.hp !== s.savedHp, gameWrote = diskMtime > s.mtime + 1000;
  let ok; try { ok = sessApply(s, gameWrote && !changed); } catch { ok = false; }
  sessDrop(); if (!ok) return null;
  const msg = gameWrote && !changed ? tr('El juego guardó el EDIT mientras tanto: abrí el del juego.') : sessMsg(s);
  // el aviso queda también cuando termina la introducción
  const after = f => { const w = () => (INTRO.el ? setTimeout(w, 500) : setTimeout(f, 600)); w(); };
  after(() => gameWrote && changed ? toast(tr('El juego modificó el EDIT y vos tenés cambios sin guardar.'), 9000, [tr('Recargar el del juego'), () => reloadFromGame()]) : toast(msg, 6000));
  return msg;
}

if (UPD.on) {
  // la marca ?fresh= ya cumplió (los archivos se pidieron de nuevo): se saca de la dirección
  if (/[?&]fresh=/.test(location.search)) addEventListener('load', () => setTimeout(() => { const u = new URL(location.href); u.searchParams.delete('fresh'); history.replaceState(history.state, '', u.pathname + u.search + u.hash); }, 3000));
  setTimeout(() => updCheck(true), 4000);
  setInterval(() => updCheck(), 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - UPD.last > 60000) updCheck(true); });
  addEventListener('focus', () => { if (Date.now() - UPD.last > 60000) updCheck(true); });
  addEventListener('online', () => updCheck(true));
}
