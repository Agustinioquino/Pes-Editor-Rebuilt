// Módulo edit21_db.lua: instalación en modules\, la línea de sider.ini y la reparación cuando el archivo falta.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { FakeDir } = require('./fakefs');

const read = f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
function make() {
  const toasts = [];
  const ctx = vm.createContext({ TextDecoder, TextEncoder, console, setTimeout,
    fsFile: async (d, n, c) => d.getFileHandle(n, c ? { create: true } : undefined),
    subDir: async (dir, p) => { for (const seg of p.split(/[\\/]/).filter(Boolean)) dir = await dir.getDirectoryHandle(seg); return dir; },
    toast: m => toasts.push(m), S: { tab: 'x' }, render: () => {} });
  vm.runInContext(read('luadata.js').replace('const EDIT21_LUA', 'var EDIT21_LUA'), ctx);
  const X = vm.runInContext(read('siderdb.js') + '\n;({ SDB, sdbInstall, sdbRepair, sdbModState, LUA_VERSION, EDIT21_LUA })', ctx);
  X.SDB.verifyMs = 0; X.toasts = toasts;
  return X;
}
const INI = '[sider]\r\nlua.enabled = 1\r\nlua.module = "kserv.lua"\r\n';
async function sider(ini, files = {}) { const d = new FakeDir('Sider'); await d.put('sider.ini', ini); for (const [p, t] of Object.entries(files)) await d.put(p, t); return d; }

test('instala el archivo y agrega la línea después del último lua.module', async () => {
  const X = make(), d = await sider(INI);
  const r = await X.sdbInstall(d);
  assert.strictEqual(r.module, 'nuevo'); assert.strictEqual(r.ini, 'agregado');
  assert.strictEqual(d.text('modules/edit21_db.lua'), X.EDIT21_LUA);
  assert.strictEqual(d.text('sider.ini'), '[sider]\r\nlua.enabled = 1\r\nlua.module = "kserv.lua"\r\nlua.module = "edit21_db.lua"\r\n');
  assert.strictEqual(d.text('sider.ini.bak-pes-editor'), INI);
  assert.ok(d.has('content/edit21-db/LEEME.txt'));
});

test('con la línea en sider.ini pero sin el archivo: lo vuelve a poner sin tocar sider.ini', async () => {
  const ini = INI + 'lua.module = "edit21_db.lua"\r\n', X = make(), d = await sider(ini);
  const r = await X.sdbInstall(d);
  assert.strictEqual(r.module, 'nuevo'); assert.strictEqual(r.ini, 'ok');
  assert.strictEqual(d.text('modules/edit21_db.lua'), X.EDIT21_LUA);
  assert.strictEqual(d.text('sider.ini'), ini);
});

test('la línea escrita de otra forma no se duplica, y apagada se respeta', async () => {
  for (const l of ['lua.module = "edit21_db.lua" ; PES Editor', 'lua.module = edit21_db', 'lua.module = ".\\modules\\edit21_db.lua"', '; lua.module = "edit21_db.lua"', '#lua.module = "edit21_db.lua"']) {
    const ini = INI + l + '\r\n', X = make(), d = await sider(ini);
    const r = await X.sdbInstall(d);
    assert.strictEqual(d.text('sider.ini'), ini, l);
    assert.strictEqual(r.ini, /^[;#]/.test(l) ? 'apagado' : 'ok', l);
  }
});

test('si el archivo desaparece enseguida (antivirus), avisa y no agrega la línea', async () => {
  const X = make(), d = await sider(INI);
  const mods = await d.getDirectoryHandle('modules', { create: true }), get = mods.getFileHandle.bind(mods);
  let writes = 0;
  mods.getFileHandle = async (n, o) => { const h = await get(n, o); if (n === 'edit21_db.lua' && o && o.create) { writes++; const w0 = h.createWritable.bind(h); h.createWritable = async () => { const w = await w0(); return { write: w.write, close: async () => { await w.close(); mods.kids.delete(n); } }; }; } return h; };
  await assert.rejects(X.sdbInstall(d), e => e.name === 'GoneError' && /antivirus/.test(e.message));
  assert.strictEqual(writes, 1);
  assert.strictEqual(d.text('sider.ini'), INI);
});

test('al arrancar: repara solo si sider.ini carga el módulo y el archivo falta o es viejo', async () => {
  let X = make(), d = await sider(INI + 'lua.module = "edit21_db.lua"\r\n');
  assert.ok(await X.sdbRepair(d));
  assert.strictEqual(d.text('modules/edit21_db.lua'), X.EDIT21_LUA);
  assert.match(X.toasts[0], /Faltaba el archivo edit21_db\.lua/);
  // ya está: no hace nada
  assert.strictEqual(await X.sdbRepair(d), null);
  // versión vieja
  X = make(); d = await sider(INI + 'lua.module = "edit21_db.lua"\r\n', { 'modules/edit21_db.lua': '-- edit21_db.lua v1.2\r\n' });
  assert.ok(await X.sdbRepair(d));
  assert.strictEqual(d.text('modules/edit21_db.lua.anterior'), '-- edit21_db.lua v1.2\r\n');
  // sin la línea: no instala nada al arrancar (eso se hace al conectar la carpeta)
  X = make(); d = await sider(INI);
  assert.strictEqual(await X.sdbRepair(d), null);
  assert.ok(!d.has('modules/edit21_db.lua'));
  // sin permiso de escritura: no pregunta nada
  X = make(); d = await sider(INI + 'lua.module = "edit21_db.lua"\r\n'); d.queryPermission = async o => (o && o.mode === 'readwrite' ? 'prompt' : 'granted');
  assert.strictEqual(await X.sdbRepair(d), null);
});
