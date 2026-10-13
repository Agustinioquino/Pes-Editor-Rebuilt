// ===================== Temporada completa, lesiones e historial (solo con ESPN) =====================
// Después de traer los últimos partidos, en segundo plano se analiza toda la temporada del equipo: cada partido
// terminado con sus estadísticas (goles, asistencias, minutos, puntaje), el plantel de la web con los lesionados,
// la campaña de la temporada anterior y el historial de temporadas de cada jugador que está en tu plantel.
// Con eso la forma (js/matches.js → lmComputeAdj) deja de depender solo de 6 partidos. Todo es opcional: si algo
// falla, la forma se calcula igual con lo que haya.
const SEAS_LS = 'edit21-season-v1', HIST_LS = 'edit21-athlete-hist-v1', SEAS_MAX = 60, HIST_TTL = 7 * 86400e3;
const SEAS = { cache: {}, hist: {}, busy: {}, step: {}, tick: 0, mm: new Map() };
try { SEAS.cache = JSON.parse(localStorage.getItem(SEAS_LS) || '{}'); } catch { }
try { SEAS.hist = JSON.parse(localStorage.getItem(HIST_LS) || '{}'); } catch { }
if (PREFS.lmDeep == null) PREFS.lmDeep = true;
function seasSave() {
  const put = () => { localStorage.setItem(SEAS_LS, JSON.stringify(SEAS.cache)); localStorage.setItem(HIST_LS, JSON.stringify(SEAS.hist)); };
  try { put(); } catch { const ks = Object.keys(SEAS.cache).sort((a, b) => SEAS.cache[a].when - SEAS.cache[b].when); for (const k of ks.slice(0, Math.ceil(ks.length / 2))) delete SEAS.cache[k]; try { put(); } catch { } }
}
const seasOn = () => PREFS.lmProv === 'espn' && !!PREFS.lmDeep;
// varias consultas a la vez (de a 3) sin tirar la página abajo
async function seasPool(items, n, fn) { let i = 0; const run = async () => { while (i < items.length) { const it = items[i++]; try { await fn(it); } catch { } } }; await Promise.all(Array.from({ length: Math.min(n, items.length) }, run)); }
const seasYear = (sc, evs) => (sc.season && sc.season.year) || (sc.requestedSeason && sc.requestedSeason.year) || (evs[0] ? new Date(evs[0].date).getFullYear() : new Date().getFullYear());
function seasRecord(evs, tid) {
  const z = { pj: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
  for (const e of evs) { const cs = e.competitions[0].competitors || [], me = cs.find(c => +c.team.id === tid), op = cs.find(c => +c.team.id !== tid); if (!me || !op) continue; const a = +((me.score && (me.score.value ?? me.score)) || 0), b = +((op.score && (op.score.value ?? op.score)) || 0); z.pj++; z.gf += a; z.ga += b; a > b ? z.w++ : a < b ? z.l++ : z.d++; }
  return z;
}
const seasDone = evs => evs.filter(e => { const c = e.competitions && e.competitions[0]; return c && c.status && c.status.type && c.status.type.completed; }).sort((a, b) => b.date.localeCompare(a.date));
// un partido (con la forma que devuelve espnFixture) suma a los totales de la temporada de cada jugador
function seasAbsorb(sc, fx) {
  if (!fx || sc.games[fx.id]) return;
  const g = sc.list.find(x => x.id === fx.id); if (!g) return;
  const people = [...fx.xi.map(p => [p, 1]), ...fx.subs.map(p => [p, 0])];
  g.sq = people.map(([p]) => p.id); g.pl = people.filter(([p]) => p.min > 0).map(([p]) => p.id);
  for (const [p, starter] of people) {
    const s = sc.agg[p.id] || (sc.agg[p.id] = { n: p.name, num: p.num, pos: p.pos, app: 0, st: 0, min: 0, g: 0, a: 0, yc: 0, rc: 0, sot: 0, sv: 0, r: [] });
    s.n = p.name || s.n; if (p.num) s.num = p.num; if (p.pos) s.pos = p.pos;
    if (!p.min) continue;
    s.app++; s.st += starter; s.min += p.min; const t = p.st || {}; s.g += t.g || 0; s.a += t.a || 0; s.yc += t.yc || 0; s.rc += t.rc || 0; s.sot += t.sot || 0; s.sv += t.sv || 0;
    if (p.rt != null) s.r.push([fx.id, p.rt, p.min]);
  }
  sc.games[fx.id] = 1; sc.done = Object.keys(sc.games).length;
}
// ---- orquestador: calendario → partidos que faltan → plantel (lesiones) → temporada anterior → historial ----
async function seasonFetch(t, force) {
  if (!seasOn() || typeof PROVIDERS === 'undefined') return;
  const k = lk(t), api = LM.map[k], c = LM.cache[k]; if (!api || !c || SEAS.busy[k]) return;
  SEAS.busy[k] = true; SEAS.step[k] = 'games';
  const P = PROVIDERS.espn, tid = api.id;
  try {
    const sched = await P.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/${tid}/schedule`);
    const evs = seasDone(sched.events || []), year = seasYear(sched, evs);
    let sc = SEAS.cache[k];
    if (force || !sc || sc.tid !== tid || sc.year !== year) sc = SEAS.cache[k] = { tid, year, when: Date.now(), games: {}, list: [], agg: {}, inj: {}, prev: null, done: 0, total: 0, err: '' };
    sc.when = Date.now(); sc.err = '';
    // lista de partidos terminados (los que ya están analizados conservan su citación)
    const old = new Map(sc.list.map(g => [g.id, g]));
    sc.list = evs.slice(0, SEAS_MAX).map(e => { const cs = e.competitions[0].competitors || [], me = cs.find(x => +x.team.id === tid), op = cs.find(x => +x.team.id !== tid), o = old.get(+e.id) || {}; return Object.assign(o, { id: +e.id, date: e.date, league: (e.league && e.league.slug) || 'all', lg: (e.league && (e.league.abbreviation || e.league.name)) || '', opp: op ? op.team.displayName : '', home: !!me && me.homeAway === 'home', gf: me ? +((me.score && (me.score.value ?? me.score)) || 0) : 0, ga: op ? +((op.score && (op.score.value ?? op.score)) || 0) : 0 }); });
    for (const id of Object.keys(sc.games)) if (!sc.list.some(g => g.id === +id)) delete sc.games[id];
    sc.total = sc.list.length; sc.done = Object.keys(sc.games).length;
    // los últimos partidos ya vienen con estadísticas: no se piden de nuevo
    for (const fx of c.fx) seasAbsorb(sc, fx);
    const pend = sc.list.filter(g => !sc.games[g.id]);
    await seasPool(pend, 3, async g => { const sm = await P.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/${g.league}/summary?event=${g.id}`); const e = (sched.events || []).find(x => +x.id === g.id); const fx = e && espnFixture(sm, e, tid); if (fx) seasAbsorb(sc, fx); else { sc.games[g.id] = 2; sc.done = Object.keys(sc.games).length; } seasTick(t); });
    // plantel de la web: lesionados y ausentes
    SEAS.step[k] = 'roster'; seasTick(t, true);
    if (force || !sc.rosterWhen || Date.now() - sc.rosterWhen > 6 * 3600e3) try {
      const j = await P.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/${api.league || 'all'}/teams/${tid}/roster`);
      sc.inj = {}; sc.roster = {};
      for (const a of j.athletes || []) {
        sc.roster[+a.id] = { n: a.displayName, num: +a.jersey || 0, age: a.age || 0, pos: (a.position && a.position.abbreviation) || '' };
        const inj = (a.injuries || [])[0]; if (!inj) continue;
        const d = inj.details || {};
        sc.inj[+a.id] = { st: inj.status || (inj.type && inj.type.description) || 'Out', t: d.type || '', d: d.detail || inj.shortComment || inj.longComment || '', date: inj.date || '', ret: d.returnDate || '' };
      }
      sc.rosterWhen = Date.now();
    } catch (e) { sc.err = e.message; }
    // temporada anterior: solo la campaña (1 consulta)
    SEAS.step[k] = 'prev'; seasTick(t, true);
    if (!sc.prev || sc.prev.year !== year - 1) try {
      const pj = await P.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/${tid}/schedule?season=${year - 1}`);
      const pev = seasDone(pj.events || []).filter(e => new Date(e.date).getFullYear() <= year);
      sc.prev = Object.assign(seasRecord(pev, tid), { year: year - 1, n: (pj.season && (pj.season.displayName || pj.season.name)) || String(year - 1) });
    } catch { sc.prev = { year: year - 1, pj: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, n: String(year - 1) }; }
    // historial de temporadas de los jugadores que están en tu plantel (1 consulta por jugador, guardado 7 días)
    SEAS.step[k] = 'hist'; seasTick(t, true);
    const mm = seasonMatch(t, sc), want = [...mm.keys()].filter(aid => { const h = SEAS.hist[aid]; return !h || Date.now() - h.when > HIST_TTL; });
    await seasPool(want, 3, async aid => { const j = await P.get(`https://site.web.api.espn.com/apis/common/v3/sports/soccer/${api.league || 'all'}/athletes/${aid}/stats`); SEAS.hist[aid] = { when: Date.now(), s: histParse(j) }; seasTick(t); });
    for (const aid of [...mm.keys()]) if (!SEAS.hist[aid]) SEAS.hist[aid] = { when: Date.now(), s: [] };
  } catch (e) { const sc = SEAS.cache[k]; if (sc) sc.err = e.message; }
  SEAS.busy[k] = false; SEAS.step[k] = ''; SEAS.mm.clear(); seasSave(); seasTick(t, true);
}
// recalcula la forma y refresca la pantalla como mucho cada 2 segundos mientras se analiza
function seasTick(t, now) {
  const dt = Date.now() - SEAS.tick; if (!now && dt < 2000) return; SEAS.tick = Date.now();
  SEAS.mm.clear(); try { lmComputeAdj(t); } catch { } RATE_GEN++; if (!now) seasSave(); lmRerender();
}
// jugador de la web → jugador de tu plantel (mismo criterio que "Plantel real")
function seasonMatch(t, sc) {
  const key = t.id + ':' + sc.when + ':' + sc.done + ':' + (S.names ? S.names.size : 0) + ':' + PD.roster(S.d, t).length;
  let mm = SEAS.mm.get(key); if (mm) return mm;
  const players = Object.entries(sc.agg).map(([id, s]) => ({ id: +id, name: s.n, num: s.num, pos: s.pos }));
  for (const [id, r] of Object.entries(sc.roster || {})) if (!sc.agg[id]) players.push({ id: +id, name: r.n, num: r.num, pos: r.pos });
  mm = sqMatch(t, players); SEAS.mm.clear(); SEAS.mm.set(key, mm); return mm;
}
// historial de temporadas de un jugador (respuesta de ESPN /athletes/{id}/stats): se buscan las tablas con "appearances" y "totalGoals"
function histParse(j) {
  const rows = [];
  const walk = (o, depth) => {
    if (!o || typeof o !== 'object' || depth > 8) return;
    if (Array.isArray(o.names) && Array.isArray(o.statistics)) {
      const ix = n => o.names.indexOf(n), iApp = ix('appearances'), iG = ix('totalGoals'), iA = ix('goalAssists'), iMin = ix('minutes'), iSub = ix('subIns');
      if (iApp < 0 && iG < 0) return;
      for (const s of o.statistics) {
        const st = s.stats || [], v = i => (i >= 0 ? +String(st[i] ?? '0').replace(/,/g, '') || 0 : 0);
        const y = +(s.season && s.season.year) || 0, n = (s.season && (s.season.displayName || s.season.name)) || String(y || ''); if (!y && !n) continue;
        rows.push({ y, n, team: s.teamSlug || (s.team && (s.team.displayName || s.team.abbreviation)) || '', app: v(iApp), g: v(iG), a: v(iA), min: v(iMin), sub: v(iSub) });
      }
      return;
    }
    for (const k of Object.keys(o)) if (k !== 'names' && k !== 'labels') walk(o[k], depth + 1);
  };
  try { walk(j, 0); } catch { }
  // una fila por temporada (si viene por competencia o por equipo, se suma)
  const by = new Map();
  for (const r of rows) { const k = r.y || r.n, z = by.get(k); if (!z) by.set(k, Object.assign({}, r)); else { z.app += r.app; z.g += r.g; z.a += r.a; z.min += r.min; z.sub += r.sub; if (r.team && !z.team.includes(r.team)) z.team += ', ' + r.team; } }
  return [...by.values()].filter(r => r.app || r.g || r.min).sort((a, b) => b.y - a.y || String(b.n).localeCompare(String(a.n)));
}
// ---- lo que usa lmComputeAdj ----
function seasonData(t) {
  if (!seasOn()) return null;
  const k = lk(t), sc = SEAS.cache[k], api = LM.map[k]; if (!sc || !api || sc.tid !== api.id) return null;
  const mm = seasonMatch(t, sc), list = sc.list;
  const absent = aid => { let n = 0, seen = false; for (const g of list) { if (!g.sq) continue; if (g.sq.includes(aid)) { seen = true; break; } n++; } return seen ? n : 0; };
  return { year: sc.year, done: sc.done, total: sc.total, agg: sc.agg, inj: sc.inj || {}, prev: sc.prev, hist: aid => (SEAS.hist[aid] || { s: [] }).s, mm, absent, running: !!SEAS.busy[k], step: SEAS.step[k] || '', err: sc.err, roster: sc.roster || {} };
}
const seasInjDays = inj => { const d = Date.parse(inj && inj.date || ''); return d ? Math.max(0, Math.round((Date.now() - d) / 86400e3)) : 0; };
// ---- UI: fichas de la temporada, goleadores ----
function seasonChips(t) {
  if (PREFS.lmProv !== 'espn') return '';
  const sd = seasonData(t), running = sd && sd.running;
  let h = `<label class="chip lmdeep" title="Analiza todos los partidos de la temporada, los lesionados y el historial de cada jugador (más consultas a ESPN, en segundo plano)"><input type="checkbox" id="lmDeep" ${PREFS.lmDeep ? 'checked' : ''}> Analizar toda la temporada</label>`;
  if (!sd) return h;
  if (sd.prev && sd.prev.pj) { const z = sd.prev, pp = (z.w * 3 + z.d) / z.pj, cur = LM.cache[lk(t)].season, cp = cur && cur.pj ? (cur.w * 3 + cur.d) / cur.pj : null; h += `<span class="chip" title="Campaña de la temporada anterior: ${z.pj} PJ, ${z.w} G ${z.d} E ${z.l} P, goles ${z.gf}-${z.ga}">📅 <span>Anterior</span> <b data-noi18n>${esc(z.n)}</b> · <b>${pp.toFixed(2).replace('.', ',')}</b> <span>pts/PJ</span>${cp != null && cur.pj >= 3 ? ` ${adjHtml(cp - pp >= 0.35 ? 2 : cp - pp >= 0.12 ? 1 : cp - pp <= -0.35 ? -2 : cp - pp <= -0.12 ? -1 : 0, null) || adjHtml(0, {})}` : ''}</span>`; }
  if (running) h += `<span class="chip lmprog"><span class="spin"></span> ${sd.step === 'games' ? `<span>Analizando la temporada…</span> <b data-noi18n>${sd.done}/${sd.total}</b>` : sd.step === 'roster' ? '<span>Buscando lesionados…</span>' : sd.step === 'prev' ? '<span>Temporada anterior…</span>' : '<span>Historial de los jugadores…</span>'}</span>`;
  else if (sd.done) h += `<span class="chip ok" title="Partidos de la temporada con estadísticas analizadas${sd.err ? ' · ' + esc(sd.err) : ''}">🔎 <b data-noi18n>${sd.done}</b> <span>partidos analizados</span></span>`;
  const inj = Object.entries(sd.inj); if (inj.length) h += `<span class="chip warn" title="${esc(inj.map(([aid, i]) => ((sd.roster[aid] || {}).n || (sd.agg[aid] || {}).n || '') + ': ' + (i.t || i.st)).join(' · '))}">🤕 <b data-noi18n>${inj.length}</b> <span>lesionados</span></span>`;
  return h;
}
function scorersHtml(t) {
  const sd = seasonData(t); if (!sd || !sd.done) return '';
  const rows = Object.entries(sd.agg).map(([id, s]) => ({ id: +id, s, x: sd.mm.get(+id) }));
  const short = n => esc((n || '').split(' ').slice(-1)[0]);
  const chip = (e, v, k) => `<span class="chip ${e.x ? 'ok' : ''}" title="${esc(e.s.n)} · ${e.s.app} PJ · ${e.s.g} G · ${e.s.a} A · ${e.s.min}′${e.x ? '' : ' · no está en tu plantel'}">${short(e.s.n)} <b data-noi18n>${v}</b>${k === 'g' && e.s.a ? `<small data-noi18n>+${e.s.a} A</small>` : ''}</span>`;
  const gs = rows.filter(e => e.s.g).sort((a, b) => b.s.g - a.s.g || b.s.a - a.s.a).slice(0, 6), as = rows.filter(e => e.s.a).sort((a, b) => b.s.a - a.s.a || b.s.g - a.s.g).slice(0, 5);
  if (!gs.length && !as.length) return '';
  return `<div class="lmtop">${gs.length ? `<span class="lab">⚽ Goleadores de la temporada</span>${gs.map(e => chip(e, e.s.g, 'g')).join('')}` : ''}${as.length ? `<span class="lab">🅰 Asistencias</span>${as.map(e => chip(e, e.s.a, 'a')).join('')}` : ''}</div>`;
}
