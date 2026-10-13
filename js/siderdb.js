// ===================== Carpeta Sider: instala el módulo edit21_db.lua y lee la copia de la base del juego =====================
// Al conectar la carpeta Sider, el editor deja listo el módulo (modules\edit21_db.lua + la línea en sider.ini) y la carpeta
// content\edit21-db. Si la copia de la base todavía no existe o está incompleta, avisa qué hay que hacer en el juego.
const SDB = { state: null, teams: new Map(), assign: new Map(), files: new Map(), luaVer: null, installed: false };
const LUA_NAME = 'edit21_db.lua';
const LUA_VERSION = (typeof EDIT21_LUA === 'string' && EDIT21_LUA.match(/v(\d+\.\d+)/) || [])[1] || '0';
const DB_NEEDED = ['Player.bin', 'Team.bin', 'PlayerAssignment.bin'];

async function sdbFile(dir, name) { try { return await (await dir.getFileHandle(name)).getFile(); } catch { return null; } }
async function sdbWrite(dir, name, text) { const h = await dir.getFileHandle(name, { create: true }); const w = await h.createWritable(); await w.write(text); await w.close(); }

// ---- instalación del módulo (necesita permiso de escritura en la carpeta Sider) ----
async function sdbInstall(sider) {
  const r = { module: 'ok', ini: 'ok', folder: 'ok', changed: false };
  let ini = await sdbFile(sider, 'sider.ini');
  if (!ini) { r.ini = 'no-sider'; return r; }
  // 1) modules\edit21_db.lua
  const mods = await sider.getDirectoryHandle('modules', { create: true });
  const cur = await sdbFile(mods, LUA_NAME); let curVer = null;
  if (cur) { const t = await cur.text(); curVer = (t.match(/v(\d+\.\d+)/) || [])[1] || '0'; }
  if (!cur) { await sdbWrite(mods, LUA_NAME, EDIT21_LUA); r.module = 'nuevo'; r.changed = true; }
  else if (parseFloat(curVer) < parseFloat(LUA_VERSION)) { try { await sdbWrite(mods, LUA_NAME + '.anterior', await cur.text()); } catch { } await sdbWrite(mods, LUA_NAME, EDIT21_LUA); r.module = 'actualizado'; r.changed = true; }
  // 2) sider.ini: lua.enabled = 1 y la línea del módulo
  let text = await ini.text(), orig = text;
  if (!/^\s*lua\.module\s*=\s*"?edit21_db\.lua"?\s*$/mi.test(text)) {
    const nl = text.includes('\r\n') ? '\r\n' : '\n';
    const lines = text.split(/\r?\n/); let last = -1;
    lines.forEach((l, i) => { if (/^\s*lua\.module\s*=/.test(l)) last = i; });
    const line = `lua.module = "${LUA_NAME}"`;
    if (last >= 0) lines.splice(last + 1, 0, line); else { let s = lines.findIndex(l => /^\s*\[sider\]/i.test(l)); lines.splice(s >= 0 ? s + 1 : lines.length, 0, '', '; PES Editor: copia de la base del juego (solo lectura)', 'lua.enabled = 1', line); }
    text = lines.join(nl); r.ini = 'agregado';
  }
  if (/^\s*lua\.enabled\s*=\s*0\s*$/m.test(text)) { text = text.replace(/^(\s*lua\.enabled\s*=\s*)0(\s*)$/m, '$11$2'); r.ini = 'agregado'; }
  if (text !== orig) { if (!await sdbFile(sider, 'sider.ini.bak-pes-editor')) await sdbWrite(sider, 'sider.ini.bak-pes-editor', orig); await sdbWrite(sider, 'sider.ini', text); r.changed = true; }
  // 3) content\edit21-db (el módulo no puede crear carpetas)
  const content = await sider.getDirectoryHandle('content', { create: true }); await content.getDirectoryHandle('pes-editor-db', { create: true }); const out = await content.getDirectoryHandle('edit21-db', { create: true });
  if (!await sdbFile(out, 'LEEME.txt')) await sdbWrite(out, 'LEEME.txt', 'Carpeta de salida del modulo edit21_db.lua (PES Editor).\r\nAca se guarda una copia de la base de datos que carga el juego (Player.bin, Team.bin, PlayerAssignment.bin, etc.).\r\nNo borres esta carpeta: si falta, el modulo no puede escribir.\r\n');
  SDB.installed = true; return r;
}

