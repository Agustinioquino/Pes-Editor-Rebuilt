// Lectura y escritura de cada campo del EDIT (js/pesdata.js): lo que se escribe se vuelve a leer igual
// y no pisa ningún otro byte del jugador o del equipo.
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, pattern } = require('./load');

const PesData = load('pesdata.js', 'PesData');
// Los arreglos vienen de otro contexto de vm: se copian para poder compararlos con deepEqual.
const plain = x => JSON.parse(JSON.stringify(x));
const PLAYER_SIZE = 0x138, PLAYER_START = 0x7C, TEAM_START = 0x8ED2FC;
const LAYOUT = { '2021': { teamSize: 0x24C, roster: 0x9D4648, tactics: 0xA09880 }, '2020': { teamSize: 0x210, roster: 0x9ccc04, tactics: 0xa01e3c } };

// Bits que ocupa cada campo, para comprobar que no se pisan entre sí ni se salen de la entrada.
const span = f => (f.str ? [f.off * 8, f.len * 8] : [f.bit, f.n]);
function bitMask(fields, size) {
  const owner = new Array(size * 8).fill(null);
  for (const [k, f] of Object.entries(fields)) {
    const [s, n] = span(f);
    for (let b = s; b < s + n; b++) {
      assert.ok(b < size * 8, `${k} se sale de la entrada`);
      assert.equal(owner[b], null, `${k} pisa a ${owner[b]}`);
      owner[b] = k;
    }
  }
  return owner;
}
// Compara dos buffers y devuelve los bits que cambiaron dentro de [base, base + size).
function changedBits(a, b, base, size) {
  const out = [];
  for (let i = 0; i < size; i++) { const x = a[base + i] ^ b[base + i]; for (let j = 0; j < 8; j++) if ((x >> j) & 1) out.push(i * 8 + j); }
  return out;
}

function checkNumericFields(acc, fields, size, label) {
  const owner = bitMask(fields, size);
  const base = 40; // la entrada no empieza en 0, para probar el desplazamiento
  const original = pattern(base + size + 40, 7);
  for (const [k, f] of Object.entries(fields)) {
    if (f.str) continue;
    const max = 2 ** f.n - 1;
    assert.equal(acc.max(k), max, `${label}.${k} max`);
    for (const v of [0, max, Math.floor(max / 2), 1 % (max + 1), (0x5A5A5A5A % (max + 1))]) {
      const d = original.slice();
      acc.set(d, base, k, v);
      assert.equal(acc.get(d, base, k), v, `${label}.${k} = ${v}`);
      // Solo cambian bits del propio campo, y nada fuera de la entrada.
      for (const b of changedBits(original, d, base, size)) assert.equal(owner[b], k, `${label}.${k} tocó el bit ${b} (${owner[b]})`);
      assert.ok(Buffer.from(d.subarray(0, base)).equals(Buffer.from(original.subarray(0, base))), `${label}.${k} tocó antes de la entrada`);
      assert.ok(Buffer.from(d.subarray(base + size)).equals(Buffer.from(original.subarray(base + size))), `${label}.${k} tocó después de la entrada`);
      // Volver a escribir el valor original deja el buffer idéntico.
      acc.set(d, base, k, acc.get(original, base, k));
      assert.ok(Buffer.from(d).equals(Buffer.from(original)), `${label}.${k} no vuelve al original`);
    }
    // Los valores fuera de rango se recortan al máximo y al mínimo.
    const d = original.slice();
    acc.set(d, base, k, max + 5); assert.equal(acc.get(d, base, k), max, `${label}.${k} recorta arriba`);
    acc.set(d, base, k, -3); assert.equal(acc.get(d, base, k), 0, `${label}.${k} recorta abajo`);
  }
}

function checkStringFields(acc, fields, size, label) {
  const base = 16;
  const original = pattern(base + size + 16, 11);
  for (const [k, f] of Object.entries(fields)) {
    if (!f.str) continue;
    for (const s of ['', 'Messi', 'Agustín Núñez', 'Ñandú ⚽']) {
      const d = original.slice();
      acc.set(d, base, k, s);
      const want = Buffer.byteLength(s) <= f.len - 1 ? s : null;
      if (want !== null) assert.equal(acc.get(d, base, k), want, `${label}.${k} = "${s}"`);
      // Fuera del campo no cambia nada.
      for (const b of changedBits(original, d, base, size)) assert.ok(b >= f.off * 8 && b < (f.off + f.len) * 8, `${label}.${k} tocó el bit ${b}`);
      assert.equal(d[base + f.off + f.len - 1], 0, `${label}.${k} siempre termina en 0`);
    }
    // Un texto más largo que el campo se corta sin romper letras con tilde.
    const d = original.slice();
    const long = 'Ñ'.repeat(f.len);
    acc.set(d, base, k, long);
    const got = acc.get(d, base, k);
    assert.ok(Buffer.byteLength(got) <= f.len - 1, `${label}.${k} cabe en el campo`);
    assert.ok(/^Ñ*$/.test(got) && got.length === Math.floor((f.len - 1) / 2), `${label}.${k} cortado mal: "${got}"`);
  }
}

