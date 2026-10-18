// Creador de fuentes para KitPos (js/kitposfont.js): tabla kitpos_letras.txt, ubicación de las letras en la textura,
// .dds con mips (js/ftexenc.js) y el .zip para descargar.
const test = require('node:test'), assert = require('node:assert/strict');
const { load } = require('./load');
const KPF = load('kitposfont.js', 'KPF');
const FTEXW = load('ftexenc.js', 'FTEXW', { Blob, Response, CompressionStream, setTimeout });
const KZIP = load('kitzip.js', 'KZIP', { Blob, Response, DecompressionStream });
const J = x => JSON.parse(JSON.stringify(x)); // lo que viene del módulo es de otro contexto (vm)

test('el código de cada letra es su UTF-8 en hexadecimal, como lo lee kitpos.lua', () => {
  assert.equal(KPF.hex('A'), '41'); assert.equal(KPF.hex('ñ'), 'C3B1'); assert.equal(KPF.hex('Д'), 'D094'); assert.equal(KPF.hex('ș'), 'C899');
  for (const ch of ['A', 'ñ', 'Ł', 'Д', 'Ω', 'ə']) assert.equal(KPF.unhex(KPF.hex(ch)), ch);
});

test('los idiomas suman letras sin repetir y no pasan el máximo de KitPos', () => {
  const basic = KPF.chars({});
  assert.ok(basic.includes('a') && basic.includes('Z') && basic.includes(' ') && basic.includes("'"));
  const all = KPF.chars({ latin: true, central: true, cyr: true, greek: true });
  assert.equal(new Set(all).size, all.length); assert.ok(all.length <= KPF.MAX, all.length);
  assert.ok(all.includes('Ñ') && all.includes('ł') && all.includes('Ж') && all.includes('ω'));
});

test('ubica las letras como KitPos: margen de 8 px, 2×ancho+4 por letra, 16 px entre letras y filas de 256', () => {
  const L = KPF.layout([{ ch: 'A', w: 64 }, { ch: 'B', w: 61 }, ...Array.from({ length: 40 }, (_, i) => ({ ch: String.fromCharCode(0x430 + i), w: 50 }))]);
  assert.deepEqual(J([L.cells[0].x, L.cells[0].span, L.cells[0].row]), [8, 132, 0]);
  assert.deepEqual(J([L.cells[1].x, L.cells[1].span]), [156, 126]); // igual que A y B en la fuente que arma KitPos (0.038086 × 4096)
  assert.ok(L.cells.every(c => c.x + c.span <= 4096 - 8)); assert.ok(L.rows >= 2); assert.equal(L.W, 4096);
  assert.equal(L.H, 512); // siempre potencia de 2 y al menos 512
  assert.throws(() => KPF.layout(Array.from({ length: 600 }, () => ({ ch: 'W', w: 200 }))), /demasiadas letras/);
});

test('kitpos_letras.txt: mismo formato que el de KitPos y se lee de vuelta igual', () => {
  const L = KPF.layout([{ ch: 'A', w: 64 }, { ch: 'ñ', w: 45 }, { ch: ' ', w: 20 }]), txt = KPF.letrasTxt(L, 'Prueba; con punto y coma');
  const lines = txt.split('\r\n');
  assert.match(lines[1], /^; fuente: Prueba con punto y coma \| atlas 4096x512, filas de 256 px \| 3 letras$/);
  assert.equal(lines.find(l => /^41 /.test(l)), '41 64 124 0.001953 0.000000 0.034180 0.500000    ; A');
  assert.ok(txt.endsWith('\r\n'));
  const back = KPF.parseLetras(txt);
  assert.deepEqual(J(back.map(e => e.ch)), ['A', 'ñ', ' ']); assert.equal(back[1].code, 'C3B1'); assert.equal(back[1].w, 45); assert.equal(back[1].h, 124);
  // la tabla de recortes se escala al tamaño de la textura que muestra el editor
  const m = KPF.glyphMap(back, 2048, 256); assert.equal(Math.round(m.get('A').sx), 4); assert.equal(Math.round(m.get('A').sh), 128);
});

