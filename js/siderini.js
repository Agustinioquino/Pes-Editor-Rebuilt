// ===================== Pestaña Sider: qué hay en sider.ini y en las carpetas del Parche, y edición fácil de sider.ini =====================
// Lee sider.ini (cpk.root, lua.module y los ajustes), mira adentro de livecpk\ y content\ para decir qué tipo de mod es cada
// carpeta y qué herramienta del editor la usa, y deja activar, ordenar, agregar o quitar líneas sin tocar el texto a mano.
// Nada se escribe hasta tocar "Guardar sider.ini"; la primera vez queda una copia en sider.ini.bak-pes-editor (la misma
// copia que usan los otros arreglos automáticos del editor).
const SI = { h: null, items: null, nl: '\r\n', orig: '', info: null, busy: null, err: null, detail: null, perm: false, seq: 0, open: { raw: false, other: false } };
const siReset = () => { SI.info = null; SI.items = null; SI.err = null; SI.detail = null; SI.perm = false; }; // también el error: tras reconectar otra carpeta se vuelve a leer
// sider.ini suele ser ASCII o UTF-8, pero el Bloc de notas lo puede guardar en UTF-16 o en Windows-1252 (acentos en los
// comentarios). Se detecta al leer y al guardar se escribe igual, para que Sider lo siga leyendo como antes.
// Windows-1252: los bytes 0x80–0x9F son €, …, ‘’, “”, – y otros; el resto coincide con el código Unicode
const CP1252_HI = [0x20AC, 0x81, 0x201A, 0x0192, 0x201E, 0x2026, 0x2020, 0x2021, 0x02C6, 0x2030, 0x0160, 0x2039, 0x0152, 0x8D, 0x017D, 0x8F, 0x90, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013, 0x2014, 0x02DC, 0x2122, 0x0161, 0x203A, 0x0153, 0x9D, 0x017E, 0x0178];
const CP1252_REV = new Map(CP1252_HI.map((c, i) => [c, 0x80 + i]));
const cp1252Decode = b => { let s = ''; for (let i = 0; i < b.length; i++) { const c = b[i]; s += String.fromCharCode(c >= 0x80 && c <= 0x9F ? CP1252_HI[c - 0x80] : c); } return s; };
function siDecode(b) {
  if (b.length >= 2 && b[0] === 0xFF && b[1] === 0xFE) return { enc: 'utf-16le', text: new TextDecoder('utf-16le').decode(b.subarray(2)) };
  if (b.length >= 2 && b[0] === 0xFE && b[1] === 0xFF) return { enc: 'utf-16be', text: new TextDecoder('utf-16be').decode(b.subarray(2)) };
  if (b.length >= 4 && b[1] === 0 && b[3] === 0 && b[0] && b[2]) return { enc: 'utf-16le', text: new TextDecoder('utf-16le').decode(b) }; // sin BOM pero con ceros intercalados
  const u = new TextDecoder('utf-8').decode(b);
  if (/\uFFFD/.test(u)) return { enc: 'cp1252', text: cp1252Decode(b) };
  return { enc: b.length >= 3 && b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF ? 'utf-8-bom' : 'utf-8', text: u.replace(/^\uFEFF/, '') };
}
function siEncode(t, enc) {
  if (enc === 'utf-16le' || enc === 'utf-16be') { const be = enc === 'utf-16be', b = new Uint8Array(2 + t.length * 2); b[0] = be ? 0xFE : 0xFF; b[1] = be ? 0xFF : 0xFE; for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); b[2 + i * 2 + be] = c & 255; b[3 + i * 2 - be] = c >> 8; } return b; }
  if (enc === 'cp1252') { const b = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); b[i] = c < 256 ? c : CP1252_REV.get(c) ?? 63; } return b; }
  if (enc === 'utf-8-bom') return new TextEncoder().encode('\uFEFF' + t);
  return new TextEncoder().encode(t);
}
async function siReadIni(h) { const f = await sdbFile(h, 'sider.ini'); if (!f) return null; const d = siDecode(new Uint8Array(await f.arrayBuffer())); SI.enc = d.enc; return d.text; }
async function siWrite(dir, name, text) { const h = await fsFile(dir, name, true); const w = await h.createWritable(); await w.write(siEncode(text, SI.enc)); await w.close(); }

