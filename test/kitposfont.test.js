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
