// ===================== Editor EDIT 21 — app v2 =====================
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const later = fn => setTimeout(fn, 0);
const PD = PesData;

// ---------- vocabulary ----------
const POS = ['PT', 'DEC', 'LI', 'LD', 'MCD', 'MC', 'MI', 'MD', 'MO', 'EI', 'ED', 'SD', 'CD'];
const POS_LONG = ['Portero', 'Defensa central', 'Lateral izquierdo', 'Lateral derecho', 'Mediocentro defensivo', 'Mediocentro', 'Medio izquierdo', 'Medio derecho', 'Mediapunta', 'Extremo izquierdo', 'Extremo derecho', 'Segundo delantero', 'Centrodelantero'];
const POS_GRP = ['gk', 'df', 'df', 'df', 'mf', 'mf', 'mf', 'mf', 'mf', 'fw', 'fw', 'fw', 'fw'];
const POS_TO_PP = [12, 9, 10, 11, 5, 6, 7, 8, 4, 2, 3, 1, 0];
const PITCH = [[3, 7], [3, 6], [1, 6], [5, 6], [3, 5], [3, 4], [1, 4], [5, 4], [3, 3], [1, 1], [5, 1], [3, 2], [3, 1]];
const STYLES = ['Ninguno', 'Cazagoles', 'Señuelo', 'Hombre de área', 'Hombre objetivo', 'Creador de juego', 'Extremo prolífico', 'Extremo móvil', 'Especialista en centros', 'Enganche clásico', 'Jugador de huecos', 'Todocampista', 'El destructor', 'Organizador', 'Medio defensivo', 'Lateral ofensivo', 'Lateral finalizador', 'Lateral defensivo', 'Salida de balón', 'Atacante extra', 'Portero ofensivo', 'Portero defensivo'];
const ABIL_GROUPS = [
  ['Ataque', [['atk', 'Actitud ofensiva'], ['finish', 'Finalización'], ['header', 'Cabeceo'], ['kick_pwr', 'Potencia de tiro'], ['place_kick', 'Balón parado'], ['swerve', 'Efecto']]],
  ['Técnica y pase', [['ball_ctrl', 'Control de balón'], ['drib', 'Regate'], ['tight_pos', 'Conducción ajustada'], ['lowpass', 'Pase al ras'], ['loftpass', 'Pase bombeado']]],
  ['Físico', [['speed', 'Velocidad'], ['exp_pwr', 'Aceleración'], ['body_ctrl', 'Equilibrio'], ['phys_cont', 'Contacto físico'], ['jump', 'Salto'], ['stamina', 'Resistencia']]],
  ['Defensa', [['def', 'Actitud defensiva'], ['ball_win', 'Recuperación'], ['aggres', 'Agresividad']]],
  ['Portero', [['gk', 'Actitud de portero'], ['catching', 'Atajar'], ['clearing', 'Despejar'], ['reflex', 'Reflejos'], ['cover', 'Alcance']]],
];
const ABIL = ABIL_GROUPS.flatMap(g => g[1]);
const KEY_ABIL = {
  gk: ['gk', 'catching', 'clearing', 'reflex', 'cover', 'jump'],
  cb: ['def', 'ball_win', 'aggres', 'header', 'jump', 'phys_cont', 'speed'],
  fb: ['def', 'ball_win', 'speed', 'stamina', 'lowpass', 'loftpass', 'exp_pwr'],
  dmf: ['def', 'ball_win', 'aggres', 'lowpass', 'loftpass', 'stamina', 'phys_cont'],
  cmf: ['lowpass', 'loftpass', 'ball_ctrl', 'stamina', 'def', 'drib', 'tight_pos'],
  smf: ['speed', 'exp_pwr', 'drib', 'ball_ctrl', 'loftpass', 'stamina', 'lowpass'],
  amf: ['atk', 'ball_ctrl', 'drib', 'tight_pos', 'lowpass', 'finish', 'exp_pwr'],
  wf: ['atk', 'speed', 'exp_pwr', 'drib', 'ball_ctrl', 'finish', 'tight_pos'],
  cf: ['atk', 'finish', 'header', 'kick_pwr', 'ball_ctrl', 'phys_cont', 'speed'],
};
const POS_KEY = ['gk', 'cb', 'fb', 'fb', 'dmf', 'cmf', 'smf', 'smf', 'amf', 'wf', 'wf', 'amf', 'cf'];
const SKILLS = [
  ['Regate', [[0, 'Bicicleta'], [28, 'Doble toque'], [1, 'Elástica'], [2, 'Ruleta'], [3, 'Sombrero'], [29, 'Giro cruzado'], [4, 'Recorte y giro'], [5, 'Amago de tiro'], [30, 'Pisar el balón'], [10, 'Taconazo']]],
  ['Tiro', [[6, 'Cabezazo'], [7, 'Disparo potente lejano'], [31, 'Vaselina'], [39, 'Tiro lejano'], [8, 'Disparo sin rosca'], [32, 'Disparo con caída'], [33, 'Disparo ascendente'], [9, 'Remate acrobático'], [11, 'Disparo al primer toque']]],
  ['Pase', [[12, 'Pase al primer toque'], [40, 'Pase en profundidad'], [13, 'Pase medido'], [14, 'Centro preciso'], [15, 'Rosca exterior'], [16, 'Rabona'], [34, 'Pase sin mirar'], [17, 'Pase bombeado bajo'], [19, 'Saque de banda largo']]],
  ['Portero', [[18, 'Saque bajo'], [35, 'Saque alto'], [20, 'Saque largo con la mano'], [37, 'Atajapenales']]],
  ['Defensa y mentalidad', [[36, 'Especialista en penales'], [21, 'Picardía'], [22, 'Marcaje al hombre'], [23, 'Repliegue'], [38, 'Intercepción'], [24, 'Despeje acrobático'], [25, 'Capitanía'], [26, 'Revulsivo'], [27, 'Espíritu de lucha']]],
];
const COM = ['Malabarista', 'Regate en carrera', 'Bala', 'Desmarque incisivo', 'Experto en pase largo', 'Centro temprano', 'Tirador lejano'];
const BODY = [['head_len', 'Largo de cabeza'], ['head_wid', 'Ancho de cabeza'], ['head_dep', 'Profundidad de cabeza'], ['neck_len', 'Largo de cuello'], ['neck_size', 'Grosor de cuello'], ['shldr_hi', 'Altura de hombros'], ['shldr_wid', 'Ancho de hombros'], ['chest', 'Pecho'], ['waist', 'Cintura'], ['arm_size', 'Grosor de brazos'], ['arm_len', 'Largo de brazos'], ['thigh', 'Muslos'], ['calf', 'Pantorrillas'], ['leg_len', 'Largo de piernas']];
const SKIN = ['Blanca', 'Clara', 'Trigueña', 'Media', 'Oliva', 'Morena', 'Negra'];
const IRIS = ['Negro', 'Marrón oscuro', 'Marrón', 'Ámbar', 'Azul marino', 'Carbón', 'Gris', 'Azul', 'Siena', 'Verde', 'Violeta'];
const COLORS8 = ['Blanco', 'Negro', 'Rojo', 'Azul', 'Amarillo', 'Verde', 'Rosa', 'Turquesa'];
const TAPE = ['Ninguna', 'Derecha', 'Izquierda', 'Ambas'];
const GLASSES = ['Ninguno', 'Rectangulares sin marco', 'Rectangulares media montura', 'Rectangulares con marco', 'Ovalados sin marco', 'Ovalados media montura', 'Ovalados con marco', 'Redondos con marco'];
const SLEEVE = ['Según temporada', 'Cortas', 'Largas'];
const INNER = ['Ninguna', 'Normal', 'Cuello alto'];
const SOCKS = ['Estándar', 'Largas', 'Cortas'];
const UNDER = ['Calza: no · Invierno: no', 'Calza: corta · Invierno: corta', 'Calza: no · Invierno: larga', 'Calza: corta · Invierno: larga'];
const MOTION = [['mo_hunchd', 'Postura al regatear', 1, 5, 1], ['mo_armd', 'Brazos al regatear', 1, 10, 1], ['mo_hunchr', 'Postura al correr', 1, 5, 1], ['mo_armr', 'Brazos al correr', 1, 10, 1], ['mo_ck', 'Lanzamiento de córner', 1, 10, 1], ['mo_fk', 'Lanzamiento de tiro libre', 1, 20, 1], ['mo_pk', 'Lanzamiento de penal', 1, 7, 1], ['mo_drib', 'Estilo de regate', 0, 3, 0], ['gc1', 'Celebración 1', 0, 162, 0], ['gc2', 'Celebración 2', 0, 162, 0]];
const LOCK_FLAGS = ['e_player', 'e_basic', 'e_regpos', 'e_playpos', 'e_ability', 'e_skill', 'e_style', 'e_com', 'e_motion'];
const FLAG_NAMES = { e_player: 'Datos', e_basic: 'Básicos', e_regpos: 'Posición', e_playpos: 'Posiciones', e_ability: 'Habilidades', e_skill: 'Especiales', e_style: 'Estilo', e_com: 'IA', e_motion: 'Movimientos', e_phys: 'Físico', e_strip: 'Equipación', e_face: 'Cara', e_hair: 'Pelo' };
const FIELD_FLAGS = k => {
  if (/^(name|shirt|comm_id)$/.test(k)) return ['e_player'];
  if (/^(nation|age|height|weight|strong_foot|strong_hand|star|play_attit)$/.test(k)) return ['e_player', 'e_basic'];
  if (k === 'reg_pos') return ['e_regpos'];
  if (/^pos\d+$/.test(k)) return ['e_playpos'];
  if (/^sk\d+$/.test(k)) return ['e_skill'];
  if (/^com\d$/.test(k) || k === 'play_style') return ['e_style', 'e_com'];
  if (/^(mo_|gc)/.test(k)) return ['e_motion'];
  if (BODY.some(b => b[0] === k) || k === 'skin_col' || k === 'iris_col') return ['e_phys'];
  if (/^(wrist|spec|sleeve|inners|socks|undershorts|untucked|ankle|gloves|boot_id|glove_id)/.test(k)) return ['e_strip'];
  return ['e_ability'];
};
const NO_RIVAL = 262143;
// Player.bin (game database) ability layout, reverse-engineered: value-40 stored in 6 bits at these bit offsets
const DB_ABIL = { atk: 370, drib: 352, loftpass: 402, finish: 396, place_kick: 250, swerve: 332, kick_pwr: 358, speed: 306, exp_pwr: 344, stamina: 338, def: 275, ball_win: 312, aggres: 384, jump: 294, header: 288, lowpass: 263, body_ctrl: 376, phys_cont: 390, ball_ctrl: 281, tight_pos: 416, gk: 269, catching: 300, clearing: 320, reflex: 326, cover: 364 };
const T_ = PesTables;
const COUNTRY = new Map(T_.countries.map(c => [c[0], c[1]]));
const BOOTS = new Map(T_.boots.map(c => [c[0], c[1]]));
const GLOVES = new Map(T_.gloves.map(c => [c[0], c[1]]));
const STADIUM = new Map(T_.stadiums.map(c => [c[0], c[1]]));
const COACH = new Map(T_.coaches.map(c => [c[0], c[1]]));

// ---------- state ----------
const S = {
  name: '', f: null, d: null, ix: null, orig: null, origData: null,
  dir: null, editHandle: null, backedUp: false,
  hist: [], hp: 0, savedHp: 0,
  names: new Map(), namesFrom: '',
  tab: 'teams', team: null, teamByTab: {}, natSeen: false, player: null, ttab: 'roster', ptab: 'profile',
  qTeam: '', tSort: 'name', tFilter: 'all', qPlayer: '', pSrc: 'edit', dbPlayer: null, showEmpty: false, autoLock: true, pFilter: 'all', rosterSort: 'xi', fplan: 0, fvar: 0, flink: true, fsel: null, fbench: null,
};
const LAYOUT = { '2021': 0x24C, '2020': 0x210 };

// ---------- helpers ----------
let toastT;
function toast(msg, ms = 3400, action) {
  const t = $('toast'); t.innerHTML = esc(msg) + (action ? ` <button type="button">${esc(action[0])}</button>` : '');
  if (action) t.querySelector('button').onclick = () => { t.hidden = true; action[1](); };
  t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, ms);
}
const pget = (p, k) => PD.player.get(S.d, p.base, k);
const tget = (t, k) => PD.team.get(S.d, t.base, k);
const hex2 = v => Math.min(255, Math.round(v * 255 / 63)).toString(16).padStart(2, '0');
const c6 = h => Math.round(parseInt(h, 16) * 63 / 255);
const teamColor = (t, n) => '#' + hex2(tget(t, `c${n}r`)) + hex2(tget(t, `c${n}g`)) + hex2(tget(t, `c${n}b`));
function inkFor(hex) { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? '#111' : '#fff'; }
function crest(t, cls = '', urgent = false) { const a = teamColor(t, 1), b = teamColor(t, 2), u = badgeUrl(t, urgent); return `<span class="crest ${u ? 'img' : ''} ${cls}" style="--ca:${a};--cb:${b};color:${inkFor(a)}"><i>${esc(tget(t, 'short') || '?')}</i><img data-badge="${t.id}" alt="" ${u ? `src="${u}"` : ''} onerror="this.removeAttribute('src');this.parentNode.classList.remove('img')"></span>`; }
const posBadge = i => `<span class="posb ${POS_GRP[i] || 'mf'}">${POS[i] || '?'}</span>`;
const vcls = v => v >= 90 ? 'v90' : v >= 80 ? 'v80' : v >= 70 ? 'v70' : v >= 60 ? 'v60' : 'vlo';
function playerName(id) {
  const p = S.ix && S.ix.byId.get(id);
  if (p) { const n = pget(p, 'name'); if (n) return n; }
  const n = S.names.get(id); return n ? n.name : '';
}
// cuánto de la forma ya está guardado en el EDIT: media del EDIT − media original del Parche
function formDone(id) {
  const p = S.ix && S.ix.byId.get(id); if (!p) return 0;
  // si la media del EDIT sigue siendo la que dejó el editor al aplicar, ese ajuste ya está hecho (sirve aunque no esté cargada la base de datos)
  const ap = typeof APPLIED !== 'undefined' && APPLIED.get(id), r = rating(p);
  if (ap && ap.r != null && ap.r === r) return ap.adj;
  const n = S.names.get(id); return n && n.r ? r - n.r : 0;
}
function pInfo(id) {
  const b = pInfoBase(id); if (!b) return b;
  const k = PREFS.lmProv + ':' + S.name + ':' + S.names.size + ':' + (S.ix ? S.ix.players.length : 0); if (LM.ready !== k) { LM.ready = k; LM.adj.clear(); for (const key of Object.keys(LM.cache)) { if (!key.startsWith(PREFS.lmProv + ':')) continue; const t = S.ix && S.ix.teamById.get(+key.split(':')[1]); if (t) lmComputeAdj(t); } }
  const a = LM.adj.get(id); if (!a) return b;
  // la flecha de forma se ve siempre; la valoración solo cambia en el modo "Por rendimiento".
  // si el ajuste ya está guardado en el EDIT, "Del juego" ya lo incluye: solo se suma lo que falta
  const done = formDone(id), pend = a.adj - done;
  return Object.assign({}, b, { adj: a.adj, form: a, r0: b.r, applied: done }, PREFS.rateMode !== 'base' ? { r: Math.max(40, Math.min(99, b.r + pend)) } : {});
}
// flechas de forma estilo PES: ⬆ verde, ↗ verde claro, ➡ neutral, ↘ naranja, ⬇ rojo
function formLevel(a) { return a >= 3 ? 2 : a >= 1 ? 1 : a <= -3 ? -2 : a <= -1 ? -1 : 0; }
function formTip(f) {
  if (!f) return '';
  const p = f.parts || {}, bits = [`Rinde ${f.avg} de promedio en ${f.n} partido${f.n > 1 ? 's' : ''} (se esperaba ${f.expect ?? '?'})`];
  if (f.g || f.as) bits.push(`${f.g} gol${f.g === 1 ? '' : 'es'} y ${f.as} asistencia${f.as === 1 ? '' : 's'} en ${f.min}′`);
  if (f.ppg != null) bits.push(`equipo: ${f.ppg.toFixed(2).replace('.', ',')} pts por partido`);
  if (f.age) bits.push(`${f.age} años (${f.age <= 21 ? 'joven: sube más rápido' : f.age >= 33 ? 'veterano: baja más rápido' : f.age >= 30 ? 'sube algo menos' : 'edad normal'})`);
  return bits.join(' · ') + ` → ${f.adj > 0 ? '+' : ''}${f.adj}`;
}
// valoración para la cancha/banco según la vista elegida: del juego, por rendimiento o comparando las dos
function rateHtml(pi, tag = 'span') {
  if (!pi || !pi.r) return '';
  const oop = pi.outpos ? `<span class="oop" title="Fuera de su puesto: en ${POS[pi.natPos]} tiene ${pi.nat} (${pi.outpos})">⚠</span>` : '';
  const pend = pi.form ? pi.adj - (pi.applied || 0) : 0, base = pi.r0 != null ? pi.r0 : pi.r, target = Math.max(40, Math.min(99, base + pend));
  // la flecha solo aparece mientras hay algo por aplicar; ya aplicado, se ve la media nueva y nada más
  const cls = pi.outpos ? ' op' : '', arrow = pend ? adjHtml(pend, pi.form) : '';
  const rv = typeof REVEAL !== 'undefined' && REVEAL.get(pi.id), rev = rv ? ` data-rev="${rv}"` : '';
  if (PREFS.rateMode === 'cmp' && pend) return `<${tag} class="frt ${vcls(base)} r0${cls}" title="Hoy en el juego">${base}</${tag}><span class="rcmp">›</span><${tag} class="frt ${vcls(target)}${cls}" title="Con la forma">${target}</${tag}>${oop}${arrow}`;
  const main = PREFS.rateMode === 'base' ? base : target;
  // la otra media (con forma o la del juego) se ve al lado, transparente, para entender la suba o la baja
  const ghostV = PREFS.rateMode === 'base' ? target : base;
  const ghost = pend ? `<span class="frt ghost ${pend > 0 ? 'gup' : 'gdn'}" title="${PREFS.rateMode === 'base' ? 'Con la forma quedaría en ' + target : 'Hoy en el juego tiene ' + base}">${ghostV}</span>` : '';
  return `<${tag} class="frt ${vcls(main)}${cls}"${rev}>${main}</${tag}>${oop}${ghost}${arrow}`;
}
function adjHtml(a, f) {
  if (a == null || (!a && !f)) return '';
  const lv = formLevel(a), rot = { 2: -90, 1: -45, 0: 0, '-1': 45, '-2': 90 }[lv];
  return `<span class="farrow lv${lv}" title="${esc(f ? formTip(f) : (a > 0 ? 'Sube ' : 'Baja ') + Math.abs(a))}"><svg viewBox="0 0 16 16" aria-hidden="true" style="rotate:${rot}deg"><path d="M2 6.5h7V3l5 5-5 5V9.5H2z"/></svg>${a ? `<b>${a > 0 ? '+' : '−'}${Math.abs(a)}</b>` : ''}</span>`;
}
function pInfoBase(id) { const p = S.ix && S.ix.byId.get(id); if (p) return { id, pos: pget(p, 'reg_pos'), r: rating(p), a: pget(p, 'age'), edit: true }; const n = S.names.get(id); return n && n.pos != null ? { id, pos: n.pos, r: n.r, a: n.a || 0, edit: false } : null; }
const RATE_CACHE = new Map(), SCORE_CACHE = new Map(), VAL_CACHE = new Map(); let RATE_GEN = 0;
function teamScore(t) {
  const key = t.id + ':' + RATE_GEN; if (SCORE_CACHE.has(key)) return SCORE_CACHE.get(key);
  const r = PD.roster(S.d, t); let res = null;
  if (r.length) {
    const st = t.tacticsBase != null ? PD.starters(S.d, t) : r.slice(0, 11).map(x => x.slot);
    const vals = r.map(x => ({ x, i: pInfo(x.pid) })).filter(v => v.i && v.i.r);
    if (vals.length >= Math.min(11, r.length) * 0.6) {
      const ord = t.tacticsBase != null ? getOrder(t) : null, fm = t.tacticsBase != null ? readForm(t, S.fplan || 0, 0) : null;
      const xi = vals.filter(v => st.includes(v.x.slot)).map(v => { if (!ord) return v.i.r; const k = ord.indexOf(v.x.slot); const pa = k < 0 || k > 10 ? null : pInfoAt(v.x.pid, k === 0 ? 0 : fm.roles[k]); return pa ? pa.r : v.i.r; });
      const rest = vals.filter(v => !st.includes(v.x.slot)).map(v => v.i.r).sort((a, b) => b - a).slice(0, 7);
      const avg = a => a.reduce((s, v) => s + v, 0) / (a.length || 1);
      const score = xi.length ? avg(xi) * 0.78 + (rest.length ? avg(rest) : avg(xi) - 4) * 0.22 : avg(vals.map(v => v.i.r));
      res = { raw: Math.round(score * 10) / 10, score: Math.round(score), stars: Math.max(0.5, Math.min(5, Math.round(((score - 58) / 5) * 2) / 2)), known: vals.length, total: r.length };
    }
  }
  SCORE_CACHE.set(key, res); return res;
}
// ---------- market value model (calibrated against Transfermarkt-scale squad values; no live connection) ----------
// League weight: same rating is worth much more in the Premier League than in Argentina (as in real transfer markets).
const LEAGUE_F = { 'ENG/A': 1.3, 'ESP/A': 1.1, 'GER/A': 1.05, 'ITA/A': 1.0, 'FRA/A': .9, 'POR/A': .7, 'NED/A': .65, 'ENG/B': .6, 'BEL/A': .55, 'BRA/A': .55, 'TUR/A': .5, 'KSA/A': .45, 'DEN/A': .45, 'SUI/A': .45, 'USA/A': .42, 'MEX/A': .42, 'SCO/A': .4, 'GER/B': .4, 'RUS/A': .4, 'GRE/A': .4, 'ARG/A': .36, 'ESP/B': .35, 'ITA/B': .35, 'FRA/B': .35, 'JPN/A': .3, 'UAE/A': .3, 'POR/B': .25, 'BRA/B': .25, 'COL/A': .25, 'ECU/A': .25, 'URU/A': .22, 'CHI/A': .22, 'PER/A': .18, 'ARG/B': .15, 'CHI/B': .1, 'PER/B': .1 };
const LEAGUE_NAME = { 'ENG/A': 'Premier League', 'ENG/B': 'Championship', 'ESP/A': 'LaLiga', 'ESP/B': 'LaLiga 2', 'ITA/A': 'Serie A', 'ITA/B': 'Serie B', 'FRA/A': 'Ligue 1', 'FRA/B': 'Ligue 2', 'GER/A': 'Bundesliga', 'GER/B': '2. Bundesliga', 'NED/A': 'Eredivisie', 'POR/A': 'Liga Portugal', 'POR/B': 'Liga Portugal 2', 'TUR/A': 'Süper Lig', 'SCO/A': 'Premiership', 'BEL/A': 'Pro League', 'BRA/A': 'Brasileirão', 'BRA/B': 'Série B', 'ARG/A': 'Liga Profesional', 'ARG/B': 'Primera Nacional', 'USA/A': 'MLS', 'MEX/A': 'Liga MX', 'KSA/A': 'Saudi Pro League', 'JPN/A': 'J1 League' };
function leagueOf(t) { const k = t && KITS.map.get(t.id); return k && k.path ? k.path.split(/[\\/]/).slice(0, 2).join('/') : null; }
function clubFactor(t) {
  if (!t) return .3;
  const l = leagueOf(t); if (l && LEAGUE_F[l] != null) return LEAGUE_F[l];
  if (l && /^CLASSIC/i.test(l)) return .3;
  const sc = teamScore(t); return sc ? Math.max(.15, Math.min(1, .15 + (sc.score - 70) * .04)) : .3;
}
const VALUES_LS = 'edit21-values-v1';
const MANUAL_VAL = (() => { try { return new Map(JSON.parse(localStorage.getItem(VALUES_LS) || '[]')); } catch { return new Map(); } })();
const saveManualVal = () => { try { localStorage.setItem(VALUES_LS, JSON.stringify([...MANUAL_VAL])); } catch { } };
const AGE_F = { 28: .92, 29: .82, 30: .7, 31: .58, 32: .47, 33: .38, 34: .3, 35: .24, 36: .19, 37: .15, 38: .13, 39: .11 };
function playerValueBase(pid) { if (MANUAL_VAL.has(pid)) return { v: MANUAL_VAL.get(pid) }; return valueCalc(pid, pInfoBase(pid)); }
function playerValue(pid) {
  const key = pid + ':' + RATE_GEN; if (VAL_CACHE.has(key)) return VAL_CACHE.get(key);
  let res = valueCalc(pid, pInfo(pid));
  if (MANUAL_VAL.has(pid)) res = Object.assign(res || {}, { v: MANUAL_VAL.get(pid), manual: true });
  VAL_CACHE.set(key, res); return res;
}
function valueCalc(pid, i) {
  let res = null;
  if (i && i.r) {
    const r = i.r, a = i.a || 26, ageKnown = !!i.a;
    // potential: young players keep growing; better players grow a bit less in absolute terms (capped at 95)
    const grow = a < 27 ? Math.min(95 - r, (27 - a) * (r >= 78 ? 1.1 : r >= 70 ? 1.3 : 1.0)) : 0;
    const pot = Math.round(r + Math.max(0, grow));
    const eff = r + (pot - r) * (a <= 21 ? .5 : a <= 24 ? .4 : .3);
    const club = clubOf(pid), cf = clubFactor(club);
    let v = Math.exp((eff - 65) / 5) * (a <= 27 ? 1 : AGE_F[a] || .09) * cf * (i.pos === 0 ? .5 : 1);
    if (v > 90) v = 90 + (v - 90) * .5;
    v = v >= 10 ? Math.round(v) : v >= 1 ? Math.round(v * 10) / 10 : Math.max(.025, Math.round(v * 40) / 40);
    res = { v, est: v, r, a, ageKnown, pot, club, league: leagueOf(club), cf, manual: false };
  }
  return res;
}
function teamRating(t) {
  const key = t.id + ':' + RATE_GEN; if (RATE_CACHE.has(key)) return RATE_CACHE.get(key);
  const sc = teamScore(t); let res = null;
  if (sc) { let value = 0, manual = 0; for (const x of PD.roster(S.d, t)) { const pv = playerValue(x.pid); if (pv) { value += pv.v; if (pv.manual) manual++; } } res = Object.assign({ value, manual }, sc); }
  RATE_CACHE.set(key, res); return res;
}
const fmtMoney = v => v >= 1000 ? '€' + (v / 1000).toFixed(2).replace('.', ',') + ' mil M' : v >= 10 ? '€' + Math.round(v).toLocaleString('es-AR') + ' M' : v >= 1 ? '€' + v.toFixed(1).replace('.', ',') + ' M' : '€' + Math.round(v * 1000).toLocaleString('es-AR') + ' mil';
function starsHtml(n) { let h = ''; for (let i = 1; i <= 5; i++) h += `<span class="st ${n >= i ? 'f' : n >= i - 0.5 ? 'h' : ''}">★</span>`; return `<span class="stars" aria-label="${n} estrellas">${h}</span>`; }
// corrección por línea, calibrada con las medias que muestra el juego (arqueros y centrales salían altos)
const RATING_BIAS = {gk: -6.59, cb: -4.23, fb: -0.48, dmf: -0.73, cmf: -2.46, smf: -2.5, amf: -0.87, wf: -1.71}; // calibrado con 90 medias reales del juego (Boca, Racing, Independiente, Barracas, Unión)
const RATING_W = { cf: { w: {atk: 0.1386, ball_ctrl: 0.1407, drib: 0.0053, lowpass: 0.0063, loftpass: 0.0032, finish: 0.1511, header: 0.1165, swerve: 0.0125, speed: 0.1046, exp_pwr: 0.0352, kick_pwr: 0.1219, phys_cont: 0.1053, stamina: 0.0314, aggres: 0.025}, b: -2.18 } }; // delanteros: pesos ajustados (mejor que el promedio simple)
function posFormula(g, ab) { const m = RATING_W[g]; if (m) { let r = m.b; for (const k in m.w) r += m.w[k] * ab(k); return r; } const ks = KEY_ABIL[g]; return ks.reduce((a, k) => a + ab(k), 0) / ks.length + (RATING_BIAS[g] || 0); }
function rating(p) { return Math.round(posFormula(POS_KEY[pget(p, 'reg_pos')] || 'cmf', k => pget(p, k))); }
// media en un puesto que no es el suyo (como la muestra el juego en la alineación): A sin castigo, B −6, C −7 (medido en el juego)
const DB_POSFLAG = { 1: 468, 3: 474, 4: 414, 5: 456, 6: 466, 7: 460, 8: 464, 9: 472, 10: 476, 11: 478, 12: 470 };
function abilOf(pid) { const p = S.ix && S.ix.byId.get(pid); if (p) return k => pget(p, k); if (DBRAW && DBRAW.off.has(pid)) { const o = DBRAW.off.get(pid); return k => dbBits(o, DB_ABIL[k], 6) + 40; } return null; }
function posFlag(pid, role) { const p = S.ix && S.ix.byId.get(pid); if (p) return pget(p, 'pos' + role); if (DBRAW && DBRAW.off.has(pid) && DB_POSFLAG[role] != null) return dbBits(DBRAW.off.get(pid), DB_POSFLAG[role], 2); return null; }
function slotRating(pid, role) {
  const b = pInfoBase(pid); if (!b || role == null || role === b.pos) return b ? b.r : null;
  const ab = abilOf(pid); if (!ab) return b.r;
  let r = posFormula(POS_KEY[role], ab);
  const fl = posFlag(pid, role); r -= fl === 2 ? 0 : fl === 1 ? 6 : 7; if (role === 0 || b.pos === 0) r -= 15;
  return Math.max(40, Math.min(b.r, Math.round(r)));
}
function pInfoAt(pid, role) {
  const pi = pInfo(pid), b = pInfoBase(pid); if (!pi || !b || role == null || role === b.pos) return pi;
  const d = slotRating(pid, role) - b.r; if (!d) return pi;
  return Object.assign({}, pi, { r: Math.max(40, pi.r + d), r0: (pi.r0 != null ? pi.r0 : b.r) + d, outpos: d, nat: pi.r, natPos: b.pos });
}
const teamOf = new Map();
function rebuildTeamOf() { teamOf.clear(); for (const t of S.ix.teams) for (const r of PD.roster(S.d, t)) { if (!teamOf.has(r.pid)) teamOf.set(r.pid, []); teamOf.get(r.pid).push(t); } }
const isLocked = p => LOCK_FLAGS.every(k => pget(p, k));
const lockWord = p => isLocked(p) ? '' : LOCK_FLAGS.some(k => pget(p, k)) ? ' · protección parcial' : ' · sin proteger';
const normName = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
const COUNTRY_NAMES = new Set(T_.countries.map(c => normName(c[1])));
const natCache = new Map();
const isNat = t => { if (!natCache.has(t.id)) natCache.set(t.id, t.id < 100 || COUNTRY_NAMES.has(normName(tget(t, 'name')))); return natCache.get(t.id); };
const clubOf = id => { const ts = teamOf.get(id) || []; return ts.find(t => !isNat(t)) || ts[0]; };

