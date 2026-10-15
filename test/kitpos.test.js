// Posición libre de KitPos (js/kitpos.js): pasos de kserv <-> valores del juego y kitpos_slots.ini.
const test = require('node:test'), assert = require('node:assert/strict');
const { load } = require('./load');
const KPOS = load('kitpos.js', 'KPOS');
const J = x => JSON.parse(JSON.stringify(x));
const near = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);

test('pasos de kserv y valores del juego, ida y vuelta (con decimales)', () => {
  near(KPOS.fromSteps('NameY', 16.5), 0.05 + 16.5 * 0.37 / 39); near(KPOS.toSteps('NameY', KPOS.fromSteps('NameY', 16.5)), 16.5);
  for (const f of ['NameSize', 'BackNumberY', 'BackNumberSize', 'ChestNumberX', 'ChestNumberY', 'ShortsNumberX', 'ShortsNumberSize', 'NameStretch']) near(KPOS.toSteps(f, KPOS.fromSteps(f, 7.25)), 7.25);
  near(KPOS.toSteps('ShortsNumberY', KPOS.fromSteps('ShortsNumberY', 12, 1), 1), 12); near(KPOS.fromSteps('ShortsNumberY', 0, 0), 0.96);
});

test('el arco: las 3 formas de kserv y valores intermedios o al revés', () => {
  near(KPOS.curveToSteps(1000 / 336), 2); near(KPOS.curveToSteps(0), 0); near(KPOS.stepsToCurve(1.5), (1000 / 672 + 1000 / 336) / 2);
  near(KPOS.curveToSteps(KPOS.stepsToCurve(-0.8)), -0.8); near(KPOS.curveToSteps(KPOS.stepsToCurve(4.2)), 4.2);
});

test('lo que se ve sin KitPos sale del config.txt (NameStretch 0 es ancho normal)', () => {
  const cfg = { NameY: '17', NameStretch: '0', NameShape: '2', ShortsNumberY: '5', ShortsNumberSide: '1' }, get = k => cfg[k];
  near(KPOS.fromCfg('NameY', get), KPOS.fromSteps('NameY', 17)); near(KPOS.fromCfg('NameStretch', get), 1); near(KPOS.fromCfg('NameCurve', get), 1000 / 336);
  near(KPOS.fromCfg('ShortsNumberY', get), 0.04 + 5 * 0.19 / 29); assert.equal(KPOS.fromCfg('NameSpacing', get), 0);
});

const INI = '; kitpos_slots.ini\r\n\r\n[opciones]\r\nminusculas_juego = 1   ; comentario\r\n\r\n[equipo 2689]\r\nNameY = 0.30000\r\n\r\n[equipo 2689 p1]\r\nNameY = 0.38051\r\nBackNumberY_steps = 14.5\r\n\r\n[3]\r\nNameY = 0.36654\r\n';

test('lee kitpos_slots.ini: equipo, kit, arquero, _steps y opciones', () => {
  const P = KPOS.parse(INI);
  assert.equal(P.opts.minusculas_juego, '1'); near(P.secs['equipo 2689 p1'].BackNumberY, 1.2 - 14.5 * 1.2 / 29);
  const r = KPOS.resolve(P, 2689, 1, false); near(r.NameY, 0.38051); near(KPOS.resolve(P, 2689, 2, false).NameY, 0.3);
  assert.deepEqual(J(KPOS.resolve(P, 2689, 0, true)), {}); assert.equal(KPOS.secKey(2689, 2), 'equipo 2689 p2'); assert.equal(KPOS.secKey(5, 0, true), 'equipo 5 gk');
});

test('escribe una sección sin tocar el resto, borra campos y saca la sección vacía', () => {
  let t = KPOS.setValues(INI, 'equipo 2689 p1', { NameY: 0.4, BackNumberY: null, NameCurve: 2.25 });
  assert.match(t, /\[equipo 2689 p1\]\r\nNameY = 0\.40000\r\nNameCurve = 2\.25000\r\n\r\n\[3\]/); assert.ok(!/BackNumberY/.test(t));
  assert.ok(t.includes('minusculas_juego = 1   ; comentario') && t.includes('[equipo 2689]\r\nNameY = 0.30000'));
  t = KPOS.setValues(t, 'equipo 77 gk', { NameSize: 1.2 }); assert.ok(t.endsWith('[3]\r\nNameY = 0.36654\r\n\r\n[equipo 77 gk]\r\nNameSize = 1.20000\r\n'), t);
  t = KPOS.setValues(t, 'equipo 2689 p1', { NameY: null, NameCurve: null }); assert.ok(!/equipo 2689 p1/.test(t)); assert.ok(!/\r\n\r\n\r\n/.test(t), JSON.stringify(t));
  assert.equal(KPOS.parse(t).secs['equipo 77 gk'].NameSize, 1.2);
  assert.equal(KPOS.setValues('', 'equipo 1', { NameY: 0.2 }), '[equipo 1]\r\nNameY = 0.20000\r\n');
  assert.equal(KPOS.setValues(KPOS.SEED, 'equipo 1', { NameY: null }), KPOS.SEED);
});

test('sider.ini: agrega kitpos.lua debajo de kserv.lua y prende lua y luajit, sin repetir', () => {
  const ini = '[sider]\r\nlua.enabled = 1\r\n; luajit.ext.enabled = 1\r\nluajit.ext.enabled = 0\r\nlua.module = "a.lua"\r\nlua.module = "kserv.lua"\r\nlua.module = "b.lua"\r\n';
  const r = KPOS.siderIni(ini); assert.ok(r.changed);
  assert.match(r.text, /lua\.module = "kserv\.lua"\r\nlua\.module = "kitpos\.lua"\r\nlua\.module = "b\.lua"/); assert.match(r.text, /^luajit\.ext\.enabled = 1$/m); assert.match(r.text, /; luajit\.ext\.enabled = 1/);
  assert.equal(KPOS.siderIni(r.text).changed, false);
  const r2 = KPOS.siderIni('[sider]\nlua.module = "x.lua"\n'); assert.equal(r2.text, '[sider]\nlua.enabled = 1\nluajit.ext.enabled = 1\nlua.module = "x.lua"\nlua.module = "kitpos.lua"\n');
});
