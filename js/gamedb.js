// ===================== Base del juego leída directo de sus archivos .cpk (sin abrir el juego) =====================
// PES 2021 y los juegos hechos sobre él (Football Life 2026 y otros) guardan la base (common\etc\pesdb\*.bin) adentro
// de archivos .cpk de CRI: Football Life en download\data_s2526.cpk, data_s2526a.cpk… (el más nuevo pisa al anterior).
// Si la carpeta conectada es la del juego (o una de más arriba), el editor lee esos archivos solo: lee el índice de
// cada .cpk (unos pocos KB), saca los .bin de la base y los descomprime (CRILAYLA). Encima van las carpetas de Sider
// (cpk.root de sider.ini y el resto de livecpk), que es lo que el juego usa primero. No escribe nada.
const GDB = { game: null, scan: null, at: 0 };
const GDB_RE = /(^|\/)common\/etc\/pesdb\/([^/]+\.bin)$/i;

// un pedazo de un archivo grande sin leerlo entero (en la app de Windows, con readRange)
async function gdbRead(h, off, len) {
  if (h.native) { if (typeof h.readRange !== 'function') throw new Error('sin readRange'); return h.readRange(off, len); }
  const f = h.getFile ? await h.getFile() : h; return new Uint8Array(await f.slice(off, off + len).arrayBuffer());
}
// tabla @UTF de CRI (big endian): filas con columnas de tipo número, texto o datos
function gdbUtf(b) {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength), td = new TextDecoder();
  if (b[0] !== 0x40 || b[1] !== 0x55 || b[2] !== 0x54 || b[3] !== 0x46) throw new Error('no es una tabla @UTF');
  const T = 8, rowsOff = dv.getUint32(T), strOff = dv.getUint32(T + 4), nCols = dv.getUint16(T + 16), rowLen = dv.getUint16(T + 18), nRows = dv.getUint32(T + 20);
  const str = o => { const s = T + strOff + o; let e = s; while (e < b.length && b[e]) e++; return td.decode(b.subarray(s, e)); };
  const val = (p, t) => {
    switch (t) {
      case 0: return [b[p], 1]; case 1: return [dv.getInt8(p), 1]; case 2: return [dv.getUint16(p), 2]; case 3: return [dv.getInt16(p), 2];
      case 4: return [dv.getUint32(p), 4]; case 5: return [dv.getInt32(p), 4]; case 6: case 7: return [Number(dv.getBigUint64(p)), 8];
      case 8: return [dv.getFloat32(p), 4]; case 0xa: return [str(dv.getUint32(p)), 4]; case 0xb: return [null, 12];
      default: throw new Error('tipo de columna ' + t);
    }
  };
  const cols = []; let p = T + 24;
  for (let i = 0; i < nCols; i++) {
    const fl = b[p], name = str(dv.getUint32(p + 1)); p += 5; let c = null;
    if ((fl & 0xf0) === 0x30) { const [v, n] = val(p, fl & 15); c = v; p += n; }
    cols.push([name, fl & 0xf0, fl & 15, c]);
  }
  const rows = [];
  for (let r = 0; r < nRows; r++) {
    let q = T + rowsOff + r * rowLen; const row = {};
    for (const [name, st, t, c] of cols) { if (st === 0x30) row[name] = c; else if (st === 0x10) row[name] = null; else { const [v, n] = val(q, t); row[name] = v; q += n; } }
    rows.push(row);
  }
  return rows;
}
// índice de un .cpk: dónde está cada archivo (el tamaño anotado no cuenta los 8 bytes de @UTF y el largo)
async function gdbToc(h) {
  const head = await gdbRead(h, 0, 16);
  if (head[0] !== 0x43 || head[1] !== 0x50 || head[2] !== 0x4b || head[3] !== 0x20) throw new Error('no es un .cpk');
  const hdv = new DataView(head.buffer, head.byteOffset), hs = Number(hdv.getBigUint64(8, true));
  const cpk = gdbUtf(await gdbRead(h, 16, hs + 8))[0], toc = cpk.TocOffset, ca = cpk.ContentOffset || 0;
  if (!toc) return [];
  const th = await gdbRead(h, toc, 16), ts = Number(new DataView(th.buffer, th.byteOffset).getBigUint64(8, true));
  const base = ca ? Math.min(toc, ca) : toc;
  return gdbUtf(await gdbRead(h, toc + 16, ts + 8)).map(r => ({ path: (r.DirName ? r.DirName + '/' : '') + r.FileName, off: base + r.FileOffset, size: r.FileSize, xsize: r.ExtractSize }));
}
// CRILAYLA: se lee de atrás para adelante, bit a bit; los primeros 0x100 bytes van sin comprimir al final
function gdbCrilayla(src) {
  const dv = new DataView(src.buffer, src.byteOffset, src.byteLength), usize = dv.getUint32(8, true), hsize = dv.getUint32(12, true);
  const plain = src.subarray(16 + hsize, 16 + hsize + 0x100), out = new Uint8Array(0x100 + usize);
  out.set(plain, 0);
  const dest = out.subarray(0x100); let pos = 16 + hsize - 1, pool = 0, cnt = 0;
  const bits = n => { let v = 0; while (n > 0) { if (!cnt) { pool = src[pos--]; cnt = 8; } const t = Math.min(n, cnt); v = (v << t) | ((pool >> (cnt - t)) & ((1 << t) - 1)); cnt -= t; n -= t; } return v; };
  const VLE = [2, 3, 5, 8];
  for (let o = usize - 1; o >= 0;) {
    if (bits(1)) {
      const ref = bits(13) + 3; let len = 3;
      for (let lvl = 0; ; lvl++) { const w = VLE[Math.min(lvl, 3)], v = bits(w); len += v; if (v !== (1 << w) - 1) break; }
      for (; len > 0 && o >= 0; len--, o--) dest[o] = dest[o + ref];
    } else dest[o--] = bits(8);
  }
  return out;
}
const gdbIsLayla = b => b && b.length > 16 && String.fromCharCode(...b.subarray(0, 8)) === 'CRILAYLA';
const gdbPlain = b => gdbIsLayla(b) ? gdbCrilayla(b) : b;

