// Transfers must keep tactical slots attached to actual roster entries, even when the roster has holes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { load } = require('./load');

const app = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const grab = re => {
  const m = app.match(re);
  assert.ok(m, 'missing transfer helper in app.js: ' + re);
  return m[0];
};
const code = [
  grab(/const ORD = 0x1E4, TAKERS = 0x20C, NTAKERS = 9, CAPT = 0x215;\r?\n/),
  grab(/const getOrder = t => [\s\S]*?function swapInOrder/).replace(/\nfunction swapInOrder$/, '\n'),
  grab(/function tacticalOrderPlan\(t, extraSlots = \[\]\) \{[\s\S]*?\n\}/),
  grab(/function applyTacticalOrderPlan\(t, plan\) \{[\s\S]*?\n\}/),
  grab(/function syncTacticalRoster\(t\) \{[\s\S]*?\n\}/),
  grab(/function repairTacticalRosters\(\) \{[\s\S]*?\n\}/),
  grab(/function vacate\(t, slot\) \{[\s\S]*?\n\}/),
  grab(/function rosterRemove\(t, slot, auto = false\) \{[\s\S]*?\n\}/),
  grab(/function rosterAddCheck\(t, pid\) \{[\s\S]*?\n\}/),
  grab(/function rosterAdd\(t, pid, num\) \{[\s\S]*?\n\}/),
].join('');

const PD = load('pesdata.js', 'PesData');
const plain = x => JSON.parse(JSON.stringify(x));
const L = { teamSize: 0x24C, roster: 0x9D4648, tactics: 0xA09880 };
const TEAM_START = 0x8ED2FC;
const PLAYER_START = 0x7C;
const PLAYER_SIZE = 0x138;

function fixture() {
  const d = new Uint8Array(L.tactics + 2 * 0x274 + 64);
  const w32 = (o, v) => { d[o] = v & 255; d[o + 1] = v >>> 8 & 255; d[o + 2] = v >>> 16 & 255; d[o + 3] = v >>> 24; };
  d[96] = 11; d[100] = 2;
  Array.from({ length: 11 }, (_, i) => i + 101).forEach((id, i) => w32(PLAYER_START + i * PLAYER_SIZE, id));
  [500, 501].forEach((id, i) => w32(TEAM_START + i * L.teamSize, id));

  // The source has a hole at slot 2. Its actual substitute at slot 11 is beyond roster.length.
  w32(L.roster, 500);
  w32(L.roster + 4, 101);
  w32(L.roster + 8, 102);
  for (let slot = 3; slot < 12; slot++) w32(L.roster + 4 + slot * 4, slot + 100);
  w32(L.roster + 0x11C, 501);
  w32(L.tactics, 500);
  w32(L.tactics + 0x274, 501);
  for (let i = 0; i < 40; i++) d[L.tactics + 4 + 0x1E0 + i] = i;
  d[L.tactics + 4 + 0x211] = 0;
  d[L.tactics + 4 + 0x20C] = 0;

  const ix = PD.index(d, '2021');
  return { d, source: ix.teamById.get(500), dest: ix.teamById.get(501) };
}

const toasts = [];
const ctx = vm.createContext({
  PD, S: null, toasts, undo: () => {},
  tget: (t, key) => key === 'name' ? t.name : '',
  regT: t => [[t.base, 0x24C], [t.rosterBase, 0x11C], [t.tacticsBase, 0x274]],
  edit: (_label, _key, _regions, fn) => fn(),
  toast: message => toasts.push(message),
});
vm.runInContext(code, ctx);