test('lee las tablas de KitPos con comentarios y líneas raras', () => {
  const t = '; minusculas.txt\r\n; codigo_utf8_hex  ancho  alto  u0 v0 u1 v1\r\n41 64 124 0.001953 0.000000 0.034180 0.062500    ; A\r\nC3B1 45 124 0.1 0.0 0.2 0.0625\r\nZZ 1 2 3 4 5 6\r\n123 1 1 0 0 0 0\r\n\r\n';
  const r = KPF.parseLetras(t); assert.deepEqual(J(r.map(e => e.ch)), ['A', 'ñ']);
});

test('.dds DXT5 con mips: misma cabecera que la textura de letras de KitPos', async () => {
  const W = 64, H = 32, px = new Uint8Array(W * H * 4).fill(255);
  const lv = await FTEXW.mipLevels(px, W, H, { dxt5: true }); assert.equal(lv.length, 7); assert.equal(lv[0].length, 16 * 8 * 16);
  const d = FTEXW.ddsMips(lv, W, H), v = new DataView(d.buffer);
  assert.equal(v.getUint32(0, true), 0x20534444); assert.equal(v.getUint32(8, true), 0xA1007); assert.equal(v.getUint32(12, true), H); assert.equal(v.getUint32(16, true), W);
  assert.equal(v.getUint32(20, true), lv[0].length); assert.equal(v.getUint32(28, true), 7); assert.equal(String.fromCharCode(...d.slice(84, 88)), 'DXT5'); assert.equal(v.getUint32(108, true), 0x401008);
  assert.equal(d.length, 128 + lv.reduce((a, l) => a + l.length, 0));
  const f = await FTEXW.assemble(lv, W, H, true); assert.equal(String.fromCharCode(...f.slice(0, 4)), 'FTEX'); assert.equal(f[16], 7);
});

test('el .zip para descargar tiene los cuatro archivos', async () => {
  const z = KPF.zipMany([{ name: 'u2689p2_name.dds', data: new Uint8Array([1, 2, 3]) }, { name: 'kitpos_letras.txt', data: '41 64 124 0 0 0.1 0.1\r\n' }, { name: 'LEEME.txt', data: 'hola ñ' }]);
  const es = await KZIP.read(z);
  assert.deepEqual(J(es.map(e => e.name)), ['u2689p2_name.dds', 'kitpos_letras.txt', 'LEEME.txt']);
  assert.deepEqual(J([...await es[0].data()]), [1, 2, 3]); assert.equal(Buffer.from(await es[2].data()).toString(), 'hola ñ');
});

// ---- plantilla de Photoshop ----
test('la plantilla tiene una casilla de 256 por letra, en el orden del .psd, sin repetir', () => {
  const cells = J(KPF.tplCells());
  assert.equal(cells.length, 214); assert.equal(new Set(cells.map(c => c.ch)).size, 214);
  assert.equal(KPF.TPL_W, 4096); assert.equal(KPF.TPL_H, 15 * 256);
  assert.deepEqual(cells.find(c => c.ch === 'Q'), { ch: 'Q', col: 0, row: 1 });
  assert.deepEqual(cells.find(c => c.ch === "'"), { ch: "'", col: 12, row: 4 });
  assert.deepEqual(cells.find(c => c.ch === 'ų'), { ch: 'ų', col: 6, row: 14 });
  assert.ok(cells.every(c => c.col < 16)); // todas las letras de la plantilla entran en una fuente con Acentos y Europa central
  const set = new Set(KPF.chars({ latin: true, central: true })); assert.ok(cells.every(c => set.has(c.ch)), cells.filter(c => !set.has(c.ch)).map(c => c.ch).join(''));
});

