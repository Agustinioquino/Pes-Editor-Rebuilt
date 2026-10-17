// Jugadores de la base agregados al EDIT (insertEditPlayers en js/app.js): llevan sus posiciones, el pie hábil, las
// habilidades de arquero en su lugar y el físico de PlayerAppearance.bin; si no, el juego los muestra sin puestos y con
// todo el cuerpo en -7. Los que agregaron versiones anteriores se arreglan solos (repairEditPlayers).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const grab = re => { const m = src.match(re); assert.ok(m, 'falta en app.js: ' + re); return m[0]; };
const code = [
  grab(/const POS_TO_PP = [^\n]*\n/), grab(/const BODY = [^\n]*\n/), grab(/const DB_ABIL = [^\n]*\n/),
  grab(/const DB_POSFLAG = [^\n]*\n/), grab(/let DBRAW = null;[\s\S]*?\nasync function namesFromBin/).replace(/\nasync function namesFromBin$/, '\n'),
].join('');
const PD = vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'pesdata.js'), 'utf8') + '\n;PesData', vm.createContext({ TextDecoder, TextEncoder }));
const toasts = [], hist = [];
const ctx = vm.createContext({
  TextDecoder, TextEncoder, Blob, Response, DecompressionStream, PD, toasts, hist, RATE_GEN: 0,
  S: null, toast: m => toasts.push(m), undo: () => { }, playerName: () => 'ALMADA',
  pget: null, edit: (label, key, regions, fn) => { hist.push(label); return fn(); },
});
vm.runInContext(code + `
pget = (p, k) => PD.player.get(S.d, p.base, k);
const setBits = (b, o, pos, n, v) => { for (let i = 0; i < n; i++) { const q = pos + i, m = 1 << (q & 7); if ((v >> i) & 1) b[o + (q >> 3)] |= m; else b[o + (q >> 3)] &= ~m; } };
;`, ctx);
const run = s => vm.runInContext(s, ctx);

// base con un jugador (id 7001): mediocampista con A en MC y MCD, B en MO; zurdo; arquero con valores distintos en cada habilidad
const ID = 7001, db = new Uint8Array(0x138);
db.set([ID & 255, ID >> 8, 0, 0], 8);
const put = (pos, n, v) => run('setBits')(db, 0, pos, n, v);
put(434, 4, 5); put(256, 7, 62 - 30); put(408, 6, 25 - 15); put(514, 1, 1);
put(456, 2, 2); put(414, 2, 2); put(464, 2, 1);
const gkDb = { gk: 70, catching: 61, clearing: 52, reflex: 83, cover: 44 };
for (const [k, v] of Object.entries(gkDb)) put(run('DB_ABIL')[k], 6, v - 40);
for (const k of ['atk', 'drib', 'lowpass']) put(run('DB_ABIL')[k], 6, 74 - 40);
db[0x1B] = 71; db.set(new TextEncoder().encode('ALMADA'), 0x81); db.set(new TextEncoder().encode('Thiago Almada'), 0xFB);
// PlayerAppearance.bin: id + 56 bytes que van tal cual al EDIT desde +0xFC
const app = new Uint8Array(60); app.set([ID & 255, ID >> 8, 0, 0], 0); for (let i = 4; i < 60; i++) app[i] = (i * 37) & 255;

function freshEdit() {
  const d = new Uint8Array(0x7C + 4 * 0x138);
  ctx.S = { d, f: { game: '2021' }, ix: null };
  run(`S.ix = PD.index(S.d, S.f.game); DBRAW = { b: DBX, off: new Map([[${ID}, 0]]) };`);
}
ctx.DBX = db;

test('al agregar un jugador de la base al EDIT van sus posiciones, el pie y el peso', () => {
  freshEdit(); run('DBAPP = null');
  assert.deepEqual([...run(`insertEditPlayers([${ID}])`)], [ID]);
  const p = run(`S.ix.byId.get(${ID})`), g = k => PD.player.get(ctx.S.d, p.base, k), pp = r => g('pos' + run('POS_TO_PP')[r]);
  assert.equal(g('reg_pos'), 5); assert.equal(pp(5), 2); assert.equal(pp(4), 2); assert.equal(pp(8), 1);
  assert.equal([0, 1, 2, 3, 6, 7, 9, 10, 11, 12].map(pp).join(''), '0000000000');
  assert.equal(g('weight'), 62); assert.equal(g('height'), 171); assert.equal(g('age'), 25); assert.equal(g('strong_foot'), 1);
  for (const [k, v] of Object.entries(gkDb)) assert.equal(g(k), v, k);
  // sin PlayerAppearance.bin: cuerpo normal (7 = 0 en el juego), nunca 0 (= -7)
  for (const [k] of run('BODY')) assert.equal(g(k), 7, k);
});

test('con PlayerAppearance.bin, el físico y la apariencia se copian tal cual', async () => {
  freshEdit();
  assert.equal(await run('appearanceFromBin')(app), 1);
  run(`insertEditPlayers([${ID}])`);
  const p = run(`S.ix.byId.get(${ID})`), d = ctx.S.d;
  assert.deepEqual([...d.subarray(p.base + 0xFC, p.base + 0x134)], [...app.subarray(4)]);
  assert.equal(d[p.base + 0xF0] | d[p.base + 0xF1] << 8, ID);
});

test('los jugadores que se agregaron sin posiciones ni físico se arreglan al leer la base', () => {
  freshEdit(); run('DBAPP = null'); run(`insertEditPlayers([${ID}])`);
  const p = run(`S.ix.byId.get(${ID})`), base = p.base, set = (k, v) => PD.player.set(ctx.S.d, base, k, v);
  // como lo dejaba la versión anterior: sin puestos, peso 0, cuerpo en 0 y las de arquero cruzadas (+3 de la forma)
  for (let i = 0; i <= 12; i++) set('pos' + i, 0);
  set('weight', 0); set('strong_foot', 0); for (const [k] of run('BODY')) set(k, 0);
  const old = { gk: 52 + 3, catching: 44 + 3, clearing: 83 + 3, reflex: 70 + 3, cover: 61 + 3 };
  for (const [k, v] of Object.entries(old)) set(k, v);
  run('DBAPP = null'); toasts.length = 0;
  assert.equal(run('repairEditPlayers()'), 1);
  const g = k => PD.player.get(ctx.S.d, base, k);
  for (const [k, v] of Object.entries(gkDb)) assert.equal(g(k), v + 3, k);
  assert.equal(g('pos' + run('POS_TO_PP')[5]), 2); assert.equal(g('weight'), 62); assert.equal(g('strong_foot'), 1);
  assert.equal(g('neck_len'), 7);
  assert.match(toasts[0], /Arreglé a ALMADA/);
  // ya arreglado: no se vuelve a tocar
  assert.equal(run('repairEditPlayers()'), 0);
});
