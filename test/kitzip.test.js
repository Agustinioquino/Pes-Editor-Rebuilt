// Cargar kits desde un .zip (js/kitzip.js): leer el .zip, reconocer las texturas, elegir el puesto,
// armar el config.txt y escribir la carpeta del kit con su lugar en order.ini / gk_order.ini.
const test = require('node:test'), assert = require('node:assert/strict');
const { load } = require('./load'), { FakeDir } = require('./fakefs'), { makeZip } = require('./zipmake');
const KZIP = load('kitzip.js', 'KZIP', { Blob, Response, DecompressionStream });
const J = x => JSON.parse(JSON.stringify(x)); // lo que devuelve el módulo viene de otro contexto (vm): sin esto deepEqual compara prototipos
const FTEX = (w = 16) => { const b = new Uint8Array(64 + 16 + 8); b.set([0x46, 0x54, 0x45, 0x58]); b[10] = w; b[12] = w; return b; };

test('lee un .zip con entradas guardadas, comprimidas y en carpetas', async () => {
  const zip = makeZip([['San Miguel/', '', false], ['San Miguel/config.txt', 'KitFile=u2689p1\r\n', true], ['San Miguel/u2689p1.ftex', FTEX(), false], ['readme.txt', 'hola', true]]);
  const es = await KZIP.read(zip);
  assert.deepEqual(J(es.map(e => e.name)), ['San Miguel/config.txt', 'San Miguel/u2689p1.ftex', 'readme.txt']);
  assert.equal(Buffer.from(await es[0].data()).toString(), 'KitFile=u2689p1\r\n');
  assert.deepEqual([...await es[1].data()].slice(0, 4), [0x46, 0x54, 0x45, 0x58]);
  assert.equal(Buffer.from(await es[2].data()).toString(), 'hola');
  await assert.rejects(KZIP.read(new Uint8Array(40)), /no tiene directorio central/);
});

test('reconoce qué textura es cada archivo, ignora las vistas previas y agrupa varios kits', () => {
  const E = (name, size = 1000) => ({ name, size });
  const one = KZIP.detect([E('u2689p1.ftex', 9000), E('u2689p1_back.dds'), E('u2689p1_name.png'), E('u2689p1_nrm.ftex'), E('preview.png', 50000), E('Thumbs.db'), E('leeme.txt'), E('config.txt')]);
  assert.equal(one.length, 1);
  assert.equal(one[0].files.kit.name, 'u2689p1.ftex'); assert.equal(one[0].files.back.name, 'u2689p1_back.dds'); assert.equal(one[0].files.name.name, 'u2689p1_name.png');
  assert.deepEqual(J(one[0].have), ['kit', 'nrm', 'back', 'name']); assert.deepEqual(J(one[0].generated), ['srm']); assert.deepEqual(J(one[0].missing), ['srm', 'chest', 'leg']);
  assert.ok(one[0].files.config); assert.deepEqual(J(one[0].extra.map(e => e.name)), ['leeme.txt', 'preview.png']);
  // sin nombres del juego: la imagen más grande que no sea una vista previa es el kit, y .ftex gana a .png
  const loose = KZIP.detect([E('mi camiseta.png', 4000), E('mi camiseta.ftex', 3000), E('render.png', 90000)]);
  assert.equal(loose[0].files.kit.name, 'mi camiseta.ftex');
  // varios kits en carpetas, y varios juntos por el prefijo u####p#
  const many = KZIP.detect([E('p1/u0001p1.ftex'), E('p1/config.txt'), E('g1/u0001g1.ftex'), E('u2689p2.ftex'), E('u2689p2_back.ftex'), E('u2689p3.ftex'), E('__MACOSX/._u2689p3.ftex')]);
  assert.deepEqual(J(many.map(k => k.label)).sort(), ['g1', 'p1', 'u2689p2', 'u2689p3']);
  assert.equal(many.find(k => k.label === 'u2689p2').files.back.name, 'u2689p2_back.ftex');
  assert.equal(KZIP.detect([E('leeme.txt'), E('preview.png')]).length, 0);
});