// ---- estado de la copia: qué archivos hay y cuáles faltan ----
const DB_DIRS = ['content/edit21-db', 'content/pes-editor-db'];
async function sdbDbDir(sider) {
  let best = null;
  for (const p of DB_DIRS) { try { const d = await subDir(sider, p); let n = 0, t = 0; for await (const [nm, h] of d.entries()) if (h.kind === 'file' && /\.bin$/i.test(nm)) { n++; t = Math.max(t, (await h.getFile()).lastModified); } if (!best || n > best.n || (n === best.n && t > best.t)) best = { d, n, t, p }; } catch { } }
  return best ? best.d : null;
}
// lo que dejó el módulo en sider.log la última vez que se abrió el juego
async function sdbLog(sider) {
  try { const f = await sdbFile(sider, 'sider.log'); if (!f) return null; const txt = await f.slice(Math.max(0, f.size - 1500000)).text(); const i = txt.lastIndexOf('Loading module: edit21_db'); if (i < 0) return { loaded: false }; const lines = txt.slice(i).split(/\r?\n/).filter(l => l.includes('[edit21_db')); const ver = (lines.join(' ').match(/v(\d+\.\d+) listo/) || [])[1]; const errs = lines.filter(l => /ERROR|no se pudo|AVISO/.test(l) && !/sin carpeta de salida/.test(l)).map(l => l.replace(/^.*?\[edit21_db\]\s*/, '')); return { loaded: true, ver, errs, copied: lines.filter(l => /copiado/.test(l)).length, when: f.lastModified }; } catch { return null; }
}
async function sdbCheck(sider) {
  const st = { dir: null, have: [], missing: DB_NEEDED.slice(), index: null };
  st.log = await sdbLog(sider);
  st.dir = await sdbDbDir(sider); if (!st.dir) { SDB.state = st; return st; }
  try { for await (const [n, h] of st.dir.entries()) if (h.kind === 'file' && /\.bin$/i.test(n)) { const f = await h.getFile(); st.have.push({ n, size: f.size, when: f.lastModified }); } } catch { }
  const have = new Set(st.have.map(x => x.n.toLowerCase()));
  st.missing = DB_NEEDED.filter(n => !have.has(n.toLowerCase()));
  const idx = await sdbFile(st.dir, 'index.txt'); if (idx) st.index = await idx.text();
  SDB.state = st; return st;
}

