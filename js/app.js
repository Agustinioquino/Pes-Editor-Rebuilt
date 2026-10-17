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
  if (/^(name|shirt|shirt_nt|comm_id)$/.test(k)) return ['e_player'];
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
// (las cinco de arquero se comprobaron con arqueros que el juego guardó en el EDIT y con 300 arqueros de PES Master)
const DB_ABIL = { atk: 370, drib: 352, loftpass: 402, finish: 396, place_kick: 250, swerve: 332, kick_pwr: 358, speed: 306, exp_pwr: 344, stamina: 338, def: 275, ball_win: 312, aggres: 384, jump: 294, header: 288, lowpass: 263, body_ctrl: 376, phys_cont: 390, ball_ctrl: 281, tight_pos: 416, gk: 326, catching: 364, clearing: 269, reflex: 320, cover: 300 };
const T_ = PesTables;
const COUNTRY = new Map(T_.countries.map(c => [c[0], c[1]]));
const BOOTS = new Map(T_.boots.map(c => [c[0], c[1]]));
const GLOVES = new Map(T_.gloves.map(c => [c[0], c[1]]));
const STADIUM = new Map(T_.stadiums.map(c => [c[0], c[1]]));
// nombre real del estadio (el propio que le pusiste o el de internet) y, entre paréntesis, el que tiene elegido el EDIT
function stadLabel(t) {
  const game = STADIUM.get(tget(t, 'stadium_id')) || 'Estadio ' + tget(t, 'stadium_id'), real = (tget(t, 'stadium_name') || '').trim() || (typeof realStadium === 'function' ? realStadium(t) : '');
  return real && normTxt(real) !== normTxt(game) ? `<b>${esc(real)}</b> (${esc(game)})` : `<b>${esc(game)}</b>`;
}
const COACH = new Map(T_.coaches.map(c => [c[0], c[1]]));