// ---------- history (undo/redo) ----------
const regP = p => [[p.base, 0x138]];
const regT = t => [[t.base, LAYOUT[S.f.game]], t.rosterBase != null ? [t.rosterBase, 0x11C] : null, t.tacticsBase != null ? [t.tacticsBase, 0x274] : null].filter(Boolean);
function edit(label, key, regions, fn) {
  const before = regions.map(([o, l]) => [o, S.d.slice(o, o + l)]);
  const meta0 = { desc: S.f.desc.slice(), serial: S.f.serial.slice() };
  const r = fn();
  const after = regions.map(([o, l]) => [o, S.d.slice(o, o + l)]);
  const meta1 = { desc: S.f.desc.slice(), serial: S.f.serial.slice() };
  const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  const changed = after.some(([, b], i) => !same(b, before[i][1])) || !same(meta0.desc, meta1.desc) || !same(meta0.serial, meta1.serial);
  if (!changed) return r;
  if (S.savedHp > S.hp) S.savedHp = -1;
  RATE_GEN++;
  S.hist.splice(S.hp); S.hist.push({ label, key, before, after, meta0, meta1, t: Date.now() }); S.hp++;
  updateTop(); return r;
}
function applyH(h, which) {
  for (const [o, b] of h[which]) S.d.set(b, o);
  if ((S.d[96] | S.d[97] << 8) !== S.ix.players.length || h.reindex) S.ix = PD.index(S.d, S.f.game);
  const m = which === 'before' ? h.meta0 : h.meta1; S.f.desc = m.desc.slice(); S.f.serial = m.serial.slice();
}
function undo() { RATE_GEN++; if (!S.hp) return; const h = S.hist[--S.hp]; applyH(h, 'before'); rebuildTeamOf(); updateTop(); render(); toast('Deshecho: ' + h.label); }
function redo() { RATE_GEN++; if (S.hp >= S.hist.length) return; const h = S.hist[S.hp++]; applyH(h, 'after'); rebuildTeamOf(); updateTop(); render(); toast('Rehecho: ' + h.label); }
function dirtyKeys() {
  const ks = new Set();
  const from = S.savedHp < 0 ? 0 : Math.min(S.hp, S.savedHp), to = S.savedHp < 0 ? S.hp : Math.max(S.hp, S.savedHp);
  for (let i = from; i < to; i++) if (S.hist[i]) ks.add(S.hist[i].key);
  return ks;
}
const pending = () => S.savedHp !== S.hp;
function setP(p, k, v, label) {
  edit(label || (pget(p, 'name') || 'Jugador ' + p.id) + ': ' + k, 'p' + p.id, regP(p), () => {
    PD.player.set(S.d, p.base, k, v);
    if (S.autoLock) for (const fl of [...LOCK_FLAGS, ...FIELD_FLAGS(k)]) PD.player.set(S.d, p.base, fl, 1);
  });
}
function setLock(p, on) { edit((on ? 'Proteger ' : 'Desproteger ') + (pget(p, 'name') || p.id), 'p' + p.id, regP(p), () => { for (const k of LOCK_FLAGS) PD.player.set(S.d, p.base, k, on ? 1 : 0); }); }
function setT(t, fields, label) { edit(label || 'Equipo ' + tget(t, 'name'), 't' + t.id, regT(t), () => { for (const [k, v] of fields) PD.team.set(S.d, t.base, k, v); }); }
const FIELD_LABEL = Object.fromEntries([...ABIL, ...BODY, ...MOTION.map(m => [m[0], m[1]]), ['name', 'nombre'], ['shirt', 'camiseta'], ['nation', 'nacionalidad'], ['age', 'edad'], ['height', 'altura'], ['weight', 'peso'], ['reg_pos', 'posición'], ['play_style', 'estilo'], ['strong_foot', 'pie hábil'], ['strong_hand', 'mano hábil'], ['star', 'estrellas'], ['weak_use', 'pierna mala'], ['weak_acc', 'precisión pierna mala'], ['form', 'forma'], ['injury', 'lesiones'], ['boot_id', 'botines'], ['glove_id', 'guantes']]);

// ---------- loading ----------
function openBytes(bytes, name) {
  const f = PesCrypt.decrypt(bytes);
  const info = PesCrypt.info(f);
  if (info.type !== 'EDIT') throw new Error('Ese archivo es de tipo "' + info.type + '", no un EDIT.');
  S.f = f; S.d = f.data; S.orig = bytes; S.origData = f.data.slice(); S.name = name; S.ix = PD.index(S.d, f.game);
  S.hist = []; S.hp = 0; S.savedHp = 0; S.backedUp = false;
  rebuildTeamOf();
  natCache.clear();
  const firstTeam = S.ix.teams.find(t => t.id >= 100 && PD.roster(S.d, t).length) || S.ix.teams.find(t => PD.roster(S.d, t).length);
  S.team = firstTeam ? firstTeam.id : null;
  S.player = S.ix.players.length ? S.ix.players[0].id : null;
  $('bNames').disabled = false; $('gq').disabled = false; $('bReload').disabled = !S.editHandle;
  updateTop(); render();
}
async function openFile(file) {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    S.dir = null; S.editHandle = null;
    openBytes(bytes, file.name);
    toast('Abierto en modo copia: al guardar se descarga el archivo nuevo.');
  } catch (e) { toast(e.message, 6000); }
}
// ---- base del juego (Player.bin del Parche) → entradas del EDIT ----
let DBRAW = null;
// campos de la sección "Habilidad" del EDIT y dónde están en Player.bin [bit, bits, suma]; verificado con jugadores que el juego guardó en tu EDIT
const DB_TO_EDIT = () => Object.assign(Object.fromEntries(Object.entries(DB_ABIL).map(([k, p]) => [k, [p, 6, 40]])), { nation: [233, 9, 0], age: [408, 6, 15], reg_pos: [434, 4, 0], form: [438, 3, 0], weak_use: [454, 2, 0], weak_acc: [462, 2, 0], injury: [458, 2, 0], star: [451, 3, 0] });
function dbBits(o, pos, n) { const b = DBRAW.b; let v = 0; for (let i = 0; i < n; i++) { const q = pos + i; if ((b[o + (q >> 3)] >> (q & 7)) & 1) v |= 1 << i; } return v; }
function dbStr(o, l) { const s = DBRAW.b.subarray(o, o + l), z = s.indexOf(0); return new TextDecoder().decode(z < 0 ? s : s.subarray(0, z)); }
const canMakeEditPlayer = id => !!(DBRAW && DBRAW.off.has(id));
// agrega al EDIT a jugadores de la base: solo se marca la sección Habilidad, el resto lo sigue tomando el juego del Parche
function editPlayersRegion(extra) { const n = S.d[96] | S.d[97] << 8; return [[96, 2], [0x7C, (n + extra) * 0x138]]; }
function insertEditPlayers(ids) {
  const made = [];
  for (const id of [...new Set(ids)].sort((a, b) => a - b)) {
    if (S.ix.byId.has(id) || !canMakeEditPlayer(id)) continue;
    const n = S.d[96] | S.d[97] << 8, u32 = o => (S.d[o] | S.d[o + 1] << 8 | S.d[o + 2] << 16 | S.d[o + 3] << 24) >>> 0;
    if (0x7C + (n + 1) * 0x138 > 0x8ED2FC) break;
    let k = 0; while (k < n && u32(0x7C + k * 0x138) < id) k++;
    const start = 0x7C + k * 0x138, end = 0x7C + n * 0x138;
    S.d.copyWithin(start + 0x138, start, end); S.d.fill(0, start, start + 0x138);
    S.d[96] = (n + 1) & 255; S.d[97] = (n + 1) >> 8;
    const o = DBRAW.off.get(id), set = (key, v) => PD.player.set(S.d, start, key, v);
    set('id', id); set('comm_id', id);
    for (const [key, [pos, bits, add]] of Object.entries(DB_TO_EDIT())) set(key, dbBits(o, pos, bits) + add);
    set('name', dbStr(o + 0xFB, 61)); set('shirt', dbStr(o + 0x81, 61)); set('height', DBRAW.b[o + 0x1B] + 100);
    set('e_ability', 1);
    made.push(id);
    S.ix = PD.index(S.d, S.f.game);
  }
  return made;
}
async function namesFromBin(bytes) {
  let b = bytes;
  if (b[3] === 0x57 && b[4] === 0x45 && b[5] === 0x53 && b[6] === 0x59 && b[7] === 0x53) {
    const ds = new Blob([b.subarray(16)]).stream().pipeThrough(new DecompressionStream('deflate'));
    b = new Uint8Array(await new Response(ds).arrayBuffer());
  }
  if (!b.length || b.length % 0x138) throw new Error('No parece un Player.bin de PES 2021.');
  const td = new TextDecoder(); const str = (o, l) => { const s2 = b.subarray(o, o + l); const z = s2.indexOf(0); return td.decode(z < 0 ? s2 : s2.subarray(0, z)); };
  const out = new Map();
  const bitsAt = (o, pos, n) => { let v = 0; for (let i = 0; i < n; i++) { const p = pos + i; if ((b[o + (p >> 3)] >> (p & 7)) & 1) v |= 1 << i; } return v; };
  for (let o = 0; o < b.length; o += 0x138) {
    const id = (b[o + 8] | b[o + 9] << 8 | b[o + 10] << 16 | b[o + 11] << 24) >>> 0;
    const name = str(o + 0xFB, 61) || str(o + 0x81, 61);
    if (!id || !name) continue;
    const pos = bitsAt(o, 434, 4);
    const ab = k => bitsAt(o, DB_ABIL[k], 6) + 40;
    const keys = KEY_ABIL[POS_KEY[pos] || 'cmf'];
    const r = pos <= 12 ? Math.round(posFormula(POS_KEY[pos], ab)) : 0;
    out.set(id, { name, pos: pos <= 12 ? pos : null, r, h: b[o + 0x1B] + 100, a: bitsAt(o, 408, 6) + 15, n: bitsAt(o, 233, 9) });
  }
  DBRAW = { b, off: new Map([...Array(b.length / 0x138).keys()].map(i => [(b[i * 0x138 + 8] | b[i * 0x138 + 9] << 8 | b[i * 0x138 + 10] << 16 | b[i * 0x138 + 11] << 24) >>> 0, i * 0x138])) };
  return out;
}
const NAMES_LS = 'edit21-names-v5';
function namesSave() { try { localStorage.setItem(NAMES_LS, JSON.stringify({ from: S.namesFrom, list: [...S.names].map(([id, v]) => [id, v.name, v.pos, v.r, v.a || 0, v.n || 0]) })); } catch { } }
function namesLoadCache() { try { const j = JSON.parse(localStorage.getItem(NAMES_LS) || 'null'); if (j) { S.names = new Map(j.list.map(([id, n, pos, r, a, nat]) => [id, { name: n, pos: pos ?? null, r: r || 0, a: a || 0, n: nat || 0 }])); S.namesFrom = j.from; } } catch { } }
async function loadNames(file) {
  try {
    const m = await namesFromBin(new Uint8Array(await file.arrayBuffer()));
    for (const [k, v] of m) S.names.set(k, v); RATE_GEN++;
    S.namesFrom = file.name; namesSave();
    toast(m.size.toLocaleString('es-AR') + ' nombres cargados.');
    render();
  } catch (e) { toast('No se pudieron leer los nombres: ' + e.message, 6000); }
}
function confirmBox(msg) {
  return new Promise(res => {
    const t = $('toast'); t.innerHTML = `${esc(msg)} <button type="button" data-y>Sí</button><button type="button" data-n>No</button>`;
    t.hidden = false; clearTimeout(toastT);
    t.querySelector('[data-y]').onclick = () => { t.hidden = true; res(true); };
    t.querySelector('[data-n]').onclick = () => { t.hidden = true; res(false); };
  });
}