// ---- lectura de los archivos de la base ----
async function sdbUnpack(bytes) {
  let b = bytes;
  if (b[3] === 0x57 && b[4] === 0x45 && b[5] === 0x53 && b[6] === 0x59 && b[7] === 0x53) { const ds = new Blob([b.subarray(16)]).stream().pipeThrough(new DecompressionStream('deflate')); b = new Uint8Array(await new Response(ds).arrayBuffer()); }
  return b;
}
// Team.bin: registros de 1532 bytes. id en +8; nombres por idioma en bloques de 70 bytes (español +158, inglés +368,
// francés +508, portugués +718); sigla de 3 letras en +882.
async function sdbTeams(bytes) {
  const b = await sdbUnpack(bytes), R = 1532, td = new TextDecoder('utf-8'), out = new Map();
  if (b.length % R) return out;
  const str = (o, l) => { const s = b.subarray(o, o + l), z = s.indexOf(0); return td.decode(z < 0 ? s : s.subarray(0, z)).trim(); };
  for (let o = 0; o + R <= b.length; o += R) {
    const id = (b[o + 8] | b[o + 9] << 8 | b[o + 10] << 16 | b[o + 11] << 24) >>> 0; if (!id) continue;
    const es = str(o + 158, 70), en = str(o + 368, 70), ab = str(o + 882, 8);
    if (!es && !en) continue;
    out.set(id, { name: es || en, en, es, fr: str(o + 508, 70), pt: str(o + 718, 70), abbr: ab });
  }
  return out;
}
// PlayerAssignment.bin: el tamaño del registro no está documentado; se prueba con varios y se queda con el que hace que
// casi todos los ids sean jugadores y equipos conocidos.
async function sdbAssign(bytes, playerIds, teamIds, editNums) {
  const b = await sdbUnpack(bytes), u32 = o => (b[o] | b[o + 1] << 8 | b[o + 2] << 16 | b[o + 3] << 24) >>> 0, u16 = o => b[o] | b[o + 1] << 8;
  let best = null;
  for (const R of [8, 12, 16, 20, 24, 32]) {
    if (b.length % R) continue;
    const n = b.length / R, sample = Math.min(n, 2000);
    for (const [po, to, tw] of [[4, 8, 4], [0, 4, 4], [0, 4, 2], [4, 0, 4], [4, 0, 2], [0, 8, 4], [0, 6, 2], [0, 8, 2], [4, 8, 2], [8, 4, 4]]) {
      if (Math.max(po + 4, to + tw) > R) continue;
      let hit = 0;
      for (let i = 0; i < sample; i++) { const o = Math.floor(i * n / sample) * R, p = u32(o + po), t = tw === 4 ? u32(o + to) : u16(o + to); if (playerIds.has(p) && teamIds.has(t)) hit++; }
      const q = hit / sample; if (q > .9 && (!best || q > best.q)) best = { R, po, to, tw, q };
    }
  }
  const out = new Map(); if (!best) return { map: out, layout: null };
  const { R, po, to, tw } = best;
  // dorsal: el byte que, dentro del registro, se mueve entre 1 y 99 y cambia en cada fila
  const cand = []; for (let o = 0; o < R; o++) if (!(o >= po && o < po + 4) && !(o >= to && o < to + tw)) cand.push(o);
  let numOff = -1, bestN = 0, numAdd = 0;
  // si hay planteles en el EDIT, el dorsal es el byte (o byte + 1, el juego lo guarda desde 0) que más coincide con ellos
  if (editNums && editNums.size) {
    for (const c of cand) for (const add of [0, 1]) { let ok = 0; for (let o = 0; o + R <= b.length; o += R) { const want = editNums.get(u32(o + po)); if (want != null && b[o + c] + add === want) ok++; } if (ok > bestN) { bestN = ok; numOff = c; numAdd = add; } }
    if (bestN < 50) { numOff = -1; bestN = 0; numAdd = 0; }
  }
  if (numOff < 0) for (const c of cand) { let ok = 0; for (let i = 0; i < Math.min(b.length / R, 3000); i++) { const v = b[i * R + c]; if (v >= 1 && v <= 99) ok++; } if (ok > bestN) { bestN = ok; numOff = c; } }
  for (let o = 0; o + R <= b.length; o += R) {
    const p = u32(o + po), t = tw === 4 ? u32(o + to) : u16(o + to); if (!playerIds.has(p) || !teamIds.has(t)) continue;
    let arr = out.get(t); if (!arr) out.set(t, arr = []);
    arr.push({ pid: p, num: numOff >= 0 ? b[o + numOff] + numAdd : 0, i: arr.length });
  }
  return { map: out, layout: Object.assign({}, best, { numOff, numAdd }) };
}
async function sdbLoadAll(sider) {
  const st = await sdbCheck(sider); if (!st.dir) return st;
  const get = async n => { const f = await sdbFile(st.dir, n); return f ? new Uint8Array(await f.arrayBuffer()) : null; };
  try { const t = await get('Team.bin'); if (t) SDB.teams = await sdbTeams(t); } catch { }
  try {
    const a = await get('PlayerAssignment.bin');
    if (a && S.names.size) { const teamIds = new Set([...(S.ix ? S.ix.teams.map(t => t.id) : []), ...SDB.teams.keys()]); const editNums = new Map(); if (S.ix && S.d) for (const t of S.ix.teams) for (const e of PD.roster(S.d, t)) if (e && e.pid != null && e.number != null) editNums.set(e.pid, e.number); const r = await sdbAssign(a, new Set(S.names.keys()), teamIds, editNums); SDB.assign = r.map; SDB.layout = r.layout; }
  } catch { }
  return st;
}
// plantel de un equipo según la base del juego (para equipos sin plantel en tu EDIT)
function sdbRoster(t) { const a = SDB.assign.get(t.id); return a ? a.slice().sort((x, y) => (x.num || 99) - (y.num || 99)) : null; }
function sdbTeamName(id) { const t = SDB.teams.get(id); return t ? t.name : null; }

