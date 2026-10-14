// Pestaña Sider: lectura y escritura de sider.ini, resolución de cpk.root y clasificación de carpetas.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// carpetas falsas con nombres sin distinguir mayúsculas, como en Windows. null = archivo; Uint8Array = archivo con bytes
class FDir {
  constructor(name, tree = {}) { this.kind = 'directory'; this.name = name; this.map = new Map(); for (const [k, v] of Object.entries(tree)) this.map.set(k.toLowerCase(), v instanceof FDir ? v : (v === null || ArrayBuffer.isView(v)) ? { kind: 'file', name: k, bytes: v || new Uint8Array(0), async getFile() { const b = this.bytes; return { arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), text: async () => new TextDecoder().decode(b) }; } } : new FDir(k, v)); }
  async getDirectoryHandle(n) { const x = this.map.get(n.toLowerCase()); if (!x || x.kind !== 'directory') throw Object.assign(new Error(n), { name: 'NotFoundError' }); return x; }
  async getFileHandle(n) { const x = this.map.get(n.toLowerCase()); if (!x || x.kind !== 'file') throw Object.assign(new Error(n), { name: 'NotFoundError' }); return x; }
  async *entries() { for (const x of this.map.values()) yield [x.name, x]; }
}
const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'siderini.js'), 'utf8');
const ctx = vm.createContext({ TextDecoder, TextEncoder, console,
  subDir: async (dir, p) => { for (const seg of p.split(/[\\/]/).filter(Boolean)) dir = await dir.getDirectoryHandle(seg); return dir; },
  sdbFile: async (d, n) => { try { return await (await d.getFileHandle(n)).getFile(); } catch { return null; } },
  hasFile: async (d, n) => { try { await d.getFileHandle(n); return true; } catch { return false; } },
  hasDir: async (d, n) => { try { return await d.getDirectoryHandle(n); } catch { return null; } },
  lines: t => (t || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean) });
const J = x => JSON.parse(JSON.stringify(x)); // los objetos nacen en el otro contexto del vm
const X = vm.runInContext(code + '\n;({ SI, siParse, siText, siDirty, siAdd, siSet, siMove, siKv, siGet, siById, siResolve, siScanRoot, siDecode, siEncode, siReadIni })', ctx);

const INI = '[sider]\r\n; debug level\r\ndebug = 0\r\nlivecpk.enabled = 1\r\nlua.enabled = 1 ; comentario\r\nexe.name = "\\PES2021.exe"\r\n\r\ncpk.root = ".\\livecpk\\A"\r\ncpk.root = ".\\livecpk\\B" ; escudos\r\n; cpk.root = ".\\livecpk\\C"\r\n# cpk.root = "D:\\X\\livecpk\\D"\r\nlua.module = "kserv.lua"\r\nlua.module = "chants.lua"\r\n';

test('sider.ini: leer y volver a escribir sin cambios deja el texto igual', () => {
  X.siParse(INI); X.SI.orig = INI;
  assert.strictEqual(X.siText(), INI);
  assert.strictEqual(X.siDirty(), false);
  const roots = X.siKv('cpk.root', true);
  assert.deepStrictEqual(J(roots.map(r => [r.val, r.off, r.cmt])), [['.\\livecpk\\A', false, ''], ['.\\livecpk\\B', false, '; escudos'], ['.\\livecpk\\C', true, ''], ['D:\\X\\livecpk\\D', true, '']]);
  assert.strictEqual(X.siGet('lua.enabled'), '1');
  assert.strictEqual(X.siKv('lua.enabled')[0].cmt, '; comentario');
  assert.strictEqual(X.siGet('exe.name'), '\\PES2021.exe');
});

