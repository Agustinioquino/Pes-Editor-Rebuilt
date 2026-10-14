// Kit Studio Pro (js/kitstudio.js): copiar un kit de jugador como arquero y borrar kits (la carpeta queda en _borrados).
const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'kitstudio.js'), 'utf8');
const pick = re => { const m = src.match(re); assert.ok(m, 'falta ' + re); return m[0]; };
const code = [/async function ksWriteOrder\([\s\S]*?\n}\n/, /async function ksDuplicate\([\s\S]*?\n}\n/, /async function ksCopyDir\([\s\S]*?\n}\n/, /async function ksDelete\([\s\S]*?\n}\n/].map(pick).join('');
class File { constructor(t) { this.t = t; } }
class Dir {
  constructor() { this.kids = new Map(); this.kind = 'directory'; }
  async getDirectoryHandle(n, o) { const k = this.kids.get(n); if (k && k.kind === 'directory') return k; if (o && o.create) { const d = new Dir(); this.kids.set(n, d); return d; } throw Object.assign(new Error(n), { name: 'NotFoundError' }); }
  async getFileHandle(n, o) { let k = this.kids.get(n); if (k && k.kind === 'file') return k; if (!(o && o.create)) throw Object.assign(new Error(n), { name: 'NotFoundError' });
    k = { kind: 'file', data: '', getFile: async () => ({ arrayBuffer: async () => k.data, text: async () => String(k.data) }), createWritable: async () => ({ write: async d => { k.data = d; }, close: async () => { } }) }; this.kids.set(n, k); return k; }
  async removeEntry(n) { this.kids.delete(n); }
  async *entries() { for (const e of this.kids) yield e; }
}
async function setup() {
  const kit = new Dir(), team = await kit.getDirectoryHandle('Team', { create: true });
  for (const n of ['p1', 'p2', 'g1']) { const d = await team.getDirectoryHandle(n, { create: true }); (await d.getFileHandle('config.txt', { create: true })).data = 'cfg ' + n; (await d.getFileHandle('u0001' + n + '.ftex', { create: true })).data = 'tex ' + n; }
  const KS = { path: 'Team', kits: ['p1', 'p2'], gk: ['g1'], all: ['p1', 'p2', 'g1'], meta: {}, tex: new Map([['Team/p2:u0001p2', {}]]) };
  const ctx = vm.createContext({ KS, ksRoot: async () => ({ kit }), subDir: async (d, p) => d.getDirectoryHandle(p), readText: async (d, n) => { try { return String((await d.getFileHandle(n)).data); } catch { return null; } }, parseKitCfg: t => ({ t }), ksRefreshKitsMap: () => { } });
  const f = vm.runInContext(code + ';({ ksDuplicate, ksDelete })', ctx);
  return { team, KS, ...f, ord: async n => String((await team.getFileHandle(n)).data).trim().split(/\r\n/) };
}
test('un kit de jugador se copia como kit de arquero (g2) con sus archivos', async () => {
  const { team, KS, ksDuplicate, ord } = await setup();
  assert.strictEqual(await ksDuplicate('p1', true), 'g2');
  assert.deepStrictEqual(KS.gk, ['g1', 'g2']); assert.deepStrictEqual(await ord('gk_order.ini'), ['g1', 'g2']);
  const g2 = await team.getDirectoryHandle('g2'); assert.strictEqual((await g2.getFileHandle('u0001p1.ftex')).data, 'tex p1');
  assert.strictEqual(await ksDuplicate('p1'), 'p3'); assert.deepStrictEqual(KS.kits, ['p1', 'p2', 'p3']);
});
test('borrar un kit lo saca del orden y deja su carpeta en _borrados', async () => {
  const { team, KS, ksDelete, ord } = await setup();
  assert.strictEqual(await ksDelete('p2'), 'p2');
  assert.deepStrictEqual(KS.kits, ['p1']); assert.deepStrictEqual(await ord('order.ini'), ['p1']);
  assert.ok(!team.kids.has('p2')); assert.ok(!KS.tex.has('Team/p2:u0001p2'));
  const bk = await (await team.getDirectoryHandle('_borrados')).getDirectoryHandle('p2'); assert.strictEqual((await bk.getFileHandle('config.txt')).data, 'cfg p2');
  await assert.rejects(ksDelete('p1'), /al menos un kit de jugador/);
  assert.strictEqual(await ksDelete('g1'), 'g1'); assert.deepStrictEqual(KS.gk, []);
});
