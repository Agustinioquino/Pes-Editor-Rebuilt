// PES Editor Rebuilt para Windows: abre el editor de la web en una ventana propia y le da acceso de verdad a las carpetas
// que elegís (por ejemplo la carpeta Sider dentro de Archivos de programa, que Chrome y Edge no dejan tocar).
// El editor se carga siempre desde GitHub Pages, así cada versión nueva llega sola, sin reinstalar la app.
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path'), fs = require('fs'), fsp = fs.promises;

const SITE = process.env.PES_EDITOR_URL || 'https://agustinioquino.github.io/Pes-Editor-Rebuilt/';
const ORIGIN = new URL(SITE).origin;

// Solo se puede leer y escribir dentro de las carpetas que la persona eligió con el selector de Windows.
// Se recuerdan entre sesiones para que el editor vuelva a abrir la carpeta Sider y la de Documentos solo.
let roots = [];
const rootsFile = () => path.join(app.getPath('userData'), 'carpetas.json');
function loadRoots() { try { roots = JSON.parse(fs.readFileSync(rootsFile(), 'utf8')).filter(r => typeof r === 'string'); } catch { roots = []; } }
function saveRoots() { try { fs.writeFileSync(rootsFile(), JSON.stringify(roots, null, 1)); } catch { } }
const sameP = (a, b) => (process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b);
const inside = p => roots.some(r => { const rel = path.relative(r, p); return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel)); });
function allowed(p) {
  if (typeof p !== 'string' || !path.isAbsolute(p)) throw Object.assign(new Error('Ruta inválida'), { code: 'NOTALLOWED' });
  const r = path.resolve(p); if (!inside(r)) throw Object.assign(new Error('Esa carpeta no está conectada'), { code: 'NOTALLOWED' });
  return r;
}

// cada pedido se responde con { ok, v } o { ok: false, code, msg } (los errores de Electron pierden el código)
function handle(name, fn) {
  ipcMain.handle('pes:' + name, async (e, ...a) => {
    try {
      const u = e.senderFrame && e.senderFrame.url;
      if (!u || !/^https?:/.test(u) || new URL(u).origin !== ORIGIN) throw Object.assign(new Error('Página no permitida'), { code: 'NOTALLOWED' });
      return { ok: true, v: await fn(e, ...a) };
    } catch (er) { return { ok: false, code: er.code || 'ERR', msg: er.message }; }
  });
}
handle('pick', async (e, o = {}) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  let def = o.defaultPath && typeof o.defaultPath === 'string' && fs.existsSync(o.defaultPath) ? o.defaultPath : undefined;
  if (!def && o.startIn && ['documents', 'desktop', 'downloads', 'music', 'pictures', 'videos'].includes(o.startIn)) def = app.getPath(o.startIn);
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'], defaultPath: def });
  if (r.canceled || !r.filePaths[0]) return null;
  const p = path.resolve(r.filePaths[0]);
  if (!roots.some(x => sameP(x, p))) { roots.push(p); saveRoots(); }
  return p;
});
handle('known', (e, p) => { try { allowed(p); return fs.existsSync(p); } catch { return false; } });
handle('list', async (e, p) => {
  const dir = allowed(p), out = [];
  for (const d of await fsp.readdir(dir, { withFileTypes: true })) {
    let k = d.isDirectory() ? 'directory' : d.isFile() ? 'file' : null;
    if (!k && d.isSymbolicLink()) { try { k = (await fsp.stat(path.join(dir, d.name))).isDirectory() ? 'directory' : 'file'; } catch { } }
    if (k) out.push([d.name, k]);
  }
  return out;
});
handle('stat', async (e, p) => {
  try { const s = await fsp.stat(allowed(p)); return { kind: s.isDirectory() ? 'directory' : 'file', size: s.size, mtime: s.mtimeMs }; }
  catch (er) { if (er.code === 'ENOENT' || er.code === 'ENOTDIR') return null; throw er; }
});
handle('read', async (e, p) => { const f = allowed(p), [data, s] = await Promise.all([fsp.readFile(f), fsp.stat(f)]); return { data, mtime: s.mtimeMs }; });
// se escribe en un archivo aparte y después se reemplaza, así un corte a mitad de camino no deja el archivo roto
handle('write', async (e, p, data) => {
  const f = allowed(p), buf = Buffer.from(data instanceof Uint8Array ? data : new Uint8Array(data || 0)), tmp = f + '.pes-editor-tmp';
  try { await fsp.writeFile(tmp, buf); await fsp.rename(tmp, f); }
  catch (er) { try { await fsp.unlink(tmp); } catch { } if (er.code === 'EPERM' || er.code === 'EACCES' || er.code === 'EBUSY') await fsp.writeFile(f, buf); else throw er; }
});
handle('mkdir', async (e, p) => { try { await fsp.mkdir(allowed(p)); } catch (er) { if (er.code !== 'EEXIST') throw er; } });
handle('remove', async (e, p, recursive) => {
  const f = allowed(p); if (roots.some(r => sameP(r, f))) throw Object.assign(new Error('No se puede borrar una carpeta conectada'), { code: 'NOTALLOWED' });
  const s = await fsp.lstat(f);
  if (s.isDirectory()) await (recursive ? fsp.rm(f, { recursive: true }) : fsp.rmdir(f)); else await fsp.unlink(f);
});
handle('info', () => ({ app: app.getVersion(), electron: process.versions.electron, platform: process.platform }));

function createWindow() {
  const win = new BrowserWindow({
    width: 1360, height: 860, minWidth: 900, minHeight: 600, backgroundColor: '#0b0d10', title: 'PES Editor Rebuilt',
    icon: path.join(__dirname, 'icon.png'), autoHideMenuBar: true, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false }
  });
  win.once('ready-to-show', () => win.show());
  // los enlaces de afuera (ESPN, Wikipedia, GitHub…) se abren en el navegador de siempre
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (ev, url) => { try { if (new URL(url).origin !== ORIGIN) { ev.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } } catch { ev.preventDefault(); } });
  // la primera vez hace falta internet; después el editor queda guardado y abre sin conexión
  win.webContents.on('did-fail-load', (ev, code, desc, url, isMain) => { if (isMain && code !== -3) win.loadFile(path.join(__dirname, 'offline.html'), { query: { site: SITE } }); });
  win.loadURL(SITE);
  return win;
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
  app.whenReady().then(() => { loadRoots(); createWindow(); });
  app.on('window-all-closed', () => app.quit());
}
