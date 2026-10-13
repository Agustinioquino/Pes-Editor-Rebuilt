// ===================== Kits (Sider kit-server) =====================
const KIT_LS = 'edit21-kits-v1';
const KITS = { map: new Map(), from: '', when: 0 };
function kitsLoadCache() { try { const j = JSON.parse(localStorage.getItem(KIT_LS) || 'null'); if (j) { KITS.map = new Map(j.teams); KITS.from = j.from; KITS.when = j.when; } } catch { } }
function kitsSaveCache() { try { localStorage.setItem(KIT_LS, JSON.stringify({ teams: [...KITS.map], from: KITS.from, when: KITS.when })); } catch { } }
async function subDir(dir, path) { for (const seg of path.split(/[\\/]/).filter(Boolean)) dir = await dir.getDirectoryHandle(seg); return dir; }
async function readText(dir, name) { try { const h = await dir.getFileHandle(name); return (await (await h.getFile()).text()).replace(/^﻿/, ''); } catch { return null; } }
const lines = txt => (txt || '').split(/\r?\n/).map(l => l.replace(/[;#].*$/, '').trim()).filter(Boolean);
function parseKitCfg(txt, n) {
  const g = k => { const m = txt.match(new RegExp('^\\s*' + k + '\\s*=\\s*([^;\\r\\n]*)', 'mi')); return m ? m[1].trim() : null; };
  const col = v => /^#[0-9a-f]{6}$/i.test(v || '') ? v.toLowerCase() : null;
  const c1 = col(g('ShirtColor1')) || col(g('UniColor_Color1')); if (!c1) return null;
  return { n, c1, c2: col(g('ShirtColor2')) || col(g('UniColor_Color2')) || c1, sh: col(g('ShortsColor')) || c1, so: col(g('SocksColor')) || c1, t: g('TightKit') === '1' ? 1 : 0 };
}
async function connectKits() {
  if (!window.showDirectoryPicker) { toast('Tu navegador no permite abrir carpetas. Usá Chrome o Edge.'); return; }
  let dir;
  try { dir = await window.showDirectoryPicker({ id: 'edit21kits', mode: 'readwrite' }); } catch (e) { if (e.name !== 'AbortError') toast('No se pudo abrir: ' + e.message); return; }
  let root = null;
  for (const p of ['', 'kit-server', 'content/kit-server']) { try { const d = p ? await subDir(dir, p) : dir; if (await readText(d, 'map.txt') != null) { root = d; break; } } catch { } }
  if (!root) { toast('No encontré content\\kit-server\\map.txt ahí. Elegí la carpeta de Sider de tu Parche (la que tiene sider.exe).', 8000); return; }
  const map = lines(await readText(root, 'map.txt')).map(l => l.match(/^(\d+)\s*,\s*"([^"]+)"/)).filter(Boolean).map(m => [+m[1], m[2]]);
  const out = new Map(); let done = 0;
  const t = $('toast'); t.hidden = false; clearTimeout(toastT);
  const work = async ([id, path]) => {
    try {
      const d = await subDir(root, path);
      const ord = lines(await readText(d, 'order.ini')), gk = lines(await readText(d, 'gk_order.ini'));
      const read = async n => { try { const c = await readText(await d.getDirectoryHandle(n), 'config.txt'); return c ? parseKitCfg(c, n) : null; } catch { return null; } };
      const k = (await Promise.all((ord.length ? ord : ['p1', 'p2']).slice(0, 4).map(read))).filter(Boolean);
      const g = (await Promise.all((gk.length ? gk : ['g1']).slice(0, 2).map(read))).filter(Boolean);
      if (k.length || g.length) out.set(id, { k, g, path });
    } catch { }
    done++; if (done % 40 === 0) t.textContent = `Leyendo kits… ${done}/${map.length}`;
  };
  const q = map.slice(); await Promise.all(Array.from({ length: 12 }, async () => { while (q.length) await work(q.shift()); }));
  KITS.map = out; KITS.from = dir.name; KITS.when = Date.now(); kitsSaveCache(); RATE_GEN++;
  let sider = dir; try { if (!(await readText(dir, 'sider.exe') !== null || await dir.getDirectoryHandle('livecpk'))) sider = dir; } catch { }
  try { await indexFaces(sider); idbSet('sider', sider); FACES.needsPerm = null; } catch { }
  try { await indexBadges(sider); } catch { }
  // names from the edit21_db Sider module dump (content\edit21-db\Player.bin)
  let namesMsg = '';
  try {
    let content = null;
    for (const p of ['content', '']) { try { const d = p ? await subDir(dir, p) : dir; await d.getDirectoryHandle('edit21-db'); content = d; break; } catch { } }
    if (content) {
      const h = await (await content.getDirectoryHandle('edit21-db')).getFileHandle('Player.bin');
      const m = await namesFromBin(new Uint8Array(await (await h.getFile()).arrayBuffer()));
      S.names = m; S.namesFrom = 'Parche (base del juego)'; namesSave(); RATE_GEN++;
      namesMsg = ` y ${m.size.toLocaleString('es-AR')} nombres de jugadores`;
    } else namesMsg = '. Para los nombres, abrí el juego una vez con el módulo edit21_db activo';
  } catch { namesMsg = '. Todavía no está la copia de la base: abrí el juego una vez hasta el menú principal y volvé a conectar'; }
  if (typeof sdbSetup === 'function') { try { await sdbSetup(sider, true); } catch { } }
  toast(`Kits cargados: ${out.size} equipos${namesMsg}${FACES.count ? ', ' + FACES.count.toLocaleString('es-AR') + ' minifaces' : ''}${BADGES.count ? ' y ' + BADGES.count + ' escudos locales' : ''}.`, 7000); render();
}
function teamKits(t) {
  const k = KITS.map.get(t.id); if (k && (k.k.length || k.g.length)) return k;
  const a = teamColor(t, 1), b = teamColor(t, 2);
  return { k: [{ n: 'p1', c1: a, c2: b, sh: a, so: a, t: 0 }], g: [], fallback: true };
}
function kitFor(t, gk) { const k = teamKits(t); return (gk && k.g[0]) || k.k[0] || k.g[0]; }
const KIT_LABEL = n => ({ p1: 'Local', p2: 'Visitante', p3: 'Alternativa', p4: 'Cuarta', g1: 'Arquero 1', g2: 'Arquero 2', g3: 'Arquero 3' }[n] || n.replace('-alt', ' (manga larga)').replace(/^p/, 'Jugador ').replace(/^g/, 'Arquero '));
function shirtPaths(tight) {
  return tight
    ? { body: 'M11.5 4 L7.5 5.5 L4 11 L7.6 13 L9 11.2 V29 H23 V11.2 L24.4 13 L28 11 L24.5 5.5 L20.5 4 Q16 7.5 11.5 4 Z', sl: 'M7.5 5.5 L4 11 L7.6 13 L9 11.2 L9.6 7 Z', sr: 'M24.5 5.5 L28 11 L24.4 13 L23 11.2 L22.4 7 Z', col: 'M11.5 4 Q16 7.5 20.5 4' }
    : { body: 'M11 4 L6 6 L1.5 12.5 L6 15.5 L8 13 V29 H24 V13 L26 15.5 L30.5 12.5 L26 6 L21 4 Q16 8 11 4 Z', sl: 'M6 6 L1.5 12.5 L6 15.5 L8.2 12.6 L9 7.5 Z', sr: 'M26 6 L30.5 12.5 L26 15.5 L23.8 12.6 L23 7.5 Z', col: 'M11 4 Q16 8 21 4' };
}
function shirtSvg(k, size = '1.15em', title = '') {
  if (!k) return '';
  const p = shirtPaths(k.t);
  return `<svg class="kit" viewBox="0 0 32 32" width="${size}" height="${size}" role="img" aria-label="${esc(title || 'Camiseta')}"><title>${esc(title || KIT_LABEL(k.n))}</title>
    <path d="${p.body}" fill="${k.c1}"/><path d="${p.sl}" fill="${k.c2}"/><path d="${p.sr}" fill="${k.c2}"/>
    <path d="${p.col}" fill="none" stroke="${k.c2}" stroke-width="2"/><path d="${p.body}" fill="none" stroke="#0008" stroke-width="1" stroke-linejoin="round"/></svg>`;
}
function fullKitSvg(k, w = 54) {
  if (!k) return '';
  const p = shirtPaths(k.t);
  return `<svg class="kit" viewBox="0 0 32 52" width="${w}" height="${Math.round(w * 52 / 32)}" role="img" aria-label="${esc(KIT_LABEL(k.n))}"><title>${esc(KIT_LABEL(k.n))}</title>
    <path d="M8 29.5 H24 L25 40 H17.2 L16 35.5 L14.8 40 H7 Z" fill="${k.sh}" stroke="#0008" stroke-width="1" stroke-linejoin="round"/>
    <rect x="9" y="41.5" width="5" height="9" rx="1" fill="${k.so}" stroke="#0008" stroke-width="1"/><rect x="18" y="41.5" width="5" height="9" rx="1" fill="${k.so}" stroke="#0008" stroke-width="1"/>
    <path d="${p.body}" fill="${k.c1}"/><path d="${p.sl}" fill="${k.c2}"/><path d="${p.sr}" fill="${k.c2}"/>
    <path d="${p.col}" fill="none" stroke="${k.c2}" stroke-width="2"/><path d="${p.body}" fill="none" stroke="#0008" stroke-width="1" stroke-linejoin="round"/></svg>`;
}
function kitStrip(t) {
  const k = teamKits(t), all = [...k.k, ...k.g];
  return `<div class="kitstrip">${all.map(x => `<figure>${fullKitSvg(x, 40)}<figcaption>${esc(KIT_LABEL(x.n))}</figcaption></figure>`).join('')}
    ${k.fallback ? `<p class="note" style="align-self:center;max-width:32ch">Vista según los colores del equipo. <button class="btn small" type="button" data-kits>Conectar kits del Parche</button></p>` : ''}</div>`;
}

// ===================== Formations / tactics =====================
const PLAN_SZ = 0xA0, ENT_SZ = 0x21;
const planOff = (t, plan) => t.tacticsBase + 4 + plan * PLAN_SZ;
const STRAT_BIN = [
  ['att', 0x63, 'Estilo de ataque', ['Contraataque', 'Posesión']],
  ['att', 0x64, 'Construcción', ['Pase largo', 'Pase corto']],
  ['att', 0x65, 'Zona de ataque', ['Por las bandas', 'Por el centro']],
  ['att', 0x66, 'Posicionamiento', ['Mantener formación', 'Flexible']],
  ['def', 0x67, 'Estilo defensivo', ['Presión arriba', 'Defensa total']],
  ['def', 0x68, 'Zona de contención', ['Opción 1', 'Opción 2'], true],
  ['def', 0x69, 'Presión', ['Agresiva', 'Conservadora']],
];
const STRAT_RANGE = [
  ['att', 0x8C, 'Rango de apoyo', 1, 10, 'Cerca', 'Lejos'],
  ['att', 0x8D, 'Jugadores que llegan al área', 1, 3, 'Menos', 'Más', true],
  ['def', 0x8E, 'Línea defensiva', 1, 10, 'Baja', 'Alta'],
  ['def', 0x8F, 'Compactación', 1, 10, 'Abierta', 'Compacta'],
  ['def', 0x90, 'Ajuste defensivo extra', 1, 3, '1', '3', true],
];
const ADV_ATT = { 0: 'Ninguna', 1: 'Anclaje (probable)', 3: 'Falso 9 (probable)', 4: 'Laterales ofensivos (probable)', 6: 'Tiki-taka (probable)', 7: 'Centros al área (probable)' };
const ADV_DEF = { 0: 'Ninguna', 13: 'Gegenpress (probable)' };
const STRAT_PRESETS = {
  'Posesión': { 0x63: 1, 0x64: 1, 0x65: 1, 0x66: 1, 0x67: 0, 0x69: 0, 0x8C: 2, 0x8E: 9, 0x8F: 2 },
  'Contraataque': { 0x63: 0, 0x64: 0, 0x66: 0, 0x67: 1, 0x69: 1, 0x8C: 7, 0x8E: 4, 0x8F: 7 },
  'Presión alta': { 0x63: 1, 0x66: 1, 0x67: 0, 0x69: 0, 0x8C: 4, 0x8E: 10, 0x8F: 3 },
  'Bloque bajo': { 0x63: 0, 0x64: 0, 0x66: 0, 0x67: 1, 0x69: 1, 0x8C: 8, 0x8E: 2, 0x8F: 10 },
  'Equilibrado': { 0x63: 1, 0x64: 1, 0x66: 0, 0x67: 0, 0x69: 0, 0x8C: 5, 0x8E: 5, 0x8F: 5 },
};
function strategyCard(t) {
  const b = planOff(t, S.fplan), v = o => S.d[b + o];
  const bin = side => STRAT_BIN.filter(x => x[0] === side).map(([, o, n, opts, unsure]) => `<div class="f"><span class="lab">${n}${unsure ? ' <span class="chip">sin confirmar</span>' : ''}</span>${opts.length === 2 ? `<div class="pswitch" data-st="${o}" data-on="${v(o) ? 1 : 0}" role="group" aria-label="${esc(n)}">${opts.map((l, i) => `<button type="button" data-v="${i}" aria-pressed="${v(o) === i}">${l}</button>`).join('')}<span class="knob" aria-hidden="true"><svg viewBox="0 0 24 24" width="13" height="13"><path d="M12 3v8" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M7.1 6.6a7 7 0 1 0 9.8 0" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></span></div>` : `<div class="seg" data-st="${o}">${opts.map((l, i) => `<button type="button" data-v="${i}" aria-pressed="${v(o) === i}">${l}</button>`).join('')}</div>`}</div>`).join('');
  const rng = side => STRAT_RANGE.filter(x => x[0] === side).map(([, o, n, min, max, lo, hi, unsure]) => `<div class="f"><span class="lab">${n}${unsure ? ' <span class="chip">sin confirmar</span>' : ''}</span><div class="srange"><span>${lo}</span><input type="range" min="${min}" max="${max}" value="${v(o)}" data-sr="${o}" aria-label="${n}"><span>${hi}</span><output>${v(o)}</output></div></div>`).join('');
  const adv = (o, map, lo, hi) => { const cur = v(o); const opts = []; for (let i = lo; i <= hi; i++) opts.push(i); if (!opts.includes(cur)) opts.push(cur); return `<select data-adv="${o}">${[0, ...opts.filter(x => x)].map(i => `<option value="${i}" ${i === cur ? 'selected' : ''}>${map[i] || 'Instrucción código ' + i}</option>`).join('')}</select>`; };
  return `<div class="card"><div class="row" style="justify-content:space-between"><h3>Estrategia · plan ${S.fplan + 1}</h3>
    <div class="row"><span class="lab">Rápido:</span>${Object.keys(STRAT_PRESETS).map(k => `<button class="btn small" type="button" data-spreset="${k}">${k}</button>`).join('')}</div></div>
    <div class="stratgrid">
      <div class="group"><h4>Con la pelota</h4>${bin('att')}${rng('att')}<div class="f"><span class="lab">Instrucción avanzada ofensiva</span>${adv(0x6C, ADV_ATT, 1, 9)}</div></div>
      <div class="group"><h4>Sin la pelota</h4>${bin('def')}${rng('def')}<div class="f"><span class="lab">Instrucción avanzada defensiva</span>${adv(0x7C, ADV_DEF, 10, 17)}</div></div>
    </div>
    <div class="row"><span class="lab">Copiar este plan (formación y estrategia) a:</span>${[0, 1, 2].filter(p => p !== S.fplan).map(p => `<button class="btn small" type="button" data-copyplan="${p}">Plan ${p + 1}</button>`).join('')}</div>
    <p class="note">Los nombres los deduje comparando equipos conocidos (Barcelona, City y PSG: posesión, pase corto y línea alta; Getafe, Stoke e Islandia: contraataque y bloque compacto). Lo marcado "sin confirmar" o "probable" conviene verificarlo con "Comparar con otro EDIT" en la pestaña Archivo.</p>
  </div>`;
}
const FORM_PRESETS = {
  '4-4-2': [[1, 10, 63], [1, 10, 41], [3, 12, 89], [2, 12, 15], [5, 22, 63], [5, 22, 41], [7, 25, 86], [6, 25, 18], [12, 42, 62], [12, 42, 42]],
  '4-3-3': [[1, 10, 63], [1, 10, 41], [3, 12, 89], [2, 12, 15], [4, 18, 52], [5, 24, 68], [5, 24, 36], [10, 38, 86], [9, 38, 18], [12, 43, 52]],
  '4-2-3-1': [[1, 10, 63], [1, 10, 41], [3, 12, 89], [2, 12, 15], [4, 18, 64], [4, 18, 40], [8, 32, 52], [10, 42, 85], [9, 42, 19], [12, 43, 52]],
  '4-1-2-1-2': [[1, 10, 63], [1, 10, 41], [3, 12, 89], [2, 12, 15], [4, 18, 52], [5, 24, 68], [5, 24, 36], [8, 32, 52], [12, 42, 62], [12, 42, 42]],
  '4-1-4-1': [[1, 10, 63], [1, 10, 41], [3, 12, 89], [2, 12, 15], [4, 18, 52], [5, 26, 64], [5, 26, 40], [7, 28, 86], [6, 28, 18], [12, 43, 52]],
  '3-5-2': [[1, 10, 52], [1, 10, 73], [1, 10, 31], [4, 19, 64], [4, 19, 40], [7, 25, 86], [6, 25, 18], [8, 33, 52], [12, 43, 64], [12, 43, 40]],
  '3-4-3': [[1, 10, 52], [1, 10, 73], [1, 10, 31], [5, 22, 63], [5, 22, 41], [7, 24, 88], [6, 24, 16], [10, 38, 84], [9, 38, 20], [12, 43, 52]],
  '5-3-2': [[1, 10, 52], [1, 10, 73], [1, 10, 31], [3, 15, 89], [2, 15, 15], [4, 20, 52], [5, 24, 70], [5, 24, 34], [12, 42, 62], [12, 42, 42]],
  '5-4-1': [[1, 10, 52], [1, 10, 73], [1, 10, 31], [3, 14, 89], [2, 14, 15], [5, 22, 63], [5, 22, 41], [7, 27, 86], [6, 27, 18], [12, 42, 52]],
};
const formOff = (t, plan, v) => t.tacticsBase + 4 + plan * PLAN_SZ + v * ENT_SZ;
function readForm(t, plan, v) { const o = formOff(t, plan, v); return { roles: [0, ...S.d.subarray(o + 1, o + 11)], pos: Array.from({ length: 11 }, (_, i) => [S.d[o + 11 + i * 2], S.d[o + 12 + i * 2]]) }; }
function writeForm(t, plan, v, f) { const o = formOff(t, plan, v); for (let i = 1; i <= 10; i++) S.d[o + i] = f.roles[i]; for (let i = 0; i < 11; i++) { S.d[o + 11 + i * 2] = f.pos[i][0]; S.d[o + 12 + i * 2] = f.pos[i][1]; } }
const fluidKey = t => t.id + ':' + S.fplan;
const FLUID = new Map();
function isFluid(t) { return FLUID.has(fluidKey(t)) ? FLUID.get(fluidKey(t)) : !variantsEqual(t, S.fplan); }
let CUR_T = null;
const formVariants = () => (CUR_T && isFluid(CUR_T)) ? [S.fvar] : [0, 1, 2];
function formName(f) {
  const lines = { d: 0, m: 0, a: 0 };
  for (let i = 1; i <= 10; i++) { const y = f.pos[i][0]; if (y <= 16) lines.d++; else if (y <= 34) lines.m++; else lines.a++; }
  return `${lines.d}-${lines.m}-${lines.a}`;
}
function variantsEqual(t, plan) { const a = S.d.subarray(formOff(t, plan, 0), formOff(t, plan, 0) + ENT_SZ); return [1, 2].every(v => S.d.subarray(formOff(t, plan, v), formOff(t, plan, v) + ENT_SZ).every((x, i) => x === a[i])); }
function tacticsCard(t) {
  if (t.tacticsBase == null) return '<div class="card empty">Este equipo no tiene tácticas en el archivo.</div>';
  CUR_T = t; const fluid = isFluid(t); if (!fluid) S.fvar = 0;
  const PV = LM.view === 'match' ? lmPreview(t) : null;
  const f = readForm(t, S.fplan, S.fvar), order = getOrder(t), roster = PD.roster(S.d, t);
  const bySlot = new Map(roster.map(x => [x.slot, x]));
  const kitP = kitFor(t, false), kitG = kitFor(t, true) || kitP;
  const sel = S.fsel;
  const photos = PREFS.look === 'photos';
  const lineCls = r => ['gk', 'df', 'df', 'df', 'mf', 'mf', 'mf', 'mf', 'mf', 'fw', 'fw', 'fw', 'fw'][r];
  const marker = i => {
    const x = bySlot.get(order[i]), role = i ? f.roles[i] : 0, kit = i ? kitP : kitG;
    const full = x ? playerName(x.pid) : '', short = full ? full.split(' ').slice(-1)[0] : '';
    const [y, lx] = f.pos[i];
    const avatar = photos ? faceHtml(x && x.pid, kit, 'big') : `<span class="shirtwrap">${shirtSvg(kit, '100%')}</span>`;
    return `<button type="button" class="fm ln-${lineCls(role)} ${sel === i ? 'on' : ''} ${i ? '' : 'gk'} ${photos ? 'ph' : ''}" data-fi="${i}" style="left:${Math.max(5, Math.min(95, lx))}%;bottom:${3 + y / 50 * 94}%" title="${esc(full || 'ID ' + (x ? x.pid : ''))} · ${POS_LONG[role]}${x ? ' · ID ' + x.pid : ''}">
      <span class="fav">${avatar}<span class="fnum">${x ? x.number : ''}</span></span>
      <span class="fname">${esc(short || (x ? 'ID ' + x.pid : '—'))}</span>
      <span class="fmeta"><span class="posb ${POS_GRP[role]}">${POS[role]}</span>${(() => { const pi = x && pInfoAt(x.pid, role); return rateHtml(pi); })()}${PREFS.showIds && x ? `<span class="fid">${x.pid}</span>` : ''}</span></button>`;
  };
  const bench = order.slice(11).filter(s => bySlot.has(s)).map(s => bySlot.get(s));
  const selX = sel != null ? bySlot.get(order[sel]) : null;
  const c1 = kitP.c1, c2 = kitP.c2;
  const themes = [['clasico', 'Clásico'], ['noche', 'Nocturno'], ['atardecer', 'Atardecer'], ['pizarra', 'Pizarra'], ['retro', 'Retro'], ['equipo', 'Colores del equipo']];
  const lines = { d: 0, m: 0, a: 0 }; for (let i = 1; i <= 10; i++) { const yy = f.pos[i][0]; if (yy <= 16) lines.d++; else if (yy <= 34) lines.m++; else lines.a++; }
  return `<div class="card fcard ${PV ? 'pvmode' : ''}">
    <div class="fbanner" style="--k1:${c1};--k2:${c2}">
      <div class="fbteam">${crest(t, '', true)}<div class="fbt"><span class="fbig">${esc(PV ? (PV.fx.formation || formName(f)) : formName(f))}</span><span class="fsub">${esc(tget(t, 'name'))} · plan ${S.fplan + 1}${fluid ? ' · fluida · ' + ['Base', 'Ataque', 'Defensa'][S.fvar] : ''}</span></div></div>
      ${(() => { const tr = teamRating(t); return tr ? `<div class="frate"><span class="frnum">${tr.score}</span><div class="frbox">${starsHtml(tr.stars)}<span class="frl">Valoración del equipo${PREFS.rateMode !== 'base' ? ' · por rendimiento' : ''}</span><span class="frv">Valor estimado ${fmtMoney(tr.value)}</span></div></div>` : `<div class="frate"><div class="frbox"><span class="frl">Valoración</span><span class="frv">Conectá la carpeta Sider para calcularla</span></div></div>`; })()}
      <div class="flines"><span class="ln-df">${lines.d}<small>DEF</small></span><span class="ln-mf">${lines.m}<small>MED</small></span><span class="ln-fw">${lines.a}<small>ATA</small></span></div>
    </div>
    <div class="ftools">
      <div class="row"><span class="lab">Plan</span>${seg2('fplan', ['1', '2', '3'], S.fplan)}
        <span class="lab">Formación fluida</span><div class="seg" id="fluid"><button type="button" data-v="0" aria-pressed="${!fluid}">No</button><button type="button" data-v="1" aria-pressed="${fluid}">Sí</button></div>
        ${fluid ? `<span class="lab">Editando</span>${seg2('fvar', ['Base', 'Ataque', 'Defensa'], S.fvar)}` : ''}</div>
      <div class="row"><span class="lab">Ver jugadores con</span><div class="seg" id="flook"><button type="button" data-v="kits" aria-pressed="${!photos}">Camisetas</button><button type="button" data-v="photos" aria-pressed="${photos}">Fotos</button></div>
        <span class="lab">Cancha</span><select id="ftheme" style="width:auto">${themes.map(([k, n]) => `<option value="${k}" ${PREFS.theme === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <label class="chk"><input type="checkbox" id="fids" ${PREFS.showIds ? 'checked' : ''}> Mostrar IDs</label></div>
      <div class="row"><span class="lab">Valoración</span><div class="seg" id="fRate" title="Qué número se ve en cada jugador y en la valoración del equipo">${[['base', '🎮 Del juego'], ['form', '📈 Por rendimiento'], ['cmp', '⚖ Comparar']].map(([k, n]) => `<button type="button" data-v="${k}" aria-pressed="${PREFS.rateMode === k}">${n}</button>`).join('')}</div>
        ${PD.roster(S.d, t).some(x => LM.adj.has(x.pid)) ? '' : '<span class="note">Para ver la forma, buscá los últimos partidos reales abajo.</span>'}</div>
      ${photos ? `<div class="row photobar">${FACES.needsPerm ? '<button class="btn small" type="button" id="fgrant">Permitir leer las minifaces del Parche</button>' : FACES.count ? `<span class="chip ok">${FACES.count.toLocaleString('es-AR')} minifaces del Parche</span>` : '<span class="chip warn">Sin minifaces: tocá "Conectar carpeta Sider"</span>'}
        <label class="chk"><input type="checkbox" id="fonline" ${PREFS.online ? 'checked' : ''}> Buscar en internet las que falten</label>
        ${PREFS.online ? '<span class="note">Fuente: TheSportsDB (por nombre y club). Se guardan para no volver a buscarlas.</span>' : ''}</div>` : ''}
      <div class="row"><span class="lab">Plantillas:</span>${Object.keys(FORM_PRESETS).map(k => `<button class="btn small" type="button" data-preset="${k}">${k}</button>`).join('')}</div>
    </div>
    ${lastMatchCard(t)}
    <div class="formwrap">
      <div class="fpitch th-${PREFS.theme} ${PV ? 'pv' : ''}" id="${PV ? 'fpitchPv' : 'fpitch'}" style="--k1:${c1};--k2:${c2};background-image:url(${pitchTexture(PREFS.theme, c1, c2)})">
        ${PV ? PV.ents.map((e, i) => pvMarker(t, PV, e, i, kitP, kitG, photos)).join('') : Array.from({ length: 11 }, (_, i) => marker(i)).join('')}
        <span class="fdir">ATAQUE ↑</span>${PV ? `<span class="fpvtag">📺 ${esc(PV.fx.home ? 'vs' : '@')} ${esc(PV.fx.opp)} ${PV.fx.gf}-${PV.fx.ga} · ${fmtDate(PV.fx.date)}</span>` : ''}</div>
      <div class="fside">
        ${PV ? pvSide(t, PV) : ''}
        ${PV ? '' : sel == null ? '<div class="hint-card"><b>Cómo se usa</b><span>Arrastrá a cada jugador para moverlo. Soltalo encima de otro titular para intercambiarlos de lugar. Tocalo para cambiarle el rol.</span></div>' : `
          <div class="selcard" style="--k1:${c1};--k2:${c2}">${photos ? faceHtml(selX && selX.pid, sel ? kitP : kitG, 'mid') : shirtSvg(sel ? kitP : kitG, '3em')}
            <div><b>${esc(selX ? playerName(selX.pid) || 'ID ' + selX.pid : '—')}</b><span class="sub">#${selX ? selX.number : ''} · ${POS_LONG[sel ? f.roles[sel] : 0]}${selX ? ' · ID ' + selX.pid : ''}</span></div></div>
          ${photos && selX ? faceTools(selX.pid) : ''}
          ${sel ? `<div class="f"><label for="frole">Rol en la formación</label><select id="frole">${POS.map((p, i) => i ? `<option value="${i}" ${i === f.roles[sel] ? 'selected' : ''}>${p} · ${POS_LONG[i]}</option>` : '').join('')}</select></div>` : '<p class="note">El arquero siempre va al arco; podés cambiar quién ataja.</p>'}
          <div class="f"><label for="fswap">Poner en su lugar a…</label><select id="fswap"><option value="">Elegí un jugador</option>${roster.filter(x => x.slot !== order[sel]).map(x => `<option value="${x.slot}">#${x.number} ${esc(playerName(x.pid) || 'ID ' + x.pid)}${order.indexOf(x.slot) < 11 ? ' (titular)' : ''}</option>`).join('')}</select></div>
          <button class="btn small" type="button" id="fdesel">Listo</button>`}
        <h3>Banco de suplentes · ${bench.length}</h3>
        <p class="note">Para hacer un cambio, arrastrá un suplente sobre un titular de la cancha. También podés tocar al suplente y después al titular.</p>
        <div class="bench">${bench.map(x => { const pi = pInfo(x.pid); return `<button type="button" class="bn ${S.fbench === x.slot ? 'on' : ''}" data-bslot="${x.slot}" title="Arrastralo sobre un titular para hacer el cambio">
          ${photos ? faceHtml(x.pid, kitP, 'sm') : shirtSvg(kitP, '1.6em')}<span class="bnn">${x.number}</span><span class="bnm">${esc(playerName(x.pid) || 'ID ' + x.pid)}${PREFS.showIds ? `<small>ID ${x.pid}</small>` : ''}</span>${pi ? posBadge(pi.pos) : ''}${rateHtml(pi, 'b')}</button>`; }).join('') || '<span class="note">Sin suplentes.</span>'}</div>
        <p class="note">${fluid ? 'Con formación fluida el equipo cambia de forma: "Ataque" es cómo se para con la pelota y "Defensa" sin ella (orden de variantes deducido; verificalo en el juego).' : 'Sin formación fluida el equipo usa siempre esta formación (el editor la guarda igual en las 3 variantes).'}</p>
      </div>
    </div></div>
  ${strategyCard(t)}
  ${setPieceCard(t)}`;
}
// ---- capitán y lanzadores de balón parado: 9 bytes antes del capitán, en el orden del menú del juego (verificado en PES 2021) ----
// [nombre, puntaje para elegir automáticamente, sin confirmar]; los 3 "ofensivos" son los que suben al área en las jugadas de balón parado
const SP_ROLES = [
  ['Tiro libre largo', a => a('place_kick') * 2 + a('kick_pwr') * 2 + a('swerve')],
  ['Tiro libre corto', a => a('place_kick') * 2 + a('swerve') * 2],
  ['Tirador 2 (tiro libre corto)', a => a('place_kick') * 2 + a('swerve') * 2],
  ['Córner izquierdo', a => a('swerve') * 2 + a('loftpass') + a('place_kick'), true],
  ['Córner derecho', a => a('swerve') * 2 + a('loftpass') + a('place_kick'), true],
  ['Penales', a => a('finish') * 2 + a('place_kick') + a('kick_pwr') + (a('sk36') ? 20 : 0)],
  ['Jugador ofensivo 1', a => a('header') * 2 + a('jump') + a('phys_cont')],
  ['Jugador ofensivo 2', a => a('header') * 2 + a('jump') + a('phys_cont')],
  ['Jugador ofensivo 3', a => a('header') * 2 + a('jump') + a('phys_cont')],
];
// elige un titular de campo por rol; tirador 2 y los ofensivos no repiten a quien ya tiene ese rol
function autoTakers(t) {
  const roster = PD.roster(S.d, t), xi = getOrder(t).slice(1, 11).map(s => roster.find(x => x.slot === s)).filter(Boolean);
  const ab = new Map(xi.map(x => { const g = abilOf(x.pid); if (!g) return [x.slot, null]; const p = S.ix.byId.get(x.pid); return [x.slot, k => (k === 'sk36' ? (p ? pget(p, 'sk36') : 0) : g(k))]; }));
  if (!xi.length || xi.some(x => !ab.get(x.slot))) return null;
  const pick = (k, not = []) => xi.filter(x => !not.includes(x.slot)).sort((x, y) => SP_ROLES[k][1](ab.get(y.slot)) - SP_ROLES[k][1](ab.get(x.slot)))[0];
  const out = []; for (let k = 0; k < NTAKERS; k++) {
    const not = k === 2 ? [out[1]] : k >= 6 ? [out[3], out[4], ...out.slice(6)] : [];
    const x = pick(k, not) || pick(k); out.push(x.slot);
  }
  return out;
}
function setPieceCard(t) {
  const roster = PD.roster(S.d, t), bySlot = new Map(roster.map(x => [x.slot, x])), xi = getOrder(t).slice(0, 11).filter(s => bySlot.has(s));
  const opt = (x, cur) => `<option value="${x.slot}" ${x.slot === cur ? 'selected' : ''}>#${x.number} ${esc(playerName(x.pid) || 'ID ' + x.pid)}</option>`;
  const sel = (off, label, chip) => {
    const cur = S.d[t.tacticsBase + off], rest = roster.filter(x => !xi.includes(x.slot));
    return `<div class="f"><label for="sp${off}">${label}${chip ? ' <span class="chip" title="Se deduce del orden del menú del juego: probalo con dos jugadores distintos">probable</span>' : ''}</label><select id="sp${off}" data-sp="${off}">
      ${cur === 255 || !bySlot.has(cur) ? `<option value="${cur}" selected>${cur === 255 ? 'Ninguno' : 'Lugar ' + cur + ' (vacío)'}</option>` : ''}
      <optgroup label="Titulares">${xi.map(s => opt(bySlot.get(s), cur)).join('')}</optgroup>
      ${rest.length ? `<optgroup label="Suplentes y reserva">${rest.map(x => opt(x, cur)).join('')}</optgroup>` : ''}</select></div>`;
  };
  return `<div class="card"><div class="row" style="justify-content:space-between"><h3>Capitán y balón parado</h3>
    <button class="btn small" type="button" id="spAuto" title="Elige para cada jugada al titular con las mejores habilidades para ella">Elegir automáticamente</button></div>
    <div class="grid wide">${sel(CAPT, 'Capitán')}${SP_ROLES.map(([n, , unsure], k) => sel(TAKERS + k, n, unsure)).join('')}</div>
    <p class="note">Es lo mismo que "Opciones del jugador" en el Plan de juego. Los jugadores ofensivos son los que suben al área en tiros libres y córners. Que el córner izquierdo vaya antes que el derecho sale del orden del menú: si en el juego te aparecen al revés, avisame.</p></div>`;
}
function seg2(id, labels, v) { return `<div class="seg" data-seg2="${id}">${labels.map((n, i) => `<button type="button" data-v="${i}" aria-pressed="${i === v}">${n}</button>`).join('')}</div>`; }
function bindTactics(t, m) {
  const sh = $('teamSheet'), rer = () => later(() => renderTeams(m)), tn = tget(t, 'name');
  sh.querySelectorAll('[data-seg2]').forEach(g => g.onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; S[g.dataset.seg2] = +b.dataset.v; S.fsel = null; renderTeams(m); });
  CUR_T = t;
  const fl2 = $('flook'); if (fl2) fl2.onclick = ev => { const b = ev.target.closest('[data-v]'); if (!b) return; PREFS.look = b.dataset.v; savePrefs(); renderTeams(m); };
  const fth = $('ftheme'); if (fth) fth.onchange = () => { PREFS.theme = fth.value; savePrefs(); renderTeams(m); };
  const fid = $('fids'); if (fid) fid.onchange = () => { PREFS.showIds = fid.checked; savePrefs(); renderTeams(m); };
  const fon = $('fonline'); if (fon) fon.onchange = () => { PREFS.online = fon.checked; savePrefs(); if (fon.checked) toast('Se buscarán en internet las fotos que no estén en el Parche (por nombre y club).', 5000); renderTeams(m); };
  const fgr = $('fgrant'); if (fgr) fgr.onclick = grantFaces;
  const frt = $('fRate'); if (frt) frt.onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; PREFS.rateMode = b.dataset.v; savePrefs(); RATE_GEN++; renderTeams(m); };
  bindLastMatch(t, m);
  sh.querySelectorAll('[data-fk]').forEach(b => b.onclick = () => { setFaceKind(+b.dataset.pid, b.dataset.fk); toast(b.dataset.fk === 'del' ? 'Foto quitada: no se vuelve a buscar.' : b.dataset.fk === 'n' ? 'Marcada como foto de selección: no se mostrará en clubes.' : 'Marcada como foto de club.'); renderTeams(m); });
  const fz = $('fluid'); if (fz) fz.onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; const on = b.dataset.v === '1';
    if (on) { FLUID.set(fluidKey(t), true); S.fvar = 1; toast('Formación fluida activada: ajustá "Ataque" y "Defensa" por separado.'); }
    else { edit('Formación fluida desactivada en ' + tn, 't' + t.id, regT(t), () => { const base = readForm(t, S.fplan, 0); writeForm(t, S.fplan, 1, base); writeForm(t, S.fplan, 2, base); }); FLUID.set(fluidKey(t), false); S.fvar = 0; }
    S.fsel = null; renderTeams(m); };
  sh.querySelectorAll('[data-st]').forEach(g => g.onclick = e => {
    const b = e.target.closest('[data-v]'); if (!b || b.getAttribute('aria-pressed') === 'true') return; const o = +g.dataset.st, val = +b.dataset.v;
    const apply = () => { edit('Estrategia de ' + tn, 't' + t.id, regT(t), () => { S.d[planOff(t, S.fplan) + o] = val; }); rer(); };
    if (!g.classList.contains('pswitch') || ANIM.reduce.matches) { apply(); return; }
    // power-switch animation first, then commit and re-render
    g.dataset.on = val; g.querySelectorAll('[data-v]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    g.classList.remove('flip'); void g.offsetWidth; g.classList.add('flip'); g.style.pointerEvents = 'none';
    setTimeout(apply, 420);
  });
  sh.querySelectorAll('[data-sr]').forEach(r => { r.oninput = () => { r.parentElement.querySelector('output').textContent = r.value; }; r.onchange = () => { const o = +r.dataset.sr; edit('Estrategia de ' + tn, 't' + t.id, regT(t), () => { S.d[planOff(t, S.fplan) + o] = +r.value; }); }; });
  sh.querySelectorAll('[data-adv]').forEach(s2 => s2.onchange = () => { edit('Instrucción avanzada de ' + tn, 't' + t.id, regT(t), () => { S.d[planOff(t, S.fplan) + +s2.dataset.adv] = +s2.value; }); });
  sh.querySelectorAll('[data-spreset]').forEach(b => b.onclick = () => { const pr = STRAT_PRESETS[b.dataset.spreset]; edit('Estrategia "' + b.dataset.spreset + '" en ' + tn, 't' + t.id, regT(t), () => { for (const [o, val] of Object.entries(pr)) S.d[planOff(t, S.fplan) + +o] = val; }); toast('Estrategia "' + b.dataset.spreset + '" aplicada al plan ' + (S.fplan + 1) + '.', 4000, ['Deshacer', undo]); rer(); });
  sh.querySelectorAll('[data-copyplan]').forEach(b => b.onclick = () => { const to = +b.dataset.copyplan; edit('Copiar plan ' + (S.fplan + 1) + ' al ' + (to + 1) + ' en ' + tn, 't' + t.id, regT(t), () => { S.d.copyWithin(planOff(t, to), planOff(t, S.fplan), planOff(t, S.fplan) + PLAN_SZ); }); FLUID.delete(t.id + ':' + to); toast('Plan copiado.', 4000, ['Deshacer', undo]); rer(); });
  sh.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => {
    const pr = FORM_PRESETS[b.dataset.preset];
    edit('Formación ' + b.dataset.preset + ' en ' + tn, 't' + t.id, regT(t), () => { for (const v of formVariants()) { const f = readForm(t, S.fplan, v); pr.forEach(([r, y, x], i) => { f.roles[i + 1] = r; f.pos[i + 1] = [y, x]; }); f.pos[0] = [3, 52]; writeForm(t, S.fplan, v, f); } });
    toast('Formación ' + b.dataset.preset + ' aplicada.', 4000, ['Deshacer', undo]); rer();
  });
  sh.querySelectorAll('[data-sp]').forEach(s2 => s2.onchange = () => { const o = +s2.dataset.sp; edit((o === CAPT ? 'Capitán' : 'Lanzador') + ' de ' + tn, 't' + t.id, regT(t), () => { S.d[t.tacticsBase + o] = +s2.value; }); rer(); });
  const spa = $('spAuto'); if (spa) spa.onclick = () => {
    const sl = autoTakers(t);
    if (!sl) { toast('No tengo las habilidades de los titulares: conectá la carpeta Sider o agregalos a tu EDIT.', 5000); return; }
    edit('Lanzadores de ' + tn, 't' + t.id, regT(t), () => { sl.forEach((v, k) => { if (S.d[t.tacticsBase + TAKERS + k] !== 255) S.d[t.tacticsBase + TAKERS + k] = v; }); });
    toast('Lanzadores elegidos según las habilidades de los titulares.', 4000, ['Deshacer', undo]); rer();
  };
  const pitch = $('fpitch'); if (!pitch) return;
  const markerAt = (x, y, not) => document.elementsFromPoint(x, y).map(el => el.closest && el.closest('.fm')).find(el => el && el !== not);
  const doSub = (fi, slot, label) => { edit(label + ' en ' + tn, 't' + t.id, regT(t), () => swapInOrder(t, fi, slot)); S.fbench = null; toast('Cambio hecho.', 3500, ['Deshacer', undo]); rer(); };
  let drag = null;
  pitch.addEventListener('pointerdown', e => { const b = e.target.closest('.fm'); if (!b) return; drag = { i: +b.dataset.fi, el: b, x0: e.clientX, y0: e.clientY, moved: false }; b.setPointerCapture(e.pointerId); });
  pitch.addEventListener('pointermove', e => {
    if (!drag) return; if (Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) > 5) drag.moved = true; if (!drag.moved) return;
    const r = pitch.getBoundingClientRect(); const lx = Math.max(4, Math.min(96, (e.clientX - r.left) / r.width * 100)); const bt = Math.max(6, Math.min(94, (r.bottom - e.clientY) / r.height * 100));
    drag.el.style.left = lx + '%'; drag.el.style.bottom = bt + '%'; drag.el.classList.add('dragging'); drag.nx = Math.round(lx); drag.ny = Math.max(5, Math.min(48, Math.round((bt - 3) / 94 * 50)));
    pitch.querySelectorAll('.fm.drop').forEach(x => x.classList.remove('drop')); const over = markerAt(e.clientX, e.clientY, drag.el); if (over) over.classList.add('drop');
  });
  pitch.addEventListener('pointerup', e => {
    if (!drag) return; const d0 = drag; drag = null;
    const over = d0.moved ? markerAt(e.clientX, e.clientY, d0.el) : null;
    if (over) { const j = +over.dataset.fi; edit('Intercambio de puestos en ' + tn, 't' + t.id, regT(t), () => { const o = getOrder(t); [o[d0.i], o[j]] = [o[j], o[d0.i]]; setOrder(t, o); }); toast('Jugadores intercambiados.', 3500, ['Deshacer', undo]); rer(); return; }
    if (d0.moved && d0.i && d0.nx != null) { edit('Mover jugador en la formación de ' + tn, 't' + t.id, regT(t), () => { for (const v of formVariants()) { const f = readForm(t, S.fplan, v); f.pos[d0.i] = [d0.ny, d0.nx]; writeForm(t, S.fplan, v, f); } }); rer(); }
    else if (!d0.moved) {
      if (S.fbench != null) { doSub(d0.i, S.fbench, 'Cambio'); return; }
      S.fsel = S.fsel === d0.i ? null : d0.i; renderTeams(m);
    } else rer();
  });
  // bench: drag a substitute onto a starter, or tap it and then tap the starter
  sh.querySelectorAll('[data-bslot]').forEach(b => {
    b.addEventListener('pointerdown', e => {
      const slot = +b.dataset.bslot, x0 = e.clientX, y0 = e.clientY; let ghost = null, moved = false;
      const move = ev => {
        if (!moved && Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) < 6) return;
        if (!moved) { moved = true; ghost = b.cloneNode(true); ghost.classList.add('ghost'); document.body.appendChild(ghost); }
        ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
        pitch.querySelectorAll('.fm.drop').forEach(x => x.classList.remove('drop')); const over = markerAt(ev.clientX, ev.clientY, null); if (over) over.classList.add('drop');
      };
      const up = ev => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
        if (ghost) ghost.remove(); pitch.querySelectorAll('.fm.drop').forEach(x => x.classList.remove('drop'));
        if (moved) { const over = markerAt(ev.clientX, ev.clientY, null); if (over) doSub(+over.dataset.fi, slot, 'Cambio'); return; }
        if (S.fsel != null) { doSub(S.fsel, slot, 'Cambio'); return; }
        S.fbench = S.fbench === slot ? null : slot; renderTeams(m); if (S.fbench != null) toast('Ahora tocá al titular que sale.', 3000);
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    });
  });
  const fr = $('frole'); if (fr) fr.onchange = () => { edit('Rol en la formación de ' + tn, 't' + t.id, regT(t), () => { for (const v of formVariants()) { const f = readForm(t, S.fplan, v); f.roles[S.fsel] = +fr.value; writeForm(t, S.fplan, v, f); } }); rer(); };
  const fs = $('fswap'); if (fs) fs.onchange = () => { if (fs.value === '') return; edit('Cambio en el 11 de ' + tn, 't' + t.id, regT(t), () => swapInOrder(t, S.fsel, +fs.value)); rer(); };
  const fd = $('fdesel'); if (fd) fd.onclick = () => { S.fsel = null; renderTeams(m); };
}

// ===================== Compare two EDIT files =====================
function compareEdits(other) {
  const A = S.d, B = other.data, ib = PD.index(B, other.game), out = [];
  const tname = (d, t) => PD.team.get(d, t.base, 'name');
  const pidName = id => playerName(id) || 'ID ' + id;
  const label = o => { const s = STRAT_BIN.find(x => x[1] === o) || STRAT_RANGE.find(x => x[1] === o); return s ? s[2] : o === 0x6C ? 'Instrucción avanzada ofensiva' : o === 0x7C ? 'Instrucción avanzada defensiva' : 'dato +0x' + o.toString(16); };
  for (const ta of S.ix.teams) {
    const tb = ib.teamById.get(ta.id); if (!tb) continue;
    const li = [];
    for (const k of Object.keys(PD.TEAM_FIELDS)) { const a = PD.team.get(A, ta.base, k), b = PD.team.get(B, tb.base, k); if (a !== b) li.push(`${k}: ${esc(a)} → ${esc(b)}`); }
    const ra = PD.roster(A, ta), rb = PD.roster(B, tb);
    const ma = new Map(ra.map(x => [x.pid, x])), mb = new Map(rb.map(x => [x.pid, x]));
    for (const [id] of ma) if (!mb.has(id)) li.push(`Sale ${esc(pidName(id))}`);
    for (const [id, x] of mb) if (!ma.has(id)) li.push(`Entra ${esc(pidName(id))} (#${x.number})`); else if (ma.get(id).number !== x.number) li.push(`Dorsal de ${esc(pidName(id))}: ${ma.get(id).number} → ${x.number}`);
    if (ta.tacticsBase != null && tb.tacticsBase != null) {
      const sa = ta.tacticsBase, sb = tb.tacticsBase;
      const at = s => { const r = ra.find(y => y.slot === s); return r ? r.pid : null; }, bt = s => { const r = rb.find(y => y.slot === s); return r ? r.pid : null; };
      for (let i = 0; i < 11; i++) { const pa = at(A[sa + ORD + i]), pb = bt(B[sb + ORD + i]); if (pa !== pb) li.push(`Titular ${i + 1}: ${esc(pidName(pa))} → ${esc(pidName(pb))}`); }
      for (let k = 0; k < NTAKERS + 1; k++) { const o = TAKERS + k; const va = A[sa + o], vb = B[sb + o]; const na = va === 255 ? '—' : pidName(at(va)), nb = vb === 255 ? '—' : pidName(bt(vb)); if (na !== nb) li.push(`${o === CAPT ? 'Capitán' : SP_ROLES[k][0]}: ${esc(na)} → ${esc(nb)}`); }
      for (let p = 0; p < 3; p++) {
        for (let v = 0; v < 3; v++) { const oa = sa + 4 + p * PLAN_SZ + v * ENT_SZ, ob = sb + 4 + p * PLAN_SZ + v * ENT_SZ; if (!A.subarray(oa, oa + ENT_SZ).every((x, i) => x === B[ob + i])) li.push(`Plan ${p + 1}, variante ${['Base', 'Ataque', 'Defensa'][v]}: cambió la formación`); }
        for (let o = 0x63; o < PLAN_SZ; o++) { const va = A[sa + 4 + p * PLAN_SZ + o], vb = B[sb + 4 + p * PLAN_SZ + o]; if (va !== vb) li.push(`Plan ${p + 1}, ${esc(label(o))}: ${va} → ${vb}`); }
      }
      for (let o = 0x1E4 + 40 + 11; o < 0x274; o++) if (o !== CAPT && A[sa + o] !== B[sb + o]) li.push(`Táctica, dato +0x${o.toString(16)}: ${A[sa + o]} → ${B[sb + o]}`);
    }
    if (li.length) out.push([`Equipo: ${esc(tname(A, ta))}`, li]);
  }
  for (const pb of ib.players) {
    const pa = S.ix.byId.get(pb.id), li = [];
    if (!pa) { out.push([`Jugador nuevo en el otro archivo: ${esc(PD.player.get(B, pb.base, 'name') || pb.id)}`, []]); continue; }
    for (const k of Object.keys(PD.PLAYER_FIELDS)) { const a = PD.player.get(A, pa.base, k), b = PD.player.get(B, pb.base, k); if (a !== b) li.push(`${esc(FIELD_LABEL[k] || k)}: ${esc(a)} → ${esc(b)}`); }
    if (li.length) out.push([`Jugador: ${esc(PD.player.get(A, pa.base, 'name') || pa.id)}`, li]);
  }
  return out;
}
function compareCardHtml() {
  return `<div class="card"><h3>Comparar con otro EDIT</h3>
    <p class="note">Elegí otro EDIT00000000 (por ejemplo, uno guardado por el juego después de cambiar una sola cosa) y te muestro qué cambió, con nombres. Sirve para confirmar las opciones marcadas "sin confirmar".</p>
    <div class="row"><button class="btn" type="button" id="cmpBtn">Elegir archivo para comparar…</button><input type="file" id="cmpFile" hidden></div>
    <div id="cmpOut" class="diff"></div></div>`;
}
function bindCompare() {
  const b = $('cmpBtn'); if (!b) return;
  b.onclick = () => $('cmpFile').click();
  $('cmpFile').onchange = async e => {
    const f = e.target.files[0]; if (!f) return; e.target.value = '';
    try {
      const o = PesCrypt.decrypt(new Uint8Array(await f.arrayBuffer()));
      const res = compareEdits(o);
      $('cmpOut').innerHTML = `<p class="note">Comparando el archivo abierto (izquierda) con <b>${esc(f.name)}</b> (derecha): ${res.length ? res.length + ' elementos con diferencias.' : 'son iguales en todo lo que el editor entiende.'}</p>` +
        res.map(([h, li]) => `<details ${res.length < 6 ? 'open' : ''}><summary>${h}${li.length ? ' · ' + li.length : ''}</summary>${li.length ? `<ul>${li.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}</details>`).join('');
    } catch (err) { toast('No se pudo comparar: ' + err.message, 6000); }
  };
}
