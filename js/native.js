// ===================== App de escritorio (PES Editor para Windows) =====================
// La app (carpeta desktop/) abre esta misma página y agrega window.pesNative, que lee y escribe carpetas con el
// sistema y no con el navegador. Así se puede conectar la carpeta Sider aunque esté dentro de Archivos de programa.
// Acá se arman "carpetas" con los mismos métodos que las del navegador (getDirectoryHandle, getFileHandle,
// createWritable…), así el resto del editor no cambia. Solo se usa dentro de la app; en Chrome o Edge no hace nada.
const PN = window.pesNative || null;
if (PN) {
  const ERR_MSG = {
    EPERM: 'Windows no deja escribir en esa carpeta. Cerrá la app y abrila como administrador (clic derecho › Ejecutar como administrador).',
    EACCES: 'Windows no deja escribir en esa carpeta. Cerrá la app y abrila como administrador (clic derecho › Ejecutar como administrador).',
    EBUSY: 'El archivo está en uso: cerrá el juego y probá de nuevo.',
    NOTALLOWED: 'Esa carpeta no está conectada: elegila de nuevo.'
  };
  const nErr = r => {
    const c = r.code, name = c === 'ENOENT' || c === 'ENOTDIR' ? 'NotFoundError' : ERR_MSG[c] && c !== 'EBUSY' ? 'NotAllowedError' : c === 'EBUSY' ? 'NoModificationAllowedError' : c === 'EEXIST' ? 'InvalidModificationError' : 'Error';
    return Object.assign(new Error(ERR_MSG[c] || r.msg || c), { name });
  };
  const nCall = async (fn, ...a) => { const r = await PN[fn](...a); if (!r || !r.ok) throw nErr(r || {}); return r.v; };
  const join = (p, n) => p.replace(/[\\/]+$/, '') + PN.sep + n;
  const base = p => p.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || p;
  const checkName = n => { if (!n || /[\\/]/.test(n) || n === '.' || n === '..') throw Object.assign(new TypeError('Nombre inválido: ' + n), { name: 'TypeError' }); };
  const typeErr = n => Object.assign(new Error(n + ' no es del tipo pedido'), { name: 'TypeMismatchError' });
  const notFound = n => Object.assign(new Error(n + ' no existe'), { name: 'NotFoundError' });

  class NativeFile {
    constructor(path, name) { this.kind = 'file'; this.path = path; this.name = name || base(path); this.native = true; }
    async getFile() { const r = await nCall('read', this.path); return new File([r.data], this.name, { lastModified: r.mtime }); }
    // solo una parte del archivo (para los .cpk de varios GB); las versiones viejas de la app no lo tienen
    async info() { return nCall('stat', this.path); }
    get readRange() { return PN.readRange ? async (o, n) => new Uint8Array(await nCall('readRange', this.path, o, n)) : undefined; }
    async createWritable() {
      const parts = [], path = this.path;
      return {
        async write(d) { if (d && typeof d === 'object' && d.type === 'write') d = d.data; if (d != null) parts.push(d); },
        async close() { await nCall('write', path, new Uint8Array(await new Blob(parts).arrayBuffer())); },
        async abort() { parts.length = 0; }
      };
    }
    async queryPermission() { return 'granted'; }
    async requestPermission() { return 'granted'; }
    async isSameEntry(o) { return !!o && o.path === this.path; }
  }
  class NativeDir {
    constructor(path, name) { this.kind = 'directory'; this.path = path; this.name = name || base(path); this.native = true; }
    async getDirectoryHandle(n, o) {
      checkName(n); const p = join(this.path, n), st = await nCall('stat', p);
      if (st && st.kind !== 'directory') throw typeErr(n);
      if (!st) { if (!(o && o.create)) throw notFound(n); await nCall('mkdir', p); }
      return new NativeDir(p, st && st.name || n);
    }
    async getFileHandle(n, o) {
      checkName(n); const p = join(this.path, n), st = await nCall('stat', p);
      if (st && st.kind !== 'file') throw typeErr(n);
      if (!st) { if (!(o && o.create)) throw notFound(n); await nCall('write', p, new Uint8Array(0)); }
      return new NativeFile(p, st && st.name || n);
    }
    async removeEntry(n, o) { checkName(n); await nCall('remove', join(this.path, n), !!(o && o.recursive)); }
    async *entries() { for (const [n, k] of await nCall('list', this.path)) yield [n, k === 'directory' ? new NativeDir(join(this.path, n), n) : new NativeFile(join(this.path, n), n)]; }
    async *values() { for await (const [, h] of this.entries()) yield h; }
    async *keys() { for await (const [n] of this.entries()) yield n; }
    [Symbol.asyncIterator]() { return this.entries(); }
    async queryPermission() { return 'granted'; }
    async requestPermission() { return 'granted'; }
    async isSameEntry(o) { return !!o && o.path === this.path; }
    async resolve(h) { if (!h || !h.path) return null; const a = this.path.replace(/[\\/]+$/, '') + PN.sep; if (!h.path.toLowerCase().startsWith(a.toLowerCase())) return h.path === this.path ? [] : null; return h.path.slice(a.length).split(/[\\/]/).filter(Boolean); }
  }
  window.NativeDir = NativeDir; window.NativeFile = NativeFile;

  // el selector de carpetas del navegador se reemplaza por el de Windows (recuerda la última carpeta de cada botón)
  window.showDirectoryPicker = async (o = {}) => {
    const key = 'edit21-native-last-' + (o.id || 'x'); let last = null; try { last = localStorage.getItem(key); } catch { }
    const p = await nCall('pick', { startIn: typeof o.startIn === 'string' ? o.startIn : null, defaultPath: last });
    if (!p) throw new DOMException('Elegir carpeta cancelado', 'AbortError');
    try { localStorage.setItem(key, p); } catch { }
    return new NativeDir(p);
  };
  // las carpetas de la app no se pueden guardar tal cual en IndexedDB: se guarda la ruta y al leerla se arma de nuevo
  const idbGet0 = idbGet, idbSet0 = idbSet;
  idbGet = async k => {
    const v = await idbGet0(k);
    if (v && typeof v === 'object' && typeof v.pesNative === 'string') { try { return (await nCall('known', v.pesNative)) ? new NativeDir(v.pesNative) : null; } catch { return null; } }
    return v;
  };
  idbSet = (k, v) => idbSet0(k, v instanceof NativeDir ? { pesNative: v.path } : v);
  document.documentElement.classList.add('native-app');
}
