// ===================== Apariencia: paleta base del editor mezclada con los colores del equipo elegido =====================
const UI_BASES = {
  verde: { n: 'Verde cancha', h: 148, s: .1, al: '#1d6e47', ad: '#4dbd83' },
  pizarra: { n: 'Pizarra', h: 212, s: .16, al: '#2a64a8', ad: '#6aa9e6' },
  atardecer: { n: 'Atardecer', h: 26, s: .2, al: '#b0501d', ad: '#ef9150' },
  retro: { n: 'Retro', h: 38, s: .24, al: '#8c3b3b', ad: '#e0857a' },
  grafito: { n: 'Grafito', h: 220, s: .04, al: '#0f6f69', ad: '#38cbb6' }
};
const UI_DEF = { mode: 'auto', base: 'verde', src: 'auto', mix: 0, tint: 0, follow: true, pin: null, r: 'normal', fs: 14, fonts: {}, fontOn: { display: true, body: true, mono: false }, fontV: 3 };
function uiLogo() {
  // barra de arriba: el logo en vector (SVG), plateado en modo oscuro y negro en modo claro
  const img = $('brandLogo'); if (!img) return;
  const dark = isDarkUi() || /^(retro|pes6)$/.test(document.documentElement.dataset.gfx || ''), src = typeof LOGO_SVG !== 'undefined' ? LOGO_SVG[dark ? 'dark' : 'light'] : typeof LOGO_SRC !== 'undefined' ? LOGO_SRC[dark ? 'dark' : 'light'] : null;
  if (!src || img.dataset.k === (dark ? 'd' : 'l')) return; img.dataset.k = dark ? 'd' : 'l';
  // capas del efecto del logo en PES 6: la silueta y el contorno del mismo logo
  const br = $('bHome'); if (br) { br.style.setProperty('--lm', `url("${src}")`); if (typeof LOGO_SRC !== 'undefined' && LOGO_SRC.neon) br.style.setProperty('--nm', `url("${LOGO_SRC.neon}")`); }
  if (img.getAttribute('src') && !ANIM.reduce.matches) { img.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140 }).onfinish = () => { img.src = src; img.animate([{ opacity: 0, filter: 'blur(4px)' }, { opacity: 1, filter: 'none' }], { duration: 260 }); }; }
  else img.src = src;
}
// ---- fuente propia para toda la página ----
const UI_FONTS = ['Saira', 'Bahnschrift', 'Segoe UI', 'Arial', 'Arial Narrow', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Georgia', 'Century Gothic', 'Franklin Gothic Medium', 'Impact', 'Calibri', 'Cambria', 'Consolas'];
const uiFontInstalled = f => { try { const c = document.createElement('canvas').getContext('2d'), t = 'mmmmmmmmmmWWWli10'; c.font = '40px monospace'; const a = c.measureText(t).width; c.font = `40px "${f}", monospace`; const b = c.measureText(t).width; c.font = '40px serif'; const a2 = c.measureText(t).width; c.font = `40px "${f}", serif`; return a !== b || a2 !== c.measureText(t).width; } catch { return false; } };
let UI_FONT_FILE = null;
async function uiFontLoadSaved() {
  const u = UI(); if (!Object.values(u.fonts || {}).some(f => f && f.file)) return uiFontApply();
  try { const rec = await idbGet('uiFont'); if (rec && rec.buf) { const ff = new FontFace('EditorFuentePropia', rec.buf); await ff.load(); document.fonts.add(ff); UI_FONT_FILE = rec.name; } } catch { }
  uiFontApply();
}
// juegos de fuentes: títulos (d), texto (b) y números (m)
const UI_FONT_SETS = {
  moderna: { n: 'Outfit (moderna)', d: '"Big Shoulders"', b: '"Outfit"' },
  pes: { n: 'QuickExpress (PES 6)', d: '"PES Express"', b: '"PES Express"', cls: 'font-pes' },
  pesest: { n: 'QuickExpress con estela en títulos', d: '"PES Express Estela"', b: '"PES Express"', cls: 'font-pes' },
  retro: { n: 'Pixel retro (Winning Eleven)', d: '"Pixelify Sans"', b: '"Pixelify Sans"', m: '"Silkscreen"', cls: 'font-retro' },
  classic: { n: 'Tahoma (clásica)', d: 'Tahoma,"Segoe UI"', b: 'Tahoma,"Segoe UI",Verdana' },
  saira: { n: 'Saira (la anterior)', d: '"Saira Condensed"', b: '"Saira"' }
};
const UI_FONT_DEF = { moderno: 'moderna', pes6: 'pes', retro: 'retro', clasico: 'classic' };
const uiGfxMode = () => typeof GFX === 'function' ? GFX().mode : 'moderno';
function uiFontCur() { const u = UI(), m = uiGfxMode(); return (u.fonts && u.fonts[m]) || { set: UI_FONT_DEF[m] || 'moderna', auto: true }; }
function uiFontSetCur(val) { const u = UI(), m = uiGfxMode(), fs = Object.assign({}, u.fonts); if (val) fs[m] = val; else delete fs[m]; u.fonts = fs; savePrefs(); uiFontApply(); }
function uiFontApply() {
  const u = UI(), r = document.documentElement, st = r.style, f = uiFontCur(), on = u.fontOn || {};
  for (const v of ['--display', '--body', '--mono']) st.removeProperty(v);
  r.classList.remove('font-pes', 'font-retro');
  let d, b, m, cls;
  if (f.set) { const s = UI_FONT_SETS[f.set] || UI_FONT_SETS.moderna; d = s.d; b = s.b; m = s.m; cls = s.cls; }
  else if (f.file) { if (!UI_FONT_FILE) return; d = b = '"EditorFuentePropia"'; }
  else if (f.name) d = b = `"${f.name}"`;
  if (!d) return;
  if (cls && on.body) r.classList.add(cls);
  if (on.display) st.setProperty('--display', `${d},"Saira Condensed","Arial Narrow",Arial,sans-serif`);
  if (on.body) st.setProperty('--body', `${b},"Saira","Segoe UI",system-ui,sans-serif`);
  if (on.mono) st.setProperty('--mono', `${m || b},"IBM Plex Mono",ui-monospace,Consolas,monospace`);
}
// selector de fuente (sirve para el estilo que está activo)
function uiFontHtml(full) {
  const f = uiFontCur(), m = uiGfxMode(), u = UI(), def = UI_FONT_SETS[UI_FONT_DEF[m] || 'moderna'].n;
  const v = f.auto ? '' : f.set ? 's:' + f.set : f.file ? 'file' : 'n:' + f.name;
  const opts = [['', `La del estilo: ${def}`], ...Object.entries(UI_FONT_SETS).map(([k, s]) => ['s:' + k, s.n]), ...(UI_FONT_FILE ? [['file', UI_FONT_FILE + ' (cargada)']] : []), ...UI_FONTS.filter(x => x !== 'Saira' && uiFontInstalled(x)).map(x => ['n:' + x, x])];
  return `<div class="uisec"><span class="lab">Fuente de la página${m !== 'moderno' ? ` <span class="sub">(estilo ${esc((GFX_MODES.find(x => x.k === m) || {}).n || m)})</span>` : ''}</span>
      <div class="row" style="flex-wrap:nowrap;gap:6px"><select id="uiFont" aria-label="Fuente de la página">${opts.map(([k, n]) => `<option value="${esc(k)}" ${k === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select><button class="btn small" type="button" id="uiFontLoad" title="Usar un archivo de fuente .ttf, .otf, .woff o .woff2 de tu compu">Cargar…</button></div>
      ${full ? `<div class="fchips" id="uiFontOn">${[['display', 'Títulos'], ['body', 'Texto'], ['mono', 'Números y datos']].map(([k, n]) => `<button type="button" data-k="${k}" aria-pressed="${!!(u.fontOn || {})[k]}">${n}</button>`).join('')}</div>` : ''}
      <p class="uifontprev"><b>Boca Juniors 2 - 1 River</b><span>Valoración 84 · ID 108893 · €12,5 M</span></p></div>`;
}
async function uiFontFromFile(file) {
  const buf = await file.arrayBuffer(), ff = new FontFace('EditorFuentePropia', buf); await ff.load();
  for (const x of [...document.fonts]) if (x.family.replace(/"/g, '') === 'EditorFuentePropia' && x !== ff) document.fonts.delete(x);
  document.fonts.add(ff); UI_FONT_FILE = file.name.replace(/\.[^.]+$/, '');
  await idbSet('uiFont', { name: UI_FONT_FILE, buf }); return UI_FONT_FILE;
}
const UI = () => {
  // v3: cada estilo gráfico tiene su fuente (Moderno: Outfit · PES 6: QuickExpress · Retro: pixel · Clásico: Tahoma)
  if (PREFS.ui && (PREFS.ui.fontV || 0) < 3) { const o = PREFS.ui.font; delete PREFS.ui.font; PREFS.ui.fonts = {}; if (o && (o.file || (o.name && !o.pes))) PREFS.ui.fonts.moderno = o.file ? { file: true } : { name: o.name }; PREFS.ui.fontOn = { display: true, body: true, mono: false }; PREFS.ui.fontV = 3; }
  return (PREFS.ui = Object.assign({}, UI_DEF, PREFS.ui || {}));
};
// --- color ---
const uiRgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, c => c + c); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgbHex = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
function rgbHsl([r, g, b]) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
function hslHex(h, s, l) { h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l)); const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return rgbHex([f(0) * 255, f(8) * 255, f(4) * 255]); }
const hexHsl = h => rgbHsl(uiRgb(h));
function mixHsl(a, b, t) { // mezcla por el camino corto del círculo cromático (no ensucia como la mezcla RGB)
  const A = hexHsl(a), B = hexHsl(b); let dh = B[0] - A[0]; if (dh > 180) dh -= 360; if (dh < -180) dh += 360;
  if (A[1] < .06) A[0] = B[0]; if (B[1] < .06) dh = 0;
  return hslHex(A[0] + dh * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
// mezcla perceptual (OKLab): de un acento a otro sin pasar por tonos raros
const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
function toLab(h) { const [r, g, b] = uiRgb(h).map(lin); const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b); return [.2104542553 * l + .793617785 * m - .0040720468 * s, 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, .0259040371 * l + .7827717662 * m - .808675766 * s]; }
function fromLab([L, a, b]) { const l = (L + .3963377774 * a + .2158037573 * b) ** 3, m = (L - .1055613458 * a - .0638541728 * b) ** 3, s = (L - .0894841775 * a - 1.291485548 * b) ** 3; const enc = v => { v = Math.max(0, Math.min(1, v)); return 255 * (v <= .0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - .055); }; return rgbHex([enc(4.0767416621 * l - 3.3077115913 * m + .2309699292 * s), enc(-1.2684380046 * l + 2.6097574011 * m - .3413193965 * s), enc(-.0041960863 * l - .7034186147 * m + 1.707614701 * s)]); }
const mixLab = (a, b, t) => { const A = toLab(a), B = toLab(b); return fromLab(A.map((v, i) => v + (B[i] - v) * t)); };
const mixRgb = (a, b, t) => { const A = uiRgb(a), B = uiRgb(b); return rgbHex(A.map((v, i) => v + (B[i] - v) * t)); };
const lum = h => { const c = uiRgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const isDarkUi = () => document.documentElement.dataset.theme === 'dark' || (document.documentElement.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
// lleva un color del equipo a algo legible como acento (amarillo puro sobre blanco no se lee: se oscurece)
function accentFrom(hex, dark) {
  const [h, s, l] = hexHsl(hex); if (s < .16 || (l > .93 || l < .06) && s < .5) return null;
  const lo = dark ? .55 : .3, hi = dark ? .72 : .42, L = Math.max(lo, Math.min(hi, l));
  return { hex: hslHex(h, Math.min(.88, Math.max(.5, s)), L), cost: Math.abs(L - l) - s * .25 };
}
function uiTeam() { const u = UI(); const id = u.follow ? S.team : u.pin; return S.ix && id != null ? S.ix.teamById.get(id) || null : null; }
function uiTeamColors(t) {
  if (!t) return null; const u = UI();
  const k = typeof kitFor === 'function' && KITS.map && KITS.map.has(t.id) ? kitFor(t, false) : null;
  const c1 = u.src === 'kit' && k ? k.c1 : teamColor(t, 1), c2 = u.src === 'kit' && k ? k.c2 : teamColor(t, 2);
  return { c1, c2 };
}
function uiPalette() {
  const u = UI(), dark = isDarkUi(), B = UI_BASES[u.base] || UI_BASES.verde, t = uiTeam(), tc = uiTeamColors(t);
  const baseAcc = dark ? B.ad : B.al, k = u.mix / 100, tint = u.tint / 100;
  let acc = baseAcc, acc2 = dark ? mixHsl(B.ad, '#ffffff', .25) : mixHsl(B.al, '#000000', .2), teamHue = null, teamSat = 0;
  if (tc) {
    const a1 = accentFrom(tc.c1, dark), a2 = accentFrom(tc.c2, dark);
    let main = u.src === 'c2' ? a2 || a1 : u.src === 'c1' || u.src === 'kit' ? a1 || a2 : (a1 && a2 ? (a1.cost <= a2.cost ? a1 : a2) : a1 || a2);
    const other = main === a1 ? a2 : a1;
    if (main) { acc = mixLab(baseAcc, main.hex, k); teamHue = hexHsl(main.hex)[0]; teamSat = hexHsl(main.hex)[1]; }
    if (other) acc2 = mixLab(acc2, other.hex, k);
    else if (main) acc2 = mixLab(acc2, hslHex(teamHue, .35, dark ? .7 : .3), k);
  }
  // neutros: tono de la paleta base, corrido hacia el tono del equipo según "fondos teñidos"
  let h = B.h, s = B.s;
  if (teamHue != null && tint) { let dh = teamHue - h; if (dh > 180) dh -= 360; if (dh < -180) dh += 360; h += dh * tint; s = s + (Math.min(.34, teamSat * .4) - s) * tint; }
  const N = dark
    ? { bg: hslHex(h, s * 1.1, .062), panel: hslHex(h, s, .097), sunk: hslHex(h, s, .078), line: hslHex(h, s * .9, .18), ink: hslHex(h, s * .5, .9), muted: hslHex(h, s * .45, .62), barlo: hslHex(h, s * .9, .18) }
    : { bg: hslHex(h, s, .925), panel: hslHex(h, s * .5, .993), sunk: hslHex(h, s * .8, .962), line: hslHex(h, s * .9, .845), ink: hslHex(h, s * 1.2, .11), muted: hslHex(h, s * .7, .38), barlo: hslHex(h, s * .8, .85) };
  const ah = hexHsl(acc);
  return { dark, acc, acc2, N, ink: lum(acc) > .36 ? hslHex(ah[0], .5, .08) : '#ffffff', soft: mixRgb(acc, N.panel, dark ? .8 : .84), sel: mixRgb(acc, N.panel, dark ? .87 : .9),
    neon: mixLab('#16d98a', hslHex(ah[0], Math.max(.75, ah[1]), dark ? .58 : .5), k), team: t, tc };
}
let UI_KEY = '';
function uiTheme(force) {
  const u = UI(), root = document.documentElement, st = root.style;
  if (u.mode === 'auto') delete root.dataset.theme; else root.dataset.theme = u.mode;
  root.classList.toggle('cdark', isDarkUi());
  const t = uiTeam(), key = JSON.stringify([u, t && t.id, t && teamColor(t, 1), t && teamColor(t, 2), isDarkUi()]);
  if (key === UI_KEY && !force) return; const first = !UI_KEY; UI_KEY = key;
  st.setProperty('--r', { recto: '3px', normal: '8px', redondo: '14px' }[u.r] || '8px');
  st.setProperty('--fs', (u.fs || 14) + 'px');
  const plain = u.base === 'verde' && !u.tint && (!u.mix || !t);
  const vars = ['--accent', '--accent-ink', '--accent-soft', '--sel', '--neon', '--accent2', '--bg', '--panel', '--sunk', '--line', '--ink', '--muted', '--bar-lo'];
  if (!first && !ANIM.reduce.matches) { root.classList.add('uifade'); clearTimeout(uiTheme.tm); uiTheme.tm = setTimeout(() => root.classList.remove('uifade'), 750); }
  if (plain) { vars.forEach(v => st.removeProperty(v)); }
  else {
    const P = uiPalette();
    st.setProperty('--accent', P.acc); st.setProperty('--accent-ink', P.ink); st.setProperty('--accent-soft', P.soft); st.setProperty('--sel', P.sel); st.setProperty('--neon', P.neon); st.setProperty('--accent2', P.acc2);
    if (u.base === 'verde' && !u.tint) ['--bg', '--panel', '--sunk', '--line', '--ink', '--muted', '--bar-lo'].forEach(v => st.removeProperty(v));
    else { st.setProperty('--bg', P.N.bg); st.setProperty('--panel', P.N.panel); st.setProperty('--sunk', P.N.sunk); st.setProperty('--line', P.N.line); st.setProperty('--ink', P.N.ink); st.setProperty('--muted', P.N.muted); st.setProperty('--bar-lo', P.N.barlo); }
  }
  const tc = uiTeamColors(t); st.setProperty('--team1', tc ? tc.c1 : 'var(--accent)'); st.setProperty('--team2', tc ? tc.c2 : 'var(--accent2, var(--accent))');
  const mc = document.querySelector('meta[name="theme-color"]'); if (mc) mc.content = getComputedStyle(root).getPropertyValue('--panel').trim();
  uiLogo();
  const pn = $('uiPanel'); if (pn && !pn.hidden) { if (document.activeElement && document.activeElement.type === 'range' && $('uiPrev')) $('uiPrev').innerHTML = uiPrevHtml(uiPalette()); else uiPanelFill(true); }
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => uiTheme(true));
// --- panel ---
// botones grandes con dibujo: se entiende qué hace cada uno sin leer
const uiTiles = (id, items, v) => `<div class="uitiles" id="${id}">${items.map(([k, n, ic]) => `<button type="button" data-v="${k}" aria-pressed="${String(v) === String(k)}"><span class="uiic" aria-hidden="true">${ic}</span><span>${n}</span></button>`).join('')}</div>`;
const UI_FS_TILES = [[13, 'Chica', '<span style="font-size:.8rem">Aa</span>'], [14, 'Normal', '<span style="font-size:1rem">Aa</span>'], [15, 'Grande', '<span style="font-size:1.2rem">Aa</span>'], [16, 'Muy grande', '<span style="font-size:1.4rem">Aa</span>']];
function uiPanelHtml() {
  const u = UI(), t = uiTeam(), P = uiPalette(), cur = S.ix && S.team != null ? S.ix.teamById.get(S.team) : null;
  // con los estilos Clásico, Retro o PES 6 los colores los pone el estilo: solo se ajusta el tamaño de letra y los efectos
  const gm = typeof GFX === 'function' ? GFX() : { mode: 'moderno' };
  if (gm.mode !== 'moderno') {
    const nm = (GFX_MODES.find(m => m.k === gm.mode) || {}).n || gm.mode;
    return `<div class="uihead"><h3>🎨 Apariencia</h3><button class="btn ghost small" type="button" id="uiClose" aria-label="Cerrar">✕</button></div>
      <div class="uisec"><p class="note" style="margin:0">Estás usando el estilo <b>${esc(nm)}</b>, que trae sus propios colores, fondo y bordes. Acá podés cambiar el tamaño de la letra, la fuente y la cantidad de efectos.</p>
        <button class="btn small" type="button" id="uiToModern">Volver al estilo Moderno para cambiar colores</button></div>
      <div class="uisec"><span class="lab">🔤 Tamaño de letra</span>${uiTiles('uiFs', UI_FS_TILES, u.fs)}</div>
      ${uiFontHtml(false)}
      <div class="uisec"><span class="lab">✨ Efectos</span>${uiTiles('uiQ', [['low', 'Pocos (más rápido)', '🐢'], ['mid', 'Normales', '⚖️'], ['high', 'Todos', '🚀']], gm.q)}
        <p class="note" style="margin:0">Es la misma "Calidad gráfica" del botón 🖥️ Gráficos.</p></div>
      ${uiCacheHtml(false)}`;
  }
  const sw = (c, n) => `<span class="uisw" style="background:${c}" title="${n}: ${c}"></span>`;
  // botones grandes con dibujo: se entiende qué hace cada uno sin leer
  const tiles = uiTiles;
  const grp = (ic, title, body, note) => `<section class="uigrp"><h4 class="uih"><span class="uihi" aria-hidden="true">${ic}</span>${title}</h4>${note ? `<p class="note uinote">${note}</p>` : ''}${body}</section>`;
  const mock = (bg, pn, ac) => `<span class="uimock" aria-hidden="true" style="--mb:${bg};--mp:${pn};--ma:${ac}"><i></i><b></b><em></em></span>`;
  const base = ([k, b]) => { const h = b.h, sa = b.s, bg = P.dark ? hslHex(h, sa * 1.1, .062) : hslHex(h, sa, .925), pn = P.dark ? hslHex(h, sa, .097) : hslHex(h, sa * .5, .993);
    return `<button type="button" data-v="${k}" aria-pressed="${u.base === k}" title="Paleta ${esc(b.n)}">${mock(bg, pn, P.dark ? b.ad : b.al)}<span class="uibn">${b.n}</span><span class="uick" aria-hidden="true">✓</span></button>`; };
  const tc = P.tc || {}, dot = c => c ? `<i class="uidot" style="background:${c}"></i>` : '<i class="uidot uidot0"></i>';
  return `<div class="uihead"><h3>🎨 Apariencia</h3><button class="btn ghost small" type="button" id="uiClose" aria-label="Cerrar">✕</button></div>
    ${grp('🌓', 'Modo', tiles('uiMode', [['auto', 'Automático', '🖥️'], ['light', 'Claro', '☀️'], ['dark', 'Oscuro', '🌙']], u.mode), 'Automático sigue al modo de Windows.')}
    ${grp('🖌️', 'Paleta del editor', `<div class="uibases" id="uiBase">${Object.entries(UI_BASES).map(base).join('')}</div>`)}
    ${grp('🛡️', 'Colores del equipo', `<div class="uiteam">${t ? `${crest(t, 'mini')}<span><b>${esc(tget(t, 'name'))}</b><span class="sub">${u.follow ? 'Cambia solo cuando abrís otro equipo' : 'Fijado: no cambia al abrir otros equipos'}</span></span>` : `<span class="sub">Abrí un equipo en la pestaña Equipos o Selecciones para mezclar sus colores.</span>`}
      <label class="chk"><input type="checkbox" id="uiFollow" ${u.follow ? 'checked' : ''}> Seguir al equipo que abrís</label>${!u.follow && cur && cur !== t ? `<button class="btn small" type="button" id="uiPinCur">Usar ${esc(tget(cur, 'name'))}</button>` : ''}</div>
      <span class="lab">Color que manda</span>${tiles('uiSrc', [['auto', 'Automático', '✨'], ['c1', 'Principal', dot(tc.c1)], ['c2', 'Secundario', dot(tc.c2)], ['kit', 'Kit local', '👕']], u.src)}
      <label class="lab" for="uiMix">Mezcla con el equipo <b id="uiMixV">${u.mix}%</b></label><input type="range" id="uiMix" min="0" max="100" step="5" value="${u.mix}">
      <div class="uiscale"><span>Solo el editor</span><span>Solo el equipo</span></div>
      <label class="lab" for="uiTint">Fondos teñidos <b id="uiTintV">${u.tint}%</b></label><input type="range" id="uiTint" min="0" max="100" step="5" value="${u.tint}">
      <span class="lab">Así queda</span><div class="uiprev" id="uiPrev">${uiPrevHtml(P)}</div>
      <button class="btn small" type="button" id="uiTry" ${t ? '' : 'disabled'}>✨ Probar mezcla sugerida</button>`, 'Si un color no se lee bien sobre el fondo, se aclara u oscurece solo.')}
    ${grp('🔤', 'Letra', `${uiFontHtml(true)}<span class="lab">Tamaño</span>${tiles('uiFs', UI_FS_TILES, u.fs)}`)}
    ${grp('⬜', 'Esquinas', tiles('uiR', [['recto', 'Rectas', '<i class="uicorner" style="border-radius:0"></i>'], ['normal', 'Normales', '<i class="uicorner" style="border-radius:5px"></i>'], ['redondo', 'Redondas', '<i class="uicorner" style="border-radius:11px"></i>']], u.r))}
    ${uiCacheHtml(true)}
    <button class="btn small ghost uireset" type="button" id="uiReset">↺ Volver a lo original</button>`;
}
// versión, fotos y escudos guardados y el botón "Borrar caché" (en todos los modos gráficos)
function uiCacheHtml(grp) {
  if (typeof cacheClear !== 'function' || !UPD.on) return '';
  const note = 'Si algo se ve viejo o raro, borrá la caché: el editor se recarga con la última versión. Tus ajustes y el EDIT no se tocan.', body = `<div class="uicache" id="uiCache"><span class="sub">Calculando…</span></div><button class="btn small" type="button" id="uiCacheClear">🧹 Borrar caché</button>`;
  return grp ? `<section class="uigrp"><h4 class="uih"><span class="uihi" aria-hidden="true">🧹</span>Caché</h4><p class="note uinote">${note}</p>${body}</section>`
    : `<div class="uisec"><span class="lab">🧹 Caché</span><p class="note" style="margin:0">${note}</p>${body}</div>`;
}
async function uiCacheFill() {
  const el = $('uiCache'); if (!el) return;
  const c = await cacheInfo(), d = UPD.when ? updDate(UPD.when) : '';
  el.innerHTML = `<span><b>Versión</b><i data-noi18n>v${APP_VER} alpha${d ? ' · ' + d : ''}</i></span><span><b>Fotos y escudos guardados</b><i>${c.imgs}</i></span>${c.mb ? `<span><b>Espacio usado</b><i>${c.mb < 10 ? c.mb.toFixed(1) : Math.round(c.mb)} MB</i></span>` : ''}`;
}
function uiPrevHtml(P) {
  const sw = (c, n) => `<span class="uisw" style="background:${c}" title="${n}: ${c}"></span>`;
  return `<div class="row" style="gap:6px">${sw(P.N.bg, 'Fondo')}${sw(P.N.panel, 'Paneles')}${sw(P.acc, 'Acento')}${sw(P.acc2, 'Acento 2')}${sw(P.neon, 'Brillo')}</div>
      <div class="row" style="gap:6px"><button class="btn small primary" type="button" tabindex="-1">Guardar</button><span class="chip ok">Editado</span><span class="seg"><button type="button" aria-pressed="true" tabindex="-1">Titulares</button><button type="button" aria-pressed="false" tabindex="-1">Banco</button></span></div>`;
}
function uiPanelFill(keepFocus) {
  const pn = $('uiPanel'), fid = keepFocus && document.activeElement && pn.contains(document.activeElement) ? document.activeElement.id : null;
  pn.innerHTML = uiPanelHtml(); musUi(); uiCacheFill();
  if (fid && $(fid)) $(fid).focus();
}
function uiSet(o) { Object.assign(UI(), o); savePrefs(); uiTheme(); }
function uiPanelToggle(open) {
  let pn = $('uiPanel');
  if (!pn) {
    pn = document.createElement('aside'); pn.id = 'uiPanel'; pn.className = 'uipanel'; pn.hidden = true; pn.setAttribute('aria-label', 'Apariencia'); document.body.appendChild(pn);
    pn.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.id === 'uiClose') return uiPanelToggle(false);
      if (b.id === 'uiCacheClear') return cacheClear();
      if (b.id === 'uiReset') { PREFS.ui = Object.assign({}, UI_DEF, { fonts: {} }); savePrefs(); uiFontApply(); uiTheme(true); return; }
      if (b.id === 'uiTry') { uiSet({ mix: 100, tint: 30 }); return; }
      if (b.id === 'uiPinCur') { uiSet({ pin: S.team }); return; }
      if (b.id === 'uiToModern') { GFX().mode = 'moderno'; savePrefs(); gfxApply(true); uiPanelFill(); return; }
      if (b.closest('#uiQ') && b.dataset.v) { GFX().q = b.dataset.v; savePrefs(); gfxApply(true); b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); return; }
      const sg = b.closest('#uiMode,#uiBase,#uiSrc,#uiR,#uiFs'); if (!sg || b.dataset.v == null) return;
      const k = { uiMode: 'mode', uiBase: 'base', uiSrc: 'src', uiR: 'r', uiFs: 'fs' }[sg.id]; uiSet({ [k]: k === 'fs' ? +b.dataset.v : b.dataset.v });
    });
    pn.addEventListener('input', e => { const el = e.target; if (el.id === 'uiMix' || el.id === 'uiTint') { $(el.id + 'V').textContent = el.value + '%'; uiSet({ [el.id === 'uiMix' ? 'mix' : 'tint']: +el.value }); } });
    pn.addEventListener('change', e => { if (e.target.id === 'uiFollow') uiSet({ follow: e.target.checked, pin: e.target.checked ? null : S.team });
      if (e.target.id === 'uiFont') { const v = e.target.value; uiFontSetCur(!v ? null : v === 'file' ? { file: true } : v.startsWith('s:') ? { set: v.slice(2) } : { name: v.slice(2) }); } });
    pn.addEventListener('click', async e => {
      const ch = e.target.closest('#uiFontOn [data-k]'); if (ch) { const u = UI(); u.fontOn = Object.assign({}, u.fontOn, { [ch.dataset.k]: !(u.fontOn || {})[ch.dataset.k] }); ch.setAttribute('aria-pressed', u.fontOn[ch.dataset.k]); savePrefs(); uiFontApply(); return; }
      if (e.target.closest('#uiFontLoad')) { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.ttf,.otf,.woff,.woff2'; inp.onchange = async () => { const f = inp.files[0]; if (!f) return; try { const n = await uiFontFromFile(f); uiFontSetCur({ file: true }); uiPanelFill(true); toast('Fuente ' + n + ' aplicada a la página.'); } catch (er) { toast('No se pudo usar esa fuente: ' + er.message, 6000); } }; inp.click(); }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pn.hidden) uiPanelToggle(false); });
    document.addEventListener('pointerdown', e => { if (!pn.hidden && !pn.contains(e.target) && !e.target.closest('#bUi')) uiPanelToggle(false); });
  }
  open = open == null ? pn.hidden : open;
  if (open) { if ($('gfxPanel') && !$('gfxPanel').hidden) gfxPanelToggle(false); uiPanelFill(); pn.hidden = false; requestAnimationFrame(() => pn.classList.add('on')); const f = pn.querySelector('#uiMode [aria-pressed="true"]'); f && f.focus(); }
  else { pn.classList.remove('on'); setTimeout(() => { if (!pn.classList.contains('on')) pn.hidden = true; }, 220); }
  const b = $('bUi'); if (b) b.setAttribute('aria-expanded', open);
}
(() => {
  const b = $('bUi'); if (b) b.onclick = () => uiPanelToggle(); gfxApply(); { const g = $('bGfx'); if (g) g.onclick = () => gfxPanelToggle(); } uiTheme(true); uiLogo(); uiFontLoadSaved(); { const si = $('siderIco'); if (si && typeof SIDER_ICON !== 'undefined') si.src = SIDER_ICON; } if (typeof newsBadge === 'function') newsBadge(); mpInit(); if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && location.hostname !== 'localhost') navigator.serviceWorker.register('sw.js').catch(() => { });
  // al abrir la página: introducción y búsqueda automática del EDIT
  pesStart();
  // el logo vuelve al principio: pestaña Equipos y arriba de todo
  const h = $('bHome'); if (h) h.onclick = () => { if (S.tab !== 'teams') setTab('teams'); window.scrollTo({ top: 0, behavior: ANIM.reduce.matches ? 'auto' : 'smooth' }); const l = document.querySelector('#teamItems'); if (l) l.scrollTo({ top: 0, behavior: 'smooth' }); };
})();
