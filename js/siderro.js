// ===================== Sider en "Archivos de programa" =====================
// Chrome y Edge no dejan elegir con permiso de escritura una carpeta que esté dentro de C:\Program Files o
// C:\Program Files (x86) ("contiene archivos del sistema"). Ahí está Steam por defecto, y muchos Parches ponen su
// carpeta Sider dentro del juego. Plan B: el selector de carpetas "para subir archivos", que sí la deja leer.
// Así se ven kits, caras, escudos y nombres; para guardar en el Parche hay que mover el juego (o la carpeta Sider).
var SIDER_RO = null;
const RO_MSG = 'Abriste la carpeta Sider solo para ver (está dentro de Archivos de programa). Para guardar en el Parche, mové el juego a otra biblioteca de Steam.';
const roErr = () => Object.assign(new Error(RO_MSG), { name: 'NotAllowedError' });
class RoFile { constructor(f) { this.kind = 'file'; this.name = f.name; this.f = f; } async getFile() { return this.f; } async createWritable() { throw roErr(); } async queryPermission(o) { return o && o.mode === 'readwrite' ? 'denied' : 'granted'; } async requestPermission(o) { if (o && o.mode === 'readwrite') throw roErr(); return 'granted'; } }
class RoDir {
  constructor(name) { this.kind = 'directory'; this.name = name; this.d = new Map(); this.f = new Map(); this.readOnly = true; }
  async getDirectoryHandle(n, o) { const x = this.d.get(n.toLowerCase()); if (x) return x; if (o && o.create) throw roErr(); throw Object.assign(new Error(n + ' no existe'), { name: 'NotFoundError' }); }
  async getFileHandle(n, o) { const x = this.f.get(n.toLowerCase()); if (x && !(o && o.create)) return x; if (o && o.create) throw roErr(); throw Object.assign(new Error(n + ' no existe'), { name: 'NotFoundError' }); }
  async removeEntry() { throw roErr(); }
  async *entries() { for (const x of this.d.values()) yield [x.name, x]; for (const x of this.f.values()) yield [x.name, x]; }
  async *values() { for await (const [, x] of this.entries()) yield x; }
  async *keys() { for await (const [k] of this.entries()) yield k; }
  [Symbol.asyncIterator]() { return this.entries(); }
  async queryPermission(o) { return o && o.mode === 'readwrite' ? 'denied' : 'granted'; }
  async requestPermission(o) { if (o && o.mode === 'readwrite') throw roErr(); return 'granted'; }
}
function roTree(files) {
  const root = new RoDir((files[0].webkitRelativePath || '').split('/')[0] || 'Sider');
  for (const f of files) {
    const parts = (f.webkitRelativePath || f.name).split('/').slice(1); let d = root;
    for (const p of parts.slice(0, -1)) { const k = p.toLowerCase(); if (!d.d.has(k)) d.d.set(k, new RoDir(p)); d = d.d.get(k); }
    d.f.set(f.name.toLowerCase(), new RoFile(f));
  }
  return root;
}
function siderPickRO() {
  return new Promise(res => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.webkitdirectory = true; inp.multiple = true;
    inp.onchange = () => { const fs = [...inp.files]; res(fs.length ? roTree(fs) : null); };
    inp.addEventListener('cancel', () => res(null)); inp.click();
  });
}
async function connectSiderRO() {
  toast('Elegí la carpeta Sider. El navegador va a preguntar si querés "subir" los archivos: no se sube nada, solo se leen acá.', 9000);
  const dir = await siderPickRO(); if (!dir) return false;
  toast('Leyendo la carpeta Sider…', 60000);
  SIDER_RO = dir; return connectKits(dir);
}
function siderBlockedHelp() {
  ksModal('¿Chrome no te dejó abrir la carpeta Sider?', `<p>Si te apareció <b>"Esta carpeta no se puede abrir… contiene archivos del sistema"</b>, es porque tu carpeta Sider está dentro de <code>C:\\Program Files (x86)</code> (por ejemplo en <code>Steam\\steamapps\\common\\eFootball PES 2021</code>). Chrome y Edge no dejan que ninguna página escriba ahí.</p>
    <p><b>Opción 1, para ver ya:</b> abrila solo para ver. Vas a tener kits, caras, escudos y nombres, pero el editor no puede guardar en el Parche (kits, escudos, módulo).</p>
    <p><b>Opción 2, para poder guardar:</b> mové el juego a otra biblioteca de Steam fuera de Archivos de programa (por ejemplo <code>D:\\SteamLibrary</code>): en Steam, clic derecho en PES 2021 › Propiedades › Archivos instalados › Mover carpeta de instalación. Después conectá la carpeta Sider desde su lugar nuevo.</p>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" type="button" data-x>Cerrar</button><button class="btn" type="button" id="roRetry">Elegir otra carpeta</button><button class="btn primary" type="button" id="roOpen">📂 Abrir solo para ver</button></div>`,
    (box, close) => { box.querySelector('#roOpen').onclick = () => { close(); connectSiderRO(); }; box.querySelector('#roRetry').onclick = () => { close(); connectKits(); }; });
}