test('transferring a starter with sparse roster slots promotes an occupied substitute', () => {
  const { d, source, dest } = fixture();
  ctx.S = { d }; ctx.source = source; ctx.dest = dest;

  assert.equal(vm.runInContext('rosterRemove(source, 0, true)', ctx), null);
  vm.runInContext('rosterAdd(dest, 101, 9)', ctx);

  const sourceRoster = PD.roster(d, source);
  const starters = PD.starters(d, source);
  assert.deepEqual(plain(sourceRoster.map(x => [x.slot, x.pid])), [
    [0, 102], [2, 103], [3, 104], [4, 105], [5, 106],
    [6, 107], [7, 108], [8, 109], [9, 110], [10, 111],
  ]);
  assert.equal(starters[0], 10);
  assert.ok(sourceRoster.some(x => x.slot === starters[0]), 'promoted tactical slot must contain a player');
  assert.equal(PD.captainSlot(d, source), 0, 'captain follows a valid starter through slot compaction');
  assert.equal(d[source.tacticsBase + 4 + 0x20C], 0, 'set-piece taker follows the captain through slot compaction');
  assert.deepEqual(plain(PD.roster(d, dest).map(x => [x.slot, x.pid, x.number])), [[0, 101, 9]]);
});

function partialOrderFixture() {
  const d = new Uint8Array(L.tactics + 0x274 + 64);
  const w32 = (o, v) => { d[o] = v & 255; d[o + 1] = v >>> 8 & 255; d[o + 2] = v >>> 16 & 255; d[o + 3] = v >>> 24; };
  d[96] = 31; d[100] = 1;
  for (let i = 0; i < 31; i++) w32(PLAYER_START + i * PLAYER_SIZE, 1000 + i);
  w32(TEAM_START, 500);
  w32(L.roster, 500);
  for (let slot = 0; slot < 31; slot++) w32(L.roster + 4 + slot * 4, 1000 + slot);
  w32(L.tactics, 500);
  for (let i = 0; i < 28; i++) d[L.tactics + 4 + 0x1E0 + i] = i;
  d.fill(255, L.tactics + 4 + 0x1E0 + 28, L.tactics + 4 + 0x1E0 + 40);
  const ix = PD.index(d, '2021');
  const team = ix.teamById.get(500); team.name = 'SSC Napoli';
  return { d, team, ix };
}

test('on load, unlisted roster slots fill the 0xff tactics sentinels in reserve order', () => {
  const { d, team, ix } = partialOrderFixture();
  ctx.S = { d, ix }; toasts.length = 0;

  assert.equal(vm.runInContext('repairTacticalRosters()', ctx), 1);
  const order = Array.from(d.subarray(team.tacticsBase + 4 + 0x1E0, team.tacticsBase + 4 + 0x1E0 + 40));
  assert.deepEqual(order.slice(0, 31), Array.from({ length: 31 }, (_, i) => i));
  assert.ok(order.slice(31).every(slot => slot === 255));
  assert.match(toasts[0], /3 de SSC Napoli/);
});

test('new roster additions enter tactical order after repairing older unlisted entries', () => {
  const { d, team, ix } = partialOrderFixture();
  ctx.S = { d, ix }; ctx.team = team;

  assert.equal(vm.runInContext('rosterAddCheck(team, 2000)', ctx), null);
  vm.runInContext('rosterAdd(team, 2000, 8)', ctx);
  const order = Array.from(d.subarray(team.tacticsBase + 4 + 0x1E0, team.tacticsBase + 4 + 0x1E0 + 40));
  assert.deepEqual(order.slice(0, 32), Array.from({ length: 32 }, (_, i) => i));
  assert.equal(PD.roster(d, team).find(x => x.pid === 2000).slot, 31);
  assert.ok(order.includes(31));
});

test('removing a roster slot keeps 0xff sentinels and remaps later tactical slots', () => {
  const { d, team, ix } = partialOrderFixture();
  ctx.S = { d, ix }; ctx.team = team;

  assert.equal(vm.runInContext('rosterRemove(team, 4, true)', ctx), null);
  const roster = PD.roster(d, team), order = Array.from(d.subarray(team.tacticsBase + 4 + 0x1E0, team.tacticsBase + 4 + 0x1E0 + 40));
  assert.equal(roster.length, 30);
  assert.deepEqual(order.slice(0, 27), [0, 1, 2, 3, 10, 4, 5, 6, 7, 8, 9, ...Array.from({ length: 16 }, (_, i) => i + 11)]);
  assert.ok(order.slice(27).every(slot => slot === 255));
  assert.ok(order.slice(0, 27).every(slot => roster.some(x => x.slot === slot)));
});