test('encuentra la tinta de cada casilla y mide la altura de las mayúsculas', () => {
  const W = 4096, H = 3840, px = new Uint8ClampedArray(W * H * 4);
  const ink = (col, row, x0, x1, y0, y1) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) px[((row * 256 + y) * W + col * 256 + x) * 4 + 3] = 255; };
  ink(7, 0, 70, 186, 61, 200); // H
  ink(2, 2, 84, 167, 93, 203); // c
  ink(6, 14, 100, 150, 120, 240); // ų
  const S = J(KPF.tplScan(px, W, H));
  assert.equal(S.opaque, false); assert.equal(S.count, 3); assert.equal(S.total, 214); assert.equal(S.cap, 139);
  assert.deepEqual(S.glyphs.map(g => [g.ch, g.x0, g.x1, g.top, g.bottom]), [['H', 70, 186, 61, 200], ['c', 84, 167, 93, 203], ['ų', 100, 150, 120, 240]]);
  assert.equal(KPF.tplScan(new Uint8ClampedArray(W * 512 * 4).fill(255), W, 512).opaque, true); // con el fondo puesto
});

// .psd mínimo: dos capas (Letras con RLE y unas guías ocultas con nombre unicode) y una capa de relleno recortada
function miniPsd() {
  const b = [], u8 = v => b.push(v & 255), u16 = v => { u8(v >> 8); u8(v); }, u32 = v => { u16(v >>> 16); u16(v & 65535); }, s = t => { for (const c of t) u8(c.charCodeAt(0)); };
  const pascal = t => { u8(t.length); s(t); let n = t.length + 1; while (n % 4) { u8(0); n++; } };
  const rle = rows => { const out = [], counts = []; for (const r of rows) { const enc = [r.length - 1, ...r]; counts.push(enc.length); out.push(...enc); } return { counts, out }; };
  s('8BPS'); u16(1); for (let i = 0; i < 6; i++) u8(0); u16(3); u32(16); u32(32); u16(8); u16(3); u32(0); u32(0);
  const layers = [
    { name: 'Letras', top: 1, left: 3, h: 2, w: 2, flags: 0, ch: { 0: [[10, 20], [30, 40]], 1: [[1, 2], [3, 4]], 2: [[5, 6], [7, 8]], '-1': [[255, 0], [128, 255]] } },
    { name: 'Guias', uni: 'Guías KitPos', top: 0, left: 0, h: 1, w: 1, flags: 2, ch: { 0: [[9]], 1: [[9]], 2: [[9]], '-1': [[255]] } },
    { name: 'Color', top: 0, left: 0, h: 0, w: 0, flags: 0, clip: 1, fill: [200, 16, 46], ch: {} },
  ];
  const data = []; const rec = [];
  for (const l of layers) { const chs = Object.entries(l.ch).map(([id, rows]) => { const r = rle(rows), d = []; d.push(0, 1); for (const c of r.counts) d.push(c >> 8, c & 255); d.push(...r.out); return { id: +id, d }; }); l.chs = chs; data.push(...chs.flatMap(c => c.d)); }
  const body = [], push = arr => body.push(...arr);
  const lb = []; const L8 = v => lb.push(v & 255), L16 = v => { L8(v >> 8); L8(v); }, L32 = v => { L16(v >>> 16); L16(v & 65535); }, LS = t => { for (const c of t) L8(c.charCodeAt(0)); };
  L16(layers.length);
  for (const l of layers) {
    L32(l.top); L32(l.left); L32(l.top + l.h); L32(l.left + l.w); L16(l.chs.length); for (const c of l.chs) { L16(c.id & 65535); L32(c.d.length); }
    LS('8BIM'); LS('norm'); L8(255); L8(l.clip || 0); L8(l.flags); L8(0);
    const x = []; const X8 = v => x.push(v & 255), X32 = v => { X8(v >>> 24); X8(v >>> 16); X8(v >>> 8); X8(v); }, XS = t => { for (const c of t) X8(c.charCodeAt(0)); };
    X32(0); X32(0); X8(l.name.length); XS(l.name); let n = l.name.length + 1; while (n % 4) { X8(0); n++; }
    if (l.uni) { const u = []; u.push(0, 0, 0, l.uni.length); for (const c of l.uni) u.push(c.charCodeAt(0) >> 8, c.charCodeAt(0) & 255); while (u.length % 4) u.push(0); XS('8BIM'); XS('luni'); X32(u.length); x.push(...u); }
    if (l.fill) { const u = []; const US = t => { for (const c of t) u.push(c.charCodeAt(0)); }; US('xxxxClr objcRGBC');
      for (const [k, v] of [['Rd  ', l.fill[0]], ['Grn ', l.fill[1]], ['Bl  ', l.fill[2]]]) { US(k); US('doub'); const f = new DataView(new ArrayBuffer(8)); f.setFloat64(0, v); u.push(...new Uint8Array(f.buffer)); }
      while (u.length % 4) u.push(0); XS('8BIM'); XS('SoCo'); X32(u.length); x.push(...u); }
    L32(x.length); lb.push(...x);
  }
  lb.push(...data); while (lb.length % 2) lb.push(0);
  u32(lb.length + 4 + 4); u32(lb.length); push(lb); b.push(...body); u32(0); // sin máscara global
  return new Uint8Array(b).buffer;
}

