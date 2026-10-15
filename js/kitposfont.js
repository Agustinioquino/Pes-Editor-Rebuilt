// ===================== Creador de fuentes para KitPos (Kit Studio Pro › Fuentes) =====================
// KitPos (módulo de Sider) dibuja el nombre de la camiseta con una fuente propia cuando la carpeta del kit tiene
// kitpos_letras.txt: una línea por letra con  código_utf8_hex  ancho  alto  u0 v0 u1 v1  (dónde está la letra dentro de
// la textura del nombre, la de NameFontFile). Así entran minúsculas, acentos, cirílico y griego.
// La textura que arma KitPos: 4096 px de ancho, filas de 256 px; cada letra ocupa 2×ancho+4 px (2 de margen a cada
// lado), entre letra y letra quedan 16 px y "alto" es siempre 124. La línea de base queda a 200 px del borde de arriba.
// La parte sin DOM (tabla, ubicación, .dds y .zip) se prueba en Node: test/kitposfont.test.js.
const KPF = (() => {
  const W = 4096, ROW = 256, X0 = 8, GAP = 16, BASE = 200, CAP = 150, HUNITS = 124, MAX = 512;
  const SETS = [
    { k: 'basic', n: 'Básico', d: 'A–Z, a–z, 0–9, espacio, punto, guion, apóstrofo y guion bajo', chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .-'_", fixed: true },
    { k: 'latin', n: 'Acentos', d: 'Español, portugués, francés, alemán, italiano, nórdico', chars: 'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿŒœŸ' },
    { k: 'central', n: 'Europa central y Turquía', d: 'Polaco, checo, eslovaco, húngaro, rumano, croata, serbio latino, turco, báltico', chars: 'ĂăĄąĆćČčĎďĐđĘęĚěĞğİıĹĺĽľŁłŃńŇňŐőŔŕŘřŚśŞşŠšŢţŤťŮůŰűŹźŻżŽžȘșȚțƏəĀāĒēĪīŪūĢģĶķĻļŅņĖėĮįŲų' },
    { k: 'cyr', n: 'Cirílico', d: 'Ruso, ucraniano, búlgaro, serbio', chars: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюяЄєІіЇїЎўЂђЈјЉљЊњЋћЏџҐґ' },
    { k: 'greek', n: 'Griego', d: 'Mayúsculas y minúsculas con tildes', chars: 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρσςτυφχψωΆΈΉΊΌΎΏάέήίόύώΪΫϊϋΐΰ' },
  ];
  function chars(on) { const seen = new Set(), out = []; for (const s of SETS) if (s.fixed || on[s.k]) for (const c of s.chars) if (!seen.has(c)) { seen.add(c); out.push(c); } return out; }
  const hex = ch => [...new TextEncoder().encode(ch)].map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('');
  const unhex = h => { const b = new Uint8Array(h.length >> 1); for (let i = 0; i < b.length; i++) b[i] = parseInt(h.substr(i * 2, 2), 16); return new TextDecoder().decode(b); };
  // ubica las letras en filas de 256 px: metrics = [{ ch, w }] (w en unidades de KitPos, la mitad de los píxeles)
  function layout(metrics) {
    const cells = []; let x = X0, row = 0;
    for (const m of metrics) { const span = 2 * m.w + 4; if (x + span > W - X0 && x > X0) { row++; x = X0; } cells.push({ ch: m.ch, w: m.w, x, row, span }); x += span + GAP; }
    const rows = row + 1; if (rows * ROW > 4096) throw new Error('Son demasiadas letras para una textura de 4096 px: sacá algún idioma o achicá el ancho.');
    return { cells, rows, W, H: Math.max(512, 2 ** Math.ceil(Math.log2(rows * ROW))) };
  }
  const f6 = v => v.toFixed(6);
  function letrasTxt(L, label) {
    const out = ['; kitpos_letras.txt - tabla de letras de la fuente del nombre de este kit (KitPos 6.4 o superior)',
      `; fuente: ${String(label || 'sin nombre').replace(/\s*[\r\n;]+\s*/g, ' ')} | atlas ${L.W}x${L.H}, filas de ${ROW} px | ${L.cells.length} letras`,
      '; creada con PES Editor Rebuilt (Kit Studio Pro > Fuentes)', '; codigo_utf8_hex  ancho  alto  u0 v0 u1 v1'];
    for (const c of L.cells) out.push(`${hex(c.ch)} ${c.w} ${HUNITS} ${f6(c.x / L.W)} ${f6(c.row * ROW / L.H)} ${f6((c.x + c.span) / L.W)} ${f6((c.row + 1) * ROW / L.H)}    ; ${c.ch}`);
    return out.join('\r\n') + '\r\n';
  }
  // lee kitpos_letras.txt o minusculas.txt (mismo formato; igual que el lector de kitpos.lua)
  function parseLetras(txt) {
    const out = [];
    for (const ln of String(txt || '').split(/\r?\n/)) {
      const m = ln.match(/^\s*([0-9A-Fa-f]+)\s+(\d+)\s+(\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
      if (!m || m[1].length % 2 || out.length >= MAX) continue; let ch; try { ch = unhex(m[1]); } catch { continue; }
      out.push({ ch, code: m[1].toUpperCase(), w: +m[2], h: +m[3], u0: +m[4], v0: +m[5], u1: +m[6], v1: +m[7] });
    }
    return out;
  }
  // tabla letra → recorte en píxeles de una textura de cw×ch (la del editor puede estar achicada)
  function glyphMap(list, cw, chh) { const m = new Map(); for (const e of list) m.set(e.ch, { sx: e.u0 * cw, sy: e.v0 * chh, sw: (e.u1 - e.u0) * cw, sh: (e.v1 - e.v0) * chh, w: e.w }); return m; }
  // .zip sin comprimir con varios archivos ([{ name, data: Uint8Array }])
  const CRCT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = d => { let c = 0xffffffff; for (let i = 0; i < d.length; i++) c = CRCT[(c ^ d[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function zipMany(files) {
    const parts = [], cen = []; let off = 0;
    for (const f of files) {
      const nb = new TextEncoder().encode(f.name), d = typeof f.data === 'string' ? new TextEncoder().encode(f.data) : f.data, crc = crc32(d);
      const lh = new DataView(new ArrayBuffer(30)); lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x800, true); lh.setUint32(14, crc, true); lh.setUint32(18, d.length, true); lh.setUint32(22, d.length, true); lh.setUint16(26, nb.length, true);
      const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x800, true); ch.setUint32(16, crc, true); ch.setUint32(20, d.length, true); ch.setUint32(24, d.length, true); ch.setUint16(28, nb.length, true); ch.setUint32(42, off, true);
      parts.push(new Uint8Array(lh.buffer), nb, d); cen.push(new Uint8Array(ch.buffer), nb); off += 30 + nb.length + d.length;
    }
    const cs = cen.reduce((a, b) => a + b.length, 0), end = new DataView(new ArrayBuffer(22)); end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cs, true); end.setUint32(16, off, true);
    const all = [...parts, ...cen, new Uint8Array(end.buffer)], out = new Uint8Array(all.reduce((a, b) => a + b.length, 0)); let p = 0; for (const a of all) { out.set(a, p); p += a.length; } return out;
  }

  // ---- dibujo (solo en el navegador) ----
  const famCss = f => `"${String(f).replace(/["\\]/g, '')}", sans-serif`;
  const fontCss = (o, px) => `${o.italic ? 'italic ' : ''}${o.weight || 700} ${px}px ${famCss(o.font)}`;
  const UPPER_IMG = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ.';
  // letras de una textura con el formato del juego (A–Z y punto): se recortan con las casillas de KFONT
  function imgGlyphs(img) {
    if (!img || typeof KFONT === 'undefined') return null;
    const H = KFONT.glyph(img, 'name', 'H'), T = KFONT.glyph(img, 'name', 'T'); if (!H || !T) return null;
    const c1 = KFONT.cell('name', 'H', img.width, img.height), c2 = KFONT.cell('name', 'T', img.width, img.height);
    const base = { 1: H.sy + H.sh - c1[1], 2: T.sy + T.sh - c2[1] }, cap = H.sh, m = new Map();
    for (const ch of UPPER_IMG) { const q = KFONT.glyph(img, 'name', ch); if (!q) continue; const c = KFONT.cell('name', ch, img.width, img.height), r = c[1] === c1[1] ? 1 : 2; m.set(ch, { ...q, top: (q.sy - c[1]) - base[r], cap }); }
    return m;
  }
  function tinted(o) { // las letras de la imagen pintadas con el color de relleno (se conserva la forma y la transparencia)
    if (!o.img || !o.imgTint) return o.img; if (o.img.__tint && o.img.__tint.k === o.fill) return o.img.__tint.c;
    const c = document.createElement('canvas'); c.width = o.img.width; c.height = o.img.height; const g = c.getContext('2d'); g.drawImage(o.img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = o.fill; g.fillRect(0, 0, c.width, c.height);
    o.img.__tint = { k: o.fill, c }; return c;
  }
  function render(o, list) {
    const mc = document.createElement('canvas').getContext('2d'), wS = o.width || 1, capPx = CAP * (o.size || 1);
    mc.font = fontCss(o, 100); const capRef = mc.measureText('H').actualBoundingBoxAscent || 70, fs = 100 * capPx / capRef; mc.font = fontCss(o, fs);
    const ext = (+o.stroke1 || 0) + (+o.stroke2 || 0), sh = +o.shadow || 0, IG = o.img ? imgGlyphs(o.img) : null, src = IG ? tinted(o) : null;
    const metrics = list.map(ch => {
      const up = ch.toUpperCase(), q = IG && (IG.get(ch) || (o.imgSmall && ch !== up && up.length === 1 && IG.get(up)));
      if (q) { const k = capPx / q.cap * (IG.has(ch) ? 1 : .76), bear = capPx * .05, adv = q.sw * k * wS + bear * 2; return { ch, left: 0, right: adv, img: { q, k, bear } }; }
      const m = mc.measureText(ch), adv = m.width * wS;
      if (ch === ' ') return { ch, left: 0, right: adv };
      const bl = (m.actualBoundingBoxLeft || 0) * wS, br = (m.actualBoundingBoxRight || adv) * wS;
      return { ch, left: Math.min(0, -bl - ext), right: Math.max(adv, br + ext) + sh };
    }).map(x => Object.assign(x, { w: Math.max(1, Math.ceil((x.right - x.left) / 2)) }));
    const L = layout(metrics), c = document.createElement('canvas'); c.width = L.W; c.height = L.H;
    const g = c.getContext('2d', { willReadFrequently: true }); g.font = fontCss(o, fs); g.textBaseline = 'alphabetic'; g.lineJoin = 'round'; g.miterLimit = 2;
    const fill = () => { if (!o.grad) return o.fill; const gr = g.createLinearGradient(0, -capPx, 0, 0); gr.addColorStop(0, o.fill); gr.addColorStop(1, o.fill2 || o.fill); return gr; };
    L.cells.forEach((cell, i) => {
      const mt = metrics[i], ox = cell.x + 2 - mt.left, by = cell.row * ROW + BASE + (+o.lift || 0);
      if (mt.img) { const { q, k, bear } = mt.img; g.drawImage(src, q.sx, q.sy, q.sw, q.sh, ox + bear, by + q.top * k, q.sw * k * wS, q.sh * k); return; }
      if (cell.ch === ' ') return;
      g.save(); g.translate(ox, by); g.scale(wS, 1);
      const draw = (style, lw) => { if (lw) { g.lineWidth = lw; g.strokeStyle = style; g.strokeText(cell.ch, 0, 0); } g.fillStyle = style; g.fillText(cell.ch, 0, 0); };
      if (sh) { g.save(); g.translate(sh / wS, sh); draw(o.shadowColor || '#000000', ext * 2); g.restore(); }
      if (o.stroke2) draw(o.color2, ((+o.stroke1 || 0) + (+o.stroke2)) * 2);
      if (o.stroke1) draw(o.color1, (+o.stroke1) * 2);
      g.fillStyle = fill(); g.fillText(cell.ch, 0, 0);
      g.restore();
    });
    // donde no hay letra el color es el del relleno (si no, al achicarse la textura los bordes se oscurecen)
    const im = g.getImageData(0, 0, L.W, L.H), d = im.data, fc = (o.fill || '#ffffff').match(/[0-9a-f]{2}/gi).map(h => parseInt(h, 16));
    for (let i = 0; i < d.length; i += 4) if (!d[i + 3]) { d[i] = fc[0]; d[i + 1] = fc[1]; d[i + 2] = fc[2]; }
    g.putImageData(im, 0, 0);
    const label = (o.img ? (o.imgName || 'imagen') + ' + ' : '') + o.font + (o.italic ? ' cursiva' : '');
    c.__kp = glyphMap(letrasTxtList(L), L.W, L.H);
    return { canvas: c, L, px: d, txt: letrasTxt(L, label) };
  }
  const letrasTxtList = L => L.cells.map(c => ({ ch: c.ch, w: c.w, u0: c.x / L.W, v0: c.row * ROW / L.H, u1: (c.x + c.span) / L.W, v1: (c.row + 1) * ROW / L.H }));
  // escribe un texto con una fuente de KitPos (respeta mayúsculas y minúsculas); (cx, cy) es el centro de las mayúsculas, h su alto
  function drawText(g, tex, text, cx, cy, h, { stretch = 1, spacing = 0, curve = 0 } = {}) {
    const map = tex.__kp, chs = [...String(text)].map(ch => map.get(ch) || map.get(ch.toUpperCase()) || (ch === ' ' ? null : map.get('?')) || null);
    const ref = chs.find(Boolean) || map.values().next().value; if (!ref) return;
    const R = ref.sh, k = h / (R * CAP / ROW), ws = chs.map((q, i) => q ? q.sw * k * stretch : (String(text)[i] === ' ' ? h * .35 : 0)), gap = spacing * h;
    const total = ws.reduce((a, b) => a + b, 0) + gap * Math.max(0, ws.length - 1); let x = cx - total / 2;
    chs.forEach((q, i) => {
      if (q) { const w = ws[i], off = curve ? curve * h * ((x + w / 2 - cx) / (total / 2 || 1)) ** 2 : 0; g.drawImage(tex, q.sx, q.sy, q.sw, q.sh, x, cy - (BASE - CAP / 2) / ROW * R * k + off, w, R * k); }
      x += ws[i] + gap;
    });
  }
  return { W, ROW, BASE, CAP, MAX, SETS, chars, hex, unhex, layout, letrasTxt, parseLetras, glyphMap, zipMany, render, drawText, fontCss, imgGlyphs };
})();

// ===================== La pantalla del creador =====================
const KPFS = { o: null, sets: { latin: true, central: true }, sample: 'Fernández', out: null, rev: 0, st: null, target: null, log: '', busy: false };
const KPF_SAMPLES = ['Fernández', 'Müller', 'Łukasiewicz', 'Ødegaard', 'Çalışkan', 'Šćepović', 'Иванов', 'Παπαδόπουλος', 'Nuñez Jr.'];
const KPF_PRESETS = {
  blanco: { n: 'Blanco', fill: '#ffffff', grad: false, stroke1: 0, stroke2: 0, shadow: 0 },
  negro: { n: 'Negro', fill: '#111111', grad: false, stroke1: 0, stroke2: 0, shadow: 0 },
  borde: { n: 'Con borde', fill: '#ffffff', grad: false, stroke1: 5, color1: '#0b1f4a', stroke2: 0, shadow: 0 },
  dorado: { n: 'Dorado', fill: '#ffe08a', fill2: '#b9861d', grad: true, stroke1: 2, color1: '#5a3d06', stroke2: 0, shadow: 0 },
  retro: { n: 'Retro', fill: '#fff6d8', grad: false, stroke1: 4, color1: '#c4161c', stroke2: 4, color2: '#ffffff', shadow: 0 },
  sombra: { n: 'Con sombra', fill: '#ffffff', grad: false, stroke1: 0, stroke2: 0, shadow: 6, shadowColor: '#000000' },
};
function kpfOpts() { return KPFS.o || (KPFS.o = { font: 'Saira Condensed', weight: 700, italic: false, width: 1, size: 1, fill: '#ffffff', fill2: '#c9d4e6', grad: false, stroke1: 0, color1: '#000000', stroke2: 0, color2: '#ffffff', shadow: 0, shadowColor: '#000000', img: null, imgName: '', imgSmall: true, imgTint: false }); }
// fuentes subidas: quedan guardadas en el navegador para la próxima vez
async function kpfLoadUserFonts() {
  if (KPFS.userFonts) return KPFS.userFonts; KPFS.userFonts = [];
  try { for (const f of (await idbGet('kpfFonts')) || []) { try { const ff = new FontFace(f.name, f.buf); await ff.load(); document.fonts.add(ff); KPFS.userFonts.push(f.name); } catch { } } } catch { }
  return KPFS.userFonts;
}
async function kpfAddFont(file) {
  const name = file.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim().slice(0, 60) || 'Fuente', buf = await file.arrayBuffer();
  const ff = new FontFace(name, buf); await ff.load(); document.fonts.add(ff);
  await kpfLoadUserFonts(); if (!KPFS.userFonts.includes(name)) KPFS.userFonts.unshift(name);
  try { const all = ((await idbGet('kpfFonts')) || []).filter(x => x.name !== name); all.unshift({ name, buf }); await idbSet('kpfFonts', all.slice(0, 12)); } catch { }
  kpfOpts().font = name; return name;
}
async function kpfAddImage(file) {
  const n = file.name.toLowerCase(), buf = await file.arrayBuffer();
  const img = n.endsWith('.ftex') ? await ftexDecode(buf, 4096) : n.endsWith('.dds') ? DDS.decode(buf) : await FTEXW.rawFromImage(new Blob([buf]));
  const c = imgToCanvas(img); if (!KPF.imgGlyphs(c)) throw new Error('no encontré las letras A–Z con el formato del juego (dos filas: A a N y O a Z con el punto).');
  Object.assign(kpfOpts(), { img: c, imgName: file.name.replace(/\.[^.]+$/, '') });
}
function kpfFontList() {
  const sys = (typeof KS_FONTS !== 'undefined' ? KS_FONTS : []).filter(f => { try { return f === 'Saira Condensed' || ksFontInstalled(f); } catch { return false; } });
  return [...(KPFS.userFonts || []), ...sys.filter(f => !(KPFS.userFonts || []).includes(f))];
}
// ---- pestaña Fuentes: el creador, aparte de Kit Studio Pro ----
// Equipos con carpeta en el kit-server (para probar e instalar la fuente en uno de sus kits)
function kpfTeams() {
  const out = [];
  for (const [id, k] of KITS.map) { if (!k || !k.path) continue; const t = S.f && S.ix && S.ix.teamById.get(+id), seg = String(k.path).split(/[\\/]/).pop();
    out.push({ id: +id, name: t ? tget(t, 'name') || seg : seg, path: k.path }); }
  return out.sort((x, y) => x.name.localeCompare(y.name, 'es'));
}
// abre la pestaña Fuentes con el equipo y el kit que se estaba viendo en Kit Studio Pro
function kpfGoto(t) { const k = t && KITS.map.get(t.id); if (k && k.path) { KPFS.team = t.id; KPFS.target = KS.team === t.id && KS.sel ? KS.sel : '*'; } setTab('fonts'); }
function renderFonts(m) {
  const rr = () => { if (S.tab === 'fonts') renderFonts(m); }; KPFS.rr = rr; ksRerender = () => later(rr);
  if (KPFS.team == null && KS.team != null && (KITS.map.get(KS.team) || {}).path) KPFS.team = KS.team;
  const k = KPFS.team != null && KITS.map.get(KPFS.team);
  if (k && k.path && KS.team !== KPFS.team && !KS.busy) { KS.team = KPFS.team; KS.cfg = null; KS.sel = null; ksLoad({ id: KPFS.team }).then(rr); }
  const has = !!(k && k.path && KS.cfg && KS.team === KPFS.team);
  m.innerHTML = `<section class="card kpfpage">${kpfHtml(has)}</section>`; kpfBind(m, has);
}
function kpfHtml(has) {
  const O = kpfOpts(), fonts = kpfFontList(), kitsAll = has ? [...KS.kits, ...KS.gk] : [];
  if (has && (!KPFS.target || (KPFS.target !== '*' && !kitsAll.includes(KPFS.target)))) KPFS.target = KS.sel || '*';
  const n = KPF.chars(KPFS.sets).length, rng = (id, lab, v, min, max, step, fmt) => `<div class="f"><label for="${id}">${lab} <output>${fmt(v)}</output></label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}"></div>`;
  const st = KPFS.st, row = (ok, b, txt, fix) => `<li class="${ok === true ? 'ok' : ok === false ? 'bad' : ok === 'info' ? 'info' : 'unk'}"><i aria-hidden="true">${ok === true ? '✓' : ok === false ? '✕' : ok === 'info' ? '•' : '?'}</i><span><b>${b}</b> ${txt}</span>${fix || ''}</li>`;
  const teams = kpfTeams(), loading = KPFS.team != null && !has && (KS.busy || (!KS.cfg && !KS.err)), sec = (i, t, body, cls = '') => `<div class="kpfsec ${cls}"><h5>${i ? `<i>${i}</i>` : ''}${t}</h5>${body}</div>`;
  const chip = (k, i, gk) => { const me = KS.meta[k]; return `<button type="button" class="kpfkit" data-kit="${esc(k)}" aria-pressed="${KPFS.target === k}" title="${esc(k)}">${shirtSvg(me || {}, '1.9em')}<span><b>${esc(k)}</b><small>${KS_ROLE(k, i, gk)}</small></span></button>`; };
  const step = KPFS.done ? 4 : has ? 3 : 2;
  return `<div class="kpf" id="kpfDrop">
    <header class="kpfhero"><div class="kpfht"><h2>🔤 Creador de fuentes</h2>
      <p class="note">La fuente del nombre de la camiseta con cualquier tipografía: mayúsculas, minúsculas, tildes, Ñ, cirílico y griego. Se guarda como la textura de letras del kit y la tabla de letras que lee KitPos.</p></div>
      <ol class="kpfsteps" aria-label="Pasos">${['Fuente', 'Estilo', 'Kit', 'Al juego'].map((x, i) => `<li class="${i + 1 < step ? 'done' : i + 1 === step ? 'now' : ''}"><i>${i + 1 < step ? '✓' : i + 1}</i>${x}</li>`).join('')}</ol>
      <span class="chip kpfn">${n} letras</span></header>
    <div class="kpfstudio">
      <aside class="kpfl">
        ${sec(1, 'Fuente', `<div class="kpffonts" id="kpfFonts" role="listbox" aria-label="Fuente">${fonts.map(f => `<button type="button" role="option" data-font="${esc(f)}" aria-selected="${f === O.font}" title="${esc(f)}"><b style="font-family:${esc(KPF.fontCss({ font: f }, 22).replace(/^.*?px /, ''))}">Aa Ññ</b><small>${esc(f)}</small></button>`).join('')}</div>
          <div class="kpfup"><button class="btn small primary" type="button" id="kpfUp">＋ Subir fuente</button><button class="btn small" type="button" id="kpfImg" title="Una textura de letras con el formato del juego (A a Z y el punto): esas letras se usan tal cual">🖼 Letras de una imagen</button></div>
          ${O.img ? `<div class="kpfimg"><canvas id="kpfImgTh" width="220" height="56"></canvas><div><b>${esc(O.imgName)}</b><small class="note">A–Z y el punto salen de la imagen; lo demás, de ${esc(O.font)}.</small>
            <label class="chk"><input type="checkbox" id="kpfImgSmall" ${O.imgSmall ? 'checked' : ''}> Minúsculas como mayúsculas más chicas</label><label class="chk"><input type="checkbox" id="kpfImgTint" ${O.imgTint ? 'checked' : ''}> Pintarlas con el color de relleno</label>
            <button class="btn small ghost" type="button" id="kpfImgX">Quitar la imagen</button></div></div>` : ''}
          <small class="note">.ttf, .otf o .woff; también podés arrastrar el archivo a esta pantalla. Las que subís quedan guardadas para la próxima.</small>`)}
        ${sec(2, 'Estilo', `<div class="kpfpres" id="kpfPre">${Object.entries(KPF_PRESETS).map(([k, p]) => `<button type="button" data-pre="${k}" title="${p.n}"><canvas data-prethumb="${k}" width="120" height="54"></canvas><span>${p.n}</span></button>`).join('')}</div>
          <div class="grid2"><div class="f"><label for="kpfW">Grosor</label><select id="kpfW">${[[400, 'Normal'], [600, 'Semi negrita'], [700, 'Negrita'], [800, 'Extra negrita'], [900, 'Black']].map(([v, l]) => `<option value="${v}" ${+O.weight === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
            <div class="f"><span class="lab">&nbsp;</span><label class="chk"><input type="checkbox" id="kpfIt" ${O.italic ? 'checked' : ''}> Cursiva</label></div></div>
          <div class="grid2">${rng('kpfWidth', 'Ancho', Math.round(O.width * 100), 60, 140, 1, v => v + '%')}${rng('kpfSize', 'Tamaño', Math.round(O.size * 100), 70, 110, 1, v => v + '%')}</div>
          <div class="kpfcolors"><div class="f"><label for="kpfFill">Relleno</label><div class="row"><input type="color" id="kpfFill" value="${O.fill}"><label class="chk"><input type="checkbox" id="kpfGrad" ${O.grad ? 'checked' : ''}> Degradado</label><input type="color" id="kpfFill2" value="${O.fill2}" aria-label="Color de abajo del degradado" ${O.grad ? '' : 'disabled'}></div></div>
            <div class="f"><label for="kpfSh">Sombra <output>${O.shadow}</output></label><div class="row"><input type="range" id="kpfSh" min="0" max="12" value="${O.shadow}"><input type="color" id="kpfShC" value="${O.shadowColor}" aria-label="Color de la sombra"></div></div>
            <div class="f"><label for="kpfS1">Borde <output>${O.stroke1}</output></label><div class="row"><input type="range" id="kpfS1" min="0" max="14" value="${O.stroke1}"><input type="color" id="kpfC1" value="${O.color1}" aria-label="Color del borde"></div></div>
            <div class="f"><label for="kpfS2">Segundo borde <output>${O.stroke2}</output></label><div class="row"><input type="range" id="kpfS2" min="0" max="14" value="${O.stroke2}"><input type="color" id="kpfC2" value="${O.color2}" aria-label="Color del segundo borde"></div></div></div>`)}
        ${sec(0, 'Idiomas', `<div class="fchips" id="kpfSets">${KPF.SETS.map(s => `<button type="button" data-set="${s.k}" aria-pressed="${!!(s.fixed || KPFS.sets[s.k])}" ${s.fixed ? 'disabled' : ''} title="${esc(s.d)}">${s.n} <small>${[...s.chars].length}</small></button>`).join('')}</div>`)}
      </aside>
      <div class="kpfc">
        <div class="kpfsample"><label class="lab" for="kpfName">Nombre de prueba</label><input type="text" id="kpfName" value="${esc(KPFS.sample)}" maxlength="24"><div class="fchips" id="kpfSam">${KPF_SAMPLES.map(s => `<button type="button" data-s="${esc(s)}" aria-pressed="${s === KPFS.sample}">${esc(s)}</button>`).join('')}</div></div>
        <div class="kpfstage">
          <div class="seg kpfview" id="kpfView">${[['shirt', '👕 Camiseta'], ['atlas', '🔠 Textura de letras']].map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${(KPFS.view || 'shirt') === v}">${l}</button>`).join('')}</div>
          <canvas id="kpfShirt" width="1100" height="520" aria-label="Vista previa del nombre en la camiseta" ${KPFS.view === 'atlas' ? 'hidden' : ''}></canvas>
          <div class="kpfatlas" ${KPFS.view === 'atlas' ? '' : 'hidden'}><canvas id="kpfAtlas" width="1100" height="275" aria-label="Textura de letras generada"></canvas><small class="note mono" id="kpfDim">—</small></div>
        </div>
      </div>
      <aside class="kpfr">
        ${sec(3, 'Kit', `<div class="f"><label for="kpfTeam">Equipo</label><select id="kpfTeam"><option value="">${KITS.from ? '— Sin equipo: solo descargar el .zip —' : '— Conectá la carpeta Sider para elegir un kit —'}</option>${teams.map(x => `<option value="${x.id}" ${KPFS.team === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
          ${loading ? '<div class="lmload"><span class="spin"></span> Leyendo los kits…</div>' : KPFS.team != null && !has && KS.err ? `<div class="warnbox">${esc(KS.err)}</div>` : ''}
          ${has ? `<div class="kpfkits" id="kpfKits"><button type="button" class="kpfkit all" data-kit="*" aria-pressed="${KPFS.target === '*'}"><span><b>Todos</b><small>${KS.kits.length} de jugador</small></span></button>${KS.kits.map((k, i) => chip(k, i, false)).join('')}${KS.gk.map((k, i) => chip(k, i, true)).join('')}</div>
          <figure class="kpfback"><canvas id="kpfBack" width="320" height="380" aria-label="Espalda del kit en 3D con la fuente nueva"></canvas><figcaption>${esc(KS.sel)} · 3D</figcaption></figure>` : ''}`)}
        ${has ? kposHtml(['name'], { save: true }) : ''}
        ${sec(4, 'Llevarla al juego', `${has ? `<div class="kpfbtns"><button class="btn primary" type="button" id="kpfInstall">${window.pesNative ? '🎮 Instalar en el juego' : '💾 Guardar en la carpeta del kit'}</button>
            ${S.f && S.ix && S.ix.teamById.get(KPFS.team) ? '<button class="btn" type="button" id="kpfTry" title="Abre Kit Studio Pro con la fuente puesta, sin guardarla">👁 Ver en Kit Studio Pro</button>' : ''}
            <button class="btn ghost" type="button" id="kpfZip">⬇ Descargar .zip</button><button class="btn ghost" type="button" id="kpfUndo" title="Vuelve a poner la textura de letras que tenía el kit (la copia .bak-edit21) y borra kitpos_letras.txt">↩ Volver a la anterior</button></div>`
            : `<p class="note">Sin un kit elegido la fuente se descarga en un .zip para copiarla a mano a la carpeta del kit.</p><div class="kpfbtns"><button class="btn primary" type="button" id="kpfZip">⬇ Descargar .zip</button></div>`}
          <p class="note kpflog" id="kpfLog" aria-live="polite">${esc(KPFS.log)}</p>
          ${!has ? '' : st ? `<ul class="kpfst">${row(st.lua ? (st.verOk === false ? false : true) : st.lua, 'KitPos', st.lua ? 'versión ' + esc(st.ver || '?') + (st.verOk === false ? ' (para fuentes por kit hace falta la 6.4 o una más nueva)' : '') : st.lua === false ? 'no está en modules (kitpos.lua)' : 'no se pudo revisar', st.lua === false || st.verOk === false ? `<button class="btn small" type="button" id="kpfKp">${st.lua ? 'Actualizar' : 'Instalar'}</button>` : '')}
            ${row(st.ini, 'sider.ini', st.ini ? 'carga kitpos.lua' + (st.luajit === false ? ', pero falta luajit.ext.enabled = 1' : '') : st.ini === false ? 'no tiene la línea lua.module = "kitpos.lua"' : 'no se pudo leer (el navegador oculta los .ini; en la app de Windows se revisa solo)', st.ini === false || st.luajit === false ? '<button class="btn small" type="button" id="kpfKp2">Arreglar</button>' : '')}
            ${row(st.lower, 'Minúsculas en el juego', st.lower ? 'activadas (el nombre llega tal cual se escribe)' : st.lower === false ? 'apagadas: el juego pasa el nombre a mayúsculas' : 'no se pudo revisar kitpos_slots.ini', st.lower === false ? '<button class="btn small" type="button" id="kpfLower">Activar</button>' : '')}
            ${row(st.kit || 'info', 'Kit ' + esc(KS.sel), st.kit ? 'ya usa una fuente de KitPos (' + st.kitN + ' letras)' : 'usa la fuente común del juego')}</ul>` : '<p class="note">Revisando KitPos en la carpeta Sider…</p>'}`, 'kpfgame')}
      </aside>
    </div>
    <details class="kpfhow"><summary>Cómo llega al juego</summary><ol>
      <li><b>KitPos en Sider.</b> Hace falta KitPos 6.4 o más nuevo: <span class="mono">modules\\kitpos.lua</span> y en <span class="mono">sider.ini</span> la línea <span class="mono">lua.module = "kitpos.lua"</span> debajo de la de kserv, con <span class="mono">luajit.ext.enabled = 1</span>. El editor trae KitPos: el botón Instalar lo copia y agrega esas líneas (con copia de sider.ini).</li>
      <li><b>Tres archivos en la carpeta del kit.</b> El botón guarda en <span class="mono">content\\kit-server\\&lt;equipo&gt;\\&lt;kit&gt;</span> la textura de letras como .dds y .ftex (DXT5, 4096 px de ancho, con el nombre de <span class="mono">NameFontFile</span> del config.txt) y <span class="mono">kitpos_letras.txt</span>, la tabla con el lugar de cada letra. La primera vez guarda una copia .bak-edit21 de la textura anterior.</li>
      <li><b>Posición, tamaño y arco.</b> El panel 📐 guarda los valores exactos en <span class="mono">content\\kitpos\\kitpos_slots.ini</span>, en la sección del kit (<span class="mono">[equipo ID p1]</span>) o de todo el equipo. Son los mismos que ajusta el panel de KitPos en el overlay de Sider.</li>
      <li><b>Minúsculas y acentos.</b> Con <span class="mono">minusculas_juego = 1</span> en kitpos_slots.ini (viene así de fábrica) el juego deja el nombre como está en la base y el editor del juego acepta minúsculas y las letras de la fuente.</li>
      <li><b>En el juego.</b> Abrí el juego de nuevo, entrá a Editar › Equipos › Uniformes y fijate el nombre en la espalda.</li>
      <li><b>Sin la app ni la carpeta conectada.</b> "Descargar .zip" trae los tres archivos y un LEEME: copialos a la carpeta del kit y, si el config.txt no tiene NameFontFile, completalo con el nombre de la textura.</li></ol></details>
  </div>`;
}
// ---- vista previa ----
function kpfShirtBg(g, w, h) {
  const c1 = (KPFS.has && KS.cfg && cfgGet(KS.cfg, 'ShirtColor1')) || '#1d3f8a', gr = g.createLinearGradient(0, 0, 0, h);
  g.fillStyle = c1; g.fillRect(0, 0, w, h); gr.addColorStop(0, '#ffffff22'); gr.addColorStop(.5, '#00000000'); gr.addColorStop(1, '#00000044'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#0000000d'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1); for (let x = 0; x < w; x += 4) g.fillRect(x, 0, 1, h);
}
// muestras de los estilos rápidos: "Ab" con la fuente elegida y los colores de cada estilo
function kpfPresetThumbs(sh) {
  const O = kpfOpts();
  sh.querySelectorAll('canvas[data-prethumb]').forEach(c => { const p = { ...O, ...KPF_PRESETS[c.dataset.prethumb] }, g = c.getContext('2d'), w = c.width, h = c.height;
    g.clearRect(0, 0, w, h); g.fillStyle = '#1d3f8a'; g.fillRect(0, 0, w, h); g.fillStyle = '#0000000f'; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
    g.font = KPF.fontCss(p, 34); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; const x = w / 2, y = h / 2 + 2, t = 'Ab Ñ';
    if (p.shadow) { g.save(); g.fillStyle = p.shadowColor; g.globalAlpha = .7; g.fillText(t, x + p.shadow * .4, y + p.shadow * .4); g.restore(); }
    if (p.stroke2) { g.strokeStyle = p.color2; g.lineWidth = (p.stroke1 + p.stroke2) * 1.1; g.strokeText(t, x, y); }
    if (p.stroke1) { g.strokeStyle = p.color1; g.lineWidth = p.stroke1 * 1.1; g.strokeText(t, x, y); }
    if (p.grad) { const gr = g.createLinearGradient(0, y - 14, 0, y + 14); gr.addColorStop(0, p.fill); gr.addColorStop(1, p.fill2); g.fillStyle = gr; } else g.fillStyle = p.fill; g.fillText(t, x, y); });
}
function kpfDrawPreview(sh) {
  const R = KPFS.out; if (!R) return; const tex = R.canvas;
  const sc = sh.querySelector('#kpfShirt'); if (sc) { const g = sc.getContext('2d'), W = sc.width, H = sc.height; kpfShirtBg(g, W, H);
    // con un kit elegido, el nombre sale con el ancho, la separación y el arco de ese kit (los de KitPos si tiene)
    const p = KPFS.has && KS.cfg ? KS_POS.name() : null, o = p ? { stretch: p.stretch / 1.2, spacing: p.spacing, curve: p.curve } : {};
    g.save(); g.strokeStyle = '#ffffff14'; g.setLineDash([6, 8]); g.beginPath(); g.moveTo(W / 2, 20); g.lineTo(W / 2, H - 20); g.stroke(); g.restore();
    KPF.drawText(g, tex, KPFS.sample || 'Fernández', W / 2, 170, 128, o);
    const extra = [...new Set(KPF.chars(KPFS.sets).filter(c => !/[A-Za-z0-9 .\-'_]/.test(c)))].slice(0, 26).join('');
    KPF.drawText(g, tex, 'Aa Bb Cc Ññ 0123456789', W / 2, 336, 52, {}); if (extra) KPF.drawText(g, tex, extra, W / 2, 436, 46, {}); }
  const ac = sh.querySelector('#kpfAtlas'); if (ac) { const g = ac.getContext('2d'), hh = Math.round(ac.width * tex.height / tex.width); if (ac.height !== hh) ac.height = hh;
    for (let y = 0; y < ac.height; y += 10) for (let x = 0; x < ac.width; x += 10) { g.fillStyle = (x + y) / 10 % 2 ? '#2a2f36' : '#353b44'; g.fillRect(x, y, 10, 10); }
    g.drawImage(tex, 0, 0, ac.width, ac.height); g.strokeStyle = '#ffd84a33'; g.lineWidth = 1; const k = ac.width / tex.width;
    for (const c of R.L.cells) g.strokeRect(c.x * k + .5, c.row * KPF.ROW * k + .5, c.span * k, KPF.ROW * k); }
  const dim = sh.querySelector('#kpfDim'); if (dim) dim.textContent = `${R.L.W}×${R.L.H} px · ${R.L.cells.length} letras · DXT5`;
  const it = sh.querySelector('#kpfImgTh'), O = kpfOpts(); if (it && O.img) { const g = it.getContext('2d'); g.fillStyle = '#2a3038'; g.fillRect(0, 0, it.width, it.height); const z = Math.min(it.width / O.img.width, it.height / O.img.height); g.drawImage(O.img, 0, 0, O.img.width * z, O.img.height * z); }
  kpfBack3d(sh);
}
// la espalda del kit con el modelo 3D real, el nombre de prueba y la fuente nueva
function kpfBack3d(sh) {
  const cv = sh.querySelector('#kpfBack'); if (!cv || !KPFS.has || !KS.cfg || !KPFS.out) return;
  clearTimeout(kpfBack3d.t); kpfBack3d.t = setTimeout(async () => {
    try {
      if (!KS.model || KS.modelFor !== KS.sel) { KS.model = await k3Load(KS.cfg); KS.modelKey = ''; KS.modelFor = KS.sel; }
      const saveT = KS.T.name, saveS = KS.sample; KS.T.name = { c: KPFS.out.canvas, file: '(sin guardar)', where: 'gen' }; KS.sample = { ...KS.sample, name: KPFS.sample || 'Fernández' }; KS.dispKey = '';
      let tex; try { tex = ksDisplayTex(); } finally { KS.T.name = saveT; KS.sample = saveS; KS.dispKey = ''; }
      const snap = k3Snapshot(KS.model, KS.cfg, tex, 'back', cv.width, cv.height, ksMaps()); const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); if (snap) g.drawImage(snap, 0, 0);
    } catch (e) { const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); g.fillStyle = '#888'; g.font = '13px sans-serif'; g.fillText('No se pudo mostrar el 3D.', 12, 24); }
  }, 180);
}
function kpfRun(sh) {
  clearTimeout(kpfRun.t); kpfRun.t = setTimeout(() => {
    try { KPFS.out = KPF.render(kpfOpts(), KPF.chars(KPFS.sets)); KPFS.rev++; kpfDrawPreview(sh); kpfPresetThumbs(sh); }
    catch (e) { KPFS.out = null; const l = sh.querySelector('#kpfLog'); if (l) l.textContent = 'No se pudo armar la fuente: ' + e.message; }
  }, 90);
}
// ---- KitPos instalado y opciones ----
async function kpfCheck() {
  const st = { lua: null, ver: '', verOk: null, ini: null, luajit: null, lower: null, kit: false, kitN: 0 };
  try {
    const { sider, kit } = await ksRoot(false);
    try { const mods = await sider.getDirectoryHandle('modules'), t = await readText(mods, 'kitpos.lua'); st.lua = t != null; if (t) { const v = (t.match(/version\s*=\s*"([\d.]+)"/) || [])[1] || ''; st.ver = v; const [a, b] = v.split('.').map(Number); st.verOk = v ? (a > 6 || (a === 6 && (b || 0) >= 4)) : null; } } catch { st.lua = false; }
    const ini = await readText(sider, 'sider.ini'); if (ini != null) { const act = ini.split(/\r?\n/).filter(l => !/^\s*[;#]/.test(l)); st.ini = act.some(l => /^\s*lua\.module\s*=\s*"?kitpos\.lua"?\s*$/i.test(l)); st.luajit = act.some(l => /^\s*luajit\.ext\.enabled\s*=\s*1\b/i.test(l)); }
    try { const kd = await subDir(sider, 'content/kitpos'), s = await readText(kd, 'kitpos_slots.ini'); if (s != null) st.lower = !/^\s*minusculas_juego\s*=\s*0/m.test(s); else st.lower = true; } catch { st.lower = st.lua ? true : null; }
    if (KS.sel && KS.path) { try { const kd = await (await subDir(kit, KS.path)).getDirectoryHandle(KS.sel), t = await readText(kd, 'kitpos_letras.txt'); if (t) { st.kit = true; st.kitN = KPF.parseLetras(t).length; } } catch { } }
  } catch { }
  return st;
}
async function kpfLowerOn() {
  const { sider } = await ksRoot(true), kd = await subDir(sider, 'content/kitpos'), h = await fsFile(kd, 'kitpos_slots.ini'), txt = (await (await h.getFile()).text());
  const bk = await fsFile(kd, 'kitpos_slots.ini.bak-edit21', true).catch(() => null); if (bk) { const w0 = await bk.createWritable(); await w0.write(txt); await w0.close(); }
  const out = txt.replace(/^(\s*minusculas_juego\s*=\s*)0/m, '$11'), w = await h.createWritable(); await w.write(out); await w.close();
}
// ---- guardar ----
async function kpfBuild(log) {
  log('Armando la textura de letras…'); await new Promise(r => setTimeout(r, 20));
  const R = KPF.render(kpfOpts(), KPF.chars(KPFS.sets)), px = new Uint8Array(R.px.buffer, R.px.byteOffset, R.px.length);
  const levels = await FTEXW.mipLevels(px, R.L.W, R.L.H, { dxt5: true, progress: p => log('Comprimiendo en DXT5 con todos sus tamaños… ' + Math.round(p * 100) + '%') });
  log('Armando el .dds y el .ftex…'); const dds = FTEXW.ddsMips(levels, R.L.W, R.L.H), ftex = await FTEXW.assemble(levels, R.L.W, R.L.H, true);
  KPFS.out = R; return { R, dds, ftex };
}
async function kpfBackup(kd, name) { try { const old = await kd.getFileHandle(name); try { await kd.getFileHandle(name + '.bak-edit21'); } catch { const bk = await kd.getFileHandle(name + '.bak-edit21', { create: true }), w = await bk.createWritable(); await w.write(await (await old.getFile()).arrayBuffer()); await w.close(); if (typeof bakNote === 'function') bakNote(kd); } } catch { } }
async function kpfPut(kd, name, data) { await kpfBackup(kd, name); const fh = await kd.getFileHandle(name, { create: true }), w = await fh.createWritable(); await w.write(data); await w.close(); }
// un kit: la textura con el nombre de NameFontFile (o uXXXXpN_name si estaba vacío) en .dds y .ftex, y la tabla de letras
async function kpfInstallKit(dir, kitName, B) {
  const kd = await dir.getDirectoryHandle(kitName), cur = kitName === KS.sel;
  const cfg = cur ? KS.cfg : cfgParse((await readText(kd, 'config.txt')) || '');
  let file = (cfgGet(cfg, 'NameFontFile') || '').trim(), cfgChanged = false;
  if (!file) { const kf = (cfgGet(cfg, 'KitFile') || '').trim() || 'u' + String(KS.team).padStart(4, '0') + kitName; file = kf + '_name';
    let f = cfg.fields.find(x => x.key === 'NameFontFile'); if (!f) { cfg.lines.push(''); cfg.fields.push(f = { i: cfg.lines.length - 1, key: 'NameFontFile', value: '', pre: 'NameFontFile=', gap: '', comment: '', section: 'texture files' }); }
    if (cur) cfgSet(KS.cfg, 'NameFontFile', file); else { f.value = file; cfgChanged = true; } }
  await kpfPut(kd, file + '.dds', B.dds); await kpfPut(kd, file + '.ftex', B.ftex); await kpfPut(kd, 'kitpos_letras.txt', B.R.txt);
  if (cfgChanged) { const txt = cfgSerialize(cfg); await kpfPut(kd, 'config.txt', txt); KS.cfgTxt[kitName] = txt; }
  for (const k of [...KS.tex.keys()]) if (k.startsWith(KS.path + '/' + kitName + ':')) KS.tex.delete(k); delete KS.thumbs[kitName];
  return file;
}
async function kpfInstall(log) {
  const B = await kpfBuild(log), { kit } = await ksRoot(true), dir = await subDir(kit, KS.path), wasDirty = KS.dirty;
  const targets = KPFS.target === '*' ? KS.kits.slice() : [KPFS.target], done = [];
  for (const k of targets) { log('Guardando en ' + k + '…'); done.push(k + ': ' + await kpfInstallKit(dir, k, B)); }
  if (targets.includes(KS.sel)) { if (!wasDirty && KS.dirty) await ksSave(); const c = B.R.canvas; KS.T.name = { c, file: done[0], where: 'kit' }; KS.texRev = (KS.texRev || 0) + 1; KS.dispKey = ''; }
  return done;
}
async function kpfUndo() {
  const { kit } = await ksRoot(true), kd = await (await subDir(kit, KS.path)).getDirectoryHandle(KS.sel), file = (cfgGet(KS.cfg, 'NameFontFile') || '').trim(); let n = 0;
  for (const e of ['.dds', '.ftex']) { try { const bk = await kd.getFileHandle(file + e + '.bak-edit21'), fh = await kd.getFileHandle(file + e, { create: true }), w = await fh.createWritable(); await w.write(await (await bk.getFile()).arrayBuffer()); await w.close(); n++; } catch { } }
  try { await kd.removeEntry('kitpos_letras.txt'); n++; } catch { }
  for (const k of [...KS.tex.keys()]) if (k.startsWith(KS.path + '/' + KS.sel + ':')) KS.tex.delete(k);
  return n;
}
function kpfReadme(file) {
  return ['Fuente del nombre para KitPos - creada con PES Editor Rebuilt', '',
    'Archivos:', `  ${file}.dds y ${file}.ftex  textura de letras (DXT5)`, '  kitpos_letras.txt  donde esta cada letra dentro de la textura', '',
    'Como instalarla:', '  1. Copia los tres archivos a la carpeta del kit: Sider\\content\\kit-server\\<equipo>\\<kit>',
    `  2. En el config.txt de ese kit, NameFontFile tiene que ser ${file} (sin extension).`,
    '  3. Hace falta KitPos 6.4 o mas nuevo: modules\\kitpos.lua y en sider.ini lua.module = "kitpos.lua" debajo de kserv.lua (con luajit.ext.enabled = 1).',
    '  4. Para minusculas y acentos: content\\kitpos\\kitpos_slots.ini, [opciones] minusculas_juego = 1.',
    '  5. Abri el juego de nuevo y mira el nombre en Editar > Equipos > Uniformes.', ''].join('\r\n');
}
async function kpfZip(log) {
  const B = await kpfBuild(log), file = KPFS.has ? (cfgGet(KS.cfg, 'NameFontFile') || '').trim() || ksBase() + '_name' : 'uXXXXp1_name';
  const z = KPF.zipMany([{ name: file + '.dds', data: B.dds }, { name: file + '.ftex', data: B.ftex }, { name: 'kitpos_letras.txt', data: B.R.txt }, { name: 'LEEME.txt', data: kpfReadme(file) }]);
  await downloadBytes('fuente-kitpos-' + String(kpfOpts().font).replace(/[^\w-]+/g, '-').toLowerCase() + '.zip', z); return file;
}
function kpfBind(sh, has) {
  KPFS.has = has;
  const O = kpfOpts(), $k = id => sh.querySelector('#' + id), log = s => { KPFS.log = s; const l = $k('kpfLog'); if (l) l.textContent = s; }, rr = () => KPFS.rr && KPFS.rr();
  const upd = () => kpfRun(sh);
  if (!KPFS.userFonts) kpfLoadUserFonts().then(f => { if (f.length) rr(); });
  if (has && (!KPFS.st || KPFS.stFor !== KS.path + '/' + KS.sel)) { KPFS.stFor = KS.path + '/' + KS.sel; kpfCheck().then(st => { KPFS.st = st; rr(); }); }
  if (has && !KPS.st) kpsLoad().then(rr);
  const on = (id, fn) => { const el = $k(id); if (!el) return; el.oninput = el.onchange = () => { fn(el); const o = el.closest('.f') && el.closest('.f').querySelector('output'); if (o && el.type === 'range') o.textContent = /Width|Size/.test(id) ? el.value + '%' : el.value; upd(); }; };
  on('kpfW', el => O.weight = +el.value); on('kpfIt', el => O.italic = el.checked); on('kpfWidth', el => O.width = el.value / 100); on('kpfSize', el => O.size = el.value / 100);
  on('kpfFill', el => O.fill = el.value); on('kpfGrad', el => { O.grad = el.checked; $k('kpfFill2').disabled = !el.checked; }); on('kpfFill2', el => O.fill2 = el.value);
  on('kpfSh', el => O.shadow = +el.value); on('kpfShC', el => O.shadowColor = el.value); on('kpfS1', el => O.stroke1 = +el.value); on('kpfC1', el => O.color1 = el.value); on('kpfS2', el => O.stroke2 = +el.value); on('kpfC2', el => O.color2 = el.value);
  on('kpfImgSmall', el => O.imgSmall = el.checked); on('kpfImgTint', el => O.imgTint = el.checked);
  $k('kpfFonts').onclick = e => { const b = e.target.closest('[data-font]'); if (!b) return; O.font = b.dataset.font; $k('kpfFonts').querySelectorAll('[data-font]').forEach(x => x.setAttribute('aria-selected', x === b)); upd(); };
  $k('kpfPre').onclick = e => { const b = e.target.closest('[data-pre]'); if (!b) return; const { n, ...p } = KPF_PRESETS[b.dataset.pre]; Object.assign(O, p); rr(); };
  $k('kpfSets').onclick = e => { const b = e.target.closest('[data-set]'); if (!b || b.disabled) return; KPFS.sets[b.dataset.set] = !KPFS.sets[b.dataset.set]; b.setAttribute('aria-pressed', !!KPFS.sets[b.dataset.set]); sh.querySelector('.kpfn').textContent = KPF.chars(KPFS.sets).length + ' letras'; upd(); };
  const nm = $k('kpfName'); nm.oninput = () => { KPFS.sample = nm.value; $k('kpfSam').querySelectorAll('[data-s]').forEach(x => x.setAttribute('aria-pressed', x.dataset.s === nm.value)); kpfDrawPreview(sh); };
  $k('kpfSam').onclick = e => { const b = e.target.closest('[data-s]'); if (!b) return; KPFS.sample = nm.value = b.dataset.s; $k('kpfSam').querySelectorAll('[data-s]').forEach(x => x.setAttribute('aria-pressed', x === b)); kpfDrawPreview(sh); };
  $k('kpfView').onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; KPFS.view = b.dataset.v; $k('kpfView').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); $k('kpfShirt').hidden = KPFS.view === 'atlas'; sh.querySelector('.kpfatlas').hidden = KPFS.view !== 'atlas'; };
  // equipo y kit donde se prueba y se instala
  const tm = $k('kpfTeam'); if (tm) tm.onchange = () => { KPFS.team = tm.value === '' ? null : +tm.value; KPFS.target = null; KPFS.st = null; KPFS.done = false; KS.model = null; rr(); };
  const kk = $k('kpfKits'); if (kk) kk.onclick = async e => { const b = e.target.closest('[data-kit]'); if (!b) return; KPFS.target = b.dataset.kit; KPFS.done = false;
    if (b.dataset.kit !== '*' && b.dataset.kit !== KS.sel) { if (KS.dirty && !await confirmBox('El kit ' + KS.sel + ' tiene cambios sin guardar en Kit Studio Pro. ¿Cambiar de kit igual?')) return; KS.model = null; try { await ksOpenKit(b.dataset.kit); } catch (er) { toast(er.message, 6000); } }
    rr(); };
  const pick = (accept, fn) => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept; inp.onchange = () => inp.files[0] && fn(inp.files[0]); inp.click(); };
  const addFile = async f => { const n = f.name.toLowerCase();
    try { if (/\.(ttf|otf|woff2?)$/.test(n)) { const fam = await kpfAddFont(f); toast('Fuente ' + fam + ' lista.'); } else if (/\.(png|jpe?g|webp|dds|ftex)$/.test(n)) { await kpfAddImage(f); toast('Letras de ' + f.name + ' cargadas.'); } else { toast('Ese archivo no es una fuente (.ttf, .otf, .woff) ni una imagen.', 5000); return; } rr(); }
    catch (e) { toast('No se pudo usar ' + f.name + ': ' + e.message, 7000); } };
  $k('kpfUp').onclick = () => pick('.ttf,.otf,.woff,.woff2', addFile);
  $k('kpfImg').onclick = () => pick('.png,.jpg,.jpeg,.webp,.dds,.ftex', addFile);
  const ix = $k('kpfImgX'); if (ix) ix.onclick = () => { O.img = null; O.imgName = ''; rr(); };
  const dz = $k('kpfDrop'); dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); }; dz.ondragleave = e => { if (!dz.contains(e.relatedTarget)) dz.classList.remove('over'); };
  dz.ondrop = e => { e.preventDefault(); e.stopPropagation(); dz.classList.remove('over'); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) addFile(f); };
  const busy = (b, fn) => async () => { if (KPFS.busy) return; KPFS.busy = true; const btns = sh.querySelectorAll('.kpfgame .btn'); btns.forEach(x => x.disabled = true);
    try { await fn(); } catch (e) { log('No se pudo: ' + e.message); toast('No se pudo: ' + e.message, 7000); } KPFS.busy = false; btns.forEach(x => x.disabled = false); };
  const ins = $k('kpfInstall'); if (ins) ins.onclick = busy(ins, async () => {
    const done = await kpfInstall(log), kp = await kpsSave(); KPFS.st = null; KPFS.stFor = ''; KPFS.done = true;
    log('Listo: ' + done.join(' · ') + (kp ? ' · posición en kitpos_slots.ini' : '') + '. Abrí el juego de nuevo para verla.'); toast('Fuente guardada en ' + done.length + (done.length > 1 ? ' kits' : ' kit') + '. Abrí el juego de nuevo para verla.', 8000); rr(); });
  const tr3 = $k('kpfTry'); if (tr3) tr3.onclick = () => { if (!KPFS.out) return; const t = S.ix.teamById.get(KPFS.team); if (!t) return;
    KS.T.name = { c: KPFS.out.canvas, file: '(sin guardar)', where: 'gen' }; KS.sample = { ...KS.sample, name: KPFS.sample || KS.sample.name }; KS.texRev = (KS.texRev || 0) + 1; KS.dispKey = ''; KS.mode = 'edit'; KS.view = '3d';
    const nat = isNat(t); S.teamByTab[nat ? 'nats' : 'teams'] = t.id; S.ttab = 'kits'; setTab(nat ? 'nats' : 'teams');
    setTimeout(() => { const w = document.getElementById('ks3dWrap'); if (w) w.scrollIntoView({ block: 'center', behavior: 'smooth' }); const b = document.querySelector('[data-cam="back"]'); if (b) b.click(); }, 500); toast('Probando la fuente en Kit Studio Pro. Para que el juego la use, volvé a Fuentes y tocá el botón de guardar.', 7000); };
  const zp = $k('kpfZip'); if (zp) zp.onclick = busy(zp, async () => { const f = await kpfZip(log); log('Descargado: ' + f + '.dds, ' + f + '.ftex, kitpos_letras.txt y LEEME.txt.'); });
  const un = $k('kpfUndo'); if (un) un.onclick = busy(un, async () => { if (!await confirmBox('¿Volver a la textura de letras que tenía ' + KS.sel + ' y borrar su kitpos_letras.txt?')) return; const n = await kpfUndo(); KPFS.st = null; KPFS.stFor = ''; KPFS.done = false; await ksLoadSlots(); log(n ? 'Listo: ' + KS.sel + ' volvió a su fuente anterior.' : 'No había nada para volver atrás en ' + KS.sel + '.'); rr(); });
  const lw = $k('kpfLower'); if (lw) lw.onclick = busy(lw, async () => { await kpfLowerOn(); KPFS.st = null; KPFS.stFor = ''; toast('Minúsculas activadas en kitpos_slots.ini.'); rr(); });
  for (const id of ['kpfKp', 'kpfKp2']) { const b = $k(id); if (b) b.onclick = busy(b, async () => { const r = await kpsInstall(); KPFS.st = null; KPFS.stFor = '';
    toast(r.lua === 'mas-nuevo' ? 'Ya tenías una versión más nueva de KitPos: no se tocó.' : 'KitPos ' + (r.lua === 'actualizado' ? 'actualizado' : r.lua === 'nuevo' ? 'instalado' : 'listo') + (r.ini === 'agregado' ? ' y agregado a sider.ini (copia en sider.ini.bak-pes-editor)' : r.ini === 'oculto' ? '. Falta agregar lua.module = "kitpos.lua" en sider.ini (debajo de kserv.lua): hacelo en la pestaña Sider' : '') + '. Abrí el juego de nuevo.', 10000); rr(); }); }
  // posición, tamaño y arco del nombre (KitPos)
  kposBind(sh, () => kpfDrawPreview(sh), rr);
  kpfPresetThumbs(sh);
  if (KPFS.out && KPFS.outFor === JSON.stringify([O.font, KPFS.sets])) kpfDrawPreview(sh);
  KPFS.outFor = JSON.stringify([O.font, KPFS.sets]); kpfRun(sh);
  document.fonts && document.fonts.ready.then(() => { kpfRun(sh); });
}
