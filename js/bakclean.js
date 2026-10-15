// ===================== Copias .bak-edit21: se borran al volver a abrir el editor =====================
// Al guardar escudos, minifaces o texturas de kits, lo que había queda al lado como <archivo>.bak-edit21: sirve para
// deshacer mientras el editor está abierto. La próxima vez que se abre (con la carpeta Sider conectada) se borran.
// Las copias de esta sesión no se tocan: se reconocen por la fecha (son más nuevas que la apertura del editor).
const BAK_T0 = Date.now(), BAK_LS = 'edit21-bak-dirs-v1', BAK_SCAN = 'edit21-bak-scan-v1', BAK_RE = /\.bak-edit21$/i;
let BAK_RUN = null;
function bakDirs() { try { return JSON.parse(localStorage.getItem(BAK_LS)) || []; } catch { return []; } }
function bakDirsSet(l) { try { localStorage.setItem(BAK_LS, JSON.stringify(l)); } catch { } }
// anota la carpeta (dentro de Sider) donde quedó una copia, así la próxima vez se va directo ahí
async function bakNote(dir) {
  try { const s = await idbGet('sider'), p = s && s.resolve && await s.resolve(dir); if (!p || !p.length) return; const k = p.join('/'), l = bakDirs(); if (!l.includes(k)) { l.push(k); bakDirsSet(l); } } catch { }
}
// borra las copias viejas de una carpeta; devuelve cuántas borró y si quedó alguna (de esta sesión)
async function bakSweep(dir) {
  const old = []; let left = 0;
  for await (const [name, h] of dir.entries()) if (h.kind === 'file' && BAK_RE.test(name)) { try { if ((await h.getFile()).lastModified < BAK_T0 - 5000) old.push(name); else left++; } catch { left++; } }
  let n = 0; for (const name of old) { try { await dir.removeEntry(name); n++; } catch { left++; } }
  return { n, left };
}
async function bakWalk(dir, depth, fn) { await fn(dir); if (depth <= 0) return; const subs = []; for await (const [, h] of dir.entries()) if (h.kind === 'directory') subs.push(h); for (const d of subs) await bakWalk(d, depth - 1, fn); }
function bakClean(sider) {
  if (!sider || sider.readOnly || BAK_RUN) return BAK_RUN;
  BAK_RUN = (async () => {
    let n = 0; const done = new Set();
    for (const k of bakDirs()) {
      try { let d = sider; for (const seg of k.split('/')) d = await d.getDirectoryHandle(seg); const r = await bakSweep(d); n += r.n; if (!r.left) done.add(k); }
      catch (e) { if (e && e.name === 'NotFoundError') done.add(k); }
    }
    bakDirsSet(bakDirs().filter(k => !done.has(k))); // se relee: en el medio pudo anotarse una carpeta nueva
    // una sola vez: las copias que quedaron de antes de que existiera la lista
    let scanned = false; try { scanned = !!localStorage.getItem(BAK_SCAN); } catch { }
    if (!scanned) {
      const sweep = async d => { try { n += (await bakSweep(d)).n; } catch { } };
      try { const lc = await sider.getDirectoryHandle('livecpk'); for await (const [, root] of lc.entries()) { if (root.kind !== 'directory') continue; for (const sub of ['flag', 'player']) { try { let d = root; for (const seg of ['common', 'render', 'symbol', sub]) d = await d.getDirectoryHandle(seg); await sweep(d); } catch { } } } } catch { }
      try { const lay = typeof siderLayout === 'function' ? await siderLayout(sider) : null; if (lay && lay.kit) await bakWalk(lay.kit, 4, sweep); } catch { }
      try { localStorage.setItem(BAK_SCAN, '1'); } catch { }
    }
    if (n) toast(`Borré ${n} ${n === 1 ? 'copia .bak-edit21' : 'copias .bak-edit21'} de la vez anterior.`, 6000);
    return n;
  })();
  return BAK_RUN;
}
// al abrir el editor: si la carpeta Sider ya tiene permiso para guardar, se limpia sola (si no, al conectarla)
setTimeout(async () => { try { const h = await idbGet('sider'); if (h && !h.readOnly && (await h.queryPermission({ mode: 'readwrite' })) === 'granted') bakClean(h); } catch { } }, 4000);
