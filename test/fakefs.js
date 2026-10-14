// Carpeta y archivos en memoria con la misma forma que la File System Access API del navegador
// (getDirectoryHandle, getFileHandle, entries, removeEntry, createWritable), para probar sin disco.
class FakeFile {
  constructor(name) { this.kind = 'file'; this.name = name; this.data = new Uint8Array(0); }
  async getFile() { const d = this.data; return { arrayBuffer: async () => d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength), text: async () => Buffer.from(d).toString('utf8'), size: d.length }; }
  async createWritable() { const f = this; return { write: async x => { f.data = typeof x === 'string' ? new TextEncoder().encode(x) : x instanceof ArrayBuffer ? new Uint8Array(x) : new Uint8Array(x.buffer ? x.buffer.slice(x.byteOffset, x.byteOffset + x.byteLength) : x); }, close: async () => { } }; }
}
class FakeDir {
  constructor(name = '') { this.kind = 'directory'; this.name = name; this.kids = new Map(); }
  async getDirectoryHandle(n, o) { const k = this.kids.get(n); if (k && k.kind === 'directory') return k; if (o && o.create) { const d = new FakeDir(n); this.kids.set(n, d); return d; } throw Object.assign(new Error(n), { name: 'NotFoundError' }); }
  async getFileHandle(n, o) { const k = this.kids.get(n); if (k && k.kind === 'file') return k; if (!(o && o.create)) throw Object.assign(new Error(n), { name: 'NotFoundError' }); const f = new FakeFile(n); this.kids.set(n, f); return f; }
  async removeEntry(n) { if (!this.kids.has(n)) throw Object.assign(new Error(n), { name: 'NotFoundError' }); this.kids.delete(n); }
  async *entries() { for (const e of this.kids) yield e; }
  async queryPermission() { return 'granted'; }
  async requestPermission() { return 'granted'; }
  // atajos para las pruebas
  has(path) { let d = this; for (const p of path.split('/')) { d = d.kids.get(p); if (!d) return false; } return true; }
  text(path) { let d = this; for (const p of path.split('/')) d = d.kids.get(p); return Buffer.from(d.data).toString('utf8'); }
  bytes(path) { let d = this; for (const p of path.split('/')) d = d.kids.get(p); return d.data; }
  async put(path, data) { const parts = path.split('/'), fn = parts.pop(); let d = this; for (const p of parts) d = await d.getDirectoryHandle(p, { create: true }); const w = await (await d.getFileHandle(fn, { create: true })).createWritable(); await w.write(data); await w.close(); }
}
module.exports = { FakeDir, FakeFile };