// ---------- saving ----------
function stamp() { const d = new Date(), z = n => String(n).padStart(2, '0'); return d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + '-' + z(d.getHours()) + z(d.getMinutes()) + z(d.getSeconds()); }
async function downloadBytes(name, bytes) {
  if (window.claude && window.claude.use) {
    const dl = await window.claude.use('downloads');
    if (dl) {
      try { await dl.save({ filename: name + '.zip', data: zip(name, bytes) }); return true; }
      catch (e) { toast(e.code === 'declined' ? 'Descarga cancelada.' : 'No se pudo descargar.'); return false; }
    }
  }
  const url = URL.createObjectURL(new Blob([bytes]));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return true;
}
// el juego lee el EDIT solo al arrancar: después de guardar hay que reiniciarlo
function savedNotice() {
  const d = document.createElement('div'); d.className = 'savednote';
  d.innerHTML = `<b>💾 Guardado y verificado</b><span>El juego lee el EDIT <u>solo al iniciar</u>. Si PES está abierto: salí al escritorio y volvé a abrirlo con Sider para ver los cambios. No guardes nada en el juego antes de reiniciarlo, porque pisaría lo del editor.</span><button type="button" class="btn small">Entendido</button>`;
  document.body.appendChild(d); const close = () => { d.classList.add('out'); setTimeout(() => d.remove(), 250); };
  d.querySelector('button').onclick = close; setTimeout(close, 12000);
}
async function reloadFromGame(force) {
  if (!S.editHandle) return;
  if (!force && pending() && !await confirmBox('Tenés cambios sin guardar. ¿Recargar el EDIT del juego y perderlos?')) return;
  try {
    const f = await S.editHandle.getFile(), bytes = new Uint8Array(await f.arrayBuffer());
    const keep = { tab: S.tab, team: S.team, ttab: S.ttab, player: S.player };
    openBytes(bytes, S.name); S.mtime = f.lastModified; Object.assign(S, keep); RATE_GEN++; render();
    toast('🔄 EDIT recargado desde la carpeta del juego.');
  } catch (e) { toast('No se pudo recargar: ' + e.message, 6000); }
}
// al volver a la ventana: si el juego guardó el EDIT, avisar o recargar solo
window.addEventListener('focus', async () => {
  if (!S.editHandle || !S.mtime) return;
  try {
    const f = await S.editHandle.getFile(); if (f.lastModified <= S.mtime + 1000) return;
    if (!pending()) await reloadFromGame(true), toast('🔄 El juego guardó el EDIT: lo recargué para que veas lo mismo que el juego.', 6000);
    else toast('El juego modificó el EDIT y vos tenés cambios sin guardar.', 9000, ['Recargar el del juego', () => reloadFromGame()]);
  } catch { }
});
// cifra y vuelve a descifrar para revisar el resultado; si algo no cierra, no devuelve nada y avisa
async function buildChecked() {
  const bytes = PesCrypt.encrypt(S.f);
  const errs = EditCheck.check(bytes, S.f, S.origData);
  if (!errs.length) return bytes;
  await choiceBox({ title: '⛔ No se guardó nada', html: '<p>Antes de escribir el EDIT lo volví a abrir para revisarlo y encontré problemas. Para no dañar tu archivo, el guardado se canceló.</p><ul>' + errs.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul><p class="note">Tu archivo original sigue intacto. Podés deshacer el último cambio (Ctrl+Z) y probar de nuevo, o reportar el error con esta lista.</p>', options: [{ k: 'ok', label: 'Entendido', cls: 'primary' }] });
  return null;
}
async function save() {
  if (!S.f) return;
  const bytes = await buildChecked();
  if (!bytes) return;
  if (S.editHandle) {
    try {
      const cur = (await S.editHandle.getFile()).lastModified;
      if (S.mtime && cur > S.mtime + 1000) {
        const k = await choiceBox({ title: '⚠ El juego cambió el EDIT', html: '<p>Desde que lo abriste, el archivo EDIT fue modificado (seguramente por el juego, que guarda al salir del modo Editar o al cerrar).</p><p>Si guardás ahora, <b>pisás</b> lo que guardó el juego. Si el juego sigue abierto, cerralo antes: el juego lee el EDIT solo al iniciar y lo vuelve a escribir al salir.</p>', options: [{ k: 'no', label: 'Cancelar' }, { k: 'reload', label: '🔄 Recargar el del juego (pierdo mis cambios)' }, { k: 'yes', label: 'Guardar igual', cls: 'primary' }] });
        if (k === 'no') return;
        if (k === 'reload') { await reloadFromGame(true); return; }
      }
      if (!S.backedUp) {
        const bh = await S.dir.getFileHandle('EDIT00000000.respaldo-' + stamp(), { create: true });
        const bw = await bh.createWritable(); await bw.write(S.orig); await bw.close();
        S.backedUp = true;
      }
      const w = await S.editHandle.createWritable(); await w.write(bytes); await w.close();
      const back = new Uint8Array(await (await S.editHandle.getFile()).arrayBuffer());
      const ok = back.length === bytes.length && back.every((v, i) => v === bytes[i]);
      S.mtime = (await S.editHandle.getFile()).lastModified;
      S.savedHp = S.hp; updateTop(); render();
      if (ok) savedNotice(); else toast('Se guardó, pero la verificación no coincide. Revisá el respaldo.', 6000);
    } catch (e) { toast('No se pudo escribir: ' + e.message + '. Si el juego está abierto, cerralo y probá de nuevo.', 8000); }
  } else if (await downloadBytes('EDIT00000000', bytes)) { S.savedHp = S.hp; updateTop(); render(); toast('Archivo generado. Copialo a la carpeta del juego reemplazando el anterior.', 5000); }
}
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function zip(name, data) {
  let c = 0xffffffff; for (let i = 0; i < data.length; i++) c = CRC[(c ^ data[i]) & 255] ^ (c >>> 8); const crc = (c ^ 0xffffffff) >>> 0;
  const nb = new TextEncoder().encode(name), n = data.length;
  const lh = new DataView(new ArrayBuffer(30)); lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint32(14, crc, true); lh.setUint32(18, n, true); lh.setUint32(22, n, true); lh.setUint16(26, nb.length, true);
  const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint32(16, crc, true); ch.setUint32(20, n, true); ch.setUint32(24, n, true); ch.setUint16(28, nb.length, true);
  const end = new DataView(new ArrayBuffer(22)); end.setUint32(0, 0x06054b50, true); end.setUint16(8, 1, true); end.setUint16(10, 1, true); end.setUint32(12, 46 + nb.length, true); end.setUint32(16, 30 + nb.length + n, true);
  return new Blob([lh, nb, data, ch, nb, end]);
}

// ---------- top bar ----------
function updateTop() {
  const st = $('status');
  if (!S.f) { st.textContent = ''; $('bSave').disabled = true; return; }
  const n = Math.abs(S.hp - S.savedHp);
  st.innerHTML = `${S.dir ? '' : '<span class="chip warn">Modo copia</span>'} ${pending() ? `<span class="chip warn">${S.savedHp < 0 ? 'Cambios' : n + ' cambio' + (n > 1 ? 's' : '')} sin guardar</span>` : '<span class="chip">Todo guardado</span>'}`;
  $('bSave').disabled = !pending();
  $('bSave').textContent = S.dir ? 'Guardar en el juego' : 'Guardar copia';
  $('bUndo').disabled = !S.hp; $('bRedo').disabled = S.hp >= S.hist.length;
  $('bUndo').title = S.hp ? 'Deshacer: ' + S.hist[S.hp - 1].label + ' (Ctrl+Z)' : 'Deshacer (Ctrl+Z)';
  $('cTeams').textContent = S.ix.teams.filter(t => !isNat(t)).length; $('cNats').textContent = S.ix.teams.filter(isNat).length; setPlayerCount();
  $('cChanges').textContent = S.hp ? S.hp : '';
}

// ---------- global search ----------
function gsearch(q) {
  const box = $('gres'); q = q.trim().toLowerCase();
  if (q.length < 2) { box.hidden = true; return; }
  const out = [];
  for (const t of S.ix.teams) { const n = tget(t, 'name'); if (n.toLowerCase().includes(q) || tget(t, 'short').toLowerCase() === q) out.push(['t', t.id, n, 'Equipo · ' + PD.roster(S.d, t).length + ' jug.']); if (out.length > 8) break; }
  for (const p of S.ix.players) { const n = pget(p, 'name'); if (n.toLowerCase().includes(q) || String(p.id) === q) out.push(['p', p.id, n, 'Jugador editable · ' + POS[pget(p, 'reg_pos')]]); if (out.length > 16) break; }
  if (S.names.size && out.length < 24) { let k = 0; for (const [id, v] of S.names) { if (S.ix.byId.has(id)) continue; if (!(v.name || '').toLowerCase().includes(q) && String(id) !== q) continue; if (teamOf.has(id)) { const t = clubOf(id); out.push(['n', t.id, v.name, 'en ' + tget(t, 'name')]); } else if (v.pos != null) { const c = dbClubOf(id); out.push(['d', id, v.name, 'Base del Parche · ' + POS[v.pos] + (c ? ' · ' + dbTeamName(c.tid) : '')]); } if (++k > 8) break; } }
  box.innerHTML = out.length ? out.map(([k, id, n, m], i) => `<button type="button" data-k="${k}" data-id="${id}" class="${i ? '' : 'on'}"><span>${esc(n)}</span><span class="k">${esc(m)}</span></button>`).join('') : '<div class="empty">Sin resultados.</div>';
  box.hidden = false;
}
function gpick(b) {
  $('gres').hidden = true; $('gq').value = '';
  if (b.dataset.k === 'p') { S.player = +b.dataset.id; S.pSrc = 'edit'; setTab('players'); }
  if (b.dataset.k === 'd') { S.dbPlayer = +b.dataset.id; S.pSrc = 'db'; S.qPlayer = ''; S.pFilter = 'all'; setTab('players'); }
  else { const t = S.ix.teamById.get(+b.dataset.id), nat = t && isNat(t); S.teamByTab[nat ? 'nats' : 'teams'] = +b.dataset.id; if (S.tab === (nat ? 'nats' : 'teams')) S.team = +b.dataset.id; S.ttab = 'roster'; setTab(nat ? 'nats' : 'teams'); }
}

// ---------- render ----------
function setTab(t) {
  const same = S.tab === t;
  if (!same) { if (S.tab === 'teams' || S.tab === 'nats') { S.teamByTab[S.tab] = S.team; S.qTeam = ''; } if (t === 'teams' || t === 'nats') { S.team = S.teamByTab[t] ?? null; if (t === 'nats' && !S.natSeen) { S.ttab = 'call'; S.natSeen = true; } if (t === 'teams' && S.ttab === 'call') S.ttab = 'roster'; S.fsel = null; S.fbench = null; } }
  S.tab = t; for (const [id, k] of [['tTeams', 'teams'], ['tNats', 'nats'], ['tPlayers', 'players'], ['tWepes', 'wepes'], ['tFile', 'file'], ['tNews', 'news']]) $(id).setAttribute('aria-selected', String(k === t)); same ? render() : leave(S.f && $('main'), render);
}
function render() {
  const m = $('main');
  if (!S.f && S.tab === 'wepes') { renderWepes(m); return; }
  if (S.tab === 'news') { renderNews(m); return; }
  if (!S.f) { m.innerHTML = welcome(); const w = $('wFind'); if (w) w.onclick = () => pesStart(); return; }
  if (S.tab === 'teams' || S.tab === 'nats') renderTeams(m); else if (S.tab === 'players') renderPlayers(m); else if (S.tab === 'wepes') renderWepes(m); else renderFile(m);
}
function welcome() {
  return `<section class="hero">
    <h1>Editá tu EDIT sin perder los cambios</h1>
    <p>El editor busca solo el archivo EDIT00000000 en <code>Documentos\\KONAMI\\eFootball PES 2021 SEASON UPDATE</code> (primero el del Parche, en <code>drmp</code>; si no, el de <code>save</code>) y también la carpeta WEPES. Guarda en el mismo lugar, con la firma de tu PC y un respaldo antes del primer guardado de cada sesión.</p>
    <div class="row"><button class="btn primary big" type="button" id="wFind">🔎 Buscar mi EDIT</button></div>
    <ol><li>Cerrá el juego (o salí del modo Editar) antes de guardar.</li><li>Editá y tocá <b>Guardar</b> (o Ctrl+S).</li><li>Abrí el juego con Sider.</li></ol>
    <p class="note">Atajos: <code>/</code> buscar · <code>Ctrl+Z</code> deshacer · <code>Ctrl+Y</code> rehacer · <code>Ctrl+S</code> guardar.</p>
  </section>`;
}

// ----- teams -----
const COLL = new Intl.Collator('es');
function teamList() {
  // el nombre se decodifica una sola vez por equipo (antes se leía del archivo en cada comparación del orden)
  const NM = new Map(), nmOf = t => { let v = NM.get(t); if (v == null) { v = tget(t, 'name').replace(/^[-\s]+$/, ''); NM.set(t, v); } return v; };
  const q = normName(S.qTeam).toLowerCase(), dk = dirtyKeys();
  const list = S.ix.teams.filter(t => {
    if (!S.showEmpty && !PD.roster(S.d, t).length) return false;
    if ((S.tab === 'nats') !== isNat(t)) return false;
    if (S.tFilter === 'dirty' && !dk.has('t' + t.id)) return false;
    if (S.tFilter === 'custom' && !(tget(t, 'e_name') || PD.roster(S.d, t).some(x => S.ix.byId.has(x.pid)))) return false;
    return !q || normName(tget(t, 'name')).toLowerCase().includes(q) || tget(t, 'short').toLowerCase().includes(q) || String(t.id) === q;
  });
  const by = {
    name: (a, b) => { const na = nmOf(a), nb = nmOf(b); return (!na - !nb) || COLL.compare(na, nb); },
    id: (a, b) => a.id - b.id,
    rating: (a, b) => ((teamRating(b) || {}).score || 0) - ((teamRating(a) || {}).score || 0),
    value: (a, b) => ((teamRating(b) || {}).value || 0) - ((teamRating(a) || {}).value || 0),
    count: (a, b) => PD.roster(S.d, b).length - PD.roster(S.d, a).length,
  }[S.tSort] || null;
  return by ? list.sort(by) : list;
}
function renderTeams(m) {
  const list = teamList(), dk = dirtyKeys();
  const t = S.ix.teamById.get(S.team) || list[0];
  if (t) S.team = t.id;
  uiTheme();
  // la lista de equipos (600+ filas con escudo) solo se vuelve a armar si cambió algo de ella;
  // al elegir otro equipo o cambiar de pestaña se reemplaza solo la ficha de la derecha
  const lh = `<div class="list-head">
        <input type="search" id="qTeam" placeholder="${S.tab === 'nats' ? 'Buscar selección…' : 'Buscar equipo, sigla o ID…'}" value="${esc(S.qTeam)}" aria-label="Buscar equipos">
        <div class="fchips" id="tFilter">${[['all', S.tab === 'nats' ? 'Todas' : 'Todos'], ['custom', 'Editados'], ['dirty', 'Sin guardar']].map(([k, n]) => `<button type="button" data-tf="${k}" aria-pressed="${S.tFilter === k}">${n}</button>`).join('')}</div>
        <div class="row" style="flex-wrap:nowrap"><label class="lab" for="tSort" style="white-space:nowrap">Ordenar</label><select id="tSort">${[['name', 'Nombre (A-Z)'], ['rating', 'Valoración'], ['value', 'Valor de mercado del club'], ['count', 'Cantidad de jugadores'], ['id', 'ID del juego']].map(([k, n]) => `<option value="${k}" ${S.tSort === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="row" style="justify-content:space-between"><label class="chk"><input type="checkbox" id="showEmpty" ${S.showEmpty ? 'checked' : ''}> Incluir sin plantel</label><label class="chk" title="Si el escudo no está en las carpetas del Parche, se busca por nombre en TheSportsDB y queda guardado."><input type="checkbox" id="onBadge" ${PREFS.onlineBadges ? 'checked' : ''}> Escudos de internet</label><span class="sub">${list.length} ${S.tab === 'nats' ? 'selecciones' : 'equipos'}</span></div>
      </div>
      <div class="list-body" id="teamItems">${list.map(x => { const tr = teamRating(x), n = PD.roster(S.d, x).length; return `<button class="item" data-t="${x.id}" type="button">
        ${crest(x)}<span style="min-width:0"><span class="nm">${esc(tget(x, 'name') || '(sin nombre)')}${dk.has('t' + x.id) ? '<span class="dot" title="Con cambios sin guardar"></span>' : ''}</span>
        <span class="sub2">${isNat(x) ? 'Selección' : 'Club'} · ${n} jug.${tr ? ' · ' + fmtMoney(tr.value) : ''}</span></span><span class="meta">${tr ? `<b class="${vcls(tr.score)}">${tr.score}</b>${starsHtml(tr.stars).replace('class="stars"', 'class="stars mini"')}` : `<span class="sub">ID ${x.id}</span>`}</span></button>`; }).join('') || '<div class="empty">Sin resultados.</div>'}</div>`;
  const sheetHtml = t ? teamSheet(t) : '<div class="card empty">Elegí un equipo.</div>';
  const keep = m._lh === lh && m.querySelector(':scope > .split > aside.list #teamItems') && $('teamSheet');
  if (keep) {
    const ns = document.createElement('section'); ns.className = 'sheet'; ns.id = 'teamSheet'; ns.innerHTML = sheetHtml; $('teamSheet').replaceWith(ns);
    m.querySelectorAll('#teamItems .item.on').forEach(x => x.classList.remove('on'));
    const on = t && m.querySelector(`#teamItems [data-t="${t.id}"]`); if (on) on.classList.add('on');
    if (t) bindTeam(t, m);
    return;
  }
  m._lh = lh;
  m.innerHTML = `<div class="split"><aside class="list">${lh}</aside><section class="sheet" id="teamSheet">${sheetHtml}</section></div>`;
  { const on = t && m.querySelector(`#teamItems [data-t="${t.id}"]`); if (on) on.classList.add('on'); }
  $('qTeam').oninput = e => { S.qTeam = e.target.value; const pos = e.target.selectionStart; flipRender(m, () => renderTeams(m)); const el = $('qTeam'); el.focus(); el.setSelectionRange(pos, pos); el.classList.add('kick'); };
  $('showEmpty').onchange = e => { S.showEmpty = e.target.checked; later(() => renderTeams(m)); };
  $('onBadge').onchange = e => { PREFS.onlineBadges = e.target.checked; savePrefs(); later(() => renderTeams(m)); };
  $('tSort').onchange = e => { S.tSort = e.target.value; later(() => { flipRender(m, () => renderTeams(m)); const sel = $('tSort'); sel && sel.classList.add('kick'); }); };
  $('tFilter').onclick = e => { const b = e.target.closest('[data-tf]'); if (b) { S.tFilter = b.dataset.tf; renderTeams(m); } };
  $('teamItems').onclick = e => { const b = e.target.closest('[data-t]'); if (b && +b.dataset.t !== S.team) { S.team = +b.dataset.t; S.fsel = null; S.fbench = null; m.querySelectorAll('.item.on').forEach(x => x.classList.remove('on')); b.classList.add('on'); leave($('teamSheet'), () => renderTeams(m)); } };
  if (t) bindTeam(t, m);
}
function teamSheet(t) {
  const r = PD.roster(S.d, t);
  const tabs = [...(isNat(t) ? [['call', 'Convocatoria']] : []), ['roster', 'Plantel'], ['tactics', 'Formación'], ['data', 'Datos y colores'], ['kits', 'Estudio de kits'], ['stadium', 'Estadio, rivales y banderas']];
  if (S.ttab === 'call' && !isNat(t)) S.ttab = 'roster';
  FACE_CTX.nat = isNat(t);
  const coach = tget(t, 'manager_id');
  return `<div class="card tcard" style="--t1:${teamColor(t, 1)};--t2:${teamColor(t, 2)}">
    <div class="head">${crest(t, '', true)}${shirtSvg(kitFor(t, false), '2.6em')}<div style="min-width:0"><h2>${esc(tget(t, 'name'))}</h2>
      <div class="sub">ID ${t.id} · ${isNat(t) ? 'Selección' : 'Club'} · ${r.length}/40 jugadores${(() => { const tr = teamRating(t), l = leagueOf(t); return (l ? ' · ' + esc(LEAGUE_NAME[l] || l) : '') + (tr ? ' · valor ' + fmtMoney(tr.value) : ''); })()} · DT ${esc(COACH.get(coach) || 'ID ' + coach)} · ${esc(STADIUM.get(tget(t, 'stadium_id')) || 'Estadio ' + tget(t, 'stadium_id'))}</div></div></div>
    <div class="subtabs" role="tablist">${tabs.map(([k, n]) => `<button type="button" role="tab" data-ttab="${k}" aria-selected="${S.ttab === k}">${n}</button>`).join('')}</div>
  </div>
  ${S.ttab === 'kits' ? kitStudioCard(t) : S.ttab === 'call' ? callCard(t) : S.ttab === 'roster' ? dbRosterCard(t) + rosterCard(t) + squadCard(t) : S.ttab === 'tactics' ? tacticsCard(t) : S.ttab === 'data' ? teamDataCard(t) : stadiumCard(t)}
  ${helpCard(S.ttab)}`;
}
function teamDataCard(t) {
  const coach = tget(t, 'manager_id');
  return `<div class="card">
    <div class="grid wide">
      <div class="f"><label for="tName">Nombre</label><input type="text" id="tName" value="${esc(tget(t, 'name'))}" maxlength="69"></div>
      <div class="f"><label for="tShort">Abreviatura (3 letras)</label><input type="text" id="tShort" value="${esc(tget(t, 'short'))}" maxlength="3" style="text-transform:uppercase"></div>
      <div class="f"><span class="lab">Colores del equipo</span><div class="swatch"><input type="color" id="tC1" value="${teamColor(t, 1)}" aria-label="Color principal"><input type="color" id="tC2" value="${teamColor(t, 2)}" aria-label="Color secundario"><span class="note">Principal y secundario</span></div></div>
      <div class="f"><label for="tCountry">País del equipo</label><select id="tCountry">${COUNTRY.has(tget(t, 'country')) ? '' : `<option value="${tget(t, 'country')}" selected>Código ${tget(t, 'country')}</option>`}${[...COUNTRY].sort((a, b) => a[1].localeCompare(b[1], 'es')).map(([id, n]) => `<option value="${id}" ${id === tget(t, 'country') ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
      <div class="f"><label for="tCoach">Entrenador</label><select id="tCoach">${COACH.has(coach) ? '' : `<option value="${coach}" selected>ID ${coach} (del Parche)</option>`}${[...COACH].sort((a, b) => a[1].localeCompare(b[1])).map(([id, n]) => `<option value="${id}" ${id === coach ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
    </div>
    <h3>Kits</h3>${kitStrip(t)}
    ${KITS.map.has(t.id) ? '<div class="row"><button class="btn small" type="button" id="tUseKit">Usar los colores del kit local como colores del equipo</button></div>' : ''}
    <label class="lock ${tget(t, 'e_name') ? '' : 'off'}"><input type="checkbox" id="tLock" ${tget(t, 'e_name') ? 'checked' : ''}>
      <div><b>Proteger nombre y abreviatura</b><span>El juego mantiene tu nombre aunque el Parche traiga otro. Se activa solo al cambiarlo.</span></div></label>
  </div>`;
}
function stadiumCard(t) {
  const sid = tget(t, 'stadium_id');
  const teams = [...S.ix.teams].filter(x => x.id !== t.id && PD.roster(S.d, x).length).sort((a, b) => tget(a, 'name').localeCompare(tget(b, 'name')));
  const rivalSel = k => { const v = tget(t, k); return `<select data-rival="${k}" aria-label="Rival"><option value="${NO_RIVAL}" ${v === NO_RIVAL ? 'selected' : ''}>Ninguno</option>${!S.ix.teamById.has(v) && v !== NO_RIVAL ? `<option value="${v}" selected>ID ${v}</option>` : ''}${teams.map(x => `<option value="${x.id}" ${x.id === v ? 'selected' : ''}>${esc(tget(x, 'name'))}</option>`).join('')}</select>`; };
  return `<div class="card"><h3>Estadio</h3>
    <div class="grid wide">
      <div class="f"><label for="tStad">Estadio que usa</label><select id="tStad">${STADIUM.has(sid) ? '' : `<option value="${sid}" selected>ID ${sid}</option>`}${[...STADIUM].map(([id, n]) => `<option value="${id}" ${id === sid ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
      <div class="f"><label for="tStadName">Nombre propio del estadio</label><input type="text" id="tStadName" value="${esc(tget(t, 'stadium_name'))}" maxlength="120" placeholder="Vacío = el del juego"></div>
    </div></div>
  <div class="card"><h3>Rivales clásicos</h3><div class="grid wide">
    <div class="f"><span class="lab">Rival 1</span>${rivalSel('rival1')}</div><div class="f"><span class="lab">Rival 2</span>${rivalSel('rival2')}</div><div class="f"><span class="lab">Rival 3</span>${rivalSel('rival3')}</div></div>
    <p class="note">El juego usa los rivales para los clásicos y el ambiente de los partidos.</p></div>
  <div class="card"><h3>Banderas de la hinchada</h3><div class="grid wide">
    ${[1, 2, 3, 4].map(i => `<div class="f"><label for="tBan${i}">Bandera ${i}</label><input type="text" id="tBan${i}" data-banner="banner${i}" value="${esc(tget(t, 'banner' + i))}" maxlength="15"></div>`).join('')}</div>
    <p class="note">Hasta 15 caracteres cada una.</p></div>`;
}
// bandera chiquita de la nación: la bandera real (flagcdn.com, necesita internet); sin conexión queda el escudo de su selección
// (con la carpeta Sider es la bandera del Parche; si no, sus colores). Código de país del juego → código ISO de la bandera.
const FLAG_ISO = new Map('1:af,2:bh,3:bd,4:bt,5:bn,6:kh,7:cn,8:hk,9:in,10:id,11:ir,12:iq,13:jp,14:jo,15:kp,16:kr,17:kw,18:la,19:lb,20:mo,21:my,22:mv,23:mn,24:mm,25:np,26:om,27:pk,28:ps,29:ph,30:qa,31:sa,32:sg,33:lk,34:sy,36:th,37:ae,38:vn,39:ye,40:kg,41:tj,42:tm,43:tl,44:dz,45:ao,46:bj,47:bw,48:bf,49:bi,50:cm,51:cv,52:cf,53:td,54:km,55:cd,56:ci,57:dj,58:eg,59:gq,60:er,61:et,62:ga,63:gm,64:gh,65:gn,66:gw,67:ke,68:ls,69:lr,70:ly,71:mg,72:mw,73:ml,74:mr,75:mu,76:ma,77:mz,78:na,79:ne,80:ng,81:rw,82:st,83:sn,84:sc,85:sl,86:so,87:za,88:sd,89:sz,90:tz,91:tg,92:tn,93:ug,94:zm,95:zw,98:cg,103:ai,104:ag,105:aw,106:bs,107:bb,108:bz,109:bm,110:ca,111:ky,112:cr,113:cu,114:dm,115:do,116:sv,117:gd,119:gt,120:ht,121:hn,122:jm,124:mx,125:ms,127:ni,128:pa,129:pr,130:kn,131:lc,132:vc,133:tt,134:tc,135:us,136:vg,137:vi,139:sr,140:cw,144:ar,145:bo,146:br,147:cl,148:co,149:ec,150:py,151:pe,152:uy,153:ve,159:gy,161:as,162:au,163:ck,164:fj,165:nc,166:nz,167:pg,168:ws,169:sb,170:pf,171:to,172:vu,176:gu,184:pw,189:il,190:tr,191:al,192:ad,193:am,194:at,195:az,196:by,197:be,198:ba,199:bg,200:hr,201:cy,202:cz,203:dk,204:gb-eng,205:ee,206:fo,207:fi,208:fr,209:ge,210:de,211:gr,212:hu,213:is,214:ie,215:it,216:kz,217:lv,218:li,219:lt,220:lu,221:mk,222:mt,223:md,224:nl,225:gb-nir,226:no,227:pl,228:pt,229:ro,230:ru,231:sm,232:gb-sct,234:sk,235:si,236:es,237:se,238:ch,239:ua,240:uz,241:gb-wls,245:gi,250:mc,298:tw,303:rs,304:me,311:xk,312:ss'.split(',').map(x => { const [k, v] = x.split(':'); return [+k, v]; }));
const NAT_TEAM = new WeakMap();
function natFlag(n) {
  if (!S.ix) return '';
  let m = NAT_TEAM.get(S.ix); if (!m) NAT_TEAM.set(S.ix, m = new Map());
  if (!m.has(n)) m.set(n, S.ix.teams.find(x => isNat(x) && tget(x, 'country') === n) || null);
  const t = m.get(n), iso = FLAG_ISO.get(n);
  if (!t && !iso) return '';
  return `<span class="flagw">${t ? crest(t, 'flagmini') : '<span class="crest flagmini"></span>'}${iso ? `<img class="flagimg" src="https://flagcdn.com/w40/${iso}.png" srcset="https://flagcdn.com/w80/${iso}.png 2x" alt="" loading="lazy" onerror="this.remove()">` : ''}</span>`;
}
function ageValCells(pid, ro) {
  const i = pInfo(pid), pv = playerValue(pid);
  const tip = pv ? (pv.manual ? 'Valor cargado a mano' + (pv.est != null ? ' (el estimado era ' + fmtMoney(pv.est) + ')' : '') : `Estimado: valoración ${pv.r}, ${pv.ageKnown ? pv.a + ' años' : 'edad desconocida'}, potencial ~${pv.pot}, ${pv.club ? tget(pv.club, 'name') : 'sin club'}${pv.league ? ' (' + (LEAGUE_NAME[pv.league] || pv.league) + ')' : ''}`) : 'Sin datos para estimar';
  const m = pMeta(pid);
  return `<td class="mono c-age">${i && i.a ? i.a : ''}</td><td class="mono c-h">${m.h ? m.h : ''}</td><td class="c-nat">${m.nat ? `<span class="natw">${natFlag(m.nat)}<span class="natc" title="${esc(m.natName)}">${esc(m.natName)}</span></span>` : ''}</td><td class="mono c-foot">${m.foot}</td><td class="mono c-mv">${ro ? `<span title="${esc(tip)}" class="mval${pv && pv.manual ? ' man' : ''}">${pv ? fmtMoney(pv.v) : '—'}</span>` : `<button type="button" class="mval${pv && pv.manual ? ' man' : ''}" data-val="${pid}" title="${esc(tip)}. Tocá para cargar el valor real.">${pv ? fmtMoney(pv.v) : '—'}</button>`}</td>`;
}
// affiliate (reserve / B) teams: same base name + suffix, or "Jong <name>"
const FIL_RE = /^(.*?)\s+(B|II|U-?\d{2}|Sub-?\d{2}|Reserves|Reservas|Reserva|Castilla|Atl[eè]tic|Juvenil|Primavera|Youth|Academy|Next Gen|Futures)$/;
function filialBase(t) { const n = tget(t, 'name').trim(); let m = n.match(FIL_RE); if (m) return m[1]; m = n.match(/^Jong\s+(.+)$/); return m ? m[1] : null; }
const sameTeamName = (a, b) => { const k = s => normName(s).toLowerCase().replace(/\b(fc|cf|club|ac|sc|cd|ca)\b/g, '').replace(/\s+/g, ' ').trim(); return k(a) === k(b); };
function filialOf(t) { return S.ix.teams.find(x => x.id !== t.id && PD.roster(S.d, x).length && (() => { const b = filialBase(x); return b && sameTeamName(b, tget(t, 'name')); })()) || null; }
function parentOf(t) { const b = filialBase(t); return b ? S.ix.teams.find(x => x.id !== t.id && sameTeamName(tget(x, 'name'), b) && PD.roster(S.d, x).length) || null : null; }
// ===== Plantel como tabla de datos: columnas a elección, filtros, orden por encabezado, selección múltiple, exportar =====
const RCOLS = [
  ['sel', '', 'Seleccionar'], ['xi', 'XI', 'Titular (1-11), suplente en el banco (S1-S7) o reserva'], ['num', 'Dorsal', 'Dorsal'], ['player', 'Nombre del jugador', 'Nombre del jugador'], ['id', 'ID', 'ID del jugador'],
  ['pos', 'Pos.', 'Posición'], ['val', 'Val.', 'Valoración general'], ['age', 'Edad', 'Edad'], ['h', 'Altura', 'Altura en cm'], ['nat', 'Nac.', 'Nacionalidad'], ['foot', 'Pie', 'Pie hábil'],
  ['mv', 'Valor', 'Valor de mercado estimado. Tocalo para poner el valor real (por ejemplo, el de Transfermarkt).'], ['act', 'Acciones', 'Acciones: editar, hacer capitán, hacer titular, pasar a otro equipo o quitar']];
const RCOL_FIXED = new Set(['sel', 'player']);
const RSORT_KEY = { xi: 'xi', num: 'num', player: 'name', id: 'id', pos: 'pos', val: 'val', age: 'age', h: 'h', nat: 'nat', mv: 'mv' };
const RSORT_DESC = new Set(['val', 'mv', 'h']); // estas empiezan de mayor a menor
const rHide = () => new Set(Array.isArray(PREFS.rHide) ? PREFS.rHide : ['h', 'foot']);
const foldTxt = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function pMeta(pid) {
  const p = S.ix.byId.get(pid), n = S.names.get(pid);
  const nat = p ? pget(p, 'nation') : n && n.n, h = p ? pget(p, 'height') : n && n.h;
  return { h: h || 0, nat: nat || 0, natName: nat ? (COUNTRY.get(nat) || 'País ' + nat) : '', foot: p ? (pget(p, 'strong_foot') ? 'Izq.' : 'Der.') : '' };
}
function filialRows(t, fil, parent) {
  const other = fil || parent;
  if (!other) return `<tr><td colspan="20" class="empty">Este equipo no tiene filial en la base del juego (se busca un equipo con el mismo nombre y "B", "II", "U23", "Reserves", "Castilla"…).</td></tr>`;
  const up = !!fil;
  return `<tr class="filhead"><td colspan="20">${crest(other, 'mini')} <b>${esc(tget(other, 'name'))}</b> · ${up ? 'filial' : 'primer equipo'} · ${PD.roster(S.d, other).length} jugadores</td></tr>` +
    PD.roster(S.d, other).sort((a, b) => ((pInfo(b.pid) || { r: 0 }).r) - ((pInfo(a.pid) || { r: 0 }).r)).map(x => { const i = pInfo(x.pid), m = pMeta(x.pid); return `<tr class="filial">
      <td class="c-sel"></td><td class="stno c-xi">${up ? 'FIL' : '1º'}</td><td class="num mono c-num">${x.number}</td>
      <td class="c-player">${shirtSvg(kitFor(other, false), '1.15em')} ${esc(playerName(x.pid) || 'ID ' + x.pid)}</td><td class="idc c-id">${x.pid}</td>
      <td class="c-pos">${i ? posBadge(i.pos) : ''}</td>
      <td class="mono c-val">${i && i.r ? `<b class="${vcls(i.r)}">${i.r}</b>` : ''}</td>
      ${ageValCells(x.pid, true)}
      <td class="c-act"><button class="btn small" type="button" data-up="${x.pid}" data-from="${other.id}">${up ? 'Subir al primer equipo' : 'Bajar a este equipo'}</button></td></tr>`; }).join('');
}
function rosterRows(t) {
  const r = PD.roster(S.d, t), st = PD.starters(S.d, t), cap = PD.captainSlot(S.d, t);
  const ord = t.tacticsBase != null ? getOrder(t) : [], oi = slot => { const k = ord.indexOf(slot); return k < 0 ? 99 : k; };
  return r.map(x => {
    const i = pInfo(x.pid), m = pMeta(x.pid), si = st.indexOf(x.slot), o = oi(x.slot), pv = playerValue(x.pid), p = S.ix.byId.get(x.pid);
    return { x, pid: x.pid, slot: x.slot, num: x.number, name: playerName(x.pid) || '', si, oi: o, state: si >= 0 ? 'xi' : o < 18 ? 'bench' : 'res', xiLabel: si >= 0 ? String(si + 1) : o < 18 ? 'S' + (o - 10) : '',
      pos: i ? i.pos : 99, r: i && i.r ? i.r : 0, age: i && i.a ? i.a : 0, mv: pv ? pv.v : 0, cap: cap === x.slot, unl: !!(p && !isLocked(p)), p, i, ...m };
  });
}
function rosterSorted(t, rows) {
  const k = S.rosterSort, dir = S.rosterDir === -1 ? -1 : 1, st = PD.starters(S.d, t);
  const xi = (a, b) => { const ia = st.indexOf(a.slot), ib = st.indexOf(b.slot); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.slot - b.slot; };
  const cmp = {
    num: (a, b) => a.num - b.num, val: (a, b) => b.r - a.r || a.num - b.num, mv: (a, b) => b.mv - a.mv, pos: (a, b) => a.pos - b.pos || b.r - a.r,
    bench: (a, b) => ((a.oi < 11) - (b.oi < 11)) || a.oi - b.oi, name: (a, b) => (a.name || '~').localeCompare(b.name || '~', 'es'), id: (a, b) => a.pid - b.pid,
    age: (a, b) => (a.age || 99) - (b.age || 99), h: (a, b) => b.h - a.h, nat: (a, b) => (a.natName || '~').localeCompare(b.natName || '~', 'es') || b.r - a.r
  }[k] || xi;
  return [...rows].sort((a, b) => dir * cmp(a, b) || xi(a, b));
}
// plantel según la base del juego (Parche) para equipos que en tu EDIT están vacíos
function dbRosterCard(t) {
  if (typeof sdbRoster !== 'function' || PD.roster(S.d, t).length) return '';
  const db = sdbRoster(t); if (!db || !db.length) return '';
  const can = t.rosterBase != null;
  return `<section class="card"><h3>Plantel según la base del juego</h3><p class="note">En tu EDIT este equipo está vacío. Esto es lo que trae el Parche para él (${db.length} jugadores). ${can ? 'Podés copiarlo a tu EDIT para editarlo, o tocar un jugador para abrirlo.' : 'Tocá un jugador para abrirlo.'}</p>
    <div class="dbroster">${db.map(x => { const i = pInfo(x.pid), n = playerName(x.pid) || 'ID ' + x.pid; return `<button type="button" class="dbp" data-dbp="${x.pid}"><b class="num">${x.num || '–'}</b>${faceHtml(x.pid, kitFor(t, i && i.pos === 0), 'pl')}<span class="pn">${esc(n)}</span>${i ? posBadge(i.pos) : ''}<span class="mono">${i && i.r ? i.r : ''}</span></button>`; }).join('')}</div>
    ${can ? `<div class="row"><button class="btn primary" type="button" data-dbuse="${t.id}">Copiar este plantel a mi EDIT (${Math.min(40, db.length)} jugadores)</button><span class="note">Los que no estén en tu EDIT se agregan con sus habilidades; cara y nombre siguen saliendo del Parche.</span></div>` : ''}</section>`;
}
function rosterCard(t) {
  if (S.rselTeam !== t.id) { S.rsel = new Set(); S.rselTeam = t.id; S.rq = ''; }
  const full = PD.roster(S.d, t), st = PD.starters(S.d, t);
  const counts = {}; for (const x of full) counts[x.number] = (counts[x.number] || 0) + 1;
  const dups = Object.keys(counts).filter(k => counts[k] > 1 && +k);
  const fil = filialOf(t), parent = parentOf(t);
  const rows = rosterSorted(t, rosterRows(t)); S._rrows = rows;
  const others = S.ix.teams.filter(x => x.id !== t.id && x.rosterBase != null && PD.roster(S.d, x).length).sort((a, b) => tget(a, 'name').localeCompare(tget(b, 'name')));
  const opts = others.map(x => `<option value="${x.id}">${esc(tget(x, 'name'))}</option>`).join(''), optsM = opts.replace(/value="(\d+)"/g, 'value="m$1"');
  const starterOpts = st.map((s, i) => { const x = full.find(y => y.slot === s); return x ? `<option value="${i}">por ${esc(playerName(x.pid) || 'ID ' + x.pid)} (#${x.number})</option>` : ''; }).join('');
  // las listas de equipos (600+ opciones) no se dibujan en cada fila: se completan al abrir el menú (ver fillLazySelect)
  S._rOpts = { t: opts, m: optsM, s: starterOpts.replace(/value="(\d+)"/g, 'value="s$1"') };
  const editable = full.filter(x => S.ix.byId.has(x.pid));
  const hide = rHide(), dens = PREFS.rDens || 'normal';
  const sortCol = Object.keys(RSORT_KEY).find(c => RSORT_KEY[c] === S.rosterSort) || (S.rosterSort === 'filial' || S.rosterSort === 'xi' ? 'xi' : null);
  const th = ([k, n, tip]) => {
    if (k === 'sel') return `<th class="c-sel"><input type="checkbox" id="rselAll" aria-label="Seleccionar todos los que se ven"></th>`;
    const sk = RSORT_KEY[k], on = sk && sortCol === k, dir = on ? ((S.rosterDir === -1) !== RSORT_DESC.has(k) ? 'descending' : 'ascending') : null;
    return `<th class="c-${k}${sk ? ' sortable' : ''}${on ? ' on' : ''}" title="${esc(tip)}"${sk ? ` data-hsort="${k}" tabindex="0"` : ''}${dir ? ` aria-sort="${dir}"` : ''}>${n}${sk ? `<i class="sarr">${on ? (dir === 'descending' ? '▼' : '▲') : '↕'}</i>` : ''}</th>`;
  };
  const lockIco = p => `<span class="lockico" title="${esc(lockWord(p).slice(3))}: el Parche puede pisar sus datos">${LOCK_SVG}</span>`;
  const grp = [['all', 'Todos'], ['gk', 'ARQ'], ['df', 'DEF'], ['mf', 'MED'], ['fw', 'DEL']], sts = [['all', 'Todos'], ['xi', 'Titulares'], ['bench', 'Banco'], ['res', 'Reserva'], ['unl', 'Sin proteger']];
  return `<div class="card rcard">
    <div class="row" style="justify-content:space-between"><h3>Plantel · <span id="rcount">${rows.length}</span> jugadores</h3>
      <div class="row"><span class="note">Orden:</span><div class="seg" id="rsort">${[['xi', 'Titulares'], ['bench', 'Suplentes'], ['num', 'Dorsal'], ['pos', 'Posición'], ['val', 'Valoración'], ['mv', 'Valor'], ['filial', fil ? 'Filial' : parent ? 'Primer equipo' : 'Filial']].map(([k, n]) => `<button type="button" data-sort="${k}" aria-pressed="${S.rosterSort === k}">${n}</button>`).join('')}</div></div></div>
    <div class="dtbar">
      <input type="search" id="rq" placeholder="Filtrar: nombre, ID, dorsal o país…" value="${esc(S.rq || '')}" aria-label="Filtrar el plantel" autocomplete="off">
      <div class="fgroups"><div class="fgrp"><span class="flab" aria-hidden="true">Posición</span><div class="fchips" id="rgrp" aria-label="Posición">${grp.map(([k, n]) => `<button type="button" data-g="${k}" aria-pressed="${(S.rgrp || 'all') === k}">${n}</button>`).join('')}</div>
      </div><div class="fgrp"><span class="flab" aria-hidden="true">Estado</span><div class="fchips" id="rst" aria-label="Estado">${sts.map(([k, n]) => `<button type="button" data-st="${k}" aria-pressed="${(S.rst || 'all') === k}">${n}</button>`).join('')}</div></div></div>
      <div class="dttools">
        <div class="seg mini" id="rlook" title="Ver jugadores con">${[['photos', 'Fotos'], ['kits', 'Camisetas']].map(([k, n]) => `<button type="button" data-v="${k}" aria-pressed="${(PREFS.rLook || 'photos') === k}">${n}</button>`).join('')}</div>
        <div class="seg mini" id="rdens" title="Densidad de filas">${[['compact', '▤', 'Compacta'], ['normal', '☰', 'Normal'], ['comfy', '≡', 'Cómoda']].map(([k, ic, n]) => `<button type="button" data-d="${k}" aria-pressed="${dens === k}" title="${n}" aria-label="Filas: ${n}">${ic}</button>`).join('')}</div>
        <div class="pop"><button class="btn small" type="button" id="rcolsBtn" aria-expanded="false">Columnas</button>
          <div class="popmenu" id="rcols" hidden>${RCOLS.filter(([k]) => !RCOL_FIXED.has(k)).map(([k, n, tip]) => `<label class="chk"><input type="checkbox" data-col="${k}" ${hide.has(k) ? '' : 'checked'}> ${k === 'act' ? 'Acciones' : n === 'Val.' ? 'Valoración' : n === 'Nac.' ? 'Nacionalidad' : n === 'Pos.' ? 'Posición' : n === 'Cap.' ? 'Capitán' : n}</label>`).join('')}
            <button class="btn small ghost" type="button" id="rcolsReset">Volver a las de siempre</button></div></div>
        <div class="pop"><button class="btn small" type="button" id="rexpBtn" aria-expanded="false">Exportar</button>
          <div class="popmenu" id="rexp" hidden><button class="btn small ghost" type="button" data-exp="csv">Descargar CSV (Excel)</button><button class="btn small ghost" type="button" data-exp="tsv">Copiar para pegar en una planilla</button><p class="note">Sale lo que se ve: filtros y columnas actuales.</p></div></div>
      </div>
    </div>
    <div class="bulkbar" id="rbulk" hidden><b id="rbN">0</b> seleccionados
      <button class="btn small" type="button" id="rbLock">Proteger</button>
      <div class="pop"><button class="btn small" type="button" id="rbKitBtn" aria-expanded="false">Equipación…</button>
        <div class="popmenu kitmenu" id="rbKit" hidden>${KIT_BULK.map(([k, n, opts]) => `<div class="f"><label for="rbk_${k}">${n}</label><select id="rbk_${k}" data-bk="${k}"><option value="">Sin cambiar</option>${opts().map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('')}</select></div>`).join('')}
          <button class="btn small primary" type="button" id="rbKitGo">Aplicar a los seleccionados</button><p class="note">Solo cambia lo que elijas. Sirve para jugadores de tu EDIT.</p></div></div>
      <select id="rbMove" data-lazy="t" aria-label="Pasar los seleccionados a otro equipo" style="width:auto;max-width:170px"><option value="">Pasar a…</option></select>
      <button class="btn small danger" type="button" id="rbDel">Quitar del plantel</button>
      <button class="btn small ghost" type="button" id="rbClear">Deseleccionar</button></div>
    ${dups.length ? `<div class="warnbox">Dorsales repetidos: ${dups.map(d => '#' + d).join(', ')}. Usá "Arreglar dorsales repetidos" o cambialos a mano.</div>` : ''}
    <div class="tablebox dtbox"><table class="dt d-${dens} ${[...hide].map(k => 'h-' + k).join(' ')}" id="rtable">
      <thead><tr>${RCOLS.map(th).join('')}</tr></thead>
      <tbody>${rows.map(w => {
        const { x, p, i } = w, isGk = w.si === 0 || (p && pget(p, 'reg_pos') === 0), sel = S.rsel.has(w.pid);
        const q = foldTxt([w.name, w.pid, w.num, i ? POS[i.pos] : '', w.natName].join(' '));
        return `<tr class="prow ${w.si >= 0 ? 'starter' : ''} ${counts[w.num] > 1 && w.num ? 'dup' : ''}${sel ? ' sel' : ''}" data-pid="${w.pid}" data-q="${esc(q)}" data-g="${POS_GRP[w.pos] || ''}" data-st="${w.state}" data-unl="${w.unl ? 1 : ''}" data-r="${w.r}" data-a="${w.age}" data-mv="${w.mv}" data-h="${w.h}">
          <td class="c-sel"><input type="checkbox" data-sel="${w.pid}" ${sel ? 'checked' : ''} aria-label="Seleccionar ${esc(w.name || 'ID ' + w.pid)}"></td>
          <td class="stno c-xi">${w.si >= 0 ? w.si + 1 : w.oi < 18 ? `<span class="bnch">S${w.oi - 10}</span>` : ''}</td>
          <td class="num c-num"><input type="number" min="1" max="99" value="${w.num}" data-num="${w.slot}" aria-label="Dorsal"></td>
          <td class="c-player"><span class="pcell">${faceHtml(PREFS.rLook === 'kits' ? 0 : w.pid, kitFor(t, isGk), 'pl')}<span class="pn">${w.name ? esc(w.name) : `<span class="sub">sin nombre${S.names.size ? '' : ' · conectá la carpeta Sider'}</span>`}</span>${w.cap ? '<span class="capb" title="Capitán">C</span>' : ''}${w.unl ? lockIco(p) : ''}</span></td>
          <td class="idc c-id">${w.pid}</td>
          <td class="c-pos">${i ? posBadge(i.pos) : ''}</td>
          <td class="mono c-val">${i && i.r ? `<b class="${vcls(i.r)}">${i.r}</b>${adjHtml(i.adj, i.form)}` : ''}</td>
          ${ageValCells(w.pid)}
          <td class="c-act"><div class="acts">${p ? `<button class="btn small icon" data-edit="${w.pid}" type="button" title="Editar jugador" aria-label="Editar">✎</button>` : ''}
            <select data-act="${w.slot}" data-cap="${w.cap ? 1 : 0}" data-lazy="${w.si < 0 && st.length ? 'sm' : 'm'}" aria-label="Acciones: capitán, titular o pasar a otro equipo" title="${w.si < 0 && st.length ? 'Titular, capitán o pasar a otro equipo' : 'Capitán o pasar a otro equipo'}" class="mini actsel"><option value="">⋯</option></select>
            <button class="btn small icon danger" data-del="${w.slot}" type="button" title="Quitar del plantel" aria-label="Quitar">✕</button></div></td>
        </tr>`; }).join('')}${S.rosterSort === 'filial' ? filialRows(t, fil, parent) : ''}
        <tr class="nores" hidden><td colspan="20" class="empty">Ningún jugador coincide con el filtro.</td></tr></tbody>
    </table></div>
    <div class="dtsum" id="rsum" aria-live="polite"></div>
    ${(() => { const tr = teamRating(t); return tr ? `<div class="valbar"><span>Valor de mercado del plantel <b>${fmtMoney(tr.value)}</b></span><span class="note">${esc(LEAGUE_NAME[leagueOf(t)] || leagueOf(t) || (isNat(t) ? 'Selección: cada jugador vale según la liga de su club' : 'Liga desconocida: se estima por el nivel del equipo'))}${tr.manual ? ` · ${tr.manual} valor${tr.manual > 1 ? 'es' : ''} cargado${tr.manual > 1 ? 's' : ''} a mano` : ''} · estimado por valoración, edad, potencial y club</span></div>` : ''; })()}
    <div class="row">
      <div class="picker" style="flex:1 1 240px;max-width:360px"><input type="search" id="addQ" placeholder="Agregar jugador: nombre o ID…" autocomplete="off" aria-label="Buscar jugador para agregar"><div class="gres" id="addRes" hidden></div></div>
      <input type="number" id="addNum" placeholder="Dorsal" min="1" max="99" style="width:90px" aria-label="Dorsal">
      <button class="btn" id="addBtn" type="button" ${full.length >= 40 ? 'disabled' : ''}>Agregar</button>
    </div>
    <div class="row">${editable.length ? `<button class="btn small" id="lockTeam" type="button">Proteger a los ${editable.length} editables de este plantel</button>` : ''}
      <button class="btn small" id="renum" type="button" ${dups.length ? '' : 'disabled'}>Arreglar dorsales repetidos</button>
      ${t.tacticsBase != null ? '<button class="btn small" id="best11r" type="button" title="Elige el mejor jugador para cada rol de la formación del plan actual">Armar el mejor 11</button>' : ''}</div>
  </div>`;
}
const LOCK_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 7V5a3 3 0 0 1 5.8-1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><rect x="3" y="7" width="10" height="7.5" rx="1.6" fill="currentColor"/></svg>';
// filtra filas sin volver a dibujar (no pierde el foco del buscador) y actualiza el resumen
function rosterFilter() {
  const tb = $('rtable'); if (!tb) return;
  const q = foldTxt(S.rq || '').trim().split(/\s+/).filter(Boolean), g = S.rgrp || 'all', s = S.rst || 'all';
  let n = 0, sr = 0, nr = 0, sa = 0, na = 0, mv = 0, sh = 0, nh = 0; const tot = tb.querySelectorAll('tr.prow').length;
  tb.querySelectorAll('tr.prow').forEach(tr => {
    const d = tr.dataset, ok = (!q.length || q.every(w => d.q.includes(w))) && (g === 'all' || d.g === g) && (s === 'all' || (s === 'unl' ? d.unl : d.st === s));
    tr.hidden = !ok; if (!ok) return;
    n++; if (+d.r) { sr += +d.r; nr++; } if (+d.a) { sa += +d.a; na++; } mv += +d.mv || 0; if (+d.h) { sh += +d.h; nh++; }
  });
  tb.querySelector('tr.nores').hidden = n > 0;
  const f1 = v => v.toFixed(1).replace('.', ',');
  $('rsum').innerHTML = `<span>${n === tot ? `<b>${n}</b> jugadores` : `Mostrando <b>${n}</b> de ${tot}`}</span>${nr ? `<span>Media <b class="${vcls(Math.round(sr / nr))}">${f1(sr / nr)}</b></span>` : ''}${na ? `<span>Edad <b>${f1(sa / na)}</b></span>` : ''}${nh ? `<span>Altura <b>${Math.round(sh / nh)} cm</b></span>` : ''}${mv ? `<span>Valor <b>${fmtMoney(mv)}</b></span>` : ''}`;
  rosterSelSync();
}
function rosterSelSync() {
  const tb = $('rtable'); if (!tb) return;
  for (const pid of [...S.rsel]) if (!tb.querySelector(`tr.prow[data-pid="${pid}"]`)) S.rsel.delete(pid);
  const vis = [...tb.querySelectorAll('tr.prow:not([hidden]) [data-sel]')], on = vis.filter(c => c.checked).length, all = $('rselAll');
  if (all) { all.checked = vis.length > 0 && on === vis.length; all.indeterminate = on > 0 && on < vis.length; }
  $('rbulk').hidden = !S.rsel.size; $('rbN').textContent = S.rsel.size;
}
function rosterExport(t, kind) {
  const hide = rHide(), tb = $('rtable'), vis = new Set([...tb.querySelectorAll('tr.prow:not([hidden])')].map(tr => +tr.dataset.pid));
  const cols = [['xi', 'XI', w => w.xiLabel], ['num', 'Dorsal', w => w.num], ['player', 'Nombre del jugador', w => w.name], ['id', 'ID', w => w.pid], ['pos', 'Posición', w => POS[w.pos] || ''], ['val', 'Valoración', w => w.r || ''],
    ['age', 'Edad', w => w.age || ''], ['h', 'Altura', w => w.h || ''], ['nat', 'Nacionalidad', w => w.natName], ['foot', 'Pie', w => w.foot], ['mv', 'Valor (M€)', w => w.mv ? String(w.mv).replace('.', ',') : ''], ['cap', 'Capitán', w => w.cap ? 'Sí' : '']].filter(([k]) => !hide.has(k));
  const rows = S._rrows.filter(w => vis.has(w.pid)), sep = kind === 'csv' ? ';' : '\t';
  const cell = v => { v = String(v ?? ''); return kind === 'csv' && /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v.replace(/\t/g, ' '); };
  const txt = [cols.map(c => c[1]), ...rows.map(w => cols.map(c => c[2](w)))].map(r => r.map(cell).join(sep)).join('\r\n');
  if (kind === 'tsv') { navigator.clipboard.writeText(txt).then(() => toast(rows.length + ' jugadores copiados. Pegalos en Excel o Google Sheets.'), () => toast('No se pudo copiar al portapapeles.')); return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + txt], { type: 'text/csv;charset=utf-8' }));
  a.download = 'Plantel ' + tget(t, 'name').replace(/[\\/:*?"<>|]/g, '') + '.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('CSV descargado: ' + rows.length + ' jugadores.');
}
function fillLazySelect(sel) {
  const k = sel.dataset.lazy, O = S._rOpts; if (!k || !O) return; delete sel.dataset.lazy;
  if (k === 't') sel.insertAdjacentHTML('beforeend', O.t);
  else sel.insertAdjacentHTML('beforeend', (sel.dataset.cap === '1' ? '<optgroup label="Capitán"><option value="" disabled>Ya es el capitán</option></optgroup>' : '<optgroup label="Capitán"><option value="c">© Hacer capitán</option></optgroup>') + (k === 'sm' ? `<optgroup label="Hacer titular">${O.s}</optgroup>` : '') + `<optgroup label="Pasar a otro equipo">${O.m}</optgroup>`);
}
function bindRosterTable(t, m) {
  const card = $('rtable').closest('.card');
  for (const ev of ['pointerdown', 'focusin', 'keydown']) card.addEventListener(ev, e => { const sl = e.target.closest && e.target.closest('select[data-lazy]'); if (sl) fillLazySelect(sl); }, true);
  const sh = $('teamSheet'), tb = $('rtable'), tn = () => tget(t, 'name'), rer = () => later(() => renderTeams(m));
  rosterFilter();
  const rq = $('rq'); rq.oninput = () => { S.rq = rq.value; rosterFilter(); };
  $('rgrp').onclick = e => { const b = e.target.closest('[data-g]'); if (!b) return; S.rgrp = b.dataset.g; $('rgrp').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); rosterFilter(); };
  $('rst').onclick = e => { const b = e.target.closest('[data-st]'); if (!b) return; S.rst = b.dataset.st; $('rst').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); rosterFilter(); };
  $('rlook').onclick = e => { const b = e.target.closest('[data-v]'); if (!b || PREFS.rLook === b.dataset.v) return; PREFS.rLook = b.dataset.v; savePrefs(); render(); };
  $('rdens').onclick = e => { const b = e.target.closest('[data-d]'); if (!b) return; PREFS.rDens = b.dataset.d; savePrefs(); tb.classList.remove('d-compact', 'd-normal', 'd-comfy'); tb.classList.add('d-' + b.dataset.d); $('rdens').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); };
  const pop = (btn, menu) => { btn.onclick = e => { e.stopPropagation(); const open = menu.hidden; sh.querySelectorAll('.popmenu').forEach(x => { x.hidden = true; }); sh.querySelectorAll('.pop > .btn').forEach(x => x.setAttribute('aria-expanded', 'false')); menu.hidden = !open; btn.setAttribute('aria-expanded', open); }; };
  pop($('rcolsBtn'), $('rcols')); pop($('rexpBtn'), $('rexp')); pop($('rbKitBtn'), $('rbKit'));
  if (!document.__popClose) { document.__popClose = true; document.addEventListener('click', e => { if (!e.target.closest('.pop')) document.querySelectorAll('.popmenu').forEach(x => { x.hidden = true; }); }); document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.popmenu').forEach(x => { x.hidden = true; }); }); }
  $('rcols').onchange = e => { const c = e.target.dataset.col; if (!c) return; const h = rHide(); e.target.checked ? h.delete(c) : h.add(c); PREFS.rHide = [...h]; savePrefs(); tb.classList.toggle('h-' + c, !e.target.checked); };
  $('rcolsReset').onclick = () => { PREFS.rHide = ['h', 'nat', 'foot']; savePrefs(); renderTeams(m); };
  $('rexp').onclick = e => { const b = e.target.closest('[data-exp]'); if (b) { $('rexp').hidden = true; rosterExport(t, b.dataset.exp); } };
  const hs = k => { const sk = RSORT_KEY[k]; if (S.rosterSort === sk || (k === 'xi' && S.rosterSort === 'filial')) S.rosterDir = S.rosterDir === -1 ? 1 : -1; else { S.rosterSort = sk; S.rosterDir = 1; } flipRender(m, () => renderTeams(m)); };
  tb.querySelector('thead').onclick = e => { const h = e.target.closest('[data-hsort]'); if (h) hs(h.dataset.hsort); };
  tb.querySelector('thead').onkeydown = e => { const h = e.target.closest('[data-hsort]'); if (h && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); hs(h.dataset.hsort); } };
  tb.addEventListener('change', e => {
    const c = e.target;
    if (c.id === 'rselAll') { tb.querySelectorAll('tr.prow:not([hidden]) [data-sel]').forEach(x => { x.checked = c.checked; const pid = +x.dataset.sel; c.checked ? S.rsel.add(pid) : S.rsel.delete(pid); x.closest('tr').classList.toggle('sel', c.checked); }); rosterSelSync(); }
    if (c.dataset.sel != null) { const pid = +c.dataset.sel; c.checked ? S.rsel.add(pid) : S.rsel.delete(pid); c.closest('tr').classList.toggle('sel', c.checked); rosterSelSync(); }
  });
  const selected = () => PD.roster(S.d, t).filter(x => S.rsel.has(x.pid));
  $('rbClear').onclick = () => { S.rsel.clear(); tb.querySelectorAll('[data-sel]').forEach(x => { x.checked = false; x.closest('tr').classList.remove('sel'); }); rosterSelSync(); };
  $('rbLock').onclick = () => { const ps = selected().map(x => S.ix.byId.get(x.pid)).filter(Boolean); if (!ps.length) { toast('Ninguno de los seleccionados está en tu EDIT: se protegen al editarlos.'); return; } edit('Proteger ' + ps.length + ' jugadores de ' + tn(), 't' + t.id, ps.flatMap(regP), () => { for (const p of ps) for (const k of LOCK_FLAGS) PD.player.set(S.d, p.base, k, 1); }); toast(ps.length + ' jugadores protegidos.', 4000, ['Deshacer', undo]); rer(); };
  $('rbKitGo').onclick = () => {
    const vals = [...$('rbKit').querySelectorAll('[data-bk]')].filter(x => x.value !== '').map(x => [x.dataset.bk, +x.value]);
    if (!vals.length) { toast('Elegí al menos una prenda para cambiar.'); return; }
    const xs = selected(), ps = xs.map(x => S.ix.byId.get(x.pid)).filter(Boolean), miss = xs.length - ps.length;
    if (!ps.length) { toast('Ninguno de los seleccionados está en tu EDIT. Agregalos desde Jugadores para cambiarles la equipación.', 5000); return; }
    edit('Equipación de ' + ps.length + ' jugadores de ' + tn(), 't' + t.id, ps.flatMap(regP), () => { for (const p of ps) for (const [k, v] of vals) { PD.player.set(S.d, p.base, k, v); if (S.autoLock) for (const fl of [...LOCK_FLAGS, ...FIELD_FLAGS(k)]) PD.player.set(S.d, p.base, fl, 1); } });
    $('rbKit').hidden = true; toast('Equipación aplicada a ' + ps.length + ' jugador' + (ps.length > 1 ? 'es' : '') + '.' + (miss ? ' ' + miss + ' no están en tu EDIT y quedaron igual.' : ''), 5000, ['Deshacer', undo]); rer();
  };
  $('rbDel').onclick = async () => {
    const xs = selected(); if (!xs.length) return; const st = PD.starters(S.d, t), key = xs.filter(x => st.includes(x.slot) || PD.captainSlot(S.d, t) === x.slot).length;
    if (!await confirmBox(`¿Quitar ${xs.length} jugador${xs.length > 1 ? 'es' : ''} de ${tn()}?${key ? ` ${key} ${key > 1 ? 'son titulares o capitán' : 'es titular o capitán'}: entran suplentes en su lugar.` : ''}`)) return;
    const errs = []; edit('Quitar ' + xs.length + ' jugadores de ' + tn(), 't' + t.id, regT(t), () => { for (const x of [...xs].sort((a, b) => b.slot - a.slot)) { const er = rosterRemove(t, x.slot, true); if (er) errs.push((playerName(x.pid) || x.pid) + ': ' + er); } });
    S.rsel.clear(); rebuildTeamOf(); toast(errs.length ? errs.join(' · ') : xs.length + ' jugadores quitados.', errs.length ? 6000 : 4000, ['Deshacer', undo]); rer();
  };
  $('rbMove').onchange = e => {
    const dest = S.ix.teamById.get(+e.target.value); if (!dest) return; const xs = selected(); const errs = []; let n = 0;
    edit(xs.length + ' jugadores → ' + tget(dest, 'name'), 't' + t.id, [...regT(t), ...regT(dest)], () => { for (const x of [...xs].sort((a, b) => b.slot - a.slot)) { const e1 = rosterAddCheck(dest, x.pid) || rosterRemove(t, x.slot, true); if (e1) { errs.push((playerName(x.pid) || x.pid) + ': ' + e1); continue; } rosterAdd(dest, x.pid, freeNumber(dest, x.number)); n++; } });
    S.rsel.clear(); rebuildTeamOf(); toast(n + ' pasaron a ' + tget(dest, 'name') + '.' + (errs.length ? ' No se pudo con ' + errs.join(' · ') : ''), errs.length ? 7000 : 4000, ['Deshacer', undo]); rer();
  };
}
// ---- team order list (40-slot permutation: index 0 = GK, 1..10 = formation roles, rest = bench) ----
const ORD = 0x1E4, TAKERS = 0x20C, NTAKERS = 9, CAPT = 0x215;
const getOrder = t => Array.from(S.d.subarray(t.tacticsBase + ORD, t.tacticsBase + ORD + 40));
const setOrder = (t, a) => S.d.set(a, t.tacticsBase + ORD);
function swapInOrder(t, i, slot) { const o = getOrder(t), j = o.indexOf(slot); if (j < 0) { o[i] = slot; } else { [o[i], o[j]] = [o[j], o[i]]; } setOrder(t, o); }
// Frees a starter/captain/taker slot: promotes the first substitute, hands the armband and set pieces to another starter.
function vacate(t, slot) {
  if (t.tacticsBase == null) return null;
  const n = PD.roster(S.d, t).length, o = getOrder(t), i = o.indexOf(slot);
  if (i >= 0 && i < 11) {
    const j = o.findIndex((v, k) => k >= 11 && v < n && v !== slot);
    if (j < 0) return 'No hay suplentes para reemplazarlo en el 11 inicial.';
    [o[i], o[j]] = [o[j], o[i]]; setOrder(t, o);
  }
  const starters = getOrder(t).slice(0, 11).filter(v => v !== slot && v < n);
  const repl = starters.find((v, k) => k > 0) ?? starters[0] ?? 0;
  if (S.d[t.tacticsBase + CAPT] === slot) S.d[t.tacticsBase + CAPT] = repl;
  for (let k = 0; k < NTAKERS; k++) if (S.d[t.tacticsBase + TAKERS + k] === slot) S.d[t.tacticsBase + TAKERS + k] = repl;
  return null;
}
function rosterRemove(t, slot, auto = false) {
  if (auto) { const e = vacate(t, slot); if (e) return e; }
  if (PD.starters(S.d, t).includes(slot)) return 'Es titular. Cambialo del 11 inicial antes de quitarlo.';
  if (PD.captainSlot(S.d, t) === slot) return 'Es el capitán. Elegí otro capitán antes de quitarlo.';
  const base = t.rosterBase + 4, nb = base + 160, ids = [], nums = [];
  for (let k = 0; k < 40; k++) { ids.push((S.d[base + k * 4] | S.d[base + k * 4 + 1] << 8 | S.d[base + k * 4 + 2] << 16 | S.d[base + k * 4 + 3] << 24) >>> 0); nums.push(S.d[nb + k * 2] | S.d[nb + k * 2 + 1] << 8); }
  ids.splice(slot, 1); ids.push(0); nums.splice(slot, 1); nums.push(0);
  for (let k = 0; k < 40; k++) { PD.setRosterPlayer(S.d, t, k, ids[k]); PD.setNumber(S.d, t, k, nums[k]); }
  if (t.tacticsBase != null) {
    const o = getOrder(t);
    if (o.includes(slot)) { const no = o.filter(v => v !== slot).map(v => v > slot && v !== 255 ? v - 1 : v); no.push(39); setOrder(t, no); }
    const fix = off => { const v = S.d[t.tacticsBase + off]; if (v !== 255 && v > slot) S.d[t.tacticsBase + off] = v - 1; };
    fix(CAPT); for (let k = 0; k < NTAKERS; k++) fix(TAKERS + k);
  }
  return null;
}
function rosterAddCheck(t, pid) {
  if (t.rosterBase == null) return 'Este equipo no tiene plantel en el archivo.';
  const r = PD.roster(S.d, t);
  if (r.some(x => x.pid === pid)) return 'Ese jugador ya está en este plantel.';
  if (r.length >= 40) return 'El plantel ya tiene 40 jugadores.';
  return null;
}
function rosterAdd(t, pid, num) {
  let slot = 0; while (slot < 40) { const o = t.rosterBase + 4 + slot * 4; if (!(S.d[o] | S.d[o + 1] | S.d[o + 2] | S.d[o + 3])) break; slot++; }
  PD.setRosterPlayer(S.d, t, slot, pid); PD.setNumber(S.d, t, slot, num || 0);
}
function freeNumber(t, pref) { const used = new Set(PD.roster(S.d, t).map(x => x.number)); if (pref && !used.has(pref)) return pref; for (let n = 2; n < 100; n++) if (!used.has(n)) return n; return 0; }
function addSearch(q) {
  const box = $('addRes'); q = q.trim().toLowerCase(); if (q.length < 2) { box.hidden = true; return; }
  const out = [];
  for (const p of S.ix.players) { const n = pget(p, 'name'); if (n.toLowerCase().includes(q) || String(p.id) === q) out.push([p.id, n]); if (out.length > 10) break; }
  if (S.names.size) for (const [id, v] of S.names) { if (out.length > 24) break; if (!S.ix.byId.has(id) && (v.name.toLowerCase().includes(q) || String(id) === q)) out.push([id, v.name]); }
  if (/^\d+$/.test(q) && !out.some(o => String(o[0]) === q)) out.unshift([+q, 'ID ' + q]);
  box.innerHTML = out.map(([id, n]) => { const c = clubOf(id); return `<button type="button" data-add="${id}"><span>${esc(n)}</span><span class="k">${c ? esc(tget(c, 'name')) : 'sin equipo'} · ${id}</span></button>`; }).join('') || '<div class="empty">Sin resultados.</div>';
  box.hidden = false;
}
function bindTeam(t, m) {
  const sh = $('teamSheet'), rer = () => later(() => renderTeams(m)), tn = () => tget(t, 'name');
  sh.querySelectorAll('[data-ttab]').forEach(b => b.onclick = () => { if (S.ttab === b.dataset.ttab) return; S.ttab = b.dataset.ttab; S.fsel = null; const rest = [...sh.children].slice(1); if (ANIM.reduce.matches || !rest.length) { renderTeams(m); return; } rest.forEach(c => c.classList.add('leave')); setTimeout(() => renderTeams(m), 130); });
  if (S.ttab === 'tactics') { bindTactics(t, m); return; }
  if (S.ttab === 'data') {
    $('tName').onchange = e => { setT(t, [['name', e.target.value], ['e_name', 1]], 'Nombre de ' + tn()); rer(); };
    $('tShort').onchange = e => { setT(t, [['short', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3)], ['e_name', 1]], 'Abreviatura de ' + tn()); rer(); };
    $('tLock').onchange = e => { setT(t, [['e_name', e.target.checked ? 1 : 0]], 'Protección de nombre de ' + tn()); rer(); };
    const col = (n, v) => { const h = v.slice(1); setT(t, [[`c${n}r`, c6(h.slice(0, 2))], [`c${n}g`, c6(h.slice(2, 4))], [`c${n}b`, c6(h.slice(4, 6))]], 'Colores de ' + tn()); rer(); };
    $('tC1').onchange = e => col(1, e.target.value); $('tC2').onchange = e => col(2, e.target.value);
    $('tCountry').onchange = e => { setT(t, [['country', +e.target.value]], 'País de ' + tn()); rer(); };
    $('tCoach').onchange = e => { setT(t, [['manager_id', +e.target.value]], 'Entrenador de ' + tn()); rer(); };
    const uk = $('tUseKit'); if (uk) uk.onclick = () => { const k = kitFor(t, false), h1 = k.c1.slice(1), h2 = k.c2.slice(1); setT(t, [['c1r', c6(h1.slice(0, 2))], ['c1g', c6(h1.slice(2, 4))], ['c1b', c6(h1.slice(4, 6))], ['c2r', c6(h2.slice(0, 2))], ['c2g', c6(h2.slice(2, 4))], ['c2b', c6(h2.slice(4, 6))]], 'Colores de ' + tn() + ' desde el kit'); rer(); };
  }
  if (S.ttab === 'stadium') {
    $('tStad').onchange = e => { setT(t, [['stadium_id', +e.target.value], ['e_stadium', 1]], 'Estadio de ' + tn()); rer(); };
    $('tStadName').onchange = e => { setT(t, [['stadium_name', e.target.value], ['e_stadname', e.target.value ? 1 : 0]], 'Nombre del estadio de ' + tn()); };
    sh.querySelectorAll('[data-rival]').forEach(s => s.onchange = () => setT(t, [[s.dataset.rival, +s.value]], 'Rivales de ' + tn()));
    sh.querySelectorAll('[data-banner]').forEach(s => s.onchange = () => setT(t, [[s.dataset.banner, s.value]], 'Banderas de ' + tn()));
  }
  if (S.ttab === 'call') { bindCall(t, m); return; }
  if (S.ttab === 'kits') { bindKitStudio(t, m); return; }
  if (S.ttab !== 'roster') return;
  bindSquad(t, m); bindRosterTable(t, m);
  $('rsort').onclick = e => { const b = e.target.closest('[data-sort]'); if (b) { S.rosterSort = b.dataset.sort; S.rosterDir = 1; renderTeams(m); } };
  sh.addEventListener('change', e => {
    let el = e.target;
    if (el.dataset.act != null && el.value === 'c') { const slot = +el.dataset.act; el.value = ''; edit('Capitán de ' + tn(), 't' + t.id, regT(t), () => PD.setCaptainSlot(S.d, t, slot)); rer(); return; }
    if (el.dataset.act != null && el.value) { const v = el.value, real = el; el = { dataset: v[0] === 's' ? { start: real.dataset.act } : { move: real.dataset.act }, set value(x) { real.value = x; }, get value() { return v.slice(1); } }; }
    if (el.dataset.num != null) { edit('Dorsal en ' + tn(), 't' + t.id, regT(t), () => PD.setNumber(S.d, t, +el.dataset.num, Math.max(0, Math.min(99, +el.value || 0)))); rer(); }
    if (el.name === 'cap') { edit('Capitán de ' + tn(), 't' + t.id, regT(t), () => PD.setCaptainSlot(S.d, t, +el.value)); }
    if (el.dataset.start != null && el.value !== '') { edit('Titular en ' + tn(), 't' + t.id, regT(t), () => swapInOrder(t, +el.value, +el.dataset.start)); rer(); }
    if (el.dataset.move != null && el.value) {
      const slot = +el.dataset.move, dest = S.ix.teamById.get(+el.value);
      const x = PD.roster(S.d, t).find(y => y.slot === slot);
      const e1 = rosterAddCheck(dest, x.pid); if (e1) { toast(e1.replace('Ese jugador ya está en este plantel', 'Ya está en ' + tget(dest, 'name'))); el.value = ''; return; }
      let err = null;
      edit((playerName(x.pid) || 'Jugador ' + x.pid) + ' → ' + tget(dest, 'name'), 't' + t.id, [...regT(t), ...regT(dest)], () => { err = rosterRemove(t, slot, true); if (!err) rosterAdd(dest, x.pid, freeNumber(dest, x.number)); });
      if (err) { toast(err, 5000); el.value = ''; return; }
      rebuildTeamOf(); toast((playerName(x.pid) || 'Jugador ' + x.pid) + ' pasó a ' + tget(dest, 'name') + '.', 4000, ['Deshacer', undo]); rer();
    }
  });
  sh.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'addBtn') {
      const pid = parseInt($('addQ').dataset.pid || $('addQ').value, 10);
      if (!pid) { toast('Buscá el jugador por nombre o escribí su ID.'); return; }
      const err = rosterAddCheck(t, pid); if (err) { toast(err); return; }
      const num = freeNumber(t, parseInt($('addNum').value, 10) || 0), who = playerName(pid) || 'ID ' + pid;
      const old = !isNat(t) ? (teamOf.get(pid) || []).find(x => !isNat(x) && x.id !== t.id) : null;
      if (old) {
        if (!await confirmBox(`${who} juega en ${tget(old, 'name')}. ¿Transferirlo (sale de ese plantel)?`)) return;
        const slot = PD.roster(S.d, old).find(y => y.pid === pid).slot;
        let e2 = null;
        edit(who + ': ' + tget(old, 'name') + ' → ' + tn(), 't' + t.id, [...regT(t), ...regT(old)], () => { e2 = rosterRemove(old, slot, true); if (!e2) rosterAdd(t, pid, num); });
        if (e2) { toast(e2.replace('Es titular', 'Es titular en ' + tget(old, 'name')).replace('Es el capitán', 'Es el capitán de ' + tget(old, 'name')), 6000); return; }
        rebuildTeamOf(); toast(who + ' transferido con el ' + num + '.', 4000, ['Deshacer', undo]); rer(); return;
      }
      edit('Agregar ' + who + ' a ' + tn(), 't' + t.id, regT(t), () => rosterAdd(t, pid, num));
      rebuildTeamOf(); toast('Agregado: ' + who + ' con el ' + num + '.', 4000, ['Deshacer', undo]); rer(); return;
    }
    if (b.dataset.del != null) {
      const slot = +b.dataset.del, x = PD.roster(S.d, t).find(y => y.slot === slot), who = playerName(x.pid) || 'ID ' + x.pid;
      const key = PD.starters(S.d, t).includes(slot) || PD.captainSlot(S.d, t) === slot;
      if (key && !await confirmBox(`${who} es titular o capitán. ¿Quitarlo igual? Entra el primer suplente en su lugar.`)) return;
      let err = null; edit('Quitar ' + who + ' de ' + tn(), 't' + t.id, regT(t), () => { err = rosterRemove(t, slot, true); });
      if (err) toast(err, 5000); else { rebuildTeamOf(); toast(who + ' quitado del plantel.', 4000, ['Deshacer', undo]); rer(); }
    }
    if (b.dataset.edit != null) { S.player = +b.dataset.edit; setTab('players'); }
    if (b.dataset.dbuse != null) {
      const db = (sdbRoster(t) || []).slice(0, 40), need = db.filter(x => !S.ix.byId.has(x.pid)).map(x => x.pid), bad = need.filter(id => !canMakeEditPlayer(id));
      if (!await confirmBox(`¿Copiar ${db.length} jugadores de la base al plantel de ${tn()}?${need.length ? ` ${need.length - bad.length} se agregan a tu EDIT.` : ''}${bad.length ? ` ${bad.length} no se pueden agregar (sin datos en la base).` : ''}`)) return;
      edit('Plantel de la base en ' + tn(), 'players', [...editPlayersRegion(need.length), ...regT(t)], () => { insertEditPlayers(need); for (const x of db) { if (S.ix.byId.has(x.pid) && !rosterAddCheck(t, x.pid)) rosterAdd(t, x.pid, x.num); } });
      S.hist[S.hp - 1] && (S.hist[S.hp - 1].reindex = true); S.ix = PD.index(S.d, S.f.game); rebuildTeamOf(); toast('Plantel copiado desde la base del juego.', 4000, ['Deshacer', undo]); rer(); return;
    }
    if (b.dataset.dbp != null) { const pid = +b.dataset.dbp; if (S.ix.byId.has(pid)) { S.player = pid; setTab('players'); } else await addDbPlayer(pid, true); }
    if (b.dataset.val != null) {
      const pid = +b.dataset.val, pv = playerValue(pid), td = b.parentNode;
      td.innerHTML = `<input type="text" inputmode="decimal" class="valin" value="${pv && pv.manual ? String(pv.v).replace('.', ',') : ''}" placeholder="${pv ? String(pv.est ?? '').replace('.', ',') : ''}" aria-label="Valor real en millones de euros" title="Millones de euros (ej. 12,5). Vacío = volver al estimado.">`;
      const inp = td.querySelector('input'); inp.focus();
      const done = () => { const v = parseFloat(inp.value.replace(',', '.')); if (inp.value.trim() === '' || !(v >= 0)) MANUAL_VAL.delete(pid); else MANUAL_VAL.set(pid, Math.round(v * 1000) / 1000); saveManualVal(); RATE_GEN++; rer(); };
      inp.onkeydown = ev => { if (ev.key === 'Enter') inp.blur(); if (ev.key === 'Escape') { inp.onblur = null; rer(); } }; inp.onblur = done;
    }
    if (b.dataset.up != null) {
      const pid = +b.dataset.up, from = S.ix.teamById.get(+b.dataset.from), who = playerName(pid) || 'ID ' + pid;
      const e1 = rosterAddCheck(t, pid); if (e1) { toast(e1); return; }
      const slot = PD.roster(S.d, from).find(y => y.pid === pid).slot, num = freeNumber(t, PD.roster(S.d, from).find(y => y.pid === pid).number);
      let err = null; edit(who + ': ' + tget(from, 'name') + ' → ' + tn(), 't' + t.id, [...regT(t), ...regT(from)], () => { err = rosterRemove(from, slot, true); if (!err) rosterAdd(t, pid, num); });
      if (err) { toast(err.replace('Es titular', 'Es titular en ' + tget(from, 'name')), 6000); return; }
      rebuildTeamOf(); RATE_GEN++; toast(who + ' pasó a ' + tn() + ' con el ' + num + '.', 4000, ['Deshacer', undo]); rer();
    }
    if (b.dataset.add != null) { $('addQ').value = playerName(+b.dataset.add) || b.dataset.add; $('addQ').dataset.pid = b.dataset.add; $('addRes').hidden = true; $('addNum').focus(); }
    if (b.id === 'lockTeam') { const ps = PD.roster(S.d, t).map(x => S.ix.byId.get(x.pid)).filter(Boolean); edit('Proteger plantel de ' + tn(), 't' + t.id, ps.flatMap(regP), () => { for (const p of ps) for (const k of LOCK_FLAGS) PD.player.set(S.d, p.base, k, 1); }); toast(ps.length + ' jugadores protegidos.'); rer(); }
    if (b.id === 'best11r') { let err = null; edit('Mejor 11 de ' + tn(), 't' + t.id, regT(t), () => { err = applyBestXI(t); }); if (err) toast(err); else { toast('Mejor 11 armado para la formación del plan ' + (S.fplan + 1) + '.', 4000, ['Deshacer', undo]); rer(); } }
    if (b.id === 'renum') {
      let n = 0; edit('Arreglar dorsales de ' + tn(), 't' + t.id, regT(t), () => { const seen = new Set(); for (const x of PD.roster(S.d, t)) { if (x.number && !seen.has(x.number)) { seen.add(x.number); continue; } let k = 2; while (seen.has(k) || PD.roster(S.d, t).some(y => y.number === k)) k++; PD.setNumber(S.d, t, x.slot, k); seen.add(k); n++; } });
      toast(n ? n + ' dorsales cambiados.' : 'No había dorsales repetidos.'); rer();
    }
  });
  const aq = $('addQ'); aq.oninput = () => { delete aq.dataset.pid; addSearch(aq.value); };
}

