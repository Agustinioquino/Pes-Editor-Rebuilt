// ===================== Vista precisa: la espalda del kit en plano, a la resolución de la textura =====================
// La espalda es un rectángulo de la textura (UVR.back) guardado girado 180°. Acá se muestra derecha y sin el 3D en el medio:
// cada punto de la pantalla es un punto de la textura, así que mover el nombre o el dorsal es una cuenta exacta con las
// mismas fórmulas de KS_POS / KS_GAME (las medidas en el juego). La caja de cada cosa se mide sobre lo que se dibuja de verdad.
// Zoom hasta ver cada píxel de la textura, marcas de los pasos del juego y valores con decimales.
const KPR = { sel: 'name', zoom: 1, cx: null, cy: null, guides: true, drag: null, box: {}, tex: null, view: null };
const KPR_EL = {
  name: { n: 'Nombre', col: '#ffd84a', y: 'NameY', size: 'NameSize', wide: 'NameStretch', arc: 'NameShape', f: ['NameY', 'NameSize', 'NameStretch', 'NameSpacing', 'NameCurve'] },
  num: { n: 'Dorsal', col: '#56d6ff', y: 'BackNumberY', size: 'BackNumberSize', wide: 'BackNumberSpacing', f: ['BackNumberY', 'BackNumberSize', 'BackNumberSpacing'] },
};
const KPR_ZMAX = 16, KPR_MS = 2048; // zoom máximo; escala a la que se mide la caja de cada cosa
const kprBW = () => UVR.back[1] - UVR.back[0], kprBH = () => UVR.back[3] - UVR.back[2];
// centro (alto) de cada cosa en la espalda derecha (0 = cuello), en unidades de la textura, y la inversa
const kprYOf = (el, F) => { const v1 = UVR.back[3], G = KS_GAME; return el === 'name' ? v1 - G.nameDv - F : v1 - G.numA + G.numB * F; };
const kprFOf = (el, y) => { const v1 = UVR.back[3], G = KS_GAME; return el === 'name' ? v1 - G.nameDv - y : (y - v1 + G.numA) / G.numB; };
const kprCan = api => !!api && (ksKpOn() || !!api.cfg);
// pone el valor del juego F en el campo k (con KitPos queda con decimales; sin KitPos, al paso entero del config.txt)
const kprPutF = (k, F, api) => kplPut(k, KPOS.toSteps(KS_KP[k] || k, F, ksSide()), api);
// textura de la espalda (sin girar) con el nombre y los números, a la resolución del kit (hasta 4096)
function kprTex(api) {
  const base = ksTexOf('kit'), S = base ? Math.min(4096, base.width) : 1024, [u0, u1, v0, v1] = UVR.back, W = Math.round((u1 - u0) * S), H = Math.round((v1 - v0) * S);
  const c = KPR.tex && KPR.tex.width === W && KPR.tex.height === H ? KPR.tex : document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), src = base || ksFallbackTex(1024), sw = src.width, sh = src.height; g.save(); g.translate(-u0 * S, -v0 * S);
  g.drawImage(src, u0 * sw, v0 * sh, (u1 - u0) * sw, (v1 - v0) * sh, u0 * S, v0 * S, (u1 - u0) * S, (v1 - v0) * S);
  api.wrap(() => ksDrawDecals(g, S, null, null)); g.restore(); c.S = S; KPR.tex = c; return c;
}
// caja de lo que se dibuja de verdad (solo esa cosa, a escala KPR_MS), en la espalda derecha
function kprMeasure(el, api) {
  if (!kplOn(el)) return null; const Sm = KPR_MS, [u0, , v0] = UVR.back, W = Math.round(kprBW() * Sm), H = Math.round(kprBH() * Sm);
  const c = kprMeasure.c || (kprMeasure.c = document.createElement('canvas')); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true }); g.save(); g.translate(-u0 * Sm, -v0 * Sm); api.wrap(() => ksDrawDecals(g, Sm, el, null)); g.restore();
  const d = g.getImageData(0, 0, W, H).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) { const r = y * W * 4; for (let x = 0; x < W; x++) if (d[r + x * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  if (x1 < 0) return null; const BW = kprBW(), BH = kprBH(); // girada 180°: lo de abajo a la derecha de la textura queda arriba a la izquierda
  return { x0: BW - (x1 + 1) / Sm, x1: BW - x0 / Sm, y0: BH - (y1 + 1) / Sm, y1: BH - y0 / Sm };
}
// vista: k = píxeles de pantalla por unidad de la textura; (cx, cy) = punto de la espalda en el centro del lienzo
function kprView(cv) {
  const cw = cv.clientWidth || 1, ch = cv.clientHeight || 1, BW = kprBW(), BH = kprBH(), k = Math.min(cw / BW, ch / BH) * KPR.zoom;
  const hw = cw / 2 / k, hh = ch / 2 / k; if (KPR.cx == null) { KPR.cx = BW / 2; KPR.cy = BH / 2; }
  KPR.cx = hw >= BW / 2 ? BW / 2 : Math.min(BW - hw, Math.max(hw, KPR.cx)); KPR.cy = hh >= BH / 2 ? BH / 2 : Math.min(BH - hh, Math.max(hh, KPR.cy));
  const V = { cw, ch, k, sx: x => cw / 2 + (x - KPR.cx) * k, sy: y => ch / 2 + (y - KPR.cy) * k, bx: x => KPR.cx + (x - cw / 2) / k, by: y => KPR.cy + (y - ch / 2) / k };
  KPR.view = V; return V;
}
const kprSBox = (V, b) => b && { x0: V.sx(b.x0), y0: V.sy(b.y0), x1: V.sx(b.x1), y1: V.sy(b.y1), get cx() { return (this.x0 + this.x1) / 2; }, get cy() { return (this.y0 + this.y1) / 2; } };
function kprHtml() {
  const els = Object.keys(KPR_EL); if (!els.includes(KPR.sel)) KPR.sel = 'name';
  const chips = els.map(el => `<button type="button" data-kprsel="${el}" aria-pressed="${KPR.sel === el}" ${kplOn(el) ? '' : 'disabled title="No se muestra en este kit"'}><i style="background:${KPR_EL[el].col}"></i>${KPR_EL[el].n}</button>`).join('');
  return `<div class="kpr" id="kprBox">
    <div class="kprbar"><div class="fchips kplpick">${chips}</div>
      <div class="kprzoom"><button class="btn small" type="button" data-kprz="out" title="Alejar (rueda del mouse)">−</button><output id="kprZ">${Math.round(KPR.zoom * 100)}%</output><button class="btn small" type="button" data-kprz="in" title="Acercar (rueda del mouse)">＋</button><button class="btn small" type="button" data-kprz="fit" title="Ver toda la espalda (0)">⤢</button><button class="btn small" type="button" data-kprz="el" title="Acercar a lo elegido">🎯</button>
        <button class="btn small" type="button" data-kprg aria-pressed="${KPR.guides}" title="Línea del centro y marcas de los pasos del juego">▦ Guías</button></div></div>
    <div class="kprw"><canvas id="kprCv" tabindex="0" aria-label="Espalda del kit en plano: arrastrá el nombre o el dorsal para moverlo. Flechas: un píxel de la textura; + y −: tamaño; rueda: zoom"></canvas></div>
    <p class="note kplval" id="kprVal" aria-live="polite"></p>
    <div class="kprf" id="kprF"></div>
    <p class="note">Arrastrá el nombre o el dorsal: esquinas = tamaño, costados = ancho, manija de arriba = arco. Con Shift encaja en los pasos del juego. Rueda: zoom; arrastrá el fondo para recorrer. Flechas: un píxel de la textura (Shift ×10, Alt ×0,1). + y −: tamaño. [ y ]: arco.</p>
  </div>`;
}
function kprPaint(root, api) {
  const box = root.querySelector('#kprBox'); if (!box || !KS.cfg) return; const cv = box.querySelector('#kprCv'); if (!cv || !cv.clientWidth) return;
  const T = kprTex(api), V = kprView(cv), dpr = Math.min(3, window.devicePixelRatio || 1), BW = kprBW(), BH = kprBH(), S = T.S;
  if (cv.width !== Math.round(V.cw * dpr) || cv.height !== Math.round(V.ch * dpr)) { cv.width = Math.round(V.cw * dpr); cv.height = Math.round(V.ch * dpr); }
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, V.cw, V.ch);
  // la espalda, derecha; con mucho zoom se ve cada píxel de la textura tal cual
  g.save(); g.translate(V.sx(0), V.sy(0)); g.scale(V.k, V.k); g.translate(BW, BH); g.rotate(Math.PI); g.imageSmoothingEnabled = V.k / S < 3; g.drawImage(T, 0, 0, BW, BH); g.restore();
  const tx = V.k / S; // píxeles de pantalla por píxel de la textura
  if (tx >= 8) { g.save(); g.strokeStyle = '#0000002a'; g.lineWidth = 1; g.beginPath();
    for (let x = Math.floor(V.bx(0) * S); x <= V.bx(V.cw) * S + 1; x++) { const s = Math.round(V.sx(x / S)) + .5; g.moveTo(s, 0); g.lineTo(s, V.ch); }
    for (let y = Math.floor(V.by(0) * S); y <= V.by(V.ch) * S + 1; y++) { const s = Math.round(V.sy(y / S)) + .5; g.moveTo(0, s); g.lineTo(V.cw, s); }
    g.stroke(); g.restore(); }
  for (const el of Object.keys(KPR_EL)) KPR.box[el] = kprMeasure(el, api);
  const sel = KPR.sel, E = KPR_EL[sel], sb = kprSBox(V, KPR.box[sel]);
  if (KPR.guides) {
    g.save(); g.setLineDash([6, 5]); g.lineWidth = 1; g.strokeStyle = '#ffffffb0'; const mx = Math.round(V.sx(BW / 2)) + .5; g.beginPath(); g.moveTo(mx, 0); g.lineTo(mx, V.ch); g.stroke();
    g.strokeStyle = '#000000a0'; g.lineDashOffset = 5; g.stroke(); g.restore();
    // marcas de los pasos enteros del juego (sin KitPos el valor solo puede caer ahí): el centro de lo elegido en cada paso
    if (sb) { const F = KPOS.FIELDS[E.y], k = E.y, now = ksF(k), y0 = kprYOf(sel, now), off = (KPR.box[sel].y0 + KPR.box[sel].y1) / 2 - y0;
      g.save(); g.font = '600 10px system-ui, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle';
      for (let n = 0; n <= F.max; n++) { const y = V.sy(kprYOf(sel, KPOS.fromSteps(k, n)) + off); if (y < -10 || y > V.ch + 10) continue; const big = n % 5 === 0;
        g.fillStyle = '#000a'; g.fillRect(V.cw - (big ? 15 : 9), Math.round(y) - 1, big ? 15 : 9, 3); g.fillStyle = E.col; g.fillRect(V.cw - (big ? 14 : 8), Math.round(y), big ? 14 : 8, 1);
        if (big && V.k * Math.abs(KPOS.fromSteps(k, 1) - KPOS.fromSteps(k, 0)) * (sel === 'num' ? KS_GAME.numB : 1) > 3) { g.fillStyle = '#000c'; g.fillText(n, V.cw - 17, y + 1); g.fillStyle = '#fff'; g.fillText(n, V.cw - 18, y); } }
      g.restore();
      g.save(); g.setLineDash([3, 4]); g.strokeStyle = E.col + 'cc'; g.lineWidth = 1; const cy = Math.round(sb.cy) + .5; g.beginPath(); g.moveTo(0, cy); g.lineTo(V.cw, cy); g.stroke(); g.restore(); }
  }
  for (const el of Object.keys(KPR_EL)) {
    const b = kprSBox(V, KPR.box[el]), C = KPR_EL[el], on = el === sel, hov = KPR.hover === el; if (!b || b.y1 < 0 || b.y0 > V.ch) continue; const p = 5;
    const out = [C.y, C.size].some(k => { const s = ksP(k); return s < -.01 || s > kplMax(k) + .01; }), col = out ? '#ff6b5e' : C.col;
    g.save(); g.lineWidth = on ? 1.5 : 1; g.strokeStyle = col; if (!on) g.setLineDash([5, 4]); if (on || hov) { g.fillStyle = col + '18'; g.fillRect(b.x0 - p, b.y0 - p, b.x1 - b.x0 + 2 * p, b.y1 - b.y0 + 2 * p); }
    g.strokeRect(Math.round(b.x0 - p) + .5, Math.round(b.y0 - p) + .5, Math.round(b.x1 - b.x0 + 2 * p), Math.round(b.y1 - b.y0 + 2 * p)); g.restore();
    g.save(); g.font = '600 11px system-ui, sans-serif'; const t = tr(C.n) + (out ? ' · ' + tr('fuera de rango') : ''), tw = g.measureText(t).width + 12, ly = on && C.arc ? b.y1 + p + 3 : Math.max(0, b.y0 - p - 19), lx = Math.min(V.cw - tw, Math.max(0, b.x0 - p));
    g.fillStyle = col; g.beginPath(); g.roundRect ? g.roundRect(lx, ly, tw, 17, 4) : g.rect(lx, ly, tw, 17); g.fill(); g.fillStyle = '#111'; g.fillText(t, lx + 6, ly + 12.5); g.restore();
    if (!on || !kprCan(KPR.api)) continue;
    for (const h of kplHandles(el, { x0: b.x0 - 2, y0: b.y0 - 2, x1: b.x1 + 2, y1: b.y1 + 2 })) {
      g.save(); g.fillStyle = '#fff'; g.strokeStyle = col; g.lineWidth = 2;
      if (h.shape === 'sq') { g.fillRect(h.x - 4, h.y - 4, 8, 8); g.strokeRect(h.x - 4, h.y - 4, 8, 8); }
      else if (h.shape === 'ci') { g.beginPath(); g.arc(h.x, h.y, 5, 0, Math.PI * 2); g.fill(); g.stroke(); }
      else { g.beginPath(); g.moveTo(h.x, h.y + 16); g.lineTo(h.x, h.y + 6); g.stroke(); g.beginPath(); g.arc(h.x, h.y, 7, 0, Math.PI * 2); g.fill(); g.stroke(); g.beginPath(); g.lineWidth = 1.6; g.arc(h.x, h.y + 5, 5, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      g.restore();
    }
  }
  const D = KPR.drag; if (D && D.tip) { g.save(); g.font = '600 12px system-ui, sans-serif'; const tw = g.measureText(D.tip).width + 14, x = Math.min(V.cw - tw - 2, Math.max(2, D.px + 14)), y = Math.min(V.ch - 24, Math.max(2, D.py + 16));
    g.fillStyle = '#000c'; g.beginPath(); g.roundRect ? g.roundRect(x, y, tw, 21, 5) : g.rect(x, y, tw, 21); g.fill(); g.fillStyle = '#fff'; g.fillText(D.tip, x + 7, y + 14.5); g.restore(); }
  kprInfo(box, api, S);
}
const kprNum = (v, d) => (+v).toFixed(d).replace(/\.?0+$/, '') || '0';
// lo elegido: dónde queda en la textura (en píxeles) y los valores del juego, con decimales
function kprInfo(box, api, S) {
  const v = box.querySelector('#kprVal'), sel = KPR.sel, E = KPR_EL[sel], b = KPR.box[sel], z = box.querySelector('#kprZ'); if (z) z.textContent = Math.round(KPR.zoom * 100) + '%';
  box.querySelectorAll('[data-kprsel]').forEach(x => x.setAttribute('aria-pressed', x.dataset.kprsel === sel));
  if (v) v.innerHTML = `<b style="color:${E.col}">● ${tr(E.n)}</b> · ${!kplOn(sel) ? tr('no se usa en este kit') : !b ? tr('oculto o fuera de la espalda') : [tr('centro a ' + kprNum((b.y0 + b.y1) / 2 * S, 1) + ' px del cuello'), tr('alto ' + kprNum((b.y1 - b.y0) * S, 1) + ' px'), tr('ancho ' + kprNum((b.x1 - b.x0) * S, 1) + ' px'), tr('textura de ' + S + ' px')].map(esc).join(' · ')}${kprCan(api) ? '' : ` · <span class="warn">${tr('Instalá KitPos (paso 4 → Requisitos) para moverlo desde acá')}</span>`}`;
  const f = box.querySelector('#kprF'); if (!f || (document.activeElement && f.contains(document.activeElement))) return;
  const kp = ksKpOn(), vals = kp ? kpsVals() : {};
  f.innerHTML = E.f.filter(k => kp || k !== 'NameSpacing').map(k => {
    const F = KPOS.FIELDS[k], cfgK = F.cfg || k, val = kp ? (vals[k] ?? (k === 'NameSpacing' ? 0 : KPOS.fromSteps(k, ksP(cfgK), ksSide()))) : ksP(cfgK), st = k === 'NameSpacing' ? null : KPOS.toSteps(k, kp ? val : KPOS.fromSteps(k, val, ksSide()), ksSide());
    const step = !kp ? 1 : k === 'NameSpacing' ? .5 : k === 'NameCurve' ? .01 : .0005;
    return `<label class="kprfi"><span>${tr(F.n)}</span><input type="number" data-kprf="${k}" step="${step}" value="${kp ? kprNum(val, 4) : Math.round(val)}" ${kp || api.cfg ? '' : 'disabled'}><small>${st == null ? 'px' : tr('paso') + ' ' + kprNum(st, 2)}</small></label>`;
  }).join('');
}
function kprBind(root, api) {
  const box = root.querySelector('#kprBox'); if (!box) return; KPR.api = api; const cv = box.querySelector('#kprCv');
  let raf = 0; const paint = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; kprPaint(root, api); }); };
  const changed = tip => { if (KPR.drag) KPR.drag.tip = tip; api.changed(); paint(); };
  KPR.repaint = paint;
  const select = el => { if (!KPR_EL[el] || !kplOn(el)) return; KPR.sel = el; const b = KPR.box[el], V = KPR.view; // con zoom, se va a lo elegido si quedó fuera de la vista
    if (b && V && KPR.zoom > 1 && (V.sy(b.y1) < 0 || V.sy(b.y0) > V.ch)) { KPR.cx = (b.x0 + b.x1) / 2; KPR.cy = (b.y0 + b.y1) / 2; } paint(); };
  box.querySelectorAll('[data-kprsel]').forEach(b => b.onclick = () => select(b.dataset.kprsel));
  const zoomAt = (z, sx, sy) => { const V = KPR.view; if (!V) return; z = Math.max(1, Math.min(KPR_ZMAX, z)); const px = V.bx(sx), py = V.by(sy); KPR.zoom = z; const k = Math.min(V.cw / kprBW(), V.ch / kprBH()) * z; KPR.cx = px - (sx - V.cw / 2) / k; KPR.cy = py - (sy - V.ch / 2) / k; paint(); };
  box.querySelectorAll('[data-kprz]').forEach(b => b.onclick = () => { const a = b.dataset.kprz, V = KPR.view; if (!V) return;
    if (a === 'fit') { KPR.zoom = 1; KPR.cx = KPR.cy = null; paint(); return; }
    if (a === 'el') { const bb = KPR.box[KPR.sel]; if (!bb) return; const fit = Math.min(V.cw / kprBW(), V.ch / kprBH()); KPR.zoom = Math.max(1, Math.min(KPR_ZMAX, V.cw * .8 / ((bb.x1 - bb.x0) * fit), V.ch * .45 / ((bb.y1 - bb.y0) * fit))); KPR.cx = (bb.x0 + bb.x1) / 2; KPR.cy = (bb.y0 + bb.y1) / 2; paint(); return; }
    zoomAt(KPR.zoom * (a === 'in' ? 1.5 : 1 / 1.5), V.cw / 2, V.ch / 2); });
  const gb = box.querySelector('[data-kprg]'); if (gb) gb.onclick = () => { KPR.guides = !KPR.guides; gb.setAttribute('aria-pressed', KPR.guides); paint(); };
  const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const hit = (x, y) => { const V = KPR.view; if (!V) return null; const sel = KPR.sel, sb = kprSBox(V, KPR.box[sel]);
    if (sb && kprCan(api)) for (const h of kplHandles(sel, { x0: sb.x0 - 2, y0: sb.y0 - 2, x1: sb.x1 + 2, y1: sb.y1 + 2 })) if (Math.hypot(x - h.x, y - h.y) <= 9) return { el: sel, ...h };
    let best = null; for (const el of Object.keys(KPR_EL)) { const b = kprSBox(V, KPR.box[el]); if (!b) continue; const p = 6; if (x >= b.x0 - p && x <= b.x1 + p && y >= b.y0 - p && y <= b.y1 + p && (!best || el === sel)) best = el; }
    return best ? { el: best, mode: 'move', cur: 'grab' } : null; };
  const vals = el => { const E = KPR_EL[el], s = {}; for (const k of [E.y, E.size, E.wide, E.arc].filter(Boolean)) s[k] = ksP(k); return s; };
  cv.onpointermove = e => {
    const [x, y] = pos(e), D = KPR.drag, V = KPR.view; if (!V) return;
    if (!D) { const h = hit(x, y), was = KPR.hover; KPR.hover = h && h.el; cv.style.cursor = h ? (h.mode === 'move' ? 'grab' : h.cur) : KPR.zoom > 1 ? 'move' : ''; if (KPR.hover !== was) paint(); return; }
    D.px = x; D.py = y; const E = KPR_EL[D.el], dx = (x - D.x) / V.k, dy = (y - D.y) / V.k;
    if (D.mode === 'pan') { KPR.cx = D.cx - (x - D.x) / V.k; KPR.cy = D.cy - (y - D.y) / V.k; paint(); return; }
    if (D.mode === 'move') { let F = kprFOf(D.el, D.y0 + dy); if (e.shiftKey) F = KPOS.fromSteps(E.y, Math.round(KPOS.toSteps(E.y, F))); kprPutF(E.y, F, api); changed(kplVal(E.y)); }
    else if (D.mode === 'size') { const r0 = Math.hypot(D.x - D.sc[0], D.y - D.sc[1]) || 1, r = Math.hypot(x - D.sc[0], y - D.sc[1]); let s = KPOS.toSteps(E.size, D.F0 * r / r0); if (e.shiftKey) s = Math.round(s); kplPut(E.size, s, api); changed(kplVal(E.size)); }
    else if (D.mode === 'wide') { const w = Math.max(.002, D.w0 + 2 * dx * D.dir); let s = D.el === 'name' ? KPOS.toSteps(E.wide, D.F0 * w / D.w0) : D.s[E.wide] + (w - D.w0) / (D.gw || 1e-3); if (e.shiftKey) s = Math.round(s); kplPut(E.wide, s, api); changed(kplVal(E.wide)); }
    else if (D.mode === 'arc') { let s = D.s[E.arc] - (y - D.y) / 16; if (e.shiftKey) s = Math.round(s); kplPut(E.arc, s, api); changed(kplVal(E.arc)); }
  };
  cv.onpointerdown = e => {
    if (e.button !== 0 && e.button !== 1) return; cv.focus({ preventScroll: true }); const [x, y] = pos(e), V = KPR.view; if (!V) return;
    const h = e.button === 0 ? hit(x, y) : null;
    if (h) { if (h.el !== KPR.sel) { KPR.sel = h.el; paint(); } }
    if (!h || !kprCan(api)) { if (KPR.zoom > 1 || e.button === 1) { e.preventDefault(); KPR.drag = { mode: 'pan', x, y, cx: KPR.cx, cy: KPR.cy }; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; } else if (h) kprInfo(box, api, (KPR.tex && KPR.tex.S) || 1024); return; }
    e.preventDefault(); const E = KPR_EL[h.el], b = KPR.box[h.el]; if (!b) return; const s = vals(h.el), D = KPR.drag = { el: h.el, mode: h.mode, dir: h.dir || 1, x, y, px: x, py: y, s };
    if (h.mode === 'move') D.y0 = kprYOf(h.el, ksF(E.y));
    else if (h.mode === 'size') { D.F0 = ksF(E.size); const sb = kprSBox(V, b); D.sc = [sb.cx, sb.cy]; }
    else if (h.mode === 'wide') { D.w0 = b.x1 - b.x0; D.F0 = ksF(E.wide);
      if (h.el === 'num') { const w1 = (() => { KS.pOver = { [E.wide]: s[E.wide] + 2 }; try { return kprMeasure('num', api); } finally { KS.pOver = null; } })(); D.gw = w1 ? (w1.x1 - w1.x0 - D.w0) / 2 : 0; if (Math.abs(D.gw) < 1e-4) D.gw = D.w0 * .03; } }
    cv.setPointerCapture(e.pointerId); cv.style.cursor = h.mode === 'move' ? 'grabbing' : h.cur;
  };
  cv.onpointerup = cv.onpointercancel = () => { if (!KPR.drag) return; const was = KPR.drag.mode; KPR.drag = null; cv.style.cursor = ''; if (was !== 'pan') api.changed(true); paint(); };
  cv.onpointerleave = () => { if (!KPR.drag && KPR.hover) { KPR.hover = null; paint(); } };
  cv.onwheel = e => { e.preventDefault(); const [x, y] = pos(e); zoomAt(KPR.zoom * (e.deltaY < 0 ? 1.25 : 1 / 1.25), x, y); };
  cv.ondblclick = e => { const [x, y] = pos(e); zoomAt(KPR.zoom >= KPR_ZMAX / 2 ? 1 : KPR.zoom * 2, x, y); };
  cv.onkeydown = e => {
    const sel = KPR.sel, E = KPR_EL[sel], S = (KPR.tex && KPR.tex.S) || 1024;
    if (e.key === '1' || e.key === '2') { select(e.key === '1' ? 'name' : 'num'); e.preventDefault(); return; }
    if (e.key === '0') { KPR.zoom = 1; KPR.cx = KPR.cy = null; paint(); e.preventDefault(); return; }
    if (!kprCan(api) || !kplOn(sel)) return;
    const mul = e.shiftKey ? 10 : e.altKey ? .1 : 1;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); kprPutF(E.y, kprFOf(sel, kprYOf(sel, ksF(E.y)) + (e.key === 'ArrowUp' ? -1 : 1) * mul / S), api); changed(); return; }
    if (e.key === '+' || e.key === '=' || e.key === '-' || e.key === '_') { e.preventDefault(); const up = e.key === '+' || e.key === '='; kprPutF(E.size, ksF(E.size) * (1 + (up ? 1 : -1) * .005 * mul), api); changed(); return; }
    if ((e.key === ']' || e.key === '[') && E.arc) { e.preventDefault(); kplPut(E.arc, ksP(E.arc) + (e.key === ']' ? .05 : -.05) * mul, api); changed(); }
  };
  // valores exactos escritos a mano (con KitPos, el valor del juego; sin KitPos, el paso del config.txt)
  const fbox = box.querySelector('#kprF'); if (fbox) fbox.oninput = e => { const i = e.target.closest('[data-kprf]'); if (!i || i.value === '' || !isFinite(+i.value)) return; const k = i.dataset.kprf, F = KPOS.FIELDS[k], v = +i.value;
    if (ksKpOn()) kpsSet({ [k]: v }); else if (api.cfg) kplPut(F.cfg || k, v, api); else return;
    const sm = i.parentElement.querySelector('small'); if (sm && k !== 'NameSpacing') sm.textContent = tr('paso') + ' ' + kprNum(KPOS.toSteps(k, ksKpOn() ? v : KPOS.fromSteps(k, v, ksSide()), ksSide()), 2);
    api.changed(); paint(); };
  if (fbox) fbox.onchange = () => { api.changed(true); paint(); };
  if (KPR.ro) KPR.ro.disconnect(); if (window.ResizeObserver) { KPR.ro = new ResizeObserver(() => paint()); KPR.ro.observe(cv); }
  paint();
}