test('lee las capas de un .psd: nombres (también unicode), visibilidad, RLE y el color de una capa de relleno', () => {
  const P = KPF.psdRead(miniPsd());
  assert.equal(P.w, 32); assert.equal(P.h, 16); assert.equal(P.layers.length, 3);
  const [let_, gu, fill] = P.layers;
  assert.deepEqual(J([let_.name, let_.visible, let_.top, let_.left, let_.w, let_.h, let_.kind]), ['Letras', true, 1, 3, 2, 2, 'pixel']);
  assert.deepEqual([...let_.rgba], [10, 1, 5, 255, 20, 2, 6, 0, 30, 3, 7, 128, 40, 4, 8, 255]);
  assert.deepEqual(J([gu.name, gu.visible]), ['Guías KitPos', false]);
  assert.deepEqual(J([fill.kind, fill.fill, fill.clipping]), ['fill', [200, 16, 46], 1]);
  assert.deepEqual(J(KPF.tplLayers(P).map(l => l.name)), ['Letras']); // ni el fondo ni las guías
  assert.equal(KPF.tplFill(P), '#c8102e');
  assert.throws(() => KPF.psdRead(new Uint8Array([1, 2, 3, 4, 0, 0, 0, 0]).buffer), /Photoshop/);
});

// ---- fuente general: como la carpeta p1 que ya muestra minúsculas en el juego ----
test('con la tabla de minusculas.txt cada letra queda en el lugar y con el ancho que dice la tabla (atlas 4096×4096)', () => {
  const txt = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'sider', 'minusculas.txt'), 'utf8');
  const list = KPF.parseLetras(txt), L = J(KPF.fromTable(list));
  assert.equal(list.length, 371); assert.equal(L.W, 4096); assert.equal(L.H, 4096); assert.equal(L.cells.length, 371);
  assert.deepEqual([L.cells[0].ch, L.cells[0].x, L.cells[0].span, L.cells[0].row], ['A', 8, 132, 0]);
  assert.deepEqual([L.cells[1].ch, L.cells[1].x, L.cells[1].span], ['B', 156, 125]);
  const a = L.cells.find(c => c.ch === 'a'), c = L.cells.find(c => c.ch === 'c'), w = L.cells.find(c => c.ch === 'Ϋ');
  assert.deepEqual([a.x, a.row], [3802, 0]); assert.deepEqual([c.x, c.row], [8, 1]); assert.equal(w.row, 12);
  for (const ch of ['ñ', 'Ñ', 'é', 'ł', 'ș', 'Ж', 'ω', '.', "'", '-', ' ']) assert.ok(L.cells.some(x => x.ch === ch), ch);
  // la tabla que sale de esas casillas es la misma que la de KitPos
  const m = KPF.glyphMap(list, 4096, 4096); assert.equal(Math.round(m.get('a').sx), 3802); assert.equal(Math.round(m.get('a').sh), 256);
  assert.throws(() => KPF.fromTable([]), /vacía/);
});