test('sider.ini: prender, apagar, ordenar, agregar y quitar solo tocan sus líneas', () => {
  X.siParse(INI); X.SI.orig = INI;
  const [a, b, c] = X.siKv('cpk.root', true);
  a.off = true; a.ch = true; c.off = false; c.ch = true;            // apagar A, prender C
  X.siMove(b, -1);                                                      // B sube arriba de A
  X.siAdd('cpk.root', '.\\livecpk\\Nuevo');                           // al final del grupo
  X.siSet('debug', '2'); X.siSet('overlay.enabled', '1');               // existente y nuevo (después de [sider])
  const mods = X.siKv('lua.module'); X.SI.items.splice(X.SI.items.indexOf(mods[1]), 1); // quitar chants
  const out = X.siText().split('\r\n');
  assert.deepStrictEqual(out.filter(l => /cpk\.root/.test(l)), ['cpk.root = ".\\livecpk\\B" ; escudos', '; cpk.root = ".\\livecpk\\A"', 'cpk.root = ".\\livecpk\\C"', '# cpk.root = "D:\\X\\livecpk\\D"', 'cpk.root = ".\\livecpk\\Nuevo"']);
  assert.strictEqual(out[1], 'overlay.enabled = 1');
  assert.ok(out.includes('debug = 2'));
  assert.ok(out.includes('lua.enabled = 1 ; comentario'), 'las líneas sin tocar quedan tal cual');
  assert.ok(!out.some(l => /chants/.test(l)));
  assert.strictEqual(X.siDirty(), true);
  X.siParse(X.SI.orig); assert.strictEqual(X.siDirty(), false);
});

test('sider.ini: saltos LF, claves en mayúsculas y comentarios sin punto no se toman como ajustes', () => {
  const ini = '[Sider]\nLUA.Enabled = 0\n; Note: this = that\n; debug = 3\ncpk.root = livecpk/Sin-Comillas\n';
  X.siParse(ini); X.SI.orig = ini;
  assert.strictEqual(X.siGet('lua.enabled'), '0');
  assert.strictEqual(X.SI.items.find(x => /Note/.test(x.raw)).kind, 'txt');
  assert.strictEqual(X.siKv('debug', true)[0].off, true);
  X.siSet('lua.enabled', '1');
  assert.strictEqual(X.siText().split('\n')[1], 'LUA.Enabled = 1');
  X.siAdd('lua.module', 'kserv.lua');
  assert.ok(X.siText().split('\n').includes('lua.module = "kserv.lua"'));
  assert.ok(X.siText().includes('\n') && !X.siText().includes('\r\n'));
});

const sider = new FDir('Sider PES2021', { 'sider.ini': null, 'sider.exe': null, livecpk: { Escudos: { common: { render: { symbol: { flag: { 'e_000100_r.png': null, 'e_000101_r.png': null } } } } }, 'Faces-HD': { common: { character0: { model: { character: { face: { real: { '1000': {} } } } } } } }, Balones: { common: { character0: { model: { character: { ball: { b1: {} } } } } } }, Tattoos: {}, 'Menu-Pack': { x: {} } }, content: { 'kit-server': { 'map.txt': null } } });

