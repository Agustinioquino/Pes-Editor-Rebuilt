// ===================== Ficha hexagonal del jugador =====================
// Seis áreas, cada una es el promedio de sus habilidades. Arrastrando una punta (o con las flechas del teclado)
// se suben o bajan todas las habilidades de esa área por igual, así se mantienen las diferencias entre ellas.
const HEXA_OUT = [
  ['Ataque', ['atk', 'finish', 'header', 'kick_pwr', 'place_kick', 'swerve']],
  ['Técnica', ['ball_ctrl', 'drib', 'tight_pos']],
  ['Pase', ['lowpass', 'loftpass']],
  ['Velocidad', ['speed', 'exp_pwr']],
  ['Físico', ['body_ctrl', 'phys_cont', 'jump', 'stamina']],
  ['Defensa', ['def', 'ball_win', 'aggres']],
];
const HEXA_GK = [
  ['Portero', ['gk']],
  ['Atajar', ['catching']],
  ['Despejar', ['clearing']],
  ['Reflejos', ['reflex']],
  ['Alcance', ['cover']],
  ['Físico', ['jump', 'body_ctrl', 'phys_cont']],
];
const HX = { R: 118, CX: 215, CY: 170, LO: 25, HI: 99, drag: null };
const hexaAxes = reg => (reg === 0 ? HEXA_GK : HEXA_OUT);
const hexaClamp = v => Math.max(40, Math.min(99, Math.round(v)));
function hexaVals(get, axes) { return axes.map(([, ks]) => { const vs = ks.map(get).filter(v => v != null); return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null; }); }
function hexaPt(i, v, extra = 0) {
  const a = -Math.PI / 2 + i * Math.PI / 3, r = (Math.max(HX.LO, v) - HX.LO) / (HX.HI - HX.LO) * HX.R + extra;
  return [HX.CX + Math.cos(a) * r, HX.CY + Math.sin(a) * r];
}
const hexaPoly = vals => vals.map((v, i) => hexaPt(i, v ?? 40).map(n => n.toFixed(1)).join(',')).join(' ');
const hexaLabel = s => (typeof tr === 'function' ? tr(s) : s);
// opts: { orig: valores al abrir el archivo, edit: se puede arrastrar, hot: área que se está moviendo }
function hexaSvg(axes, vals, opts = {}) {
  const rings = [50, 60, 70, 80, 90, 99].map(v => `<polygon class="hxring${v === 99 ? ' max' : ''}" points="${hexaPoly(axes.map(() => v))}"/>`).join('');
  const spokes = axes.map((_, i) => { const [x, y] = hexaPt(i, HX.HI); return `<line class="hxspoke" x1="${HX.CX}" y1="${HX.CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }).join('');
  const orig = opts.orig && opts.orig.some((v, i) => v != null && Math.abs(v - vals[i]) >= .05) ? `<polygon class="hxorig" points="${hexaPoly(opts.orig)}"/>` : '';
  const labels = axes.map(([n], i) => {
    const [x, y] = hexaPt(i, HX.HI, 30), v = vals[i], anchor = Math.abs(x - HX.CX) < 4 ? 'middle' : x > HX.CX ? 'start' : 'end';
    const d = opts.orig && opts.orig[i] != null && v != null ? Math.round(v) - Math.round(opts.orig[i]) : 0;
    return `<text class="hxlab${opts.hot === i ? ' hot' : ''}" x="${x.toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="${anchor}">${esc(hexaLabel(n))}</text>
      <text class="hxval ${v == null ? '' : vcls(Math.round(v))}" x="${x.toFixed(1)}" y="${(y + 15).toFixed(1)}" text-anchor="${anchor}">${v == null ? '–' : Math.round(v)}${d ? `<tspan class="hxd ${d > 0 ? 'up' : 'dn'}" dx="5">${d > 0 ? '+' : '−'}${Math.abs(d)}</tspan>` : ''}</text>`;
  }).join('');
  const handles = opts.edit ? axes.map(([n], i) => { const [x, y] = hexaPt(i, vals[i] ?? 40); return `<g class="hxh${opts.hot === i ? ' hot' : ''}" data-hx="${i}" tabindex="0" role="slider" aria-label="${esc(hexaLabel(n))}" aria-valuemin="40" aria-valuemax="99" aria-valuenow="${Math.round(vals[i] ?? 40)}"><circle class="hxhit" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="18"/><circle class="hxdot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8"/></g>`; }).join('') : '';
  return `<svg class="hxsvg" viewBox="0 0 ${HX.CX * 2} ${HX.CY * 2}" role="img" aria-label="${esc(hexaLabel('Gráfico hexagonal de habilidades'))}">${rings}${spokes}${orig}<polygon class="hxval-poly" points="${hexaPoly(vals)}"/>${handles}${labels}</svg>`;
}
// ficha de un jugador de tu EDIT (editable)
function hexaOrig(p) {
  if (!S.origData || p.base + 0x138 > S.origData.length) return null;
  try { return k => PD.player.get(S.origData, p.base, k); } catch { return null; }
}
function hexaCard(p, compact) {
  const reg = pget(p, 'reg_pos'), axes = hexaAxes(reg), og = hexaOrig(p);
  const vals = hexaVals(k => pget(p, k), axes), orig = og ? hexaVals(og, axes) : null;
  return `<div class="hexa${compact ? ' compact' : ''}" id="hexa">
    <div class="hxwrap" id="hxWrap">${hexaSvg(axes, vals, { orig, edit: true })}</div>
    <div class="hxside">
      ${compact ? '' : '<h3>Ficha hexagonal</h3>'}
      <p class="note">Arrastrá una punta para subir o bajar todas las habilidades de esa área. También podés tocar una punta y usar las flechas del teclado.</p>
      ${compact ? '' : `<div class="hxrate"><span>Valoración aprox.</span><b id="hxRate" class="${vcls(rating(p))}">${rating(p)}</b><i id="hxRateD"></i></div>`}
      ${compact ? '' : `<ul class="hxlist">${axes.map(([n, ks]) => `<li><b>${esc(n)}</b> <span>${ks.map(k => esc(FIELD_LABEL[k] || (ABIL.find(a => a[0] === k) || [k, k])[1])).join(' · ')}</span></li>`).join('')}</ul>`}
      ${orig && orig.some((v, i) => v != null && Math.abs(v - vals[i]) >= .05) ? '<p class="note hxlegend"><i class="hxsw"></i>Línea punteada: cómo estaba al abrir el archivo.</p>' : ''}
    </div>
  </div>`;
}
// jugador de la base del Parche (solo para ver)
function hexaRo(get, reg) {
  const axes = hexaAxes(reg), vals = hexaVals(get, axes);
  if (vals.every(v => v == null)) return '';
  return `<div class="hexa ro"><div class="hxwrap">${hexaSvg(axes, vals)}</div></div>`;
}
// propuesta: cada habilidad del área se mueve lo mismo que el promedio
function hexaPropose(p, axes, i, target) {
  const ks = axes[i][1], cur = ks.map(k => pget(p, k)), avg = cur.reduce((a, b) => a + b, 0) / cur.length, d = target - avg, out = new Map();
  ks.forEach((k, j) => out.set(k, hexaClamp(cur[j] + d)));
  return out;
}
function hexaPaint(p, axes, prop, hot) {
  const get = k => (prop && prop.has(k) ? prop.get(k) : pget(p, k)), og = hexaOrig(p);
  const vals = hexaVals(get, axes), orig = og ? hexaVals(og, axes) : null;
  const wrap = $('hxWrap'); if (!wrap) return;
  wrap.innerHTML = hexaSvg(axes, vals, { orig, edit: true, hot });
  const r0 = rating(p), r1 = Math.round(posFormula(POS_KEY[pget(p, 'reg_pos')] || 'cmf', get)), rb = $('hxRate'), rd = $('hxRateD');
  if (rb) { rb.textContent = r1; rb.className = vcls(r1); }
  if (rd) { const d = r1 - r0; rd.textContent = d ? (d > 0 ? '+' : '−') + Math.abs(d) : ''; rd.className = d > 0 ? 'up' : d < 0 ? 'dn' : ''; }
  if (hot != null) { const h = wrap.querySelector(`[data-hx="${hot}"]`); if (h && HX.focus) h.focus({ preventScroll: true }); }
}
function hexaCommit(p, axes, i, prop, rer) {
  if (!prop || [...prop].every(([k, v]) => pget(p, k) === v)) { hexaPaint(p, axes, null); return; }
  const nm = pget(p, 'name') || 'ID ' + p.id;
  edit(nm + ': ' + axes[i][0], 'p' + p.id, regP(p), () => {
    for (const [k, v] of prop) { PD.player.set(S.d, p.base, k, v); if (S.autoLock) for (const fl of [...LOCK_FLAGS, ...FIELD_FLAGS(k)]) PD.player.set(S.d, p.base, fl, 1); }
  });
  rer();
}
function hexaBind(p, rer) {
  const wrap = $('hxWrap'); if (!wrap) return;
  const axes = hexaAxes(pget(p, 'reg_pos'));
  const valAt = (e, i) => {
    const svg = wrap.querySelector('svg'), m = svg.getScreenCTM(); if (!m) return null;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    const a = -Math.PI / 2 + i * Math.PI / 3, proj = (pt.x - HX.CX) * Math.cos(a) + (pt.y - HX.CY) * Math.sin(a);
    return hexaClamp(HX.LO + proj / HX.R * (HX.HI - HX.LO));
  };
  wrap.addEventListener('pointerdown', e => {
    const h = e.target.closest('[data-hx]'); if (!h) return;
    e.preventDefault(); const i = +h.dataset.hx;
    HX.drag = { i, prop: null, id: e.pointerId }; HX.focus = false;
    try { wrap.setPointerCapture(e.pointerId); } catch { }
    hexaPaint(p, axes, null, i);
  });
  wrap.addEventListener('pointermove', e => {
    const d = HX.drag; if (!d || d.id !== e.pointerId) return;
    const v = valAt(e, d.i); if (v == null) return;
    d.prop = hexaPropose(p, axes, d.i, v); hexaPaint(p, axes, d.prop, d.i);
  });
  const end = e => { const d = HX.drag; if (!d || d.id !== e.pointerId) return; HX.drag = null; hexaCommit(p, axes, d.i, d.prop, rer); };
  wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
  wrap.addEventListener('keydown', e => {
    const h = e.target.closest('[data-hx]'); if (!h) return;
    const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5 }[e.key]; if (!step) return;
    e.preventDefault(); const i = +h.dataset.hx, cur = hexaVals(k => pget(p, k), axes)[i];
    HX.focus = true; HX.refocus = i;
    hexaCommit(p, axes, i, hexaPropose(p, axes, i, Math.round(cur) + step), rer);
  });
  if (HX.refocus != null) { const i = HX.refocus; HX.refocus = null; requestAnimationFrame(() => { const h = $('hxWrap') && $('hxWrap').querySelector(`[data-hx="${i}"]`); if (h) h.focus({ preventScroll: true }); }); }
}