// ---- revisión: por qué la fuente de un kit se ve (o no) en el juego ----
const TBL = () => KPF.parseLetras(require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'sider', 'minusculas.txt'), 'utf8'));
test('kitpos_letras.txt del kit copia la tabla de minusculas.txt línea por línea (y se reconoce como la misma)', () => {
  const txt = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'sider', 'minusculas.txt'), 'utf8');
  const out = KPF.kitTable(txt, 'Trebuchet\r\n; raro'), list = KPF.parseLetras(out);
  assert.equal(list.length, 371); assert.ok(KPF.sameTable(list, TBL())); assert.match(out, /fuente: Trebuchet raro/); assert.ok(!/\n; raro/.test(out));
  const moved = J(list); moved[5].u0 += .001; assert.ok(!KPF.sameTable(moved, TBL())); assert.ok(!KPF.sameTable([], []));
});

test('lee el tamaño de un .dds y de un .ftex por la cabecera y reconoce el formato de cada uno', () => {
  const dds = new Uint8Array(128); dds.set([68, 68, 83, 32]); const v = new DataView(dds.buffer); v.setUint32(12, 1024, true); v.setUint32(16, 4096, true); dds.set([68, 88, 84, 53], 84);
  assert.deepEqual(J(KPF.texSize(dds)), { w: 4096, h: 1024, fmt: 'DXT5' });
  const ft = new Uint8Array(32); ft.set([70, 84, 69, 88]); const f = new DataView(ft.buffer); f.setUint16(8, 4, true); f.setUint16(10, 4096, true); f.setUint16(12, 4096, true);
  assert.deepEqual(J(KPF.texSize(ft)), { w: 4096, h: 4096, fmt: 'DXT5' }); assert.equal(KPF.texSize(new Uint8Array(40)), null);
  assert.equal(KPF.texKind({ w: 4096, h: 4096 }), 'kitpos'); assert.equal(KPF.texKind({ w: 4096, h: 1024 }), 'game'); assert.equal(KPF.texKind({ w: 4096, h: 2048 }), 'other'); assert.equal(KPF.texKind(null), null);
});

test('distingue letras ubicadas con la tabla de letras centradas en casillas de plantilla', () => {
  const W = 4096, H = 4096, bw = W / 4, bh = 256, list = TBL();
  const blank = () => ({ bw, bh, ink: new Uint8Array(bw * bh) }), put = (I, x0, y0, x1, y1) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) I.ink[y * bw + x] = 1; };
  const T = blank(); for (const e of list) if (e.v1 * H / 4 <= bh) put(T, Math.ceil(e.u0 * W / 4) + 2, Math.ceil(e.v0 * H / 4) + 14, Math.floor(e.u1 * W / 4) - 2, Math.floor(e.v1 * H / 4) - 14);
  assert.equal(KPF.layoutGuess(T, W, H, list), 'table');
  const G = blank(); for (let r = 0; r < 4; r++) for (let c = 0; c < 16; c++) put(G, c * 64 + 20, r * 64 + 14, c * 64 + 44, r * 64 + 50); // su atlas: 16 letras por fila de 256 px
  assert.equal(KPF.layoutGuess(G, W, H, list), 'grid');
  assert.equal(KPF.layoutGuess(blank(), W, H, list), 'unknown');
  // el alfa de un DXT5 alcanza para saber dónde hay tinta
  const u8 = new Uint8Array(128 + 16 * 4); u8[128 + 16] = 255; assert.deepEqual(J(Array.from(KPF.inkDxt5(u8, 16, 4).ink)), [0, 1, 0, 0]);
});