test('jugador: cada campo numérico se escribe y se lee igual, sin pisar otros', () => {
  checkNumericFields(PesData.player, PesData.PLAYER_FIELDS, PLAYER_SIZE, 'jugador');
});
test('jugador: nombre y nombre en la camiseta se escriben y se leen igual', () => {
  checkStringFields(PesData.player, PesData.PLAYER_FIELDS, PLAYER_SIZE, 'jugador');
});
for (const game of ['2021', '2020']) {
  test(`equipo PES ${game}: cada campo numérico se escribe y se lee igual, sin pisar otros`, () => {
    checkNumericFields(PesData.team, PesData.TEAM_FIELDS, LAYOUT[game].teamSize, 'equipo');
  });
  test(`equipo PES ${game}: nombre, abreviatura, estadio y pancartas se escriben y se leen igual`, () => {
    checkStringFields(PesData.team, PesData.TEAM_FIELDS, LAYOUT[game].teamSize, 'equipo');
  });
}

test('los campos conocidos están todos', () => {
  for (const k of ['id', 'name', 'shirt', 'age', 'height', 'speed', 'reg_pos', 'boot_id', 'skin_col', 'iris_col', 'sk40', 'com6'])
    assert.ok(PesData.player.has(k), `falta jugador.${k}`);
  for (const k of ['id', 'name', 'short', 'stadium_name', 'banner4', 'rival3', 'c2r'])
    assert.ok(PesData.team.has(k), `falta equipo.${k}`);
  assert.ok(!PesData.player.has('no_existe'));
});

// Datos del EDIT descifrados, armados a mano: 3 jugadores y 2 equipos con plantel y táctica.
function sampleData(game) {
  const L = LAYOUT[game];
  const d = new Uint8Array(L.tactics + 2 * 0x274 + 64);
  const w32 = (o, v) => { d[o] = v & 255; d[o + 1] = (v >>> 8) & 255; d[o + 2] = (v >>> 16) & 255; d[o + 3] = v >>> 24; };
  d[96] = 3; d[100] = 2;
  [101, 102, 0xF0000003].forEach((id, i) => w32(PLAYER_START + i * PLAYER_SIZE, id));
  [500, 501].forEach((id, i) => w32(TEAM_START + i * L.teamSize, id));
  // Los planteles y tácticas están en otro orden que los equipos, como en los archivos reales.
  w32(L.roster, 501); w32(L.roster + 0x11C, 500);
  w32(L.roster + 0x11C + 4, 101); w32(L.roster + 0x11C + 8, 0xF0000003);
  d[L.roster + 0x11C + 4 + 160] = 10; d[L.roster + 0x11C + 4 + 162] = 9;
  w32(L.tactics, 500); w32(L.tactics + 0x274, 501);
  for (let i = 0; i < 11; i++) d[L.tactics + 4 + 0x1E0 + i] = i;
  d[L.tactics + 4 + 0x211] = 1;
  return d;
}

for (const game of ['2021', '2020']) {
  test(`PES ${game}: índice, plantel, titulares y capitán`, () => {
    const d = sampleData(game);
    const before = d.slice();
    const ix = PesData.index(d, game);
    assert.equal(ix.nPlayers, 3); assert.equal(ix.nTeams, 2);
    assert.deepEqual(plain(ix.players.map(p => p.id)), [101, 102, 0xF0000003]);
    assert.equal(ix.byId.get(0xF0000003).base, PLAYER_START + 2 * PLAYER_SIZE);
    const t = ix.teamById.get(500), t2 = ix.teamById.get(501);
    assert.equal(t.rosterBase, LAYOUT[game].roster + 0x11C);
    assert.equal(t2.rosterBase, LAYOUT[game].roster);
    assert.equal(t.tacticsBase, LAYOUT[game].tactics);
    assert.ok(Buffer.from(d).equals(Buffer.from(before)), 'leer el índice no cambia los datos');

    assert.deepEqual(plain(PesData.roster(d, t)), [{ slot: 0, pid: 101, number: 10 }, { slot: 1, pid: 0xF0000003, number: 9 }]);
    assert.deepEqual(plain(PesData.starters(d, t)), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.equal(PesData.captainSlot(d, t), 1);

    PesData.setRosterPlayer(d, t, 2, 102);
    PesData.setNumber(d, t, 2, 300);
    PesData.setStarter(d, t, 10, 2);
    PesData.setCaptainSlot(d, t, 2);
    assert.deepEqual(plain(PesData.roster(d, t).at(-1)), { slot: 2, pid: 102, number: 300 });
    assert.equal(PesData.starters(d, t)[10], 2);
    assert.equal(PesData.captainSlot(d, t), 2);
    // El otro equipo no se tocó.
    assert.deepEqual(plain(PesData.roster(d, t2)), []);
    assert.equal(PesData.captainSlot(d, t2), 0);

    // Deshacer todo deja los datos idénticos.
    PesData.setRosterPlayer(d, t, 2, 0); PesData.setNumber(d, t, 2, 0);
    PesData.setStarter(d, t, 10, 10); PesData.setCaptainSlot(d, t, 1);
    assert.ok(Buffer.from(d).equals(Buffer.from(before)));
  });
}

test('un equipo sin plantel ni táctica no rompe nada', () => {
  const t = { id: 1 };
  const d = new Uint8Array(8);
  assert.deepEqual(plain(PesData.roster(d, t)), []);
  assert.deepEqual(plain(PesData.starters(d, t)), []);
  assert.equal(PesData.captainSlot(d, t), -1);
  PesData.setStarter(d, t, 0, 5); PesData.setCaptainSlot(d, t, 5);
  assert.deepEqual([...d], [0, 0, 0, 0, 0, 0, 0, 0]);
});