// ---------- state ----------
const S = {
  name: '', f: null, d: null, ix: null, orig: null, origData: null,
  dir: null, editHandle: null, backedUp: false,
  hist: [], hp: 0, savedHp: 0,
  names: new Map(), namesFrom: '',
  tab: 'teams', team: null, teamByTab: {}, natSeen: false, player: null, ttab: 'roster', ptab: 'profile',
  qTeam: '', tSort: 'name', tFilter: 'all', tLeague: '', qPlayer: '', pSrc: 'edit', dbPlayer: null, showEmpty: false, autoLock: true, pFilter: 'all', rosterSort: 'xi', fplan: 0, fvar: 0, flink: true, fsel: null, fbench: null, fmulti: [], fmultiMode: false,
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
// en inglés, la nomenclatura de PES (GK, CB, DMF, AMF, CF…); en español, la de siempre (PT, DEC, MO, CD…)
const POS_EN = ['GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'LMF', 'RMF', 'AMF', 'LWF', 'RWF', 'SS', 'CF'];
const posCode = i => (typeof LANG !== 'undefined' && LANG === 'en' ? POS_EN : POS)[i] || '?';
const posBadge = (i, cls = '') => `<span class="posb ${POS_GRP[i] || 'mf'} ${cls}" data-noi18n>${posCode(i)}</span>`;
const vcls = v => v >= 90 ? 'v90' : v >= 80 ? 'v80' : v >= 70 ? 'v70' : v >= 60 ? 'v60' : 'vlo';
function playerName(id) {
  const p = S.ix && S.ix.byId.get(id);
  if (p) { const n = pget(p, 'name'); if (n) return n; }
  const n = S.names.get(id); return n ? n.name : '';
}
// cuánto de la forma ya está guardado en el EDIT: media del EDIT − media original del juego
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
  return Object.assign({}, b, { adj: a.adj, form: a, r0: b.r, applied: done }, PREFS.rateMode !== 'base' ? { r: Math.max(40, Math.min(rateCap(b.pos), b.r + pend)) } : {});
}
// flechas de forma estilo PES: ⬆ verde, ↗ verde claro, ➡ neutral, ↘ naranja, ⬇ rojo
function formLevel(a) { return a >= 3 ? 2 : a >= 1 ? 1 : a <= -3 ? -2 : a <= -1 ? -1 : 0; }
function formTip(f) {
  if (!f) return '';
  const p = f.parts || {}, bits = [];
  if (f.n) bits.push(`Rinde ${f.avg} de promedio en ${f.n} partido${f.n > 1 ? 's' : ''} (se esperaba ${f.expect ?? '?'})`); else bits.push('Sin partidos recientes');
  if (f.s) bits.push(`temporada: ${f.s.app} PJ, ${f.s.g} G y ${f.s.a} A${f.s.share != null ? ', ' + f.s.share + '% de los minutos' : ''}`);
  else if (f.g || f.as) bits.push(`${f.g} gol${f.g === 1 ? '' : 'es'} y ${f.as} asistencia${f.as === 1 ? '' : 's'} en ${f.min}′`);
  if (f.ppg != null) bits.push(`equipo: ${f.ppg.toFixed(2).replace('.', ',')} pts por partido`);
  if (f.hist && f.hist.length) bits.push(`historial: ${f.hist.length} temporada${f.hist.length > 1 ? 's' : ''}`);
  if (f.injury) bits.push(`lesión: ${f.injury.t || f.injury.st}`); else if (f.absent >= 3 && p.inj) bits.push(`ausente en las últimas ${f.absent} citaciones`);
  if (f.age) bits.push(`${f.age} años (${f.age <= 21 ? 'joven: sube más rápido' : f.age >= 33 ? 'veterano: baja más rápido' : f.age >= 30 ? 'sube algo menos' : 'edad normal'})`);
  return bits.join(' · ') + ` → ${f.adj > 0 ? '+' : ''}${f.adj}` + ' · ⓘ en Forma del plantel para ver el detalle';
}
// valoración para la cancha/banco según la vista elegida: del juego, por rendimiento o comparando las dos
function rateHtml(pi, tag = 'span') {
  if (!pi || !pi.r) return '';
  const oop = pi.outpos ? `<span class="oop" title="Fuera de su puesto: en ${POS[pi.natPos]} tiene ${pi.nat} (${pi.outpos})">⚠</span>` : '';
  const pend = pi.form ? pi.adj - (pi.applied || 0) : 0, base = pi.r0 != null ? pi.r0 : pi.r, target = Math.max(40, Math.min(rateCap(pi.pos), base + pend));
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
function pInfoBase(id) { const p = S.ix && S.ix.byId.get(id); if (p) return { id, pos: pget(p, 'reg_pos'), r: rating(p), a: pget(p, 'age'), edit: true }; const n = S.names.get(id); return n && n.pos != null ? { id, pos: n.pos, r: Math.min(n.r, rateTop()), a: n.a || 0, edit: false } : null; }
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
// Media como la calcula el juego, un modelo por puesto (PT, DEC, LI, LD, MCD, MC, MI, MD, MO, EI, ED, SD, CD).
// Ajustado con 14.000 jugadores de PES 2020 y 280 de PES 2021 con su media real, y con las pruebas en el juego
// (todo en 99 da 109, el central 108 y el arquero 97). Primero un promedio ponderado de las habilidades (pesos en
// milésimas); después una curva por tramos en 60, 70, 80, 90 y 99, que es empinada en el medio y se aplana arriba.
// Acierta la media exacta en 2 de cada 3 jugadores y en el resto se va por 1.
const RATE_MODEL = [
  ['gk:208 catching:136 clearing:130 reflex:139 cover:212 jump:87 phys_cont:87', [49.9, 61.69, 73.65, 85.42, 97]], // GK
  ['atk:29 ball_ctrl:42 drib:19 tight_pos:17 lowpass:23 loftpass:28 finish:36 header:98 place_kick:23 swerve:30 speed:60 exp_pwr:26 kick_pwr:19 jump:96 phys_cont:96 body_ctrl:28 stamina:68 def:118 ball_win:90 aggres:53', [50.86, 67.88, 84.87, 97.96, 108]], // CB
  ['atk:46 ball_ctrl:65 drib:54 tight_pos:42 lowpass:29 loftpass:72 finish:33 header:22 place_kick:25 swerve:28 speed:76 exp_pwr:75 kick_pwr:21 jump:67 phys_cont:57 body_ctrl:40 stamina:75 def:80 ball_win:54 aggres:39', [52.91, 71.11, 87.41, 100.06, 109]], // LB
  ['atk:46 ball_ctrl:74 drib:53 tight_pos:36 lowpass:24 loftpass:73 finish:34 header:32 place_kick:24 swerve:29 speed:80 exp_pwr:76 kick_pwr:20 jump:60 phys_cont:52 body_ctrl:40 stamina:76 def:73 ball_win:54 aggres:45', [52.87, 71.09, 87.78, 100.19, 109]], // RB
  ['atk:57 ball_ctrl:91 drib:51 tight_pos:44 lowpass:86 loftpass:90 finish:28 header:20 place_kick:26 swerve:63 speed:38 exp_pwr:28 kick_pwr:27 jump:46 phys_cont:60 body_ctrl:45 stamina:79 def:53 ball_win:42 aggres:24', [52.61, 71.04, 87.38, 100.1, 109]], // DMF
  ['atk:44 ball_ctrl:118 drib:72 tight_pos:47 lowpass:114 loftpass:90 finish:31 header:24 place_kick:26 swerve:31 speed:42 exp_pwr:44 kick_pwr:26 jump:31 phys_cont:39 body_ctrl:41 stamina:85 def:42 ball_win:26 aggres:26', [50.66, 68.68, 84.92, 98.08, 109]], // CMF
  ['atk:53 ball_ctrl:78 drib:80 tight_pos:58 lowpass:59 loftpass:54 finish:34 header:21 place_kick:37 swerve:36 speed:97 exp_pwr:110 kick_pwr:29 jump:28 phys_cont:36 body_ctrl:30 stamina:74 def:34 ball_win:30 aggres:21', [50.65, 68.3, 84.98, 99.97, 109]], // LMF
  ['atk:64 ball_ctrl:75 drib:91 tight_pos:47 lowpass:62 loftpass:64 finish:33 header:18 place_kick:29 swerve:38 speed:112 exp_pwr:88 kick_pwr:21 jump:35 phys_cont:31 body_ctrl:34 stamina:78 def:27 ball_win:28 aggres:26', [51, 68.04, 84.77, 99.74, 109]], // RMF
  ['atk:77 ball_ctrl:123 drib:75 tight_pos:45 lowpass:101 loftpass:72 finish:86 header:22 place_kick:26 swerve:28 speed:55 exp_pwr:41 kick_pwr:24 jump:33 phys_cont:36 body_ctrl:40 stamina:37 def:31 ball_win:24 aggres:24', [51.02, 69.28, 85.82, 100.14, 109]], // AMF
  ['atk:80 ball_ctrl:89 drib:87 tight_pos:52 lowpass:51 loftpass:56 finish:64 header:26 place_kick:23 swerve:28 speed:78 exp_pwr:77 kick_pwr:48 jump:30 phys_cont:34 body_ctrl:43 stamina:54 def:30 ball_win:27 aggres:24', [51.59, 69.61, 86.21, 101.03, 109]], // LWF
  ['atk:89 ball_ctrl:88 drib:95 tight_pos:44 lowpass:34 loftpass:66 finish:76 header:27 place_kick:23 swerve:34 speed:70 exp_pwr:77 kick_pwr:40 jump:26 phys_cont:32 body_ctrl:42 stamina:49 def:34 ball_win:31 aggres:22', [51.88, 69.93, 86.47, 99.26, 109]], // RWF
  ['atk:88 ball_ctrl:88 drib:71 tight_pos:47 lowpass:54 loftpass:68 finish:75 header:26 place_kick:26 swerve:18 speed:63 exp_pwr:91 kick_pwr:47 jump:34 phys_cont:33 body_ctrl:45 stamina:48 def:20 ball_win:29 aggres:30', [51.1, 69.49, 86.14, 99.11, 109]], // SS
  ['atk:131 ball_ctrl:106 drib:60 tight_pos:40 lowpass:24 loftpass:30 finish:153 header:42 place_kick:25 swerve:26 speed:37 exp_pwr:45 kick_pwr:31 jump:37 phys_cont:57 body_ctrl:40 stamina:30 def:27 ball_win:33 aggres:25', [51.54, 69.4, 86.43, 99.8, 109]], // CF
].map(([w, c]) => { const ws = w.split(' ').map(x => x.split(':')).map(([k, v]) => [k, +v]), t = ws.reduce((a, x) => a + x[1], 0); return { w: ws.map(([k, v]) => [k, v / t]), c }; });
const RATE_KN = [60, 70, 80, 90, 99], RATING_V = 4;
const rateCap = pos => Math.min((RATE_MODEL[pos] || RATE_MODEL[5]).c[4], rateTop());
// el tope de la valoración depende del juego: PES 2021 llega a 109 y Football Life muestra como máximo 104 (visto en el
// juego). Se sabe por la carpeta del EDIT abierto (Football Life guarda en …\2026\save) o, si el EDIT se abrió a mano,
// por el .exe del juego conectado con Sider (FL_2026.exe)
const GAME_TOP = { fl: 104 }, GAME = { kind: null };
function gameKind() {
  const p = typeof PESLOC !== 'undefined' && PESLOC.chosen && S.editHandle === PESLOC.chosen.handle ? PESLOC.chosen.path : '';
  if (p) return /\\2026\\/.test(p + '\\') ? 'fl' : 'pes';
  let x = ''; try { x = localStorage.getItem('edit21-gameexe') || ''; } catch { }
  return /^FL_\d+\.exe$|football.?life/i.test(x) ? 'fl' : 'pes';
}
// se vuelve a mirar al abrir un EDIT o conectar Sider; si cambió el juego, se recalculan las medias
function gameRefresh(quiet) {
  const k = gameKind(); if (k === GAME.kind) return false; const was = GAME.kind; GAME.kind = k;
  RATE_GEN++; RATE_CACHE.clear(); SCORE_CACHE.clear(); VAL_CACHE.clear();
  if (!quiet && (was || k === 'fl')) toast(k === 'fl' ? '⚽ Football Life: las valoraciones se muestran como en ese juego (máximo 104).' : 'PES 2021: las valoraciones se muestran como en ese juego (máximo 109).');
  return true;
}
const rateTop = () => (GAME.kind || gameRefresh(true) || GAME.kind) && GAME_TOP[GAME.kind] || 999;
function posFormula(pos, ab, raw) {
  const m = RATE_MODEL[pos] || RATE_MODEL[5], c = m.c; let s = 0; for (const [k, w] of m.w) s += w * ab(k);
  let r;
  if (s <= 60) r = c[0] + (s - 60) * (c[1] - c[0]) / 10;
  else if (s >= 99) r = c[4] + (s - 99) * (c[4] - c[3]) / 9;
  else { let i = 0; while (s > RATE_KN[i + 1]) i++; r = c[i] + (s - RATE_KN[i]) * (c[i + 1] - c[i]) / (RATE_KN[i + 1] - RATE_KN[i]); }
  return raw ? r : Math.min(r, rateTop());
}
function rating(p) { return Math.round(posFormula(pget(p, 'reg_pos'), k => pget(p, k))); }
// media en un puesto que no es el suyo (como la muestra el juego en la alineación): A sin castigo, B −6, C −7 (medido en el juego)
// puestos que puede jugar en Player.bin (2 bits por puesto: 0 no, 1 B, 2 A), por número de puesto (0 PT … 12 CD)
const DB_POSFLAG = { 0: 350, 1: 468, 2: 318, 3: 474, 4: 414, 5: 456, 6: 466, 7: 460, 8: 464, 9: 472, 10: 476, 11: 478, 12: 470 };
function abilOf(pid) { const p = S.ix && S.ix.byId.get(pid); if (p) return k => pget(p, k); if (DBRAW && DBRAW.off.has(pid)) { const o = DBRAW.off.get(pid); return k => dbBits(o, DB_ABIL[k], 6) + 40; } return null; }
function posFlag(pid, role) { const p = S.ix && S.ix.byId.get(pid); if (p) return pget(p, 'pos' + POS_TO_PP[role]); if (DBRAW && DBRAW.off.has(pid) && DB_POSFLAG[role] != null) return dbBits(DBRAW.off.get(pid), DB_POSFLAG[role], 2); return null; }
function slotRating(pid, role) {
  const b = pInfoBase(pid); if (!b || role == null || role === b.pos) return b ? b.r : null;
  const ab = abilOf(pid); if (!ab) return b.r;
  let r = posFormula(role, ab);
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
const FIELD_LABEL = Object.fromEntries([...ABIL, ...BODY, ...MOTION.map(m => [m[0], m[1]]), ['name', 'nombre'], ['shirt', 'camiseta'], ['shirt_nt', 'camiseta en la selección'], ['nation', 'nacionalidad'], ['age', 'edad'], ['height', 'altura'], ['weight', 'peso'], ['reg_pos', 'posición'], ['play_style', 'estilo'], ['strong_foot', 'pie hábil'], ['strong_hand', 'mano hábil'], ['star', 'estrellas'], ['play_attit', 'actitud de juego'], ['weak_use', 'pierna mala'], ['weak_acc', 'precisión pierna mala'], ['form', 'forma'], ['injury', 'lesiones'], ['boot_id', 'botines'], ['glove_id', 'guantes']]);

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
  gameRefresh(); updateTop(); render();
  if (DBRAW) { const fixed = repairEditPlayers(); if (checkDbChanged(fixed) || fixed) render(); }
}
async function openFile(file) {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    S.dir = null; S.editHandle = null;
    openBytes(bytes, file.name);
    toast('Abierto en modo copia: al guardar se descarga el archivo nuevo.');
  } catch (e) { toast(e.message, 6000); }
}
// ---- base del juego (Player.bin) → entradas del EDIT ----
let DBRAW = null, DBSIG = '';
// campos del EDIT y dónde están en Player.bin [bit, bits, suma]; verificado con jugadores que el juego guardó en tu EDIT
// (los movimientos, además, con los 25.000 jugadores exportados por el editor de PES 2020)
const DB_TO_EDIT = () => Object.assign(Object.fromEntries(Object.entries(DB_ABIL).map(([k, p]) => [k, [p, 6, 40]])), { nation: [233, 9, 0], age: [408, 6, 15], reg_pos: [434, 4, 0], form: [438, 3, 0], weak_use: [454, 2, 0], weak_acc: [462, 2, 0], injury: [458, 2, 0], star: [451, 3, 0], weight: [256, 7, 30], strong_foot: [514, 1, 0], gc1: [242, 8, 0], mo_ck: [422, 4, 0], mo_armd: [426, 4, 0], mo_armr: [430, 4, 0], mo_hunchd: [441, 3, 0], mo_pk: [444, 3, 0], mo_hunchr: [448, 3, 0], mo_fk: [123, 5, 0] });
function dbBits(o, pos, n) { const b = DBRAW.b; let v = 0; for (let i = 0; i < n; i++) { const q = pos + i; if ((b[o + (q >> 3)] >> (q & 7)) & 1) v |= 1 << i; } return v; }
function dbStr(o, l) { const s = DBRAW.b.subarray(o, o + l), z = s.indexOf(0); return new TextDecoder().decode(z < 0 ? s : s.subarray(0, z)); }
// peso en la base del juego: 7 bits desde el bit 256, en kg menos 30 (comprobado con la base de Football Life 2026)
const dbWeight = id => { const o = DBRAW && DBRAW.off.get(id); return o == null ? null : dbBits(o, 256, 7) + 30; };
const canMakeEditPlayer = id => !!(DBRAW && DBRAW.off.has(id));
// físico y apariencia de la base (common\character0\model\character\appearance\PlayerAppearance.bin): registros de
// 60 bytes, el id y los mismos 56 bytes que el EDIT guarda desde +0xFC (cuerpo, cabeza, piel, accesorios)
let DBAPP = null;
const APP_REC = 60, EDIT_APP = 0xFC;
async function appearanceFromBin(bytes) {
  let b = bytes;
  if (b[3] === 0x57 && b[4] === 0x45 && b[5] === 0x53 && b[6] === 0x59 && b[7] === 0x53) b = new Uint8Array(await new Response(new Blob([b.subarray(16)]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  if (!b.length || b.length % APP_REC) throw new Error('No parece un PlayerAppearance.bin de PES 2021.');
  const off = new Map(); for (let o = 0; o < b.length; o += APP_REC) off.set((b[o] | b[o + 1] << 8 | b[o + 2] << 16 | b[o + 3] << 24) >>> 0, o);
  DBAPP = { b, off }; return off.size;
}
// la parte de "Apariencia" de un jugador del EDIT: la de la base si está; si no, un cuerpo normal (todo en 0, no en -7)
function setEditLook(start, id) {
  const w = (o, v) => { S.d[o] = v & 255; S.d[o + 1] = v >> 8 & 255; S.d[o + 2] = v >> 16 & 255; S.d[o + 3] = v >>> 24 & 255; };
  w(start + 0xF0, id);
  const a = DBAPP && DBAPP.off.get(id);
  if (a != null) { S.d.set(DBAPP.b.subarray(a + 4, a + APP_REC), start + EDIT_APP); return true; }
  for (const [k] of BODY) PD.player.set(S.d, start, k, 7);
  return false;
}
// posiciones de la base en el EDIT (el EDIT las guarda en otro orden: POS_TO_PP)
function setEditPositions(start, o) { for (const [role, bit] of Object.entries(DB_POSFLAG)) PD.player.set(S.d, start, 'pos' + POS_TO_PP[role], dbBits(o, bit, 2)); }
// habilidades especiales, IA y estilo de juego en Player.bin (un bit cada una), por número de habilidad del EDIT (sk0…sk40)
// y de IA (com0…com6); ubicados con un jugador que el juego guardó en el EDIT y con los datos de pesdb.net
const DB_SKILL = { 0: 519, 28: 523, 1: 485, 2: 497, 3: 482, 29: 481, 4: 528, 5: 525, 30: 500, 10: 505, 6: 495, 7: 527, 31: 506, 39: 518, 8: 513, 32: 494, 33: 499, 9: 524, 11: 511, 12: 507, 40: 487, 13: 484, 14: 483, 15: 493, 16: 515, 34: 512, 17: 488, 19: 521, 18: 490, 35: 496, 20: 522, 37: 502, 36: 501, 21: 491, 22: 504, 23: 517, 38: 503, 24: 530, 25: 492, 26: 516, 27: 486 };
const DB_COM = [489, 531, 526, 510, 529, 447, 520];
// el estilo de juego está en 5 bits desde el 155, con la numeración vieja de PES (2019); acá pasa a la del EDIT (STYLES)
const DB_STYLE = [0, 1, 2, 3, 6, 9, 10, 11, 14, 12, 19, 15, 17, 4, 5, 18, 20, 21, 7, 8, 13, 16];
const dbStyle = o => DB_STYLE[dbBits(o, 155, 5)] || 0;
// se copian sin marcar Especiales, Estilo ni IA: el juego sigue usando los de su base hasta que los cambies en el editor
function setEditSkills(start, o) {
  for (const [k, bit] of Object.entries(DB_SKILL)) PD.player.set(S.d, start, 'sk' + k, dbBits(o, bit, 1));
  DB_COM.forEach((bit, i) => PD.player.set(S.d, start, 'com' + i, dbBits(o, bit, 1)));
  PD.player.set(S.d, start, 'play_style', dbStyle(o));
}
// agrega al EDIT a jugadores de la base: solo se marca la sección Habilidad, pero el registro lleva todo lo que el juego
// lee del EDIT aunque no esté marcado (posiciones, peso, físico); si faltara, el jugador queda sin posiciones y con todo en -7
function editPlayersRegion(extra) { const n = S.d[96] | S.d[97] << 8; return [[96, 2], [0x7C, (n + extra) * 0x138]]; }
const EDIT_CAP = (0x8ED2FC - 0x7C) / 0x138; // 30.000 jugadores
function insertEditPlayers(ids) {
  const R = 0x138, n = S.d[96] | S.d[97] << 8;
  const add = [...new Set(ids)].filter(id => !S.ix.byId.has(id) && canMakeEditPlayer(id)).sort((a, b) => a - b).slice(0, Math.max(0, EDIT_CAP - n));
  if (!add.length) return [];
  // una sola pasada: los del EDIT y los nuevos, ordenados por ID como los guarda el juego
  const old = S.d.slice(0x7C, 0x7C + n * R), oid = i => (old[i * R] | old[i * R + 1] << 8 | old[i * R + 2] << 16 | old[i * R + 3] << 24) >>> 0;
  const fresh = []; let i = 0, j = 0, w = 0x7C;
  while (i < n || j < add.length) {
    if (j >= add.length || (i < n && oid(i) < add[j])) { S.d.set(old.subarray(i * R, i * R + R), w); i++; } else { S.d.fill(0, w, w + R); fresh.push([w, add[j++]]); }
    w += R;
  }
  S.d[96] = (n + add.length) & 255; S.d[97] = (n + add.length) >> 8;
  for (const [start, id] of fresh) {
    const o = DBRAW.off.get(id), set = (key, v) => PD.player.set(S.d, start, key, v);
    set('id', id); set('comm_id', id);
    for (const [key, [pos, bits, add]] of Object.entries(DB_TO_EDIT())) set(key, dbBits(o, pos, bits) + add);
    set('name', dbStr(o + 0xFB, 61)); set('shirt', dbStr(o + 0x81, 61)); set('shirt_nt', dbStr(o + 0xBE, 61)); set('height', DBRAW.b[o + 0x1B] + 100);
    setEditPositions(start, o); setEditSkills(start, o); setEditLook(start, id);
    set('e_ability', 1);
  }
  S.ix = PD.index(S.d, S.f.game);
  return add;
}
// jugadores que versiones anteriores agregaron desde la base sin posiciones, peso ni físico (en el juego, sin puestos y
// con el cuerpo en -7) y con las habilidades de arquero cruzadas. Se reconocen porque no tienen ningún puesto marcado,
// ni siquiera el suyo, algo que el juego nunca guarda; sus habilidades (y la media que se les cargó) se respetan.
const GK_FIX = { gk: 'reflex', catching: 'cover', clearing: 'gk', reflex: 'clearing', cover: 'catching' };
const noSkills = p => !pget(p, 'e_skill') && !pget(p, 'e_style') && !pget(p, 'e_com') && !pget(p, 'play_style') && Object.keys(DB_SKILL).every(k => !pget(p, 'sk' + k)) && DB_COM.every((_, i) => !pget(p, 'com' + i));
function brokenEditPlayers() {
  if (!S.d || !S.ix || !DBRAW) return [];
  return S.ix.players.filter(p => { const o = DBRAW.off.get(p.id); return o != null && POS_TO_PP.every(i => !pget(p, 'pos' + i)) && Object.values(DB_POSFLAG).some(b => dbBits(o, b, 2)); });
}
function repairEditPlayers() {
  const list = brokenEditPlayers(); if (!list.length) return 0;
  edit('Arreglar ' + list.length + ' jugadores agregados desde la base', 'players', list.map(p => [p.base, 0x138]), () => {
    for (const p of list) {
      const o = DBRAW.off.get(p.id), old = Object.fromEntries(Object.keys(GK_FIX).map(k => [k, pget(p, k)]));
      for (const [k, from] of Object.entries(GK_FIX)) PD.player.set(S.d, p.base, k, old[from]);
      setEditPositions(p.base, o);
      PD.player.set(S.d, p.base, 'strong_foot', dbBits(o, 514, 1));
      if (!pget(p, 'weight')) PD.player.set(S.d, p.base, 'weight', dbBits(o, 256, 7) + 30);
      if (BODY.every(([k]) => !pget(p, k))) setEditLook(p.base, p.id);
      if (noSkills(p)) setEditSkills(p.base, o);
    }
  });
  RATE_GEN++;
  toast(list.length === 1 ? `Arreglé a ${playerName(list[0].id) || 'un jugador'}: se había agregado desde la base sin posiciones ni físico. Guardá el EDIT para llevarlo al juego.` : `Arreglé ${list.length} jugadores que se habían agregado desde la base sin posiciones ni físico. Guardá el EDIT para llevarlo al juego.`, 9000, ['Deshacer', undo]);
  return list.length;
}
// "Volver a la base del juego": saca jugadores del EDIT y el juego vuelve a usar los de su base. Solo para jugadores que
// están en la base (uno creado en el EDIT se perdería). Se puede deshacer.
function removeEditPlayers(ids) {
  const out = new Set(ids), n = S.d[96] | S.d[97] << 8, R = 0x138; let w = 0;
  for (let k = 0; k < n; k++) {
    const o = 0x7C + k * R, id = (S.d[o] | S.d[o + 1] << 8 | S.d[o + 2] << 16 | S.d[o + 3] << 24) >>> 0;
    if (out.has(id)) continue;
    if (w !== k) S.d.copyWithin(0x7C + w * R, o, o + R);
    w++;
  }
  S.d.fill(0, 0x7C + w * R, 0x7C + n * R); S.d[96] = w & 255; S.d[97] = w >> 8;
  return n - w;
}
const canBackToDb = id => !!(S.ix && S.ix.byId.has(id) && DBRAW && DBRAW.off.has(id));
// los que cambió la media por rendimiento y siguen en el EDIT
const formEditIds = () => typeof APPLIED === 'undefined' ? [] : [...APPLIED.keys()].filter(canBackToDb);
function backToDb(ids) {
  ids = ids.filter(canBackToDb); if (!ids.length) return 0;
  const one = ids.length === 1, nm = one ? playerName(ids[0]) || 'ID ' + ids[0] : '';
  edit(one ? 'Volver a la base del juego: ' + nm : 'Volver a la base del juego (' + ids.length + ' jugadores)', 'players', editPlayersRegion(0), () => removeEditPlayers(ids));
  S.hist[S.hp - 1] && (S.hist[S.hp - 1].reindex = true); S.ix = PD.index(S.d, S.f.game); rebuildTeamOf();
  if (typeof APPLIED !== 'undefined') { ids.forEach(id => APPLIED.delete(id)); saveApplied(); }
  if (ids.includes(S.player)) S.player = S.ix.players.length ? S.ix.players[0].id : null;
  RATE_GEN++;
  toast(one ? `${nm} volvió a la base del juego: el juego lo usa como venía. Guardá el EDIT para llevarlo al juego.` : `${ids.length} jugadores volvieron a la base del juego. Guardá el EDIT para llevarlo al juego.`, 7000, ['Deshacer', undo]);
  return ids.length;
}
// "Pasar toda la base al EDIT": todos los jugadores de la base, con todos sus datos, para que el juego los cargue desde el
// EDIT. Se recuerda qué jugadores se pasaron, cómo quedaron (una huella de cada registro) y qué base se usó: si la base
// del juego cambia (una actualización o un mod), el editor avisa que hay que volver a pasarla.
const ALLDB_LS = 'edit21-alldb';
const fnv = (b, o, l) => { let h = 0x811c9dc5; for (let i = o; i < o + l; i++) h = Math.imul(h ^ b[i], 0x01000193); return h >>> 0; };
const recHash = id => { const p = S.ix.byId.get(id); return p ? fnv(S.d, p.base, 0x138) : 0; };
let ALLDB_C;
function allDbLoad() { if (ALLDB_C !== undefined) return ALLDB_C; return ALLDB_C = allDbRead(); }
function allDbRead() { try { const j = JSON.parse(localStorage.getItem(ALLDB_LS) || 'null'); if (!j || !j.list) return null; const m = new Map(); for (const x of j.list.split(',')) { const [a, b] = x.split(':'); m.set(parseInt(a, 36), parseInt(b, 36)); } return { sig: j.sig, at: j.at, m }; } catch { return null; } }
function allDbSave(sig, ids, keep = new Map()) { ALLDB_C = undefined; try { const l = ids.filter(id => !keep.has(id)).map(id => [id, recHash(id)]).concat([...keep]); localStorage.setItem(ALLDB_LS, JSON.stringify({ sig, at: Date.now(), list: l.map(([id, h]) => id.toString(36) + ':' + h.toString(36)).join(',') })); } catch { } }
function allDbForget() { ALLDB_C = undefined; try { localStorage.removeItem(ALLDB_LS); } catch { } }
// los que se pasaron con "Pasar toda la base" y siguen en este EDIT
function allDbIds() { const r = allDbLoad(); return r && S.ix ? [...r.m.keys()].filter(id => S.ix.byId.has(id)) : []; }
const dbAllCandidates = () => DBRAW ? [...DBRAW.off.keys()].filter(id => id && !S.ix.byId.has(id) && dbStr(DBRAW.off.get(id) + 0xFB, 61)) : [];
function dbToEditAll() {
  const ids = dbAllCandidates(), n = S.d[96] | S.d[97] << 8, room = EDIT_CAP - n;
  if (!ids.length) { toast('Todos los jugadores de la base ya están en tu EDIT.'); return 0; }
  const prev = allDbIds(), take = Math.min(ids.length, room);
  edit('Pasar toda la base al EDIT (' + take.toLocaleString('es-AR') + ' jugadores)', 'players', editPlayersRegion(take), () => insertEditPlayers(ids));
  S.hist[S.hp - 1] && (S.hist[S.hp - 1].reindex = true); rebuildTeamOf();
  const made = ids.slice().sort((a, b) => a - b).slice(0, take).filter(id => S.ix.byId.has(id));
  allDbSave(DBSIG, [...new Set([...prev, ...made])]); S.dbChanged = false;
  RATE_GEN++;
  toast(`${made.length.toLocaleString('es-AR')} jugadores de la base pasaron a tu EDIT con todos sus datos.${ids.length > take ? ` No entraron ${(ids.length - take).toLocaleString('es-AR')}: el EDIT admite ${EDIT_CAP.toLocaleString('es-AR')} jugadores.` : ''} Guardá el EDIT para llevarlo al juego.`, 9000, ['Deshacer', undo]);
  return made.length;
}
function allBackToDb() {
  const ids = allDbIds(); if (!ids.length) return 0;
  const n = backToDb(ids); if (n) allDbForget(); return n;
}
// la base del juego cambió desde que se pasó: se vuelven a pasar los que no tocaste; los que cambiaste quedan como están
function allDbChangedIds() {
  const r = allDbLoad(); if (!r || !S.ix) return { same: [], mine: [] };
  const same = [], mine = [];
  for (const [id, h] of r.m) { if (!S.ix.byId.has(id)) continue; (recHash(id) === h ? same : mine).push(id); }
  return { same, mine };
}
function checkDbChanged(quiet) {
  const r = allDbLoad(); S.dbChanged = false;
  if (!r || !DBSIG || r.sig === DBSIG || !S.ix) return false;
  const here = allDbIds().length; if (here < r.m.size / 2) return false; // es otro EDIT
  S.dbChanged = true;
  if (!quiet) toast('⚠ La base del juego cambió (una actualización o un mod) desde que pasaste todos los jugadores al EDIT. Volvé a pasarla para que el juego use los datos nuevos: Jugadores → "Volver a pasar la base".', 12000);
  return true;
}
function dbResync() {
  const r = allDbLoad(), { same, mine } = allDbChangedIds(); let made = [];
  edit('Volver a pasar la base al EDIT', 'players', [[96, 2], [0x7C, EDIT_CAP * 0x138]], () => { removeEditPlayers(same); S.ix = PD.index(S.d, S.f.game); made = insertEditPlayers(dbAllCandidates()); });
  S.hist[S.hp - 1] && (S.hist[S.hp - 1].reindex = true); rebuildTeamOf();
  allDbSave(DBSIG, made, new Map(mine.map(id => [id, r.m.get(id)]))); S.dbChanged = false;
  RATE_GEN++;
  toast(`Listo: ${made.length.toLocaleString('es-AR')} jugadores con los datos nuevos de la base.${mine.length ? ` Los ${mine.length.toLocaleString('es-AR')} que cambiaste vos quedaron como estaban.` : ''} Guardá el EDIT para llevarlo al juego.`, 9000, ['Deshacer', undo]);
  return made.length;
}
// después de leer la base: el físico (PlayerAppearance.bin) y el arreglo de los jugadores agregados con datos vacíos
async function dbAfterLoad(st) {
  try { const a = typeof sdbAppearanceBin === 'function' ? await sdbAppearanceBin(st) : null; if (a) await appearanceFromBin(a); } catch { }
  if (!S.d) return;
  const fixed = repairEditPlayers();
  if (checkDbChanged(fixed) || fixed) render();
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
    const r = pos <= 12 ? Math.round(posFormula(pos, ab, true)) : 0;
    out.set(id, { name, pos: pos <= 12 ? pos : null, r, h: b[o + 0x1B] + 100, a: bitsAt(o, 408, 6) + 15, n: bitsAt(o, 233, 9) });
  }
  DBSIG = fnv(b, 0, b.length).toString(36) + '-' + (b.length / 0x138);
  DBRAW = { b, off: new Map([...Array(b.length / 0x138).keys()].map(i => [(b[i * 0x138 + 8] | b[i * 0x138 + 9] << 8 | b[i * 0x138 + 10] << 16 | b[i * 0x138 + 11] << 24) >>> 0, i * 0x138])) };
  return out;
}
const NAMES_LS = 'edit21-names-v5';
function namesSave() { S.namesStale = false; try { localStorage.setItem(NAMES_LS, JSON.stringify({ rv: RATING_V, from: S.namesFrom, list: [...S.names].map(([id, v]) => [id, v.name, v.pos, v.r, v.a || 0, v.n || 0]) })); } catch { } }
function namesLoadCache() { try { const j = JSON.parse(localStorage.getItem(NAMES_LS) || 'null'); if (j) { S.names = new Map(j.list.map(([id, n, pos, r, a, nat]) => [id, { name: n, pos: pos ?? null, r: r || 0, a: a || 0, n: nat || 0 }])); S.namesFrom = j.from; S.namesStale = j.rv !== RATING_V; } } catch { } }
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
// botón "Buscar EDIT": los EDIT encontrados, buscar de nuevo, elegir la carpeta o abrir el archivo a mano
async function editFinder() {
  const list = PESLOC.edits || [];
  ksModal('Buscar EDIT o cambiar de juego', `<h4 class="efh">🔁 Juego</h4>${await gameSwitchHtml()}<h4 class="efh">📂 EDIT</h4>${list.length ? `<p class="note">EDIT encontrados (el juego usa el que guardó por última vez):</p>
    <div class="pesedits">${list.map((e, i) => `<div class="pesedit ${PESLOC.chosen === e ? 'on' : ''}"><b>${esc(e.kind)}</b><span class="mono">${esc(e.path)}\\EDIT00000000</span><small>${new Date(e.mtime).toLocaleString('es-AR')} · ${(e.size / 1048576).toFixed(1).replace('.', ',')} MB</small>${PESLOC.chosen === e ? '<span class="chip ok">Abierto</span>' : `<button class="btn small" type="button" data-fe="${i}">Abrir este</button>`}</div>`).join('')}</div>` : '<p class="note">Todavía no hay una carpeta del juego conectada.</p>'}
    <div class="col" style="display:grid;gap:8px;margin-top:10px">
      <button class="btn" type="button" data-fa="again">🔎 Buscar de nuevo${PESLOC.root ? ' en ' + esc(PESLOC.root.name) : ''}</button>
      <button class="btn" type="button" data-fa="folder">📁 Elegir la carpeta del EDIT…</button>
      <button class="btn ghost" type="button" data-fa="file">📄 Abrir el archivo a mano (se guarda como copia)</button>
    </div>
    <p class="note">PES 2021 de Steam: Documentos\\KONAMI\\eFootball PES 2021 SEASON UPDATE\\&lt;número&gt;\\drmp. Football Life: la misma carpeta, en <b>2026\\save</b>. Podés elegir Documentos o directo la carpeta donde está el EDIT00000000.</p>`,
    (box, close) => {
      bindGameSwitch(box, close);
      box.querySelectorAll('[data-fe]').forEach(b => b.onclick = () => { close(); pesSwitch(+b.dataset.fe); });
      box.querySelector('[data-fa="again"]').onclick = async () => {
        close(); if (pending() && !await confirmBox('Tenés cambios sin guardar. ¿Buscar el EDIT de nuevo y perderlos?')) return;
        const r = PESLOC.root || await idbGet('pesDocs').catch(() => null);
        if (r) { try { if (r.queryPermission && (await r.queryPermission({ mode: 'readwrite' })) !== 'granted' && (await r.requestPermission({ mode: 'readwrite' })) !== 'granted') throw 0; return pesOpen(r); } catch { } }
        pesStart(true);
      };
      box.querySelector('[data-fa="folder"]').onclick = async () => { close(); if (pending() && !await confirmBox('Tenés cambios sin guardar. ¿Abrir otro EDIT y perderlos?')) return; if (!window.showDirectoryPicker) { $('fFile').click(); return; } pesPick(); };
      box.querySelector('[data-fa="file"]').onclick = () => { close(); $('fFile').click(); };
    });
}
// "Cambiar de juego" (en la ventana de Buscar EDIT): vuelve a leer el EDIT y la base del juego, o pasa a otro juego (por ejemplo de Football Life
// a PES 2021) con su EDIT y su carpeta Sider. La carpeta Sider de cada juego se recuerda al conectarla (sider-fl / sider-pes).
const GAME_NAME = { fl: 'Football Life', pes: 'PES 2021' };
const editGame = e => /\\2026\\/.test(e.path + '\\') ? 'fl' : 'pes';
const exeGame = x => /^FL_\d+\.exe$|football.?life/i.test(x || '') ? 'fl' : 'pes';
function baseGame() { let x = ''; try { x = localStorage.getItem('edit21-gameexe') || ''; } catch { } return x ? exeGame(x) : null; }
async function siderOk(h) { try { return !h.queryPermission || (await h.queryPermission({ mode: 'readwrite' })) === 'granted' || (await h.requestPermission({ mode: 'readwrite' })) === 'granted'; } catch { return false; } }
async function openEditEntry(e) { const file = await e.handle.getFile(); PESLOC.chosen = e; S.dir = e.dir; S.editHandle = e.handle; S.mtime = file.lastModified; openBytes(new Uint8Array(await file.arrayBuffer()), e.path + '\\EDIT00000000'); }
// el permiso o el selector de carpeta van primero, mientras dura el clic del usuario
async function gameReload(kind) {
  if (pending() && !await confirmBox('Tenés cambios sin guardar. ¿Recargar el EDIT y la base igual? Se pierden.')) return;
  const cur = PESLOC.chosen && S.editHandle === PESLOC.chosen.handle ? PESLOC.chosen : null;
  const target = kind ? PESLOC.edits.find(e => editGame(e) === kind) : cur;
  let dir = kind ? await idbGet('sider-' + kind).catch(() => null) : (FACES.dir || await idbGet('sider').catch(() => null));
  if (dir && !await siderOk(dir)) dir = null;
  if (!dir && window.showDirectoryPicker) {
    if (kind) toast(`Elegí la carpeta Sider de ${GAME_NAME[kind]} (o la carpeta del juego).`, 6000);
    try { dir = await window.showDirectoryPicker({ id: 'edit21kits', mode: 'readwrite' }); } catch (e) { if (e.name === 'AbortError') return; }
  }
  try {
    if (target) await openEditEntry(target); else if (S.editHandle) await reloadFromGame(true);
  } catch (e) { toast('No se pudo leer el EDIT: ' + e.message, 6000); return; }
  if (dir) await connectKits(dir);
  else toast('EDIT recargado. Para la base, conectá la carpeta Sider del juego.', 6000);
  render();
}
async function gameSwitchHtml() {
  const cur = PESLOC.chosen && S.editHandle === PESLOC.chosen.handle ? PESLOC.chosen : null;
  const eg = cur ? editGame(cur) : null, bg = baseGame(), sider = FACES.dir;
  const kinds = [...new Set((PESLOC.edits || []).map(editGame))].filter(k => k !== eg);
  const saved = Object.fromEntries(await Promise.all(kinds.map(async k => [k, await idbGet('sider-' + k).catch(() => null)])));
  return `<p class="note"><b>EDIT abierto:</b> ${cur ? `${GAME_NAME[eg]} · <span class="mono">${esc(cur.path)}</span>` : S.d ? '<span>un EDIT abierto como copia</span>' : '<span>ninguno</span>'}<br><b>Base del juego:</b> ${S.names.size ? `${bg ? GAME_NAME[bg] : ''}${sider ? ` · <span class="mono">${esc(sider.name)}</span>` : ''} · <span>${S.names.size.toLocaleString('es-AR')} jugadores</span>` : '<span>sin cargar</span>'}</p>
    ${eg && bg && eg !== bg ? `<div class="warnbox">El EDIT es de ${GAME_NAME[eg]} pero la base es de ${GAME_NAME[bg]}. Pasá los dos al mismo juego para que coincidan los jugadores.</div>` : ''}
    <div class="col" style="display:grid;gap:8px;margin-top:10px">
      <button class="btn primary" type="button" data-gs="">🔄 Recargar el EDIT y la base</button>
      ${kinds.map(k => `<button class="btn" type="button" data-gs="${k}">⇄ Pasar a ${GAME_NAME[k]}<small style="display:block;font-weight:normal;opacity:.8">${esc(PESLOC.edits.find(e => editGame(e) === k).path)} · ${saved[k] ? 'base de la carpeta ' + esc(saved[k].name) : 'te pide elegir su carpeta Sider'}</small></button>`).join('')}
      <button class="btn ghost" type="button" data-gs-other>📁 Usar otra carpeta Sider…</button>
    </div>
    <p class="note">Recargar vuelve a leer el EDIT y la base del juego desde sus carpetas (kits, caras y nombres incluidos), por ejemplo después de actualizar el juego o cambiar de mods. Para dejar de usar un juego, pasá al otro: se abre su EDIT y se lee su base.</p>`;
}
function bindGameSwitch(box, close) {
  box.querySelectorAll('[data-gs]').forEach(b => b.onclick = () => { close(); gameReload(b.dataset.gs || null); });
  box.querySelector('[data-gs-other]').onclick = () => { close(); connectKits(); };
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
  st.innerHTML = `${S.dir ? '' : '<span class="chip warn copy">Modo copia</span>'} ${pending() ? `<span class="chip warn">${S.savedHp < 0 ? 'Cambios' : n + ' cambio' + (n > 1 ? 's' : '')} sin guardar</span>` : '<span class="chip">Todo guardado</span>'}`;
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
  if (S.names.size && out.length < 24) { let k = 0; for (const [id, v] of S.names) { if (S.ix.byId.has(id)) continue; if (!(v.name || '').toLowerCase().includes(q) && String(id) !== q) continue; if (teamOf.has(id)) { const t = clubOf(id); out.push(['n', t.id, v.name, 'en ' + tget(t, 'name')]); } else if (v.pos != null) { const c = dbClubOf(id); out.push(['d', id, v.name, 'Base del juego · ' + POS[v.pos] + (c ? ' · ' + dbTeamName(c.tid) : '')]); } if (++k > 8) break; } }
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
  S.tab = t; for (const [id, k] of [['tTeams', 'teams'], ['tNats', 'nats'], ['tPlayers', 'players'], ['tWepes', 'wepes'], ['tSider', 'sider'], ['tFile', 'file'], ['tNews', 'news'], ['tIdeas', 'ideas']]) $(id).setAttribute('aria-selected', String(k === t)); same ? render() : leave(S.f && $('main'), render);
}
function render() {
  const m = $('main');
  if (typeof ksFab === 'function') ksFab(m); // el botón flotante de Kit Studio solo con el editor de kits a la vista
  if (!S.f && S.tab === 'wepes') { renderWepes(m); return; }
  if (S.tab === 'news') { renderNews(m); return; }
  if (S.tab === 'ideas') { renderIdeas(m); return; }
  if (S.tab === 'sider') { renderSider(m); return; }
  if (!S.f) { m.innerHTML = welcome(); const w = $('wFind'); if (w) w.onclick = () => pesStart(); return; }
  if (S.tab === 'teams' || S.tab === 'nats') renderTeams(m); else if (S.tab === 'players') renderPlayers(m); else if (S.tab === 'wepes') renderWepes(m); else renderFile(m);
}
function welcome() {
  return `<section class="hero">
    <h1>Editá tu EDIT sin perder los cambios</h1>
    <p>El editor busca solo el archivo EDIT00000000 en <code>Documentos\\KONAMI\\eFootball PES 2021 SEASON UPDATE</code> (primero el del juego, en <code>drmp</code>; si no, el de <code>save</code>) y también la carpeta WEPES. Guarda en el mismo lugar, con la firma de tu PC y un respaldo antes del primer guardado de cada sesión.</p>
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
    if (S.tLeague && S.tab !== 'nats' && !teamInLeague(t, S.tLeague)) return false;
    return !q || normName(tget(t, 'name')).toLowerCase().includes(q) || tget(t, 'short').toLowerCase().includes(q) || String(t.id) === q;
  });
  const by = {
    name: (a, b) => { const na = nmOf(a), nb = nmOf(b); return (!na - !nb) || COLL.compare(na, nb); },
    id: (a, b) => a.id - b.id,
    rating: (a, b) => ((teamRating(b) || {}).score || 0) - ((teamRating(a) || {}).score || 0),
    value: (a, b) => ((teamRating(b) || {}).value || 0) - ((teamRating(a) || {}).value || 0),
    count: (a, b) => PD.roster(S.d, b).length - PD.roster(S.d, a).length,
    country: (a, b) => COLL.compare(COUNTRY.get(tget(a, 'country')) || '~', COUNTRY.get(tget(b, 'country')) || '~') || COLL.compare(nmOf(a), nmOf(b)),
  }[S.tSort] || null;
  return by ? list.sort(by) : list;
}
// filtro de liga o país del panel de equipos: 'l:ENG/A' (liga, con la carpeta Sider) o 'c:204' (país del club)
const teamInLeague = (t, v) => v[0] === 'l' ? leagueOf(t) === v.slice(2) : String(tget(t, 'country')) === v.slice(2);
function leagueOptions() {
  if (S.tab === 'nats') return '';
  const lg = new Map(), ct = new Map();
  for (const t of S.ix.teams) {
    if (isNat(t) || (!S.showEmpty && !PD.roster(S.d, t).length)) continue;
    const l = leagueOf(t); if (l) lg.set(l, (lg.get(l) || 0) + 1);
    const c = tget(t, 'country'); if (COUNTRY.has(c)) ct.set(c, (ct.get(c) || 0) + 1);
  }
  const opt = (v, n, k) => `<option value="${v}" ${S.tLeague === v ? 'selected' : ''}>${esc(n)} (${k})</option>`;
  const ls = [...lg].map(([l, k]) => [l, LEAGUE_NAME[l] || l, k]).sort((a, b) => COLL.compare(a[1], b[1]));
  const cs = [...ct].map(([c, k]) => [c, COUNTRY.get(c), k]).sort((a, b) => COLL.compare(a[1], b[1]));
  return `<div class="row tleague"><label class="lab" for="tLeague">Liga o país</label><select id="tLeague"><option value="">Todas las ligas y países</option>${ls.length ? `<optgroup label="Ligas">${ls.map(([l, n, k]) => opt('l:' + l, n, k)).join('')}</optgroup>` : ''}<optgroup label="Países">${cs.map(([c, n, k]) => opt('c:' + c, n, k)).join('')}</optgroup></select></div>`;
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
        <div class="tfrow"><div class="fchips" id="tFilter">${[['all', S.tab === 'nats' ? 'Todas' : 'Todos'], ['custom', 'Editados'], ['dirty', 'Sin guardar']].map(([k, n]) => `<button type="button" data-tf="${k}" aria-pressed="${S.tFilter === k}">${n}</button>`).join('')}</div>
        <div class="tsort"><label class="lab" for="tSort">Ordenar</label><select id="tSort">${[['name', 'Nombre (A-Z)'], ['rating', 'Valoración'], ['value', 'Valor de mercado del club'], ['count', 'Cantidad de jugadores'], ...(S.tab === 'nats' ? [] : [['country', 'País']]), ['id', 'ID del juego']].map(([k, n]) => `<option value="${k}" ${S.tSort === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
        ${leagueOptions()}
        <div class="row" style="justify-content:space-between"><label class="chk"><input type="checkbox" id="showEmpty" ${S.showEmpty ? 'checked' : ''}> Incluir sin plantel</label><label class="chk" title="Si el escudo no está en las carpetas del juego, se busca por nombre en TheSportsDB y queda guardado."><input type="checkbox" id="onBadge" ${PREFS.onlineBadges ? 'checked' : ''}> Escudos de internet</label><span class="sub">${list.length} ${S.tab === 'nats' ? 'selecciones' : 'equipos'}</span></div>
      </div>
      <div class="list-body" id="teamItems">${list.map(x => { const tr = teamRating(x), n = PD.roster(S.d, x).length; return `<button class="item" data-t="${x.id}" type="button">
        ${crest(x)}<span style="min-width:0"><span class="nm">${esc(tget(x, 'name') || '(sin nombre)')}${dk.has('t' + x.id) ? '<span class="dot" title="Con cambios sin guardar"></span>' : ''}</span>
        <span class="sub2">${isNat(x) ? 'Selección' : 'Club'} · ${n} jug.${tr ? ' · ' + fmtMoney(tr.value) : ''}</span></span><span class="meta">${tr ? `<b class="${vcls(tr.score)}">${tr.score}</b>${starsHtml(tr.stars).replace('class="stars"', 'class="stars mini"')}` : `<span class="sub">ID ${x.id}</span>`}</span></button>`; }).join('') || '<div class="empty">Sin resultados.</div>'}</div>`;
  const sheetHtml = t ? teamSheet(t) : '<div class="card empty">Elegí un equipo.</div>';
  const keep = m._lh === lh && m.querySelector(':scope > .split > aside.list #teamItems') && $('teamSheet');
  if (keep) {
    const ns = document.createElement('section'); ns.className = 'sheet'; ns.id = 'teamSheet'; ns.innerHTML = sheetHtml; $('teamSheet').replaceWith(ns); ksWideApply(m);
    m.querySelectorAll('#teamItems .item.on').forEach(x => x.classList.remove('on'));
    const on = t && m.querySelector(`#teamItems [data-t="${t.id}"]`); if (on) on.classList.add('on');
    if (t) bindTeam(t, m);
    return;
  }
  m._lh = lh;
  m.innerHTML = `<div class="split wide"><aside class="list">${lh}</aside><section class="sheet" id="teamSheet">${sheetHtml}</section></div>`; ksWideApply(m);
  { const on = t && m.querySelector(`#teamItems [data-t="${t.id}"]`); if (on) on.classList.add('on'); }
  $('qTeam').oninput = e => { S.qTeam = e.target.value; const pos = e.target.selectionStart; flipRender(m, () => renderTeams(m)); const el = $('qTeam'); el.focus(); el.setSelectionRange(pos, pos); el.classList.add('kick'); };
  $('showEmpty').onchange = e => { S.showEmpty = e.target.checked; later(() => renderTeams(m)); };
  $('onBadge').onchange = e => { PREFS.onlineBadges = e.target.checked; savePrefs(); later(() => renderTeams(m)); };
  $('tSort').onchange = e => { S.tSort = e.target.value; later(() => { flipRender(m, () => renderTeams(m)); const sel = $('tSort'); sel && sel.classList.add('kick'); }); };
  { const lg = $('tLeague'); if (lg) lg.onchange = e => { S.tLeague = e.target.value; later(() => { flipRender(m, () => renderTeams(m)); const sel = $('tLeague'); sel && sel.classList.add('kick'); }); }; }
  $('tFilter').onclick = e => { const b = e.target.closest('[data-tf]'); if (b) { S.tFilter = b.dataset.tf; renderTeams(m); } };
  $('teamItems').onclick = e => { const b = e.target.closest('[data-t]'); if (b && +b.dataset.t !== S.team) { S.team = +b.dataset.t; S.fsel = null; S.fbench = null; S.fmulti = []; m.querySelectorAll('.item.on').forEach(x => x.classList.remove('on')); b.classList.add('on'); leave($('teamSheet'), () => renderTeams(m)); } };
  if (t) bindTeam(t, m);
}
function teamSheet(t) {
  const r = PD.roster(S.d, t);
  const tabs = [...(isNat(t) ? [['call', 'Convocatoria']] : []), ['roster', 'Plantel'], ['tactics', 'Formación'], ['data', 'Datos y colores'], ['kits', 'Kit Studio Pro'], ['stadium', 'Estadio, rivales y banderas']];
  if (S.ttab === 'call' && !isNat(t)) S.ttab = 'roster';
  FACE_CTX.nat = isNat(t);
  const coach = tget(t, 'manager_id');
  return `<div class="card tcard" style="--t1:${teamColor(t, 1)};--t2:${teamColor(t, 2)}">
    <div class="head">${crest(t, '', true)}${shirtSvg(kitFor(t, false), '2.6em')}<div style="min-width:0"><h2>${esc(tget(t, 'name'))}</h2>
      <div class="sub">ID ${t.id} · ${isNat(t) ? 'Selección' : 'Club'} · ${r.length}/40 jugadores${(() => { const tr = teamRating(t), l = leagueOf(t); return (l ? ' · ' + esc(LEAGUE_NAME[l] || l) : '') + (tr ? ' · valor ' + fmtMoney(tr.value) : ''); })()} · DT ${esc(COACH.get(coach) || 'ID ' + coach)} · <span class="thstad" data-stad="${t.id}">🏟️ ${stadLabel(t)}</span></div></div></div>
    <div class="subtabs" role="tablist">${tabs.map(([k, n]) => `<button type="button" role="tab" data-ttab="${k}" aria-selected="${S.ttab === k}">${n}</button>`).join('')}</div>
  </div>
  ${S.ttab === 'kits' ? kitStudioCard(t) : S.ttab === 'call' ? callCard(t) : S.ttab === 'roster' ? dbRosterCard(t) + rosterCard(t) + squadCard(t) : S.ttab === 'tactics' ? tacticsCard(t) : S.ttab === 'data' ? teamDataCard(t) + crestCard(t) : stadiumCard(t)}
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
      <div class="f"><label for="tCoach">Entrenador</label><select id="tCoach">${COACH.has(coach) ? '' : `<option value="${coach}" selected>ID ${coach} (del juego)</option>`}${[...COACH].sort((a, b) => a[1].localeCompare(b[1])).map(([id, n]) => `<option value="${id}" ${id === coach ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
    </div>
    <h3>Kits</h3>${kitStrip(t)}
    ${KITS.map.has(t.id) ? '<div class="row"><button class="btn small" type="button" id="tUseKit">Usar los colores del kit local como colores del equipo</button></div>' : ''}
    <label class="lock ${tget(t, 'e_name') ? '' : 'off'}"><input type="checkbox" id="tLock" ${tget(t, 'e_name') ? 'checked' : ''}>
      <div><b>Proteger nombre y abreviatura</b><span>El juego mantiene tu nombre aunque el juego traiga otro. Se activa solo al cambiarlo.</span></div></label>
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
// (con la carpeta Sider es la bandera del juego; si no, sus colores). Código de país del juego → código ISO de la bandera.
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
// plantel según la base del juego para equipos que en tu EDIT están vacíos
function dbRosterCard(t) {
  if (typeof sdbRoster !== 'function' || PD.roster(S.d, t).length) return '';
  const db = sdbRoster(t); if (!db || !db.length) return '';
  const can = t.rosterBase != null;
  return `<section class="card"><h3>Plantel según la base del juego</h3><p class="note">En tu EDIT este equipo está vacío. Esto es lo que trae el juego para él (${db.length} jugadores). ${can ? 'Podés copiarlo a tu EDIT para editarlo, o tocar un jugador para abrirlo.' : 'Tocá un jugador para abrirlo.'}</p>
    <div class="dbroster">${db.map(x => { const i = pInfo(x.pid), n = playerName(x.pid) || 'ID ' + x.pid; return `<button type="button" class="dbp" data-dbp="${x.pid}"><b class="num">${x.num || '–'}</b>${faceHtml(x.pid, kitFor(t, i && i.pos === 0), 'pl')}<span class="pn">${esc(n)}</span>${i ? posBadge(i.pos) : ''}<span class="mono">${i && i.r ? i.r : ''}</span></button>`; }).join('')}</div>
    ${can ? `<div class="row"><button class="btn primary" type="button" data-dbuse="${t.id}">Copiar este plantel a mi EDIT (${Math.min(40, db.length)} jugadores)</button><span class="note">Los que no estén en tu EDIT se agregan con sus habilidades; cara y nombre siguen saliendo del juego.</span></div>` : ''}</section>`;
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
  const lockIco = p => `<span class="lockico" title="${esc(lockWord(p).slice(3))}: el juego puede pisar sus datos">${LOCK_SVG}</span>`;
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
          <td class="mono c-val">${i && i.r ? `<button type="button" class="qeval" data-qe="${w.pid}" title="Editar la media" aria-label="Editar la media de ${esc(w.name || 'este jugador')}"><b class="${vcls(i.r)}">${i.r}</b><i class="qepen" aria-hidden="true">✎</i></button>${adjHtml(i.adj, i.form)}` : ''}</td>
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
  $('rsum').innerHTML = `<span>${n === tot ? `<b>${n}</b> jugadores` : `Mostrando <b>${n}</b> de ${tot}`}</span>${nr ? `<span>Media <b class="${vcls(Math.round(sr / nr))}">${f1(sr / nr)}</b></span>` : ''}${na ? `<span>Edad <b>${f1(sa / na)}</b></span>` : ''}${nh ? `<span>Altura <b>${Math.round(sh / nh)} cm</b></span>` : ''}${mv ? `<span>Valor <b>${fmtMoney(mv)}</b></span>` : ''}${nr || na || nh ? `<span class="rsumnote">Media, edad y altura son promedios de ${n === tot ? 'todo el plantel' : 'los jugadores que se ven'}${mv ? '; el valor es la suma de todos' : ''}.</span>` : ''}`;
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
  const cols = [['xi', 'XI', w => w.xiLabel], ['num', 'Dorsal', w => w.num], ['player', 'Nombre del jugador', w => w.name], ['id', 'ID', w => w.pid], ['pos', 'Posición', w => posCode(w.pos) || ''], ['val', 'Valoración', w => w.r || ''],
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
  sh.querySelectorAll('[data-ttab]').forEach(b => b.onclick = () => { if (S.ttab === b.dataset.ttab) return; S.ttab = b.dataset.ttab; S.fsel = null; S.fmulti = []; const rest = [...sh.children].slice(1); if (ANIM.reduce.matches || !rest.length) { renderTeams(m); return; } rest.forEach(c => c.classList.add('leave')); setTimeout(() => renderTeams(m), 130); });
  if (S.ttab === 'tactics') { bindTactics(t, m); return; }
  if (S.ttab === 'data') {
    $('tName').onchange = e => { setT(t, [['name', e.target.value], ['e_name', 1]], 'Nombre de ' + tn()); rer(); };
    $('tShort').onchange = e => { setT(t, [['short', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3)], ['e_name', 1]], 'Abreviatura de ' + tn()); rer(); };
    $('tLock').onchange = e => { setT(t, [['e_name', e.target.checked ? 1 : 0]], 'Protección de nombre de ' + tn()); rer(); };
    const col = (n, v) => { const h = v.slice(1); setT(t, [[`c${n}r`, c6(h.slice(0, 2))], [`c${n}g`, c6(h.slice(2, 4))], [`c${n}b`, c6(h.slice(4, 6))]], 'Colores de ' + tn()); rer(); };
    $('tC1').onchange = e => col(1, e.target.value); $('tC2').onchange = e => col(2, e.target.value);
    bindCrest(t);
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
    if (b.dataset.qe != null) { e.stopPropagation(); quickEdit(+b.dataset.qe); return; }
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
// ---- jugadores de la base del juego (Player.bin copiado por el módulo de Sider) ----
async function addDbPlayer(pid, ask) {
  if (ask && !await confirmBox(`${playerName(pid) || 'ID ' + pid} está en la base del juego pero no en tu EDIT. ¿Agregarlo a tu EDIT con sus habilidades para poder editarlo? (cara, nombre y lo demás siguen saliendo del juego)`)) return false;
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
// se guarda por jugador: la búsqueda lo pide para miles de jugadores en cada tecla
const DBCLUBOF = { k: '', ix: null, map: new Map() };
const dbClubOf = pid => {
  const cl = dbClubs(pid);
  if (DBCLUBOF.k !== DBCLUB.key || DBCLUBOF.ix !== S.ix) { DBCLUBOF.k = DBCLUB.key; DBCLUBOF.ix = S.ix; DBCLUBOF.map = new Map(); }
  if (DBCLUBOF.map.has(pid)) return DBCLUBOF.map.get(pid);
  const c = cl.find(c => !(S.ix && S.ix.teamById.get(c.tid) && typeof isNat === 'function' && isNat(S.ix.teamById.get(c.tid)))) || cl[0] || null;
  DBCLUBOF.map.set(pid, c); return c;
};
function dbPlayerCount() { return DBRAW ? DBRAW.off.size : [...S.names.values()].filter(n => n.pos != null).length; }
// la lista filtrada y ordenada se recuerda hasta que cambie la búsqueda, el filtro o la base (antes se rehacía en cada clic)
const DBLIST = { key: '', names: null, raw: null, ix: null, list: [] };
function dbPlayerList() {
  dbClubs(0); // pone al día DBCLUB.key (equipos de la base)
  const q = S.qPlayer.trim().toLowerCase(), key = [q, S.pFilter, S.names.size, RATE_GEN, DBCLUB.key].join('|');
  if (DBLIST.key === key && DBLIST.names === S.names && DBLIST.raw === DBRAW && DBLIST.ix === S.ix) return DBLIST.list;
  const ids = DBRAW ? DBRAW.off.keys() : S.names.keys(), tn = new Map(), teamLc = tid => { let v = tn.get(tid); if (v == null) tn.set(tid, v = dbTeamName(tid).toLowerCase()); return v; };
  const out = [];
  for (const id of ids) {
    const n = S.names.get(id); if (!n) continue;
    if (S.pFilter === 'unlocked') { if (S.ix.byId.has(id)) continue; }
    else if (S.pFilter !== 'all' && POS_GRP[n.pos] !== S.pFilter) continue;
    if (q) { if (!((n.name || '').toLowerCase().includes(q) || String(id) === q)) { const c = dbClubOf(id); if (!c || !teamLc(c.tid).includes(q)) continue; } }
    out.push([id, n.r || 0]);
  }
  out.sort((a, b) => (b[1] - a[1]) || a[0] - b[0]);
  Object.assign(DBLIST, { key, names: S.names, raw: DBRAW, ix: S.ix, list: out.map(x => x[0]) });
  return DBLIST.list;
}
function dbVal(id, key) { const o = DBRAW && DBRAW.off.get(id); if (o == null) return null; const m = DB_TO_EDIT()[key]; return m ? dbBits(o, m[0], m[1]) + m[2] : null; }
const dbIsNat = tid => { const t = S.ix.teamById.get(tid); return t ? isNat(t) : tid < 100 || COUNTRY_NAMES.has(normName(dbTeamName(tid))); };
function dbPlayerSheet(id) {
  const n = S.names.get(id) || {}, o = DBRAW && DBRAW.off.get(id), cl = dbClubs(id), c0 = dbClubOf(id), ct = c0 && S.ix.teamById.get(c0.tid), inEdit = S.ix.byId.has(id);
  const pos = o != null ? dbVal(id, 'reg_pos') : n.pos, age = o != null ? dbVal(id, 'age') : n.a, nat = o != null ? dbVal(id, 'nation') : n.nat, h = o != null ? DBRAW.b[o + 0x1B] + 100 : null, w = o != null ? dbWeight(id) : null, shirt = o != null ? dbStr(o + 0x81, 61) : '', shirtNt = o != null ? dbStr(o + 0xBE, 61) : '';
  const kit = ct ? kitFor(ct, pos === 0) : null, r = n.r || 0, [fn0, ln0] = splitName(playerName(id));
  const abil = o != null ? `<div class="card"><h3>Habilidades en la base del juego</h3>${hexaRo(k => dbVal(id, k), pos)}<div class="groups">${ABIL_GROUPS.map(([gn, list]) => `<div class="group"><h4>${gn}</h4>${list.map(([k, nm]) => { const v = dbVal(id, k); return v == null ? '' : `<div class="ab ro abt" data-t="${abT(v)}"><div class="l"><span>${nm}</span><i class="abbar"><b style="width:${Math.round((v - 40) / 59 * 100)}%"></b></i></div><b class="abv ${vcls(v)}">${v}</b></div>`; }).join('')}</div>`).join('')}</div>
    <div class="grid" style="margin-top:12px">${[['Uso de pierna mala', 'weak_use', 1], ['Precisión de pierna mala', 'weak_acc', 1], ['Estado de forma', 'form', 1], ['Resistencia a lesiones', 'injury', 0]].map(([l, k, add]) => { const v = dbVal(id, k); return v == null ? '' : `<div class="f"><span class="lab">${l}</span><b>${k === 'injury' ? ['C', 'B', 'A'][v] || v : v + add}</b></div>`; }).join('')}</div></div>` : '<div class="card"><p class="note">Las habilidades se ven cuando la copia de Player.bin está en la carpeta Sider.</p></div>';
  return `<div class="card dbsheet">
    <div class="head">${posBadge(pos)}<span class="dbface">${faceHtml(id, kit, 'pl')}</span><div style="min-width:0"><h2>${esc(playerName(id) || 'ID ' + id)}</h2>
      <div class="sub">${shirt ? esc(shirt) + ' · ' : ''}${nat != null ? esc(COUNTRY.get(nat) || 'País ' + nat) + ' · ' : ''}${age ? age + ' años · ' : ''}${h ? h + ' cm · ' : ''}${w ? w + ' kg · ' : ''}ID ${id}</div></div>
      <div class="rating" title="Calculada como en el juego: igual en 2 de cada 3 jugadores y en el resto a 1 punto"><b class="${vcls(r)}">${r || '–'}</b><span>Valoración</span></div></div>
    <div class="idro">${[['Nombre', fn0], ['Apellido', ln0], ['Camiseta en el club', shirt], ['Camiseta en la selección', shirtNt]].map(([l, v]) => `<div><span class="lab">${l}</span><b>${esc(v || '—')}</b></div>`).join('')}</div>
    <div class="dbteams">${cl.length ? [...cl].sort((a, b) => dbIsNat(a.tid) - dbIsNat(b.tid)).map(c => `<button type="button" class="chip" data-dbteam="${c.tid}">${S.ix.teamById.get(c.tid) ? shirtSvg(kitFor(S.ix.teamById.get(c.tid), pos === 0), '1em', dbTeamName(c.tid)) + ' ' : ''}<span class="tclab">${dbIsNat(c.tid) ? 'Selección' : 'Equipo'}</span> ${esc(dbTeamName(c.tid))}${c.num ? ' · <b>' + c.num + '</b>' : ''}</button>`).join('') : '<span class="note">Sin equipo en la base</span>'}</div>
    <div class="dbnote"><span>${inEdit ? 'Este jugador también está en tu EDIT, con los datos que le cambiaste.' : 'Está en la base del juego y todavía no en tu EDIT. Lo que ves acá es lo que usa el juego; para cambiarlo, agregalo a tu EDIT: se copia con todas sus habilidades y la cara y el nombre siguen saliendo del juego.'}</span>
      ${inEdit ? `<button class="btn small" type="button" data-dbopen="${id}">Abrir en mi EDIT</button>` : `<button class="btn primary small" type="button" data-dbadd="${id}" ${canMakeEditPlayer(id) ? '' : 'disabled title="Falta la copia de Player.bin o el EDIT está lleno"'}>Agregar a mi EDIT para editarlo</button>`}</div>
  </div>${mnfCard(id, kit)}${abil}`;
}
function setPlayerCount() { if (!S.ix) return; const dn = dbPlayerCount(); $('cPlayers').textContent = dn ? (dn >= 1000 ? (dn / 1000).toFixed(1).replace('.', ',') + 'k' : dn) : S.ix.players.length; $('tPlayers').title = S.ix.players.length + ' en tu EDIT' + (dn ? ' · ' + dn.toLocaleString('es-AR') + ' en la base del juego' : ''); }
function renderPlayers(m) {
  setPlayerCount();
  FACE_CTX.nat = false;
  const dbN = dbPlayerCount();
  if (!dbN) S.pSrc = 'edit'; else if (!S.ix.players.length) S.pSrc = 'db';
  if (S.pSrc === 'db') return renderDbPlayers(m, dbN);
  if (!S.ix.players.length) {
    m.innerHTML = `<div class="hero"><h1>Todavía no hay jugadores editados</h1>
      <p>En PES 2021 el EDIT solo guarda los jugadores que fueron editados alguna vez; el resto viene de la base del juego. Para sumar uno: en el juego entrá a Editar → Jugadores, cambiale cualquier dato (por ejemplo el nombre en camiseta), guardá y salí. Después volvé a abrir la carpeta acá y vas a poder cambiarle todo.</p>
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
        <div class="seg psrc" role="tablist" aria-label="Qué jugadores ver"><button type="button" data-psrc="edit" aria-pressed="${S.pSrc === 'edit'}">Mi EDIT <b>${S.ix.players.length.toLocaleString('es-AR')}</b></button><button type="button" data-psrc="db" aria-pressed="${S.pSrc === 'db'}" ${dbN ? '' : 'disabled title="Conectá la carpeta Sider para ver la base del juego"'}>Del juego <b>${dbN ? dbN.toLocaleString('es-AR') : '–'}</b></button></div>
        <input type="search" id="qPlayer" placeholder="Filtrar por nombre, ID o equipo…" value="${esc(S.qPlayer)}" aria-label="Filtrar jugadores">
        <select id="pFilter" aria-label="Filtro">${[['all', 'Todos'], ['gk', 'Porteros'], ['df', 'Defensores'], ['mf', 'Mediocampistas'], ['fw', 'Delanteros'], ['unlocked', 'Sin proteger']].map(([k, n]) => `<option value="${k}" ${S.pFilter === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <div class="row" style="justify-content:space-between"><label class="chk"><input type="checkbox" id="autoLock" ${S.autoLock ? 'checked' : ''}> Proteger al editar</label>
        <button class="btn small" id="lockAll" type="button" ${locked === S.ix.players.length ? 'disabled' : ''}>Proteger todos (${locked}/${S.ix.players.length})</button></div>
        ${formEditIds().length ? `<button class="btn small wrapbtn" id="formToDb" type="button" title="Saca de tu EDIT a los jugadores que cambió la media por rendimiento: el juego vuelve a usarlos como venían">↩ Volver a la base los de la media (${formEditIds().length})</button>` : ''}
        ${allDbHead()}
        <p class="note" style="margin:0">${list.length > DB_LIM ? `<span>Se ven ${DB_LIM} de ${list.length.toLocaleString('es-AR')}: buscá para encontrar el resto</span>` : ''}</p>
      </div>
      <div class="list-body" id="plItems">${list.slice(0, DB_LIM).map(x => { const c = clubOf(x.id), rp = pget(x, 'reg_pos'); return `<button class="item ${p && x.id === p.id ? 'on' : ''}" data-p="${x.id}" type="button">
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
  bindAllDb(m);
  const fdb = $('formToDb'); if (fdb) fdb.onclick = async () => { const ids = formEditIds(); if (await confirmBox(`¿Volver a la base del juego a los ${ids.length} jugadores que cambió la media por rendimiento? Salen de tu EDIT y el juego los usa como venían. Se puede deshacer con Ctrl+Z.`)) { backToDb(ids); renderPlayers(m); } };
  $('lockAll').onclick = () => { const ps = S.ix.players.filter(x => !isLocked(x)); edit('Proteger todos los jugadores', 'all', ps.flatMap(regP), () => { for (const x of ps) for (const k of LOCK_FLAGS) PD.player.set(S.d, x.base, k, 1); }); toast(ps.length + ' jugadores protegidos.'); later(() => renderPlayers(m)); };
  if (p) bindPlayer(p, m);
}
// botones de "Pasar toda la base": pasar, volver y el aviso cuando la base del juego cambió
function allDbHead() {
  if (!S.ix || !DBRAW) return '';
  const done = allDbIds().length, left = dbAllCandidates().length;
  return (S.dbChanged ? `<div class="warnbox dbwarn"><b>⚠ La base del juego cambió</b> (una actualización o un mod) desde que pasaste todos los jugadores a tu EDIT, y el juego sigue usando los datos viejos del EDIT. Volvé a pasarla: los jugadores que cambiaste vos se quedan como están.<button class="btn small primary wrapbtn" id="dbResync" type="button">🔄 Volver a pasar la base</button></div>` : '')
    + (left ? `<button class="btn small wrapbtn" id="dbAll" type="button" title="Copia a tu EDIT a todos los jugadores de la base con todos sus datos, para que el juego los cargue desde el EDIT">⇪ Pasar toda la base a mi EDIT (${left.toLocaleString('es-AR')})</button>` : '')
    + (done ? `<button class="btn small wrapbtn" id="allToDb" type="button" title="Saca de tu EDIT a los jugadores que pasaste desde la base: el juego vuelve a usarlos como venían">↩ Volver a la base los que pasaste (${done.toLocaleString('es-AR')})</button>` : '');
}
function bindAllDb(m) {
  const go = (id, fn) => { const b = $(id); if (b) b.onclick = fn; };
  go('dbAll', async () => {
    const n = dbAllCandidates().length;
    if (!await confirmBox(`¿Pasar los ${n.toLocaleString('es-AR')} jugadores de la base a tu EDIT, con todos sus datos? El juego los va a cargar desde el EDIT. Si después la base del juego cambia (una actualización o un mod), hay que volver a pasarla: el editor te avisa. Se puede deshacer con Ctrl+Z.`)) return;
    dbToEditAll(); S.pSrc = 'edit'; renderPlayers(m);
  });
  go('allToDb', async () => {
    const ids = allDbIds(), { mine } = allDbChangedIds();
    if (!await confirmBox(`¿Volver a la base los ${ids.length.toLocaleString('es-AR')} jugadores que pasaste? Salen de tu EDIT y el juego los usa como venían.${mine.length ? ` ${mine.length.toLocaleString('es-AR')} tienen cambios tuyos y también se pierden.` : ''} Se puede deshacer con Ctrl+Z.`)) return;
    allBackToDb(); renderPlayers(m);
  });
  go('dbResync', () => { dbResync(); renderPlayers(m); });
}
function bindPSrc(m) { m.querySelectorAll('[data-psrc]').forEach(b => b.onclick = () => { if (S.pSrc === b.dataset.psrc) return; S.pSrc = b.dataset.psrc; later(() => renderPlayers(m)); }); }
// una fila de la lista de jugadores del juego
function dbItemHtml(id, sel) {
  const n = S.names.get(id), c = dbClubOf(id), ct = c && S.ix.teamById.get(c.tid);
  return `<button class="item ${id === sel ? 'on' : ''}" data-dbsel="${id}" type="button">
        ${posBadge(n.pos)}<span style="min-width:0"><span class="nm">${ct ? shirtSvg(kitFor(ct, n.pos === 0), '1.05em', tget(ct, 'name')) + ' ' : ''}${esc(n.name || 'ID ' + id)}${S.ix.byId.has(id) ? ' <span class="chip ok tiny" title="También está en tu EDIT">EDIT</span>' : ''}</span>
        <span class="sub2">${c ? esc(dbTeamName(c.tid)) + (c.num ? ' · ' + c.num : '') : 'Sin equipo'}${n.a ? ' · ' + n.a + ' años' : ''}</span></span><span class="meta"><b class="${vcls(n.r)}">${n.r || '–'}</b></span></button>`;
}
const DB_LIM = 250;
function dbCountNote(all) { return `${all.length.toLocaleString('es-AR')} jugador${all.length === 1 ? '' : 'es'}${all.length > DB_LIM ? `<span> · se ven los ${DB_LIM} de mejor valoración: buscá para encontrar el resto</span>` : ''}`; } // en su propio span para que la traducción lo reconozca
// cambia solo la ficha de la derecha. Antes la ficha quedaba con la animación de salida puesta (invisible y sin
// responder a clics) desde el segundo jugador elegido, y había que salir de la pestaña y volver para verla
function dbShowSheet(m, id) {
  const sh = m.querySelector('#plSheet'); if (!sh) return;
  leave(sh, () => {
    if (S.dbPlayer !== id || !sh.isConnected) return; // otro clic llegó antes de que termine la salida: gana el último
    sh.innerHTML = id != null ? dbPlayerSheet(id) : ''; sh.classList.remove('leave');
    if (ANIM.reduce.matches) return;
    if (document.documentElement.dataset.gfx === 'pes6') tvStatic(sh);
    cascade([...sh.querySelectorAll(':scope > .card')].slice(0, 6), 6);
  });
}
// búsqueda y filtro: se rehace solo la lista (y la ficha si cambia el primero), sin redibujar toda la pestaña
function dbRefreshList(m, anim) {
  const body = $('plItems'), note = $('dbCount'); if (!body || !note) return; // ya no está la vista del juego (cambió a Mi EDIT u otra pestaña)
  const all = dbPlayerList(), list = all.slice(0, DB_LIM);
  const first = list[0] ?? null, prev = S.dbPlayer; S.dbPlayer = first;
  body.innerHTML = list.map(id => dbItemHtml(id, first)).join('') || '<div class="empty">Sin resultados.</div>'; body.scrollTop = 0;
  note.innerHTML = dbCountNote(all);
  if (anim && !ANIM.reduce.matches) cascade([...body.querySelectorAll(':scope > .item')].slice(0, 22));
  if (first !== prev) dbShowSheet(m, first);
}
function renderDbPlayers(m, dbN) {
  FACE_CTX.nat = false;
  const all = dbPlayerList(), list = all.slice(0, DB_LIM);
  if (S.dbPlayer == null || !S.names.has(S.dbPlayer)) S.dbPlayer = list[0] ?? null;
  const sel = S.dbPlayer;
  m.innerHTML = `<div class="split">
    <aside class="list">
      <div class="list-head">
        <div class="seg psrc" role="tablist" aria-label="Qué jugadores ver"><button type="button" data-psrc="edit" aria-pressed="false" ${S.ix.players.length ? '' : 'disabled title="Todavía no hay jugadores en tu EDIT"'}>Mi EDIT <b>${S.ix.players.length.toLocaleString('es-AR')}</b></button><button type="button" data-psrc="db" aria-pressed="true">Del juego <b>${dbN.toLocaleString('es-AR')}</b></button></div>
        <input type="search" id="qPlayer" placeholder="Buscar en la base: nombre, ID o equipo…" value="${esc(S.qPlayer)}" aria-label="Buscar jugadores de la base">
        <select id="pFilter" aria-label="Filtro">${[['all', 'Todos'], ['gk', 'Porteros'], ['df', 'Defensores'], ['mf', 'Mediocampistas'], ['fw', 'Delanteros'], ['unlocked', 'Solo los que no están en mi EDIT']].map(([k, n]) => `<option value="${k}" ${S.pFilter === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <p class="note" id="dbCount" style="margin:0">${dbCountNote(all)}</p>
        ${allDbHead()}
      </div>
      <div class="list-body" id="plItems">${list.map(id => dbItemHtml(id, sel)).join('') || '<div class="empty">Sin resultados.</div>'}</div>
    </aside>
    <section class="sheet" id="plSheet">${sel != null ? dbPlayerSheet(sel) : ''}</section>
  </div>`;
  bindPSrc(m); bindAllDb(m);
  $('qPlayer').oninput = e => { S.qPlayer = e.target.value; clearTimeout(S.dbQT); S.dbQT = setTimeout(() => dbRefreshList(m, false), 180); };
  $('pFilter').onchange = e => { S.pFilter = e.target.value; dbRefreshList(m, true); };
  $('plItems').onclick = e => { const b = e.target.closest('[data-dbsel]'); if (!b || +b.dataset.dbsel === S.dbPlayer) return; S.dbPlayer = +b.dataset.dbsel; m.querySelectorAll('#plItems .item.on').forEach(x => x.classList.remove('on')); b.classList.add('on'); dbShowSheet(m, S.dbPlayer); };
  m.querySelector('#plSheet').onclick = async e => {
    const a = e.target.closest('[data-dbadd]'); if (a) { await addDbPlayer(+a.dataset.dbadd, false); return; }
    const o = e.target.closest('[data-dbopen]'); if (o) { S.player = +o.dataset.dbopen; S.pSrc = 'edit'; renderPlayers(m); return; }
    const t = e.target.closest('[data-dbteam]'); if (t) { const tid = +t.dataset.dbteam; if (S.ix.teamById.get(tid)) { S.team = tid; S.ttab = 'roster'; setTab('teams'); } else toast('Ese equipo no está en tu EDIT.'); }
  };
}
const num = (k, v, min, max, extra = '') => `<input type="number" data-k="${k}" value="${v}" min="${min}" max="${max}" ${extra}>`;
const selOpts = (arr, v) => arr.map((n, i) => `<option value="${i}" ${i === v ? 'selected' : ''}>${esc(n)}</option>`).join('');
function mapSelect(k, map, v, label) { return `<select data-k="${k}" aria-label="${label}">${map.has(v) ? '' : `<option value="${v}" selected>${v ? 'ID ' + v + ' (del juego)' : 'Ninguno / predeterminado'}</option>`}${[...map].sort((a, b) => a[1].localeCompare(b[1])).map(([id, n]) => `<option value="${id}" ${id === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`; }
function seg(k, labels, v) { return `<div class="seg" data-segk="${k}">${labels.map((n, i) => `<button type="button" data-v="${i}" aria-pressed="${i === v}">${n}</button>`).join('')}</div>`; }
function flagChips(p) { return Object.keys(FLAG_NAMES).map(k => `<span class="chip ${pget(p, k) ? 'ok' : ''}">${pget(p, k) ? '✓' : '·'} <span>${FLAG_NAMES[k]}</span></span>`).join(''); }
// marco de la foto con los colores de las posiciones que juega: cada color ocupa más o menos según el nivel
// (posición natural 3, A 2, B 1; las C no cuentan), sumado por línea (arquero, defensa, medio, delantera)
const POS_GRP_N = { gk: 'Portero', df: 'Defensa', mf: 'Mediocampo', fw: 'Delantera' };
function posFrame(p, reg) {
  const w = { gk: 0, df: 0, mf: 0, fw: 0 };
  POS.forEach((_, i) => { const v = pget(p, 'pos' + POS_TO_PP[i]); w[POS_GRP[i]] += i === reg ? 3 : v === 2 ? 2 : v === 1 ? 1 : 0; });
  const tot = Object.values(w).reduce((a, b) => a + b, 0) || 1, first = POS_GRP[reg];
  const parts = Object.keys(w).filter(k => w[k]).sort((a, b) => (b === first) - (a === first) || w[b] - w[a]);
  let at = 0; const stops = parts.map(k => { const from = at; at += w[k] / tot * 100; return `var(--pf-${k}) ${from.toFixed(1)}% ${at.toFixed(1)}%`; });
  const tip = parts.map(k => `${typeof LANG !== 'undefined' && LANG === 'en' ? { gk: 'Goalkeeper', df: 'Defence', mf: 'Midfield', fw: 'Attack' }[k] : POS_GRP_N[k]} ${Math.round(w[k] / tot * 100)}%`).join(' · ');
  return `<span class="dbface pframe" style="--pf:conic-gradient(from -90deg,${stops.join(',')})" title="Marco según dónde puede jugar: ${tip}">`;
}
function playerSheet(p) {
  const g = k => pget(p, k), reg = g('reg_pos'), tm = playerTeams(p.id);
  const tchip = (lab, { t, num }) => `<button type="button" class="chip" data-pteam="${t.id}" title="Ver el plantel">${shirtSvg(kitFor(t, reg === 0), '1em', tget(t, 'name'))} <span class="tclab">${lab}</span> ${esc(tget(t, 'name'))}${num != null ? ' · <b>' + num + '</b>' : ''}</button>`;
  if (S.ptab === 'skills') S.ptab = 'abil'; // Especiales ahora está dentro de Habilidades y skills
  const tabs = [['profile', 'Perfil'], ['pos', 'Posiciones'], ['abil', 'Habilidades y skills'], ['look', 'Apariencia'], ['face', '🙂 Miniface'], ['motion', 'Movimientos']];
  const changed = S.origData && !S.d.subarray(p.base, p.base + 0x138).every((v, i) => v === S.origData[p.base + i]);
  return `<div class="card">
    <div class="head">${(() => { const c = clubOf(p.id), alt = POS.map((_, i) => [i, g('pos' + POS_TO_PP[i])]).filter(([i, v]) => i !== reg && v > 0).sort((a, b) => b[1] - a[1]);
      return `<div class="phead">${posBadge(reg, 'phpos')}${posFrame(p, reg)}${faceHtml(p.id, c ? kitFor(c, reg === 0) : null, 'pl')}</span>${alt.length ? `<div class="phalt" title="Otras posiciones: A domina, B puede jugar">${alt.slice(0, 4).map(([i, v]) => posBadge(i, v === 2 ? 'pa' : 'pbb')).join('')}${alt.length > 4 ? `<span class="phmore">+${alt.length - 4}</span>` : ''}</div>` : ''}</div>`; })()}<div style="min-width:0"><h2>${esc(g('name') || 'ID ' + p.id)}</h2>
      <div class="sub">${esc(g('shirt'))} · ${esc(COUNTRY.get(g('nation')) || 'País ' + g('nation'))} · ${g('age')} años · ${g('height')} cm · ${g('strong_foot') ? 'zurdo' : 'diestro'} · ID ${p.id}</div>
      ${tm.clubs.length || tm.nats.length ? `<div class="dbteams hdteams">${tm.clubs.map(x => tchip('Equipo', x)).join('')}${tm.nats.map(x => tchip('Selección', x)).join('')}</div>` : ''}</div>
      <div class="rating" title="Calculada como en el juego: igual en 2 de cada 3 jugadores y en el resto a 1 punto"><b class="${vcls(rating(p))}">${rating(p)}</b><span>Valoración</span></div></div>
    <label class="lock ${isLocked(p) ? '' : 'off'}"><input type="checkbox" id="pLock" ${isLocked(p) ? 'checked' : ''}>
      <div><b>Proteger mis cambios</b><span>Marca al jugador como editado. El juego usa estos valores aunque el juego cargue otra base de datos.</span><div class="flags">${flagChips(p)}</div></div></label>
    <div class="row">${changed ? '<button class="btn small" id="pRevert" type="button">Volver al original de este jugador</button>' : ''}${canBackToDb(p.id) ? '<button class="btn small" id="pToDb" type="button" title="Lo saca de tu EDIT: el juego vuelve a usar el jugador de su base, con todo como venía">↩ Volver a la base del juego</button>' : ''}
      <select id="pCopy" style="width:auto;max-width:260px" aria-label="Copiar de otro jugador"><option value="">Copiar de otro jugador…</option>${S.ix.players.filter(x => x.id !== p.id).map(x => `<option value="${x.id}">${esc(pget(x, 'name') || x.id)}</option>`).join('')}</select>
      <select id="pCopyWhat" style="width:auto" aria-label="Qué copiar"><option value="abil">habilidades</option><option value="skills">especiales y estilos</option><option value="pos">posiciones</option><option value="look">apariencia</option><option value="motion">movimientos</option></select>
      <button class="btn small" id="pCopyBtn" type="button">Copiar</button></div>
    <div class="subtabs" role="tablist">${tabs.map(([k, n]) => `<button type="button" role="tab" data-ptab="${k}" aria-selected="${S.ptab === k}">${n}</button>`).join('')}</div>
  </div>
  ${S.ptab === 'face' ? (() => { const c = clubOf(p.id); return mnfCard(p.id, c ? kitFor(c, reg === 0) : null); })() : `<div class="card">${({ profile: tabProfile, pos: tabPos, abil: tabAbil, skills: tabSkills, look: tabLook, motion: tabMotion })[S.ptab](p)}</div>`}`;
}
// El juego guarda un solo nombre por jugador: acá se muestra en dos partes (la primera palabra es el nombre y el resto
// el apellido, así "Kevin De Bruyne" queda Kevin / De Bruyne) y al cambiar una se vuelven a juntar con un espacio.
// Un nombre de una sola palabra ("Neymar") va al apellido, que es el que se usa en la camiseta.
function splitName(s) { s = String(s || '').trim().replace(/\s+/g, ' '); const i = s.indexOf(' '); return i < 0 ? ['', s] : [s.slice(0, i), s.slice(i + 1)]; }
const joinName = (a, b) => [a, b].map(x => x.trim().replace(/\s+/g, ' ')).filter(Boolean).join(' ');
const NAME_MAX = 60, nameBytes = s => new TextEncoder().encode(s).length; // el juego guarda 60 bytes (las letras con tilde ocupan 2)
// club y selección por separado, con el dorsal que tiene en cada uno
function playerTeams(id) {
  const ts = teamOf.get(id) || [], numIn = t => { const r = PD.roster(S.d, t).find(x => x.pid === id); return r ? r.number : null; };
  const pack = t => ({ t, num: numIn(t) });
  return { clubs: ts.filter(t => !isNat(t)).map(pack), nats: ts.filter(isNat).map(pack) };
}
function teamSlot(kind, list) {
  const lab = kind === 'nat' ? 'Selección' : 'Equipo';
  if (!list.length) return `<div class="tslot tsnone"><span class="lab">${lab}</span><div class="tsrow"><span class="crest ghost"><i>–</i></span><span class="tsnm">${kind === 'nat' ? 'Sin selección' : 'Sin equipo'}</span></div></div>`;
  return `<div class="tslot"><span class="lab">${lab}</span>${list.map(({ t, num }) => `<button type="button" class="tsrow" data-pteam="${t.id}" title="Ver el plantel de ${esc(tget(t, 'name'))}">${crest(t)}<span class="tsnm">${esc(tget(t, 'name'))}</span>${num != null ? `<span class="tsnum" title="Dorsal">${num}</span>` : ''}</button>`).join('')}</div>`;
}
// estrellas (0 a 5) y actitud de juego (0 a 3): botones con color y brillo que suben con el nivel
const lvlStep = (d, v, max) => `<button type="button" class="lvstep" data-step="${d}" ${(d < 0 ? v <= 0 : v >= max) ? 'disabled' : ''} title="${d < 0 ? 'Bajar uno' : 'Subir uno'}" aria-label="${d < 0 ? 'Bajar uno' : 'Subir uno'}">${d < 0 ? '−' : '+'}</button>`;
function lvlStars(v) {
  return `<div class="lvl lvstar" data-segk="star" style="--lv:${v}" data-lv="${v}" role="group" aria-label="Estrellas" data-max="5">${lvlStep(-1, v, 5)}${[1, 2, 3, 4, 5].map(i => `<button type="button" class="lvs ${i <= v ? 'on' : ''}" data-v="${i}" aria-pressed="${i === v}" title="${i === v ? 'Tocá de nuevo para dejarlo en 0' : i + ' estrella' + (i > 1 ? 's' : '')}">★</button>`).join('')}<b class="lvnum">${v}<small>/5</small></b>${lvlStep(1, v, 5)}</div>`;
}
function lvlAttit(v) {
  return `<div class="lvl lvatt" data-segk="play_attit" style="--lv:${v}" data-lv="${v}" role="group" aria-label="Actitud de juego" data-max="3">${lvlStep(-1, v, 3)}${[1, 2, 3].map(i => `<button type="button" class="lvb ${i <= v ? 'on' : ''}" data-v="${i}" aria-pressed="${i === v}" title="${i === v ? 'Tocá de nuevo para dejarlo en 0' : 'Nivel ' + i}"><i></i></button>`).join('')}<b class="lvnum">${v}<small>/3</small></b>${lvlStep(1, v, 3)}</div>`;
}
// mayúsculas y minúsculas en el nombre: aviso de Bloq Mayús mientras se escribe (en PES 6 con la etiqueta dorada de la barra de abajo)
// y, si el nombre o el apellido quedó todo en mayúsculas, un botón para dejarlo como lo escribe el juego ("Messi", "van Dijk")
const CAPS_W = '<div class="capsw" hidden role="status"><b><i aria-hidden="true">⇪</i>Bloq Mayús</b><span>Mayúsculas activadas</span></div>';
const NM_LOW = new Set(['van', 'von', 'der', 'den', 'ter', 'da', 'das', 'do', 'dos', 'y']);
const allCaps = v => /\p{Lu}.*\p{Lu}/u.test(v) && v === v.toUpperCase() && v !== v.toLowerCase();
// "LIONEL" → "Lionel", "VAN DE BEEK" → "van de Beek" (si va después del nombre), "DE BRUYNE" → "De Bruyne", "O'NEIL" → "O'Neil"
function properCase(v, first) {
  const ws = v.toLowerCase().split(/\s+/).filter(Boolean);
  return ws.map((w, i) => ((first && i === 0) || !(NM_LOW.has(w) || (w === 'de' && ws[i - 1] === 'van'))) ? w.replace(/(^|[-'’.])(\p{L})/gu, (_, a, c) => a + c.toUpperCase()) : w).join(' ');
}
function caseHint(which, first, last) {
  const v = which === 'first' ? first : last, on = allCaps(v);
  return `<p class="casew" data-case="${which}" ${on ? '' : 'hidden'}><span>Está todo en mayúsculas.</span> <button type="button" class="btn small" data-casefix="${which}" title="Pasar a mayúsculas y minúsculas, como lo muestra el juego"><i aria-hidden="true">Aa</i> Pasar a <b data-noi18n>${on ? esc(properCase(v, which === 'first' || !first.trim())) : ''}</b></button></p>`;
}
function tabProfile(p) {
  const g = k => pget(p, k), [first, last] = splitName(g('name')), tm = playerTeams(p.id), nb = nameBytes(g('name'));
  return `<h3>Nombre</h3>
  <div class="grid idgrid">
    <div class="f capf"><label for="pFirst">Nombre</label><input type="text" id="pFirst" data-nm="first" value="${esc(first)}" maxlength="60" autocomplete="off" spellcheck="false">${CAPS_W}${caseHint('first', first, last)}</div>
    <div class="f capf"><label for="pLast">Apellido</label><input type="text" id="pLast" data-nm="last" value="${esc(last)}" maxlength="60" autocomplete="off" spellcheck="false">${CAPS_W}${caseHint('last', first, last)}</div>
    <div class="f capf"><label for="pShirt">Camiseta en el club</label><div class="inrow"><input type="text" id="pShirt" data-k="shirt" value="${esc(g('shirt'))}" maxlength="20" autocomplete="off" spellcheck="false"><button class="btn small" data-shirtlast="pShirt" type="button" title="Poner el apellido en mayúsculas en la camiseta">Usar apellido</button></div>${CAPS_W}</div>
    <div class="f capf"><label for="pShirtNt">Camiseta en la selección</label><div class="inrow"><input type="text" id="pShirtNt" data-k="shirt_nt" value="${esc(g('shirt_nt'))}" maxlength="20" autocomplete="off" spellcheck="false" placeholder="Vacío: la misma del club"><button class="btn small" data-shirtlast="pShirtNt" type="button" title="Poner el apellido en mayúsculas en la camiseta de la selección">Usar apellido</button></div>${CAPS_W}</div>
  </div>
  <p class="note fullnm">Así lo muestra el juego: <b id="pFull">${esc(g('name') || '—')}</b> <span id="pBytes" class="${nb > NAME_MAX ? 'bad' : ''}">${nb}/${NAME_MAX}</span></p>
  <h3 class="sec">Equipo y selección</h3>
  <div class="tslots">${teamSlot('club', tm.clubs)}${teamSlot('nat', tm.nats)}</div>
  <p class="note">Para cambiarlo de equipo o de dorsal, tocá el equipo y editá el plantel.</p>
  <h3 class="sec">Datos personales</h3>
  <div class="grid wide">
    <div class="f"><label>Nacionalidad</label>${mapSelect('nation', COUNTRY, g('nation'), 'Nacionalidad')}</div>
    <div class="f"><label>ID de nombre para el comentarista</label>${num('comm_id', g('comm_id'), 0, 4294967295)}</div>
  </div>
  <div class="grid">
    <div class="f"><label>Edad</label>${num('age', g('age'), 15, 50)}</div>
    <div class="f"><label>Altura (cm)</label>${num('height', g('height'), 140, 220)}</div>
    <div class="f"><label>Peso (kg)</label>${num('weight', g('weight'), 30, 150)}${!g('weight') && dbWeight(p.id) ? `<button type="button" class="btn small" data-dbweight="${dbWeight(p.id)}" title="El peso quedó en 0 al pasar el jugador al EDIT">Usar ${dbWeight(p.id)} kg (base del juego)</button>` : ''}</div>
    <div class="f"><span class="lab">Pie hábil</span>${seg('strong_foot', ['Derecho', 'Izquierdo'], g('strong_foot'))}</div>
    <div class="f"><span class="lab">Mano hábil</span>${seg('strong_hand', ['Derecha', 'Izquierda'], g('strong_hand'))}</div>
  </div>
  <h3 class="sec">Nivel</h3>
  <div class="lvls">
    <div class="f"><span class="lab">Estrellas</span>${lvlStars(g('star'))}</div>
    <div class="f"><span class="lab">Actitud de juego</span>${lvlAttit(g('play_attit'))}</div>
  </div>`;
}
function tabPos(p) {
  const g = k => pget(p, k), reg = g('reg_pos');
  return `<div class="row" style="align-items:flex-start;gap:22px">
    <div class="pitch" id="pitch" style="flex:1 1 300px">${POS.map((n, i) => { const v = g('pos' + POS_TO_PP[i]); return `<button type="button" class="pp l${v} ${i === reg ? 'reg' : ''}" data-pp="${i}" style="grid-column:${PITCH[i][0]};grid-row:${PITCH[i][1]}" title="${POS_LONG[i]}: tocá para cambiar el nivel"><b data-noi18n>${posCode(i)}</b><span>${['—', 'B', 'A'][v]}</span></button>`; }).join('')}</div>
    <div class="f" style="flex:1 1 240px;max-width:340px;gap:10px">
      <div class="f"><label>Posición natural</label><select data-k="reg_pos">${POS_LONG.map((n, i) => `<option value="${i}" ${i === reg ? 'selected' : ''}>${posCode(i)} · ${n}</option>`).join('')}</select></div>
      <p class="note">Tocá cada posición en la cancha para pasar de — (no juega) a B (puede jugar) y A (domina). La registrada queda marcada en amarillo y se pone en A sola.</p>
      <div class="row"><button class="btn small" id="ppClear" type="button">Dejar solo la registrada</button></div>
    </div></div>`;
}
// qué hace cada estadística en el juego (se muestra al tocar o pasar por el nombre)
const AB_TIP = {
  atk: 'Qué tan rápido lee el juego para atacar: se desmarca, busca el espacio y pica al vacío cuando su equipo tiene la pelota. Clave en delanteros.',
  finish: 'Precisión de los remates con el pie. Con más nivel la pelota va más cerca de donde apuntás.',
  header: 'Precisión de los cabezazos, tanto para rematar al arco como para pasarla.',
  kick_pwr: 'Fuerza con la que le pega a la pelota: remates más potentes y desde más lejos.',
  place_kick: 'Precisión en las jugadas con pelota quieta: tiros libres, córners y penales.',
  swerve: 'Cuánta comba le puede dar a la pelota en centros, pases y remates.',
  ball_ctrl: 'Calidad del primer toque y del manejo en general: recibir, girar y proteger la pelota sin perderla.',
  drib: 'Habilidad para llevar la pelota pegada al pie corriendo rápido y para encarar al rival.',
  tight_pos: 'Manejo de la pelota en espacios chicos y a poca velocidad: giros cortos y cambios de dirección con marca encima.',
  lowpass: 'Precisión de los pases por abajo, cortos y largos.',
  loftpass: 'Precisión de los pases altos, cambios de frente y centros.',
  speed: 'Velocidad máxima corriendo, con o sin la pelota.',
  exp_pwr: 'Qué tan rápido llega a su velocidad máxima en los primeros metros. Sirve para ganar el pique y arrancar desde parado.',
  body_ctrl: 'Equilibrio para no caerse ni perder la pelota en giros bruscos o cuando lo tocan.',
  phys_cont: 'Fuerza para aguantar cargas y empujones y ganar los choques cuerpo a cuerpo.',
  jump: 'Altura que alcanza al saltar. Importa en los cabezazos y en las pelotas divididas por arriba.',
  stamina: 'Cuánto aguanta corriendo durante el partido antes de cansarse. Con poca, rinde menos en el segundo tiempo.',
  def: 'Qué tan rápido reacciona cuando ataca el rival: marca, cierra espacios y se ubica para cortar pases.',
  ball_win: 'Capacidad para sacarle la pelota al rival con entradas y quites.',
  aggres: 'Qué tan encima del rival juega para presionar y disputar la pelota. Mucha también puede traer más faltas.',
  gk: 'Lectura y ubicación del arquero: qué tan rápido reacciona ante los remates y cuándo sale a cortar.',
  catching: 'Capacidad del arquero para quedarse con la pelota en las manos en vez de dar rebote.',
  clearing: 'Calidad de los despejes con los puños: qué tan lejos y hacia dónde manda la pelota.',
  reflex: 'Velocidad de reacción del arquero para atajar remates desde cerca.',
  cover: 'Cuánto del arco cubre el arquero al estirarse para llegar a los remates.',
  weak_use: 'Qué tan seguido usa la pierna menos hábil. En 1 casi nunca la usa; en 4 la usa sin problema.',
  weak_acc: 'Qué tan precisos son los pases y remates con la pierna menos hábil.',
  form: 'Qué tan parejo rinde de un partido a otro. Con más nivel su estado (las flechas) cambia menos.',
  injury: 'Qué tan difícil es que se lesione. A es la más resistente y C la más frágil.',
};
const AB_LEVEL = ['Bajo', 'Regular', 'Bueno', 'Muy bueno', 'Élite'];
// cartel con la explicación: aparece al pasar el mouse, al tocar o con el teclado
const ABTIP = { el: null, on: null };
function abTipShow(b) {
  if (!ABTIP.el) { ABTIP.el = document.createElement('div'); ABTIP.el.className = 'abtip'; ABTIP.el.setAttribute('role', 'tooltip'); ABTIP.el.id = 'abTip'; document.body.appendChild(ABTIP.el); }
  const t = ABTIP.el, lv = b.dataset.tiplv;
  t.innerHTML = `<b></b><p></p>${lv != null ? `<span class="abt" data-t="${lv}"><i></i></span>` : ''}`;
  t.querySelector('b').textContent = tr(b.dataset.tiptitle || ''); t.querySelector('p').textContent = b.getAttribute('data-tip');
  if (lv != null) t.querySelector('span').append(AB_LEVEL[lv] || '');
  ABTIP.on = b; b.setAttribute('aria-describedby', 'abTip');
  t.classList.add('on'); const r = b.getBoundingClientRect(), w = Math.min(320, innerWidth - 24); t.style.width = w + 'px';
  const h = t.offsetHeight, below = r.bottom + 8 + h < innerHeight;
  t.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.left)) + 'px'; t.style.top = (below ? r.bottom + 8 : r.top - h - 8) + 'px';
  t.classList.toggle('up', !below);
}
function abTipHide() { if (ABTIP.el) ABTIP.el.classList.remove('on'); if (ABTIP.on) ABTIP.on.removeAttribute('aria-describedby'); ABTIP.on = null; }
document.addEventListener('pointerover', e => { if (e.pointerType !== 'mouse') return; const b = e.target.closest('[data-tip]'); if (b) abTipShow(b); else if (ABTIP.on && !e.target.closest('.abtip')) abTipHide(); });
document.addEventListener('focusin', e => { const b = e.target.closest && e.target.closest('[data-tip]'); if (b) abTipShow(b); else abTipHide(); });
document.addEventListener('click', e => { const b = e.target.closest('[data-tip]'); if (b) { if (ABTIP.on === b && e.pointerType !== 'mouse') abTipHide(); else abTipShow(b); } else abTipHide(); }, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape') abTipHide(); });
addEventListener('scroll', abTipHide, true);
// botón ⓘ al lado del +: muestra qué hace la estadística
const tipBtn = (k, title, lv) => AB_TIP[k] ? `<button type="button" class="abinfo" data-tip="${esc(AB_TIP[k])}" data-tiptitle="${esc(title)}"${lv != null ? ` data-tiplv="${lv}"` : ''} title="Qué hace" aria-label="${LANG === 'en' ? 'What is ' + esc(tr(title)) : 'Qué es ' + esc(title)}">i</button>` : '';
// animaciones al subir o bajar un valor: el número salta, aparece "+1"/"−1" y la barra se desliza
const AB_ANIM_KEYS = ['star', 'play_attit', 'weak_use', 'weak_acc', 'form', 'injury'];
function bumpNum(el, d) {
  if (!el || !d || ANIM.reduce.matches) return;
  el.classList.remove('bump-up', 'bump-dn'); void el.offsetWidth; el.classList.add(d > 0 ? 'bump-up' : 'bump-dn');
  setTimeout(() => el.classList.remove('bump-up', 'bump-dn'), 700);
  const host = el.closest('.abctl'); if (!host) return;
  const c = document.createElement('span'); c.className = 'dchip ' + (d > 0 ? 'up' : 'dn'); c.textContent = (d > 0 ? '+' : '−') + Math.abs(d);
  host.appendChild(c); setTimeout(() => c.remove(), 1000);
}
function barSlide(row, from, to) {
  if (ANIM.reduce.matches) return;
  row.classList.add('anim'); row.style.setProperty('--p', abP(from));
  requestAnimationFrame(() => requestAnimationFrame(() => row.style.setProperty('--p', abP(to))));
  clearTimeout(row._at); row._at = setTimeout(() => row.classList.remove('anim'), 600);
}
function lvlAnim(lv, from, to) {
  if (ANIM.reduce.matches) return;
  bumpNum(lv.querySelector('.lvnum'), to - from);
  const zeroBased = lv.classList.contains('lvgen'), lo = Math.min(from, to), hi = Math.max(from, to);
  lv.querySelectorAll('[data-v]').forEach(b => { const i = +b.dataset.v; if (zeroBased ? i > lo && i <= hi : i > lo && i <= hi && i > 0) { b.classList.add(to > from ? 'pop' : 'drop'); setTimeout(() => b.classList.remove('pop', 'drop'), 600); } });
}
// tras dibujar la ficha: compara con lo que se veía antes y anima lo que cambió (botones −/+, todas ±1, hexágono, deshacer)
function abAnimDiff(p) {
  const sh = $('plSheet'); if (!sh) return;
  const now = new Map([...ABIL.map(a => a[0]), ...AB_ANIM_KEYS].map(k => [k, pget(p, k)]));
  const prev = S.abShown && S.abShown.id === p.id ? S.abShown.vals : null;
  S.abShown = { id: p.id, vals: now }; if (!prev) return;
  for (const [k, v] of now) {
    const o = prev.get(k); if (o == null || o === v) continue;
    const row = sh.querySelector(`.abr[data-abk="${k}"]`);
    if (row) { bumpNum(row.querySelector('input[type=number]'), v - o); barSlide(row, o, v); continue; }
    const lv = sh.querySelector(`.lvl[data-segk="${k}"]`); if (lv) lvlAnim(lv, o, v);
  }
}
// nivel de una habilidad para el color: 90+ rojo, 80+ naranja, 70+ amarillo, 60+ verde, menos gris (la escala de PES)
const abT = v => v >= 90 ? 4 : v >= 80 ? 3 : v >= 70 ? 2 : v >= 60 ? 1 : 0;
const abP = v => Math.round((v - 40) / 59 * 100) + '%';
function abAvg(p, list) { return Math.round(list.reduce((a, [k]) => a + pget(p, k), 0) / list.length); }
// una fila: nombre, barra (se arrastra) y − número +
function abRow(k, n, v) {
  return `<div class="abr abt" data-abk="${k}" data-t="${abT(v)}" style="--p:${abP(v)}"><button type="button" class="abn" data-tip="${esc(AB_TIP[k] || '')}" data-tiptitle="${n}" data-tiplv="${abT(v)}"><span>${n}</span></button>
    <input type="range" min="40" max="99" value="${v}" data-k="${k}" data-twin="1" aria-label="${n}">
    <span class="abctl"><button type="button" class="abstep" data-abstep="-1" data-k="${k}" title="Bajar uno" aria-label="Bajar uno">−</button><input type="number" min="40" max="99" value="${v}" data-k="${k}" aria-label="${n}"><button type="button" class="abstep" data-abstep="1" data-k="${k}" title="Subir uno" aria-label="Subir uno">+</button>${tipBtn(k, n, abT(v))}</span></div>`;
}
// pierna mala, forma y lesiones: barras con color como Estrellas y Actitud (acá el primer valor también es un nivel)
function lvlSeg(k, v, labels, label) {
  const n = labels.length, f = (v + 1) / n, t = f >= 1 ? 4 : f > .7 ? 3 : f > .45 ? 2 : f > .25 ? 1 : 0;
  return `<div class="lvl lvgen" data-segk="${k}" data-max="${n - 1}" data-t="${t}" role="group" aria-label="${label}">${lvlStep(-1, v, n - 1)}${labels.map((l, i) => `<button type="button" class="lvb ${i <= v ? 'on' : ''}" data-v="${i}" aria-pressed="${i === v}" title="${l}"><i></i></button>`).join('')}<b class="lvnum">${labels[v] ?? v}</b>${lvlStep(1, v, n - 1)}${tipBtn(k, label)}</div>`;
}
// ----- vista FIFA: las mismas habilidades de PES pasadas a la carta y a los atributos de FIFA (solo para ver) -----
// cada atributo FIFA sale de una o más habilidades de PES; los pesos de cada media son los de FIFA
const FIFA_POS = (typeof LANG !== 'undefined' && LANG === 'en') ? ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'LM', 'RM', 'CAM', 'LW', 'RW', 'CF', 'ST'] : ['POR', 'DFC', 'LI', 'LD', 'MCD', 'MC', 'MI', 'MD', 'MCO', 'EI', 'ED', 'SD', 'DC'];
const FIFA_ATTR = [
  ['RIT', 'Ritmo', [['Aceleración', { exp_pwr: 1 }, .45], ['Velocidad', { speed: 1 }, .55]]],
  ['TIR', 'Tiro', [['Posicionamiento', { atk: 1 }, .05], ['Definición', { finish: 1 }, .45], ['Potencia de tiro', { kick_pwr: 1 }, .2], ['Tiros lejanos', { kick_pwr: .5, finish: .5 }, .2], ['Voleas', { finish: .6, body_ctrl: .4 }, .05], ['Penaltis', { place_kick: 1 }, .05]]],
  ['PAS', 'Pase', [['Visión', { lowpass: .5, loftpass: .5 }, .2], ['Centros', { loftpass: .6, swerve: .4 }, .2], ['Precisión en faltas', { place_kick: .6, swerve: .4 }, .05], ['Pase corto', { lowpass: 1 }, .35], ['Pase largo', { loftpass: 1 }, .15], ['Efecto', { swerve: 1 }, .05]]],
  ['REG', 'Regate', [['Agilidad', { exp_pwr: .5, tight_pos: .5 }, .1], ['Equilibrio', { body_ctrl: 1 }, .05], ['Reacciones', { atk: .5, def: .5 }, .05], ['Control del balón', { ball_ctrl: 1 }, .35], ['Regate', { drib: 1 }, .45], ['Compostura', { tight_pos: .5, ball_ctrl: .5 }, 0]]],
  ['DEF', 'Defensa', [['Intercepciones', { def: .5, ball_win: .5 }, .2], ['Precisión de cabeza', { header: 1 }, .1], ['Conciencia defensiva', { def: 1 }, .3], ['Entrada de pie', { ball_win: 1 }, .2], ['Entrada deslizante', { ball_win: .6, aggres: .4 }, .2]]],
  ['FÍS', 'Físico', [['Salto', { jump: 1 }, .05], ['Resistencia', { stamina: 1 }, .25], ['Fuerza', { phys_cont: 1 }, .5], ['Agresividad', { aggres: 1 }, .2]]],
];
const FIFA_GK = [['EST', 'Estirada', { cover: 1 }], ['PAR', 'Paradas', { catching: 1 }], ['SAQ', 'Saque', { kick_pwr: .5, loftpass: .5 }], ['REF', 'Reflejos', { reflex: 1 }], ['VEL', 'Velocidad', { speed: .55, exp_pwr: .45 }], ['COL', 'Colocación', { gk: 1 }]];
const fifaVal = (get, w) => Math.max(1, Math.min(99, Math.round(Object.entries(w).reduce((a, [k, x]) => a + get(k) * x, 0))));
const fifaFrom = w => 'Se calcula con estas habilidades de PES: ' + Object.keys(w).map(k => tr(FIELD_LABEL[k] || k)).join(LANG === 'es' ? ' y ' : ' and ');
const fifaCls = v => v >= 80 ? 'f80' : v >= 70 ? 'f70' : v >= 50 ? 'f50' : 'f0';
// tipo de carta: bronce (menos de 65), plata (65 a 74), oro (75 o más); ícono si es leyenda.
// Leyenda: automática si juega en un equipo clásico; se puede marcar o desmarcar a mano (se guarda en este navegador).
const LEG_LS = 'edit21-legends-v1';
const LEGEND = (() => { try { return new Map(JSON.parse(localStorage.getItem(LEG_LS) || '[]')); } catch { return new Map(); } })();
const legendAuto = p => (teamOf.get(p.id) || []).some(t => /^CLASSIC/i.test(leagueOf(t) || '') || /CLASSIC|LEGEND|LEYENDA|ICON|HIST[OÓ]RIC/i.test(tget(t, 'name') || ''));
const isLegend = p => LEGEND.has(p.id) ? LEGEND.get(p.id) : legendAuto(p);
const fifaTier = p => { const o = rating(p); return isLegend(p) ? 'icon' : o >= 75 ? 'gold' : o >= 65 ? 'silver' : 'bronze'; };
// las dos formas de carta: FIFA 15 (PES 6 y Clásico) y la actual (Moderno y Retro); 250 x 350
const FUT_PATH = {
  f15: 'M8 36C70 34 92 8 125 8S180 34 242 36L242 306Q242 314 234 317L136 346Q125 349 114 346L16 317Q8 314 8 306Z',
  fc: 'M8 34Q30 32 34 10Q125 0 216 10Q220 32 242 34L242 292Q242 310 224 316Q168 324 142 336Q125 344 108 336Q82 324 26 316Q8 310 8 292Z'
};
function fifaStats(p) {
  const g = k => pget(p, k);
  return pget(p, 'reg_pos') === 0 ? FIFA_GK.map(([ab, nm, w]) => [ab, nm, fifaVal(g, w)]) : FIFA_ATTR.map(([ab, nm, list]) => [ab, nm, Math.max(1, Math.min(99, Math.round(list.reduce((a, [, w, wt]) => a + fifaVal(g, w) * wt, 0))))]);
}
function fifaCard(p) {
  const g = k => pget(p, k), reg = g('reg_pos'), gk = reg === 0, ovr = rating(p), c = clubOf(p.id), kit = c ? kitFor(c, gk) : null;
  const st = fifaStats(p), tier = fifaTier(p), ps = g('play_style');
  const [, last] = splitName(g('name')), nm = g('shirt') || last || g('name');
  // en FIFA 15 los 6 números van en 3 filas de a 2 (izquierda RIT/TIR/PAS, derecha REG/DEF/FÍS)
  const order = [0, 3, 1, 4, 2, 5];
  // como en FC: posiciones donde rinde al máximo (pestañas a la derecha), "+" según cantidad de habilidades especiales,
  // y abajo pie hábil, pierna mala y altura
  const alt = FIFA_POS.map((n, i) => [n, i !== reg ? g('pos' + POS_TO_PP[i]) : 0]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const nsk = SKILLS.flatMap(x => x[1]).filter(([i]) => g('sk' + i)).length, plus = nsk >= 10 ? '++' : nsk >= 5 ? '+' : '';
  return `<div class="fut ${tier}${ovr >= 80 && tier !== 'icon' ? ' rare' : ''}">
    ${alt.length ? `<div class="fu-alt" title="Otras posiciones: A domina, B puede jugar">${alt.map(([n, v]) => `<span class="${v === 2 ? '' : 'b'}">${n}</span>`).join('')}</div>` : ''}
    <div class="fu-tabs"><span title="Pie hábil">${g('strong_foot') ? 'L' : 'R'}</span><span title="Pierna mala">${g('weak_acc') + 1}★</span><span title="Altura">${g('height')}</span></div>
    <svg class="futfr" viewBox="0 0 250 350" aria-hidden="true"><path class="p15" d="${FUT_PATH.f15}"/><path class="pfc" d="${FUT_PATH.fc}"/></svg>
    <div class="futin">
      <div class="fu-ovr"><b>${ovr}</b><span>${FIFA_POS[reg] || ''}</span>${plus ? `<i title="${nsk} habilidades especiales">${plus}</i>` : ''}</div>
      <div class="fu-club">${c ? crest(c, 'futcrest') : ''}</div>
      <div class="fu-nat">${natFlag(g('nation'))}</div>
      <div class="fu-ps" title="${esc(STYLES[ps] || '')}">${ps ? '<i></i>' : ''}</div>
      <div class="fu-face">${faceHtml(p.id, kit, 'futf')}</div>
      <div class="fu-nm">${esc(nm)}</div>
      <div class="fu-band"><span>⚽</span>${esc(ps ? STYLES[ps] : 'Sin estilo de juego')}</div>
      <div class="fu-st">${order.map(i => { const [ab, n, v] = st[i]; return `<div title="${n}"><b>${v}</b><span>${ab}</span></div>`; }).join('')}</div>
      ${tier === 'icon' ? '<div class="fu-icon">ÍCONO</div>' : ''}
    </div>
  </div>`;
}
// ----- skills: un ícono propio para cada habilidad especial y estilo de la IA, con la explicación al pasar el mouse -----
const SK_GLYPH = {
  step: '<circle cx="12" cy="16" r="4"/><path d="M5 10c2-5 12-5 14 0M16 7l3 3-3.5 1"/>',
  swirl: '<circle cx="12" cy="12" r="3.5"/><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"/>',
  lift: '<circle cx="12" cy="6" r="3"/><path d="M4 20c3-9 13-9 16 0M9 20h6"/>',
  heel: '<path d="M6 3v9c0 3 2 5 5 5h7a2 2 0 0 0 0-4h-4l-2-3V3"/><circle cx="7" cy="20.5" r="2"/>',
  feint: '<circle cx="8" cy="16" r="3.5"/><path d="M12 12l7-7M15 5h4v4" stroke-dasharray="3 2"/>',
  header: '<circle cx="9" cy="9" r="4"/><path d="M3 21c0-4 2.5-6 6-6s6 2 6 6"/><circle cx="18.5" cy="5.5" r="2.5"/>',
  power: '<circle cx="16" cy="12" r="4.5"/><path d="M2 8h7M4 12h6M2 16h7"/>',
  arc: '<path d="M3 20C7 4 17 4 21 20"/><circle cx="12" cy="8" r="2.5"/>',
  knuckle: '<path d="M2 14l3.5-4 3.5 4 3.5-4"/><circle cx="18" cy="12" r="3.5"/>',
  acro: '<circle cx="5.5" cy="18" r="2.5"/><path d="M9 15l6-6 5-1M15 9l-2 8M11 4l4 5"/><circle cx="19.5" cy="4" r="2"/>',
  bolt: '<path d="M13 2L5 13h6l-1 9 8-12h-6z"/>',
  through: '<path d="M3 12h15M14 7l5 5-5 5M8 3v4M8 17v4"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  cross: '<path d="M3 21c4-12 11-15 18-14M17 3l4 4-4 3"/>',
  curve: '<path d="M4 20C4 10 13 4 20 6M16 2.5l4 3.5-3.5 4"/><circle cx="4.5" cy="20" r="1.5"/>',
  eye: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/><path d="M4 20L20 4"/>',
  lowlob: '<path d="M2 18c5-7 15-7 20 0"/><circle cx="12" cy="12.5" r="2.5"/>',
  hands: '<path d="M7 11V5.5a1.8 1.8 0 0 1 3.6 0V10M10.6 9V4a1.8 1.8 0 0 1 3.6 0v6M14.2 10V6a1.8 1.8 0 0 1 3.6 0v8a7 7 0 0 1-7 7h-.6A6 6 0 0 1 4 15v-3a1.8 1.8 0 0 1 3.6 0"/>',
  punt: '<path d="M4 20l8-8M2 17l3 3"/><circle cx="16.5" cy="7.5" r="3.5"/><path d="M20 3l1.5-1.5"/>',
  shield: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M8 12h8"/>',
  manmark: '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-4 3-6 6-6s6 2 6 6M13.5 20c0-3 1.5-5 3.5-5s4 2 4 5"/>',
  back: '<path d="M19 12H5M10 7l-5 5 5 5M20 5v14"/>',
  wink: '<circle cx="12" cy="12" r="9"/><path d="M7.5 10h3M15.5 9.5v1M8 15c2 2 6 2 8 0"/>',
  captain: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M14.5 10a3 3 0 1 0 0 4"/>',
  sub: '<path d="M4 8h13M13 4l4 4-4 4M20 16H7M11 12l-4 4 4 4"/>',
  flame: '<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 3-6 0 2 1 3 2 3 0-3 0-5 1-8z"/>',
  run: '<path d="M3 18l5-5 4 3 7-9M15 7h4v4"/>'
};
const SK_INFO = {
  0: ['step', 'Pasa el pie por encima de la pelota (bicicleta) para engañar al rival antes de salir.'],
  28: ['step', 'Toca la pelota dos veces seguidas para cambiar de dirección muy rápido.'],
  1: ['swirl', 'Lleva la pelota hacia afuera y la vuelve a meter con el mismo pie en un solo movimiento.'],
  2: ['swirl', 'Gira sobre la pelota (ruleta) para dejar atrás al rival que lo marca.'],
  3: ['lift', 'Levanta la pelota por encima del rival que viene de frente.'],
  29: ['swirl', 'Cambia de dirección pasando la pelota por detrás del pie de apoyo.'],
  4: ['heel', 'Corta la pelota por detrás del cuerpo para girar en seco.'],
  5: ['feint', 'Amaga un remate o un pase y se lleva la pelota para el otro lado.'],
  30: ['step', 'Frena y controla la pelota con la suela para protegerla y cambiar el ritmo.'],
  10: ['heel', 'Pasa o se acomoda la pelota con el taco.'],
  6: ['header', 'Cabecea con más precisión y potencia.'],
  7: ['power', 'Le pega fuerte desde lejos con un tiro tenso y con poco efecto.'],
  31: ['arc', 'Define por encima del arquero con una vaselina precisa.'],
  39: ['power', 'Más precisión en los remates desde fuera del área.'],
  8: ['knuckle', 'Remate sin rosca que se mueve en el aire y complica al arquero.'],
  32: ['arc', 'Tiro que cae de golpe al llegar al arco.'],
  33: ['arc', 'Tiro que sube al final del recorrido.'],
  9: ['acro', 'Puede rematar de chilena, de tijera o en posiciones difíciles.'],
  11: ['bolt', 'Remata de primera, sin controlar, con mejor precisión.'],
  12: ['bolt', 'Pases de primera más precisos.'],
  40: ['through', 'Pases al espacio más precisos para dejar a un compañero solo.'],
  13: ['target', 'Pases elevados con efecto hacia atrás que frenan justo donde llega el compañero.'],
  14: ['cross', 'Centros más precisos al área.'],
  15: ['curve', 'Pasa y remata con el exterior del pie, con efecto.'],
  16: ['curve', 'Pasa o remata cruzando la pierna por detrás de la otra (rabona).'],
  34: ['eye', 'Pasa mirando para otro lado para engañar a la defensa.'],
  17: ['lowlob', 'Pase elevado bajo y tenso, difícil de cortar.'],
  19: ['hands', 'Saca de banda muy lejos, casi como un centro.'],
  18: ['punt', 'El arquero saca con un pelotazo bajo y tenso.'],
  35: ['punt', 'El arquero saca con un pelotazo alto y largo.'],
  20: ['hands', 'El arquero lanza la pelota con la mano muy lejos para salir rápido.'],
  37: ['hands', 'El arquero ataja más penales.'],
  36: ['target', 'Patea los penales con más precisión.'],
  21: ['wink', 'Busca faltas y sabe dejarse caer para sacar ventaja.'],
  22: ['manmark', 'Sigue de cerca a un rival durante todo el partido.'],
  23: ['back', 'Vuelve a defender en cuanto el equipo pierde la pelota.'],
  38: ['shield', 'Anticipa y corta mejor los pases del rival.'],
  24: ['acro', 'Despeja la pelota de chilena o de tijera.'],
  25: ['captain', 'Levanta el ánimo del equipo cuando es el capitán.'],
  26: ['sub', 'Rinde mejor cuando entra desde el banco.'],
  27: ['flame', 'No baja los brazos aunque el equipo vaya perdiendo.']
};
const COM_INFO = [
  ['swirl', 'La IA hace muchos trucos y amagues cuando tiene la pelota.'],
  ['run', 'La IA encara en conducción larga, eludiendo a varios rivales.'],
  ['bolt', 'La IA usa su velocidad para escaparse al espacio.'],
  ['through', 'La IA busca el espacio a espaldas de la defensa.'],
  ['arc', 'La IA busca seguido los pases largos.'],
  ['cross', 'La IA centra apenas puede, sin llegar al fondo.'],
  ['power', 'La IA remata seguido desde lejos.']
];
const skSvg = gl => `<svg viewBox="0 0 24 24" aria-hidden="true">${SK_GLYPH[gl] || SK_GLYPH.target}</svg>`;
const SK_CAT = new Map(SKILLS.flatMap(([, list], gi) => list.map(([i]) => [i, gi])));
// las que tiene el jugador: [clave, nombre, ícono, explicación, grupo]
function playerSkills(p) {
  const out = [];
  for (const [, list] of SKILLS) for (const [i, nm] of list) if (pget(p, 'sk' + i)) out.push(['sk' + i, nm, (SK_INFO[i] || [])[0], (SK_INFO[i] || [])[1] || '', SK_CAT.get(i)]);
  COM.forEach((nm, i) => { if (pget(p, 'com' + i)) out.push(['com' + i, nm, COM_INFO[i][0], COM_INFO[i][1], 'ia']); });
  return out;
}
const skChip = (k, nm, gl, tip, cat, on) => `<label class="skchip" data-c="${cat}" data-tip="${esc(tip)}" data-tiptitle="${esc(nm)}"><input type="checkbox" data-k="${k}" ${on ? 'checked' : ''}><i class="skico">${skSvg(gl)}</i><span>${nm}</span></label>`;
function skillsBlock(p) {
  const g = k => pget(p, k), all = SKILLS.flatMap(s => s[1]), n = all.filter(([i]) => g('sk' + i)).length;
  return `<h3 class="sec">Skills <span class="skn">${n} habilidades especiales</span></h3>
  <div class="grid wide"><div class="f"><label>Estilo de juego</label><select data-k="play_style">${selOpts(STYLES, g('play_style'))}</select></div></div>
  <div class="skgroups">${SKILLS.map(([gn, list], gi) => `<div class="skgrp" data-c="${gi}"><h4>${gn}<b>${list.filter(([i]) => g('sk' + i)).length}/${list.length}</b></h4><div class="skchips">${list.map(([i, nm]) => skChip('sk' + i, nm, (SK_INFO[i] || [])[0], (SK_INFO[i] || [])[1] || '', gi, g('sk' + i))).join('')}</div></div>`).join('')}
    <div class="skgrp" data-c="ia"><h4>Estilos de juego de la IA<b>${COM.filter((_, i) => g('com' + i)).length}/${COM.length}</b></h4><div class="skchips">${COM.map((nm, i) => skChip('com' + i, nm, COM_INFO[i][0], COM_INFO[i][1], 'ia', g('com' + i))).join('')}</div></div></div>`;
}
// la apertura ocupa toda la pestaña: sobre que tiembla, destello, bandera → posición → escudo, y la carta aparece
// grande en el centro con rayos antes de ir a su lugar (como en FIFA). Se puede saltar, repetir o apagar.
function fifaOpening(p) {
  const c = clubOf(p.id), reg = pget(p, 'reg_pos'), tier = fifaTier(p);
  return `<div class="fopen" aria-hidden="true" data-ovr="${rating(p)}"><i class="fo-beam"></i>
    <div class="fo-pack" tabindex="0" role="button" aria-label="Abrir el sobre"><div class="fo-top" title="Pasá el mouse de lado a lado para rasgarlo"><i class="fo-cut"></i></div><div class="fo-body"><img class="fo-logo" src="assets/logo-sobre.png" alt="PES Editor" draggable="false"></div></div>
    <i class="fo-hand">👆</i><p class="fo-hint">Pasá el mouse por la parte de arriba del sobre para rasgarlo</p>
    <i class="fo-flash"></i>
    <div class="fo-w fo-w1">${natFlag(pget(p, 'nation')) || '<b>🌍</b>'}</div><div class="fo-w fo-w2"><b>${FIFA_POS[reg] || ''}</b></div><div class="fo-w fo-w3">${c ? crest(c, 'fobig') : '<b>⚽</b>'}</div>
    <div class="fo-conf">${fifaConfetti(tier)}</div>
    <i class="fo-rays"></i><div class="fo-parts">${Array.from({ length: 22 }, (_, i) => `<i style="--a:${i * 360 / 22}deg;--d:${(i % 4) * 50 + 120}px"></i>`).join('')}</div></div>
    <button type="button" class="fo-skip" data-foskip>Saltar ⏭</button>`;
}
// confeti que sale disparado del sobre al rasgarlo (más papelitos y del color de la carta si es oro o ícono)
function fifaConfetti(tier) {
  const big = tier === 'gold' || tier === 'icon', tc = { gold: '#f5c542', silver: '#d9dee6', bronze: '#c98a52', icon: '#f0d68a' }[tier];
  const cols = [tc, tc, '#ffffff', '#3ad17d', '#29a8ff', '#ff4f7b', '#ffd23f', '#a970ff'], r = (a, b) => a + Math.random() * (b - a);
  return Array.from({ length: big ? 90 : 60 }, () => `<i style="--x:${Math.round(r(-560, 560))}px;--y:${Math.round(r(180, 440))}px;--r:${Math.round(r(-900, 900))}deg;--c:${cols[Math.floor(Math.random() * cols.length)]};--d:${r(0, .3).toFixed(2)}s;--t:${r(2.4, 3.6).toFixed(2)}s"></i>`).join('');
}
const fifaPref = k => PREFS[k] !== false;
function fifaView(p) {
  const g = k => pget(p, k), gk = g('reg_pos') === 0, tier = fifaTier(p);
  const row = (n, w) => { const v = fifaVal(g, w); return `<div class="fat"><span class="fatn" data-tip="${esc(fifaFrom(w))}" data-tiptitle="${n}">${n}</span><b class="${fifaCls(v)}">${v}</b><i class="fbar ${fifaCls(v)}"><u style="width:${v}%"></u></i></div>`; };
  const groups = FIFA_ATTR.map(([, nm, list]) => { const avg = Math.max(1, Math.min(99, Math.round(list.reduce((a, [, w, wt]) => a + fifaVal(g, w) * wt, 0)))); return `<div class="group abgrp fgrp"><h4><span>${nm}</span><b class="gavg ${fifaCls(avg)}" title="Media">${avg}</b></h4>${list.map(([n, w]) => row(n, w)).join('')}</div>`; });
  if (gk) groups.unshift(`<div class="group abgrp fgrp"><h4><span>Portero</span></h4>${FIFA_GK.map(([, n, w]) => row(n, w)).join('')}</div>`);
  const stars = n => '★'.repeat(n) + '<s>' + '★'.repeat(5 - n) + '</s>';
  S.fifaSeen = S.fifaSeen || new Set();
  const force = S.fifaForce === p.id; S.fifaForce = null;
  const open = !ANIM.reduce.matches && (force || (fifaPref('fifaOpen') && !S.fifaSeen.has(p.id))); S.fifaSeen.add(p.id);
  const leg = isLegend(p), auto = legendAuto(p), sk = playerSkills(p), ps = g('play_style');
  const skills = `<div class="fskills"><h4><span>Skills</span><b>${sk.length}</b></h4>
    ${ps ? `<p class="fstyle"><span>Estilo de juego</span>: <b>${esc(STYLES[ps])}</b></p>` : ''}
    <div class="fsk">${sk.map(([, nm, gl, tip, cat]) => `<span class="fskb" tabindex="0" data-c="${cat}" data-tip="${esc(tip)}" data-tiptitle="${esc(nm)}"><i>${skSvg(gl)}</i><em>${nm}</em></span>`).join('') || '<span class="fsknone">Sin habilidades especiales</span>'}</div></div>`;
  return `<div class="fifa t-${tier}${open ? ' opening' : ''}">${open ? fifaOpening(p) : ''}
    <div class="fifaside">${tier === 'gold' || tier === 'icon' ? '<i class="futglow" aria-hidden="true"></i>' : ''}${fifaCard(p)}
      <div class="futbtns"><button type="button" class="btn small" data-fifaopen>🎁 <span>Abrir sobre</span></button><button type="button" class="btn small" data-legend aria-pressed="${leg}" title="${auto ? 'Juega en un equipo clásico: se lo toma como leyenda' : 'Marcarlo como leyenda muestra la carta ícono'}">⭐ <span>Leyenda</span></button>
        <button type="button" class="btn small" data-fifapref="fifaOpen" aria-pressed="${fifaPref('fifaOpen')}" title="Mostrar la apertura la primera vez que abrís cada jugador">🎬 Apertura</button><button type="button" class="btn small" data-fifapref="fifaSnd" aria-pressed="${fifaPref('fifaSnd')}" title="Sonido de la apertura">${fifaPref('fifaSnd') ? '🔊' : '🔇'} Sonido</button></div>
      <dl class="futinfo"><dt>Pie hábil</dt><dd>${g('strong_foot') ? 'Izquierdo' : 'Derecho'}</dd><dt>Pierna mala</dt><dd class="fst">${stars(g('weak_acc') + 1)}</dd><dt>Altura</dt><dd>${g('height')} cm</dd><dt>Peso</dt><dd>${g('weight')} kg</dd><dt>Edad</dt><dd>${g('age')} años</dd></dl>
      <p class="note">Es una forma de ver al jugador: las medias se calculan con sus habilidades de PES. Para cambiar valores, volvé a la vista PES.</p></div>
    <div class="fright">${skills}<div class="fgrid">${groups.join('')}</div></div>
  </div>`;
}
// sonidos de la apertura, hechos con el sintetizador del navegador (sin archivos): la tira que se arranca, la explosión,
// un golpe por cada dato (bandera, posición, escudo), el acorde brillante de la carta y la tribuna según la media
function fifaSound(tier, ovr) {
  if (!fifaPref('fifaSnd')) return () => { };
  let c; try { c = sfxCtx(); } catch { } if (!c) return () => { };
  const t = c.currentTime + .03, out = c.createGain(); out.gain.value = Math.max(.05, (GFX().sfxVol ?? .5)) * .9; out.connect(c.destination);
  const { osc, nz } = fifaSynth(c, out, t);
  // la tira que se arranca y la explosión del sobre
  nz(0, .35, .45, 'bandpass', 2500, 900, .005, 1.5); nz(.5, 1.1, .55, 'lowpass', 6000, 200); osc('sine', 120, 35, .5, .9, .6);
  // bandera, posición y escudo: un golpe grave cada uno, más un brillo
  [1.15, 2.15, 3.15].forEach((at, i) => { osc('sine', 160 - i * 10, 55, at, .5, .7); nz(at, .12, .25, 'highpass', 3000, 6000); osc('triangle', 660 * (1 + i * .26), 660 * (1 + i * .26), at, .4, .05); });
  // la carta: platillo y acorde que sube (oro e ícono, más largo y con coro)
  nz(4.1, 1.8, .35, 'highpass', 5000, 9000, .005);
  const big = tier === 'gold' || tier === 'icon', base = tier === 'bronze' ? 392 : tier === 'silver' ? 440 : 523.25;
  [1, 1.26, 1.5, 2].forEach((m, i) => osc('triangle', base * m, base * m, 4.1 + i * .08, big ? 2.1 : 1.3, .09));
  if (big) [.5, .75, 1].forEach(m => osc('sawtooth', base * m, base * m * 1.003, 4.2, 2.3, .025, .4));
  fifaCrowd(c, out, t, tier === 'icon' || ovr >= 80 ? 2 : ovr >= 70 ? 1 : 0);
  return () => { try { out.gain.cancelScheduledValues(c.currentTime); out.gain.setTargetAtTime(0, c.currentTime, .05); setTimeout(() => out.disconnect(), 400); } catch { } };
}
// la tribuna: con media alta (80+ o ícono) ovación con aplausos, gritos y silbidos de festejo; de 70 a 79 aplausos;
// con menos de 70 silbatina y la hinchada gritando. Empieza como murmullo al romper el sobre y explota con la carta.
function fifaCrowd(c, out, t, lvl) {
  const sr = c.sampleRate, R = (a, b) => a + Math.random() * (b - a);
  const bus = c.createGain(); bus.connect(out);
  const swell = (node, pts) => { const g = c.createGain(); g.gain.setValueAtTime(0, t); pts.forEach(([at, v]) => g.gain.linearRampToValueAtTime(v, t + at)); node.connect(g); g.connect(bus); return g; };
  // hinchada: ruido con las resonancias de muchas voces juntas
  const noise = SFX.noise, voices = (at, dur, pts) => { [[420, 1.4, 1], [950, 2, .7], [2300, 3, .3]].forEach(([f, q, k]) => { const s = c.createBufferSource(); s.buffer = noise; s.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; s.connect(bp); swell(bp, pts.map(([a, v]) => [a, v * k * 3])); s.start(t + at, Math.random()); s.stop(t + at + dur); }); };
  // gritos: varias voces que suben de tono ("¡uuuh!" / "¡eeeh!")
  const shouts = (at, n, up, peak) => { for (let i = 0; i < n; i++) { const o = c.createOscillator(), bp = c.createBiquadFilter(), g = c.createGain(), a = at + R(0, .5), f = R(170, 330), d = R(1.2, 2.2); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t + a); o.frequency.linearRampToValueAtTime(f * up, t + a + .5); o.frequency.linearRampToValueAtTime(f * up * .92, t + a + d); bp.type = 'bandpass'; bp.frequency.value = R(650, 1100); bp.Q.value = 3; g.gain.setValueAtTime(0, t + a); g.gain.linearRampToValueAtTime(peak, t + a + .15); g.gain.setValueAtTime(peak, t + a + d - .4); g.gain.linearRampToValueAtTime(0, t + a + d); o.connect(bp); bp.connect(g); g.connect(bus); o.start(t + a); o.stop(t + a + d + .05); } };
  // silbidos: festejo (de dedos, sube y baja) o silbatina (largos y parejos, muchos a la vez)
  const whistle = (at, f, d, peak, fest) => { const o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), g = c.createGain(); o.type = 'sine'; lfo.frequency.value = R(5, 9); lg.gain.value = f * .012; lfo.connect(lg); lg.connect(o.frequency);
    if (fest) { o.frequency.setValueAtTime(f * .6, t + at); o.frequency.exponentialRampToValueAtTime(f, t + at + .12); o.frequency.setValueAtTime(f, t + at + d * .55); o.frequency.exponentialRampToValueAtTime(f * .7, t + at + d * .7); o.frequency.exponentialRampToValueAtTime(f * 1.05, t + at + d); }
    else { o.frequency.setValueAtTime(f, t + at); o.frequency.linearRampToValueAtTime(f * R(.97, 1.03), t + at + d); }
    g.gain.setValueAtTime(0, t + at); g.gain.linearRampToValueAtTime(peak, t + at + .06); g.gain.setValueAtTime(peak, t + at + d - .1); g.gain.linearRampToValueAtTime(0, t + at + d); o.connect(g); g.connect(bus); [o, lfo].forEach(x => { x.start(t + at); x.stop(t + at + d + .05); }); };
  // aplausos: miles de palmas cortas armadas en un buffer
  const claps = (at, dur, dens, pts) => { const len = Math.floor(sr * dur), b = c.createBuffer(1, len, sr), d = b.getChannelData(0); for (let k = 0, n = dur * dens; k < n; k++) { const s0 = Math.floor(Math.random() * (len - 2000)), L = 300 + Math.floor(Math.random() * 900), amp = R(.2, 1); for (let j = 0; j < L; j++) d[s0 + j] += (Math.random() * 2 - 1) * amp * Math.exp(-j / (L * .22)); } const s = c.createBufferSource(); s.buffer = b; const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 700; const bp = c.createBiquadFilter(); bp.type = 'peaking'; bp.frequency.value = 1800; bp.gain.value = 6; s.connect(hp); hp.connect(bp); swell(bp, pts.map(([a, v]) => [a, v * 1.6])); s.start(t + at); };
  // murmullo mientras pasan bandera, posición y escudo
  voices(.5, 7, [[.5, 0], [1.4, .05], [3.9, .09], [4.3, lvl === 1 ? .12 : .22], [6.2, .16], [7.4, 0]]);
  if (lvl === 2) {
    claps(4, 3.4, 260, [[4, 0], [4.35, .32], [6.4, .26], [7.4, 0]]);
    shouts(4.05, 10, 1.35, .028);
    [4.4, 4.9, 5.5, 6.1].forEach(a => whistle(a + R(0, .2), R(2400, 3300), R(.55, .8), .06, true));
  } else if (lvl === 1) {
    claps(4.1, 3, 150, [[4.1, 0], [4.5, .22], [6.3, .14], [7.2, 0]]);
    whistle(4.7, R(2600, 3100), .6, .045, true);
  } else {
    shouts(4.1, 7, 1.15, .024);
    for (let i = 0; i < 12; i++) whistle(4.1 + R(0, 1.6), R(2300, 3600), R(1, 2.2), .028, false);
    claps(4.6, 1.6, 30, [[4.6, 0], [4.9, .08], [6, 0]]);
  }
}
function fifaSynth(c, out, t) {
  const noise = SFX.noise || (SFX.noise = (() => { const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })());
  const env = (node, at, a, peak, dur) => { const e = c.createGain(); e.gain.setValueAtTime(0, t + at); e.gain.linearRampToValueAtTime(peak, t + at + a); e.gain.exponentialRampToValueAtTime(.0005, t + at + dur); node.connect(e); e.connect(out); return e; };
  const osc = (type, f0, f1, at, dur, peak, a = .01) => { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t + at); o.frequency.exponentialRampToValueAtTime(f1, t + at + dur); env(o, at, a, peak, dur); o.start(t + at); o.stop(t + at + dur + .05); };
  const nz = (at, dur, peak, type, f0, f1, a = .005, q = 1) => { const s = c.createBufferSource(); s.buffer = noise; const f = c.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t + at); f.frequency.exponentialRampToValueAtTime(f1, t + at + dur); s.connect(f); env(f, at, a, peak, dur); s.start(t + at, Math.random()); s.stop(t + at + dur + .05); };
  return { osc, nz };
}
// el ruidito de papel mientras se rasga
function fifaRip(k) {
  if (!fifaPref('fifaSnd')) return;
  try { const c = sfxCtx(); if (!c) return; const out = c.createGain(); out.gain.value = Math.max(.05, (GFX().sfxVol ?? .5)) * .6; out.connect(c.destination); setTimeout(() => out.disconnect(), 300); fifaSynth(c, out, c.currentTime).nz(0, .07 + Math.random() * .05, .25 + k * .25, 'bandpass', 1800 + Math.random() * 2500, 900, .003, 2.5); } catch { }
}
// arranca y termina la apertura (sola o al tocar)
function fifaBind(sh) {
  const f = sh.querySelector('.fifa.opening'); if (!f) return;
  const card = f.querySelector('.fut'), fr = f.getBoundingClientRect(), cr = card.getBoundingClientRect();
  card.style.setProperty('--fx', Math.round(fr.left + fr.width / 2 - (cr.left + cr.width / 2)) + 'px');
  card.style.setProperty('--fy', Math.round(Math.min(fr.height, innerHeight) / 2 - (cr.top - fr.top) - cr.height / 2) + 'px');
  f.style.setProperty('--cy', Math.round(Math.min(fr.height, innerHeight) / 2) + 'px');
  const tier = (card.className.match(/\b(gold|silver|bronze|icon)\b/) || [])[1];
  let stop = () => { }, t = 0;
  const done = () => { f.querySelectorAll('.fopen,.fo-skip').forEach(o => o.remove()); f.classList.remove('opening', 'go'); f.classList.add('opened'); };
  const end = () => { clearTimeout(t); stop(); done(); };
  // rasgar: la tira de arriba se corta a medida que el mouse (o el dedo) la recorre de lado a lado
  const top = f.querySelector('.fo-top'), pack = f.querySelector('.fo-pack'), bins = new Set();
  const go = () => { if (f.classList.contains('go')) return; top.style.setProperty('--tear', '100%'); f.classList.add('go'); stop = fifaSound(tier, +f.querySelector('.fopen').dataset.ovr || 0); t = setTimeout(done, 7300); };
  const move = e => {
    const r = top.getBoundingClientRect(); if (e.clientY < r.top - 14 || e.clientY > r.bottom + 14) return;
    const k = Math.floor(Math.max(0, Math.min(.999, (e.clientX - r.left) / r.width)) * 16); if (bins.has(k)) return;
    bins.add(k);
    top.style.setProperty('--tear', Math.round(bins.size / 16 * 100) + '%'); fifaRip(bins.size / 16);
    if (bins.size >= 14) go();
  };
  f.addEventListener('pointermove', move);
  pack.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  f.querySelector('.fo-skip').addEventListener('click', e => { e.stopPropagation(); end(); });
  // una vez abierto, un toque en cualquier lado lo saltea
  f.addEventListener('click', e => { if (f.classList.contains('go') && !e.target.closest('.fo-pack')) end(); });
}
const abViewSeg = () => { const v = PREFS.abView === 'fifa' ? 'fifa' : 'pes'; return `<div class="abview" role="group" aria-label="Forma de ver las estadísticas"><span class="lab">Ver como</span><div class="seg">${[['pes', '⚽ PES'], ['fifa', '🃏 FIFA']].map(([k, n]) => `<button type="button" data-abview="${k}" aria-pressed="${v === k}">${n}</button>`).join('')}</div></div>`; };
function tabAbil(p) {
  const g = k => pget(p, k);
  if (PREFS.abView === 'fifa') return abViewSeg() + fifaView(p);
  return `${abViewSeg()}${hexaCard(p)}<div class="row" style="justify-content:space-between"><h3>Habilidades (40 a 99)</h3>
    <div class="row"><button class="btn small" data-bulk="-1" type="button">−1 a todas</button><button class="btn small" data-bulk="1" type="button">+1 a todas</button>
    <input type="number" id="bulkSet" min="40" max="99" placeholder="Valor" style="width:80px" aria-label="Valor para todas"><button class="btn small" id="bulkSetBtn" type="button">Poner todas</button></div></div>
  <div class="abscale" aria-hidden="true">${[['4', '90-99'], ['3', '80-89'], ['2', '70-79'], ['1', '60-69'], ['0', '40-59']].map(([t, r]) => `<span class="abt" data-t="${t}"><i></i>${r}</span>`).join('')}</div>
  <div class="groups abgroups">${ABIL_GROUPS.map(([gn, list]) => { const a = abAvg(p, list); return `<div class="group abgrp"><h4>${gn}<b class="gavg abt" data-gavg="${gn}" data-t="${abT(a)}" title="Promedio">${a}</b></h4>${list.map(([k, n]) => abRow(k, n, g(k))).join('')}</div>`; }).join('')}</div>
  <h3 class="sec">Pierna mala, forma y lesiones</h3>
  <div class="lvls">
    <div class="f"><span class="lab">Uso de pierna mala</span>${lvlSeg('weak_use', g('weak_use'), ['1', '2', '3', '4'], 'Uso de pierna mala')}</div>
    <div class="f"><span class="lab">Precisión de pierna mala</span>${lvlSeg('weak_acc', g('weak_acc'), ['1', '2', '3', '4'], 'Precisión de pierna mala')}</div>
    <div class="f"><span class="lab">Estado de forma</span>${lvlSeg('form', g('form'), ['1', '2', '3', '4', '5', '6', '7', '8'], 'Estado de forma')}</div>
    <div class="f"><span class="lab">Resistencia a lesiones</span>${lvlSeg('injury', g('injury'), ['C', 'B', 'A'], 'Resistencia a lesiones')}</div>
  </div>${skillsBlock(p)}`;
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
  return `<div class="grid wide">${MOTION.map(([k, n, min, max, off]) => `<div class="f"><label>${n} <span class="rng">(${min}-${max})</span></label>${num(k, g(k) + off, min, max, `data-off="${off}"`)}</div>`).join('')}</div>
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
// pinta una fila de habilidad (color y largo de la barra) sin redibujar la ficha
function abPaint(row, v) { row.dataset.t = abT(v); row.style.setProperty('--p', abP(v)); }
// después de cambiar una habilidad: su fila, el promedio del grupo y el hexágono
function abLive(p, k, dragged) {
  const sh = $('plSheet'); if (!sh) return;
  const v = pget(p, k), row = sh.querySelector(`.abr[data-abk="${k}"]`), o = S.abShown && S.abShown.id === p.id ? S.abShown.vals.get(k) : null;
  if (row) { abPaint(row, v); row.querySelectorAll('[data-tiplv]').forEach(x => { x.dataset.tiplv = abT(v); }); if (o != null && o !== v) { bumpNum(row.querySelector('input[type=number]'), v - o); if (!dragged) barSlide(row, o, v); } }
  if (S.abShown && S.abShown.id === p.id) S.abShown.vals.set(k, v);
  for (const [gn, list] of ABIL_GROUPS) { if (!list.some(x => x[0] === k)) continue; const b = sh.querySelector(`[data-gavg="${gn}"]`); if (b) { const a = abAvg(p, list), a0 = +b.textContent; b.textContent = a; b.dataset.t = abT(a); if (a !== a0) bumpNum(b, a - a0); } }
  if (typeof hexaPaint === 'function' && $('hxWrap')) hexaPaint(p, hexaAxes(pget(p, 'reg_pos')), null);
}
function bindPlayer(p, m) {
  const sh = $('plSheet'), rer = () => later(() => renderPlayers(m));
  const nm = () => pget(p, 'name') || 'ID ' + p.id;
  sh.querySelectorAll('[data-ptab]').forEach(b => b.onclick = () => { S.ptab = b.dataset.ptab; renderPlayers(m); });
  $('pLock').onchange = e => { setLock(p, e.target.checked); rer(); };
  const rv = $('pRevert'); if (rv) rv.onclick = () => { edit('Volver al original: ' + nm(), 'p' + p.id, regP(p), () => S.d.set(S.origData.subarray(p.base, p.base + 0x138), p.base)); toast('Jugador restaurado como estaba al abrir el archivo.', 4000, ['Deshacer', undo]); rer(); };
  const tdb = $('pToDb'); if (tdb) tdb.onclick = async () => { if (await confirmBox(`¿Volver a ${nm()} a la base del juego? Sale de tu EDIT y el juego usa el jugador como venía: se pierde lo que le cambiaste (media, habilidades, físico…). Se puede deshacer con Ctrl+Z.`)) { backToDb([p.id]); renderPlayers(m); } };
  $('pCopyBtn').onclick = () => {
    const src = S.ix.byId.get(+$('pCopy').value); if (!src) { toast('Elegí de qué jugador copiar.'); return; }
    const what = $('pCopyWhat').value;
    edit('Copiar ' + $('pCopyWhat').selectedOptions[0].text + ' a ' + nm(), 'p' + p.id, regP(p), () => { for (const k of COPY_KEYS[what]) { PD.player.set(S.d, p.base, k, PD.player.get(S.d, src.base, k)); if (S.autoLock) for (const fl of [...LOCK_FLAGS, ...FIELD_FLAGS(k)]) PD.player.set(S.d, p.base, fl, 1); } });
    toast('Copiado de ' + pget(src, 'name') + '.', 4000, ['Deshacer', undo]); rer();
  };
  if (S.ptab === 'abil' && PREFS.abView !== 'fifa') hexaBind(p, rer);
  if (S.ptab === 'abil' && PREFS.abView === 'fifa') fifaBind(sh);
  abAnimDiff(p);
  sh.addEventListener('input', e => {
    const el = e.target; if (el.type !== 'range') return;
    const ab = el.closest('.ab,.abr'); if (!ab) return;
    const tw = el.dataset.twin ? ab.querySelector('input[type=number]') : null; if (tw) { tw.value = el.value; tw.className = vcls(+el.value); }
    if (ab.classList.contains('abr')) abPaint(ab, +el.value);
    const o = ab.querySelector('output'); if (o) { const d = +el.value - 7; o.textContent = (d > 0 ? '+' : '') + d; }
  });
  // nombre y apellido: se juntan en el único nombre que guarda el juego
  const fullNm = () => joinName($('pFirst').value, $('pLast').value);
  const caseUi = () => {
    const f = $('pFirst'), l = $('pLast'); if (!f || !l) return;
    sh.querySelectorAll('.casew').forEach(w => {
      const first = w.dataset.case === 'first', v = (first ? f : l).value.trim(), on = allCaps(v);
      w.hidden = !on; if (on) w.querySelector('b').textContent = properCase(v, first || !f.value.trim());
    });
  };
  sh.addEventListener('input', e => {
    if (!e.target.dataset.nm) return;
    const v = fullNm(), n = nameBytes(v), fb = $('pFull'), bb = $('pBytes');
    if (fb) fb.textContent = v || '—'; if (bb) { bb.textContent = n + '/' + NAME_MAX; bb.classList.toggle('bad', n > NAME_MAX); }
    caseUi();
  });
  // Bloq Mayús: el navegador lo dice en cada tecla o clic (getModifierState); el aviso sale solo debajo del campo donde se escribe
  const CAPS_IN = '#pFirst,#pLast,#pShirt,#pShirtNt';
  const capsShow = () => sh.querySelectorAll('.capsw').forEach(w => { w.hidden = !(S.capsOn && w.parentElement.contains(document.activeElement)); });
  const capsEv = e => { if (e.target.matches && e.target.matches(CAPS_IN) && e.getModifierState) { S.capsOn = e.getModifierState('CapsLock'); capsShow(); } };
  ['keydown', 'keyup', 'pointerdown'].forEach(t => sh.addEventListener(t, capsEv));
  sh.addEventListener('focusin', e => { if (e.target.matches && e.target.matches(CAPS_IN)) capsShow(); });
  sh.addEventListener('focusout', () => setTimeout(capsShow));
  sh.addEventListener('change', e => {
    if (e.target.dataset.nm) {
      const v = fullNm(); if (!v) { toast('El jugador necesita un nombre o un apellido.'); const [f0, l0] = splitName(pget(p, 'name')); $('pFirst').value = f0; $('pLast').value = l0; return; }
      if (nameBytes(v) > NAME_MAX) toast('El nombre completo pasa los ' + NAME_MAX + ' caracteres que guarda el juego: se corta al final.', 5000);
      if (v === pget(p, 'name')) return;
      setP(p, 'name', v, nm() + ': nombre');
      // sin redibujar la ficha, así el cursor sigue en el campo siguiente (Tab de Nombre a Apellido)
      const h2 = sh.querySelector('.head h2'); if (h2) h2.textContent = nm();
      const fb = $('pFull'); if (fb) fb.textContent = nm();
      const it = document.querySelector(`[data-p="${p.id}"] .nm`), tn = it && [...it.childNodes].find(x => x.nodeType === 3 && x.data.trim()); if (tn) tn.data = tn.data.match(/^\s*/)[0] + nm();
      updateLockUi(p); return;
    }
    const el = e.target, k = el.dataset.k; if (!k) return;
    let v;
    if (el.type === 'checkbox') v = el.checked ? 1 : 0;
    else if (el.type === 'text') v = el.value;
    else { v = Math.round(parseFloat(el.value)); if (isNaN(v)) return; if (el.min !== '' && v < +el.min) v = +el.min; if (el.max !== '' && v > +el.max) v = +el.max; el.value = v; if (el.dataset.off) v -= +el.dataset.off; }
    setP(p, k, v, nm() + ': ' + (FIELD_LABEL[k] || k));
    if (k === 'reg_pos') { const pp = 'pos' + POS_TO_PP[v]; if (pget(p, pp) < 2) setP(p, pp, 2, nm() + ': posiciones'); }
    if (ABIL.some(a => a[0] === k)) { sh.querySelectorAll(`[data-k="${k}"]`).forEach(x => { if (x !== el) x.value = el.value; if (x.type === 'number') x.className = vcls(+el.value); }); abLive(p, k, el.type === 'range'); }
    if (['name', 'reg_pos', 'nation', 'age', 'height', 'strong_foot', 'play_style'].includes(k) || el.type === 'checkbox') rer();
    else updateLockUi(p);
  });
  sh.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-fifaopen')) { S.fifaForce = p.id; rer(); return; }
    if (b.dataset.fifapref) { PREFS[b.dataset.fifapref] = !fifaPref(b.dataset.fifapref); savePrefs(); rer(); return; }
    if (b.hasAttribute('data-legend')) { LEGEND.set(p.id, !isLegend(p)); if (LEGEND.get(p.id) === legendAuto(p)) LEGEND.delete(p.id); try { localStorage.setItem(LEG_LS, JSON.stringify([...LEGEND])); } catch { } rer(); return; }
    if (b.dataset.abview) { if (PREFS.abView !== b.dataset.abview) { PREFS.abView = b.dataset.abview; savePrefs(); rer(); } return; }
    if (b.dataset.abstep) { const k = b.dataset.k, v = Math.max(40, Math.min(99, pget(p, k) + +b.dataset.abstep)); if (v !== pget(p, k)) { setP(p, k, v, nm() + ': ' + (FIELD_LABEL[k] || k)); sh.querySelectorAll(`[data-k="${k}"]:not(button)`).forEach(x => { x.value = v; if (x.type === 'number') x.className = vcls(v); }); abLive(p, k); updateLockUi(p); } return; }
    if (b.dataset.pteam) { S.team = +b.dataset.pteam; S.ttab = 'roster'; setTab('teams'); return; }
    if (b.dataset.dbweight) { setP(p, 'weight', +b.dataset.dbweight, nm() + ': peso'); rer(); return; }
    if (b.dataset.casefix) { const el = $(b.dataset.casefix === 'first' ? 'pFirst' : 'pLast'), f = $('pFirst'); el.value = properCase(el.value.trim(), b.dataset.casefix === 'first' || !f.value.trim()); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.focus(); return; }
    if (b.dataset.shirtlast) { const k = $(b.dataset.shirtlast).dataset.k, v = $('pLast').value.trim().toUpperCase(); if (!v) { toast('Escribí primero el apellido.'); return; } if (v !== pget(p, k)) { setP(p, k, v, nm() + ': ' + FIELD_LABEL[k]); rer(); } return; }
    const sg = b.closest('[data-segk]');
    if (sg && b.dataset.step) { const k = sg.dataset.segk, v = Math.max(0, Math.min(+sg.dataset.max, pget(p, k) + +b.dataset.step)); if (v !== pget(p, k)) { setP(p, k, v, nm() + ': ' + (FIELD_LABEL[k] || k)); rer(); } return; }
    if (sg && b.dataset.v != null) { let v = +b.dataset.v; if (sg.matches('.lvstar,.lvatt') && v === pget(p, sg.dataset.segk)) v = 0; setP(p, sg.dataset.segk, v, nm() + ': ' + (FIELD_LABEL[sg.dataset.segk] || sg.dataset.segk)); rer(); return; } // en estrellas y actitud, tocar el nivel marcado lo deja en 0
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
      <div class="pesedits">${PESLOC.edits.map((e, i) => `<div class="pesedit ${PESLOC.chosen === e ? 'on' : ''}"><b>${e.kind === 'drmp' ? 'drmp' : e.kind === 'save' ? 'save' : esc(e.kind)}</b><span class="mono">${esc(e.path)}\\EDIT00000000</span><small>${new Date(e.mtime).toLocaleString('es-AR')} · ${(e.size / 1048576).toFixed(1).replace('.', ',')} MB</small>${PESLOC.chosen === e ? '<span class="chip ok">Abierto</span>' : `<button class="btn small" type="button" data-pesedit="${i}">Abrir este</button>`}</div>`).join('')}</div>`
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
$('bReload').onclick = () => reloadFromGame(); $('bFindEdit').onclick = editFinder; $('tTeams').onclick = () => setTab('teams'); $('tNats').onclick = () => setTab('nats'); $('tPlayers').onclick = () => setTab('players'); $('tFile').onclick = () => setTab('file'); $('tWepes').onclick = () => setTab('wepes'); $('tSider').onclick = () => setTab('sider'); $('tNews').onclick = () => setTab('news'); $('tIdeas').onclick = () => setTab('ideas');
$('gq').oninput = e => gsearch(e.target.value);
$('gq').onkeydown = e => { if (e.key === 'Enter') { const b = $('gres').querySelector('button'); if (b) gpick(b); } if (e.key === 'Escape') { $('gres').hidden = true; e.target.blur(); } };
$('gres').onclick = e => { const b = e.target.closest('button'); if (b) gpick(b); };
document.addEventListener('click', e => { if (!e.target.closest('.gsearch')) $('gres').hidden = true; if (!e.target.closest('.picker') && $('addRes')) $('addRes').hidden = true; });
// Cambios sin guardar al cerrar o recargar: el navegador muestra su aviso de siempre. En la app de Windows ese aviso no aparece
// (la ventana se queda sin cerrar y sin decir nada), así que ahí se frena y se muestra el cuadro del editor con las opciones.
let UNLOAD_OK = false, UNLOAD_ASK = false, UNLOAD_RELOAD = 0;
window.addEventListener('beforeunload', e => {
  if (UNLOAD_OK || !pending()) return;
  e.preventDefault(); e.returnValue = '';
  if (window.pesNative && !UNLOAD_ASK) unloadAsk();
});
async function unloadAsk() {
  const reload = Date.now() - UNLOAD_RELOAD < 3000; UNLOAD_ASK = true;
  try { if (!await sessAsk(reload ? 'reload' : 'close')) return; } finally { UNLOAD_ASK = false; }
  UNLOAD_OK = true; if (reload) location.reload(); else window.close();
}
document.addEventListener('keydown', e => {
  const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
  const k = e.key.toLowerCase();
  if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && k === 'r')) UNLOAD_RELOAD = Date.now(); // F5 o Ctrl+R: recargar, no salir
  if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); if (pending()) save(); }
  else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && k === 'z' && !typing) { e.preventDefault(); undo(); }
  else if ((e.ctrlKey || e.metaKey) && (k === 'y' || (e.shiftKey && k === 'z')) && !typing) { e.preventDefault(); redo(); }
  else if (e.key === '/' && !typing && S.f) { e.preventDefault(); $('gq').focus(); }
});
render();
