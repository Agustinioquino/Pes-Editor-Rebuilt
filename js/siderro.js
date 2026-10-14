// ===================== Sider en "Archivos de programa" =====================
// Chrome y Edge no dejan elegir con permiso de escritura una carpeta que esté dentro de C:\Program Files o
// C:\Program Files (x86) ("contiene archivos del sistema"). Ahí está Steam por defecto, y muchos ponen su
// carpeta Sider dentro del juego. Plan B: el selector de carpetas "para subir archivos", que sí la deja leer.
// Así se ven kits, caras, escudos y nombres. Para guardar en el juego alcanza con mover la carpeta Sider fuera de
// Archivos de programa: Sider funciona desde cualquier carpeta (se engancha al juego por el nombre del .exe).
var SIDER_RO = null;
const RO_MSG = 'Abriste la carpeta Sider solo para ver (está dentro de Archivos de programa). Para guardar en el juego, mové la carpeta Sider a otro lugar, por ejemplo C:\\PES2021.';
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
// los pasos para sacar la carpeta Sider de Archivos de programa (en esta ventana y en la pantalla de carga)
function siderMoveSteps(name, btn) {
  return `<ol class="note siderhow"><li>Cerrá el juego y Sider.</li><li>En el Explorador de archivos, cortá ${name ? `la carpeta <b>${name}</b>` : 'tu carpeta Sider'} (clic derecho › Cortar).</li><li>Pegala en una carpeta tuya del mismo disco, fuera de Archivos de programa, por ejemplo <b>C:\\PES2021</b>. Si Windows pide permiso de administrador, aceptá. Tarda un segundo aunque pese muchos GB: dentro del mismo disco Windows no copia los archivos, solo cambia la carpeta donde están.</li><li>Desde ahora abrí <b>sider.exe</b> desde ese lugar nuevo (podés crear un acceso directo en el escritorio).</li><li>Acá tocá <b>${btn}</b> y elegí la carpeta en su lugar nuevo. Si tu sider.ini tiene rutas completas a la carpeta vieja, el editor las arregla solo (con copia de seguridad).</li></ol>`;
}
const siderRoName = () => (SIDER_RO && SIDER_RO.name ? esc(SIDER_RO.name) : '');
// la app para Windows (desktop/) sí puede escribir ahí: la release de cada versión trae el instalador
const APP_DL_URL = () => `https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v${APP_VER}-alpha/PES-Editor-Rebuilt-Setup.exe`;
function siderBlockedHelp() {
  const name = siderRoName();
  ksModal('¿Chrome no te dejó abrir la carpeta Sider?', `<p>Si te apareció <b>"Esta carpeta no se puede abrir… contiene archivos del sistema"</b>, es porque tu carpeta Sider está dentro de <code>C:\\Program Files (x86)</code> (por ejemplo en <code>Steam\\steamapps\\common\\eFootball PES 2021</code>). Chrome y Edge no dejan que ninguna página escriba ahí, y no hay forma de saltearlo desde el editor.</p>
    <p><b>La solución: PES Editor Rebuilt para Windows.</b> Es este mismo editor, como programa: conecta tu carpeta Sider donde está y guarda en el juego sin mover nada. Se actualiza solo, igual que la página.</p>
    <p><a class="btn primary" href="${APP_DL_URL()}" target="_blank" rel="noopener">⬇️ Descargar para Windows (.exe)</a></p>
    <details><summary><b>Otra opción: sacar la carpeta Sider de Archivos de programa</b></summary><p>Sider funciona desde cualquier carpeta, no hace falta que esté junto al juego, y el juego queda donde está.</p>
    ${siderMoveSteps(name, 'Elegir otra carpeta')}</details>
    <p><b>Si querés verla ya:</b> abrila solo para ver. Vas a tener kits, caras, escudos y nombres, pero el editor no puede guardar en el juego (kits, escudos, módulo).</p>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" type="button" data-x>Cerrar</button><button class="btn" type="button" id="roOpen">📂 Abrir solo para ver</button><button class="btn primary" type="button" id="roRetry">Elegir otra carpeta</button></div>`,
    (box, close) => { box.querySelector('#roOpen').onclick = () => { close(); connectSiderRO(); }; box.querySelector('#roRetry').onclick = () => { close(); connectKits(); }; });
}
// Después de mover la carpeta Sider: las líneas cpk.root con la ruta completa a la carpeta vieja (C:\Program Files…\<Sider>\livecpk\X)
// dejarían de andar. Si en la carpeta nueva está ese mismo livecpk\X, se pasa a ruta relativa (.\livecpk\X), que Sider toma
// desde su propia carpeta. Copia de seguridad en sider.ini.bak-pes-editor la primera vez.
async function siderFixPaths(sider) {
  const f = await sdbFile(sider, 'sider.ini'); if (!f) return 0;
  let live = null; try { live = await sider.getDirectoryHandle('livecpk'); } catch { return 0; }
  const orig = typeof siReadIni === 'function' ? await siReadIni(sider) : await f.text(), nl = orig.includes('\r\n') ? '\r\n' : '\n', lines = orig.split(/\r?\n/), me = sider.name.toLowerCase();
  let n = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*cpk\.root\s*=\s*)"?([A-Za-z]:[\\/][^"\r\n]*?|\\\\[^"\r\n]*?)"?\s*(;.*)?$/i); if (!m) continue;
    const k = m[2].match(/^(.*?)[\\/]livecpk[\\/]([^\\/]+)([\\/].*)?$/i); if (!k) continue;
    const prev = k[1].split(/[\\/]/).filter(Boolean).pop() || '';
    if (prev.toLowerCase() !== me && !/program files/i.test(k[1])) continue; // es de otra carpeta, no de esta Sider movida
    try { await live.getDirectoryHandle(k[2]); } catch { continue; }
    lines[i] = `${m[1]}".\\livecpk\\${k[2]}${(k[3] || '').replace(/[\\/]+$/, '').replace(/\//g, '\\')}"${m[3] ? ' ' + m[3] : ''}`; n++;
  }
  if (!n) return 0;
  if (!await sdbFile(sider, 'sider.ini.bak-pes-editor')) await sdbWrite(sider, 'sider.ini.bak-pes-editor', orig);
  await sdbWrite(sider, 'sider.ini', lines.join(nl)); if (typeof siReset === 'function') siReset(); return n;
}