// ----- players -----
function playerList() {
  const q = S.qPlayer.trim().toLowerCase();
  return S.ix.players.filter(p => {
    if (S.pFilter === 'unlocked' && isLocked(p)) return false;
    if (S.pFilter !== 'all' && S.pFilter !== 'unlocked' && POS_GRP[pget(p, 'reg_pos')] !== S.pFilter) return false;
    if (!q) return true;
    const c = clubOf(p.id);
    return pget(p, 'name').toLowerCase().includes(q) || pget(p, 'shirt').toLowerCase().includes(q) || String(p.id) === q || (c && tget(c, 'name').toLowerCase().includes(q));
  });
}
// ---- jugadores de la base del Parche (Player.bin copiado por el módulo de Sider) ----
async function addDbPlayer(pid, ask) {
  if (ask && !await confirmBox(`${playerName(pid) || 'ID ' + pid} está en la base del juego pero no en tu EDIT. ¿Agregarlo a tu EDIT con sus habilidades para poder editarlo? (cara, nombre y lo demás siguen saliendo del Parche)`)) return false;
  if (!canMakeEditPlayer(pid)) { toast('No se pudo agregar: el EDIT está lleno o falta la base.', 5000); return false; }
  edit('Agregar ' + (playerName(pid) || pid) + ' al EDIT', 'players', editPlayersRegion(1), () => { insertEditPlayers([pid]); });
  S.hist[S.hp - 1] && (S.hist[S.hp - 1].reindex = true); S.ix = PD.index(S.d, S.f.game); rebuildTeamOf();
  S.player = pid; S.pSrc = 'edit'; setTab('players'); toast((playerName(pid) || 'ID ' + pid) + ' agregado a tu EDIT: ya lo podés editar. Ctrl+Z lo deshace.'); return true;
}
// equipo(s) y dorsal de cada jugador según PlayerAssignment.bin (se arma una vez por carga)
const DBCLUB = { key: '', map: new Map() };
function dbClubs(pid) {
  const k = (typeof SDB !== 'undefined' && SDB.assign ? SDB.assign.size : 0) + ':' + S.names.size;
  if (DBCLUB.key !== k) { DBCLUB.key = k; DBCLUB.map = new Map(); if (typeof SDB !== 'undefined' && SDB.assign) for (const [tid, arr] of SDB.assign) for (const x of arr) { let a = DBCLUB.map.get(x.pid); if (!a) DBCLUB.map.set(x.pid, a = []); a.push({ tid, num: x.num }); } }
  return DBCLUB.map.get(pid) || [];
}
const dbTeamName = tid => { const t = S.ix && S.ix.teamById.get(tid); if (t) return tget(t, 'name'); const d = typeof SDB !== 'undefined' && SDB.teams && SDB.teams.get(tid); return d ? (d.es || d.name || d.en) : 'Equipo ' + tid; };
// club (no selección) de un jugador de la base: el primer equipo que no sea selección nacional
const dbClubOf = pid => { const cl = dbClubs(pid); return cl.find(c => !(S.ix && S.ix.teamById.get(c.tid) && typeof isNat === 'function' && isNat(S.ix.teamById.get(c.tid)))) || cl[0] || null; };
function dbPlayerCount() { return DBRAW ? DBRAW.off.size : [...S.names.values()].filter(n => n.pos != null).length; }
function dbPlayerList() {
  const q = S.qPlayer.trim().toLowerCase(), ids = DBRAW ? [...DBRAW.off.keys()] : [...S.names.keys()];
  const out = [];
  for (const id of ids) {
    const n = S.names.get(id); if (!n) continue;
    if (S.pFilter === 'unlocked') { if (S.ix.byId.has(id)) continue; }
    else if (S.pFilter !== 'all' && POS_GRP[n.pos] !== S.pFilter) continue;
    if (q) { const c = dbClubOf(id); if (!((n.name || '').toLowerCase().includes(q) || String(id) === q || (c && dbTeamName(c.tid).toLowerCase().includes(q)))) continue; }
    out.push(id);
  }
  return out.sort((a, b) => ((S.names.get(b).r || 0) - (S.names.get(a).r || 0)) || a - b);
}
function dbVal(id, key) { const o = DBRAW && DBRAW.off.get(id); if (o == null) return null; const m = DB_TO_EDIT()[key]; return m ? dbBits(o, m[0], m[1]) + m[2] : null; }
function dbPlayerSheet(id) {
  const n = S.names.get(id) || {}, o = DBRAW && DBRAW.off.get(id), cl = dbClubs(id), c0 = dbClubOf(id), ct = c0 && S.ix.teamById.get(c0.tid), inEdit = S.ix.byId.has(id);
  const pos = o != null ? dbVal(id, 'reg_pos') : n.pos, age = o != null ? dbVal(id, 'age') : n.a, nat = o != null ? dbVal(id, 'nation') : n.nat, h = o != null ? DBRAW.b[o + 0x1B] + 100 : null, shirt = o != null ? dbStr(o + 0x81, 61) : '';
  const kit = ct ? kitFor(ct, pos === 0) : null, r = n.r || 0;
  const abil = o != null ? `<div class="card"><h3>Habilidades en la base del Parche</h3><div class="groups">${ABIL_GROUPS.map(([gn, list]) => `<div class="group"><h4>${gn}</h4>${list.map(([k, nm]) => { const v = dbVal(id, k); return v == null ? '' : `<div class="ab ro"><div class="l"><span>${nm}</span><i class="abbar"><b style="width:${Math.round((v - 40) / 59 * 100)}%"></b></i></div><b class="abv ${vcls(v)}">${v}</b></div>`; }).join('')}</div>`).join('')}</div>
    <div class="grid" style="margin-top:12px">${[['Uso de pierna mala', 'weak_use', 1], ['Precisión de pierna mala', 'weak_acc', 1], ['Estado de forma', 'form', 1], ['Resistencia a lesiones', 'injury', 0]].map(([l, k, add]) => { const v = dbVal(id, k); return v == null ? '' : `<div class="f"><span class="lab">${l}</span><b>${k === 'injury' ? ['C', 'B', 'A'][v] || v : v + add}</b></div>`; }).join('')}</div></div>` : '<div class="card"><p class="note">Las habilidades se ven cuando la copia de Player.bin está en la carpeta Sider.</p></div>';
  return `<div class="card dbsheet">
    <div class="head">${posBadge(pos)}<span class="dbface">${faceHtml(id, kit, 'pl')}</span><div style="min-width:0"><h2>${esc(playerName(id) || 'ID ' + id)}</h2>
      <div class="sub">${shirt ? esc(shirt) + ' · ' : ''}${nat != null ? esc(COUNTRY.get(nat) || 'País ' + nat) + ' · ' : ''}${age ? age + ' años · ' : ''}${h ? h + ' cm · ' : ''}ID ${id}</div></div>
      <div class="rating"><b class="${vcls(r)}">${r || '–'}</b><span>Valoración aprox.</span></div></div>
    <div class="dbteams">${cl.length ? cl.map(c => `<button type="button" class="chip" data-dbteam="${c.tid}">${S.ix.teamById.get(c.tid) ? shirtSvg(kitFor(S.ix.teamById.get(c.tid), pos === 0), '1em', dbTeamName(c.tid)) + ' ' : ''}${esc(dbTeamName(c.tid))}${c.num ? ' · <b>' + c.num + '</b>' : ''}</button>`).join('') : '<span class="note">Sin equipo en la base</span>'}</div>
    <div class="dbnote"><span>${inEdit ? 'Este jugador también está en tu EDIT, con los datos que le cambiaste.' : 'Está en la base del Parche y todavía no en tu EDIT. Lo que ves acá es lo que usa el juego; para cambiarlo, agregalo a tu EDIT: se copia con todas sus habilidades y la cara y el nombre siguen saliendo del Parche.'}</span>
      ${inEdit ? `<button class="btn small" type="button" data-dbopen="${id}">Abrir en mi EDIT</button>` : `<button class="btn primary small" type="button" data-dbadd="${id}" ${canMakeEditPlayer(id) ? '' : 'disabled title="Falta la copia de Player.bin o el EDIT está lleno"'}>Agregar a mi EDIT para editarlo</button>`}</div>
  </div>${abil}`;
}
function setPlayerCount() { if (!S.ix) return; const dn = dbPlayerCount(); $('cPlayers').textContent = dn ? (dn >= 1000 ? (dn / 1000).toFixed(1).replace('.', ',') + 'k' : dn) : S.ix.players.length; $('tPlayers').title = S.ix.players.length + ' en tu EDIT' + (dn ? ' · ' + dn.toLocaleString('es-AR') + ' en la base del Parche' : ''); }
function renderPlayers(m) {
  setPlayerCount();
  FACE_CTX.nat = false;
  const dbN = dbPlayerCount();
  if (!dbN) S.pSrc = 'edit'; else if (!S.ix.players.length) S.pSrc = 'db';
  if (S.pSrc === 'db') return renderDbPlayers(m, dbN);
  if (!S.ix.players.length) {
    m.innerHTML = `<div class="hero"><h1>Todavía no hay jugadores editados</h1>
      <p>En PES 2021 el EDIT solo guarda los jugadores que fueron editados alguna vez; el resto viene de la base del Parche. Para sumar uno: en el juego entrá a Editar → Jugadores, cambiale cualquier dato (por ejemplo el nombre en camiseta), guardá y salí. Después volvé a abrir la carpeta acá y vas a poder cambiarle todo.</p>
      <p class="note">Planteles, titulares, dorsales, capitanes, colores, estadio y rivales se editan desde Equipos aunque el jugador no esté acá.</p></div>`;
    return;
  }
  const list = playerList(), dk = dirtyKeys();
  const p = S.ix.byId.get(S.player) || list[0];
  if (p) S.player = p.id;
  const locked = S.ix.players.filter(isLocked).length;
  m.innerHTML = `<div class="split">
    <aside class="list">
      <div class="list-head">
        <div class="seg psrc" role="tablist" aria-label="Qué jugadores ver"><button type="button" data-psrc="edit" aria-pressed="${S.pSrc === 'edit'}">Mi EDIT <b>${S.ix.players.length}</b></button><button type="button" data-psrc="db" aria-pressed="${S.pSrc === 'db'}" ${dbN ? '' : 'disabled title="Conectá la carpeta Sider para ver la base del Parche"'}>Del Parche <b>${dbN ? dbN.toLocaleString('es-AR') : '–'}</b></button></div>
        <input type="search" id="qPlayer" placeholder="Filtrar por nombre, ID o equipo…" value="${esc(S.qPlayer)}" aria-label="Filtrar jugadores">
        <select id="pFilter" aria-label="Filtro">${[['all', 'Todos'], ['gk', 'Porteros'], ['df', 'Defensores'], ['mf', 'Mediocampistas'], ['fw', 'Delanteros'], ['unlocked', 'Sin proteger']].map(([k, n]) => `<option value="${k}" ${S.pFilter === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <div class="row" style="justify-content:space-between"><label class="chk"><input type="checkbox" id="autoLock" ${S.autoLock ? 'checked' : ''}> Proteger al editar</label>
        <button class="btn small" id="lockAll" type="button" ${locked === S.ix.players.length ? 'disabled' : ''}>Proteger todos (${locked}/${S.ix.players.length})</button></div>
      </div>
      <div class="list-body" id="plItems">${list.map(x => { const c = clubOf(x.id), rp = pget(x, 'reg_pos'); return `<button class="item ${p && x.id === p.id ? 'on' : ''}" data-p="${x.id}" type="button">
        ${posBadge(rp)}<span style="min-width:0"><span class="nm">${c ? shirtSvg(kitFor(c, rp === 0), '1.05em', tget(c, 'name')) + ' ' : ''}${esc(pget(x, 'name') || 'ID ' + x.id)}${dk.has('p' + x.id) ? '<span class="dot" title="Con cambios sin guardar"></span>' : ''}</span>
        <span class="sub2">${c ? esc(tget(c, 'name')) : 'Sin equipo'}${lockWord(x)}</span></span><span class="meta"><b class="${vcls(rating(x))}">${rating(x)}</b></span></button>`; }).join('') || '<div class="empty">Sin resultados.</div>'}</div>
    </aside>
    <section class="sheet" id="plSheet">${p ? playerSheet(p) + helpCard('player') : ''}</section>
  </div>`;
  $('qPlayer').oninput = e => { S.qPlayer = e.target.value; const pos = e.target.selectionStart; flipRender(m, () => renderPlayers(m)); const el = $('qPlayer'); el.focus(); el.setSelectionRange(pos, pos); el.classList.add('kick'); };
  $('pFilter').onchange = e => { S.pFilter = e.target.value; later(() => renderPlayers(m)); };
  $('plItems').onclick = e => { const b = e.target.closest('[data-p]'); if (b && +b.dataset.p !== S.player) { S.player = +b.dataset.p; m.querySelectorAll('.item.on').forEach(x => x.classList.remove('on')); b.classList.add('on'); const sh = m.querySelector('.sheet'); leave(sh, () => renderPlayers(m)); } };
  $('autoLock').onchange = e => { S.autoLock = e.target.checked; };
  bindPSrc(m);
  $('lockAll').onclick = () => { const ps = S.ix.players.filter(x => !isLocked(x)); edit('Proteger todos los jugadores', 'all', ps.flatMap(regP), () => { for (const x of ps) for (const k of LOCK_FLAGS) PD.player.set(S.d, x.base, k, 1); }); toast(ps.length + ' jugadores protegidos.'); later(() => renderPlayers(m)); };
  if (p) bindPlayer(p, m);
}
function bindPSrc(m) { m.querySelectorAll('[data-psrc]').forEach(b => b.onclick = () => { if (S.pSrc === b.dataset.psrc) return; S.pSrc = b.dataset.psrc; later(() => renderPlayers(m)); }); }
function renderDbPlayers(m, dbN) {
  FACE_CTX.nat = false;
  const all = dbPlayerList(), LIM = 250, list = all.slice(0, LIM);
  if (S.dbPlayer == null || !S.names.has(S.dbPlayer)) S.dbPlayer = list[0] ?? null;
  const sel = S.dbPlayer;
  m.innerHTML = `<div class="split">
    <aside class="list">
      <div class="list-head">
        <div class="seg psrc" role="tablist" aria-label="Qué jugadores ver"><button type="button" data-psrc="edit" aria-pressed="false" ${S.ix.players.length ? '' : 'disabled title="Todavía no hay jugadores en tu EDIT"'}>Mi EDIT <b>${S.ix.players.length}</b></button><button type="button" data-psrc="db" aria-pressed="true">Del Parche <b>${dbN.toLocaleString('es-AR')}</b></button></div>
        <input type="search" id="qPlayer" placeholder="Buscar en la base: nombre, ID o equipo…" value="${esc(S.qPlayer)}" aria-label="Buscar jugadores de la base">
        <select id="pFilter" aria-label="Filtro">${[['all', 'Todos'], ['gk', 'Porteros'], ['df', 'Defensores'], ['mf', 'Mediocampistas'], ['fw', 'Delanteros'], ['unlocked', 'Solo los que no están en mi EDIT']].map(([k, n]) => `<option value="${k}" ${S.pFilter === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <p class="note" style="margin:0">${all.length.toLocaleString('es-AR')} jugador${all.length === 1 ? '' : 'es'}${all.length > LIM ? ` · se ven los ${LIM} de mejor valoración: buscá para encontrar el resto` : ''}</p>
      </div>
      <div class="list-body" id="plItems">${list.map(id => { const n = S.names.get(id), c = dbClubOf(id), ct = c && S.ix.teamById.get(c.tid); return `<button class="item ${id === sel ? 'on' : ''}" data-dbsel="${id}" type="button">
        ${posBadge(n.pos)}<span style="min-width:0"><span class="nm">${ct ? shirtSvg(kitFor(ct, n.pos === 0), '1.05em', tget(ct, 'name')) + ' ' : ''}${esc(n.name || 'ID ' + id)}${S.ix.byId.has(id) ? ' <span class="chip ok tiny" title="También está en tu EDIT">EDIT</span>' : ''}</span>
        <span class="sub2">${c ? esc(dbTeamName(c.tid)) + (c.num ? ' · ' + c.num : '') : 'Sin equipo'}${n.a ? ' · ' + n.a + ' años' : ''}</span></span><span class="meta"><b class="${vcls(n.r)}">${n.r || '–'}</b></span></button>`; }).join('') || '<div class="empty">Sin resultados.</div>'}</div>
    </aside>
    <section class="sheet" id="plSheet">${sel != null ? dbPlayerSheet(sel) : ''}</section>
  </div>`;
  bindPSrc(m);
  $('qPlayer').oninput = e => { S.qPlayer = e.target.value; const pos = e.target.selectionStart; clearTimeout(S.dbQT); S.dbQT = setTimeout(() => { S.dbPlayer = null; renderPlayers(m); const el = $('qPlayer'); el.focus(); el.setSelectionRange(pos, pos); }, 180); };
  $('pFilter').onchange = e => { S.pFilter = e.target.value; S.dbPlayer = null; later(() => renderPlayers(m)); };
  $('plItems').onclick = e => { const b = e.target.closest('[data-dbsel]'); if (!b || +b.dataset.dbsel === S.dbPlayer) return; S.dbPlayer = +b.dataset.dbsel; m.querySelectorAll('.item.on').forEach(x => x.classList.remove('on')); b.classList.add('on'); const sh = m.querySelector('.sheet'); leave(sh, () => { sh.innerHTML = dbPlayerSheet(S.dbPlayer); }); };
  m.querySelector('#plSheet').onclick = async e => {
    const a = e.target.closest('[data-dbadd]'); if (a) { await addDbPlayer(+a.dataset.dbadd, false); return; }
    const o = e.target.closest('[data-dbopen]'); if (o) { S.player = +o.dataset.dbopen; S.pSrc = 'edit'; renderPlayers(m); return; }
    const t = e.target.closest('[data-dbteam]'); if (t) { const tid = +t.dataset.dbteam; if (S.ix.teamById.get(tid)) { S.team = tid; S.ttab = 'roster'; setTab('teams'); } else toast('Ese equipo no está en tu EDIT.'); }
  };
}
const num = (k, v, min, max, extra = '') => `<input type="number" data-k="${k}" value="${v}" min="${min}" max="${max}" ${extra}>`;
const selOpts = (arr, v) => arr.map((n, i) => `<option value="${i}" ${i === v ? 'selected' : ''}>${esc(n)}</option>`).join('');
function mapSelect(k, map, v, label) { return `<select data-k="${k}" aria-label="${label}">${map.has(v) ? '' : `<option value="${v}" selected>${v ? 'ID ' + v + ' (del Parche)' : 'Ninguno / predeterminado'}</option>`}${[...map].sort((a, b) => a[1].localeCompare(b[1])).map(([id, n]) => `<option value="${id}" ${id === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`; }
function seg(k, labels, v) { return `<div class="seg" data-segk="${k}">${labels.map((n, i) => `<button type="button" data-v="${i}" aria-pressed="${i === v}">${n}</button>`).join('')}</div>`; }
function flagChips(p) { return Object.keys(FLAG_NAMES).map(k => `<span class="chip ${pget(p, k) ? 'ok' : ''}">${pget(p, k) ? '✓' : '·'} ${FLAG_NAMES[k]}</span>`).join(''); }
function playerSheet(p) {
  const g = k => pget(p, k), reg = g('reg_pos'), all = (teamOf.get(p.id) || []).map(t => tget(t, 'name'));
  const tabs = [['profile', 'Perfil'], ['pos', 'Posiciones'], ['abil', 'Habilidades'], ['skills', 'Especiales'], ['look', 'Apariencia'], ['motion', 'Movimientos']];
  const changed = S.origData && !S.d.subarray(p.base, p.base + 0x138).every((v, i) => v === S.origData[p.base + i]);
  return `<div class="card">
    <div class="head">${posBadge(reg)}${(() => { const c = clubOf(p.id); return c ? shirtSvg(kitFor(c, reg === 0), '2.4em', tget(c, 'name')) : ''; })()}<div style="min-width:0"><h2>${esc(g('name') || 'ID ' + p.id)}</h2>
      <div class="sub">${esc(g('shirt'))} · ${esc(COUNTRY.get(g('nation')) || 'País ' + g('nation'))} · ${g('age')} años · ${g('height')} cm · ${g('strong_foot') ? 'zurdo' : 'diestro'}${all.length ? ' · ' + esc(all.join(', ')) : ''} · ID ${p.id}</div></div>
      <div class="rating"><b class="${vcls(rating(p))}">${rating(p)}</b><span>Valoración aprox.</span></div></div>
    <label class="lock ${isLocked(p) ? '' : 'off'}"><input type="checkbox" id="pLock" ${isLocked(p) ? 'checked' : ''}>
      <div><b>Proteger mis cambios</b><span>Marca al jugador como editado. El juego usa estos valores aunque el Parche cargue otra base de datos.</span><div class="flags">${flagChips(p)}</div></div></label>
    <div class="row">${changed ? '<button class="btn small" id="pRevert" type="button">Volver al original de este jugador</button>' : ''}
      <select id="pCopy" style="width:auto;max-width:260px" aria-label="Copiar de otro jugador"><option value="">Copiar de otro jugador…</option>${S.ix.players.filter(x => x.id !== p.id).map(x => `<option value="${x.id}">${esc(pget(x, 'name') || x.id)}</option>`).join('')}</select>
      <select id="pCopyWhat" style="width:auto" aria-label="Qué copiar"><option value="abil">habilidades</option><option value="skills">especiales y estilos</option><option value="pos">posiciones</option><option value="look">apariencia</option><option value="motion">movimientos</option></select>
      <button class="btn small" id="pCopyBtn" type="button">Copiar</button></div>
    <div class="subtabs" role="tablist">${tabs.map(([k, n]) => `<button type="button" role="tab" data-ptab="${k}" aria-selected="${S.ptab === k}">${n}</button>`).join('')}</div>
  </div>
  <div class="card">${({ profile: tabProfile, pos: tabPos, abil: tabAbil, skills: tabSkills, look: tabLook, motion: tabMotion })[S.ptab](p)}</div>`;
}
function tabProfile(p) {
  const g = k => pget(p, k);
  return `<div class="grid wide">
    <div class="f"><label>Nombre</label><input type="text" data-k="name" value="${esc(g('name'))}" maxlength="60"></div>
    <div class="f"><label>Nombre en camiseta</label><input type="text" data-k="shirt" value="${esc(g('shirt'))}" maxlength="20"></div>
    <div class="f"><label>Nacionalidad</label>${mapSelect('nation', COUNTRY, g('nation'), 'Nacionalidad')}</div>
    <div class="f"><label>ID de nombre para el comentarista</label>${num('comm_id', g('comm_id'), 0, 4294967295)}</div>
  </div>
  <div class="grid">
    <div class="f"><label>Edad</label>${num('age', g('age'), 15, 50)}</div>
    <div class="f"><label>Altura (cm)</label>${num('height', g('height'), 140, 220)}</div>
    <div class="f"><label>Peso (kg)</label>${num('weight', g('weight'), 30, 150)}</div>
    <div class="f"><span class="lab">Pie hábil</span>${seg('strong_foot', ['Derecho', 'Izquierdo'], g('strong_foot'))}</div>
    <div class="f"><span class="lab">Mano hábil</span>${seg('strong_hand', ['Derecha', 'Izquierda'], g('strong_hand'))}</div>
    <div class="f"><span class="lab">Estrellas</span>${seg('star', ['0', '1', '2', '3', '4', '5'], g('star'))}</div>
    <div class="f"><span class="lab">Actitud de juego</span>${seg('play_attit', ['0', '1', '2', '3'], g('play_attit'))}</div>
  </div>`;
}
function tabPos(p) {
  const g = k => pget(p, k), reg = g('reg_pos');
  return `<div class="row" style="align-items:flex-start;gap:22px">
    <div class="pitch" id="pitch" style="flex:1 1 300px">${POS.map((n, i) => { const v = g('pos' + POS_TO_PP[i]); return `<button type="button" class="pp l${v} ${i === reg ? 'reg' : ''}" data-pp="${i}" style="grid-column:${PITCH[i][0]};grid-row:${PITCH[i][1]}" title="${POS_LONG[i]}: tocá para cambiar el nivel"><b>${n}</b><span>${['—', 'B', 'A'][v]}</span></button>`; }).join('')}</div>
    <div class="f" style="flex:1 1 240px;max-width:340px;gap:10px">
      <div class="f"><label>Posición registrada</label><select data-k="reg_pos">${POS_LONG.map((n, i) => `<option value="${i}" ${i === reg ? 'selected' : ''}>${POS[i]} · ${n}</option>`).join('')}</select></div>
      <p class="note">Tocá cada posición en la cancha para pasar de — (no juega) a B (puede jugar) y A (domina). La registrada queda marcada en amarillo y se pone en A sola.</p>
      <div class="row"><button class="btn small" id="ppClear" type="button">Dejar solo la registrada</button></div>
    </div></div>`;
}
function tabAbil(p) {
  const g = k => pget(p, k);
  return `<div class="row" style="justify-content:space-between"><h3>Habilidades (40 a 99)</h3>
    <div class="row"><button class="btn small" data-bulk="-1" type="button">−1 a todas</button><button class="btn small" data-bulk="1" type="button">+1 a todas</button>
    <input type="number" id="bulkSet" min="40" max="99" placeholder="Valor" style="width:80px" aria-label="Valor para todas"><button class="btn small" id="bulkSetBtn" type="button">Poner todas</button></div></div>
  <div class="groups">${ABIL_GROUPS.map(([gn, list]) => `<div class="group"><h4>${gn}</h4>${list.map(([k, n]) => { const v = g(k); return `<div class="ab"><div class="l"><span>${n}</span><input type="range" min="40" max="99" value="${v}" data-k="${k}" data-twin="1" aria-label="${n}"></div><input type="number" class="${vcls(v)}" min="40" max="99" value="${v}" data-k="${k}" aria-label="${n}"></div>`; }).join('')}</div>`).join('')}</div>
  <div class="grid">
    <div class="f"><span class="lab">Uso de pierna mala</span>${seg('weak_use', ['1', '2', '3', '4'], g('weak_use'))}</div>
    <div class="f"><span class="lab">Precisión de pierna mala</span>${seg('weak_acc', ['1', '2', '3', '4'], g('weak_acc'))}</div>
    <div class="f"><span class="lab">Estado de forma</span>${seg('form', ['1', '2', '3', '4', '5', '6', '7', '8'], g('form'))}</div>
    <div class="f"><span class="lab">Resistencia a lesiones</span>${seg('injury', ['C', 'B', 'A'], g('injury'))}</div>
  </div>`;
}
function tabSkills(p) {
  const g = k => pget(p, k);
  const n = SKILLS.flatMap(s => s[1]).filter(([i]) => g('sk' + i)).length;
  return `<div class="grid wide"><div class="f"><label>Estilo de juego</label><select data-k="play_style">${selOpts(STYLES, g('play_style'))}</select></div></div>
  <h3>Habilidades especiales · ${n} marcadas</h3>
  <div class="groups">${SKILLS.map(([gn, list]) => `<div class="group"><h4>${gn}</h4>${list.map(([i, nm]) => `<label class="chk"><input type="checkbox" data-k="sk${i}" ${g('sk' + i) ? 'checked' : ''}> ${nm}</label>`).join('')}</div>`).join('')}</div>
  <h3>Estilos de juego de la IA</h3>
  <div class="checks">${COM.map((nm, i) => `<label class="chk"><input type="checkbox" data-k="com${i}" ${g('com' + i) ? 'checked' : ''}> ${nm}</label>`).join('')}</div>`;
}
function tabLook(p) {
  const g = k => pget(p, k);
  return `<h3>Cuerpo</h3>
  <div class="body-grid">${BODY.map(([k, n]) => `<div class="ab"><span style="font-size:.83rem">${n}</span><input type="range" min="0" max="14" value="${g(k)}" data-k="${k}" aria-label="${n}"><output>${g(k) - 7 > 0 ? '+' : ''}${g(k) - 7}</output></div>`).join('')}</div>
  <div class="grid">
    <div class="f"><label>Color de piel</label><select data-k="skin_col">${selOpts(SKIN, g('skin_col'))}</select></div>
    <div class="f"><label>Color de ojos</label><select data-k="iris_col">${selOpts(IRIS, g('iris_col'))}</select></div>
  </div>
  <h3>Botines y guantes</h3>
  <div class="grid wide">
    <div class="f"><label>Botines</label>${mapSelect('boot_id', BOOTS, g('boot_id'), 'Botines')}</div>
    <div class="f"><label>Guantes de portero</label>${mapSelect('glove_id', GLOVES, g('glove_id'), 'Guantes de portero')}</div>
    <div class="f"><span class="lab">Guantes de jugador</span><div class="row"><label class="chk"><input type="checkbox" data-k="gloves" ${g('gloves') ? 'checked' : ''}> Usa</label><select data-k="gloves_col" style="width:auto" aria-label="Color de guantes">${selOpts(COLORS8, g('gloves_col'))}</select></div></div>
  </div>
  <h3>Equipación y accesorios</h3>
  <div class="grid">
    <div class="f"><label>Mangas</label><select data-k="sleeve">${selOpts(SLEEVE, g('sleeve'))}</select></div>
    <div class="f"><label>Camiseta interior</label><select data-k="inners">${selOpts(INNER, g('inners'))}</select></div>
    <div class="f"><label>Medias</label><select data-k="socks">${selOpts(SOCKS, g('socks'))}</select></div>
    <div class="f span2"><label>Calzas</label><select data-k="undershorts">${selOpts(UNDER, g('undershorts'))}</select></div>
    <div class="f"><label>Muñequera</label><select data-k="wrist_tape">${selOpts(TAPE, g('wrist_tape'))}</select></div>
    <div class="f"><label>Color muñequera izq.</label><select data-k="wrist_col_l">${selOpts(COLORS8, g('wrist_col_l'))}</select></div>
    <div class="f"><label>Color muñequera der.</label><select data-k="wrist_col_r">${selOpts(COLORS8, g('wrist_col_r'))}</select></div>
    <div class="f span2"><label>Anteojos</label><select data-k="spec_style">${selOpts(GLASSES, g('spec_style'))}</select></div>
    <div class="f"><label>Color de anteojos</label><select data-k="spec_col">${selOpts(COLORS8, g('spec_col'))}</select></div>
    <div class="f"><span class="lab">Otros</span><label class="chk"><input type="checkbox" data-k="untucked" ${g('untucked') ? 'checked' : ''}> Camiseta afuera</label><label class="chk"><input type="checkbox" data-k="ankle_tape" ${g('ankle_tape') ? 'checked' : ''}> Vendaje de tobillo</label></div>
  </div>
  <p class="note">La cara y el pelo no se editan acá: se conservan como están.</p>`;
}
function tabMotion(p) {
  const g = k => pget(p, k);
  return `<div class="grid wide">${MOTION.map(([k, n, min, max, off]) => `<div class="f"><label>${n} (${min}-${max})</label>${num(k, g(k) + off, min, max, `data-off="${off}"`)}</div>`).join('')}</div>
  <p class="note">Los números corresponden a las animaciones del juego, igual que en el modo Editar de PES.</p>`;
}
const KIT_BULK = [
  ['sleeve', 'Mangas', () => SLEEVE.map((n, i) => [i, n])], ['inners', 'Camiseta interior', () => INNER.map((n, i) => [i, n])],
  ['socks', 'Medias', () => SOCKS.map((n, i) => [i, n])], ['undershorts', 'Calzas', () => UNDER.map((n, i) => [i, n])],
  ['untucked', 'Camiseta', () => [[0, 'Adentro'], [1, 'Afuera']]], ['gloves', 'Guantes de jugador', () => [[0, 'No usa'], [1, 'Usa']]],
  ['gloves_col', 'Color de guantes', () => COLORS8.map((n, i) => [i, n])],
  ['boot_id', 'Botines', () => [...BOOTS].sort((a, b) => a[1].localeCompare(b[1])).map(([id, n]) => [id, n])],
];
const COPY_KEYS = {
  abil: [...ABIL.map(a => a[0]), 'weak_use', 'weak_acc', 'form', 'injury'],
  skills: [...SKILLS.flatMap(s => s[1]).map(([i]) => 'sk' + i), ...COM.map((_, i) => 'com' + i), 'play_style'],
  pos: ['reg_pos', ...POS_TO_PP.map(i => 'pos' + i)],
  look: [...BODY.map(b => b[0]), 'skin_col', 'iris_col', 'boot_id', 'glove_id', 'gloves', 'gloves_col', 'sleeve', 'inners', 'socks', 'undershorts', 'wrist_tape', 'wrist_col_l', 'wrist_col_r', 'spec_style', 'spec_col', 'untucked', 'ankle_tape'],
  motion: MOTION.map(mm => mm[0]),
};
function bindPlayer(p, m) {
  const sh = $('plSheet'), rer = () => later(() => renderPlayers(m));
  const nm = () => pget(p, 'name') || 'ID ' + p.id;
  sh.querySelectorAll('[data-ptab]').forEach(b => b.onclick = () => { S.ptab = b.dataset.ptab; renderPlayers(m); });
  $('pLock').onchange = e => { setLock(p, e.target.checked); rer(); };
  const rv = $('pRevert'); if (rv) rv.onclick = () => { edit('Volver al original: ' + nm(), 'p' + p.id, regP(p), () => S.d.set(S.origData.subarray(p.base, p.base + 0x138), p.base)); toast('Jugador restaurado como estaba al abrir el archivo.', 4000, ['Deshacer', undo]); rer(); };
  $('pCopyBtn').onclick = () => {
    const src = S.ix.byId.get(+$('pCopy').value); if (!src) { toast('Elegí de qué jugador copiar.'); return; }
    const what = $('pCopyWhat').value;
    edit('Copiar ' + $('pCopyWhat').selectedOptions[0].text + ' a ' + nm(), 'p' + p.id, regP(p), () => { for (const k of COPY_KEYS[what]) { PD.player.set(S.d, p.base, k, PD.player.get(S.d, src.base, k)); if (S.autoLock) for (const fl of [...LOCK_FLAGS, ...FIELD_FLAGS(k)]) PD.player.set(S.d, p.base, fl, 1); } });
    toast('Copiado de ' + pget(src, 'name') + '.', 4000, ['Deshacer', undo]); rer();
  };
  sh.addEventListener('input', e => {
    const el = e.target; if (el.type !== 'range') return;
    const ab = el.closest('.ab'); if (!ab) return;
    const tw = el.dataset.twin ? ab.querySelector('input[type=number]') : null; if (tw) { tw.value = el.value; tw.className = vcls(+el.value); }
    const o = ab.querySelector('output'); if (o) { const d = +el.value - 7; o.textContent = (d > 0 ? '+' : '') + d; }
  });
  sh.addEventListener('change', e => {
    const el = e.target, k = el.dataset.k; if (!k) return;
    let v;
    if (el.type === 'checkbox') v = el.checked ? 1 : 0;
    else if (el.type === 'text') v = el.value;
    else { v = Math.round(parseFloat(el.value)); if (isNaN(v)) return; if (el.min !== '' && v < +el.min) v = +el.min; if (el.max !== '' && v > +el.max) v = +el.max; el.value = v; if (el.dataset.off) v -= +el.dataset.off; }
    setP(p, k, v, nm() + ': ' + (FIELD_LABEL[k] || k));
    if (k === 'reg_pos') { const pp = 'pos' + POS_TO_PP[v]; if (pget(p, pp) < 2) setP(p, pp, 2, nm() + ': posiciones'); }
    if (ABIL.some(a => a[0] === k)) sh.querySelectorAll(`[data-k="${k}"]`).forEach(x => { if (x !== el) x.value = el.value; if (x.type === 'number') x.className = vcls(+el.value); });
    if (['name', 'reg_pos', 'nation', 'age', 'height', 'strong_foot', 'play_style'].includes(k) || el.type === 'checkbox') rer();
    else updateLockUi(p);
  });
  sh.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const sg = b.closest('[data-segk]');
    if (sg && b.dataset.v != null) { setP(p, sg.dataset.segk, +b.dataset.v, nm() + ': ' + (FIELD_LABEL[sg.dataset.segk] || sg.dataset.segk)); rer(); return; }
    if (b.dataset.pp != null) { const k = 'pos' + POS_TO_PP[+b.dataset.pp]; setP(p, k, (pget(p, k) + 1) % 3, nm() + ': posiciones'); rer(); return; }
    if (b.id === 'ppClear') { const reg = pget(p, 'reg_pos'); edit(nm() + ': posiciones', 'p' + p.id, regP(p), () => { POS_TO_PP.forEach((pp, i) => PD.player.set(S.d, p.base, 'pos' + pp, i === reg ? 2 : 0)); if (S.autoLock) for (const fl of LOCK_FLAGS) PD.player.set(S.d, p.base, fl, 1); }); rer(); return; }
    if (b.dataset.bulk) { const d = +b.dataset.bulk; edit(nm() + ': ' + (d > 0 ? '+1' : '−1') + ' a todas las habilidades', 'p' + p.id, regP(p), () => { for (const [k] of ABIL) PD.player.set(S.d, p.base, k, Math.max(40, Math.min(99, PD.player.get(S.d, p.base, k) + d))); if (S.autoLock) for (const fl of LOCK_FLAGS) PD.player.set(S.d, p.base, fl, 1); }); rer(); return; }
    if (b.id === 'bulkSetBtn') { const v = parseInt($('bulkSet').value, 10); if (!(v >= 40 && v <= 99)) { toast('Poné un valor entre 40 y 99.'); return; } edit(nm() + ': todas las habilidades en ' + v, 'p' + p.id, regP(p), () => { for (const [k] of ABIL) PD.player.set(S.d, p.base, k, v); if (S.autoLock) for (const fl of LOCK_FLAGS) PD.player.set(S.d, p.base, fl, 1); }); rer(); }
  });
}
function updateLockUi(p) {
  const lk = $('pLock'); if (!lk) return; lk.checked = isLocked(p); lk.closest('.lock').classList.toggle('off', !lk.checked);
  const fl = lk.closest('.lock').querySelector('.flags'); if (fl) fl.innerHTML = flagChips(p);
  const it = document.querySelector(`[data-p="${p.id}"] .nm`); if (it && !it.querySelector('.dot')) it.insertAdjacentHTML('beforeend', '<span class="dot" title="Con cambios sin guardar"></span>');
  const r = document.querySelector('.rating b'); if (r) { r.textContent = rating(p); r.className = vcls(rating(p)); }
}

// ----- file -----
function renderFile(m) {
  const i = PesCrypt.info(S.f);
  const edited = S.ix.players.length, locked = S.ix.players.filter(isLocked).length;
  m.innerHTML = `<div class="sheet" style="max-width:900px">
    <div class="card"><h3>Archivo abierto</h3>
      <div class="tablebox"><table style="min-width:0"><tbody>
        <tr><td>Ubicación</td><td class="mono">${esc(S.name)}</td></tr>
        <tr><td>Juego</td><td class="mono">${esc(i.version)} (PES ${i.game})</td></tr>
        <tr><td>Usuario de Windows (SID)</td><td class="mono">${esc(i.sid)}</td></tr>
        <tr><td>Equipos</td><td class="mono">${S.ix.teams.length}</td></tr>
        <tr><td>Jugadores editados</td><td class="mono">${edited} (${locked} protegidos)</td></tr>
        <tr><td>Kits</td><td class="mono">${KITS.map.size ? KITS.map.size + ' equipos de ' + esc(KITS.from) + ' · ' + new Date(KITS.when).toLocaleDateString('es-AR') : 'sin conectar · se usan los colores del equipo'}</td></tr>
        <tr><td>Nombres cargados</td><td class="mono">${S.names.size ? S.names.size.toLocaleString('es-AR') + ' de ' + esc(S.namesFrom) : 'ninguno · usá "Conectar Player.bin"'}</td></tr>
      </tbody></table></div>
      ${S.dir ? '<p class="note">Guardás directo sobre el archivo del juego. En el primer guardado de cada sesión se crea <code>EDIT00000000.respaldo-fecha</code> en la misma carpeta.</p>' : '<div class="warnbox">Modo copia: al guardar se descarga un archivo nuevo que tenés que copiar a mano. Para guardar directo, usá "Abrir carpeta del juego" en Chrome o Edge.</div>'}
      <div class="row"><button class="btn" id="discard" type="button" ${S.hist.length ? '' : 'disabled'}>Descartar todos los cambios</button>
      <button class="btn" id="dlCopy" type="button">Descargar una copia</button></div>
    </div>
    <div class="card"><h3>Historial de esta sesión</h3>
      ${S.hist.length ? `<div class="hist">${S.hist.map((h, k) => `<div class="${k >= S.hp ? 'undone' : ''}"><span>${esc(h.label)}</span><span class="sub">${new Date(h.t).toLocaleTimeString('es-AR')}${k === S.savedHp - 1 ? ' · guardado' : ''}</span></div>`).reverse().join('')}</div><p class="note">Lo tachado está deshecho; Ctrl+Y lo vuelve a aplicar.</p>` : '<p class="note">Todavía no hiciste cambios.</p>'}
    </div>
    <div class="card"><h3>Nombre del archivo en el juego</h3>
      <div class="f"><label for="fDesc">Texto que muestra la pantalla de carga</label><input type="text" id="fDesc" value="${esc(i.description)}" maxlength="120"></div>
    </div>
    <div class="card"><h3>Pasar a otra PC</h3>
      <p class="note">Cada EDIT lleva el usuario de Windows de la PC donde se creó, y el juego rechaza los de otra PC. Para usar este archivo en otra computadora, poné el SID de esa PC (en esa PC: <code>cmd</code> → <code>whoami /user</code>) y descargá una copia. No lo guardes sobre el de esta PC.</p>
      <div class="row"><input type="text" id="fSid" value="${esc(i.sid)}" spellcheck="false" style="font-family:var(--mono);max-width:460px" aria-label="SID"><button class="btn" id="fSidBtn" type="button">Aplicar SID</button></div>
    </div>
    ${compareCardHtml()}
    ${S.dir ? `<div class="card"><h3>Respaldos en esta carpeta</h3><div id="baks" class="note">Buscando…</div></div>` : ''}
  <div class="card"><h3>Carpeta del juego</h3>
      ${PESLOC.season || PESLOC.edits.length ? `<p class="note">Encontrada en ${esc((PESLOC.root ? PESLOC.root.name + ' › ' : ''))}${esc(PESLOC.season ? PESLOC.season.name : '')}. ${PESLOC.wepes ? 'Tiene carpeta WEPES.' : 'No tiene carpeta WEPES.'}</p>
      <div class="pesedits">${PESLOC.edits.map((e, i) => `<div class="pesedit ${PESLOC.chosen === e ? 'on' : ''}"><b>${e.kind === 'drmp' ? 'Parche (drmp)' : e.kind === 'save' ? 'Juego sin parche (save)' : esc(e.kind)}</b><span class="mono">${esc(e.path)}\\EDIT00000000</span><small>${new Date(e.mtime).toLocaleString('es-AR')} · ${(e.size / 1048576).toFixed(1).replace('.', ',')} MB</small>${PESLOC.chosen === e ? '<span class="chip ok">Abierto</span>' : `<button class="btn small" type="button" data-pesedit="${i}">Abrir este</button>`}</div>`).join('')}</div>`
      : '<p class="note">El EDIT se abrió a mano: no hay una carpeta del juego conectada.</p>'}
      <div class="row"><button class="btn small" type="button" id="pesAgain">🔎 Buscar de nuevo</button><button class="btn small ghost" type="button" id="pesOther">Elegir otra carpeta…</button></div></div>
  ${helpCard('file')}
  </div>`;
  bindCompare();
  m.querySelectorAll('[data-pesedit]').forEach(b => b.onclick = () => pesSwitch(+b.dataset.pesedit));
  { const a = $('pesAgain'); if (a) a.onclick = () => pesStart(); const o = $('pesOther'); if (o) o.onclick = () => { introShow(); pesPick(); }; }
  $('fDesc').onchange = e => { edit('Nombre del archivo', 'desc', [], () => PesCrypt.setDescription(S.f, e.target.value)); };
  $('fSidBtn').onclick = () => { const v = $('fSid').value.trim(); if (!/^S-1-5-21-\d+-\d+-\d+-\d+$/.test(v)) { toast('El SID tiene que tener la forma S-1-5-21-número-número-número-número.'); return; } edit('Cambiar SID', 'sid', [], () => PesCrypt.setSid(S.f, v)); toast('SID cambiado. Descargá una copia para la otra PC.'); renderFile(m); };
  $('discard').onclick = async () => { if (!await confirmBox('¿Descartar todos los cambios de esta sesión?')) return; openBytes(S.orig, S.name); toast('Cambios descartados.'); setTab('file'); };
  $('dlCopy').onclick = async () => { const b = await buildChecked(); if (b) downloadBytes('EDIT00000000', b); };
  if (S.dir) listBackups();
}
async function listBackups() {
  const box = $('baks'); if (!box) return;
  const items = [];
  try { for await (const [n, h] of S.dir.entries()) if (h.kind === 'file' && n.startsWith('EDIT00000000.respaldo-')) items.push(n); } catch { box.textContent = 'No se pudo leer la carpeta.'; return; }
  items.sort().reverse();
  box.innerHTML = items.length ? items.map(n => `<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding:4px 0"><code>${esc(n)}</code><button class="btn small" data-bak="${esc(n)}" type="button">Abrir este respaldo</button></div>`).join('') + '<p class="note">Abrir un respaldo lo carga en el editor; vuelve al juego recién cuando tocás Guardar.</p>' : 'Todavía no hay respaldos. Se crea uno al guardar por primera vez.';
  box.onclick = async e => {
    const b = e.target.closest('[data-bak]'); if (!b) return;
    const h = await S.dir.getFileHandle(b.dataset.bak);
    const bytes = new Uint8Array(await (await h.getFile()).arrayBuffer());
    const cur = S.orig, bk = S.backedUp; openBytes(bytes, S.name); S.orig = cur; S.backedUp = bk; S.savedHp = -1; updateTop();
    toast('Respaldo cargado. Tocá Guardar para devolverlo al juego.'); setTab('file');
  };
}

// ---------- wiring ----------
$('fFile').onchange = e => { const f = e.target.files[0]; if (f) openFile(f); e.target.value = ''; };
$('bNames').onclick = () => $('fNames').click();
$('bKits').onclick = connectKits;
document.addEventListener('click', e => { if (e.target.closest('[data-kits]')) connectKits(); });
kitsLoadCache(); namesLoadCache(); FACES.ready = restoreFaces().then(() => { if (FACES.count) render(); });
$('fNames').onchange = e => { const f = e.target.files[0]; if (f) loadNames(f); e.target.value = ''; };
$('bSave').onclick = save; $('bUndo').onclick = undo; $('bRedo').onclick = redo;
$('bReload').onclick = () => reloadFromGame(); $('tTeams').onclick = () => setTab('teams'); $('tNats').onclick = () => setTab('nats'); $('tPlayers').onclick = () => setTab('players'); $('tFile').onclick = () => setTab('file'); $('tWepes').onclick = () => setTab('wepes'); $('tNews').onclick = () => setTab('news');
$('gq').oninput = e => gsearch(e.target.value);
$('gq').onkeydown = e => { if (e.key === 'Enter') { const b = $('gres').querySelector('button'); if (b) gpick(b); } if (e.key === 'Escape') { $('gres').hidden = true; e.target.blur(); } };
$('gres').onclick = e => { const b = e.target.closest('button'); if (b) gpick(b); };
document.addEventListener('click', e => { if (!e.target.closest('.gsearch')) $('gres').hidden = true; if (!e.target.closest('.picker') && $('addRes')) $('addRes').hidden = true; });
window.addEventListener('beforeunload', e => { if (pending()) { e.preventDefault(); e.returnValue = ''; } });
document.addEventListener('keydown', e => {
  const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); if (pending()) save(); }
  else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && k === 'z' && !typing) { e.preventDefault(); undo(); }
  else if ((e.ctrlKey || e.metaKey) && (k === 'y' || (e.shiftKey && k === 'z')) && !typing) { e.preventDefault(); redo(); }
  else if (e.key === '/' && !typing && S.f) { e.preventDefault(); $('gq').focus(); }
});
render();