// ---- la carpeta del juego: la que tiene download o Data con archivos .cpk ----
async function gdbCpks(d) { const out = []; try { for await (const [n, h] of d.entries()) if (h.kind === 'file' && /\.cpk$/i.test(n)) out.push([n, h]); } catch { } return out; }
async function gdbIsGame(d) { for (const n of ['download', 'Data']) { const s = await hasDir(d, n); if (s && (await gdbCpks(s)).length) return true; } return false; }
// entre la carpeta elegida y la de Sider (por ejemplo D:\Juegos › Football Life 2026 › SiderAddons): la más cercana a Sider
async function gdbFindGame(dir, sider) {
  const chain = [dir];
  try { const path = dir.resolve ? await dir.resolve(sider) : null; let cur = dir; for (const seg of path || []) { cur = await cur.getDirectoryHandle(seg); chain.push(cur); } } catch { }
  if (!chain.includes(sider)) chain.push(sider);
  for (const d of chain.reverse()) if (await gdbIsGame(d)) return d;
  return null;
}
// el nombre del juego por su .exe (Football Life 2026 trae FL_2026.exe)
async function gdbExe(d) { try { for await (const [n, h] of d.entries()) if (h.kind === 'file' && /^(PES2021|PES2020|FL_\d+|.*football.?life.*)\.exe$/i.test(n)) return n; } catch { } return null; }
const gdbGameName = exe => !exe ? 'el juego' : /^FL_(\d+)\.exe$/i.test(exe) ? 'Football Life ' + exe.match(/^FL_(\d+)/i)[1] : /football.?life/i.test(exe) ? 'Football Life' : 'PES 2021';

// fecha del archivo (en la app sin leerlo entero)
async function gdbWhen(h) { try { return h.native ? ((h.info && await h.info()) || {}).mtime || 0 : (await h.getFile()).lastModified; } catch { return 0; } }
// orden: primero Data (lo que trae el juego), después download por nombre (data_s2526.cpk antes que data_s2526a.cpk);
// el que viene después pisa al anterior, como hace el juego con sus actualizaciones
const gdbSort = a => a.sort((x, y) => { const p = x[0].toLowerCase(), q = y[0].toLowerCase(); return p < q ? -1 : p > q ? 1 : 0; });
async function gdbScan(game, sider) {
  const files = new Map(), cpks = [];
  for (const sub of ['Data', 'download']) { const d = await hasDir(game, sub); if (d) for (const [n, h] of gdbSort(await gdbCpks(d))) cpks.push([sub + '\\' + n, h]); }
  for (const [label, h] of cpks) {
    let toc; try { toc = await gdbToc(h); } catch (e) { if (/readRange/.test(e.message)) return { files, old: true, cpks: cpks.length }; continue; }
    const mt = await gdbWhen(h);
    for (const r of toc) { const m = r.path.match(GDB_RE); if (m) files.set(m[2].toLowerCase(), { name: m[2], from: label, when: mt, get: async () => gdbPlain(await gdbRead(h, r.off, r.size)) }); }
  }
  // Sider va primero que los .cpk: la primera carpeta de sider.ini que trae el archivo gana
  if (sider && typeof siderCpkRoots === 'function') {
    let roots = []; try { roots = await siderCpkRoots(sider); } catch { }
    const seen = new Set();
    for (const r of roots) {
      let d; try { d = await subDir(r, 'common/etc/pesdb'); } catch { continue; }
      try { for await (const [n, h] of d.entries()) { const k = n.toLowerCase(); if (h.kind !== 'file' || !/\.bin$/.test(k) || seen.has(k)) continue; seen.add(k); files.set(k, { name: n, from: 'Sider: ' + r.name, when: await gdbWhen(h), get: async () => gdbPlain(new Uint8Array(await (await h.getFile()).arrayBuffer())) }); } } catch { }
    }
  }
  return { files, cpks: cpks.length, exe: await gdbExe(game) };
}
// la carpeta del juego que se recordó al conectar Sider, con permiso de lectura
async function gdbGame() {
  if (GDB.game) return GDB.game;
  try { const h = await idbGet('siderGame'); if (h && (!h.queryPermission || (await h.queryPermission({ mode: 'read' })) === 'granted')) GDB.game = h; } catch { }
  return GDB.game;
}
async function gdbLoad(sider, force) {
  if (GDB.scan && !force && Date.now() - GDB.at < 60000) return GDB.scan;
  const game = await gdbGame(); if (!game) return null;
  try { GDB.scan = await gdbScan(game, sider); GDB.at = Date.now(); } catch { GDB.scan = null; }
  return GDB.scan;
}
