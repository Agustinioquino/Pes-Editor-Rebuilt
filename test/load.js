// Carga los scripts del navegador (js/*.js) en Node, sin tocarlos, y devuelve el objeto global que definen.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load(file, name, globals = {}) {
  const code = fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8');
  const ctx = vm.createContext({ TextDecoder, TextEncoder, ...globals });
  return vm.runInContext(`${code}\n;${name}`, ctx, { filename: file });
}

// Bytes pseudoaleatorios repetibles (mismo generador que la referencia en Python usada para los hashes).
function pattern(n, seed) {
  const out = new Uint8Array(n); let x = seed;
  for (let i = 0; i < n; i++) { x = (Math.imul(x, 1103515245) + 12345) & 0x7fffffff; out[i] = (x >>> 16) & 255; }
  return out;
}

module.exports = { load, pattern };