test('cpk.root: rutas relativas, completas, renombradas y de afuera', async () => {
  const r = async v => { const x = await X.siResolve(sider, v); return J([x.rel, !!x.h, x.outside, x.name]); };
  assert.deepStrictEqual(await r('.\\livecpk\\Escudos'), ['livecpk\\Escudos', true, false, 'Escudos']);
  assert.deepStrictEqual(await r('livecpk\\Escudos\\'), ['livecpk\\Escudos', true, false, 'Escudos']);
  assert.deepStrictEqual(await r('./livecpk/escudos'), ['livecpk/escudos'.replace(/\//g, '\\'), true, false, 'escudos']);
  assert.deepStrictEqual(await r('.\\livecpk\\NoExiste'), ['livecpk\\NoExiste', false, false, 'NoExiste']);
  assert.deepStrictEqual(await r('C:\\Program Files (x86)\\Steam\\steamapps\\common\\eFootball PES 2021\\Sider PES2021\\livecpk\\Balones'), ['livecpk\\Balones', true, false, 'Balones']);
  assert.deepStrictEqual(await r('D:\\Juegos\\Sider-Viejo\\livecpk\\Balones'), ['livecpk\\Balones', true, false, 'Balones'], 'la carpeta Sider cambió de nombre y lugar');
  assert.deepStrictEqual(await r('D:\\Otro\\Balones'), [null, false, true, 'Balones'], 'sin livecpk en la ruta no se adivina: es de afuera');
  assert.deepStrictEqual(await r('D:\\Juegos\\Sider-Viejo\\livecpk'), ['livecpk', true, false, 'livecpk'], 'la carpeta livecpk misma');
  assert.deepStrictEqual(await r('\\livecpk\\Escudos'), ['livecpk\\Escudos', true, false, 'Escudos'], 'barra inicial');
  assert.deepStrictEqual((await r('D:\\Otro\\Mods\\Nada'))[2], true, 'ruta completa que no está acá');
  assert.deepStrictEqual((await r('E:\\Parche\\livecpk\\Nada')).slice(0, 3), ['livecpk\\Nada', false, false], 'parece de esta Sider pero la carpeta no existe');
  assert.deepStrictEqual((await r('..\\Otro\\livecpk\\X'))[2], true, 'sube un nivel: no se puede mirar');
});

test('clasificación de carpetas: por lo que tienen adentro o por el nombre', async () => {
  const live = await sider.getDirectoryHandle('livecpk');
  const t = async n => J(await X.siScanRoot(await live.getDirectoryHandle(n), n)).map(x => x.t + (x.sure ? '' : '?') + (x.count ? ':' + x.count : ''));
  assert.deepStrictEqual(await t('Escudos'), ['escudos:2']);
  assert.deepStrictEqual(await t('Faces-HD'), ['caras:1']);
  assert.deepStrictEqual(await t('Balones'), ['balones']);
  assert.deepStrictEqual(await t('Tattoos'), ['tatuajes?']);
  assert.deepStrictEqual(await t('Menu-Pack'), ['menu?']);
});

test('sider.ini en UTF-8, UTF-16 y Windows-1252 se lee bien y se guarda igual', async () => {
  const u8 = new TextEncoder().encode('[sider]\r\ndebug = 1\r\n');
  assert.deepStrictEqual([X.siDecode(u8).enc, X.siDecode(u8).text], ['utf-8', '[sider]\r\ndebug = 1\r\n']);
  const bom8 = new Uint8Array([0xEF, 0xBB, 0xBF, ...u8]); assert.deepStrictEqual([X.siDecode(bom8).enc, X.siDecode(bom8).text], ['utf-8-bom', '[sider]\r\ndebug = 1\r\n']);
  assert.deepStrictEqual(Array.from(X.siEncode('[sider]\r\ndebug = 1\r\n', 'utf-8-bom')), Array.from(bom8), 'el BOM se conserva al guardar');
  const txt = '[sider]\r\n; año\r\ndebug = 1\r\n';
  const u16 = X.siEncode(txt, 'utf-16le'); assert.deepStrictEqual([u16[0], u16[1], u16[2], u16[3]], [0xFF, 0xFE, 0x5B, 0]);
  assert.deepStrictEqual([X.siDecode(u16).enc, X.siDecode(u16).text], ['utf-16le', txt]);
  const cp = X.siEncode(txt, 'cp1252'); assert.strictEqual(cp[txt.indexOf('ñ')], 0xF1, 'ñ en un byte');
  const d = X.siDecode(cp); assert.deepStrictEqual([d.enc, d.text], ['cp1252', txt]);
  // Windows-1252: € … – ’ (bytes 0x80–0x9F) se leen y se vuelven a escribir con el mismo byte
  const hi = new Uint8Array([0x3b, 0x20, 0x85, 0x20, 0x96, 0x20, 0x92, 0x20, 0x80, 0x20, 0xf1]); const dh = X.siDecode(hi);
  assert.deepStrictEqual([dh.enc, dh.text], ['cp1252', '; \u2026 \u2013 \u2019 \u20ac \u00f1']);
  assert.deepStrictEqual(Array.from(X.siEncode(dh.text, 'cp1252')), Array.from(hi), 'los bytes altos vuelven iguales');
  assert.strictEqual(X.siEncode('\u4e2d', 'cp1252')[0], 63, 'lo que no entra en cp1252 queda como ?');
  const be = X.siEncode(txt, 'utf-16be'); assert.deepStrictEqual([be[0], be[1], be[2], be[3]], [0xFE, 0xFF, 0, 0x5B]); assert.deepStrictEqual([X.siDecode(be).enc, X.siDecode(be).text], ['utf-16be', txt]);
  const noBom16 = u16.subarray(2); assert.strictEqual(X.siDecode(noBom16).text, txt, 'UTF-16 sin BOM');
  const dir = new FDir('S', { 'sider.ini': cp }); assert.strictEqual(await X.siReadIni(dir), txt); assert.strictEqual(X.SI.enc, 'cp1252');
});