test('puestos: opciones, kit nuevo y lugar en order.ini', () => {
  const o = KZIP.slotOptions(['p1', 'p2', 'p1-alt', 'g1']);
  assert.deepEqual(J(o.map(x => [x.v, x.used])), [['p1', true], ['p2', true], ['p3', false], ['p4', false], ['new-p', false], ['g1', true], ['g2', false], ['new-g', false]]);
  assert.equal(o.find(x => x.v === 'new-p').name, 'p3'); assert.equal(o.find(x => x.v === 'new-g').name, 'g2');
  assert.equal(KZIP.nextFree(['p1', 'p2', 'p3', 'P4'], false), 'p5');
  assert.deepEqual(J(KZIP.orderInsert(['p1', 'p2', 'p1-alt'], 'p3')), ['p1', 'p2', 'p3', 'p1-alt']);
  assert.deepEqual(J(KZIP.orderInsert(['p1'], 'p4')), ['p1', 'p4']);
  assert.deepEqual(J(KZIP.orderInsert(['p1', 'p2'], 'p2')), ['p1', 'p2']);
  assert.deepEqual(J(KZIP.orderInsert(['p1', 'p2'], 'p1-alt')), ['p1', 'p2', 'p1-alt']);
  assert.equal(KZIP.roleOf('p2'), 'Suplente'); assert.equal(KZIP.roleOf('g3'), 'Arquero alternativo g3');
});

