// ===================== Creador de fuentes para KitPos (Kit Studio Pro › 🔤 Fuentes) =====================
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

  // ---- plantilla de Photoshop (KitPos_Letras_Template.psd) ----
  // 4096 px de ancho, una casilla de 256×256 por letra en este orden, con la línea de base a 200 px y el centro a 128 px
  // (la misma línea de base que las filas de la textura de KitPos, así las letras pasan 1:1).
  const TPL = ['ABCDEFGHIJKLMNOP', 'QRSTUVWXYZ', 'abcdefghijklmnop', 'qrstuvwxyz', "0123456789.-'", 'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏ', 'ÐÑÒÓÔÕÖØÙÚÛÜÝÞ', 'ßàáâãäåæçèéêëìíî',
    'ïðñòóôõöøùúûüýþÿ', 'ĂăĄąĆćČčĐđĘęĞğİı', 'ŁłŃńŘřŚśŞşŠšŢţȘș', 'ȚțŹźŻżŽžŐőŰűĚěŮů', 'ĎďŤťŇňĽľĹĺŔŕŒœŸƏ', 'əĀāĒēĪīŪūĢģĶķĻļŅ', 'ņĖėĮįŲų'];
  const TPL_W = 4096, TPL_H = TPL.length * ROW;
  const tplCells = () => TPL.flatMap((r, row) => [...r].map((ch, col) => ({ ch, col, row })));
  // busca la tinta de cada casilla en los píxeles RGBA de la plantilla (4096 de ancho): dónde empieza y termina cada letra
  function tplScan(px, w, h) {
    let opaque = true; for (let i = 3; i < px.length; i += 4 * 97) if (px[i] < 250) { opaque = false; break; }
    const glyphs = []; let capTop = null;
    for (const c of tplCells()) {
      const x0 = c.col * ROW, y0 = c.row * ROW; if (y0 + ROW > h) continue; let a = ROW, b = -1, top = ROW, bot = -1;
      for (let y = 0; y < ROW; y++) { const o = ((y0 + y) * w + x0) * 4; for (let x = 0; x < ROW; x++) if (px[o + x * 4 + 3] > 24) { if (x < a) a = x; if (x > b) b = x; if (y < top) top = y; if (y > bot) bot = y; } }
      if (b < 0) continue; glyphs.push({ ch: c.ch, col: c.col, row: c.row, x0: a, x1: b + 1, top, bottom: bot + 1 });
      if ('HEIT'.includes(c.ch) && bot + 1 >= BASE - 6 && bot + 1 <= BASE + 6) capTop = capTop == null ? top : Math.min(capTop, top);
    }
    const cap = capTop != null ? BASE - capTop : null;
    return { glyphs, opaque, cap, count: glyphs.length, total: tplCells().length };
  }
  // lee un .psd (8 bits, RGB o escala de grises) y devuelve sus capas con los píxeles en RGBA; los efectos de capa no se leen
  function psdRead(buf) {
    const d = new DataView(ArrayBuffer.isView(buf) ? buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) : buf), u8 = new Uint8Array(d.buffer); let p = 0;
    const u16 = () => { const v = d.getUint16(p); p += 2; return v; }, u32 = () => { const v = d.getUint32(p); p += 4; return v; }, i32 = () => { const v = d.getInt32(p); p += 4; return v; }, str = n => { let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(u8[p + i]); p += n; return s; };
    if (str(4) !== '8BPS') throw new Error('no es un archivo de Photoshop (.psd).');
    if (u16() !== 1) throw new Error('es un .psb (documento grande): guardalo como .psd.');
    p += 6; const nch = u16(), H = u32(), W = u32(), depth = u16(), mode = u16();
    if (depth !== 8) throw new Error('la plantilla tiene que estar en 8 bits por canal (Imagen › Modo › 8 bits/canal).');
    if (mode !== 3 && mode !== 1) throw new Error('la plantilla tiene que estar en modo RGB.');
    for (let k = 0; k < 2; k++) { const n = u32(); p += n; } // datos de color e image resources
    const lmEnd = u32() + p; if (lmEnd <= p) return { w: W, h: H, layers: [] };
    const liLen = u32(), liEnd = p + liLen; if (!liLen) return { w: W, h: H, layers: [] };
    let n = d.getInt16(p); p += 2; n = Math.abs(n); const L = [];
    for (let i = 0; i < n; i++) {
      const top = i32(), left = i32(), bottom = i32(), right = i32(), cn = u16(), chans = [];
      for (let c = 0; c < cn; c++) { const id = d.getInt16(p); p += 2; chans.push({ id, len: u32() }); }
      p += 4; const blend = str(4), opacity = u8[p], clipping = u8[p + 1], flags = u8[p + 2]; p += 4;
      const xEnd = p + 4 + d.getUint32(p); p += 4; p += 4 + d.getUint32(p); p += 4 + d.getUint32(p); // máscara y rangos de fusión
      const nl = u8[p]; let name = ''; for (let k = 0; k < nl; k++) name += String.fromCharCode(u8[p + 1 + k]); p += (nl + 4) & ~3;
      let kind = 'pixel', fill = null;
      while (p + 12 <= xEnd) { const sig = str(4), key = str(4), len = u32(), s = p; if (sig !== '8BIM' && sig !== '8B64') break;
        if (key === 'luni') { const k = d.getUint32(p); let t = ''; for (let j = 0; j < k; j++) t += String.fromCharCode(d.getUint16(p + 4 + j * 2)); name = t.replace(/\0+$/, ''); }
        else if (key === 'lsct' || key === 'lsdk') { const t = d.getUint32(p); if (t) kind = 'group'; }
        else if (key === 'SoCo') { kind = 'fill'; const col = k => { for (let j = s; j < s + len - 12; j++) if (u8[j] === k.charCodeAt(0) && str4(u8, j) === k && str4(u8, j + 4) === 'doub') return Math.round(d.getFloat64(j + 8)); return 0; }; fill = [col('Rd  '), col('Grn '), col('Bl  ')]; }
        p = s + len; }
      p = xEnd; L.push({ name, top, left, w: Math.max(0, right - left), h: Math.max(0, bottom - top), chans, blend, opacity, clipping, visible: !(flags & 2), kind, fill });
    }
    for (const l of L) { // píxeles de cada canal (crudo o RLE)
      const np = l.w * l.h; l.rgba = np ? new Uint8ClampedArray(np * 4).fill(255) : null;
      for (const c of l.chans) { const end = p + c.len; if (!np || c.len < 2) { p = end; continue; }
        const comp = u16(), plane = new Uint8Array(np);
        if (comp === 0) plane.set(u8.subarray(p, p + np));
        else if (comp === 1) { const counts = []; for (let y = 0; y < l.h; y++) counts.push(u16()); let o = 0;
          for (let y = 0; y < l.h; y++) { const re = p + counts[y], rowEnd = o + l.w; while (p < re && o < rowEnd) { const b = u8[p++]; if (b < 128) { for (let k = 0; k <= b; k++) plane[o++] = u8[p++]; } else if (b > 128) { const v = u8[p++]; for (let k = 0; k < 257 - b; k++) plane[o++] = v; } } p = re; o = rowEnd; } }
        else { p = end; continue; } // ZIP: no se usa en los .psd de 8 bits que guarda Photoshop
        const slot = c.id === -1 ? 3 : mode === 1 && c.id === 0 ? -9 : c.id >= 0 && c.id < 3 ? c.id : null;
        if (slot === -9) for (let k = 0; k < np; k++) l.rgba[k * 4] = l.rgba[k * 4 + 1] = l.rgba[k * 4 + 2] = plane[k];
        else if (slot != null) for (let k = 0; k < np; k++) l.rgba[k * 4 + slot] = plane[k];
        p = end; }
      delete l.chans;
    }
    return { w: W, h: H, layers: L };
  }
  const str4 = (u8, j) => String.fromCharCode(u8[j], u8[j + 1], u8[j + 2], u8[j + 3]);
  // capas que forman las letras: las visibles, menos el fondo, las guías y el ejemplo
  const tplSkip = n => /fondo|gu[ií]as?|ejemplo|background|guide|sample/i.test(n);
  const tplLayers = P => P.layers.filter(l => l.visible && l.kind === 'pixel' && l.w && l.h && !tplSkip(l.name));
  // color de relleno para pintar las letras: una capa de relleno visible recortada sobre las letras
  const tplFill = P => { const f = P.layers.find(l => l.visible && l.kind === 'fill' && l.clipping && l.fill && !tplSkip(l.name)); return f ? '#' + f.fill.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('') : null; };

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
  function tinted(img, on, fill) { // las letras de la imagen pintadas con el color de relleno (se conserva la forma y la transparencia)
    if (!img || !on) return img; if (img.__tint && img.__tint.k === fill) return img.__tint.c;
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = fill; g.fillRect(0, 0, c.width, c.height);
    img.__tint = { k: fill, c }; return c;
  }
  function render(o, list) {
    // con una plantilla de Photoshop, sus letras van 1:1 y las que no dibujó salen de la fuente, a la misma altura
    const T = o.tpl || null, tsrc = T ? tinted(T.c, o.tplTint, o.fill) : null;
    const mc = document.createElement('canvas').getContext('2d'), wS = o.width || 1, capPx = ((T && T.cap) || CAP) * (o.size || 1);
    mc.font = fontCss(o, 100); const capRef = mc.measureText('H').actualBoundingBoxAscent || 70, fs = 100 * capPx / capRef; mc.font = fontCss(o, fs);
    const ext = (+o.stroke1 || 0) + (+o.stroke2 || 0), sh = +o.shadow || 0, IG = o.img ? imgGlyphs(o.img) : null, src = IG ? tinted(o.img, o.imgTint, o.fill) : null;
    const metrics = list.map(ch => {
      const up = ch.toUpperCase(), tq = T && (T.g.get(ch) || (o.imgSmall && ch !== up && up.length === 1 && T.g.get(up)));
      if (tq) { const k = (o.size || 1) * (T.g.has(ch) ? 1 : .76), bear = capPx * .05, iw = tq.x1 - tq.x0; return { ch, left: 0, right: iw * k * wS + bear * 2, tpl: { q: tq, k, bear } }; }
      const q = IG && (IG.get(ch) || (o.imgSmall && ch !== up && up.length === 1 && IG.get(up)));
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
      if (mt.tpl) { const { q, k, bear } = mt.tpl, iw = q.x1 - q.x0; g.save(); g.beginPath(); g.rect(cell.x, cell.row * ROW, cell.span, ROW); g.clip();
        g.drawImage(tsrc, q.col * ROW + q.x0, q.row * ROW, iw, ROW, ox + bear, by - BASE * k, iw * k * wS, ROW * k); g.restore(); return; }
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
    const label = (T ? (o.tplName || 'plantilla') + ' + ' : '') + (o.img ? (o.imgName || 'imagen') + ' + ' : '') + o.font + (o.italic ? ' cursiva' : '');
    c.__kp = glyphMap(letrasTxtList(L), L.W, L.H);
    return { canvas: c, L, px: d, txt: letrasTxt(L, label) };
  }
  const letrasTxtList = L => L.cells.map(c => ({ ch: c.ch, w: c.w, u0: c.x / L.W, v0: c.row * ROW / L.H, u1: (c.x + c.span) / L.W, v1: (c.row + 1) * ROW / L.H }));
  // escribe un texto con una fuente de KitPos (respeta mayúsculas y minúsculas); (cx, cy) es el centro de las mayúsculas, h su alto
  function drawText(g, tex, text, cx, cy, h, { stretch = 1, spacing = 0, curve = 0, maxW = 0 } = {}) {
    const map = tex.__kp, chs = [...String(text)].map(ch => map.get(ch) || map.get(ch.toUpperCase()) || (ch === ' ' ? null : map.get('?')) || null);
    const ref = chs.find(Boolean) || map.values().next().value; if (!ref) return;
    const R = ref.sh, k = h / (R * CAP / ROW), ws = chs.map((q, i) => q ? q.sw * k * stretch : (String(text)[i] === ' ' ? h * .35 : 0)), gap = spacing * h;
    const total = ws.reduce((a, b) => a + b, 0) + gap * Math.max(0, ws.length - 1);
    if (maxW && total > maxW) return drawText(g, tex, text, cx, cy, h * maxW / total * .98, { stretch, spacing, curve });
    // curve: la del juego (1000 / radio); cada letra va sobre el arco, girada (KFONT.arcText)
    KFONT.arcText(g, chs.map((q, i) => ({ w: ws[i], draw: q ? gg => gg.drawImage(tex, q.sx, q.sy, q.sw, q.sh, -ws[i] / 2, -(BASE - CAP / 2) / ROW * R * k, ws[i], R * k) : null })), cx, cy, h, curve, gap);
  }
  // plantilla lista para usar a partir de una imagen (canvas) o de un .psd ya leído: { c: canvas 4096×3840, g: Map letra → casilla, cap }
  function tplLoad(src) {
    const c = document.createElement('canvas'); c.width = TPL_W; c.height = TPL_H; const g = c.getContext('2d', { willReadFrequently: true });
    let tint = null;
    if (src.layers) { // .psd: se juntan las capas de las letras (en el orden de Photoshop, de abajo hacia arriba)
      const z = TPL_W / src.w; tint = tplFill(src); const ls = tplLayers(src); if (!ls.length) throw new Error('el .psd no tiene una capa visible con letras (la de la plantilla se llama "Letras").');
      for (const l of ls) { const t = document.createElement('canvas'); t.width = l.w; t.height = l.h; t.getContext('2d').putImageData(new ImageData(l.rgba, l.w, l.h), 0, 0); g.globalAlpha = l.opacity / 255; g.drawImage(t, l.left * z, l.top * z, l.w * z, l.h * z); }
      g.globalAlpha = 1;
    } else { const z = TPL_W / src.width; g.drawImage(src, 0, 0, src.width * z, src.height * z); }
    const im = g.getImageData(0, 0, TPL_W, TPL_H), S = tplScan(im.data, TPL_W, TPL_H);
    if (S.opaque) throw new Error('la imagen no tiene transparencia. En Photoshop ocultá el fondo y las guías (acción "KitPos Preparar PNG") y guardala como PNG.');
    if (!S.count) throw new Error('no encontré letras en las casillas de la plantilla (4096 px de ancho, casillas de 256).');
    if (tint) { g.globalCompositeOperation = 'source-in'; g.fillStyle = tint; g.fillRect(0, 0, TPL_W, TPL_H); g.globalCompositeOperation = 'source-over'; }
    const m = new Map(); for (const q of S.glyphs) m.set(q.ch, q);
    return { c, g: m, cap: S.cap, count: S.count, total: S.total, tint };
  }
  // las letras de la fuente actual en la plantilla (PNG transparente): para pegar en la capa "Letras" y retocarlas en Photoshop
  function tplSheet(o) {
    const R = render(o, tplCells().map(x => x.ch)), c = document.createElement('canvas'); c.width = TPL_W; c.height = TPL_H; const g = c.getContext('2d');
    const at = new Map(R.L.cells.map(x => [x.ch, x]));
    for (const t of tplCells()) { const a = at.get(t.ch); if (!a || t.ch === ' ') continue; const sw = Math.min(a.span, ROW); g.drawImage(R.canvas, a.x + (a.span - sw) / 2, a.row * ROW, sw, ROW, t.col * ROW + (ROW - sw) / 2, t.row * ROW, sw, ROW); }
    // donde no hay letra, transparente del todo (la textura del juego lleva el color de relleno ahí)
    const im = g.getImageData(0, 0, TPL_W, TPL_H); for (let i = 3; i < im.data.length; i += 4) if (!im.data[i]) im.data[i - 3] = im.data[i - 2] = im.data[i - 1] = 0; g.putImageData(im, 0, 0);
    return c;
  }
  // guías de la plantilla: casillas, línea de base, centro y la letra de cada casilla (por si no se tiene el .psd)
  function tplGuides() {
    const c = document.createElement('canvas'); c.width = TPL_W; c.height = TPL_H; const g = c.getContext('2d');
    g.fillStyle = '#272a33'; g.fillRect(0, 0, TPL_W, TPL_H); g.font = '600 26px system-ui, sans-serif'; g.textBaseline = 'top';
    for (const t of tplCells()) { const x = t.col * ROW, y = t.row * ROW;
      g.strokeStyle = '#6b6e78'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, ROW - 2, ROW - 2);
      g.strokeStyle = '#c0453f'; g.beginPath(); g.moveTo(x + 7, y + BASE); g.lineTo(x + ROW - 9, y + BASE); g.stroke();
      g.strokeStyle = '#8d9099'; g.beginPath(); g.moveTo(x + ROW / 2, y + 6); g.lineTo(x + ROW / 2, y + 18); g.stroke();
      g.fillStyle = '#a9adb6'; g.fillText(t.ch, x + 9, y + 8); }
    return c;
  }
  return { W, ROW, BASE, CAP, MAX, SETS, TPL, TPL_W, TPL_H, chars, hex, unhex, layout, letrasTxt, parseLetras, glyphMap, zipMany, render, drawText, fontCss, imgGlyphs, tplCells, tplScan, psdRead, tplLayers, tplFill, tplLoad, tplSheet, tplGuides };
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
// plantilla de Photoshop con las letras dibujadas (PNG transparente o el .psd)
async function kpfAddTemplate(file, bmp) {
  const n = file.name.toLowerCase(), src = n.endsWith('.psd') ? KPF.psdRead(await file.arrayBuffer()) : bmp || await createImageBitmap(file);
  if ((src.w || src.width) < 1024) throw new Error('la plantilla tiene que tener 4096 px de ancho (o 2048, la mitad).');
  const T = KPF.tplLoad(src); Object.assign(kpfOpts(), { tpl: T, tplName: file.name.replace(/\.[^.]+$/, ''), tplPsd: n.endsWith('.psd') }); return T;
}
async function kpfPng(c, name) { const b = await new Promise(r => c.toBlob(r, 'image/png')); await downloadBytes(name, new Uint8Array(await b.arrayBuffer())); }
function kpfFontList() {
  const sys = (typeof KS_FONTS !== 'undefined' ? KS_FONTS : []).filter(f => { try { return f === 'Saira Condensed' || ksFontInstalled(f); } catch { return false; } });
  return [...(KPFS.userFonts || []), ...sys.filter(f => !(KPFS.userFonts || []).includes(f))];
}
// ---- Kit Studio Pro › 🔤 Fuentes: el creador, aparte de Uniformes y del Editor ----
// abre Fuentes en el Kit Studio Pro del equipo, con el kit que se estaba editando
function kpfGoto(t, m) { KPFS.target = KS.team === t.id && KS.sel ? KS.sel : '*'; KPFS.done = false; KS.mode = 'fonts'; renderTeams(m); }
// folder: el equipo tiene carpeta en content\kit-server (si no, la fuente solo se descarga en un .zip)
function kpfCard(t, folder) { const has = !!(folder && KS.cfg && KS.team === t.id); KPFS.t = t; KPFS.team = has ? t.id : null; return `<div class="kpfin">${kpfHtml(has)}</div>`; }
function kpfBindIn(t, m, sh) { if (!sh.querySelector('#kpfDrop')) return; KPFS.rr = () => ksRerender(); kpfBind(sh, KPFS.team === t.id && !!KS.cfg); }
// requisitos para que el juego use la fuente: Sider con kserv, KitPos 6.4+, sider.ini y las minúsculas de kitpos_slots.ini
const KPF_INI = '[sider]\nlua.enabled = 1\nluajit.ext.enabled = 1\nlua.module = "kserv.lua"\nlua.module = "kitpos.lua"';
function kpfReqHtml() {
  const sid = !!KITS.from, st = sid ? KPFS.st : null, wait = sid && !st;
  const mark = ok => ok === true ? ['ok', '✓', 'Listo'] : ok === false ? ['bad', '✕', 'Falta'] : ok === 'later' ? ['unk later', '○', 'Después de instalar KitPos'] : !sid ? ['unk', '○', 'Sin revisar'] : wait ? ['unk', '…', 'Revisando'] : ['unk', '?', 'No se pudo revisar'];
  const item = (n, ok, title, body, btns) => { const [c, i, l] = mark(ok); return `<li class="kpfreq ${c}"><div class="kpfrh"><i>${n}</i><b>${title}</b><span class="chip ${c === 'ok' ? 'ok' : c === 'bad' ? 'warn' : ''}"><span aria-hidden="true">${i}</span> ${l}</span></div>${body}${btns ? `<div class="kpfup">${btns}</div>` : ''}</li>`; };
  const luaOk = st && (st.lua ? st.verOk !== false : st.lua), iniOk = st && (st.ini && st.luajit !== false ? true : st.ini === false || st.luajit === false ? false : null);
  return `<section class="kpfreqs" aria-label="Requisitos"><h5>✅ Requisitos para verla en el juego</h5><ol>
    ${item(1, st ? st.kitServer : null, 'Sider con kserv', '<p class="note">Sider con el módulo <span class="mono">kserv.lua</span> y la carpeta <span class="mono">content\\kit-server</span>, donde viven los kits.</p>', sid ? '' : '<button class="btn small primary" type="button" data-kits>Conectar carpeta Sider</button>')}
    ${item(2, luaOk, 'Descargar KitPos 6.4 o más nuevo', `<p class="note">KitPos es el módulo de Sider que dibuja el nombre con esta fuente. Va en <span class="mono">Sider\\modules\\kitpos.lua</span>.${st && st.lua ? ` Tenés la versión ${esc(st.ver || '?')}${st.verOk === false ? ': hace falta la 6.4 o una más nueva.' : '.'}` : st && st.lua === false ? ' No está en la carpeta modules.' : ''}</p>`,
      `${sid && st && (st.lua === false || st.verOk === false) ? `<button class="btn small primary" type="button" id="kpfKp" title="Copia el kitpos.lua que trae el editor a modules y agrega sus líneas en sider.ini (con copia)">${st.lua ? '⟳ Actualizar KitPos' : '🎮 Instalar KitPos'}</button>` : ''}<button class="btn small" type="button" id="kpfKpDl" title="Baja el kitpos.lua que trae el editor para copiarlo a mano en Sider\\modules">⬇ Descargar kitpos.lua</button>`)}
    ${item(3, iniOk, 'Configurarlo en sider.ini', `<p class="note">${st && st.ini && st.luajit === false ? 'Carga kitpos.lua, pero falta <span class="mono">luajit.ext.enabled = 1</span>. ' : st && st.ini === false ? 'Todavía no carga kitpos.lua. ' : st && st.ini == null ? 'El navegador no deja leer los .ini: en la app de Windows se revisa solo, o elegí sider.ini en la pestaña Sider. ' : ''}La línea de KitPos va debajo de la de kserv:</p><pre class="kpfini">${esc(KPF_INI)}</pre>`,
      `${sid && st && iniOk === false ? '<button class="btn small primary" type="button" id="kpfKp2" title="Agrega las líneas que faltan (con copia sider.ini.bak-pes-editor)">🔧 Arreglar sider.ini</button>' : ''}<button class="btn small ghost" type="button" id="kpfIniCp">📋 Copiar líneas</button>`)}
    ${item(4, st ? (st.lower == null && st.lua === false ? 'later' : st.lower) : null, 'Minúsculas activadas', `<p class="note">En <span class="mono">content\\kitpos\\kitpos_slots.ini</span>, sección <span class="mono">[opciones]</span>: <span class="mono">minusculas_juego = 1</span> (viene así de fábrica). Si está en 0, el juego pasa el nombre a mayúsculas y le saca los acentos.</p>`,
      sid && st && st.lower === false ? '<button class="btn small primary" type="button" id="kpfLower">Activar minúsculas</button>' : '')}
  </ol></section>`;
}
function kpfHtml(has) {
  const O = kpfOpts(), fonts = kpfFontList(), kitsAll = has ? [...KS.kits, ...KS.gk] : [];
  if (has && (!KPFS.target || (KPFS.target !== '*' && !kitsAll.includes(KPFS.target)))) KPFS.target = KS.sel || '*';
  const n = KPF.chars(KPFS.sets).length, rng = (id, lab, v, min, max, step, fmt) => `<div class="f"><label for="${id}">${lab} <output>${fmt(v)}</output></label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}"></div>`;
  const st = KPFS.st, row = (ok, b, txt, fix) => `<li class="${ok === true ? 'ok' : ok === false ? 'bad' : ok === 'info' ? 'info' : 'unk'}"><i aria-hidden="true">${ok === true ? '✓' : ok === false ? '✕' : ok === 'info' ? '•' : '?'}</i><span><b>${b}</b> ${txt}</span>${fix || ''}</li>`;
  const sec = (i, t, body, cls = '') => `<div class="kpfsec ${cls}"><h5>${i ? `<i>${i}</i>` : ''}${t}</h5>${body}</div>`;
  const chip = (k, i, gk) => { const me = KS.meta[k]; return `<button type="button" class="kpfkit" data-kit="${esc(k)}" aria-pressed="${KPFS.target === k}" title="${esc(k)}">${shirtSvg(me || {}, '1.9em')}<span><b>${esc(k)}</b><small>${KS_ROLE(k, i, gk)}</small></span></button>`; };
  const step = KPFS.done ? 4 : has ? 3 : 2;
  return `<div class="kpf" id="kpfDrop">
    <header class="kpfhero"><div class="kpfht"><h2>🔤 Creador de fuentes</h2>
      <p class="note">La fuente del nombre de la camiseta con cualquier tipografía: mayúsculas, minúsculas, tildes, Ñ, cirílico y griego. Se guarda como la textura de letras del kit y la tabla de letras que lee KitPos.</p></div>
      <ol class="kpfsteps" aria-label="Pasos">${['Fuente', 'Estilo', 'Kit', 'Al juego'].map((x, i) => `<li class="${i + 1 < step ? 'done' : i + 1 === step ? 'now' : ''}"><i>${i + 1 < step ? '✓' : i + 1}</i>${x}</li>`).join('')}</ol>
      <span class="chip kpfn">${n} letras</span></header>
    ${kpfReqHtml()}
    <div class="kpfstudio">
      <aside class="kpfl">
        ${sec(1, 'Fuente', `<div class="kpffonts" id="kpfFonts" role="listbox" aria-label="Fuente">${fonts.map(f => `<button type="button" role="option" data-font="${esc(f)}" aria-selected="${f === O.font}" title="${esc(f)}"><b style="font-family:${esc(KPF.fontCss({ font: f }, 22).replace(/^.*?px /, ''))}">Aa Ññ</b><small>${esc(f)}</small></button>`).join('')}</div>
          <div class="kpfup"><button class="btn small primary" type="button" id="kpfUp">＋ Subir fuente</button><button class="btn small" type="button" id="kpfImg" title="Una textura de letras con el formato del juego (A a Z y el punto): esas letras se usan tal cual">🖼 Letras de una imagen</button></div>
          ${O.img ? `<div class="kpfimg"><canvas id="kpfImgTh" width="220" height="56"></canvas><div><b>${esc(O.imgName)}</b><small class="note">A–Z y el punto salen de la imagen; lo demás, de ${esc(O.font)}.</small>
            <label class="chk"><input type="checkbox" id="kpfImgSmall" ${O.imgSmall ? 'checked' : ''}> Minúsculas como mayúsculas más chicas</label><label class="chk"><input type="checkbox" id="kpfImgTint" ${O.imgTint ? 'checked' : ''}> Pintarlas con el color de relleno</label>
            <button class="btn small ghost" type="button" id="kpfImgX">Quitar la imagen</button></div></div>` : ''}
          <small class="note">.ttf, .otf o .woff; también podés arrastrar el archivo a esta pantalla. Las que subís quedan guardadas para la próxima.</small>`)}
        ${sec(0, '🎨 Plantilla de Photoshop', `${O.tpl ? `<div class="kpfimg kpftpl"><canvas id="kpfTplTh" width="440" height="112"></canvas><div><b>${esc(O.tplName)}</b><small class="note">${O.tpl.count} de ${O.tpl.total} letras dibujadas en la plantilla${O.tpl.count < O.tpl.total || n > O.tpl.count ? `; las demás (espacio, guion bajo${KPFS.sets.cyr ? ', cirílico' : ''}${KPFS.sets.greek ? ', griego' : ''}…) salen de ${esc(O.font)}` : ''}.${O.tplPsd ? ' Del .psd no se leen los efectos de capa: para conservarlos, cargá el PNG.' : ''}</small>
            <label class="chk"><input type="checkbox" id="kpfTplTint" ${O.tplTint ? 'checked' : ''}> Pintarlas con el color de relleno</label>
            <div class="kpfup"><button class="btn small" type="button" id="kpfTpl">↻ Cargar otra</button><button class="btn small ghost" type="button" id="kpfTplX">Quitar la plantilla</button></div></div></div>`
          : `<p class="note">Dibujá o retocá las letras en Photoshop, una por casilla, y traelas acá: pasan a la textura del juego tal cual, con sus colores y efectos.</p>
            <div class="kpfup"><button class="btn small primary" type="button" id="kpfTpl">📥 Cargar plantilla (.png o .psd)</button></div>`}
          <div class="kpfup"><button class="btn small ghost" type="button" id="kpfTplOut" title="PNG transparente de 4096 px con cada letra de la fuente en su casilla: pegalo en la capa Letras">⬇ Letras de esta fuente</button><button class="btn small ghost" type="button" id="kpfTplGd" title="Las casillas, la línea de base y el centro, para usar de fondo en cualquier programa">⬇ Guías</button></div>
          <details class="kpftplhow"><summary>Cómo se usa</summary><ol>
            <li>4096 px de ancho, una casilla de 256×256 por letra (A–Z, a–z, números, acentos y Europa central). Apoyá cada letra en la línea roja (a 200 px) y centrala en la marca de arriba.</li>
            <li>Dibujá en la capa <b>Letras</b>, o pegá ahí el PNG de "Letras de esta fuente" para partir de una tipografía y retocarla.</li>
            <li>Ocultá el fondo y las guías (acción <b>KitPos Preparar PNG</b>) y guardá como PNG con transparencia.</li>
            <li>Cargalo acá o arrastralo a esta pantalla. Las casillas vacías salen de la fuente elegida.</li></ol></details>`)}
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
        ${sec(3, 'Kit', `${has ? '' : `<p class="note">${KITS.from ? 'Este equipo no tiene carpeta en content\\kit-server: la fuente se descarga en un .zip para copiarla a mano a la carpeta de un kit.' : 'Sin la carpeta Sider conectada la fuente se descarga en un .zip para copiarla a mano a la carpeta del kit.'}</p>`}
          ${has ? `<div class="kpfkits" id="kpfKits"><button type="button" class="kpfkit all" data-kit="*" aria-pressed="${KPFS.target === '*'}"><span><b>Todos</b><small>${KS.kits.length} de jugador</small></span></button>${KS.kits.map((k, i) => chip(k, i, false)).join('')}${KS.gk.map((k, i) => chip(k, i, true)).join('')}</div>
          ${kplHtml(['back'], { size: [320, 380], note: false })}<p class="note">Arrastrá el nombre o el dorsal sobre la espalda: esquinas = tamaño, costados = ancho, manija de arriba = arco.${ksKpOn() ? ' Se guarda con 💾 Guardar posición.' : ''}</p>` : ''}`)}
        ${has ? kposHtml(['name'], { save: true }) : ''}
        ${sec(4, 'Llevarla al juego', `${has ? `<div class="kpfbtns"><button class="btn primary" type="button" id="kpfInstall">${window.pesNative ? '🎮 Instalar en el juego' : '💾 Guardar en la carpeta del kit'}</button>
            <button class="btn" type="button" id="kpfTry" title="Abre el Editor de Kit Studio Pro con la fuente puesta, sin guardarla">👁 Ver en el Editor</button>
            <button class="btn ghost" type="button" id="kpfZip">⬇ Descargar .zip</button><button class="btn ghost" type="button" id="kpfUndo" title="Vuelve a poner la textura de letras que tenía el kit (la copia .bak-edit21) y borra kitpos_letras.txt">↩ Volver a la anterior</button></div>`
            : `<p class="note">Sin un kit elegido la fuente se descarga en un .zip para copiarla a mano a la carpeta del kit.</p><div class="kpfbtns"><button class="btn primary" type="button" id="kpfZip">⬇ Descargar .zip</button></div>`}
          <p class="note kpflog" id="kpfLog" aria-live="polite">${esc(KPFS.log)}</p>
          ${has ? `<ul class="kpfst">${row(st ? st.kit || 'info' : null, 'Kit ' + esc(KS.sel), !st ? 'revisando…' : st.kit ? 'ya usa una fuente de KitPos (' + st.kitN + ' letras)' : 'usa la fuente común del juego')}</ul>` : ''}`, 'kpfgame')}
      </aside>
    </div>
    <details class="kpfhow"><summary>Cómo llega al juego</summary><ol>
      <li><b>KitPos en Sider.</b> Los cuatro requisitos de arriba: KitPos 6.4 o más nuevo en <span class="mono">modules\\kitpos.lua</span>, cargado en <span class="mono">sider.ini</span> debajo de kserv y con las minúsculas activadas. El editor trae KitPos: "Instalar KitPos" lo copia y agrega las líneas (con copia de sider.ini); "Descargar kitpos.lua" lo baja para copiarlo a mano.</li>
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
    KPF.drawText(g, tex, KPFS.sample || 'Fernández', W / 2, 170, 128, { ...o, maxW: W - 60 });
    const extra = [...new Set(KPF.chars(KPFS.sets).filter(c => !/[A-Za-z0-9 .\-'_]/.test(c)))].slice(0, 26).join('');
    KPF.drawText(g, tex, 'Aa Bb Cc Ññ 0123456789', W / 2, 336, 52, { maxW: W - 60 }); if (extra) KPF.drawText(g, tex, extra, W / 2, 436, 46, { maxW: W - 60 }); }
  const ac = sh.querySelector('#kpfAtlas'); if (ac) { const g = ac.getContext('2d'), hh = Math.round(ac.width * tex.height / tex.width); if (ac.height !== hh) ac.height = hh;
    for (let y = 0; y < ac.height; y += 10) for (let x = 0; x < ac.width; x += 10) { g.fillStyle = (x + y) / 10 % 2 ? '#2a2f36' : '#353b44'; g.fillRect(x, y, 10, 10); }
    g.drawImage(tex, 0, 0, ac.width, ac.height); g.strokeStyle = '#ffd84a33'; g.lineWidth = 1; const k = ac.width / tex.width;
    for (const c of R.L.cells) g.strokeRect(c.x * k + .5, c.row * KPF.ROW * k + .5, c.span * k, KPF.ROW * k); }
  const dim = sh.querySelector('#kpfDim'); if (dim) dim.textContent = `${R.L.W}×${R.L.H} px · ${R.L.cells.length} letras · DXT5`;
  const it = sh.querySelector('#kpfImgTh'), O = kpfOpts(); if (it && O.img) { const g = it.getContext('2d'); g.fillStyle = '#2a3038'; g.fillRect(0, 0, it.width, it.height); const z = Math.min(it.width / O.img.width, it.height / O.img.height); g.drawImage(O.img, 0, 0, O.img.width * z, O.img.height * z); }
  const tt = sh.querySelector('#kpfTplTh'); if (tt && O.tpl) { const g = tt.getContext('2d'), z = tt.height / 256; g.fillStyle = '#2a3038'; g.fillRect(0, 0, tt.width, tt.height);
    g.drawImage(tinted0(O.tpl.c, O), 0, 0, tt.width / z, 256, 0, 0, tt.width, tt.height); }
  kpfBack3d(sh);
}
const tinted0 = (c, O) => { if (!O.tplTint) return c; if (c.__th && c.__th.k === O.fill) return c.__th.c; const t = document.createElement('canvas'); t.width = 1024; t.height = 256; const g = t.getContext('2d'); g.drawImage(c, 0, 0, 1024, 256, 0, 0, 1024, 256); g.globalCompositeOperation = 'source-in'; g.fillStyle = O.fill; g.fillRect(0, 0, 1024, 256); c.__th = { k: O.fill, c: t }; return t; };
// la espalda del kit con el modelo 3D real, el nombre de prueba y la fuente nueva; ahí se ubican el nombre y el dorsal (kitplace.js)
function kpfWrap(fn) {
  const saveT = KS.T.name, saveS = KS.sample; if (KPFS.out) KS.T.name = { c: KPFS.out.canvas, file: '(sin guardar)', where: 'gen' }; KS.sample = { ...KS.sample, name: KPFS.sample || 'Fernández' }; KS.dispKey = '';
  try { return fn(); } finally { KS.T.name = saveT; KS.sample = saveS; KS.dispKey = ''; }
}
function kpfBack3d(sh, now) {
  if (!sh.querySelector('#kplBox') || !KPFS.has || !KS.cfg || !KPFS.out) return;
  clearTimeout(kpfBack3d.t); kpfBack3d.t = setTimeout(async () => {
    try {
      if (!KS.model || KS.modelFor !== KS.sel) { KS.model = await k3Load(KS.cfg); KS.modelKey = ''; KS.modelFor = KS.sel; }
      kplPaint(sh, KPFS.kplApi, KPL.drag ? 'back' : null);
    } catch (e) { const cv = sh.querySelector('canvas[data-kpl]'); if (cv) { const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); g.fillStyle = '#888'; g.font = '13px sans-serif'; g.fillText('No se pudo mostrar el 3D.', 12, 24); } }
  }, now ? 0 : 180);
}
function kpfRun(sh) {
  clearTimeout(kpfRun.t); kpfRun.t = setTimeout(() => {
    try { KPFS.out = KPF.render(kpfOpts(), KPF.chars(KPFS.sets)); KPFS.rev++; kpfDrawPreview(sh); kpfPresetThumbs(sh); }
    catch (e) { KPFS.out = null; const l = sh.querySelector('#kpfLog'); if (l) l.textContent = 'No se pudo armar la fuente: ' + e.message; }
  }, 90);
}
// ---- KitPos instalado y opciones ----
async function kpfCheck(has) {
  const st = { kitServer: null, lua: null, ver: '', verOk: null, ini: null, luajit: null, lower: null, kit: false, kitN: 0 };
  try {
    // los requisitos se revisan aunque el Sider no tenga kit-server
    let sider, kit = null;
    try { ({ sider, kit } = await ksRoot(false)); st.kitServer = true; } catch (e) { sider = await idbGet('sider'); if (!sider || (await sider.queryPermission({ mode: 'read' })) !== 'granted') throw e; st.kitServer = false; }
    try { const mods = await sider.getDirectoryHandle('modules'), t = await readText(mods, 'kitpos.lua'); st.lua = t != null; if (t) { const v = (t.match(/version\s*=\s*"([\d.]+)"/) || [])[1] || ''; st.ver = v; const [a, b] = v.split('.').map(Number); st.verOk = v ? (a > 6 || (a === 6 && (b || 0) >= 4)) : null; } } catch { st.lua = false; }
    let ini = null; try { ini = typeof siReadIni === 'function' ? await siReadIni(sider) : await readText(sider, 'sider.ini'); } catch { } if (ini != null) { const act = ini.split(/\r?\n/).filter(l => !/^\s*[;#]/.test(l)); st.ini = act.some(l => /^\s*lua\.module\s*=\s*"?kitpos\.lua"?\s*$/i.test(l)); st.luajit = act.some(l => /^\s*luajit\.ext\.enabled\s*=\s*1\b/i.test(l)); }
    try { const kd = await subDir(sider, 'content/kitpos'), s = await readText(kd, 'kitpos_slots.ini'); if (s != null) st.lower = !/^\s*minusculas_juego\s*=\s*0/m.test(s); else st.lower = true; } catch { st.lower = st.lua ? true : null; }
    if (has && kit && KS.sel && KS.path) { try { const kd = await (await subDir(kit, KS.path)).getDirectoryHandle(KS.sel), t = await readText(kd, 'kitpos_letras.txt'); if (t) { st.kit = true; st.kitN = KPF.parseLetras(t).length; } } catch { } }
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
  const stKey = KITS.from + '|' + (KITS.when || 0) + '|' + (has ? KS.path + '/' + KS.sel : '');
  if (KITS.from && (!KPFS.st || KPFS.stFor !== stKey)) { KPFS.stFor = stKey; KPFS.st = null; kpfCheck(has).then(st => { if (KPFS.stFor === stKey) { KPFS.st = st; rr(); } }); }
  if (has && !KPS.st) kpsLoad().then(rr);
  const on = (id, fn) => { const el = $k(id); if (!el) return; el.oninput = el.onchange = () => { fn(el); const o = el.closest('.f') && el.closest('.f').querySelector('output'); if (o && el.type === 'range') o.textContent = /Width|Size/.test(id) ? el.value + '%' : el.value; upd(); }; };
  on('kpfW', el => O.weight = +el.value); on('kpfIt', el => O.italic = el.checked); on('kpfWidth', el => O.width = el.value / 100); on('kpfSize', el => O.size = el.value / 100);
  on('kpfFill', el => O.fill = el.value); on('kpfGrad', el => { O.grad = el.checked; $k('kpfFill2').disabled = !el.checked; }); on('kpfFill2', el => O.fill2 = el.value);
  on('kpfSh', el => O.shadow = +el.value); on('kpfShC', el => O.shadowColor = el.value); on('kpfS1', el => O.stroke1 = +el.value); on('kpfC1', el => O.color1 = el.value); on('kpfS2', el => O.stroke2 = +el.value); on('kpfC2', el => O.color2 = el.value);
  on('kpfImgSmall', el => O.imgSmall = el.checked); on('kpfImgTint', el => O.imgTint = el.checked); on('kpfTplTint', el => O.tplTint = el.checked);
  $k('kpfFonts').onclick = e => { const b = e.target.closest('[data-font]'); if (!b) return; O.font = b.dataset.font; $k('kpfFonts').querySelectorAll('[data-font]').forEach(x => x.setAttribute('aria-selected', x === b)); upd(); };
  $k('kpfPre').onclick = e => { const b = e.target.closest('[data-pre]'); if (!b) return; const { n, ...p } = KPF_PRESETS[b.dataset.pre]; Object.assign(O, p); rr(); };
  $k('kpfSets').onclick = e => { const b = e.target.closest('[data-set]'); if (!b || b.disabled) return; KPFS.sets[b.dataset.set] = !KPFS.sets[b.dataset.set]; b.setAttribute('aria-pressed', !!KPFS.sets[b.dataset.set]); sh.querySelector('.kpfn').textContent = tr(KPF.chars(KPFS.sets).length + ' letras'); upd(); };
  const nm = $k('kpfName'); nm.oninput = () => { KPFS.sample = nm.value; $k('kpfSam').querySelectorAll('[data-s]').forEach(x => x.setAttribute('aria-pressed', x.dataset.s === nm.value)); kpfDrawPreview(sh); };
  $k('kpfSam').onclick = e => { const b = e.target.closest('[data-s]'); if (!b) return; KPFS.sample = nm.value = b.dataset.s; $k('kpfSam').querySelectorAll('[data-s]').forEach(x => x.setAttribute('aria-pressed', x === b)); kpfDrawPreview(sh); };
  $k('kpfView').onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; KPFS.view = b.dataset.v; $k('kpfView').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); $k('kpfShirt').hidden = KPFS.view === 'atlas'; sh.querySelector('.kpfatlas').hidden = KPFS.view !== 'atlas'; };
  // equipo y kit donde se prueba y se instala
  const kk = $k('kpfKits'); if (kk) kk.onclick = async e => { const b = e.target.closest('[data-kit]'); if (!b) return; KPFS.target = b.dataset.kit; KPFS.done = false;
    if (b.dataset.kit !== '*' && b.dataset.kit !== KS.sel) { if (KS.dirty && !await confirmBox('El kit ' + KS.sel + ' tiene cambios sin guardar en Kit Studio Pro. ¿Cambiar de kit igual?')) return; KS.model = null; try { await ksOpenKit(b.dataset.kit); } catch (er) { toast(er.message, 6000); } }
    rr(); };
  const pick = (accept, fn) => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept; inp.onchange = () => inp.files[0] && fn(inp.files[0]); inp.click(); };
  const addFile = async f => { const n = f.name.toLowerCase();
    try { let bmp = null; if (/\.(png|webp)$/.test(n)) { try { bmp = await createImageBitmap(f); } catch { } }
      if (n.endsWith('.psd') || (bmp && bmp.width >= 1024 && bmp.height / bmp.width > .85)) { const T = await kpfAddTemplate(f, bmp); toast(`Plantilla cargada: ${T.count} letras.`); }
      else if (/\.(ttf|otf|woff2?)$/.test(n)) { const fam = await kpfAddFont(f); toast('Fuente ' + fam + ' lista.'); } else if (/\.(png|jpe?g|webp|dds|ftex)$/.test(n)) { await kpfAddImage(f); toast('Letras de ' + f.name + ' cargadas.'); } else { toast('Ese archivo no es una fuente (.ttf, .otf, .woff), una imagen ni una plantilla (.psd).', 5000); return; } rr(); }
    catch (e) { toast('No se pudo usar ' + f.name + ': ' + e.message, 7000); } };
  $k('kpfUp').onclick = () => pick('.ttf,.otf,.woff,.woff2', addFile);
  $k('kpfImg').onclick = () => pick('.png,.jpg,.jpeg,.webp,.dds,.ftex', addFile);
  const ix = $k('kpfImgX'); if (ix) ix.onclick = () => { O.img = null; O.imgName = ''; rr(); };
  $k('kpfTpl').onclick = () => pick('.png,.webp,.psd', addFile);
  const tx = $k('kpfTplX'); if (tx) tx.onclick = () => { O.tpl = null; O.tplName = ''; rr(); };
  $k('kpfTplOut').onclick = async () => { try { await kpfPng(KPF.tplSheet({ ...O, tpl: null, img: O.img }), 'letras-plantilla-' + String(O.font).replace(/[^\w-]+/g, '-').toLowerCase() + '.png'); } catch (e) { toast('No se pudo: ' + e.message, 6000); } };
  $k('kpfTplGd').onclick = () => kpfPng(KPF.tplGuides(), 'guias-plantilla-kitpos.png');
  const dz = $k('kpfDrop'); dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); }; dz.ondragleave = e => { if (!dz.contains(e.relatedTarget)) dz.classList.remove('over'); };
  dz.ondrop = e => { e.preventDefault(); e.stopPropagation(); dz.classList.remove('over'); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) addFile(f); };
  const busy = (b, fn) => async () => { if (KPFS.busy) return; KPFS.busy = true; const btns = sh.querySelectorAll('.kpfgame .btn, .kpfreqs .btn'); btns.forEach(x => x.disabled = true);
    try { await fn(); } catch (e) { log('No se pudo: ' + e.message); toast('No se pudo: ' + e.message, 7000); } KPFS.busy = false; btns.forEach(x => x.disabled = false); };
  const ins = $k('kpfInstall'); if (ins) ins.onclick = busy(ins, async () => {
    const done = await kpfInstall(log), kp = await kpsSave(); KPFS.st = null; KPFS.stFor = ''; KPFS.done = true;
    log('Listo: ' + done.join(' · ') + (kp ? ' · posición en kitpos_slots.ini' : '') + '. Abrí el juego de nuevo para verla.'); toast('Fuente guardada en ' + done.length + (done.length > 1 ? ' kits' : ' kit') + '. Abrí el juego de nuevo para verla.', 8000); rr(); });
  const tr3 = $k('kpfTry'); if (tr3) tr3.onclick = () => { if (!KPFS.out) return;
    KS.T.name = { c: KPFS.out.canvas, file: '(sin guardar)', where: 'gen' }; KS.sample = { ...KS.sample, name: KPFS.sample || KS.sample.name }; KS.texRev = (KS.texRev || 0) + 1; KS.dispKey = ''; KS.mode = 'edit'; KS.view = '3d'; rr();
    setTimeout(() => { const w = document.getElementById('ks3dWrap'); if (w) w.scrollIntoView({ block: 'center', behavior: 'smooth' }); const b = document.querySelector('[data-cam="back"]'); if (b) b.click(); }, 500); toast('Probando la fuente en el Editor. Para que el juego la use, volvé a 🔤 Fuentes y tocá el botón de guardar.', 7000); };
  const dl = $k('kpfKpDl'); if (dl) dl.onclick = busy(dl, async () => { const r = await fetch('sider/kitpos.lua', { cache: 'no-cache' }), t = r.ok ? await r.text() : '', v = (t.match(/local m = \{ version = "([\d.]+)"/) || [])[1];
    if (!v) throw new Error('no se pudo bajar kitpos.lua (¿sin internet?)'); await downloadBytes('kitpos.lua', new TextEncoder().encode(t)); log('Descargado kitpos.lua (KitPos ' + v + '): copialo a Sider\\modules y agregá sus líneas en sider.ini.'); });
  const cp = $k('kpfIniCp'); if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(KPF_INI.replace(/\n/g, '\r\n')); toast('Líneas copiadas: pegalas en sider.ini, en la parte de [sider].'); } catch { toast('No se pudo copiar: seleccioná las líneas y copialas a mano.', 5000); } };
  const zp = $k('kpfZip'); if (zp) zp.onclick = busy(zp, async () => { const f = await kpfZip(log); log('Descargado: ' + f + '.dds, ' + f + '.ftex, kitpos_letras.txt y LEEME.txt.'); });
  const un = $k('kpfUndo'); if (un) un.onclick = busy(un, async () => { if (!await confirmBox('¿Volver a la textura de letras que tenía ' + KS.sel + ' y borrar su kitpos_letras.txt?')) return; const n = await kpfUndo(); KPFS.st = null; KPFS.stFor = ''; KPFS.done = false; await ksLoadSlots(); log(n ? 'Listo: ' + KS.sel + ' volvió a su fuente anterior.' : 'No había nada para volver atrás en ' + KS.sel + '.'); rr(); });
  const lw = $k('kpfLower'); if (lw) lw.onclick = busy(lw, async () => { await kpfLowerOn(); KPFS.st = null; KPFS.stFor = ''; toast('Minúsculas activadas en kitpos_slots.ini.'); rr(); });
  for (const id of ['kpfKp', 'kpfKp2']) { const b = $k(id); if (b) b.onclick = busy(b, async () => { const r = await kpsInstall(); KPFS.st = null; KPFS.stFor = '';
    toast(r.lua === 'mas-nuevo' ? 'Ya tenías una versión más nueva de KitPos: no se tocó.' : 'KitPos ' + (r.lua === 'actualizado' ? 'actualizado' : r.lua === 'nuevo' ? 'instalado' : 'listo') + (r.ini === 'agregado' ? ' y agregado a sider.ini (copia en sider.ini.bak-pes-editor)' : r.ini === 'oculto' ? '. Falta agregar lua.module = "kitpos.lua" en sider.ini (debajo de kserv.lua): hacelo en la pestaña Sider' : '') + '. Abrí el juego de nuevo.', 10000); rr(); }); }
  // posición, tamaño y arco del nombre (KitPos)
  kposBind(sh, () => kpfDrawPreview(sh), rr);
  KPFS.kplApi = { cfg: false, wrap: kpfWrap, changed: () => { KS.dispKey = ''; if (KPS.sync) KPS.sync(); if (kpfBind.raf) return; kpfBind.raf = requestAnimationFrame(() => { kpfBind.raf = 0; if (sh.querySelector('#kpfShirt')) kpfDrawPreview(sh); kpfBack3d(sh, true); }); } };
  kplBind(sh, KPFS.kplApi);
  kpfPresetThumbs(sh);
  if (KPFS.out && KPFS.outFor === JSON.stringify([O.font, KPFS.sets])) kpfDrawPreview(sh);
  KPFS.outFor = JSON.stringify([O.font, KPFS.sets]); kpfRun(sh);
  document.fonts && document.fonts.ready.then(() => { kpfRun(sh); });
}
