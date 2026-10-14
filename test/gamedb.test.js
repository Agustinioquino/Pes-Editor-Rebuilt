// Base del juego leída de los .cpk (Football Life 2026: download\data_s2526*.cpk): índice @UTF, CRILAYLA y el orden.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// carpetas falsas (sin distinguir mayúsculas, como en Windows); los archivos son Blob, así se pueden leer por partes
class FDir {
  constructor(name, tree = {}) { this.kind = 'directory'; this.name = name; this.map = new Map(); for (const [k, v] of Object.entries(tree)) this.map.set(k.toLowerCase(), ArrayBuffer.isView(v) ? { kind: 'file', name: k, async getFile() { return new Blob([v]); } } : new FDir(k, v)); }
  async getDirectoryHandle(n) { const x = this.map.get(n.toLowerCase()); if (!x || x.kind !== 'directory') throw Object.assign(new Error(n), { name: 'NotFoundError' }); return x; }
  async getFileHandle(n) { const x = this.map.get(n.toLowerCase()); if (!x || x.kind !== 'file') throw Object.assign(new Error(n), { name: 'NotFoundError' }); return x; }
  async *entries() { for (const x of this.map.values()) yield [x.name, x]; }
  async resolve(h) { if (h === this) return []; for (const x of this.map.values()) if (x.kind === 'directory') { const r = await x.resolve(h); if (r) return [x.name, ...r]; } return null; }
}
const ctx = vm.createContext({ TextDecoder, TextEncoder, Blob, console,
  subDir: async (dir, p) => { for (const seg of p.split(/[\\/]/).filter(Boolean)) dir = await dir.getDirectoryHandle(seg); return dir; },
  hasDir: async (d, n) => { try { return await d.getDirectoryHandle(n); } catch { return null; } },
  idbGet: async () => null });
const X = vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'gamedb.js'), 'utf8') + '\n;({ GDB, gdbUtf, gdbToc, gdbCrilayla, gdbPlain, gdbScan, gdbFindGame, gdbExe, gdbGameName })', ctx);

// ---- CRILAYLA de prueba: literales y referencias, escrito al revés como lo lee el juego ----
function layla(plain) {
  const head = plain.subarray(0, 0x100), body = plain.subarray(0x100), n = body.length, bits = [];
  const put = (v, w) => { for (let i = w - 1; i >= 0; i--) bits.push((v >> i) & 1); };
  for (let o = n - 1; o >= 0;) {
    let best = 0, bref = 0;
    for (let ref = 3; ref <= 8194 && o + ref < n; ref++) { let k = 0; while (o - k >= 0 && body[o - k] === body[o - k + ref]) k++; if (k > best) { best = k; bref = ref; } if (best > 300) break; }
    if (best >= 3) {
      put(1, 1); put(bref - 3, 13); let v = best - 3;
      for (const w of [2, 3, 5]) { const mx = (1 << w) - 1; const t = Math.min(v, mx); put(t, w); v -= t; if (t < mx) { v = -1; break; } }
      while (v >= 0) { const t = Math.min(v, 255); put(t, 8); v -= t; if (t < 255) break; }
      o -= best;
    } else { put(0, 1); put(body[o], 8); o--; }
  }
  while (bits.length % 8) bits.push(0);
  const data = new Uint8Array(bits.length / 8); for (let i = 0; i < data.length; i++) { let b = 0; for (let j = 0; j < 8; j++) b = b << 1 | bits[i * 8 + j]; data[data.length - 1 - i] = b; }
  const out = new Uint8Array(16 + data.length + 0x100); out.set(new TextEncoder().encode('CRILAYLA'));
  const dv = new DataView(out.buffer); dv.setUint32(8, n, true); dv.setUint32(12, data.length, true);
  out.set(data, 16); out.set(head, 16 + data.length); return out;
}
// ---- tabla @UTF y .cpk de prueba ----
function utf(cols, rows) {
  const strs = ['<NULL>'], so = s => { let o = 0; for (const x of strs) { if (x === s) return o; o += new TextEncoder().encode(x).length + 1; } strs.push(s); return o; };
  const W = { 4: 4, 6: 8, 0xa: 4 }, rowLen = cols.reduce((a, [, t]) => a + W[t], 0);
  const colBytes = [], rowBytes = [];
  for (const [nm, t] of cols) colBytes.push(0x50 | t, ...u32b(so(nm)));
  for (const r of rows) for (const [nm, t] of cols) { const v = r[nm]; if (t === 4) rowBytes.push(...u32b(v)); else if (t === 6) rowBytes.push(...u32b(0), ...u32b(v)); else rowBytes.push(...u32b(so(v))); }
  so('T');
  const strBytes = []; for (const s of strs) strBytes.push(...new TextEncoder().encode(s), 0);
  const rowsOff = 24 + colBytes.length, strOff = rowsOff + rowBytes.length, body = [...u32b(rowsOff), ...u32b(strOff), ...u32b(strOff + strBytes.length), ...u32b(so('T')), (cols.length >> 8) & 255, cols.length & 255, (rowLen >> 8) & 255, rowLen & 255, ...u32b(rows.length), ...colBytes, ...rowBytes, ...strBytes];
  return Uint8Array.from([0x40, 0x55, 0x54, 0x46, ...u32b(body.length), ...body]);
}
function u32b(v) { return [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]; }
function cpk(files) { // files: [ [ruta, bytes guardados, tamaño sin comprimir] ]
  const hdrUtf = () => utf([['TocOffset', 6], ['ContentOffset', 6]], [{ TocOffset: toc, ContentOffset: 0 }]);
  let toc = 0x800; const contentStart = 0x4000, parts = []; let at = contentStart;
  const rows = files.map(([p, b, x]) => { const i = p.lastIndexOf('/'); const r = { DirName: p.slice(0, i), FileName: p.slice(i + 1), FileSize: b.length, ExtractSize: x || b.length, FileOffset: at - toc }; parts.push([at, b]); at += b.length; return r; });
  const tocUtf = utf([['DirName', 0xa], ['FileName', 0xa], ['FileSize', 4], ['ExtractSize', 4], ['FileOffset', 6]], rows), h = hdrUtf();
  const out = new Uint8Array(at); out.set([0x43, 0x50, 0x4b, 0x20]); new DataView(out.buffer).setBigUint64(8, BigInt(h.length - 8), true); out.set(h, 16);
  out.set([0x54, 0x4f, 0x43, 0x20], toc); new DataView(out.buffer).setBigUint64(toc + 8, BigInt(tocUtf.length - 8), true); out.set(tocUtf, toc + 16);
  for (const [o, b] of parts) out.set(b, o); return out;
}
const bytes = (n, seed) => { const b = new Uint8Array(n); let x = seed; for (let i = 0; i < n; i++) { x = (Math.imul(x, 1103515245) + 12345) & 0x7fffffff; b[i] = i % 7 < 4 ? (x >>> 16) & 15 : b[Math.max(0, i - 40)]; } return b; };

