// ===================== Creador de fuentes para KitPos (Kit Studio Pro › 🔤 Fuentes) =====================
// KitPos (módulo de Sider) dibuja el nombre de la camiseta con una fuente propia cuando la carpeta del kit tiene
// kitpos_letras.txt: una línea por letra con  código_utf8_hex  ancho  alto  u0 v0 u1 v1  (dónde está la letra dentro de
// la textura del nombre, la de NameFontFile). Así entran minúsculas, acentos, cirílico y griego.
// La textura que arma KitPos: 4096 px de ancho, filas de 256 px; cada letra ocupa 2×ancho+4 px (2 de margen a cada
// lado), entre letra y letra quedan 16 px y "alto" es siempre 124. La línea de base queda a 200 px del borde de arriba.
// Fuente general (la que funciona en el juego, igual que la carpeta p1 de un kit que ya la usa): sin kitpos_letras.txt en el kit,
// la textura del nombre (uXXXXpN_name.dds/.ftex, 4096×4096 DXT5 con 13 mips) lleva cada letra en el lugar exacto que dice
// content\kitpos\minusculas.txt, y el kit tiene NameLower = 1 en kitpos_slots.ini. Esa tabla es una sola para todos los kits,
// así que la fuente se dibuja dentro de sus casillas (fromTable): mismo orden, mismo ancho de cada letra.
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
  // casillas de una tabla ya hecha (minusculas.txt): cada letra en el mismo lugar y con el mismo ancho que dice la tabla
  function fromTable(list) {
    if (!list || !list.length) throw new Error('la tabla de letras (minusculas.txt) está vacía.');
    const e0 = list[0], H = Math.round(ROW / ((e0.v1 - e0.v0) || 1));
    if (![512, 1024, 2048, 4096].includes(H)) throw new Error('la tabla de letras (minusculas.txt) no tiene filas de 256 px.');
    const cells = list.map(e => ({ ch: e.ch, w: e.w, x: Math.round(e.u0 * W), row: Math.round(e.v0 * H / ROW), span: Math.round((e.u1 - e.u0) * W) }));
    return { cells, rows: Math.max(...cells.map(c => c.row)) + 1, W, H, table: true };
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
  // table: la tabla de minusculas.txt ya leída (parseLetras); sin ella las letras se ubican solas y hace falta kitpos_letras.txt
  function render(o, list, table) {
    if (table) list = table.map(e => e.ch);
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
    const L = table ? fromTable(table) : layout(metrics), c = document.createElement('canvas'); c.width = L.W; c.height = L.H;
    // con la tabla general cada letra entra en su casilla: un ancho común para toda la fuente (el de las letras A–Z y a–z)
    // y, si alguna igual no entra, se angosta solo esa; queda centrada en la casilla
    const nat = mt => mt.right - mt.left, fitK = [];
    if (table) { const r = L.cells.map((cell, i) => /[A-Za-z]/.test(cell.ch) && nat(metrics[i]) > 0 ? (cell.span - 4) / nat(metrics[i]) : null).filter(Boolean).sort((a, b) => a - b);
      const k0 = r.length ? Math.max(.5, Math.min(2, r[r.length >> 1])) : 1;
      L.cells.forEach((cell, i) => { const n = nat(metrics[i]); fitK[i] = n > 0 ? Math.min(k0, (cell.span - 4) / n) : 1; }); }
    const g = c.getContext('2d', { willReadFrequently: true }); g.font = fontCss(o, fs); g.textBaseline = 'alphabetic'; g.lineJoin = 'round'; g.miterLimit = 2;
    const fill = () => { if (!o.grad) return o.fill; const gr = g.createLinearGradient(0, -capPx, 0, 0); gr.addColorStop(0, o.fill); gr.addColorStop(1, o.fill2 || o.fill); return gr; };
    L.cells.forEach((cell, i) => {
      const mt = metrics[i], fx = table ? fitK[i] : 1, pad = table ? Math.max(0, (cell.span - 4 - nat(mt) * fx) / 2) : 0;
      const ox = cell.x + 2 + pad - mt.left * fx, by = cell.row * ROW + BASE + (+o.lift || 0);
      if (mt.tpl) { const { q, k, bear } = mt.tpl, iw = q.x1 - q.x0; g.save(); g.beginPath(); g.rect(cell.x, cell.row * ROW, cell.span, ROW); g.clip();
        g.drawImage(tsrc, q.col * ROW + q.x0, q.row * ROW, iw, ROW, ox + bear * fx, by - BASE * k, iw * k * wS * fx, ROW * k); g.restore(); return; }
      if (mt.img) { const { q, k, bear } = mt.img; g.drawImage(src, q.sx, q.sy, q.sw, q.sh, ox + bear * fx, by + q.top * k, q.sw * k * wS * fx, q.sh * k); return; }
      if (cell.ch === ' ') return;
      g.save(); if (table) { g.beginPath(); g.rect(cell.x, cell.row * ROW, cell.span, ROW); g.clip(); } g.translate(ox, by); g.scale(wS * fx, 1);
      const draw = (style, lw) => { if (lw) { g.lineWidth = lw; g.strokeStyle = style; g.strokeText(cell.ch, 0, 0); } g.fillStyle = style; g.fillText(cell.ch, 0, 0); };
      if (sh) { g.save(); g.translate(sh / (wS * fx), sh); draw(o.shadowColor || '#000000', ext * 2); g.restore(); }
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
  // ---- kitpos_letras.txt del kit: la misma tabla que minusculas.txt, copiada línea por línea ----
  // Con este archivo en la carpeta del kit, KitPos usa la fuente en ese kit aunque falte NameLower en kitpos_slots.ini
  // (los navegadores esconden los .ini) o aunque la carpeta se copie a mano a otro Sider. Las líneas son las de la tabla con
  // la que se dibujó la textura, así que el orden de las letras es el mismo que con minusculas.txt.
  const TBL_RE = /^\s*[0-9A-Fa-f]+\s+\d+\s+\d+\s+[\d.]+\s+[\d.]+\s+[\d.]+\s+[\d.]+/;
  function kitTable(text, label) {
    const rows = String(text || '').split(/\r?\n/).filter(l => TBL_RE.test(l)).slice(0, MAX).map(l => l.trim());
    return ['; kitpos_letras.txt - tabla de letras de la textura del nombre de este kit (KitPos 6.4 o superior)',
      `; la misma tabla que content\\kitpos\\minusculas.txt (${rows.length} letras)${label ? ' | fuente: ' + String(label).replace(/\s*[\r\n;]+\s*/g, ' ') : ''}`,
      '; creada con PES Editor Rebuilt (Kit Studio Pro > Fuentes)', '; codigo_utf8_hex  ancho  alto  u0 v0 u1 v1', ...rows].join('\r\n') + '\r\n';
  }
  // dos tablas ya leídas (parseLetras) ubican las mismas letras en el mismo lugar
  const near = (a, b) => Math.abs(a - b) < 2e-5;
  const sameTable = (a, b) => !!a && !!b && a.length > 0 && a.length === b.length && a.every((e, i) => { const f = b[i]; return e.code === f.code && near(e.u0, f.u0) && near(e.v0, f.v0) && near(e.u1, f.u1) && near(e.v1, f.v1); });

  // ---- revisar una textura de letras ----
  // ancho y alto de un .dds o .ftex por su cabecera
  function texSize(u8) {
    if (!u8 || u8.length < 20) return null; const v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), sig = String.fromCharCode(u8[0], u8[1], u8[2], u8[3]);
    if (sig === 'DDS ' && u8.length >= 128) return { w: v.getUint32(16, true), h: v.getUint32(12, true), fmt: String.fromCharCode(u8[84], u8[85], u8[86], u8[87]).replace(/\0/g, '') };
    if (sig === 'FTEX') return { w: v.getUint16(10, true), h: v.getUint16(12, true), fmt: v.getUint16(8, true) === 4 ? 'DXT5' : 'DXT' };
    return null;
  }
  // qué formato tiene: la de KitPos (cuadrada, letras en el lugar de la tabla) o la del juego (4:1, dos filas de mayúsculas)
  const texKind = s => !s || !s.w || !s.h ? null : s.w === s.h ? 'kitpos' : s.w === 4 * s.h ? 'game' : 'other';
  // dónde hay tinta, de a bloques de 4×4: de un .dds DXT5 (el alfa de cada bloque, sin descomprimir) o de píxeles RGBA
  function inkDxt5(u8, W, H, maxY = 1024) {
    const bw = W >> 2, bh = Math.min(H, maxY) >> 2, ink = new Uint8Array(bw * bh);
    for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) { const o = 128 + (by * bw + bx) * 16; if (o + 1 >= u8.length) break; ink[by * bw + bx] = Math.max(u8[o], u8[o + 1]) > 40 ? 1 : 0; }
    return { bw, bh, ink };
  }
  function inkRgba(px, W, H, maxY = 1024) {
    const bw = W >> 2, bh = Math.min(H, maxY) >> 2, ink = new Uint8Array(bw * bh);
    for (let y = 0; y < bh * 4; y++) for (let x = 0; x < bw * 4; x++) if (px[(y * W + x) * 4 + 3] > 40) ink[(y >> 2) * bw + (x >> 2)] = 1;
    return { bw, bh, ink };
  }
  // ¿las letras están donde dice la tabla (minusculas.txt), o en casillas de plantilla (16 por fila de 256 px)?
  // Se miran las primeras filas: con la tabla casi toda la tinta cae dentro de sus casillas; en la plantilla cada letra queda
  // centrada en su casilla de 256 px. 'table' | 'grid' | 'unknown'
  function layoutGuess(I, W, H, list) {
    const inside = new Uint8Array(I.ink.length), sx = W / 4096;
    for (const e of list || []) { const y0 = Math.floor(e.v0 * H / 4), y1 = Math.ceil(e.v1 * H / 4), x0 = Math.floor(e.u0 * W / 4), x1 = Math.ceil(e.u1 * W / 4);
      for (let y = Math.max(0, y0); y < Math.min(I.bh, y1); y++) for (let x = Math.max(0, x0); x < Math.min(I.bw, x1); x++) inside[y * I.bw + x] = 1; }
    let tot = 0, out = 0; for (let i = 0; i < I.ink.length; i++) if (I.ink[i]) { tot++; if (!inside[i]) out++; }
    if (tot < 40) return 'unknown';
    const cell = Math.round(ROW * sx / 4); let inked = 0, centered = 0;
    for (let r = 0; r * cell < I.bh; r++) for (let c = 0; c < 16; c++) { let a = cell, b = -1;
      for (let y = r * cell; y < Math.min(I.bh, (r + 1) * cell); y++) for (let x = c * cell; x < (c + 1) * cell && x < I.bw; x++) if (I.ink[y * I.bw + x]) { if (x - c * cell < a) a = x - c * cell; if (x - c * cell > b) b = x - c * cell; }
      if (b < 0) continue; inked++; if (Math.abs((a + b + 1) / 2 - cell / 2) < cell * .19 && a > 0 && b < cell - 1) centered++; }
    if (out / tot < .04) return 'table';
    return inked >= 8 && centered / inked > .7 ? 'grid' : 'unknown';
  }
  // lo que dejó el juego en sider.log la última vez que se abrió (desde la última línea "Sider DLL: version")
  function logDiag(text) {
    const all = String(text || '').split(/\r?\n/); let s = -1;
    for (let i = all.length - 1; i >= 0; i--) if (/^Sider DLL: version/.test(all[i])) { s = i; break; }
    if (s < 0) return null;
    const L = all.slice(s), kp = L.filter(l => /kitpos/i.test(l)), has = re => kp.some(l => re.test(l)), m1 = (re, from = kp) => { for (const l of from) { const m = l.match(re); if (m) return m; } return null; };
    const st = m1(/kitpos: (hook_ok|hook_off|bad_bytes|no_ffi|no_mem|far)\b\s*(.*)$/);
    return { sider: (m1(/version\s+([\d.]+)/, L.slice(0, 3)) || [])[1] || '', exe: (m1(/([^\\\/\s]+\.exe)/i, L.slice(0, 4)) || [])[1] || '',
      listed: has(/Loading module: kitpos\.lua/i), init: has(/initialized: kitpos\.lua/i), problem: (kp.find(l => /PROBLEM|Unable to open/i.test(l)) || '').trim(),
      status: st ? st[1] : '', statusArg: st ? st[2].trim() : '', curve: has(/curva y separacion del nombre activas/), lower: has(/minusculas activas/),
      missing: kp.filter(l => /no disponible/.test(l)).length, table: +((m1(/minusculas\.txt: (\d+) letras/) || [])[1] || 0), noTable: has(/no hay minusculas\.txt/),
      fonts: kp.map(l => l.match(/fuente del kit: (.+?) \((\d+) letras\)/)).filter(Boolean).map(m => ({ file: m[1], n: +m[2] })) };
  }
  // por qué la fuente de un kit se ve (o no) en el juego. x: lo que se pudo leer (cada dato puede faltar = null)
  //   log (logDiag) · lua · verOk · ini · luajit · lowerGame · font (NameFontFile) · dds/ftex ({w,h}) · table ('same'|'other'|null)
  //   nameLower · layout ('table'|'grid'|'unknown') · stale (el juego no se abrió desde que se guardó)
  // Devuelve [{ lvl: 'ok'|'bad'|'warn'|'info', k, fix }] (los textos los arma la pantalla según k)
  function diagnose(x) {
    const out = [], add = (lvl, k, fix) => out.push({ lvl, k, fix: fix || null });
    if (!x.font) { add('bad', 'no-font'); return out; }
    if (!x.dds && !x.ftex) { add('warn', 'no-tex'); return out; }
    if (x.dds && x.ftex && (x.dds.w !== x.ftex.w || x.dds.h !== x.ftex.h)) add('bad', 'dds-ftex');
    const tex = x.ftex || x.dds, kind = texKind(tex), L = x.log, kpOn = x.table === 'same' || x.table === 'other' || x.nameLower === true;
    if (kind === 'game') {
      if (kpOn) add('bad', 'game-with-table', 'clear'); else add('ok', 'game-ok');
      return out;
    }
    if (kind === 'other') { add(x.table ? 'info' : 'bad', x.table ? 'other-own' : 'other-no-table'); return out; }
    // textura de KitPos (cuadrada): hace falta KitPos funcionando y que este kit le pida su tabla
    if (x.lua === false || x.ini === false || x.luajit === false || (L && !L.listed)) add('bad', 'kp-off', 'kp');
    else if (L && L.problem) add('bad', 'kp-error');
    else if (L && L.status && L.status !== 'hook_ok') add('bad', L.status === 'no_ffi' ? 'kp-noffi' : 'kp-exe', L.status === 'no_ffi' ? 'kp' : 'game');
    else if (L && L.status === 'hook_ok' && !L.lower) add('bad', 'kp-nolower', 'game');
    else if (x.verOk === false) add('bad', 'kp-old', 'kp');
    if (L && L.noTable && x.table !== 'same') add('bad', 'no-minusculas', 'table');
    // letras en casillas de plantilla: primero hay que reacomodarlas (al guardar, la textura y su tabla quedan juntas)
    const grid = x.layout === 'grid'; if (grid) add('bad', 'grid', 'tpl');
    if (x.table === 'other') add('bad', 'table-other', grid ? null : 'table');
    else if (!kpOn) add('bad', 'no-table', grid ? null : 'table');
    if (x.lowerGame === false) add('warn', 'upper-only', 'lower');
    if (!out.some(e => e.lvl === 'bad')) add('ok', x.layout === 'table' ? 'kp-ok' : 'kp-ok-unk');
    if (x.stale) add('info', 'stale');
    return out;
  }
  return { W, ROW, BASE, CAP, MAX, SETS, TPL, TPL_W, TPL_H, chars, hex, unhex, layout, fromTable, letrasTxt, parseLetras, glyphMap, zipMany, render, drawText, fontCss, imgGlyphs, tplCells, tplScan, psdRead, tplLayers, tplFill, tplLoad, tplSheet, tplGuides,
    kitTable, sameTable, texSize, texKind, inkDxt5, inkRgba, layoutGuess, logDiag, diagnose };
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
// la tabla de letras: content\kitpos\minusculas.txt de la carpeta Sider (la que lee KitPos) o, si no está, la que trae el editor
async function kpfTable() {
  const key = (typeof KITS !== 'undefined' && KITS.from || '') + '|' + (typeof KITS !== 'undefined' && KITS.when || 0);
  if (KPFS.tbl && KPFS.tbl.for === key) return KPFS.tbl;
  let text = null, src = 'editor', list = [];
  try { const { sider } = await ksRoot(false); text = await readText(await subDir(sider, 'content/kitpos'), 'minusculas.txt'); list = KPF.parseLetras(text); KPF.fromTable(list); src = 'sider'; } catch { text = null; list = []; }
  if (!list.length) { const r = await fetch('sider/minusculas.txt', { cache: 'no-cache' }); text = r.ok ? await r.text() : ''; list = KPF.parseLetras(text); }
  if (!list.length) throw new Error('no se pudo leer la tabla de letras (minusculas.txt). ¿Sin internet?');
  return KPFS.tbl = { list, text, src, for: key };
}
const kpfN = () => KPFS.tbl ? KPFS.tbl.list.length : 371;
function kpfOpts() { return KPFS.o || (KPFS.o = { font: 'Saira Condensed', weight: 700, italic: false, width: 1, size: 1, fill: '#ffffff', fill2: '#c9d4e6', grad: false, stroke1: 0, color1: '#000000', stroke2: 0, color2: '#ffffff', shadow: 0, shadowColor: '#000000', img: null, imgName: '', imgSmall: true, imgTint: false }); }
// Formato del juego (sin KitPos): la textura de 4096×1024 con A–Z y el punto en las casillas del juego (KFONT), con el mismo
// estilo. El nombre sale en mayúsculas, pero lo dibuja el juego solo: sirve en cualquier juego y con cualquier Sider.
// Con una plantilla de Photoshop, sus mayúsculas van en cada casilla (misma altura de mayúscula para todas).
function kpfGameCanvas(o) {
  const c = KFONT.generate('name', { ...o, fallback: 'sans-serif' }), g = c.getContext('2d', { willReadFrequently: true }), T = o.tpl;
  if (T) { const src = KPF_tint(T.c, o), cap = T.cap || KPF.CAP;
    for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ.') { const q = T.g.get(ch); if (!q) continue; const [x, y, w, h] = KFONT.cell('name', ch, c.width, c.height), iw = q.x1 - q.x0;
      const k = h * .84 / cap, dw = Math.min(iw * k * (o.width || 1), w * .92), dh = KPF.ROW * k, cy = y + h / 2 - (KPF.BASE - cap / 2) * k; // misma línea de base para todas
      g.clearRect(x, y, w, h); g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.drawImage(src, q.col * KPF.ROW + q.x0, q.row * KPF.ROW, iw, KPF.ROW, x + (w - dw) / 2, cy, dw, dh); g.restore(); } }
  // donde no hay letra, el color del relleno (si no, al achicarse la textura los bordes se oscurecen)
  const im = g.getImageData(0, 0, c.width, c.height), d = im.data, fc = (o.fill || '#ffffff').match(/[0-9a-f]{2}/gi).map(h => parseInt(h, 16));
  for (let i = 0; i < d.length; i += 4) if (!d[i + 3]) { d[i] = fc[0]; d[i + 1] = fc[1]; d[i + 2] = fc[2]; }
  g.putImageData(im, 0, 0); return c;
}
const KPF_tint = (c, o) => { if (!o.tplTint) return c; const t = document.createElement('canvas'); t.width = c.width; t.height = c.height; const g = t.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = o.fill; g.fillRect(0, 0, t.width, t.height); return t; };
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
function kpfReqHtml(req = kpfReqState()) {
  const sid = !!KITS.from, st = sid ? KPFS.st : null, wait = sid && !st;
  const mark = ok => ok === true ? ['ok', '✓', 'Listo'] : ok === false ? ['bad', '✕', 'Falta'] : ok === 'later' ? ['unk later', '○', 'Después de instalar KitPos'] : !sid ? ['unk', '○', 'Sin revisar'] : wait ? ['unk', '…', 'Revisando'] : ['unk', '?', 'No se pudo revisar'];
  const item = (n, ok, title, body, btns) => { const [c, i, l] = mark(ok); return `<li class="kpfreq ${c}"><div class="kpfrh"><i>${n}</i><b>${title}</b><span class="chip ${c === 'ok' ? 'ok' : c === 'bad' ? 'warn' : ''}"><span aria-hidden="true">${i}</span> ${l}</span></div>${body}${btns ? `<div class="kpfup">${btns}</div>` : ''}</li>`; };
  const [, luaOk, iniOk] = req, bad = req.filter(x => x === false).length;
  return `<details class="kpfreqs" aria-label="Requisitos" ${bad || !st || KPFS.reqOpen ? 'open' : ''}><summary>${bad ? '⚠' : '✅'} Requisitos para verla en el juego <small>${!st ? '' : bad ? `falta${bad > 1 ? 'n' : ''} ${bad}` : 'todo listo'}</small></summary><ol>
    ${item(1, req[0], 'Sider con kserv', '<p class="note">Sider con el módulo <span class="mono">kserv.lua</span> y la carpeta <span class="mono">content\\kit-server</span>, donde viven los kits.</p>', sid ? '' : '<button class="btn small primary" type="button" data-kits>Conectar carpeta Sider</button>')}
    ${item(2, luaOk, 'Descargar KitPos 6.4 o más nuevo', `<p class="note">KitPos es el módulo de Sider que dibuja el nombre con esta fuente. Va en <span class="mono">Sider\\modules\\kitpos.lua</span>.${st && st.lua ? ` Tenés la versión ${esc(st.ver || '?')}${st.verOk === false ? ': hace falta la 6.4 o una más nueva.' : '.'}` : st && st.lua === false ? ' No está en la carpeta modules.' : ''}</p>`,
      `${sid && st && (st.lua === false || st.verOk === false) ? `<button class="btn small primary" type="button" id="kpfKp" title="Copia el kitpos.lua que trae el editor a modules y agrega sus líneas en sider.ini (con copia)">${st.lua ? '⟳ Actualizar KitPos' : '🎮 Instalar KitPos'}</button>` : ''}<button class="btn small" type="button" id="kpfKpDl" title="Baja el kitpos.lua que trae el editor para copiarlo a mano en Sider\\modules">⬇ Descargar kitpos.lua</button>`)}
    ${item(3, iniOk, 'Configurarlo en sider.ini', `<p class="note">${st && st.ini && st.luajit === false ? 'Carga kitpos.lua, pero falta <span class="mono">luajit.ext.enabled = 1</span>. ' : st && st.ini === false ? 'Todavía no carga kitpos.lua. ' : st && st.ini == null ? 'El navegador no deja leer los .ini: en la app de Windows se revisa solo, o elegí sider.ini en la pestaña Sider. ' : ''}La línea de KitPos va debajo de la de kserv:</p><pre class="kpfini">${esc(KPF_INI)}</pre>`,
      `${sid && st && iniOk === false ? '<button class="btn small primary" type="button" id="kpfKp2" title="Agrega las líneas que faltan (con copia sider.ini.bak-pes-editor)">🔧 Arreglar sider.ini</button>' : ''}<button class="btn small ghost" type="button" id="kpfIniCp">📋 Copiar líneas</button>`)}
    ${item(4, req[3], 'Minúsculas activadas', `<p class="note">En <span class="mono">content\\kitpos\\kitpos_slots.ini</span>, sección <span class="mono">[opciones]</span>: <span class="mono">minusculas_juego = 1</span> (viene así de fábrica). Si está en 0, el juego pasa el nombre a mayúsculas y le saca los acentos.</p>`,
      sid && st && st.lower === false ? '<button class="btn small primary" type="button" id="kpfLower">Activar minúsculas</button>' : '')}
  </ol></details>`;
}
function kpfHtml(has) {
  const O = kpfOpts(), fonts = kpfFontList(), kitsAll = has ? [...KS.kits, ...KS.gk] : [];
  if (has && (!KPFS.target || (KPFS.target !== '*' && !kitsAll.includes(KPFS.target)))) KPFS.target = KS.sel || '*';
  const n = kpfN(), rng = (id, lab, v, min, max, step, fmt) => `<div class="f"><label for="${id}">${lab} <output>${fmt(v)}</output></label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}"></div>`;
  const st = KPFS.st, row = (ok, b, txt, fix) => `<li class="${ok === true ? 'ok' : ok === false ? 'bad' : ok === 'info' ? 'info' : 'unk'}"><i aria-hidden="true">${ok === true ? '✓' : ok === false ? '✕' : ok === 'info' ? '•' : '?'}</i><span><b>${b}</b> ${txt}</span>${fix || ''}</li>`;
  const chip = (k, i, gk) => { const me = KS.meta[k]; return `<button type="button" class="kpfkit" data-kit="${esc(k)}" aria-pressed="${KPFS.target === k}" title="${esc(k)}">${shirtSvg(me || {}, '1.9em')}<span><b>${esc(k)}</b><small>${KS_ROLE(k, i, gk)}</small></span></button>`; };
  // por pasos: un paso a la vez a la izquierda y la vista previa siempre a la vista
  const tab = KPFS.tab = Math.min(4, Math.max(1, KPFS.tab || 1)), st0 = KPFS.st;
  const req = kpfReqState(), reqBad = req.filter(x => x === false).length, reqOk = req.filter(x => x === true).length;
  const kitLab = has ? (KPFS.target === '*' ? 'Todos' : esc(KPFS.target || KS.sel)) : '.zip';
  const tabs = [['Fuente', esc(O.tpl ? 'Plantilla' : O.img ? 'Imagen' : O.font)], ['Estilo', 'Colores y bordes'], ['Kit', kitLab], ['Al juego', KPFS.fmt === 'game' ? 'Solo mayúsculas' : 'Con minúsculas']];
  const nav = i => `<div class="kpfnav">${i > 1 ? `<button class="btn ghost" type="button" data-go="${i - 1}">← ${tabs[i - 2][0]}</button>` : '<span></span>'}${i < 4 ? `<button class="btn primary" type="button" data-go="${i + 1}">Siguiente: ${tabs[i][0]} →</button>` : ''}</div>`;
  const panel = (i, h, body) => `<section class="kpfpanel" data-p="${i}" role="tabpanel" aria-labelledby="kpfTab${i}"><div class="kpfph" role="heading" aria-level="3"><i>${i}</i>${h}</div>${body}${nav(i)}</section>`;
  const reqChip = KPFS.fmt === 'game' ? '<span class="chip ok">🔠 Sin KitPos</span>' : !KITS.from ? '<span class="chip">Sider sin conectar</span>' : !st0 ? '<span class="chip">Revisando el juego…</span>'
    : `<button type="button" class="chip ${reqBad ? 'warn' : 'ok'} kpfreqchip" data-go="4" data-req="1">${reqBad ? `⚠ Falta${reqBad > 1 ? 'n' : ''} ${reqBad} requisito${reqBad > 1 ? 's' : ''}` : `✓ Requisitos ${reqOk}/4`}</button>`;
  return `<div class="kpf" id="kpfDrop" data-step="${tab}">
    <header class="kpfhero"><div class="kpfht"><h2>🔤 Creador de fuentes</h2>
      <p class="note">El nombre de la camiseta con cualquier tipografía: mayúsculas, minúsculas, tildes, Ñ, cirílico y griego. Cuatro pasos y queda en el kit.</p></div>
      <div class="kpfchips"><span class="chip kpfn">${n} letras</span>${reqChip}</div>
      <nav class="kpftabs" role="tablist" aria-label="Pasos">${tabs.map(([t, sub], i) => `<button type="button" role="tab" id="kpfTab${i + 1}" data-go="${i + 1}" aria-selected="${tab === i + 1}" class="${i + 1 < tab || (i === 3 && KPFS.done) ? 'done' : ''}"><i>${i + 1 < tab || (i === 3 && KPFS.done) ? '✓' : i + 1}</i><span><b>${t}</b><small>${sub}</small></span></button>`).join('')}
        <span class="kpfprog" aria-hidden="true"><i style="width:${KPFS.done && tab === 4 ? 100 : (tab - 1) / 3 * 100}%"></i></span></nav></header>
    <div class="kpfwork">
      <div class="kpfpanels">
        ${panel(1, 'Elegí la fuente', `<div class="kpfsec"><div class="kpffonts" id="kpfFonts" role="listbox" aria-label="Fuente">${fonts.map(f => `<button type="button" role="option" data-font="${esc(f)}" aria-selected="${f === O.font}" title="${esc(f)}"><b style="font-family:${esc(KPF.fontCss({ font: f }, 22).replace(/^.*?px /, ''))}">Aa Ññ</b><small>${esc(f)}</small></button>`).join('')}</div>
          <div class="kpfup"><button class="btn small primary" type="button" id="kpfUp">＋ Subir fuente</button><button class="btn small" type="button" id="kpfImg" title="Una textura de letras con el formato del juego (A a Z y el punto): esas letras se usan tal cual">🖼 Letras de una imagen</button></div>
          ${O.img ? `<div class="kpfimg"><canvas id="kpfImgTh" width="220" height="56"></canvas><div><b>${esc(O.imgName)}</b><small class="note">A–Z y el punto salen de la imagen; lo demás, de ${esc(O.font)}.</small>
            <label class="chk"><input type="checkbox" id="kpfImgSmall" ${O.imgSmall ? 'checked' : ''}> Minúsculas como mayúsculas más chicas</label><label class="chk"><input type="checkbox" id="kpfImgTint" ${O.imgTint ? 'checked' : ''}> Pintarlas con el color de relleno</label>
            <button class="btn small ghost" type="button" id="kpfImgX">Quitar la imagen</button></div></div>` : ''}
          <small class="note">.ttf, .otf o .woff; también podés arrastrar el archivo a esta pantalla. Las que subís quedan guardadas para la próxima.</small></div>
          <details class="kpfsec kpfmore" ${O.tpl ? 'open' : ''}><summary>🎨 Plantilla de Photoshop <small>${O.tpl ? esc(O.tplName) : 'letras dibujadas a mano'}</small></summary>${O.tpl ? `<div class="kpfimg kpftpl"><canvas id="kpfTplTh" width="440" height="112"></canvas><div><b>${esc(O.tplName)}</b><small class="note">${O.tpl.count} de ${O.tpl.total} letras dibujadas en la plantilla${O.tpl.count < O.tpl.total || n > O.tpl.count ? `; las demás (espacio, cirílico, griego…) salen de ${esc(O.font)}` : ''}.${O.tplPsd ? ' Del .psd no se leen los efectos de capa: para conservarlos, cargá el PNG.' : ''}</small>
            <label class="chk"><input type="checkbox" id="kpfTplTint" ${O.tplTint ? 'checked' : ''}> Pintarlas con el color de relleno</label>
            <div class="kpfup"><button class="btn small" type="button" id="kpfTpl">↻ Cargar otra</button><button class="btn small ghost" type="button" id="kpfTplX">Quitar la plantilla</button></div></div></div>`
          : `<p class="note">Dibujá o retocá las letras en Photoshop, una por casilla, y traelas acá: pasan a la textura del juego tal cual, con sus colores y efectos.</p>
            <div class="kpfup"><button class="btn small primary" type="button" id="kpfTpl">📥 Cargar plantilla (.png o .psd)</button></div>`}
          <div class="kpfup"><button class="btn small ghost" type="button" id="kpfTplOut" title="PNG transparente de 4096 px con cada letra de la fuente en su casilla: pegalo en la capa Letras">⬇ Letras de esta fuente</button><button class="btn small ghost" type="button" id="kpfTplGd" title="Las casillas, la línea de base y el centro, para usar de fondo en cualquier programa">⬇ Guías</button></div>
          <details class="kpftplhow"><summary>Cómo se usa</summary><ol>
            <li>4096 px de ancho, una casilla de 256×256 por letra (A–Z, a–z, números, acentos y Europa central). Apoyá cada letra en la línea roja (a 200 px) y centrala en la marca de arriba.</li>
            <li>Dibujá en la capa <b>Letras</b>, o pegá ahí el PNG de "Letras de esta fuente" para partir de una tipografía y retocarla.</li>
            <li>Ocultá el fondo y las guías (acción <b>KitPos Preparar PNG</b>) y guardá como PNG con transparencia.</li>
            <li>Cargalo acá o arrastralo a esta pantalla. Las casillas vacías salen de la fuente elegida.</li></ol></details></details>
          <details class="kpfsec kpfmore"><summary>🔠 Qué letras van <small>${n}</small></summary><p class="note">Van las ${n} de la tabla de KitPos, <span class="mono">content\\kitpos\\minusculas.txt</span>${KPFS.tbl && KPFS.tbl.src === 'sider' ? ' de tu carpeta Sider' : ''}: mayúsculas, minúsculas, números, tildes, Ñ, Europa central, cirílico y griego. Cada letra queda en el mismo lugar y con el mismo ancho que dice esa tabla, que es lo que lee el juego.</p></details>`)}
        ${panel(2, 'Dale estilo', `<div class="kpfsec"><div class="kpfpres" id="kpfPre">${Object.entries(KPF_PRESETS).map(([k, p]) => `<button type="button" data-pre="${k}" title="${p.n}"><canvas data-prethumb="${k}" width="120" height="54"></canvas><span>${p.n}</span></button>`).join('')}</div>
          <div class="grid2"><div class="f"><label for="kpfW">Grosor</label><select id="kpfW">${[[400, 'Normal'], [600, 'Semi negrita'], [700, 'Negrita'], [800, 'Extra negrita'], [900, 'Black']].map(([v, l]) => `<option value="${v}" ${+O.weight === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
            <div class="f"><span class="lab">&nbsp;</span><label class="chk"><input type="checkbox" id="kpfIt" ${O.italic ? 'checked' : ''}> Cursiva</label></div></div>
          <div class="grid2">${rng('kpfWidth', 'Ancho', Math.round(O.width * 100), 60, 140, 1, v => v + '%')}${rng('kpfSize', 'Tamaño', Math.round(O.size * 100), 70, 110, 1, v => v + '%')}</div>
          <div class="kpfcolors"><div class="f"><label for="kpfFill">Relleno</label><div class="row"><input type="color" id="kpfFill" value="${O.fill}"><label class="chk"><input type="checkbox" id="kpfGrad" ${O.grad ? 'checked' : ''}> Degradado</label><input type="color" id="kpfFill2" value="${O.fill2}" aria-label="Color de abajo del degradado" ${O.grad ? '' : 'disabled'}></div></div>
            <div class="f"><label for="kpfSh">Sombra <output>${O.shadow}</output></label><div class="row"><input type="range" id="kpfSh" min="0" max="12" value="${O.shadow}"><input type="color" id="kpfShC" value="${O.shadowColor}" aria-label="Color de la sombra"></div></div>
            <div class="f"><label for="kpfS1">Borde <output>${O.stroke1}</output></label><div class="row"><input type="range" id="kpfS1" min="0" max="14" value="${O.stroke1}"><input type="color" id="kpfC1" value="${O.color1}" aria-label="Color del borde"></div></div>
            <div class="f"><label for="kpfS2">Segundo borde <output>${O.stroke2}</output></label><div class="row"><input type="range" id="kpfS2" min="0" max="14" value="${O.stroke2}"><input type="color" id="kpfC2" value="${O.color2}" aria-label="Color del segundo borde"></div></div></div></div>`)}
        ${panel(3, 'Elegí el kit', `<div class="kpfsec">${has ? '' : `<p class="note">${KITS.from ? 'Este equipo no tiene carpeta en content\\kit-server: la fuente se descarga en un .zip para copiarla a mano a la carpeta de un kit.' : 'Sin la carpeta Sider conectada la fuente se descarga en un .zip para copiarla a mano a la carpeta del kit.'}</p>`}
          ${has ? `<div class="kpfkits" id="kpfKits"><button type="button" class="kpfkit all" data-kit="*" aria-pressed="${KPFS.target === '*'}"><span><b>Todos</b><small>${KS.kits.length} de jugador</small></span></button>${KS.kits.map((k, i) => chip(k, i, false)).join('')}${KS.gk.map((k, i) => chip(k, i, true)).join('')}</div>
          ${kplHtml(['back'], { size: [320, 380], note: false })}<p class="note">Arrastrá el nombre o el dorsal sobre la espalda: esquinas = tamaño, costados = ancho, manija de arriba = arco.${ksKpOn() ? ' Se guarda con 💾 Guardar posición.' : ''}</p>` : ''}</div>${has ? `<details class="kpfsec kpfmore kpfposd" ${KPFS.posOpen ? 'open' : ''}><summary>📐 Posición libre <small>KitPos</small></summary>${kposHtml(['name'], { save: true })}</details>` : ''}`)}
        ${panel(4, 'Llevala al juego', `<div class="kpfsec kpfgame">${kpfFmtHtml()}${KPFS.fmt === 'game' ? '' : kpfReqHtml(req)}${has ? `<div class="kpfbtns"><button class="btn primary" type="button" id="kpfInstall">${window.pesNative ? '🎮 Instalar en el juego' : '💾 Guardar en la carpeta del kit'}</button>
            <button class="btn" type="button" id="kpfTry" title="Abre el Editor de Kit Studio Pro con la fuente puesta, sin guardarla">👁 Ver en el Editor</button>
            <button class="btn ghost" type="button" id="kpfZip">⬇ Descargar .zip</button><button class="btn ghost" type="button" id="kpfUndo" title="Vuelve a poner la textura de letras que tenía el kit (la copia .bak-edit21)">↩ Volver a la anterior</button></div>`
            : `<p class="note">Sin un kit elegido la fuente se descarga en un .zip para copiarla a mano a la carpeta del kit.</p><div class="kpfbtns"><button class="btn primary" type="button" id="kpfZip">⬇ Descargar .zip</button></div>`}
          <p class="note kpflog ${KPFS.done && KPFS.log ? 'saved' : ''} ${KPFS.doneAnim ? 'anim' : ''}" id="kpfLog" aria-live="polite">${esc(KPFS.log)}</p>
          ${has ? `<ul class="kpfst">${row(st ? st.kit || 'info' : null, 'Kit ' + esc(KS.sel), !st ? 'revisando…' : st.old ? 'tiene un kitpos_letras.txt de otra textura (' + st.kitN + ' letras): al guardar se reemplaza por la tabla correcta' : st.own === 'same' ? 'tiene su tabla de letras (kitpos_letras.txt, ' + st.kitN + ' letras)' : st.kit ? 'ya usa una fuente con minúsculas (NameLower = 1, ' + st.kitN + ' letras)' : 'usa la fuente común del juego')}</ul>${kpfDiagHtml()}` : ''}</div>${kpfGuideHtml()}`)}
      </div>
      <div class="kpfc kpfstick">
        <div class="kpfsample"><label class="lab" for="kpfName">Nombre de prueba</label><input type="text" id="kpfName" value="${esc(KPFS.sample)}" maxlength="24"><div class="fchips" id="kpfSam">${KPF_SAMPLES.map(s => `<button type="button" data-s="${esc(s)}" aria-pressed="${s === KPFS.sample}">${esc(s)}</button>`).join('')}</div></div>
        <div class="kpfstage">
          <div class="seg kpfview" id="kpfView">${[['shirt', '👕 Camiseta'], ['atlas', '🔠 Textura de letras']].map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${(KPFS.view || 'shirt') === v}">${l}</button>`).join('')}</div>
          <canvas id="kpfShirt" width="1100" height="520" aria-label="Vista previa del nombre en la camiseta" ${KPFS.view === 'atlas' ? 'hidden' : ''}></canvas>
          <div class="kpfatlas" ${KPFS.view === 'atlas' ? '' : 'hidden'}><canvas id="kpfAtlas" width="1100" height="275" aria-label="Textura de letras generada"></canvas><small class="note mono" id="kpfDim">—</small></div>
        </div>
      </div>
    </div>
  </div>`;
}
// los 4 requisitos (kserv, KitPos, sider.ini, minúsculas): true listo, false falta, null sin revisar, 'later' después de KitPos
function kpfReqState() {
  const st = KITS.from ? KPFS.st : null; if (!st) return [null, null, null, null];
  return [st.kitServer, st.lua ? st.verOk !== false : st.lua, st.ini && st.luajit !== false ? true : st.ini === false || st.luajit === false ? false : null, st.lower == null && st.lua === false ? 'later' : st.lower];
}
// ---- formato: con minúsculas (KitPos) o solo mayúsculas (el del juego, sin KitPos) ----
const kpfEn = () => typeof LANG !== 'undefined' && LANG === 'en';
function kpfFmtHtml() {
  const f = KPFS.fmt === 'game' ? 'game' : 'kitpos';
  return `<div class="seg kpffmt" id="kpfFmt" role="group" aria-label="Formato de la textura">
      <button type="button" data-fmt="kitpos" aria-pressed="${f === 'kitpos'}"><b>🔡 Con minúsculas</b><small>KitPos 6.4 · PES 2021</small></button>
      <button type="button" data-fmt="game" aria-pressed="${f === 'game'}"><b>🔠 Solo mayúsculas</b><small>Cualquier juego, sin KitPos</small></button></div>
    <p class="note kpffmtn">${f === 'game' ? 'Textura de 4096×1024 con el formato del juego: A–Z y el punto en dos filas. El nombre sale en mayúsculas, pero lo dibuja el juego solo, con cualquier Sider.' : `Textura de 4096×4096 con las ${kpfN()} letras y su tabla (kitpos_letras.txt) en la carpeta del kit. Necesita KitPos funcionando en el juego.`}</p>`;
}
// ---- revisar un kit: por qué la fuente se ve, no se ve o se ve mal en el juego ----
// Textos de cada resultado de KPF.diagnose: [título, explicación] en español e inglés; {x} se completa con lo leído
const KPF_DIAG = {
  'no-font': { es: ['El kit no tiene NameFontFile', 'En el config.txt del kit falta NameFontFile, así que el juego no sabe qué textura de letras usar. Guardá la fuente con el botón de arriba y el editor lo completa.'], en: ['The kit has no NameFontFile', 'The kit\'s config.txt has no NameFontFile, so the game does not know which letter texture to use. Save the font with the button above and the editor fills it in.'] },
  'no-tex': { es: ['No está la textura {file}', 'NameFontFile dice {file}, pero en la carpeta del kit no hay {file}.ftex ni {file}.dds. El juego la busca en otro lado (un livecpk o la del juego) o no pone nombre. Guardá la fuente acá o copiá la textura a esa carpeta.'], en: ['Texture {file} is missing', 'NameFontFile says {file}, but the kit folder has no {file}.ftex or {file}.dds. The game looks for it somewhere else (a livecpk or its own files) or shows no name. Save the font here or copy the texture into that folder.'] },
  'dds-ftex': { es: ['El .dds y el .ftex no son la misma textura', 'El .dds mide {dds} y el .ftex {ftex}. kserv lee primero el .ftex, así que si se cambió solo el .dds el juego sigue con la vieja. Es la causa más común de "a veces anda y a veces no". Guardá de nuevo desde acá (escribe los dos) o borrá el que sobra.'], en: ['The .dds and the .ftex are different textures', 'The .dds is {dds} and the .ftex is {ftex}. kserv reads the .ftex first, so if only the .dds was replaced the game keeps the old one. It is the most common reason for "sometimes it works, sometimes it doesn\'t". Save again from here (it writes both) or delete the extra one.'] },
  'game-with-table': { es: ['Textura del juego con tabla de KitPos', 'La textura tiene el formato del juego (4:1, dos filas de mayúsculas), pero el kit le pide a KitPos su tabla (kitpos_letras.txt o NameLower = 1). KitPos recorta las letras en lugares donde no están y salen cortadas o mezcladas.'], en: ['Game-format texture with a KitPos table', 'The texture uses the game format (4:1, two rows of capitals), but the kit asks KitPos for its table (kitpos_letras.txt or NameLower = 1). KitPos crops letters where there are none, so they come out cut or mixed up.'] },
  'game-ok': { es: ['Formato del juego: listo', 'El nombre sale en mayúsculas con esta fuente en cualquier juego, con o sin KitPos. Si no cambió, cerrá y abrí el juego.'], en: ['Game format: ready', 'The name shows in capitals with this font in any game, with or without KitPos. If it did not change, close the game and open it again.'] },
  'other-own': { es: ['Textura de una versión anterior ({w}×{h})', 'Trae su propia tabla. Funciona si la tabla y la textura se armaron juntas; si las letras salen cambiadas, guardá la fuente de nuevo y queda con el formato actual.'], en: ['Texture from an older version ({w}×{h})', 'It has its own table. It works if the table and texture were made together; if the letters come out wrong, save the font again to get the current format.'] },
  'other-no-table': { es: ['Textura de {w}×{h} sin tabla', 'No es la del juego (4:1) ni la de KitPos (4096×4096), y el kit no tiene kitpos_letras.txt: no hay forma de ubicar las letras. Guardá la fuente de nuevo desde acá.'], en: ['{w}×{h} texture without a table', 'It is neither the game format (4:1) nor the KitPos one (4096×4096), and the kit has no kitpos_letras.txt, so the letters cannot be found. Save the font again from here.'] },
  'kp-off': { es: ['KitPos no se está cargando', 'Sin KitPos el juego usa sus propias casillas (dos filas de mayúsculas) sobre la textura de 4096×4096: cada letra agarra una columna entera y en la espalda aparece toda la hoja de letras, chiquita y amontonada. Fijate los requisitos de arriba: kitpos.lua en modules, su línea en sider.ini debajo de kserv.lua y luajit.ext.enabled = 1.{logn}'], en: ['KitPos is not loading', 'Without KitPos the game uses its own boxes (two rows of capitals) on the 4096×4096 texture: each letter grabs a whole column and the entire letter sheet shows up tiny and crammed on the back. Check the requirements above: kitpos.lua in modules, its sider.ini line below kserv.lua and luajit.ext.enabled = 1.{logn}'] },
  'kp-error': { es: ['KitPos dio un error al arrancar', 'sider.log dice: {problem}'], en: ['KitPos failed to start', 'sider.log says: {problem}'] },
  'kp-exe': { es: ['KitPos no se pudo enganchar a {exe}', 'KitPos cambia el juego en direcciones fijas del ejecutable para el que está hecho. En este no encontró lo que esperaba ({status}), así que el nombre se dibuja como lo hace el juego. Pasa con otras versiones del juego, ejecutables modificados o Football Life. "Solo mayúsculas" funciona igual.'], en: ['KitPos could not hook into {exe}', 'KitPos patches the game at fixed addresses of the executable it was made for. It did not find what it expected here ({status}), so the game draws the name its own way. It happens with other game versions, modified executables or Football Life. "Capitals only" still works.'] },
  'kp-noffi': { es: ['Falta luajit.ext.enabled = 1', 'KitPos arrancó, pero Sider no le da acceso a la memoria del juego (FFI). Agregá luajit.ext.enabled = 1 en sider.ini.'], en: ['luajit.ext.enabled = 1 is missing', 'KitPos started, but Sider does not give it access to the game memory (FFI). Add luajit.ext.enabled = 1 to sider.ini.'] },
  'kp-nolower': { es: ['KitPos arrancó, pero sin minúsculas', 'En sider.log los ganchos de las minúsculas dicen "no disponible" ({n}): este ejecutable no es el que espera KitPos. Nombre y números se mueven, pero la fuente con minúsculas no se puede usar. Usá "Solo mayúsculas".'], en: ['KitPos started, but without lowercase', 'In sider.log the lowercase hooks say "no disponible" ({n}): this executable is not the one KitPos expects. Name and numbers can be moved, but the lowercase font cannot be used. Use "Capitals only".'] },
  'kp-old': { es: ['KitPos es viejo ({ver})', 'Las fuentes con minúsculas necesitan KitPos 6.4 o uno más nuevo.'], en: ['KitPos is old ({ver})', 'Lowercase fonts need KitPos 6.4 or newer.'] },
  'no-minusculas': { es: ['Falta content\\kitpos\\minusculas.txt', 'KitPos no encontró la tabla general al arrancar. El kit puede andar con su kitpos_letras.txt, pero conviene tenerla: el editor la copia.'], en: ['content\\kitpos\\minusculas.txt is missing', 'KitPos did not find the general table at startup. The kit can work with its kitpos_letras.txt, but it is better to have it: the editor copies it.'] },
  'table-other': { es: ['La tabla del kit es de otra textura', 'La carpeta del kit tiene un kitpos_letras.txt distinto de la tabla con la que se arma la textura: KitPos busca cada letra en el lugar equivocado y salen letras cambiadas o partidas.'], en: ['The kit\'s table belongs to another texture', 'The kit folder has a kitpos_letras.txt that differs from the table the texture is built with: KitPos looks for each letter in the wrong place, so letters come out swapped or cut.'] },
  'no-table': { es: ['Este kit no le pide la fuente a KitPos', 'La textura es de KitPos (4096×4096), pero el kit no tiene kitpos_letras.txt ni NameLower = 1 en kitpos_slots.ini. Entonces KitPos no hace nada y el juego usa sus casillas de mayúsculas: en la espalda sale toda la hoja de letras, chiquita y amontonada. Pasa al copiar solo la textura, o si el navegador no dejó guardar kitpos_slots.ini.'], en: ['This kit does not ask KitPos for the font', 'The texture is a KitPos one (4096×4096), but the kit has no kitpos_letras.txt and no NameLower = 1 in kitpos_slots.ini. So KitPos does nothing and the game uses its capital-letter boxes: the whole letter sheet shows up tiny and crammed on the back. It happens when only the texture is copied, or when the browser could not save kitpos_slots.ini.'] },
  'grid': { es: ['Las letras están en casillas de plantilla', 'La textura tiene una letra por casilla de 256 px, como la plantilla de Photoshop, pero KitPos las busca donde dice la tabla (minusculas.txt). Por eso mayúsculas y minúsculas salen en el lugar equivocado. El editor puede leer esta textura como plantilla y poner cada letra en su lugar.'], en: ['The letters are in template boxes', 'The texture has one letter per 256 px box, like the Photoshop template, but KitPos looks for them where the table (minusculas.txt) says. That is why capitals and lowercase land in the wrong place. The editor can read this texture as a template and put each letter where it belongs.'] },
  'upper-only': { es: ['minusculas_juego = 0', 'El juego pasa los nombres a mayúsculas y les saca los acentos antes de dibujarlos.'], en: ['minusculas_juego = 0', 'The game turns names into capitals and strips accents before drawing them.'] },
  'kp-ok': { es: ['Todo en orden', 'KitPos está activo, el kit tiene su tabla y las letras están en su lugar. Si en el juego no cambió, cerralo y abrilo: KitPos lee las tablas una vez por partida y el juego guarda las texturas en memoria.'], en: ['Everything looks right', 'KitPos is active, the kit has its table and the letters are in place. If nothing changed in the game, close it and open it again: KitPos reads the tables once per session and the game keeps textures in memory.'] },
  'kp-ok-unk': { es: ['Todo en orden', 'KitPos está activo y el kit tiene su tabla. No se pudo mirar dónde están las letras dentro de la textura. Si en el juego no cambió, cerralo y abrilo.'], en: ['Everything looks right', 'KitPos is active and the kit has its table. The letter positions inside the texture could not be checked. If nothing changed in the game, close it and open it again.'] },
  'stale': { es: ['No abriste el juego desde que guardaste', 'sider.log es de antes de la última vez que se guardó la textura: lo que dice de KitPos es de la partida anterior.'], en: ['The game was not opened since saving', 'sider.log is older than the last time the texture was saved: what it says about KitPos is from the previous session.'] },
};
const KPF_FIX = { table: ['🔧 Arreglar este kit', '🔧 Fix this kit'], clear: ['Quitar la tabla de KitPos', 'Remove the KitPos table'], tpl: ['🔁 Reacomodar las letras', '🔁 Rearrange the letters'], game: ['🔠 Usar solo mayúsculas', '🔠 Use capitals only'], kp: ['🎮 Instalar KitPos', '🎮 Install KitPos'], lower: ['Activar minúsculas', 'Turn on lowercase'] };
function kpfDiagText(k, x) {
  const t = (KPF_DIAG[k] || { es: [k, ''], en: [k, ''] })[kpfEn() ? 'en' : 'es'], tex = x.ftex || x.dds || {}, sz = s => s ? s.w + '×' + s.h : '—', L = x.log || {};
  const v = { file: x.font || '', dds: sz(x.dds), ftex: sz(x.ftex), w: tex.w, h: tex.h, exe: L.exe || 'PES2021.exe', status: L.status + (L.statusArg ? ' ' + L.statusArg : ''), problem: L.problem || '', n: L.missing || 0, ver: x.ver || '?',
    logn: x.log && !L.listed ? (kpfEn() ? ' In the last start (sider.log) kitpos.lua does not show up.' : ' En el último arranque (sider.log) no aparece kitpos.lua.') : '' };
  return t.map(s => s.replace(/\{(\w+)\}/g, (_, k2) => v[k2] ?? ''));
}
function kpfDiagHtml() {
  const D = KPFS.diag && KPFS.diag.kit === KS.sel && KPFS.diag.path === KS.path ? KPFS.diag : null, en = kpfEn(), ic = { ok: '✓', bad: '✕', warn: '!', info: 'i' };
  const L = D && D.x.log, when = D && D.x.logAt ? new Date(D.x.logAt).toLocaleString(en ? 'en-GB' : 'es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  const kpTxt = L ? (L.status === 'hook_ok' ? (L.lower ? (en ? 'KitPos active with lowercase' : 'KitPos activo con minúsculas') : (en ? 'KitPos active, no lowercase' : 'KitPos activo, sin minúsculas')) : L.listed ? 'KitPos: ' + (L.status || (en ? 'no status' : 'sin estado')) : (en ? 'no KitPos' : 'sin KitPos')) : '';
  return `<div class="kpfdiag" data-noi18n>
    <div class="kpfdh"><button class="btn small" type="button" id="kpfDiag">🩺 ${en ? 'Check this kit in the game' : 'Revisar este kit en el juego'}</button>${D ? `<small class="note">${esc(KS.sel)}</small>` : ''}</div>
    ${D ? `<ul class="${KPFS.diagAnim ? 'anim' : ''}">${D.items.map(it => { const [t, d] = kpfDiagText(it.k, D.x); return `<li class="${it.lvl}"><i aria-hidden="true">${ic[it.lvl]}</i><div><b>${esc(t)}</b><p>${esc(d)}</p>${it.fix ? `<button class="btn small ${it.lvl === 'bad' ? 'primary' : ''}" type="button" data-dfix="${it.fix}">${KPF_FIX[it.fix][en ? 1 : 0]}</button>` : ''}</div></li>`; }).join('')}</ul>
      <small class="note">${L ? `sider.log ${esc(when)} · Sider ${esc(L.sider || '?')} · ${esc(L.exe || '?')} · ${esc(kpTxt)}` : (en ? 'sider.log could not be read: the check uses only the kit folder and sider.ini.' : 'No se pudo leer sider.log: se revisó solo la carpeta del kit y sider.ini.')}</small>`
      : `<small class="note">${en ? 'Reads the kit folder, its texture and table, and what KitPos wrote in sider.log the last time the game was opened.' : 'Lee la carpeta del kit, su textura y su tabla, y lo que KitPos dejó en sider.log la última vez que se abrió el juego.'}</small>`}
  </div>`;
}
async function kpfDiagRun() {
  const { sider, kit } = await ksRoot(false), kd = await (await subDir(kit, KS.path)).getDirectoryHandle(KS.sel), T = await kpfTable(), st = await kpfCheck(true);
  await kpsLoad();
  const x = { font: (cfgGet(KS.cfg, 'NameFontFile') || '').trim() || null, lua: st.lua, verOk: st.verOk, ver: st.ver, ini: st.ini, luajit: st.luajit, lowerGame: st.lower };
  let texT = 0; const head = async name => { try { const f = await (await kd.getFileHandle(name)).getFile(); texT = Math.max(texT, f.lastModified); return { f, s: KPF.texSize(new Uint8Array(await f.slice(0, 128).arrayBuffer())) }; } catch { return null; } };
  const dds = x.font ? await head(x.font + '.dds') : null, ftex = x.font ? await head(x.font + '.ftex') : null; x.dds = dds && dds.s; x.ftex = ftex && ftex.s;
  const t = await readText(kd, 'kitpos_letras.txt'); x.table = t == null ? null : KPF.sameTable(KPF.parseLetras(t), T.list) ? 'same' : 'other';
  x.nameLower = KPS.cur ? kpsVals().NameLower === 1 : null;
  // dónde están las letras: alcanza con las primeras filas del .dds (el alfa de cada bloque); si solo hay .ftex, se descomprime
  if (KPF.texKind(x.ftex || x.dds) === 'kitpos') {
    try {
      if (dds && dds.s && dds.s.fmt === 'DXT5' && (!x.ftex || (x.ftex.w === x.dds.w && x.ftex.h === x.dds.h))) { const W = dds.s.w, H = dds.s.h, u8 = new Uint8Array(await dds.f.slice(0, 128 + W * Math.min(1024, H)).arrayBuffer()); x.layout = KPF.layoutGuess(KPF.inkDxt5(u8, W, H), W, H, T.list); }
      else if (ftex) { const img = await ftexDecode(await ftex.f.arrayBuffer(), 4096); x.layout = KPF.layoutGuess(KPF.inkRgba(img.data, img.w, img.h), img.w, img.h, T.list); }
    } catch { x.layout = 'unknown'; }
  }
  try { const f = await (await sider.getFileHandle('sider.log')).getFile(); x.log = KPF.logDiag(await f.text()); x.logAt = f.lastModified; if (x.log && texT && f.lastModified < texT) x.stale = true; } catch { x.log = null; }
  return KPFS.diag = { x, items: KPF.diagnose(x), kit: KS.sel, path: KS.path };
}
// arreglos que ofrece la revisión; devuelve el mensaje para mostrar
async function kpfDiagFix(kind) {
  const en = kpfEn();
  if (kind === 'game') { KPFS.fmt = 'game'; return en ? 'Format: capitals only. Press save to put it in the kit.' : 'Formato: solo mayúsculas. Tocá Guardar para dejarla en el kit.'; }
  if (kind === 'kp') { const r = await kpsInstall(); return 'KitPos ' + (r.lua === 'mas-nuevo' ? (en ? 'was already newer' : 'ya era más nuevo') : (en ? 'installed' : 'instalado')) + (r.ini === 'oculto' ? (en ? '. Add lua.module = "kitpos.lua" to sider.ini (Sider tab).' : '. Falta lua.module = "kitpos.lua" en sider.ini (pestaña Sider).') : '') + (en ? '. Open the game again.' : '. Abrí el juego de nuevo.'); }
  if (kind === 'lower') { await kpfLowerOn(); return en ? 'Lowercase turned on in kitpos_slots.ini.' : 'Minúsculas activadas en kitpos_slots.ini.'; }
  const { kit } = await ksRoot(true), kd = await (await subDir(kit, KS.path)).getDirectoryHandle(KS.sel), T = await kpfTable();
  if (kind === 'table') {
    await kpfKitTable(kd, { game: false, T }); await kpfPutTable(T); await kpsLoad(); let ini = false;
    if (KPS.cur && KPS.st && KPS.st.slots !== 'hidden') { KPS.curText = KPOS.setValues(KPS.curText, kpfKitSec(KS.sel), { NameLower: 1 }); KPS.cur = KPOS.parse(KPS.curText); await kpsSave(); ini = true; }
    return (en ? 'Done: kitpos_letras.txt in ' : 'Listo: kitpos_letras.txt en ') + KS.sel + (ini ? ' · NameLower = 1' : '') + (en ? '. Close the game and open it again.' : '. Cerrá el juego y abrilo de nuevo.');
  }
  if (kind === 'clear') {
    await kpfKitTable(kd, { game: true, T }); await kpsLoad();
    if (KPS.cur && KPS.st && KPS.st.slots !== 'hidden' && (KPS.cur.secs[kpfKitSec(KS.sel)] || {}).NameLower != null) { KPS.curText = KPOS.setValues(KPS.curText, kpfKitSec(KS.sel), { NameLower: null }); KPS.cur = KPOS.parse(KPS.curText); await kpsSave(); }
    return en ? 'Done: the kit uses the game format again (copy in .bak-edit21).' : 'Listo: el kit vuelve a usar el formato del juego (copia en .bak-edit21).';
  }
  if (kind === 'tpl') { // la textura del kit, leída como plantilla: sus letras pasan al lugar de la tabla al guardar
    const file = (cfgGet(KS.cfg, 'NameFontFile') || '').trim(); let img = null;
    try { img = DDS.decode(await (await (await kd.getFileHandle(file + '.dds')).getFile()).arrayBuffer()); } catch { img = await ftexDecode(await (await (await kd.getFileHandle(file + '.ftex')).getFile()).arrayBuffer(), 4096); }
    const T2 = KPF.tplLoad(imgToCanvas(img)); Object.assign(kpfOpts(), { tpl: T2, tplName: file, tplPsd: false }); KPFS.fmt = 'kitpos';
    return (en ? `The kit texture was loaded as a template (${T2.count} letters). Press save: each letter goes where KitPos looks for it.` : `La textura del kit quedó cargada como plantilla (${T2.count} letras). Tocá Guardar: cada letra va donde la busca KitPos.`);
  }
  return '';
}
// ---- guía: cómo llega la fuente al juego, cómo inyectarla a mano y por qué a veces falla ----
const KPF_GUIDE = {
  es: { sum: '📘 Guía: cómo llega la fuente al juego, cómo inyectarla a mano y por qué a veces falla',
    how: 'Cómo funciona', how1: [
      'El juego no escribe el nombre con una tipografía: arma una imagen por jugador copiando cada letra desde la <b>textura de letras del kit</b>, la que dice <span class="mono">NameFontFile</span> en su config.txt.',
      'Para saber dónde está cada letra usa <b>casillas fijas</b>: dos filas de mayúsculas, A a N arriba y O a Z con el punto abajo, en una textura 4:1 (por ejemplo 4096×1024). Por eso, solo, el juego no tiene minúsculas.',
      '<b>KitPos</b> (módulo de Sider) cambia esa búsqueda en los kits que se lo piden: cada letra sale de una <b>tabla</b> (código, ancho y recorte u0 v0 u1 v1). Así entran minúsculas, tildes, Ñ, cirílico y griego en una textura de 4096×4096.',
      'Un kit le pide la tabla a KitPos de dos maneras: con un <span class="mono">kitpos_letras.txt</span> en su carpeta, o con <span class="mono">NameLower = 1</span> en su sección de <span class="mono">content\\kitpos\\kitpos_slots.ini</span> (usa la tabla general <span class="mono">minusculas.txt</span>). El editor hace las dos cosas, con la misma tabla.',
      'Si la textura es de KitPos pero el kit no pide la tabla, o KitPos no está andando, el juego usa sus casillas de mayúsculas sobre la textura grande: cada letra agarra una columna entera de letras chiquitas y en la espalda aparece toda la hoja amontonada.'],
    demoOk: 'Con KitPos leyendo la tabla', demoBad: 'Sin la tabla: el juego usa sus casillas',
    man: 'Inyectar a mano, paso a paso', man1: [
      'Descargá el .zip con <b>⬇ Descargar .zip</b>, o armá los archivos vos.',
      'Copiá a <span class="mono">content\\kit-server\\&lt;equipo&gt;\\&lt;kit&gt;\\</span> la textura <span class="mono">&lt;KitFile&gt;_name.ftex</span> y <span class="mono">.dds</span> (4096×4096, DXT5 con mips) y <span class="mono">kitpos_letras.txt</span>.',
      'En el config.txt de ese kit: <span class="mono">NameFontFile=&lt;KitFile&gt;_name</span>, sin extensión. Ejemplo: con <span class="mono">KitFile=u0184p1</span> va <span class="mono">NameFontFile=u0184p1_name</span>.',
      'Si tu Sider no tiene <span class="mono">content\\kitpos\\minusculas.txt</span>, copiá el del .zip. No lo cambies por otro: la textura se armó con esa tabla.',
      'KitPos 6.4 o más nuevo en <span class="mono">modules\\kitpos.lua</span>. En sider.ini: <span class="mono">luajit.ext.enabled = 1</span> y <span class="mono">lua.module = "kitpos.lua"</span> debajo de <span class="mono">lua.module = "kserv.lua"</span>.',
      'En <span class="mono">kitpos_slots.ini</span>, <span class="mono">[opciones]</span>: <span class="mono">minusculas_juego = 1</span>. Si la textura no está en content\\kit-server (por ejemplo, en un livecpk), agregá <span class="mono">NameLower = 1.00000</span> en <span class="mono">[equipo ID pN]</span> (ID del equipo; N, la posición del kit en order.ini).',
      'Cerrá el juego del todo y abrilo de nuevo. Mirá el nombre en Editar › Equipos › Uniformes.',
      'Si algo no anda, <b>🩺 Revisar este kit en el juego</b> lee sider.log y la carpeta del kit y te dice qué falta.'],
    man2: '<b>Solo mayúsculas:</b> copiá el .ftex y el .dds de 4096×1024 y poné NameFontFile. Si el kit tenía kitpos_letras.txt, borralo, y sacá NameLower de su sección. Nada más: no hace falta KitPos.',
    man3: '<b>Plantilla de Photoshop:</b> una letra por casilla de 256 px no se puede inyectar tal cual, porque KitPos busca cada letra donde dice la tabla. Cargala en "🎨 Plantilla de Photoshop" y guardá: el editor pone cada letra en su lugar.',
    why: '¿Por qué a veces funciona y a veces no?', cols: ['Lo que ves', 'Por qué pasa', 'Qué hacer'], rows: [
      ['Toda la hoja de letras, chiquita y amontonada, en la espalda', 'La textura es de KitPos, pero el juego usa sus casillas: el kit no tiene kitpos_letras.txt ni NameLower, KitPos no cargó (sider.ini, luajit, versión) o no se pudo enganchar al ejecutable.', '🩺 Revisar este kit › Arreglar. Si KitPos no engancha, usá solo mayúsculas.'],
      ['Letras cambiadas, mayúsculas donde van minúsculas, letras partidas', 'La textura y la tabla no coinciden: se inyectó una plantilla tal cual, quedó un kitpos_letras.txt viejo de otra textura o se cambió minusculas.txt.', 'Guardar de nuevo desde Fuentes (textura y tabla juntas) o 🔁 Reacomodar las letras.'],
      ['Anda en un kit y en otro no', 'Cada kit pide su tabla por separado: el otro no tiene kitpos_letras.txt ni NameLower, o su NameFontFile apunta a otra textura (por ejemplo una compartida como "font white").', 'Guardar con "Todos", o revisar ese kit.'],
      ['Cambié la textura y sigue la vieja', 'kserv lee primero el .ftex: si se reemplazó solo el .dds no cambia nada. Y el juego y KitPos cargan texturas y tablas una vez por partida.', 'Reemplazá los dos (o borrá el que sobra) y reiniciá el juego.'],
      ['En el editor se ve bien y en el juego no', 'El editor dibuja la fuente con la tabla aunque KitPos no esté instalado.', '🩺 Revisar este kit.'],
      ['Todo en mayúsculas y sin tildes', 'minusculas_juego = 0, o el nombre está guardado en mayúsculas en la base.', 'Activar minúsculas y editar el nombre del jugador.'],
      ['Andaba y dejó de andar después de actualizar el juego', 'KitPos busca bytes del ejecutable en direcciones fijas: con otra versión, sider.log dice "no disponible" o "bad_bytes".', 'Usá solo mayúsculas hasta que haya un KitPos para esa versión.'],
      ['Bordes oscuros o cuñas entre letras', 'La forma en que se pegan las letras al armar el nombre.', 'modo_letras = 2 en kitpos_slots.ini (tecla K en el panel de KitPos).']],
    comp: 'Compatibilidad con otros juegos y mods', comp1: [
      '<b>PES 2021 de Steam actualizado</b> (PES2021.exe), Sider 7 con kserv y KitPos 6.4: minúsculas, tildes y alfabetos con "Con minúsculas".',
      '<b>Otros mods y sets de kits para PES 2021:</b> andan si los kits los carga kserv (content\\kit-server con map.txt y order.ini). Si el set trae su propio servidor de kits o pone las texturas en un livecpk, KitPos sirve igual con NameLower en kitpos_slots.ini, pero el editor no puede guardar en la carpeta del kit: usá el .zip y copiá a mano.',
      '<b>Otro ejecutable</b> (versiones viejas del juego, ejecutables modificados, Football Life): KitPos se hizo para un PES2021.exe en particular. Si en sider.log las líneas de kitpos dicen "no disponible" o "bad_bytes", usá <b>Solo mayúsculas</b>: usa las casillas del juego y anda en cualquiera.',
      '<b>Otros módulos de kits o de nombres:</b> si otro módulo cambia NameFontFile o la textura del nombre del mismo kit, gana el último que se aplica. Dejá kitpos.lua debajo de kserv.lua en sider.ini.'] },
  en: { sum: '📘 Guide: how the font reaches the game, manual injection and why it sometimes fails',
    how: 'How it works', how1: [
      'The game does not type the name with a typeface: it builds one image per player by copying each letter from the <b>kit letter texture</b>, the one set in <span class="mono">NameFontFile</span> in its config.txt.',
      'To find each letter it uses <b>fixed boxes</b>: two rows of capitals, A to N on top and O to Z plus the dot below, in a 4:1 texture (for example 4096×1024). That is why the game alone has no lowercase.',
      '<b>KitPos</b> (a Sider module) changes that lookup for the kits that ask for it: each letter comes from a <b>table</b> (code, width and crop u0 v0 u1 v1). That brings lowercase, accents, Ñ, Cyrillic and Greek in a 4096×4096 texture.',
      'A kit asks KitPos for the table in two ways: with a <span class="mono">kitpos_letras.txt</span> in its folder, or with <span class="mono">NameLower = 1</span> in its section of <span class="mono">content\\kitpos\\kitpos_slots.ini</span> (it uses the general table <span class="mono">minusculas.txt</span>). The editor does both, with the same table.',
      'If the texture is a KitPos one but the kit does not ask for the table, or KitPos is not working, the game uses its capital-letter boxes on the big texture: each letter grabs a whole column of tiny letters and the entire sheet shows up crammed on the back.'],
    demoOk: 'With KitPos reading the table', demoBad: 'Without the table: the game uses its boxes',
    man: 'Manual injection, step by step', man1: [
      'Download the .zip with <b>⬇ Download .zip</b>, or prepare the files yourself.',
      'Copy into <span class="mono">content\\kit-server\\&lt;team&gt;\\&lt;kit&gt;\\</span> the texture <span class="mono">&lt;KitFile&gt;_name.ftex</span> and <span class="mono">.dds</span> (4096×4096, DXT5 with mips) and <span class="mono">kitpos_letras.txt</span>.',
      'In that kit\'s config.txt: <span class="mono">NameFontFile=&lt;KitFile&gt;_name</span>, without extension. Example: with <span class="mono">KitFile=u0184p1</span> it is <span class="mono">NameFontFile=u0184p1_name</span>.',
      'If your Sider has no <span class="mono">content\\kitpos\\minusculas.txt</span>, copy the one in the .zip. Do not swap it for another one: the texture was built with that table.',
      'KitPos 6.4 or newer in <span class="mono">modules\\kitpos.lua</span>. In sider.ini: <span class="mono">luajit.ext.enabled = 1</span> and <span class="mono">lua.module = "kitpos.lua"</span> below <span class="mono">lua.module = "kserv.lua"</span>.',
      'In <span class="mono">kitpos_slots.ini</span>, <span class="mono">[opciones]</span>: <span class="mono">minusculas_juego = 1</span>. If the texture is not in content\\kit-server (for example, in a livecpk), add <span class="mono">NameLower = 1.00000</span> to <span class="mono">[equipo ID pN]</span> (team ID; N, the kit position in order.ini).',
      'Close the game completely and open it again. Look at the name in Edit › Teams › Kits.',
      'If something does not work, <b>🩺 Check this kit in the game</b> reads sider.log and the kit folder and tells you what is missing.'],
    man2: '<b>Capitals only:</b> copy the 4096×1024 .ftex and .dds and set NameFontFile. If the kit had a kitpos_letras.txt, delete it and remove NameLower from its section. That is all: no KitPos needed.',
    man3: '<b>Photoshop template:</b> one letter per 256 px box cannot be injected as it is, because KitPos looks for each letter where the table says. Load it in "🎨 Photoshop template" and save: the editor puts each letter in its place.',
    why: 'Why does it sometimes work and sometimes not?', cols: ['What you see', 'Why it happens', 'What to do'], rows: [
      ['The whole letter sheet, tiny and crammed, on the back', 'The texture is a KitPos one, but the game uses its own boxes: the kit has no kitpos_letras.txt or NameLower, KitPos did not load (sider.ini, luajit, version) or could not hook into the executable.', '🩺 Check this kit › Fix. If KitPos cannot hook, use capitals only.'],
      ['Swapped letters, capitals instead of lowercase, cut letters', 'Texture and table do not match: a template was injected as it is, an old kitpos_letras.txt from another texture stayed, or minusculas.txt was changed.', 'Save again from Fonts (texture and table together) or 🔁 Rearrange the letters.'],
      ['Works on one kit and not on another', 'Each kit asks for its table separately: the other one has no kitpos_letras.txt or NameLower, or its NameFontFile points to another texture (for example a shared one like "font white").', 'Save with "All", or check that kit.'],
      ['I changed the texture and the old one is still there', 'kserv reads the .ftex first: replacing only the .dds changes nothing. And the game and KitPos load textures and tables once per session.', 'Replace both (or delete the extra one) and restart the game.'],
      ['It looks right in the editor but not in the game', 'The editor draws the font with the table even when KitPos is not installed.', '🩺 Check this kit.'],
      ['Everything in capitals and without accents', 'minusculas_juego = 0, or the name is stored in capitals in the database.', 'Turn on lowercase and edit the player name.'],
      ['It worked and stopped after a game update', 'KitPos looks for executable bytes at fixed addresses: with another version, sider.log says "no disponible" or "bad_bytes".', 'Use capitals only until there is a KitPos for that version.'],
      ['Dark edges or wedges between letters', 'The way letters are pasted when the name is built.', 'modo_letras = 2 in kitpos_slots.ini (K key in the KitPos panel).']],
    comp: 'Compatibility with other games and mods', comp1: [
      '<b>Updated Steam PES 2021</b> (PES2021.exe), Sider 7 with kserv and KitPos 6.4: lowercase, accents and alphabets with "With lowercase".',
      '<b>Other PES 2021 mods and kit packs:</b> they work if kserv loads the kits (content\\kit-server with map.txt and order.ini). If the pack brings its own kit server or puts textures in a livecpk, KitPos still works with NameLower in kitpos_slots.ini, but the editor cannot save into the kit folder: use the .zip and copy by hand.',
      '<b>Another executable</b> (older game versions, modified executables, Football Life): KitPos was made for one specific PES2021.exe. If the kitpos lines in sider.log say "no disponible" or "bad_bytes", use <b>Capitals only</b>: it uses the game\'s boxes and works anywhere.',
      '<b>Other kit or name modules:</b> if another module changes NameFontFile or the name texture of the same kit, the last one applied wins. Keep kitpos.lua below kserv.lua in sider.ini.'] },
};
function kpfGuideHtml() {
  const G = KPF_GUIDE[kpfEn() ? 'en' : 'es'], li = a => a.map(x => `<li>${x}</li>`).join('');
  return `<details class="kpfhow kpfguide" data-noi18n ${KPFS.guideOpen ? 'open' : ''}><summary>${G.sum}</summary>
    <div class="kpfgsec"><h6>${G.how}</h6><ol>${li(G.how1)}</ol>
      <div class="kpfdemo"><figure><canvas id="kpfDemoOk" width="520" height="190"></canvas><figcaption>✓ ${G.demoOk}</figcaption></figure><figure><canvas id="kpfDemoBad" width="520" height="190"></canvas><figcaption>✕ ${G.demoBad}</figcaption></figure></div></div>
    <div class="kpfgsec"><h6>${G.man}</h6><ol>${li(G.man1)}</ol><p>${G.man2}</p><p>${G.man3}</p></div>
    <div class="kpfgsec"><h6>${G.why}</h6><div class="kpfwhy" role="table">${[G.cols, ...G.rows].map((r, i) => `<div role="row" class="${i ? '' : 'hd'}">${r.map(c => `<div role="${i ? 'cell' : 'columnheader'}">${c}</div>`).join('')}</div>`).join('')}</div></div>
    <div class="kpfgsec"><h6>${G.comp}</h6><ul>${li(G.comp1)}</ul></div>
  </details>`;
}
// los dos ejemplos de la guía: el nombre bien (con la tabla) y como lo dibuja el juego con sus casillas sobre la textura de KitPos
function kpfDemo(sh) {
  const ok = sh.querySelector('#kpfDemoOk'), bad = sh.querySelector('#kpfDemoBad'), R = KPFS.out; if (!ok || !bad || !R) return;
  const name = KPFS.sample || 'Fernández';
  const draw = (c, fn) => { const g = c.getContext('2d'); kpfShirtBg(g, c.width, c.height); try { fn(g, c); } catch (e) { console.warn('kpfDemo', e); } };
  draw(ok, (g, c) => KPF.drawText(g, R.canvas, name, c.width / 2, 92, 62, { maxW: c.width - 40 }));
  // el juego copia cada casilla fija (pensada para una textura 4:1) sobre la textura cuadrada: entra media textura apretada en cada letra
  draw(bad, (g, c) => {
    const T = R.canvas, up = [...name.toUpperCase()].map(ch => KFONT.cell('name', ch, T.width, T.height)).filter(Boolean), h = 110, k = h / 496;
    const tw = up.reduce((a, r) => a + r[2] * k, 0), s = Math.min(1, (c.width - 40) / tw); let x = (c.width - tw * s) / 2;
    for (const [sx, sy, sw, sh] of up) { g.drawImage(T, sx, sy, sw, sh, x, 92 - h * s / 2, sw * k * s, h * s); x += sw * k * s; }
  });
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
const kpfGame = () => KPFS.fmt === 'game' && !!KPFS.outGame;
function kpfDrawPreview(sh) {
  const R = KPFS.out; if (!R) return; const game = kpfGame(), tex = game ? KPFS.outGame : R.canvas;
  const sc = sh.querySelector('#kpfShirt'); if (sc && game) { const g = sc.getContext('2d'), W = sc.width, H = sc.height; kpfShirtBg(g, W, H);
    // formato del juego: el nombre sale en mayúsculas, como lo dibuja el juego con sus casillas
    const p = KPFS.has && KS.cfg ? KS_POS.name() : null, o = p ? { stretch: p.stretch / 1.2, spacing: p.spacing, curve: p.curve } : {};
    KFONT.drawText(g, tex, 'name', KPFS.sample || 'Fernández', W / 2, 170, 128, o);
    KFONT.drawText(g, tex, 'name', 'ABCDEFGHIJKLM', W / 2, 336, 52, {}); KFONT.drawText(g, tex, 'name', 'NOPQRSTUVWXYZ.', W / 2, 436, 52, {}); }
  else if (sc) { const g = sc.getContext('2d'), W = sc.width, H = sc.height; kpfShirtBg(g, W, H);
    // con un kit elegido, el nombre sale con el ancho, la separación y el arco de ese kit (los de KitPos si tiene)
    const p = KPFS.has && KS.cfg ? KS_POS.name() : null, o = p ? { stretch: p.stretch / 1.2, spacing: p.spacing, curve: p.curve } : {};
    g.save(); g.strokeStyle = '#ffffff14'; g.setLineDash([6, 8]); g.beginPath(); g.moveTo(W / 2, 20); g.lineTo(W / 2, H - 20); g.stroke(); g.restore();
    KPF.drawText(g, tex, KPFS.sample || 'Fernández', W / 2, 170, 128, { ...o, maxW: W - 60 });
    const extra = [...new Set(R.L.cells.map(c => c.ch).filter(c => !/[A-Za-z0-9 .\-'_]/.test(c)))].filter((c, i, a) => i % Math.max(1, Math.floor(a.length / 26)) === 0).slice(0, 26).join('');
    KPF.drawText(g, tex, 'Aa Bb Cc Ññ 0123456789', W / 2, 336, 52, { maxW: W - 60 }); if (extra) KPF.drawText(g, tex, extra, W / 2, 436, 46, { maxW: W - 60 }); }
  const ac = sh.querySelector('#kpfAtlas'); if (ac) { const g = ac.getContext('2d'), hh = Math.round(ac.width * tex.height / tex.width); if (ac.height !== hh) ac.height = hh;
    for (let y = 0; y < ac.height; y += 10) for (let x = 0; x < ac.width; x += 10) { g.fillStyle = (x + y) / 10 % 2 ? '#2a2f36' : '#353b44'; g.fillRect(x, y, 10, 10); }
    g.drawImage(tex, 0, 0, ac.width, ac.height); g.strokeStyle = '#ffd84a33'; g.lineWidth = 1; const k = ac.width / tex.width;
    if (game) { for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ.') { const r = KFONT.cell('name', ch, tex.width, tex.height); g.strokeRect(r[0] * k + .5, r[1] * k + .5, r[2] * k, r[3] * k); } }
    else for (const c of R.L.cells) g.strokeRect(c.x * k + .5, c.row * KPF.ROW * k + .5, c.span * k, KPF.ROW * k); }
  const dim = sh.querySelector('#kpfDim'); if (dim) dim.textContent = game ? `${tex.width}×${tex.height} px · 27 letras · DXT5` : `${R.L.W}×${R.L.H} px · ${R.L.cells.length} letras · DXT5`;
  const it = sh.querySelector('#kpfImgTh'), O = kpfOpts(); if (it && O.img) { const g = it.getContext('2d'); g.fillStyle = '#2a3038'; g.fillRect(0, 0, it.width, it.height); const z = Math.min(it.width / O.img.width, it.height / O.img.height); g.drawImage(O.img, 0, 0, O.img.width * z, O.img.height * z); }
  const tt = sh.querySelector('#kpfTplTh'); if (tt && O.tpl) { const g = tt.getContext('2d'), z = tt.height / 256; g.fillStyle = '#2a3038'; g.fillRect(0, 0, tt.width, tt.height);
    g.drawImage(tinted0(O.tpl.c, O), 0, 0, tt.width / z, 256, 0, 0, tt.width, tt.height); }
  kpfDemo(sh); kpfBack3d(sh);
}
const tinted0 = (c, O) => { if (!O.tplTint) return c; if (c.__th && c.__th.k === O.fill) return c.__th.c; const t = document.createElement('canvas'); t.width = 1024; t.height = 256; const g = t.getContext('2d'); g.drawImage(c, 0, 0, 1024, 256, 0, 0, 1024, 256); g.globalCompositeOperation = 'source-in'; g.fillStyle = O.fill; g.fillRect(0, 0, 1024, 256); c.__th = { k: O.fill, c: t }; return t; };
// la espalda del kit con el modelo 3D real, el nombre de prueba y la fuente nueva; ahí se ubican el nombre y el dorsal (kitplace.js)
function kpfWrap(fn) {
  const saveT = KS.T.name, saveS = KS.sample; if (KPFS.out) KS.T.name = { c: kpfGame() ? KPFS.outGame : KPFS.out.canvas, file: '(sin guardar)', where: 'gen' }; KS.sample = { ...KS.sample, name: KPFS.sample || 'Fernández' }; KS.dispKey = '';
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
  clearTimeout(kpfRun.t); kpfRun.t = setTimeout(async () => {
    try { const T = await kpfTable(), had = sh.querySelector('.kpfn'); KPFS.out = KPF.render(kpfOpts(), null, T.list); KPFS.outGame = KPFS.fmt === 'game' ? kpfGameCanvas(kpfOpts()) : null; KPFS.rev++; kpfDrawPreview(sh); kpfPresetThumbs(sh); if (had) had.textContent = tr(T.list.length + ' letras'); }
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
    if (has && kit && KS.sel && KS.path) { try { const kd = await (await subDir(kit, KS.path)).getDirectoryHandle(KS.sel), t = await readText(kd, 'kitpos_letras.txt'); if (t) { const own = KPF.parseLetras(t), T = await kpfTable().catch(() => null); st.kit = true; st.kitN = own.length; st.own = T && KPF.sameTable(own, T.list) ? 'same' : 'other'; st.old = st.own === 'other'; } } catch { }
      if (!st.kit && kpsVals().NameLower === 1) { st.kit = true; st.kitN = kpfN(); } }
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
  const game = KPFS.fmt === 'game'; log('Armando la textura de letras…'); await new Promise(r => setTimeout(r, 20));
  const T = await kpfTable(); let R, W, H, px;
  if (game) { const c = kpfGameCanvas(kpfOpts()); W = c.width; H = c.height; px = c.getContext('2d').getImageData(0, 0, W, H).data; R = { canvas: c, game: true }; KPFS.outGame = c; }
  else { R = KPF.render(kpfOpts(), null, T.list); W = R.L.W; H = R.L.H; px = R.px; KPFS.out = R; }
  const u8 = new Uint8Array(px.buffer, px.byteOffset, px.length);
  const levels = await FTEXW.mipLevels(u8, W, H, { dxt5: true, progress: p => log('Comprimiendo en DXT5 con todos sus tamaños… ' + Math.round(p * 100) + '%') });
  log('Armando el .dds y el .ftex…'); const dds = FTEXW.ddsMips(levels, W, H), ftex = await FTEXW.assemble(levels, W, H, true);
  return { R, dds, ftex, T, game };
}
async function kpfBackup(kd, name) { try { const old = await kd.getFileHandle(name); try { await kd.getFileHandle(name + '.bak-edit21'); } catch { const bk = await kd.getFileHandle(name + '.bak-edit21', { create: true }), w = await bk.createWritable(); await w.write(await (await old.getFile()).arrayBuffer()); await w.close(); if (typeof bakNote === 'function') bakNote(kd); } } catch { } }
async function kpfPut(kd, name, data) { await kpfBackup(kd, name); const fh = await kd.getFileHandle(name, { create: true }), w = await fh.createWritable(); await w.write(data); await w.close(); }
// Como en un kit que ya muestra minúsculas en el juego (la carpeta p1 de ejemplo): la textura se llama <KitFile>_name
// (u2689p1_name.dds y .ftex), NameFontFile apunta a ella, el kit no tiene kitpos_letras.txt (usa la tabla general
// content\kitpos\minusculas.txt) y en kitpos_slots.ini su sección [equipo ID pN] lleva NameLower = 1.
const kpfFileFor = (cfg, kitName, team = KS.team) => ((cfg && cfgGet(cfg, 'KitFile') || '').trim() || 'u' + String(team).padStart(4, '0') + kitName) + '_name';
// config.txt del kit con NameFontFile apuntando a su textura; changed si hubo que cambiarlo. apply: cambia el kit abierto (si no, una copia)
function kpfCfgFor(kitName, txt, apply) {
  const cur = apply && kitName === KS.sel, cfg = cur ? KS.cfg : cfgParse(kitName === KS.sel ? cfgSerialize(KS.cfg) : txt ?? KS.cfgTxt[kitName] ?? ''), file = kpfFileFor(cfg, kitName);
  if ((cfgGet(cfg, 'NameFontFile') || '').trim() === file) return { cfg, file, changed: false };
  let f = cfg.fields.find(x => x.key === 'NameFontFile');
  if (!f) { cfg.lines.push(''); cfg.fields.push(f = { i: cfg.lines.length - 1, key: 'NameFontFile', value: '', pre: 'NameFontFile=', gap: '', comment: '', section: 'texture files' }); }
  if (cur) cfgSet(KS.cfg, 'NameFontFile', file); else f.value = file;
  return { cfg, file, changed: true };
}
const kpfKitSec = k => { const gk = KS.gk.includes(k); return KPOS.secKey(KS.team, gk ? 0 : KS.kits.indexOf(k) + 1, gk); };
const kpfLabel = () => { const O = kpfOpts(); return (O.tpl ? (O.tplName || 'plantilla') + ' + ' : '') + O.font; };
// tabla del kit (kitpos_letras.txt): con la de KitPos se escribe la misma tabla que minusculas.txt, así el kit funciona solo
// (sin depender de NameLower en kitpos_slots.ini); con la del juego se saca, porque KitPos recortaría letras que no están ahí
async function kpfKitTable(kd, B) {
  const want = B.game ? null : KPF.kitTable(B.T.text, kpfLabel()), cur = await readText(kd, 'kitpos_letras.txt');
  if (cur != null && want && KPF.sameTable(KPF.parseLetras(cur), B.T.list)) { if (cur !== want) { const fh = await kd.getFileHandle('kitpos_letras.txt'), w = await fh.createWritable(); await w.write(want); await w.close(); } return; }
  if (cur != null) { await kpfBackup(kd, 'kitpos_letras.txt'); await kd.removeEntry('kitpos_letras.txt'); }
  if (want) { const fh = await kd.getFileHandle('kitpos_letras.txt', { create: true }), w = await fh.createWritable(); await w.write(want); await w.close(); }
}
async function kpfInstallKit(dir, kitName, B) {
  const kd = await dir.getDirectoryHandle(kitName), { cfg, file, changed } = kpfCfgFor(kitName, kitName === KS.sel ? null : (await readText(kd, 'config.txt')) || '', true);
  await kpfPut(kd, file + '.dds', B.dds); await kpfPut(kd, file + '.ftex', B.ftex);
  await kpfKitTable(kd, B);
  if (changed && kitName !== KS.sel) { const txt = cfgSerialize(cfg); await kpfPut(kd, 'config.txt', txt); KS.cfgTxt[kitName] = txt; }
  for (const k of [...KS.tex.keys()]) if (k.startsWith(KS.path + '/' + kitName + ':')) KS.tex.delete(k); delete KS.thumbs[kitName];
  return file;
}
// minusculas.txt: si la carpeta Sider no la tiene, se copia la que usa el editor (la de la fuente que se acaba de armar)
async function kpfPutTable(T) {
  const { sider } = await ksRoot(true), content = await sider.getDirectoryHandle('content', { create: true }), kd = await content.getDirectoryHandle('kitpos', { create: true });
  if (T.src === 'sider' && await readText(kd, 'minusculas.txt') != null) return false;
  await kpfPut(kd, 'minusculas.txt', T.text); return true;
}
async function kpfInstall(log) {
  const B = await kpfBuild(log), { kit } = await ksRoot(true), dir = await subDir(kit, KS.path), wasDirty = KS.dirty;
  const targets = KPFS.target === '*' ? KS.kits.slice() : [KPFS.target], done = [];
  for (const k of targets) { log('Guardando en ' + k + '…'); done.push(k + ': ' + await kpfInstallKit(dir, k, B)); }
  const n = done.length; if (!B.game && await kpfPutTable(B.T)) done.push('content\\kitpos\\minusculas.txt');
  // NameLower = 1 en la sección de cada kit (lo mismo que "Minúsculas en el nombre" del panel de KitPos). Si el navegador
  // esconde kitpos_slots.ini no pasa nada: el kit ya lleva su kitpos_letras.txt. Con la textura del juego se saca.
  await kpsLoad(); let lower = false;
  if (KPS.cur && KPS.st && KPS.st.slots !== 'hidden') { let t = KPS.curText; for (const k of targets) { const own = KPS.cur.secs[kpfKitSec(k)] || {}; if (!B.game || own.NameLower != null) t = KPOS.setValues(t, kpfKitSec(k), { NameLower: B.game ? null : 1 }); } KPS.curText = t; KPS.cur = KPOS.parse(t); lower = true; }
  if (targets.includes(KS.sel)) { if (!wasDirty && KS.dirty) await ksSave(); const c = B.R.canvas; KS.T.name = { c, file: done[0], where: 'kit' }; KS.texRev = (KS.texRev || 0) + 1; KS.dispKey = ''; }
  return { done, lower, n, game: B.game };
}
async function kpfUndo() {
  const { kit } = await ksRoot(true), kd = await (await subDir(kit, KS.path)).getDirectoryHandle(KS.sel), file = (cfgGet(KS.cfg, 'NameFontFile') || '').trim(); let n = 0;
  let wide = false; // la textura que vuelve es la del juego (4:1, sin minúsculas): entonces el kit deja de pedir NameLower
  for (const e of ['.dds', '.ftex']) { try { const bk = await kd.getFileHandle(file + e + '.bak-edit21'), buf = await (await bk.getFile()).arrayBuffer(), fh = await kd.getFileHandle(file + e, { create: true }), w = await fh.createWritable(); await w.write(buf); await w.close(); n++;
    if (e === '.dds' && buf.byteLength > 20) { const v = new DataView(buf); wide = v.getUint32(16, true) === 4 * v.getUint32(12, true); } } catch { } }
  let own = false; try { const bk = await kd.getFileHandle('kitpos_letras.txt.bak-edit21'), fh = await kd.getFileHandle('kitpos_letras.txt', { create: true }), w = await fh.createWritable(); await w.write(await (await bk.getFile()).arrayBuffer()); await w.close(); n++; own = true; } catch { }
  // la tabla que puso el editor no sirve para una textura del juego (4:1)
  if (!own && wide) { try { await kd.removeEntry('kitpos_letras.txt'); } catch { } }
  if (wide || own) { await kpsLoad(); if (KPS.cur && KPS.st && KPS.st.slots !== 'hidden' && kpsOwn('kit').NameLower != null) { KPS.curText = KPOS.setValues(KPS.curText, kpfKitSec(KS.sel), { NameLower: null }); KPS.cur = KPOS.parse(KPS.curText); await kpsSave(); } }
  for (const k of [...KS.tex.keys()]) if (k.startsWith(KS.path + '/' + KS.sel + ':')) KS.tex.delete(k);
  return n;
}
function kpfReadme(kits, team, game) {
  const files = kits.map(k => `  ${k.dir}\\${k.file}.dds + ${k.file}.ftex${k.cfg ? ' + config.txt (NameFontFile=' + k.file + ')' : ''}${game ? '' : ' + kitpos_letras.txt'}`);
  if (game) return ['Fuente del nombre (formato del juego) - PES Editor Rebuilt', '',
    'Textura de 4096x1024 con las letras A-Z y el punto en las casillas del juego. El nombre sale en MAYUSCULAS,',
    'pero funciona en cualquier juego y con cualquier Sider (no hace falta KitPos).', '', ...files, '',
    'Como instalarla a mano:', '  1. Descomprimi el .zip dentro de la carpeta de Sider (la que tiene sider.exe): cada archivo cae en su lugar.',
    `  2. En el config.txt de cada kit, NameFontFile = ${kits.map(k => k.file).join(', ')} (sin extension).`,
    '  3. Si la carpeta del kit tiene kitpos_letras.txt, borralo, y saca NameLower de su seccion en content\\kitpos\\kitpos_slots.ini:',
    '     con la textura del juego, KitPos recortaria letras que no estan ahi.',
    '  4. Si hay .dds y .ftex, que sean la misma textura: kserv lee primero el .ftex.',
    `  5. Cerra y abri el juego, y mira el nombre en Editar > Equipos > Uniformes${team ? ' (' + team + ')' : ''}.`, '', '---', '',
    'Shirt name font (game format) - PES Editor Rebuilt', '',
    '4096x1024 texture with A-Z and the dot in the game\'s own boxes. Names show in CAPITALS, but it works in any game and with any Sider (no KitPos needed).', '',
    'Manual install: unzip into the Sider folder, set NameFontFile in each kit\'s config.txt, delete any kitpos_letras.txt in the kit folder and remove NameLower',
    'for that kit in content\\kitpos\\kitpos_slots.ini, keep .dds and .ftex identical (kserv reads .ftex first), then restart the game.', ''].join('\r\n');
  return ['Fuente del nombre con minusculas (KitPos) - PES Editor Rebuilt', '',
    'Es el mismo formato que un kit que ya muestra minusculas y acentos en el juego:', '', ...files,
    '  content\\kitpos\\minusculas.txt  la tabla general: donde esta cada letra dentro de la textura', '',
    'Como instalarla a mano:', '  1. Descomprimi el .zip dentro de la carpeta de Sider (la que tiene sider.exe): cada archivo cae en su lugar.',
    `  2. En el config.txt de cada kit, NameFontFile = ${kits.map(k => k.file).join(', ')} (sin extension).`,
    '  3. kitpos_letras.txt va en la carpeta del kit: es la misma tabla que minusculas.txt y hace que KitPos use la fuente en ese kit.',
    '     Si la textura esta en un livecpk y no en content\\kit-server, pega ademas lo de "kitpos_slots - agregar.txt" en kitpos_slots.ini.',
    '  4. Si hay .dds y .ftex, que sean la misma textura: kserv lee primero el .ftex.',
    '  5. Hace falta KitPos 6.4 o mas nuevo: modules\\kitpos.lua y en sider.ini lua.module = "kitpos.lua" debajo de kserv.lua (con luajit.ext.enabled = 1),',
    '     y en kitpos_slots.ini, [opciones] minusculas_juego = 1.',
    `  6. Cerra y abri el juego (KitPos lee las tablas una vez por partida) y mira el nombre en Editar > Equipos > Uniformes${team ? ' (' + team + ')' : ''}.`, '',
    'Si en la espalda aparece toda la hoja de letras chiquita y amontonada, KitPos no esta usando la tabla en ese kit: revisa sider.log',
    '(lineas [kitpos.lua]) o usa "Revisar este kit" en Kit Studio > Fuentes.', '', '---', '',
    'Shirt name font with lowercase (KitPos) - PES Editor Rebuilt', '',
    'Manual install: unzip into the Sider folder; set NameFontFile in each kit\'s config.txt; keep kitpos_letras.txt in the kit folder (same table as',
    'minusculas.txt, it makes KitPos use the font on that kit). Keep .dds and .ftex identical (kserv reads .ftex first). Needs KitPos 6.4+ loaded below',
    'kserv.lua in sider.ini with luajit.ext.enabled = 1. Restart the game: KitPos reads the tables once per session.',
    'If the whole letter sheet shows up tiny on the back, KitPos is not applying the table to that kit: check sider.log or "Check this kit" in the editor.', ''].join('\r\n');
}
// .zip para cada uniforme: la carpeta del kit con su textura (y su config.txt si cambió NameFontFile); con la de KitPos además
// su kitpos_letras.txt, minusculas.txt y lo de kitpos_slots.ini
async function kpfZip(log) {
  const B = await kpfBuild(log), has = KPFS.has && KS.cfg, base = has ? 'content/kit-server/' + String(KS.path).replace(/\\/g, '/').replace(/^\/+|\/+$/g, '') + '/' : 'content/kit-server/<equipo>/';
  const targets = has ? (KPFS.target === '*' ? KS.kits.slice() : [KPFS.target]) : ['p1'], files = [], kits = [];
  for (const k of targets) {
    const c = has ? kpfCfgFor(k, null, false) : { file: 'uXXXXp1_name', changed: false }, dir = base + k;
    files.push({ name: dir + '/' + c.file + '.dds', data: B.dds }, { name: dir + '/' + c.file + '.ftex', data: B.ftex });
    if (!B.game) files.push({ name: dir + '/kitpos_letras.txt', data: KPF.kitTable(B.T.text, kpfLabel()) });
    if (c.changed) files.push({ name: dir + '/config.txt', data: cfgSerialize(c.cfg) });
    kits.push({ dir: dir.replace(/\//g, '\\'), file: c.file, cfg: c.changed, sec: '[' + (has ? kpfKitSec(k) : 'equipo ID p1') + ']' });
  }
  if (!B.game) files.push({ name: 'content/kitpos/minusculas.txt', data: B.T.text },
    { name: 'content/kitpos/kitpos_slots - agregar.txt', data: ['; Solo hace falta si la textura no esta en content\\kit-server (por ejemplo, en un livecpk).', '; Pegalo en content\\kitpos\\kitpos_slots.ini (si la seccion ya existe, agrega solo la linea NameLower)', ...kits.flatMap(k => [k.sec, 'NameLower = 1.00000', ''])].join('\r\n') });
  files.push({ name: 'LEEME.txt', data: kpfReadme(kits, has && KPFS.t ? KPFS.t.name : '', B.game) });
  const tag = (has ? (String(KPFS.t && KPFS.t.name || KS.team).replace(/[^\w-]+/g, '-') + '-' + (KPFS.target === '*' ? 'todos' : KPFS.target)) : String(kpfOpts().font).replace(/[^\w-]+/g, '-')) + (B.game ? '-mayusculas' : '');
  const name = 'fuente-' + tag.toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '') + '.zip';
  await downloadBytes(name, KPF.zipMany(files)); return { name, kits, game: B.game };
}
// cambiar de paso sin volver a dibujar la pantalla: el paso nuevo entra deslizándose desde el lado al que se va
function kpfGo(sh, n, req) {
  const root = sh.querySelector('#kpfDrop'); if (!root || !(n >= 1 && n <= 4)) return; const from = KPFS.tab || 1; KPFS.tab = n;
  root.dataset.step = n; root.dataset.dir = n < from ? 'back' : 'fwd';
  root.querySelectorAll('.kpftabs [data-go]').forEach((b, i) => { const done = i + 1 < n || (i === 3 && !!KPFS.done); b.setAttribute('aria-selected', i + 1 === n); b.classList.toggle('done', done); b.querySelector('i').textContent = done ? '✓' : i + 1; });
  const bar = root.querySelector('.kpfprog i'); if (bar) bar.style.width = (KPFS.done && n === 4 ? 100 : (n - 1) / 3 * 100) + '%';
  const p = root.querySelector(`.kpfpanel[data-p="${n}"]`);
  if (p && n !== from) { p.classList.remove('anim'); void p.offsetWidth; p.classList.add('anim'); p.addEventListener('animationend', e => { if (e.target === p) p.classList.remove('anim'); }, { once: true }); }
  if (p && p.getBoundingClientRect().top < 70) root.querySelector('.kpftabs').scrollIntoView({ block: 'start', behavior: 'smooth' });
  if (req) { const d = root.querySelector('.kpfreqs'); if (d) { d.open = KPFS.reqOpen = true; setTimeout(() => d.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 80); } }
  if (n === 3) kpfBack3d(sh, true);
  if (n === 4 && KPFS.guideOpen) kpfDemo(sh);
}
// un brillo que cruza la vista previa cuando cambia la fuente o el estilo
function kpfShine(sh) { const st = sh.querySelector('.kpfstage'); if (!st) return; st.classList.remove('shine'); void st.offsetWidth; st.classList.add('shine'); setTimeout(() => st.classList.remove('shine'), 900); }
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
  $k('kpfFonts').onclick = e => { const b = e.target.closest('[data-font]'); if (!b) return; O.font = b.dataset.font; $k('kpfFonts').querySelectorAll('[data-font]').forEach(x => x.setAttribute('aria-selected', x === b)); const sb = sh.querySelector('#kpfTab1 small'); if (sb) sb.textContent = O.font; upd(); kpfShine(sh); };
  $k('kpfPre').onclick = e => { const b = e.target.closest('[data-pre]'); if (!b) return; const { n, ...p } = KPF_PRESETS[b.dataset.pre]; Object.assign(O, p); KPFS.shine = true; rr(); };
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
    const { done, lower, n, game } = await kpfInstall(log), kp = await kpsSave(); KPFS.st = null; KPFS.stFor = ''; KPFS.done = true; KPFS.doneAnim = true; KPFS.diag = null;
    log('Listo: ' + done.join(' · ') + (game ? ' · formato del juego, solo mayúsculas' : ' · con su tabla kitpos_letras.txt' + (kp && lower ? ' · NameLower = 1 en kitpos_slots.ini' : '')) + '. Cerrá el juego y abrilo de nuevo para verla.'); toast('Fuente guardada en ' + n + (n > 1 ? ' kits' : ' kit') + '. Cerrá el juego y abrilo de nuevo para verla.', 8000); rr(); });
  const tr3 = $k('kpfTry'); if (tr3) tr3.onclick = () => { if (!KPFS.out) return;
    KS.T.name = { c: kpfGame() ? KPFS.outGame : KPFS.out.canvas, file: '(sin guardar)', where: 'gen' }; KS.sample = { ...KS.sample, name: KPFS.sample || KS.sample.name }; KS.texRev = (KS.texRev || 0) + 1; KS.dispKey = ''; KS.mode = 'edit'; KS.view = '3d'; rr();
    setTimeout(() => { const w = document.getElementById('ks3dWrap'); if (w) w.scrollIntoView({ block: 'center', behavior: 'smooth' }); const b = document.querySelector('[data-cam="back"]'); if (b) b.click(); }, 500); toast('Probando la fuente en el Editor. Para que el juego la use, volvé a 🔤 Fuentes y tocá el botón de guardar.', 7000); };
  const dl = $k('kpfKpDl'); if (dl) dl.onclick = busy(dl, async () => { const r = await fetch('sider/kitpos.lua', { cache: 'no-cache' }), t = r.ok ? await r.text() : '', v = (t.match(/local m = \{ version = "([\d.]+)"/) || [])[1];
    if (!v) throw new Error('no se pudo bajar kitpos.lua (¿sin internet?)'); await downloadBytes('kitpos.lua', new TextEncoder().encode(t)); log('Descargado kitpos.lua (KitPos ' + v + '): copialo a Sider\\modules y agregá sus líneas en sider.ini.'); });
  const cp = $k('kpfIniCp'); if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(KPF_INI.replace(/\n/g, '\r\n')); toast('Líneas copiadas: pegalas en sider.ini, en la parte de [sider].'); } catch { toast('No se pudo copiar: seleccioná las líneas y copialas a mano.', 5000); } };
  const zp = $k('kpfZip'); if (zp) zp.onclick = busy(zp, async () => { const z = await kpfZip(log); log('Descargado ' + z.name + ': ' + z.kits.map(k => k.file + '.dds y .ftex').join(', ') + (z.game ? '' : ', kitpos_letras.txt, minusculas.txt') + ' y LEEME.txt. Descomprimilo en la carpeta de Sider.'); });
  // formato de la textura, revisión del kit y sus arreglos, y la guía
  const fm = $k('kpfFmt'); if (fm) fm.onclick = e => { const b = e.target.closest('[data-fmt]'); if (!b || KPFS.fmt === b.dataset.fmt || (!KPFS.fmt && b.dataset.fmt === 'kitpos')) return; KPFS.fmt = b.dataset.fmt; KPFS.done = false; KPFS.diag = null; KPFS.log = ''; rr(); };
  const dg = $k('kpfDiag'); if (dg) dg.onclick = busy(dg, async () => { dg.textContent = kpfEn() ? 'Checking…' : 'Revisando…'; await kpfDiagRun(); KPFS.diagAnim = true; rr(); });
  sh.querySelectorAll('[data-dfix]').forEach(b => { b.onclick = busy(b, async () => { const m = await kpfDiagFix(b.dataset.dfix); KPFS.st = null; KPFS.stFor = ''; if (m) { log(m); toast(m, 8000); } try { if (KS.cfg) await kpfDiagRun(); KPFS.diagAnim = true; } catch { KPFS.diag = null; } rr(); }); });
  const gd = sh.querySelector('.kpfguide'); if (gd) gd.ontoggle = () => { KPFS.guideOpen = gd.open; if (gd.open) kpfDemo(sh); };
  const un = $k('kpfUndo'); if (un) un.onclick = busy(un, async () => { if (!await confirmBox('¿Volver a la textura de letras que tenía ' + KS.sel + '?')) return; const n = await kpfUndo(); KPFS.st = null; KPFS.stFor = ''; KPFS.done = false; await ksLoadSlots(); log(n ? 'Listo: ' + KS.sel + ' volvió a su fuente anterior.' : 'No había nada para volver atrás en ' + KS.sel + '.'); rr(); });
  const lw = $k('kpfLower'); if (lw) lw.onclick = busy(lw, async () => { await kpfLowerOn(); KPFS.st = null; KPFS.stFor = ''; toast('Minúsculas activadas en kitpos_slots.ini.'); rr(); });
  for (const id of ['kpfKp', 'kpfKp2']) { const b = $k(id); if (b) b.onclick = busy(b, async () => { const r = await kpsInstall(); KPFS.st = null; KPFS.stFor = '';
    toast(r.lua === 'mas-nuevo' ? 'Ya tenías una versión más nueva de KitPos: no se tocó.' : 'KitPos ' + (r.lua === 'actualizado' ? 'actualizado' : r.lua === 'nuevo' ? 'instalado' : 'listo') + (r.ini === 'agregado' ? ' y agregado a sider.ini (copia en sider.ini.bak-pes-editor)' : r.ini === 'oculto' ? '. Falta agregar lua.module = "kitpos.lua" en sider.ini (debajo de kserv.lua): hacelo en la pestaña Sider' : '') + '. Abrí el juego de nuevo.', 10000); rr(); }); }
  // pasos: pestañas, Siguiente/Anterior y el aviso de requisitos llevan al paso; los desplegables recuerdan si estaban abiertos
  const root = $k('kpfDrop'); root.onclick = e => { const b = e.target.closest('[data-go]'); if (b && root.contains(b)) kpfGo(sh, +b.dataset.go, !!b.dataset.req); };
  const pd = sh.querySelector('.kpfposd'); if (pd) pd.ontoggle = () => { KPFS.posOpen = pd.open; if (pd.open) kpfBack3d(sh, true); };
  const rq = sh.querySelector('.kpfreqs > summary'); if (rq) rq.onclick = () => { KPFS.reqOpen = !rq.parentElement.open; }; // el toggle también salta al dibujarse abierto
  if (KPFS.shine) { KPFS.shine = false; kpfShine(sh); }
  KPFS.diagAnim = KPFS.doneAnim = false;
  // posición, tamaño y arco del nombre (KitPos)
  kposBind(sh, () => kpfDrawPreview(sh), rr);
  KPFS.kplApi = { cfg: false, wrap: kpfWrap, changed: () => { KS.dispKey = ''; if (KPS.sync) KPS.sync(); if (kpfBind.raf) return; kpfBind.raf = requestAnimationFrame(() => { kpfBind.raf = 0; if (sh.querySelector('#kpfShirt')) kpfDrawPreview(sh); kpfBack3d(sh, true); }); } };
  kplBind(sh, KPFS.kplApi);
  kpfPresetThumbs(sh);
  if (KPFS.out && KPFS.outFor === JSON.stringify([O.font, KPFS.sets])) kpfDrawPreview(sh);
  KPFS.outFor = JSON.stringify([O.font, KPFS.sets]); kpfRun(sh);
  document.fonts && document.fonts.ready.then(() => { kpfRun(sh); });
}
