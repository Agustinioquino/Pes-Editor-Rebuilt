// ===================== Ubicar: mover el nombre y los números a mano sobre la maqueta =====================
// La maqueta es el modelo 3D del kit visto de espalda, de frente y el short (k3Snapshot). k3UvMap dice qué punto de la
// textura cae en cada píxel; con eso se marca dónde quedó cada cosa (una caja con manijas) y se mide cuánto se corre en
// pantalla un paso de cada valor, así al arrastrar el nombre o el número sigue al mouse.
// Con KitPos el valor queda exacto (con decimales, en kitpos_slots.ini); sin KitPos, en los pasos enteros del config.txt.
const KPL = { sel: 'name', hover: null, drag: null, uv: {}, box: {}, mask: {} };
const KPL_EL = {
  name: { n: 'Nombre', side: 'back', col: '#ffd84a', move: ['NameY'], size: 'NameSize', wide: 'NameStretch', arc: 'NameShape' },
  num: { n: 'Dorsal', side: 'back', col: '#56d6ff', move: ['BackNumberY'], size: 'BackNumberSize', wide: 'BackNumberSpacing' },
  chest: { n: 'Pecho', side: 'front', col: '#7ef07a', move: ['ChestNumberX', 'ChestNumberY'], size: 'ChestNumberSize' },
  leg: { n: 'Short', side: 'shorts', col: '#ff8fd8', move: ['ShortsNumberX', 'ShortsNumberY'], size: 'ShortsNumberSize' },
};
const KPL_SIDES = { back: ['name', 'num'], front: ['chest'], shorts: ['leg'] };
const KPL_SIZE = { back: [380, 440], front: [260, 300], shorts: [260, 300] };
const KPL_MASK = 512;
// el elemento se dibuja en este kit (el pecho necesita ChestNumbersFile; el short, valores menores a 30)
function kplOn(el) {
  if (!KS.cfg) return false;
  if (el === 'name') return cfgGet(KS.cfg, 'Name') !== '1' && !!KS.sample.name;
  const kpHid = f => !!(KPS.cur && KPS.st && KPS.st.lua) && kpsVals()[f] === 0; // KitPos lo oculta con tamaño 0
  // ChestNumberSize 0 de kserv igual se ve (el más chico); lo que lo saca es no tener archivo de números o KitPos con tamaño 0
  if (el === 'chest') return !!(cfgGet(KS.cfg, 'ChestNumbersFile') || '').trim() && !!KS.sample.num && !kpHid('ChestNumberSize');
  if (el === 'leg') return ksN('ShortsNumberX') < 30 && ksN('ShortsNumberY') < 30 && !!KS.sample.num && !kpHid('ShortsNumberSize');
  return !!KS.sample.num;
}
const kplF = k => KS_KP[k] || k; // campo de KitPos (NameShape -> NameCurve)
const kplMax = k => (KPOS.FIELDS[kplF(k)] || {}).max ?? 29;
function kplModel(side) {
  if (side !== 'shorts') return KS.model;
  if (!KS.model) return null; const parts = KS.model.parts.filter(p => p.k === 'shorts' || p.k === 'socks'); if (!parts.length) return null;
  if (!KS.shortsModel || KS.shortsModel.src !== KS.model) KS.shortsModel = { parts, raw: true, src: KS.model }; return KS.shortsModel;
}
function kplUv(side, w, h) {
  const M = kplModel(side); if (!M) return null; const c = KPL.uv[side];
  if (c && c.M === M && c.w === w && c.h === h && c.k === KS.modelKey) return c.map;
  const map = k3UvMap(M, KS.cfg, side === 'shorts' ? 'front' : side, w, h); KPL.uv[side] = { M, w, h, k: KS.modelKey, map }; return map;
}
// dónde queda en la maqueta cada elemento: se dibuja solo en una textura chica y se busca con el mapa de coordenadas
function kplMask(el) {
  const S = KPL_MASK, c = kplMask.c || (kplMask.c = document.createElement('canvas')); c.width = S; c.height = S;
  const g = c.getContext('2d', { willReadFrequently: true }); g.clearRect(0, 0, S, S); ksDrawDecals(g, S, el, null);
  const d = g.getImageData(0, 0, S, S).data, a = new Uint8Array(S * S); for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3]; return a;
}
function kplFind(el, map) {
  if (!map || !kplOn(el)) return null; const a = kplMask(el), S = KPL_MASK, { w, h, uv } = map; if (!KS.pOver) KPL.mask[el] = a;
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0, sx = 0, sy = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 2, u = uv[o]; if (u < 0) continue; const tx = Math.min(S - 1, u * S | 0), ty = Math.min(S - 1, uv[o + 1] * S | 0);
    if (a[ty * S + tx] > 40) { n++; sx += x; sy += y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  // mx, my: centro de los píxeles (más fino que el de la caja para medir movimientos chicos)
  if (n < 3) return null; return { x0, y0, x1: x1 + 1, y1: y1 + 1, cx: (x0 + x1 + 1) / 2, cy: (y0 + y1 + 1) / 2, w: x1 + 1 - x0, h: y1 + 1 - y0, mx: sx / n + .5, my: sy / n + .5 };
}
// cuánto se mueve (y crece) en pantalla el elemento por cada paso del campo k: se prueba 2 pasos para cada lado
function kplGrad(el, k, map, api) {
  const s0 = ksP(k), at = v => { KS.pOver = { [k]: v }; try { return api.wrap(() => kplFind(el, map)); } finally { KS.pOver = null; } };
  const d = 2, a = at(s0 - d), b = at(s0 + d), c = KPL.box[el]; let p = a, q = b, n = 2 * d;
  if (!a || !b) { if (!c) return null; if (b) { p = c; n = d; } else if (a) { q = c; n = d; } else return null; }
  return { x: (q.mx - p.mx) / n, y: (q.my - p.my) / n, w: (q.w - p.w) / n, h: (q.h - p.h) / n };
}
// cambia un valor: con KitPos exacto (dentro del margen de KitPos); sin KitPos, al paso entero del config.txt
function kplPut(k, s, api) {
  if (ksKpOn()) { const [a, b] = KPOS.range(kplF(k)); ksKpSetSteps(k, Math.max(a, Math.min(b, s))); return true; }
  if (!api.cfg) return false;
  const v = ksClampKey(k, Math.max(0, Math.min(kplMax(k), Math.round(s)))); if (String(v) !== String(cfgGet(KS.cfg, k))) api.set(k, v); return true;
}
const kplStep = () => ksKpOn() ? .25 : 1;
// lleva el elemento a donde marca el arrastre (dx, dy en píxeles de la maqueta) desde los pasos s0, con lo que mide kplGrad
function kplSolve(G, s0, dx, dy, api) {
  if (G.length === 1) { const [k, g] = G[0], n2 = g.x * g.x + g.y * g.y; if (n2 > .01) kplPut(k, s0[k] + (dx * g.x + dy * g.y) / n2, api); return; }
  if (G.length !== 2) return; const [[k1, a], [k2, b]] = G, det = a.x * b.y - b.x * a.y;
  if (Math.abs(det) > .01) { kplPut(k1, s0[k1] + (dx * b.y - dy * b.x) / det, api); kplPut(k2, s0[k2] + (a.x * dy - a.y * dx) / det, api); }
  else for (const [k, g] of G) { const n2 = g.x * g.x + g.y * g.y; if (n2 > .01) kplPut(k, s0[k] + (dx * g.x + dy * g.y) / n2, api); }
}
const kplCan = (el, api) => !!(KPL_EL[el] && kplOn(el) && api && (ksKpOn() || api.cfg)) && (api.wrap = api.wrap || (fn => fn()), true);
const kplMap = side => { const [w, h] = KPL_SIZE[side]; return kplUv(side, w, h); };
// empuja un elemento (la maqueta y los atajos del 3D): up/down/left/right se mueve en pantalla, size/wide/arc cambia en pasos; n: cuántos pasos
function kplNudge(el, what, n = 1, api = KPL.api) {
  if (!kplCan(el, api)) return null; const E = KPL_EL[el];
  if (what === 'size' || what === 'arc' || what === 'wide') { const k = E[what]; if (!k) return null; kplPut(k, ksP(k) + kplStep() * n, api); return k; }
  const want = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[what], m = kplMap(E.side); if (!want) return null; let bestK = null, bestG = 0;
  for (const k of E.move) { const g = kplGrad(el, k, m, api); if (!g) continue; const d = g.x * want[0] + g.y * want[1]; if (Math.abs(d) > Math.abs(bestG)) { bestG = d; bestK = k; } }
  if (!bestK || Math.abs(bestG) < .05) return null; kplPut(bestK, ksP(bestK) + Math.sign(bestG) * kplStep() * Math.abs(n), api); return bestK;
}
// arrastre desde otro lado (el círculo de los atajos del 3D): devuelve (dx, dy) => mueve el elemento esos píxeles de la maqueta
function kplDragStart(el, api = KPL.api) {
  if (!kplCan(el, api)) return null; const E = KPL_EL[el], m = kplMap(E.side), s0 = {}; for (const k of E.move) s0[k] = ksP(k);
  const G = E.move.map(k => [k, kplGrad(el, k, m, api)]).filter(([, g]) => g); if (!G.length) return null;
  return (dx, dy) => kplSolve(G, s0, dx, dy, api);
}
function kplVal(k) { const s = ksP(k), F = KPOS.FIELDS[kplF(k)]; return tr(F ? F.n : k) + ' ' + (+s.toFixed(ksKpOn() ? 2 : 0)) + (s < -.01 || s > kplMax(k) + .01 ? ' (' + tr('fuera del rango del juego') + ')' : ''); }
function kplHtml(sides = ['back', 'front', 'shorts'], o = {}) {
  const fig = side => { const [w, h] = o.size || KPL_SIZE[side]; return `<figure class="kplfig kpl-${side}"><div class="kplw"><canvas class="kplbase" data-kpl="${side}" width="${w}" height="${h}"></canvas><canvas class="kplov" data-kplov="${side}" width="${w * 2}" height="${h * 2}" tabindex="0" aria-label="${tr((side === 'back' ? 'Espalda' : side === 'front' ? 'Frente' : 'Short') + ': arrastrá el nombre o un número para moverlo, las esquinas para el tamaño' + (side === 'back' ? ', los costados para el ancho y la manija de arriba para el arco' : '') + '. Flechas: mover; + y −: tamaño')}"></canvas></div><figcaption>${side === 'back' ? 'Espalda' : side === 'front' ? 'Frente' : 'Short y medias'}</figcaption></figure>`; };
  const els = sides.flatMap(s => KPL_SIDES[s]); if (!els.includes(KPL.sel)) KPL.sel = els[0];
  const chips = els.map(el => `<button type="button" data-kplsel="${el}" aria-pressed="${KPL.sel === el}" ${kplOn(el) ? '' : `disabled title="${el === 'chest' ? 'Este kit no lleva número en el pecho (ChestNumbersFile vacío)' : el === 'leg' ? 'Este kit no lleva número en el short' : 'No se muestra en este kit'}"`}><i style="background:${KPL_EL[el].col}"></i>${KPL_EL[el].n}</button>`).join('');
  const btn = (a, t, l) => `<button class="btn small" type="button" data-kpla="${a}" title="${t}">${l}</button>`;
  return `<div class="kplace ${sides.length > 1 ? 'multi' : 'solo'}" id="kplBox">
    <div class="kplbar"><div class="fchips kplpick">${chips}</div>
      <div class="kplnudge">${btn('up', 'Subir (flecha arriba)', '↑')}${btn('down', 'Bajar (flecha abajo)', '↓')}${btn('left', 'A la izquierda (flecha izquierda)', '←')}${btn('right', 'A la derecha (flecha derecha)', '→')}<span class="kplsep"></span>${btn('smaller', 'Más chico (−)', '−')}${btn('bigger', 'Más grande (+)', '＋')}<span class="kplsep"></span>${btn('arcm', 'Menos arco ([)', '◠−')}${btn('arcp', 'Más arco (])', '◠＋')}</div></div>
    <div class="kplpanels">${sides.length > 1 ? `${fig('back')}<div class="kplcol">${fig('front')}${fig('shorts')}</div>` : sides.map(fig).join('')}</div>
    <p class="note kplval" id="kplVal" aria-live="polite"></p>
    ${o.note === false ? '' : `<p class="note">Agarrá el nombre o un número y movelo. Las esquinas cambian el tamaño, los costados el ancho (en el dorsal, la separación) y la manija de arriba del nombre, el arco. También con el teclado: flechas para mover (Shift: más rápido), + y − para el tamaño, [ y ] para el arco, 1 a 4 para elegir. ${ksKpOn() ? 'Con KitPos queda el valor exacto.' : 'Sin KitPos se mueve de a un paso del config.txt.'}</p>`}
  </div>`;
}
// dibuja la maqueta y las cajas; con un arrastre en curso, solo el lado que se está moviendo
function kplPaint(root, api, only) {
  api = Object.assign({ wrap: fn => fn() }, api); const box = root.querySelector('#kplBox'); if (!box || !KS.cfg || !KS.model) return;
  for (const cv of box.querySelectorAll('canvas[data-kpl]')) {
    const side = cv.dataset.kpl; if (only && side !== only) continue;
    const M = kplModel(side), g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
    if (!M) { g.fillStyle = '#8888'; g.font = '13px sans-serif'; g.fillText('Sin modelo para mostrar.', 12, 24); continue; }
    const tex = api.wrap(() => ksDisplayTex()), snap = k3Snapshot(M, KS.cfg, tex, side === 'shorts' ? 'front' : side, cv.width, cv.height, ksMaps()); if (snap) g.drawImage(snap, 0, 0);
    const map = kplUv(side, cv.width, cv.height); for (const el of KPL_SIDES[side]) KPL.box[el] = api.wrap(() => kplFind(el, map));
    kplOverlay(box, side);
  }
  kplInfo(box, api);
}
function kplInfo(box, api) {
  const v = box.querySelector('#kplVal'), E = KPL_EL[KPL.sel]; if (!v || !E) return;
  const ks = [...E.move, E.size, E.wide, E.arc].filter(Boolean);
  v.innerHTML = `<b style="color:${E.col}">● ${tr(E.n)}</b> · ${kplOn(KPL.sel) ? (KPL.box[KPL.sel] ? '' : tr('oculto o fuera de la prenda') + ' · ') + ks.map(k => esc(kplVal(k))).join(' · ') : 'no se usa en este kit'}${!api.cfg && !ksKpOn() ? ' · <span class="warn">Instalá KitPos (abajo) para moverlo desde acá</span>' : ''}`;
  box.querySelectorAll('[data-kplsel]').forEach(b => b.setAttribute('aria-pressed', b.dataset.kplsel === KPL.sel));
  const arc = !!E.arc; box.querySelectorAll('[data-kpla="arcm"],[data-kpla="arcp"]').forEach(b => b.disabled = !arc);
  const two = E.move.length > 1; box.querySelectorAll('[data-kpla="left"],[data-kpla="right"]').forEach(b => b.disabled = !two);
}
// manijas del elemento elegido: esquinas = tamaño, costados = ancho, arriba = arco
function kplHandles(el, b) {
  const E = KPL_EL[el], p = 7, H = [];
  if (!b) return H; const x0 = b.x0 - p, y0 = b.y0 - p, x1 = b.x1 + p, y1 = b.y1 + p;
  for (const [x, y, c] of [[x0, y0, 'nwse-resize'], [x1, y0, 'nesw-resize'], [x0, y1, 'nesw-resize'], [x1, y1, 'nwse-resize']]) H.push({ mode: 'size', x, y, cur: c, shape: 'sq' });
  if (E.wide) { H.push({ mode: 'wide', x: x0, y: (y0 + y1) / 2, cur: 'ew-resize', shape: 'ci', dir: -1 }); H.push({ mode: 'wide', x: x1, y: (y0 + y1) / 2, cur: 'ew-resize', shape: 'ci', dir: 1 }); }
  if (E.arc) H.push({ mode: 'arc', x: (x0 + x1) / 2, y: y0 - 16, cur: 'ns-resize', shape: 'arc' });
  return H;
}
function kplOverlay(box, side) {
  const ov = box.querySelector(`canvas[data-kplov="${side}"]`); if (!ov) return; const g = ov.getContext('2d'); g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, ov.width, ov.height);
  const D = KPL.drag, W = ov.width / 2, Hh = ov.height / 2;
  for (const el of KPL_SIDES[side]) {
    const b = KPL.box[el], E = KPL_EL[el], sel = KPL.sel === el, hov = KPL.hover && KPL.hover.el === el; if (!b) continue;
    const out = [...E.move, E.size].some(k => { const s = ksP(k); return s < -.01 || s > kplMax(k) + .01; }), col = out ? '#ff6b5e' : E.col, p = 7;
    if (sel && D && D.el === el) { g.save(); g.strokeStyle = col + 'aa'; g.setLineDash([4, 5]); g.lineWidth = 1; g.beginPath(); g.moveTo(b.cx, 4); g.lineTo(b.cx, Hh - 4); if (D.mode === 'move') { g.moveTo(4, b.cy); g.lineTo(W - 4, b.cy); } g.stroke(); g.restore(); }
    g.save(); g.globalAlpha = sel || hov ? 1 : .8; g.lineWidth = sel ? 2 : 1.5; g.strokeStyle = col; if (!sel) g.setLineDash([5, 4]);
    if (sel || hov) { g.fillStyle = col + '1f'; g.fillRect(b.x0 - p, b.y0 - p, b.w + p * 2, b.h + p * 2); }
    g.strokeRect(b.x0 - p + .5, b.y0 - p + .5, b.w + p * 2 - 1, b.h + p * 2 - 1); g.restore();
    // etiqueta
    g.save(); g.font = '600 11px system-ui, sans-serif'; const t = tr(E.n) + (out ? ' · ' + tr('fuera de rango') : ''), tw = g.measureText(t).width + 12, ty = Math.max(0, b.y0 - p - 19), tx = Math.min(W - tw, Math.max(0, b.x0 - p));
    if (!(sel && E.arc)) { g.fillStyle = col; g.beginPath(); g.roundRect ? g.roundRect(tx, ty, tw, 17, 4) : g.rect(tx, ty, tw, 17); g.fill(); g.fillStyle = '#111'; g.fillText(t, tx + 6, ty + 12.5); }
    else { g.fillStyle = col; g.beginPath(); g.roundRect ? g.roundRect(tx, b.y1 + p + 3, tw, 17, 4) : g.rect(tx, b.y1 + p + 3, tw, 17); g.fill(); g.fillStyle = '#111'; g.fillText(t, tx + 6, b.y1 + p + 15.5); }
    g.restore();
    if (!sel) continue;
    for (const h of kplHandles(el, b)) {
      g.save(); g.fillStyle = '#fff'; g.strokeStyle = col; g.lineWidth = 2;
      if (h.shape === 'sq') { g.fillRect(h.x - 4, h.y - 4, 8, 8); g.strokeRect(h.x - 4, h.y - 4, 8, 8); }
      else if (h.shape === 'ci') { g.beginPath(); g.arc(h.x, h.y, 5, 0, Math.PI * 2); g.fill(); g.stroke(); }
      else { g.beginPath(); g.moveTo(h.x, h.y + 16); g.lineTo(h.x, h.y + 6); g.stroke(); g.beginPath(); g.arc(h.x, h.y, 7, 0, Math.PI * 2); g.fill(); g.stroke(); g.beginPath(); g.lineWidth = 1.6; g.arc(h.x, h.y + 5, 5, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      g.restore();
    }
  }
  // valor mientras se arrastra
  if (D && D.side === side && D.tip) { g.save(); g.font = '600 12px system-ui, sans-serif'; const tw = g.measureText(D.tip).width + 14, x = Math.min(W - tw - 2, Math.max(2, D.px + 14)), y = Math.min(Hh - 24, Math.max(2, D.py + 16));
    g.fillStyle = '#000c'; g.beginPath(); g.roundRect ? g.roundRect(x, y, tw, 21, 5) : g.rect(x, y, tw, 21); g.fill(); g.fillStyle = '#fff'; g.fillText(D.tip, x + 7, y + 14.5); g.restore(); }
}
function kplHit(side, x, y) {
  const sel = KPL.sel; if (KPL_SIDES[side].includes(sel)) for (const h of kplHandles(sel, KPL.box[sel])) if (Math.hypot(x - h.x, y - h.y) <= 9) return { el: sel, ...h };
  // primero lo que está dibujado justo bajo el puntero (el nombre y el dorsal pueden pisarse); si no, la caja
  const c = KPL.uv[side], map = c && c.map, S = KPL_MASK;
  if (map) for (const r of [0, 2, 4]) for (const [ox, oy] of r ? [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, -r], [r, -r], [-r, r]] : [[0, 0]]) {
    const px = Math.round(x + ox), py = Math.round(y + oy); if (px < 0 || py < 0 || px >= map.w || py >= map.h) continue; const o = (py * map.w + px) * 2, u = map.uv[o]; if (u < 0) continue;
    const t = Math.min(S - 1, map.uv[o + 1] * S | 0) * S + Math.min(S - 1, u * S | 0), on = KPL_SIDES[side].filter(el => KPL.box[el] && KPL.mask[el] && KPL.mask[el][t] > 40);
    if (on.length) return { el: on.includes(sel) ? sel : on[on.length - 1], mode: 'move', cur: 'grab' };
  }
  let best = null; for (const el of KPL_SIDES[side]) { const b = KPL.box[el]; if (!b) continue; const p = 9; if (x >= b.x0 - p && x <= b.x1 + p && y >= b.y0 - p && y <= b.y1 + p && (!best || el === sel || (best !== sel && b.w * b.h < KPL.box[best].w * KPL.box[best].h))) best = el; }
  return best ? { el: best, mode: 'move', cur: 'grab' } : null;
}
// api: { cfg (se puede tocar el config.txt), set(k, v), changed(), wrap(fn) (para dibujar con otra fuente o nombre) }
function kplBind(root, api) {
  const box = root.querySelector('#kplBox'); if (!box) return;
  api.wrap = api.wrap || (fn => fn()); KPL.api = api;
  const can = () => ksKpOn() || api.cfg;
  const map = side => { const cv = box.querySelector(`canvas[data-kpl="${side}"]`); return cv ? kplUv(side, cv.width, cv.height) : null; };
  const done = (side, tip) => { if (KPL.drag) KPL.drag.tip = tip; api.changed(side); };
  const select = el => { if (!el || KPL.sel === el) return; KPL.sel = el; for (const s of Object.keys(KPL_SIDES)) kplOverlay(box, s); kplInfo(box, api); };
  // empuja el elemento elegido: flechas en pantalla (fast: de a 4), o tamaño / arco / ancho en pasos (fast: cuántos)
  const nudge = (what, fast) => { const el = KPL.sel, n = typeof fast === 'number' ? fast : fast ? 4 : 1; if (kplNudge(el, what, n, api)) done(KPL_EL[el].side); };
  box.querySelectorAll('[data-kplsel]').forEach(b => b.onclick = () => select(b.dataset.kplsel));
  box.querySelectorAll('[data-kpla]').forEach(b => b.onclick = () => { const a = b.dataset.kpla; if (a === 'bigger' || a === 'smaller') { kplPut(KPL_EL[KPL.sel].size, ksP(KPL_EL[KPL.sel].size) + kplStep() * (a === 'bigger' ? 1 : -1), api); done(KPL_EL[KPL.sel].side); } else if (a === 'arcp' || a === 'arcm') { const k = KPL_EL[KPL.sel].arc; if (k) { kplPut(k, ksP(k) + kplStep() * (a === 'arcp' ? 1 : -1), api); done('back'); } } else nudge(a); });
  box.querySelectorAll('canvas[data-kplov]').forEach(ov => {
    const side = ov.dataset.kplov, pos = e => { const r = ov.getBoundingClientRect(); return [(e.clientX - r.left) * (ov.width / 2) / r.width, (e.clientY - r.top) * (ov.height / 2) / r.height]; };
    ov.onpointermove = e => {
      const [x, y] = pos(e), D = KPL.drag;
      if (!D) { const h = kplHit(side, x, y); const was = KPL.hover && KPL.hover.el; KPL.hover = h; ov.style.cursor = h ? (h.mode === 'move' ? 'grab' : h.cur) : ''; if ((h && h.el) !== was) kplOverlay(box, side); return; }
      D.px = x; D.py = y; const dx = x - D.x, dy = y - D.y, E = KPL_EL[D.el];
      if (D.mode === 'move') {
        kplSolve(D.g, D.s, dx, dy, api);
        done(side, E.move.map(kplVal).join(' · '));
      } else if (D.mode === 'size') {
        const r0 = Math.hypot(D.x - D.b.cx, D.y - D.b.cy) || 1, r = Math.hypot(x - D.b.cx, y - D.b.cy), want = D.b.h * r / r0, per = D.g && Math.abs(D.g.h) > .3 ? D.g.h : D.b.h / Math.max(1, D.s[E.size] || 10);
        kplPut(E.size, D.s[E.size] + (want - D.b.h) / per, api); done(side, kplVal(E.size));
      } else if (D.mode === 'wide') {
        // el nombre ancho se sale de la espalda y la caja deja de crecer: se toma al menos lo que da la cuenta del ancho
        const s0 = D.s[E.wide], est = D.el === 'name' ? D.b.w * .15 / (.75 + .15 * Math.max(0, s0)) : D.b.h * .012 * Math.max(1, (KS.sample.num || '10').length - 1);
        const want = D.b.w + 2 * dx * D.dir, per = Math.max(D.g ? D.g.w : 0, est, .5); kplPut(E.wide, s0 + (want - D.b.w) / per, api); done(side, kplVal(E.wide));
      } else if (D.mode === 'arc') {
        kplPut(E.arc, D.s[E.arc] - dy / 16, api); done(side, kplVal(E.arc));
      }
    };
    ov.onpointerdown = e => {
      if (e.button !== 0) return; ov.focus({ preventScroll: true }); const [x, y] = pos(e), h = kplHit(side, x, y); if (!h) return;
      select(h.el); if (!can()) { kplInfo(box, api); return; }
      const E = KPL_EL[h.el], m = map(side), b = KPL.box[h.el]; if (!b) return; e.preventDefault();
      const s = {}; for (const k of [...E.move, E.size, E.wide, E.arc].filter(Boolean)) s[k] = ksP(k);
      const D = KPL.drag = { el: h.el, side, mode: h.mode, dir: h.dir || 1, x, y, px: x, py: y, s, b: { ...b } };
      if (h.mode === 'move') D.g = E.move.map(k => [k, kplGrad(h.el, k, m, api)]).filter(([, g]) => g);
      else if (h.mode !== 'arc') D.g = kplGrad(h.el, h.mode === 'size' ? E.size : E.wide, m, api);
      ov.setPointerCapture(e.pointerId); ov.style.cursor = h.mode === 'move' ? 'grabbing' : h.cur; kplOverlay(box, side);
    };
    ov.onpointerup = ov.onpointercancel = () => { if (!KPL.drag) return; KPL.drag = null; ov.style.cursor = ''; api.changed(side, true); };
    ov.onpointerleave = () => { if (!KPL.drag && KPL.hover) { KPL.hover = null; kplOverlay(box, side); } };
    ov.onwheel = e => { const [x, y] = pos(e), h = kplHit(side, x, y); if (!h || !can()) return; e.preventDefault(); select(h.el); const k = KPL_EL[h.el].size; kplPut(k, ksP(k) + kplStep() * (e.deltaY < 0 ? 1 : -1), api); done(side); };
    ov.onkeydown = e => {
      const sideEls = KPL_SIDES[side]; if (/^[1-4]$/.test(e.key)) { const el = Object.keys(KPL_EL)[+e.key - 1]; if (sideEls.includes(el) || box.querySelector(`[data-kplsel="${el}"]`)) { select(el); e.preventDefault(); } return; }
      const map2 = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }; let a = map2[e.key];
      if (a) { e.preventDefault(); nudge(a, e.shiftKey); return; }
      if (e.key === '+' || e.key === '=') { e.preventDefault(); nudge('size', e.shiftKey ? 4 : 1); } else if (e.key === '-' || e.key === '_') { e.preventDefault(); nudge('size', e.shiftKey ? -4 : -1); }
      else if (e.key === ']') { e.preventDefault(); nudge('arc', 1); } else if (e.key === '[') { e.preventDefault(); nudge('arc', -1); }
    };
  });
}
