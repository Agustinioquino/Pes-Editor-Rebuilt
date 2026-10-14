// fsFile (js/extras.js): cuando el navegador rechaza el nombre ("Name is not allowed", como hace Chrome con sider.ini, sider.exe
// y sider.dll), el archivo se encuentra igual recorriendo la carpeta.
const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'extras.js'), 'utf8');
const m = src.match(/async function fsFile\([\s\S]*?\n}\n/); assert.ok(m, 'fsFile está en extras.js');
const { fsFile } = vm.runInContext(m[0] + ';({ fsFile })', vm.createContext({}));
const BAD = /\.(ini|exe|dll|cfg)$/i;
class Dir { // como Chrome: los nombres "peligrosos" no se pueden pedir, pero aparecen en el listado
  constructor(files) { this.files = files.map(n => ({ kind: 'file', name: n })); }
  async getFileHandle(n, o) {
    if (BAD.test(n)) throw Object.assign(new TypeError("Failed to execute 'getFileHandle' on 'FileSystemDirectoryHandle': Name is not allowed."), { name: 'TypeError' });
    const f = this.files.find(x => x.name.toLowerCase() === n.toLowerCase()); if (f) return f;
    if (o && o.create) { const c = { kind: 'file', name: n }; this.files.push(c); return c; }
    throw Object.assign(new Error(n), { name: 'NotFoundError' });
  }
  async *entries() { for (const f of this.files) yield [f.name, f]; }
}
test('sider.ini se encuentra aunque Chrome rechace el nombre (y sin distinguir mayúsculas)', async () => {
  const d = new Dir(['Sider.ini', 'sider.exe', 'modules', 'README.txt']);
  assert.strictEqual((await fsFile(d, 'sider.ini')).name, 'Sider.ini');
  assert.strictEqual((await fsFile(d, 'sider.exe')).name, 'sider.exe');
  assert.strictEqual((await fsFile(d, 'sider.ini', true)).name, 'Sider.ini'); // para escribir: la misma entrada
});
test('un archivo que no está sigue dando NotFoundError, y crear uno rechazado da NotAllowedError', async () => {
  const d = new Dir(['sider.exe']);
  await assert.rejects(fsFile(d, 'sider.ini'), e => e.name === 'NotFoundError');
  await assert.rejects(fsFile(d, 'sider.ini', true), e => e.name === 'NotAllowedError' && /Bloc de notas/.test(e.message));
  await assert.rejects(fsFile(d, 'map.txt'), e => e.name === 'NotFoundError');
  assert.strictEqual((await fsFile(d, 'LEEME.txt', true)).name, 'LEEME.txt'); // los nombres normales se crean como siempre
});
test('otros errores del navegador no se tocan', async () => {
  const d = { async getFileHandle() { throw Object.assign(new Error('x'), { name: 'NotAllowedError' }); }, async *entries() { } };
  await assert.rejects(fsFile(d, 'sider.ini'), e => e.name === 'NotAllowedError' && e.message === 'x');
});