// ---- aviso: la base no está cargada ----
function sdbNotice(st, inst) {
  const missing = st ? st.missing : DB_NEEDED, none = !st || !st.have.length;
  const why = inst && inst.module === 'nuevo' ? 'Instalé el módulo <b>edit21_db.lua</b> en tu Sider: es la primera vez, así que la copia de la base todavía no existe.'
    : inst && inst.module === 'actualizado' ? 'Actualicé el módulo <b>edit21_db.lua</b> a la versión ' + LUA_VERSION + ', que copia más archivos de la base.'
    : none ? 'El módulo está instalado, pero la copia de la base del juego todavía no se generó.' : 'La copia de la base del juego está incompleta: faltan <b>' + missing.join(', ') + '</b>.';
  ksModal('La base del juego no está cargada', `<p>${why}</p>
    <p>Para que el parche y la base queden cargados correctamente, hacé esto una vez:</p>
    <ol class="sdbsteps"><li>Abrí <b>PES 2021 con Sider</b> y esperá a llegar al <b>menú principal</b>.</li><li>Entrá en <b>Partido › Amistoso</b> hasta la pantalla de <b>elección de equipos</b> (ahí el juego carga el resto de la base).</li><li><b>Cerrá el juego.</b></li><li>Volvé acá y tocá <b>"Ya lo hice"</b>.</li></ol>
    <p class="note">El módulo es de solo lectura: no cambia nada del juego. Copia los archivos a <code>content\\edit21-db</code>. Si el juego ya estaba abierto, cerralo y abrilo de nuevo para que tome el módulo.</p>
    ${st && st.log && st.log.errs && st.log.errs.length ? `<div class="warnbox"><b>Lo que pasó la última vez que abriste el juego</b> (según sider.log): el módulo ${st.log.ver ? 'v' + st.log.ver + ' ' : ''}se cargó pero no pudo guardar la copia.<br><code style="font-size:.75rem">${esc(st.log.errs[0].slice(0, 220))}</code><br>${/-> nil\s*$/.test(st.log.errs[0]) && !(parseFloat(st.log.ver) >= parseFloat(LUA_VERSION)) ? `Ese error es de una versión anterior del módulo (${st.log.ver ? 'v' + st.log.ver : 'vieja'}): el <code>io</code> de tu Sider no deja que los módulos guarden archivos (en tu sider.log les pasa también a otros, como PostProcessingEditor y UIColors). No es un problema de permisos de Windows. Ya instalé la <b>v${LUA_VERSION}</b>, que si eso pasa escribe con las funciones de Windows (necesita <code>luajit.ext.enabled = 1</code> en sider.ini, que el Dream Patch ya trae): repetí los pasos de arriba.` : /denied|denegado|Permission/i.test(st.log.errs.join(' ')) ? 'Windows no le da permiso al juego para escribir en esa carpeta. Abrí <b>Seguridad de Windows › Protección contra virus y amenazas › Protección contra ransomware</b> y, si "Acceso controlado a carpetas" está activado, tocá "Permitir una aplicación" y agregá <b>PES2021.exe</b>. Si no, probá abrir el juego sin "Ejecutar como administrador" (o con, si siempre lo abrís así).' : 'Revisá que la carpeta exista y que no esté marcada como "Solo lectura" (clic derecho › Propiedades).'}</div>` : st && st.log && !st.log.loaded ? '<div class="warnbox">En sider.log no aparece el módulo edit21_db: Sider no lo cargó. Revisá que en sider.ini esté <code>lua.enabled = 1</code> y la línea <code>lua.module = "edit21_db.lua"</code>.</div>' : ''}
    ${st && st.have.length ? `<p class="note">Archivos copiados hasta ahora: ${st.have.map(x => x.n).join(', ')}.</p>` : ''}
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn ghost" type="button" data-x>Más tarde</button><button class="btn primary" type="button" id="sdbRetry">Ya lo hice: volver a leer</button></div>`,
    (box, close) => { box.querySelector('#sdbRetry').onclick = async () => { close(); const h = await idbGet('sider'); if (!h) return; toast('Leyendo la base…', 3000); await loadDbQuiet(h, true); const st2 = await sdbLoadAll(h); if (st2.missing.length) { toast('Todavía faltan: ' + st2.missing.join(', ') + '. Revisá que Sider cargue el módulo (sider.log).', 8000); setTimeout(() => sdbNotice(st2), 400); } else { toast('Base del juego cargada: ' + st2.have.length + ' archivos.', 5000); render(); } }; });
}
// se llama al conectar la carpeta (con escritura) y al arrancar con la carpeta recordada (solo lectura)
async function sdbSetup(sider, canWrite) {
  let inst = null;
  if (canWrite) { try { inst = await sdbInstall(sider); } catch (e) { toast('No pude instalar el módulo en Sider: ' + e.message, 7000); } }
  const st = await sdbLoadAll(sider);
  if (inst && inst.ini === 'no-sider') { toast('En esa carpeta no está sider.ini: elegí la carpeta de Sider (la que tiene sider.exe).', 7000); return st; }
  if ((inst && inst.changed) || st.missing.length) setTimeout(() => sdbNotice(st, inst), 300);
  else if (inst) toast('Módulo edit21_db v' + LUA_VERSION + ' listo en Sider y base del juego completa.', 4000);
  return st;
}