// ---- sider.ini: cada línea queda como está salvo las que se tocan ----
// kv: clave = valor (con o sin comillas, con comentario al final). Una línea comentada (; clave = valor) con una clave con
// punto es una línea "apagada": se puede volver a prender. El resto (comentarios, [sider], vacías) se copia tal cual.
function siParseLine(raw, i) {
  const s = raw.match(/^\s*\[(.+?)\]\s*$/); if (s) return { i, raw, kind: 'sec', name: s[1] };
  const m = raw.match(/^(\s*)(?:([;#])\s*)?([A-Za-z][\w\-]*(?:\.[\w\-]+)*)\s*=\s*(.*)$/);
  if (!m || (m[2] && !/\./.test(m[3]) && !/^debug$/i.test(m[3]))) return { i, raw, kind: raw.trim() ? 'txt' : 'blank' };
  let val, quoted = false, cmt = '';
  const q = m[4].match(/^"([^"]*)"\s*(.*)$/);
  if (q) { quoted = true; val = q[1]; cmt = q[2].trim(); } else { const c = m[4].match(/^(.*?)\s*([;#].*)?$/); val = c[1].trim(); cmt = (c[2] || '').trim(); }
  if (cmt && !/^[;#]/.test(cmt)) cmt = '; ' + cmt; // texto suelto después de las comillas: se guarda como comentario para no perderlo
  return { i, raw, kind: 'kv', off: !!m[2], key: m[3].toLowerCase(), k0: m[3], val, quoted, cmt, ind: m[1] };
}
function siParse(text) { SI.nl = text.includes('\r\n') ? '\r\n' : '\n'; SI.items = text.split(/\r?\n/).map((l, i) => Object.assign(siParseLine(l, i), { id: ++SI.seq })); }
const SI_QUOTED = /^(cpk\.root|lua\.module|exe\.name|overlay\.font)$/;
function siLine(it) {
  if (it.kind !== 'kv' || !it.ch) return it.raw;
  return `${it.ind || ''}${it.off ? '; ' : ''}${it.k0} = ${it.quoted ? '"' + it.val + '"' : it.val}${it.cmt ? ' ' + it.cmt : ''}`;
}
const siText = () => SI.items ? SI.items.map(siLine).join(SI.nl) : SI.orig;
const siDirty = () => siText() !== SI.orig;
const siKv = (key, all) => SI.items.filter(x => x.kind === 'kv' && x.key === key && (all || !x.off));
const siGet = key => { const x = siKv(key)[0]; return x ? x.val : null; };
// agrega una línea nueva: después de la última de la misma clave; si no hay, después de [sider] (o al final)
function siAdd(key, val, where) {
  const it = { id: ++SI.seq, raw: '', kind: 'kv', off: false, key: key.toLowerCase(), k0: key, val, quoted: SI_QUOTED.test(key.toLowerCase()), cmt: '', ind: '', ch: true };
  const same = SI.items.map((x, k) => (x.kind === 'kv' && x.key === it.key ? k : -1)).filter(k => k >= 0);
  let at;
  if (same.length) at = where === 'first' ? same[0] : same[same.length - 1] + 1;
  else { const s = SI.items.findIndex(x => x.kind === 'sec' && /^sider$/i.test(x.name)); at = s >= 0 ? s + 1 : SI.items.length; }
  SI.items.splice(at, 0, it); return it;
}
// cambia un ajuste: la primera línea activa con esa clave; si solo hay una apagada, la prende; si no hay, la agrega
function siSet(key, val) {
  const on = siKv(key)[0]; if (on) { on.val = val; on.ch = true; return on; }
  const off = siKv(key, true)[0]; if (off) { off.off = false; off.val = val; off.ch = true; return off; }
  return siAdd(key, val);
}
const siById = id => SI.items.find(x => x.id === id);
function siMove(it, dir) { // sube o baja dentro de su grupo (misma clave); lo demás del archivo queda en su lugar
  const grp = SI.items.filter(x => x.kind === 'kv' && x.key === it.key), k = grp.indexOf(it), other = grp[k + dir]; if (!other) return false;
  const a = SI.items.indexOf(it), b = SI.items.indexOf(other); SI.items[a] = other; SI.items[b] = it; it.ch = other.ch = true; return true;
}

// ---- qué es cada carpeta: por las rutas que tiene adentro (seguro) o por el nombre (probable) ----
const SI_TYPES = {
  escudos: ['Escudos', '🛡️', 'escudos'], minifaces: ['Fotos de jugadores (minifaces)', '🪪', 'fotos'], caras: ['Caras 3D', '🙂'], kits: ['Kits', '👕', 'kits'],
  botines: ['Botines', '👟'], guantes: ['Guantes', '🧤'], balones: ['Balones', '⚽'], estadios: ['Estadios', '🏟️'], base: ['Base de datos del juego', '🗄️', 'base'],
  datapack: ['Datapack / archivos del juego', '📦'], menu: ['Menús y gráficos', '🖥️'], fuentes: ['Fuentes', '🔤'], arbitros: ['Árbitros', '🟨'], peinados: ['Peinados', '💈'],
  sonido: ['Sonido y música', '🔊'], marcadores: ['Marcadores', '📺'], carteles: ['Carteles publicitarios', '🪧'], tatuajes: ['Tatuajes', '🎨'], cesped: ['Césped', '🌱'],
  trofeos: ['Trofeos', '🏆'], tuneles: ['Túneles', '🚪'], tecnicos: ['Entrenadores', '🧑‍💼'], cantos: ['Cantos de hinchada', '🎶'], prensa: ['Sala de prensa', '🎤'],
  clima: ['Clima', '🌦️'], competiciones: ['Competiciones', '🏅'], editor: ['Carpeta de PES Editor', '🛠️'], comun: ['Librería común para otros módulos', '🧩']
};
const SI_PATHS = [ // [ruta dentro de la carpeta, tipo, contar (archivos; en caras, una carpeta por jugador)]
  ['common/render/symbol/flag', 'escudos', 1], ['common/render/symbol/player', 'minifaces', 1], ['common/character0/model/character/face/real', 'caras', 1],
  ['common/character0/model/character/uniform', 'kits', 0], ['common/character0/model/character/boots', 'botines', 0], ['common/character0/model/character/glove', 'guantes', 0],
  ['common/character0/model/character/ball', 'balones', 0], ['common/render/thumbnail/ball', 'balones', 0], ['Asset/model/bg', 'estadios', 0], ['common/bg/model/bg', 'estadios', 0],
  ['common/etc/pesdb', 'base', 0], ['common/render/ui', 'menu', 0], ['common/menu', 'menu', 0], ['common/render/font', 'fuentes', 0], ['common/character1/model/character/referee', 'arbitros', 0],
  ['common/character0/model/character/hair', 'peinados', 0], ['common/character0/model/character/tattoo', 'tatuajes', 0], ['common/sound', 'sonido', 0], ['common/bgm', 'sonido', 0]
];
const SI_NAMES = [ // pistas por el nombre de la carpeta o del módulo
  [/pes-?editor|edit21/i, 'editor'], [/mini|photo|foto/i, 'minifaces'], [/face|cara/i, 'caras'], [/kit|uniform/i, 'kits'], [/badge|logo|emblem|escudo|crest/i, 'escudos'],
  [/stadi|estadio/i, 'estadios'], [/ball|balon|pelota/i, 'balones'], [/boot|botin/i, 'botines'], [/glove|guante/i, 'guantes'], [/scoreboard|marcador/i, 'marcadores'],
  [/adboard|cartel|banner/i, 'carteles'], [/tattoo|tatu/i, 'tatuajes'], [/graphic|menu|gfx|\bui\b|interface|hud|overlay|colou?r|postprocess/i, 'menu'], [/chant|canto|hincha/i, 'cantos'],
  [/music|sound|song|audio|bgm|anthem|himno/i, 'sonido'], [/refer|arbitr/i, 'arbitros'], [/\bdb\b|database|pesdb|base/i, 'base'], [/hair|peinad/i, 'peinados'], [/tunnel|tunel/i, 'tuneles'],
  [/trophy|trofeo/i, 'trofeos'], [/press|prensa|conference/i, 'prensa'], [/turf|pitch|cesped|grass/i, 'cesped'], [/weather|clima/i, 'clima'], [/manager|coach|tecnic/i, 'tecnicos'],
  [/font|fuente/i, 'fuentes'], [/datapack|\bdlc\b|\bdp\d/i, 'datapack'], [/comp|cup|league|liga|torneo|tournament/i, 'competiciones'], [/common|lib|util|helper/i, 'comun']
];
const SI_MODS = [ // módulos Lua conocidos: [nombre, qué hacen, tipo relacionado]
  [/kserv|kit.?serv/i, 'Kit server: carga los kits desde content\\kit-server, sin meterlos en cpk', 'kits'], [/edit21_db/i, 'PES Editor: copia la base del juego en content\\edit21-db (solo lectura)', 'base'],
  [/face.?serv/i, 'Face server: caras desde content', 'caras'], [/ball.?serv/i, 'Ball server: balones desde content', 'balones'], [/stadium.?serv/i, 'Stadium server: estadios desde content', 'estadios'],
  [/scoreboard/i, 'Scoreboard server: marcadores por competición', 'marcadores'], [/glove/i, 'Gloves server: guantes', 'guantes'], [/boot/i, 'Boots server: botines', 'botines'],
  [/trophy/i, 'Trophy server: trofeos', 'trofeos'], [/adboard/i, 'Adboards server: carteles publicitarios', 'carteles'], [/tunnel/i, 'Tunnel server: túneles de salida', 'tuneles'],
  [/chant/i, 'Chants: cantos de hinchada por equipo', 'cantos'], [/music|bgm|song|anthem/i, 'Música o himnos', 'sonido'], [/press/i, 'Sala de prensa', 'prensa'], [/turf|pitch|grass/i, 'Césped y campo', 'cesped'],
  [/weather|clima/i, 'Clima', 'clima'], [/camera|cam\b/i, 'Cámara', null], [/time|clock|duration/i, 'Duración del partido', null], [/uniparam/i, 'Parámetros de uniformes (UniParam)', 'kits'],
  [/refer/i, 'Árbitros', 'arbitros'], [/overlay|ui.?colo|postprocess|\bppe\b|reshade/i, 'Gráficos dentro del juego', 'menu'], [/tattoo/i, 'Tatuajes', 'tatuajes'], [/manager|coach/i, 'Entrenadores', 'tecnicos'],
  [/comp|league|cup|tournament/i, 'Competiciones (nombres, logos, balones por torneo)', 'competiciones'], [/common|lib|util|helper/i, 'Librería que usan otros módulos', 'comun'], [/debug|log/i, 'Depuración (anota en sider.log)', null], [/speed|tempo/i, 'Velocidad del juego', null]
];
// herramientas del editor que usan cada tipo de contenido
const SI_TOOLS = {
  kits: ['Kits', 'Equipos › Kits de cada equipo, y el Estudio de kits', () => { S.ttab = 'kits'; setTab('teams'); }],
  escudos: ['Escudos', 'Equipos › el escudo de cada equipo (se guarda en esta carpeta)', () => { S.ttab = 'data'; setTab('teams'); }],
  fotos: ['Fotos', 'las fotos de los jugadores en planteles y fichas', () => setTab('teams')],
  base: ['Base del juego', 'nombres, valoraciones y planteles de todos los jugadores', () => setTab('players')]
};
const siType = t => { const x = SI_TYPES[t] || [t, '📁']; return { t, n: x[0], ico: x[1], tool: x[2] && SI_TOOLS[x[2]] ? x[2] : null }; };
const siGuess = name => { for (const [re, t] of SI_NAMES) if (re.test(name)) return t; return null; };
async function siScanRoot(d, name) {
  const found = new Map();
  for (const [p, t, cnt] of SI_PATHS) {
    try { const x = await subDir(d, p); let n = 0; for await (const [, e] of x.entries()) { if (!cnt) { n = 1; break; } if (t === 'caras' ? e.kind === 'directory' : e.kind === 'file') n++; if (n >= 3000) break; } if (n) { const cur = found.get(t); if (!cur || n > cur.count) found.set(t, { sure: true, count: cnt ? n : 0 }); } } catch { }
  }
  if (!found.size) { const g = siGuess(name); if (g) found.set(g, { sure: false, count: 0 }); }
  return [...found].map(([t, v]) => Object.assign(siType(t), v));
}
// la carpeta de una línea cpk.root: ruta relativa (.\livecpk\X, livecpk\X, ./livecpk/X) o completa. Una ruta completa
// se busca adentro de esta Sider aunque la carpeta haya cambiado de nombre o de lugar: primero lo que sigue al nombre de
// la carpeta Sider, después cada final de la ruta (…\livecpk\X, …\X), y por último livecpk\<última carpeta>.
async function siResolve(sider, val) {
  let p = val.trim().replace(/\//g, '\\').replace(/\\+$/, ''); const abs = /^([A-Za-z]:|\\\\)/.test(p), me = (sider.name || '').toLowerCase();
  const parts = p.split('\\').filter(Boolean), last = parts[parts.length - 1] || p;
  let rel = null, h = null, outside = false;
  const tryRel = async r => { try { const x = r ? await subDir(sider, r) : sider; h = x; rel = r; return true; } catch { return false; } };
  const relOf = r => { rel = r; return tryRel(r); }; // relativa: se anota aunque no exista
  if (abs) {
    const low = parts.map(x => x.toLowerCase()), k = low.lastIndexOf(me), cands = [];
    if (k >= 0) cands.push(parts.slice(k + 1).join('\\'));
    for (let i = 1; i < parts.length - 1; i++) cands.push(parts.slice(i).join('\\')); // finales de dos o más carpetas
    const lv = low.indexOf('livecpk');
    if (lv >= 0) cands.push(parts.slice(lv).join('\\')); // desde livecpk (también la carpeta livecpk sola)
    if (lv >= 0 && last && !/^livecpk$/i.test(last)) cands.push('livecpk\\' + last); // la Sider se movió o renombró: misma carpeta de livecpk
    for (const c of cands) if (await tryRel(c)) break;
    if (!h) { rel = lv >= 0 ? parts.slice(lv).join('\\') : null; outside = rel == null; }
  } else if (/^\.\.(\\|$)/.test(p)) outside = true; // sube un nivel: el navegador no puede mirar ahí
  else await relOf(p.replace(/^\.?(\\|$)/, '')); // ".\livecpk\X", "livecpk\X" y "\livecpk\X" son la misma carpeta
  return { abs, rel, h, outside, name: ((rel != null ? rel : p).split('\\').filter(Boolean).pop()) || p };
}
async function siCount(d, re, cap = 500) { let n = 0; try { for await (const [nm, e] of d.entries()) { if (!re || (e.kind === 'file' && re.test(nm))) n++; if (n >= cap) break; } } catch { } return n; }
async function siVersion(h) {
  try { const f = await sdbFile(h, 'sider.log'); if (f) { const t = await f.slice(0, 6000).text(), m = t.match(/sider(?:\.dll|\.exe)?[^\r\n]{0,40}?v?(\d+\.\d+\.\d+(?:\.\d+)?)/i); if (m) return m[1]; } } catch { }
  return null;
}

// Cuando no aparece sider.ini: qué hay en la carpeta y qué error dio al pedir el archivo, para entender el caso en vez de
// adivinar (si el archivo se llama sider.ini.txt, si la carpeta elegida es otra, si el navegador no deja leerlo…).
const siErrMsg = e => (e && e.name ? e.name + (e.message ? ': ' + e.message : '') : String(e)).replace(/\.$/, '');
async function siNoIniDetail(h) {
  const d = { n: 0, names: [], err: '', lerr: '' };
  try { const f = await fsFile(h, 'sider.ini'); try { await f.getFile(); } catch (e) { d.err = 'al abrir el archivo: ' + siErrMsg(e); } }
  catch (e) { d.err = 'al pedir el archivo: ' + siErrMsg(e); }
  try { for await (const [n, x] of h.entries()) { d.n++; if (d.names.length < 14) d.names.push(x.kind === 'directory' ? n + '\\' : n); } } catch (e) { d.lerr = siErrMsg(e); }
  return d;
}
// la misma información en una línea de texto (para el aviso al conectar la carpeta)
function siNoIniText(d) {
  const T = typeof tr === 'function' ? tr : x => x;
  const what = d.n ? `${d.n} ${T('elementos')}: ${d.names.join(', ')}${d.n > d.names.length ? '…' : ''}` : T('nada (está vacía o no se pudo listar)') + (d.lerr ? ' (' + d.lerr + ')' : '');
  return `${T('Adentro veo')} ${what}. ${T('sider.ini')}: ${d.err ? T(d.err.split(': ')[0]) + d.err.slice(d.err.indexOf(': ')) : T('se leyó bien')}.`;
}

function siNoIniHtml(d, h) {
  const what = d.n ? `${d.n} <span>elementos</span>: <code>${esc(d.names.join(', '))}${d.n > d.names.length ? '…' : ''}</code>` : `<span>nada (está vacía o no se pudo listar)</span>${d.lerr ? ` <code>${esc(d.lerr)}</code>` : ''}`;
  const err = d.err ? `<span>${esc(d.err.split(': ')[0])}</span><code>${esc(d.err.slice(d.err.indexOf(': ')))}</code>` : '<span>se leyó bien</span>';
  return `<span>Adentro de</span> <b>${esc(h.name)}</b> <span>veo</span> ${what}.<br><span>Al buscar sider.ini</span>: ${err}. <span>Mandá una captura de esto si el archivo sí está en la carpeta.</span>`;
}

// ---- leer todo: sider.ini + carpetas ----
async function siLoad(force, hIn) {
  if (SI.busy) return SI.busy;
  if (SI.info && !force) return;
  SI.busy = (async () => {
    SI.err = null; SI.perm = false; SI.info = null; SI.items = null;
    let h = hIn || (typeof SIDER_RO !== 'undefined' && SIDER_RO) || await idbGet('sider').catch(() => null);
    SI.h = h; if (!h) return;
    try { if (h.queryPermission && (await h.queryPermission({ mode: 'read' })) !== 'granted') { SI.perm = true; return; } } catch { }
    const text = await siReadIni(h);
    if (text == null) { SI.err = 'no-ini'; SI.detail = await siNoIniDetail(h).catch(e => ({ n: 0, names: [], err: siErrMsg(e), lerr: '' })); return; }
    SI.orig = text; siParse(text);
    const info = { name: h.name || 'Sider', ro: !!h.readOnly, ver: await siVersion(h), roots: [], live: [], mods: [], modFree: [], content: [], game: siKv('exe.name').map(x => x.val), inGame: await hasFile(h, 'PES2021.exe'), bak: !!await sdbFile(h, 'sider.ini.bak-pes-editor') };
    const used = new Set();
    for (const it of siKv('cpk.root', true)) { const r = await siResolve(h, it.val); r.it = it; r.types = r.h ? await siScanRoot(r.h, r.name) : []; if (r.rel != null) used.add(r.rel.toLowerCase()); info.roots.push(r); }
    const live = await hasDir(h, 'livecpk');
    if (live) { try { for await (const [n, d] of live.entries()) if (d.kind === 'directory' && !used.has(('livecpk\\' + n).toLowerCase())) info.live.push({ name: n, types: await siScanRoot(d, n) }); } catch { } info.live.sort((a, b) => a.name.localeCompare(b.name)); }
    const mods = await hasDir(h, 'modules'), modFiles = new Map();
    if (mods) { try { for await (const [n, f] of mods.entries()) if (f.kind === 'file' && /\.lua$/i.test(n)) modFiles.set(n.toLowerCase(), n); } catch { } }
    const modUsed = new Set();
    for (const it of siKv('lua.module', true)) { const n = it.val.trim(), k = SI_MODS.find(([re]) => re.test(n)); modUsed.add(n.toLowerCase()); info.mods.push({ it, name: n, exists: !mods || modFiles.has(n.toLowerCase()), desc: k ? k[1] : null, type: k ? k[2] : siGuess(n.replace(/\.lua$/i, '')) }); }
    for (const [k, n] of modFiles) if (!modUsed.has(k)) { const d = SI_MODS.find(([re]) => re.test(n)); info.modFree.push({ name: n, desc: d ? d[1] : null, type: d ? d[2] : siGuess(n.replace(/\.lua$/i, '')) }); }
    info.modFree.sort((a, b) => a.name.localeCompare(b.name));
    const content = await hasDir(h, 'content');
    if (content) {
      try { for await (const [n, d] of content.entries()) {
        if (d.kind !== 'directory') continue;
        const c = { name: n, type: siGuess(n), detail: '', mod: null };
        if (/kit/i.test(n) && await readText(d, 'map.txt') != null) { c.type = 'kits'; const nTeams = lines((await readText(d, 'map.txt')) || '').filter(l => /^\d+\s*,/.test(l)).length; c.detail = `${nTeams.toLocaleString('es-AR')} equipos en map.txt`; }
        else if (/edit21-db|pes-editor-db/i.test(n)) { c.type = 'base'; const nb = await siCount(d, /\.bin$/i); c.detail = nb ? `${nb} archivos .bin de la base` : /pes-editor-db/i.test(n) ? 'carpeta de reserva del módulo (vacía)' : 'todavía sin copia: abrí el juego una vez con Sider'; }
        else { const nd = await siCount(d, null, 500); c.detail = nd ? `${nd >= 500 ? '500+' : nd} elementos` : 'vacía'; }
        c.mod = info.mods.find(x => x.type && x.type === c.type) || null;
        info.content.push(c);
      } } catch { }
      info.content.sort((a, b) => a.name.localeCompare(b.name));
    }
    SI.info = info;
    const c = $('cSider'); if (c) c.textContent = (info.roots.filter(r => !r.it.off).length + info.mods.filter(x => !x.it.off).length) || '';
  })().catch(e => { SI.err = e.message; }).finally(() => { SI.busy = null; if (S.tab === 'sider') render(); });
  return SI.busy;
}

// ---- pantalla ----
const SI_SET = [ // [clave, etiqueta, tipo (b: sí/no, n: número, s: opciones), ayuda, opciones]
  ['livecpk.enabled', 'Cargar las carpetas de contenido (livecpk)', 'b', 'Sin esto Sider no lee ninguna cpk.root y el juego corre sin el Parche.'],
  ['lua.enabled', 'Módulos Lua', 'b', 'Sin esto no corre ningún lua.module: ni el kit server ni edit21_db.'],
  ['luajit.ext.enabled', 'Extensiones de LuaJIT (ffi)', 'b', 'Las necesitan algunos módulos, entre ellos edit21_db.'],
  ['jit.enabled', 'JIT de Lua (más rápido)', 'b'],
  ['lookup-cache.enabled', 'Caché de búsqueda de archivos', 'b', 'Acelera la carga del Parche.'],
  ['close.on.exit', 'Cerrar Sider cuando se cierra el juego', 'b'],
  ['start.minimized', 'Abrir Sider minimizado', 'b'],
  ['free.side.select', 'Elegir cualquier lado al jugar (local o visitante)', 'b'],
  ['free.first.player', 'Elegir el primer jugador libremente', 'b'],
  ['black.bars.off', 'Sacar las barras negras', 'b'],
  ['camera.dynamic-wide.angle.enabled', 'Cámara dinámica ampliada', 'b'],
  ['camera.sliders.max', 'Máximo de los deslizadores de cámara', 'n'],
  ['overlay.enabled', 'Overlay de Sider dentro del juego', 'b'],
  ['overlay.on-from-start', 'Overlay visible desde el inicio', 'b'],
  ['debug', 'Detalle de sider.log', 's', null, [['0', 'mínimo'], ['1', 'errores y avisos'], ['2', 'detallado'], ['3', 'todo']]]
];
const SI_MAIN = new Set(['cpk.root', 'lua.module', 'exe.name', ...SI_SET.map(x => x[0])]);
const siChip = t => `<span class="chip sitype ${t.sure === false ? 'guess' : 'ok'}" title="${t.sure === false ? 'Supuesto por el nombre de la carpeta' : 'Detectado por los archivos que tiene adentro'}"><span>${t.ico}</span> ${esc(t.n)}${t.count ? ' · ' + (t.count >= 3000 ? '3000+' : t.count.toLocaleString('es-AR')) : ''}</span>`;
const siToolChip = key => { const t = SI_TOOLS[key]; return t ? `<span class="chip sitool" title="${esc(t[1])}">🛠 Editor: ${esc(t[0])}</span>` : ''; };
const siSw = (it, title) => `<label class="sw" title="${esc(title)}"><input type="checkbox" data-si="toggle" data-id="${it.id}" ${it.off ? '' : 'checked'}><i></i></label>`;
const siAct = (it, what) => `<div class="siact"><button class="btn icon small" type="button" data-si="up" data-id="${it.id}" title="Subir (más prioridad)">▲</button><button class="btn icon small" type="button" data-si="down" data-id="${it.id}" title="Bajar">▼</button><button class="btn icon small danger" type="button" data-si="del" data-id="${it.id}" title="${esc(what)}">✕</button></div>`;
function siWarns(info) {
  const w = [];
  const v = k => siGet(k);
  if (v('livecpk.enabled') === '0') w.push(['Sider no está leyendo las carpetas de contenido (livecpk.enabled = 0): el juego corre sin los archivos del Parche.', 'livecpk.enabled']);
  if (v('lua.enabled') === '0' && info.mods.some(x => !x.it.off)) w.push(['Los módulos Lua no corren (lua.enabled = 0): ni el kit server ni edit21_db.', 'lua.enabled']);
  if (v('luajit.ext.enabled') === '0' && info.mods.some(x => !x.it.off && /edit21_db/i.test(x.name))) w.push(['edit21_db necesita luajit.ext.enabled = 1 para poder guardar la copia de la base.', 'luajit.ext.enabled']);
  const miss = info.roots.filter(r => !r.it.off && !r.h && !r.outside); if (miss.length) w.push([`${miss.length} ${miss.length === 1 ? 'carpeta de cpk.root no existe' : 'carpetas de cpk.root no existen'}: Sider las salta. Revisá si cambiaron de nombre o quitá la línea.`]);
  const mm = info.mods.filter(x => !x.it.off && !x.exists); if (mm.length) w.push([`${mm.length} ${mm.length === 1 ? 'módulo no está' : 'módulos no están'} en la carpeta modules: ${mm.map(x => x.name).join(', ')}.`]);
  const seen = new Set(), dup = []; for (const r of info.roots) if (!r.it.off && r.rel != null) { const k = r.rel.toLowerCase(); if (seen.has(k)) dup.push(r.name); seen.add(k); }
  if (dup.length) w.push([`Carpetas repetidas en cpk.root: ${dup.join(', ')}. La segunda línea no hace nada.`]);
  return w;
}
// el usuario elige sider.ini con el selector de archivos (Chrome lo oculta a las páginas); tiene que ser el de esa carpeta
async function siPickIni(h) {
  const T = typeof tr === 'function' ? tr : x => x;
  let f = null;
  try { [f] = await window.showOpenFilePicker({ id: 'siderini', startIn: h, multiple: false, types: [{ description: 'sider.ini', accept: { 'text/plain': ['.ini'] } }] }); }
  catch (e) { if (e.name !== 'AbortError') toast(T('No se pudo abrir el selector:') + ' ' + e.message, 6000); return; }
  if (!f || (f.name || '').toLowerCase() !== 'sider.ini') { toast(`${T('Ese archivo se llama')} ${f ? f.name : '?'}: ${T('tiene que ser sider.ini, el de la carpeta')} ${h.name}.`, 8000); return; }
  let r = null; try { r = h.resolve ? await h.resolve(f) : null; } catch { }
  if (!r || r.length !== 1) { toast(`${T('Ese sider.ini está en otra carpeta')}${r ? ' (' + r.slice(0, -1).join('\\') + ')' : ''}: ${T('tiene que ser el de')} ${h.name}.`, 8000); return; }
  try { if (f.requestPermission && (await f.queryPermission({ mode: 'readwrite' })) !== 'granted') await f.requestPermission({ mode: 'readwrite' }); } catch { }
  await fsPin(f); siReset(); toast(T('sider.ini elegido: el editor lo recuerda para la próxima.'), 5000); siLoad(true);
}
function renderSider(m) {
  const info = SI.info, h = SI.h;
  if (!info && !SI.busy && !SI.err && !SI.perm) siLoad();
  const wrap = x => `<div class="sheet siwrap">${x}${helpCard('sider')}</div>`;
  if (SI.busy || (!info && !SI.err && !SI.perm && !h)) { m.innerHTML = wrap(`<div class="card"><div class="lmload"><span class="spin"></span> Leyendo tu carpeta Sider…</div></div>`); return; }
  if (!h) {
    m.innerHTML = wrap(`<div class="card"><h3>Sider</h3><p class="siintro">Sider es el programa que carga el Parche en el juego. Conectá tu carpeta Sider y acá vas a ver qué mods tiene (escudos, caras, kits, estadios…), qué módulos corre y vas a poder ordenar y prender o apagar cada cosa en sider.ini sin tocar el texto a mano.</p>
      <div class="row"><button class="btn primary big siderbtn" type="button" id="siConnect"><img src="${typeof SIDER_ICON !== 'undefined' ? SIDER_ICON : ''}" alt="" width="22" height="22"> Conectar carpeta Sider</button></div>
      <p class="note">Elegí la carpeta de Sider de tu Parche (la que tiene sider.exe; en Football Life, la carpeta del juego).</p></div>`);
    $('siConnect').onclick = () => connectKits().then(ok => { if (ok) siLoad(true); });
    return;
  }
  if (SI.perm) {
    m.innerHTML = wrap(`<div class="card"><h3>Sider</h3><p>Hace falta tu permiso para volver a leer la carpeta <b>${esc(h.name)}</b>.</p><div class="row"><button class="btn primary" type="button" id="siPerm">Permitir leer la carpeta Sider</button><button class="btn ghost" type="button" id="siOther">Elegir otra carpeta</button></div></div>`);
    $('siPerm').onclick = async () => { try { if ((await h.requestPermission({ mode: 'read' })) === 'granted') { await fsPinnedAsk(); siLoad(true); } } catch (e) { toast('No se pudo: ' + e.message, 5000); } };
    $('siOther').onclick = () => connectKits().then(ok => { if (ok) siLoad(true); });
    return;
  }
  if (SI.err) {
    const pick = SI.err === 'no-ini' && window.showOpenFilePicker && !h.readOnly && !h.native, hidden = pick && SI.detail && SI.detail.n > 0; // en Chrome la página no ve los .ini: se eligen a mano
    m.innerHTML = wrap(`<div class="card"><h3>Sider</h3><div class="warnbox">${SI.err === 'no-ini' ? hidden ? `<span>El navegador no deja que las páginas vean los archivos .ini (ni .exe ni .dll; pasa en Chrome, Edge, Opera y Brave), así que no encuentro sider.ini en</span> <b>${esc(h.name)}</b> <span>aunque esté. Elegilo vos una vez con el botón de abajo: el editor lo recuerda.</span>` : `No hay sider.ini en <b>${esc(h.name)}</b>. Si tu Sider nunca se abrió, abrilo una vez para que lo cree; si no, elegí la carpeta que tiene sider.exe.` : 'No se pudo leer la carpeta Sider: ' + esc(SI.err)}</div>${SI.err === 'no-ini' && SI.detail ? `<p class="note sidiag">${siNoIniHtml(SI.detail, h)}</p>` : ''}<div class="row">${pick ? `<button class="btn primary" type="button" id="siPick">📄 Elegir sider.ini a mano</button>` : ''}<button class="btn" type="button" id="siAgain">Volver a leer</button><button class="btn ghost" type="button" id="siOther">Elegir otra carpeta</button></div></div>`);
    $('siAgain').onclick = async () => { await fsPinnedAsk(); siLoad(true); }; $('siOther').onclick = () => connectKits().then(ok => { if (ok) siLoad(true); });
    if (pick) $('siPick').onclick = () => siPickIni(h);
    return;
  }
  const dirty = siDirty(), warns = siWarns(info);
  const saveBar = `<div class="row sisave">${dirty ? `<span class="chip warn">Cambios sin guardar</span>` : '<span class="chip ok">sider.ini al día</span>'}<button class="btn primary" type="button" data-si="save" ${dirty && !info.ro ? '' : 'disabled'}>💾 Guardar sider.ini</button><button class="btn ghost" type="button" data-si="undo" ${dirty ? '' : 'disabled'}>Deshacer los cambios</button></div>`;
  const roots = info.roots.map((r, k) => `<div class="sirow ${r.it.off ? 'off' : ''} ${!r.h && !r.outside ? 'miss' : ''}">
      <span class="sinum">${k + 1}</span>${siSw(r.it, 'Prender o apagar esta carpeta (comenta la línea en sider.ini, no la borra)')}
      <div class="simain"><div class="siname"><b>${esc(r.name)}</b><code class="sipath">${esc(r.it.val)}</code></div>
        <div class="sitypes">${r.outside ? '<span class="chip warn" title="Ruta completa a otro lugar: el editor no puede mirar adentro">📍 Carpeta fuera de esta Sider</span>' : !r.h ? '<span class="chip warn">⚠ No existe esa carpeta</span>' : r.types.length ? r.types.map(siChip).join('') + r.types.map(t => t.tool ? siToolChip(t.tool) : '').join('') : '<span class="chip">Contenido sin clasificar</span>'}</div></div>
      ${siAct(r.it, 'Quitar la línea de sider.ini')}</div>`).join('');
  const live = info.live.length ? `<div class="sifree"><span class="lab">En livecpk hay carpetas que no están en sider.ini:</span><div class="row">${info.live.map(l => `<button class="btn small" type="button" data-si="addroot" data-n="${esc(l.name)}" title="Agregar cpk.root = &quot;.\\livecpk\\${esc(l.name)}&quot; al final (menos prioridad)">＋ ${esc(l.name)}${l.types.length ? ' <span class="sub">' + esc(l.types.map(t => t.n).join(' · ')) + '</span>' : ''}</button>`).join('')}</div></div>` : '';
  const mods = info.mods.map((x, k) => `<div class="sirow ${x.it.off ? 'off' : ''} ${x.exists ? '' : 'miss'}">
      <span class="sinum">${k + 1}</span>${siSw(x.it, 'Prender o apagar este módulo (comenta la línea en sider.ini, no la borra)')}
      <div class="simain"><div class="siname"><b>${esc(x.name)}</b>${x.desc ? `<span class="sidesc">${esc(x.desc)}</span>` : ''}</div>
        <div class="sitypes">${x.exists ? '' : '<span class="chip warn">⚠ Falta el archivo en modules</span>'}${x.type && SI_TYPES[x.type] ? siChip(Object.assign(siType(x.type), { sure: true })) : ''}${(() => { const c = info.content.find(c => c.type && c.type === x.type); return c ? `<span class="chip">📂 content\\${esc(c.name)}</span>` : ''; })()}${x.type && siType(x.type).tool ? siToolChip(siType(x.type).tool) : ''}</div></div>
      ${siAct(x.it, 'Quitar la línea de sider.ini')}</div>`).join('');
  const modFree = info.modFree.length ? `<div class="sifree"><span class="lab">En la carpeta modules hay módulos que no están en sider.ini:</span><div class="row">${info.modFree.map(x => `<button class="btn small" type="button" data-si="addmod" data-n="${esc(x.name)}" title="${esc(x.desc || 'Agregar lua.module al final')}">＋ ${esc(x.name)}</button>`).join('')}</div></div>` : '';
  const content = info.content.length ? `<div class="sigrid">${info.content.map(c => { const t = c.type ? siType(c.type) : null, tool = t && t.tool ? SI_TOOLS[t.tool] : null; return `<div class="sifold">
      <span class="siico" aria-hidden="true">${t ? t.ico : '📁'}</span><div class="sifbody"><b>${esc(c.name)}</b><span class="sub">${esc(c.detail)}</span>
        <span class="sifwhat">${t ? esc(t.n) : 'Carpeta de un módulo'}${c.mod ? ` · la usa <code>${esc(c.mod.name)}</code>${c.mod.it.off ? ' <span class="chip warn tiny">módulo apagado</span>' : ''}` : ''}</span>
        ${tool ? `<span class="sifwhat sitoolline">🛠 <span>En el editor:</span> ${esc(tool[1])}</span>` : ''}</div>
      ${tool && S.f ? `<button class="btn small" type="button" data-go="${esc(t.tool)}">Ir</button>` : ''}</div>`; }).join('')}</div>` : '<p class="note">No hay carpeta content (o está vacía). Ahí dejan sus archivos los módulos: kit-server, caras, cantos…</p>';
  const sets = SI_SET.map(([k, label, type, help, opts]) => {
    const it = siKv(k)[0], v = it ? it.val : null, miss = v == null;
    let ctl;
    if (type === 'b') ctl = `<label class="sw big" title="${esc(label)}"><input type="checkbox" data-set="${k}" ${v === '1' ? 'checked' : ''}><i></i></label>`;
    else if (type === 'n') ctl = `<input type="number" class="sinum-in" data-set="${k}" value="${esc(v ?? '')}" min="0" step="1" placeholder="—">`;
    else ctl = `<select data-set="${k}">${miss ? '<option value="" selected>por defecto</option>' : ''}${opts.map(([o, n]) => `<option value="${o}" ${v === o ? 'selected' : ''}>${o} · ${esc(n)}</option>`).join('')}</select>`;
    return `<div class="siset ${miss ? 'miss' : ''}">${ctl}<div class="sisetl"><span>${esc(label)}</span><code>${k}${miss ? '' : ' = ' + esc(v)}</code>${miss ? '<span class="sub">no está en tu sider.ini: Sider usa su valor por defecto; si lo cambiás acá se agrega la línea</span>' : ''}${help ? `<span class="note">${esc(help)}</span>` : ''}</div></div>`;
  }).join('');
  const others = SI.items.filter(x => x.kind === 'kv' && !SI_MAIN.has(x.key));
  const otherHtml = others.length ? `<details class="siother" ${SI.open.other ? 'open' : ''} data-siopen="other"><summary>Otros ajustes del archivo (${others.length})</summary><div class="siothers">${others.map(x => `<div class="siset ${x.off ? 'off' : ''}">${siSw(x, 'Prender o apagar esta línea')}<code class="sikey">${esc(x.k0)}</code><input type="text" data-oset="${x.id}" value="${esc(x.val)}" spellcheck="false"></div>`).join('')}</div></details>` : '';
  m.innerHTML = wrap(`<div class="card sihead">
      <div class="row" style="justify-content:space-between;align-items:flex-start"><div><h3>Sider</h3><div class="sititle"><img src="${typeof SIDER_ICON !== 'undefined' ? SIDER_ICON : ''}" alt="" width="26" height="26"><b>${esc(info.name)}</b>${info.ver ? `<span class="chip">Sider ${esc(info.ver)}</span>` : ''}${info.inGame ? '<span class="chip" title="sider.exe está junto a PES2021.exe, como en Football Life">🎮 en la carpeta del juego</span>' : ''}${info.ro ? '<span class="chip warn" title="' + esc(RO_MSG) + '">👁 solo para ver</span>' : ''}</div>
        <p class="note">${info.roots.filter(r => !r.it.off).length} ${info.roots.filter(r => !r.it.off).length === 1 ? 'carpeta de contenido' : 'carpetas de contenido'} y ${info.mods.filter(x => !x.it.off).length} ${info.mods.filter(x => !x.it.off).length === 1 ? 'módulo activo' : 'módulos activos'}${info.game.length ? ' · juego: ' + esc(info.game.map(g => g.replace(/^\\/, '')).join(', ')) : ''}</p></div>
        <div class="row"><button class="btn small" type="button" data-si="reload" title="Volver a leer sider.ini y las carpetas">↻ Volver a leer</button><button class="btn small ghost" type="button" data-si="change">Cambiar carpeta…</button></div></div>
      ${saveBar}
      ${info.ro ? `<div class="warnbox"><span>${esc(RO_MSG)}</span> Acá podés mirar todo, pero no guardar.</div>` : ''}
      ${warns.length ? `<div class="siwarns">${warns.map(([t, k]) => `<div class="warnbox row" style="justify-content:space-between"><span><span class="siwi">⚠</span> ${esc(t)}</span>${k ? `<button class="btn small" type="button" data-fix="${k}">Activar</button>` : ''}</div>`).join('')}</div>` : ''}
    </div>
    <div class="card"><h3>Carpetas de contenido · cpk.root</h3>
      <p class="note">Cada carpeta trae archivos del juego cambiados (escudos, caras, kits, estadios…). El orden importa: si dos carpetas tienen el mismo archivo, <b>manda la de más arriba</b>.</p>
      ${roots || '<p class="note">No hay líneas cpk.root en sider.ini.</p>'}${live}
    </div>
    <div class="card"><h3>Módulos Lua · lua.module</h3>
      <p class="note">Los módulos agregan funciones a Sider: el kit server carga los kits desde content, edit21_db le da al editor la base del juego, otros ponen marcadores, cantos o estadios. También se cargan en orden.</p>
      ${mods || '<p class="note">No hay líneas lua.module en sider.ini.</p>'}${modFree}
    </div>
    <div class="card"><h3>Carpeta content</h3>
      <p class="note">Acá dejan sus archivos los módulos. El editor usa <b>kit-server</b> (los kits) y <b>edit21-db</b> (la copia de la base del juego); las caras y los escudos salen de las carpetas de arriba.</p>
      ${content}
    </div>
    <div class="card"><h3>Ajustes de Sider</h3><div class="sisets">${sets}</div>${otherHtml}</div>
    <div class="card"><details class="siraw" ${SI.open.raw ? 'open' : ''} data-siopen="raw"><summary>sider.ini como texto</summary><p class="note">Para los que prefieren el archivo entero. Los cambios de arriba ya están reflejados acá; si editás el texto, tocá "Aplicar texto" y después Guardar.</p><textarea id="siRaw" spellcheck="false" rows="18">${esc(siText())}</textarea><div class="row"><button class="btn small" type="button" data-si="applyraw">Aplicar texto</button>${info.bak ? '<button class="btn small ghost" type="button" data-si="bak" title="Carga la copia de seguridad en el editor: revisala y tocá Guardar">Cargar la copia de seguridad (sider.ini.bak-pes-editor)</button>' : ''}</div></details></div>
    ${saveBar}`);
  m.querySelectorAll('[data-siopen]').forEach(d => d.addEventListener('toggle', () => { SI.open[d.dataset.siopen] = d.open; }));
  m.onclick = async e => {
    const go = e.target.closest('[data-go]'); if (go) { const t = SI_TOOLS[go.dataset.go]; if (t) t[2](); return; }
    const fix = e.target.closest('[data-fix]'); if (fix) { siSet(fix.dataset.fix, '1'); render(); return; }
    const b = e.target.closest('[data-si]'); if (!b || b.tagName === 'INPUT') return;
    const a = b.dataset.si, it = b.dataset.id ? siById(+b.dataset.id) : null;
    if (a === 'up' || a === 'down') { if (it) siMove(it, a === 'up' ? -1 : 1); render(); }
    else if (a === 'del') { if (it) { SI.items.splice(SI.items.indexOf(it), 1); render(); toast('Línea quitada. No se borra del archivo hasta que toques Guardar.', 3500); } }
    else if (a === 'addroot') { siAdd('cpk.root', '.\\livecpk\\' + b.dataset.n); render(); }
    else if (a === 'addmod') { siAdd('lua.module', b.dataset.n); if (siGet('lua.enabled') === '0') toast('Ojo: lua.enabled está en 0, los módulos no corren. Arriba hay un botón para activarlo.', 6000); render(); }
    else if (a === 'save') siSave();
    else if (a === 'undo') { siParse(SI.orig); render(); }
    else if (a === 'reload') { if (siDirty() && !await confirmBox('Hay cambios sin guardar. ¿Volver a leer el archivo y perderlos?')) return; siLoad(true); render(); }
    else if (a === 'change') connectKits().then(ok => { if (ok) siLoad(true); });
    else if (a === 'applyraw') { siParse($('siRaw').value); render(); toast(siDirty() ? 'Texto aplicado. Tocá Guardar para escribirlo en sider.ini.' : 'El texto es igual al archivo.', 3500); }
    else if (a === 'bak') { const f = await sdbFile(SI.h, 'sider.ini.bak-pes-editor'); if (!f) return; siParse(siDecode(new Uint8Array(await f.arrayBuffer())).text); /* misma codificación que sider.ini */ SI.open.raw = true; render(); toast('Copia de seguridad cargada: revisala y tocá Guardar para dejarla como sider.ini.', 6000); }
  };
  m.onchange = e => {
    const t = e.target;
    if (t.dataset.si === 'toggle') { const it = siById(+t.dataset.id); if (it) { it.off = !t.checked; it.ch = true; } render(); return; }
    if (t.dataset.set) { const k = t.dataset.set, v = t.type === 'checkbox' ? (t.checked ? '1' : '0') : t.value.trim(); if (v === '') { const it = siKv(k)[0]; if (it) { it.off = true; it.ch = true; } } else siSet(k, v); render(); return; }
    if (t.dataset.oset) { const it = siById(+t.dataset.oset); if (it) { it.val = t.value.trim(); it.ch = true; } render(); }
  };
}
async function siSave() {
  const h = SI.h, text = siText(); if (!h || text === SI.orig) return;
  if (h.readOnly) { toast(RO_MSG, 8000); return; }
  try { if (h.queryPermission && (await h.queryPermission({ mode: 'readwrite' })) !== 'granted' && (await h.requestPermission({ mode: 'readwrite' })) !== 'granted') { toast('Sin permiso para escribir en la carpeta Sider.', 6000); return; } } catch { }
  try {
    if (!await sdbFile(h, 'sider.ini.bak-pes-editor')) await siWrite(h, 'sider.ini.bak-pes-editor', SI.orig);
    await siWrite(h, 'sider.ini', text);
  } catch (e) { toast('No se pudo guardar sider.ini: ' + e.message, 7000); return; }
  toast('sider.ini guardado (copia en sider.ini.bak-pes-editor). Abrí el juego de nuevo con Sider para que tome los cambios.', 7000);
  await siLoad(true);
  // las fotos y los escudos del editor siguen el orden de sider.ini
  try { if (typeof indexBadges === 'function') indexBadges(h).catch(() => { }); if (typeof indexFaces === 'function') indexFaces(h).catch(() => { }); } catch { }
}

// ---- pantalla de carga: qué se leyó de sider.ini y qué falta (cada parte se traduce por separado) ----
async function siIntroCheck(h) {
  const T = typeof tr === 'function' ? tr : x => x;
  try { await siLoad(true, h); } catch { }
  const info = SI.info; SI.introProbs = null;
  if (!info) return { ok: false, text: T(SI.err === 'no-ini' ? (SI.detail && SI.detail.n > 0 && window.showOpenFilePicker && !h.native ? 'Sider: no veo sider.ini (el navegador oculta los .ini a las páginas): elegilo a mano en la pestaña Sider.' : 'Sider: en la carpeta no hay sider.ini (abrí Sider una vez para que lo cree).') : 'Sider: no se pudo leer sider.ini.') };
  const roots = info.roots.filter(r => !r.it.off), miss = roots.filter(r => !r.h && !r.outside), out = roots.filter(r => r.outside);
  const mods = info.mods.filter(x => !x.it.off), mmiss = mods.filter(x => !x.exists);
  const kinds = []; for (const r of roots) for (const t of r.types) if (!kinds.includes(t.n)) kinds.push(t.n);
  const kit = info.content.some(c => c.type === 'kits'), db = info.content.some(c => /edit21-db/i.test(c.name));
  const probs = [];
  if (siGet('livecpk.enabled') === '0') probs.push(T('livecpk apagado (livecpk.enabled = 0)'));
  if (siGet('lua.enabled') === '0' && mods.length) probs.push(T('módulos apagados (lua.enabled = 0)'));
  if (miss.length) probs.push(`${miss.length} ${T(miss.length === 1 ? 'carpeta no existe' : 'carpetas no existen')} (${miss.map(r => r.name).slice(0, 3).join(', ')}${miss.length > 3 ? '…' : ''})`);
  if (mmiss.length) probs.push(`${mmiss.length} ${T(mmiss.length === 1 ? 'módulo falta' : 'módulos faltan')} (${mmiss.map(x => x.name).slice(0, 3).join(', ')}${mmiss.length > 3 ? '…' : ''})`);
  const base = `${T(`sider.ini leído: ${roots.length} ${roots.length === 1 ? 'carpeta de contenido' : 'carpetas de contenido'} y ${mods.length} ${mods.length === 1 ? 'módulo' : 'módulos'}`)}${kinds.length ? ' · ' + kinds.slice(0, 6).map(T).join(', ') : ''}${kit ? ' · kit-server' : ' · ' + T('sin kit-server')}${db ? ' · edit21-db' : ''}${out.length ? ` · ${out.length} ${T('en otra carpeta')}` : ''}`;
  SI.introProbs = probs.length ? probs : null;
  return { ok: !probs.length, probs, text: base + '.', warn: probs.length ? `${T('Revisar')}: ${probs.join('; ')}.` : '' };
}