test('CRILAYLA: lo comprimido vuelve a ser igual al original', () => {
  for (const [n, s] of [[0x100, 1], [0x101, 2], [5000, 3], [70000, 4]]) {
    const p = bytes(n, s), c = layla(p);
    assert.ok(n < 2000 || c.length < n, 'la prueba comprime de verdad');
    assert.deepStrictEqual(Buffer.from(X.gdbCrilayla(c)), Buffer.from(p));
    assert.deepStrictEqual(Buffer.from(X.gdbPlain(c)), Buffer.from(p));
  }
  const plain = bytes(300, 9); assert.strictEqual(X.gdbPlain(plain), plain, 'sin CRILAYLA no se toca');
});

test('Football Life 2026: la base sale del data_s2526 más nuevo y las carpetas de Sider van primero', async () => {
  const team1 = bytes(3000, 11), team2 = bytes(3000, 12), player = bytes(9000, 13), assign = bytes(1200, 14), ownTeam = bytes(1532, 15);
  const game = new FDir('Football Life 2026', {
    'FL_2026.exe': new Uint8Array(1),
    download: {
      'data_s2526.cpk': cpk([['common/etc/pesdb/Team.bin', team1], ['common/etc/pesdb/Player.bin', layla(player), player.length], ['common/etc/pesdb/PlayerAssignment.bin', assign], ['common/render/x.dds', new Uint8Array(8)]]),
      'data_s2526a.cpk': cpk([['common/etc/pesdb/Team.bin', layla(team2), team2.length]]),
      'DpFileList.bin': new Uint8Array(4)
    },
    SiderAddons: { 'sider.ini': new TextEncoder().encode('cpk.root = ".\\livecpk\\Mundo"\r\n'), livecpk: { Mundo: { common: { etc: { pesdb: { 'Competition.bin': ownTeam } } } } } }
  });
  const sider = await game.getDirectoryHandle('SiderAddons');
  assert.strictEqual(await X.gdbFindGame(game, sider), game);
  assert.strictEqual(await X.gdbExe(game), 'FL_2026.exe');
  assert.strictEqual(X.gdbGameName('FL_2026.exe'), 'Football Life 2026');
  ctx.siderCpkRoots = async s => [await (await s.getDirectoryHandle('livecpk')).getDirectoryHandle('Mundo')];
  const r = await X.gdbScan(game, sider);
  assert.strictEqual(r.cpks, 2);
  assert.deepStrictEqual(Buffer.from(await r.files.get('team.bin').get()), Buffer.from(team2), 'data_s2526a pisa a data_s2526');
  assert.strictEqual(r.files.get('team.bin').from, 'download\\data_s2526a.cpk');
  assert.deepStrictEqual(Buffer.from(await r.files.get('player.bin').get()), Buffer.from(player));
  assert.deepStrictEqual(Buffer.from(await r.files.get('playerassignment.bin').get()), Buffer.from(assign));
  assert.strictEqual(r.files.get('competition.bin').from, 'Sider: Mundo');
  assert.ok(!r.files.has('x.dds'));
});

test('la carpeta del juego: elegida más arriba (steamapps) o solo la de Sider', async () => {
  const lib = new FDir('common', { 'eFootball PES 2021': { 'PES2021.exe': new Uint8Array(1), Data: { 'dt10_all.cpk': cpk([['common/etc/pesdb/Team.bin', bytes(100, 1)]]) }, Sider: { 'sider.ini': new Uint8Array(1) } } });
  const g = await lib.getDirectoryHandle('eFootball PES 2021'), s = await g.getDirectoryHandle('Sider');
  assert.strictEqual(await X.gdbFindGame(lib, s), g);
  assert.strictEqual(await X.gdbFindGame(s, s), null, 'con solo la carpeta de Sider no se ve el juego');
});