test('config.txt: respeta el que viene (y sus comentarios) y arma uno nuevo con los colores del kit', () => {
  const base = '; shirt parameters\r\nCollar=112                 ; 1 to 126\r\n; texture files\r\nKitFile=u0001p1\r\nBackNumbersFile=u0001p1_back   ; viejo\r\nChestNumbersFile=\r\nLegNumbersFile=u0001p1_leg\r\nNameFontFile=u0001p1_name\r\n; kit colors\r\nShirtColor1=#111111\r\n';
  const c = KZIP.configFor({ base, team: 2689, slot: 'p2', have: ['kit', 'back', 'nrm', 'srm', 'name'] });
  assert.equal(c.file, 'u2689p2');
  assert.match(c.text, /^Collar=112 {17}; 1 to 126\r$/m); assert.match(c.text, /^KitFile=u2689p2\r$/m);
  assert.match(c.text, /^BackNumbersFile=u2689p2_back   ; viejo\r$/m); assert.match(c.text, /^LegNumbersFile=\r$/m); assert.match(c.text, /^NameFontFile=u2689p2_name\r$/m);
  assert.match(c.text, /^ShirtColor1=#111111\r$/m, 'sin colores no se tocan');
  const n = KZIP.configFor({ base: null, team: 7, slot: 'g1', have: ['kit'], colors: { c1: '#aa0000', c2: '#ffffff', sh: '#000000', so: '#aa0000' } });
  assert.equal(n.file, 'u0007g1'); assert.match(n.text, /^KitFile=u0007g1\r$/m); assert.match(n.text, /^NameFontFile=\r$/m);
  assert.match(n.text, /^ShirtColor1=#aa0000\r$/m); assert.match(n.text, /^UniColor_Color2=#ffffff\r$/m); assert.match(n.text, /^SocksColor=#aa0000\r$/m); assert.match(n.text, /^NameY=\d+/m);
  // colores desde los píxeles: pecho rojo, mangas y espalda blancas, short azul, medias verdes (en las regiones de la textura del juego)
  const w = 64, h = 64, px = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4, u = x / w, v = y / h; let c = [255, 255, 255]; if (u > .34 && u < .66 && v > .49) c = [200, 0, 0]; else if (u < .34 && v > .58) c = [0, 0, 200]; else if (u < .34 && v > .31 && v < .56) c = [0, 160, 0]; px.set([...c, 255], i); }
  const col = J(KZIP.colorsFrom(px, w, h));
  assert.deepEqual(col, { c1: '#c80000', c2: '#ffffff', sh: '#0000c8', so: '#00a000' });
});

test('instala: escribe la carpeta, convierte, genera lo que falta, arma el config y el orden; reemplaza con copia', async () => {
  const dir = new FakeDir('San Miguel');
  await dir.put('p1/config.txt', 'KitFile=u2689p1\r\n'); await dir.put('p1/u2689p1.ftex', FTEX()); await dir.put('order.ini', 'p1\r\n');
  const zip = makeZip([['kit/u0100p1.ftex', FTEX(32), false], ['kit/u0100p1_back.ftex', FTEX(8), true], ['kit/config.txt', '; mio\r\nCollar=5\r\nKitFile=u0100p1\r\nBackNumbersFile=u0100p1_back\r\nNameFontFile=u0100p1_name\r\n', true]]);
  const kits = KZIP.detect(await KZIP.read(zip)); assert.equal(kits.length, 1);
  const logs = [], gens = [];
  const D = { dir, team: 2689, kits: ['p1'], gk: [], all: ['p1'], log: m => logs.push(m),
    toFtex: async (e, kind) => { const b = await e.data(); return kind === 'kit' ? b : new Uint8Array([kind.length]); },
    gen: async kind => { gens.push(kind); return kind === 'srm' ? null : new Uint8Array([9, 9]); },
    colors: async () => ({ c1: '#123456', c2: '#654321', sh: '#000000', so: '#ffffff' }), baseCfg: async () => 'Collar=1\r\nKitFile=\r\n' };
  // kit nuevo en p2: entra segundo en order.ini
  const r = await KZIP.install([{ kit: kits[0], name: 'p2', replace: false }], D);
  assert.equal(r.length, 1); assert.equal(r[0].file, 'u2689p2'); assert.deepEqual(J(r[0].have), ['kit', 'back', 'nrm', 'name']); assert.deepEqual(J(r[0].generated), ['nrm', 'name']);
  assert.deepEqual(J(r[0].missing), ['srm', 'chest', 'leg']); assert.equal(r[0].replaced, false); assert.equal(r[0].config, true); assert.equal(r[0].colors, null);
  assert.deepEqual(gens, ['nrm', 'srm', 'name']);
  assert.ok(dir.has('p2/u2689p2.ftex') && dir.has('p2/u2689p2_back.ftex') && dir.has('p2/u2689p2_nrm.ftex') && dir.has('p2/u2689p2_name.ftex') && !dir.has('p2/u2689p2_srm.ftex'));
  assert.equal(dir.bytes('p2/u2689p2.ftex')[10], 32, 'la textura del kit se copia tal cual');
  const cfg = dir.text('p2/config.txt');
  assert.match(cfg, /^; mio\r$/m); assert.match(cfg, /^Collar=5\r$/m); assert.match(cfg, /^KitFile=u2689p2\r$/m); assert.match(cfg, /^BackNumbersFile=u2689p2_back\r$/m); assert.match(cfg, /^NameFontFile=u2689p2_name\r$/m); assert.match(cfg, /^LegNumbersFile=\r$/m);
  assert.doesNotMatch(cfg, /ShirtColor1=#123456/, 'con config propio no se inventan colores');
  assert.equal(dir.text('order.ini'), 'p1\r\np2\r\n'); assert.deepEqual(D.kits, ['p1', 'p2']); assert.deepEqual(D.all, ['p1', 'p2']);
  // el mismo .zip sobre p1 sin permiso: no se toca nada
  await assert.rejects(KZIP.install([{ kit: kits[0], name: 'p1', replace: false }], D), /ya tiene un kit/);
  assert.equal(dir.bytes('p1/u2689p1.ftex')[10], 16);
  // reemplazar p1: lo de antes va a _borrados y el orden no cambia
  const r2 = await KZIP.install([{ kit: kits[0], name: 'p1', replace: true }], D);
  assert.equal(r2[0].replaced, true); assert.equal(dir.bytes('p1/u2689p1.ftex')[10], 32); assert.ok(dir.has('_borrados/p1/u2689p1.ftex')); assert.equal(dir.bytes('_borrados/p1/u2689p1.ftex')[10], 16);
  assert.equal(dir.text('order.ini'), 'p1\r\np2\r\n'); assert.deepEqual(D.all, ['p1', 'p2']);
  // un kit sin config.txt va como arquero: config base + colores leídos del kit, y gk_order.ini nuevo
  const zip2 = makeZip([['camiseta arquero.png', new Uint8Array([1, 2, 3]), true]]);
  const k2 = KZIP.detect(await KZIP.read(zip2));
  const r3 = await KZIP.install([{ kit: k2[0], name: 'g1', replace: false }], D);
  assert.equal(r3[0].file, 'u2689g1'); assert.deepEqual(J(r3[0].colors), { c1: '#123456', c2: '#654321', sh: '#000000', so: '#ffffff' });
  const c2 = dir.text('g1/config.txt'); assert.match(c2, /^Collar=1\r$/m); assert.match(c2, /^KitFile=u2689g1\r$/m); assert.match(c2, /^ShirtColor1=#123456\r$/m); assert.match(c2, /^ShortsColor=#000000\r$/m);
  assert.equal(dir.text('gk_order.ini'), 'g1\r\n'); assert.deepEqual(D.gk, ['g1']);
  // sin textura del kit no se instala
  const k3 = KZIP.detect([{ name: 'u2689p3_back.ftex', size: 1, data: async () => FTEX() }]);
  await assert.rejects(KZIP.install([{ kit: k3[0], name: 'p3', replace: false }], D), /no trae la textura del kit/);
  assert.ok(!dir.has('p3'));
});