const LOG = ['Sider DLL: version 7.3.3 (0)', 'Filename match: \\PES2021.exe', 'Loading module: kitpos.lua ...', '[kitpos.lua] kitpos: minusculas activas', '[kitpos.lua] kitpos: minusculas.txt: 371 letras',
  '[kitpos.lua] kitpos: hook_ok', 'OK: Lua module initialized: kitpos.lua (stack position: 37)', '[kitpos.lua] kitpos: fuente del kit: D:\\x\\p2\\kitpos_letras.txt (216 letras)'].join('\r\n');
test('lee de sider.log solo la última vez que se abrió el juego', () => {
  const d = J(KPF.logDiag('Sider DLL: version 7.0.0 (0)\r\n[kitpos.lua] kitpos: bad_bytes 1\r\n' + LOG));
  assert.deepEqual([d.sider, d.exe, d.listed, d.init, d.status, d.lower, d.table, d.noTable], ['7.3.3', 'PES2021.exe', true, true, 'hook_ok', true, 371, false]);
  assert.deepEqual(d.fonts, [{ file: 'D:\\x\\p2\\kitpos_letras.txt', n: 216 }]);
  const fl = J(KPF.logDiag('Sider DLL: version 7.3.3 (0)\r\nFilename match: \\FL_2026.exe\r\n[kitpos.lua] kitpos: bad_bytes 141EAC232'));
  assert.deepEqual([fl.exe, fl.listed, fl.status, fl.statusArg], ['FL_2026.exe', false, 'bad_bytes', '141EAC232']);
  assert.equal(KPF.logDiag('nada'), null);
});

test('explica por qué el nombre sale mal y ofrece el arreglo que corresponde', () => {
  const ks = x => J(KPF.diagnose(x)).map(e => e.k + (e.fix ? ':' + e.fix : '')), sq = { w: 4096, h: 4096 }, log = KPF.logDiag(LOG);
  // su caso: atlas de plantilla en un kit que no le pide la fuente a KitPos
  assert.deepEqual(ks({ font: 'u0184p1_name', dds: sq, ftex: sq, table: null, nameLower: false, layout: 'grid', log }), ['grid:tpl', 'no-table']);
  assert.deepEqual(ks({ font: 'f', dds: sq, table: null, nameLower: false, layout: 'table', log }), ['no-table:table']);
  assert.deepEqual(ks({ font: 'f', dds: sq, ftex: sq, table: 'same', nameLower: true, layout: 'table', log, stale: true }), ['kp-ok', 'stale']);
  assert.deepEqual(ks({ font: 'f', dds: sq, nameLower: true, layout: 'table', log: KPF.logDiag('Sider DLL: version 7.3.3 (0)\r\nFilename match: \\FL_2026.exe') }), ['kp-off:kp']);
  assert.deepEqual(ks({ font: 'f', dds: sq, nameLower: true, log: KPF.logDiag('Sider DLL: version 7.3.3 (0)\r\nLoading module: kitpos.lua\r\n[kitpos.lua] kitpos: bad_bytes 1') }), ['kp-exe:game']);
  assert.deepEqual(ks({ font: 'f', dds: { w: 4096, h: 1024 }, table: 'other' }), ['game-with-table:clear']);
  assert.deepEqual(ks({ font: 'f', dds: { w: 4096, h: 1024 } }), ['game-ok']);
  assert.deepEqual(ks({ font: 'f', dds: sq, ftex: { w: 2048, h: 512 } }), ['dds-ftex', 'game-ok']); // el juego usa el .ftex
  assert.deepEqual(ks({ font: 'f', dds: { w: 4096, h: 2048 } }), ['other-no-table']);
  assert.deepEqual(ks({ font: null }), ['no-font']); assert.deepEqual(ks({ font: 'f' }), ['no-tex']);
});
