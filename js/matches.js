// ===================== Últimos partidos reales (proveedor modular: API-Football) =====================
// Busca el equipo por nombre (sirve para cualquier equipo del EDIT, también los que se agreguen después),
// trae sus últimos partidos con alineación, suplentes y puntaje de cada jugador, y permite:
//  - aplicar la formación y el 11 de ese partido;
//  - ver una valoración "por rendimiento" que se mueve un poco según cómo jugó cada uno (tope +4 / -3).
const LM_LS = 'edit21-matches-v2', LMMAP_LS = 'edit21-matches-map-v1', LMKEY_LS = 'edit21-apifootball-key', LMUSE_LS = 'edit21-apifootball-use';
const LM = { view: 'mine', cache: {}, map: {}, adj: new Map(), busy: 0, msg: '', err: '', cands: null, sel: {}, mirror: {}, open: false, search: false };
try { LM.cache = JSON.parse(localStorage.getItem(LM_LS) || '{}'); } catch { }
try { LM.map = JSON.parse(localStorage.getItem(LMMAP_LS) || '{}'); } catch { }
if (!PREFS.rateMode) PREFS.rateMode = 'base';
if (!PREFS.lmProv) PREFS.lmProv = 'espn';
// claves por proveedor ("espn:139"); lo guardado antes de v13 era de API-Football
for (const o of [LM.cache, LM.map]) for (const k of Object.keys(o)) if (/^\d+$/.test(k)) { o['apifootball:' + k] = o[k]; delete o[k]; }
const lk = t => PREFS.lmProv + ':' + t.id;
const lmSave = () => { try { localStorage.setItem(LM_LS, JSON.stringify(LM.cache)); localStorage.setItem(LMMAP_LS, JSON.stringify(LM.map)); } catch (e) { /* storage full: drop oldest teams */ const ks = Object.keys(LM.cache).sort((a, b) => LM.cache[a].when - LM.cache[b].when); for (const k of ks.slice(0, Math.ceil(ks.length / 3))) delete LM.cache[k]; try { localStorage.setItem(LM_LS, JSON.stringify(LM.cache)); } catch { } } };
const lmKey = () => { try { return localStorage.getItem(LMKEY_LS) || ''; } catch { return ''; } };
function lmUse(n) { const d = new Date().toISOString().slice(0, 10); let u; try { u = JSON.parse(localStorage.getItem(LMUSE_LS) || '{}'); } catch { u = {}; } if (u.d !== d) u = { d, n: 0 }; u.n += n || 0; try { localStorage.setItem(LMUSE_LS, JSON.stringify(u)); } catch { } return u.n; }

// ---- providers: each one exposes searchTeam(name, national) and lastMatches(apiTeamId, n) in the same shape ----
const PROVIDERS = {
  apifootball: {
    label: 'API-Football (api-sports.io)',
    async get(path, params) {
      const key = lmKey(); if (!key) throw new Error('NOKEY');
      const u = new URL('https://v3.football.api-sports.io/' + path);
      for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
      lmUse(1);
      let r; try { r = await fetch(u, { headers: { 'x-apisports-key': key } }); } catch { throw new Error('No se pudo conectar con API-Football (sin internet, o el navegador bloqueó la consulta).'); }
      if (!r.ok) throw new Error('API-Football respondió ' + r.status + '.');
      const j = await r.json(), e = j.errors;
      if (e && (Array.isArray(e) ? e.length : Object.keys(e).length)) {
        const o = Array.isArray(e) ? {} : e;
        if (o.token) throw new Error('La clave de API-Football no es válida.');
        if (o.requests || o.rateLimit) throw new Error('Se terminaron las consultas gratis de hoy (100 por día). Mañana se renuevan.');
        if (o.plan) throw new Error('Tu plan de API-Football no incluye estos datos: ' + o.plan);
        throw new Error('API-Football: ' + Object.values(o).join(' ') || JSON.stringify(e));
      }
      return j.response || [];
    },
    async searchTeam(name, national, hint) {
      const seen = new Set(), out = [];
      for (const q of TS.queries(name).filter(x => x.length >= 3)) {
        const res = await this.get('teams', { search: q });
        for (const x of res) if (!seen.has(x.team.id)) { seen.add(x.team.id); out.push({ id: x.team.id, name: x.team.name, country: x.team.country, logo: x.team.logo, national: !!x.team.national }); }
        if (out.length && TS.confident(Math.max(...out.map(c => TS.score(c, name, national, hint))))) break;
      }
      return out.map(c => Object.assign(c, { score: TS.score(c, name, national, hint) })).sort((a, b) => b.score - a.score);
    },
    async lastMatches(tid, n = 5) {
      let fx;
      try { fx = (await this.get('fixtures', { team: tid, last: n })).filter(f => /^(FT|AET|PEN)$/.test(f.fixture.status.short)); }
      catch (e) { if (/plan|Last|parameter/i.test(e.message)) throw new Error('El plan gratis de API-Football ya no deja pedir los últimos partidos (solo partidos de 2 o 3 días y sin búsqueda por equipo). Usá la fuente ESPN, que es gratis y no necesita clave.'); throw e; }
      if (!fx.length) return [];
      const full = await this.get('fixtures', { ids: fx.map(f => f.fixture.id).join('-') });
      return full.map(f => trimFixture(f, tid)).sort((a, b) => b.date.localeCompare(a.date));
    },
  },
};
PROVIDERS.espn = {
  label: 'ESPN (sin clave)',
  async get(url) {
    let r; try { r = await fetch(url); } catch { throw new Error('No se pudo conectar con ESPN (sin internet, o el navegador bloqueó la consulta).'); }
    if (!r.ok) throw new Error('ESPN respondió ' + r.status + '.');
    return r.json();
  },
  // "Como 1907" → "Como": se prueba el nombre entero, sin año, sin siglas, la palabra más larga… hasta dar con un candidato convincente
  async searchTeam(name, national, hint) {
    const seen = new Set(), out = [];
    for (const q of TS.queries(name)) {
      let j; try { j = await this.get('https://site.web.api.espn.com/apis/search/v2?limit=10&type=team&query=' + encodeURIComponent(q)); } catch (e) { if (!out.length) throw e; break; }
      const res = (j.results || []).filter(x => x.type === 'team').flatMap(x => x.contents || []);
      for (const x of res) {
        if (!((x.sport || 'soccer') === 'soccer' || /soccer|football/.test(x.uid || ''))) continue;
        const id = +((x.uid || '').match(/~t:(\d+)/) || [])[1]; if (!id || seen.has(id)) continue; seen.add(id);
        out.push({ id, name: x.displayName, country: x.subtitle || '', league: x.defaultLeagueSlug || '', logo: `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png`, national: /^fifa\.|\.world|friendly|nations|copa\.america|euro/.test(x.defaultLeagueSlug || '') || /national|selecci|FIFA/i.test(x.subtitle || '') });
      }
      if (out.length && TS.confident(Math.max(...out.map(c => TS.score(c, name, national, hint))))) break;
    }
    return out.map(c => Object.assign(c, { score: TS.score(c, name, national, hint) })).sort((a, b) => b.score - a.score);
  },
  async lastMatches(tid, n = 6) {
    const sc = await this.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/${tid}/schedule`);
    const evs = (sc.events || []).filter(e => { const c = e.competitions && e.competitions[0]; return c && c.status && c.status.type && c.status.type.completed; })
      .sort((a, b) => b.date.localeCompare(a.date));
    // temporada: resultados de todos los partidos terminados que trae el calendario
    const season = { pj: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
    for (const e of evs) { const cs = e.competitions[0].competitors || [], me = cs.find(c => +c.team.id === tid), op = cs.find(c => +c.team.id !== tid); if (!me || !op) continue; const a = +((me.score && (me.score.value ?? me.score)) || 0), b = +((op.score && (op.score.value ?? op.score)) || 0); season.pj++; season.gf += a; season.ga += b; a > b ? season.w++ : a < b ? season.l++ : season.d++; }
    const out = [];
    for (const e of evs.slice(0, n)) {
      try { const sm = await this.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/${(e.league && e.league.slug) || 'all'}/summary?event=${e.id}`); const fx = espnFixture(sm, e, tid); if (fx) out.push(fx); } catch { }
    }
    out.season = season;
    return out;
  },
  async squad(tid) {
    const api = Object.values(LM.map).find(a => a && a.id === tid) || {};
    const j = await this.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/${api.league || 'all'}/teams/${tid}/roster`);
    const G = { G: 'Goalkeeper', D: 'Defender', M: 'Midfielder', F: 'Attacker' };
    return (j.athletes || []).map(a => ({ id: +a.id, name: a.displayName, num: +a.jersey || 0, age: a.age || 0, pos: G[(a.position && a.position.abbreviation || '')[0]] || '', photo: a.headshot && a.headshot.href || '' }));
  },
};
const clockMin = s => { const m = String(s || '').match(/(\d+)'?\s*(?:\+\s*(\d+))?/); return m ? Math.min(120, +m[1] + (+m[2] || 0)) : null; };
function espnFixture(sm, e, tid) {
  const ro = (sm.rosters || []).find(r => +r.team.id === tid), other = (sm.rosters || []).find(r => +r.team.id !== tid);
  const comp = e.competitions[0], cs = comp.competitors || [], me = cs.find(c => +c.team.id === tid), op = cs.find(c => +c.team.id !== tid);
  if (!ro || !me || !op) return null;
  const gf = +((me.score && (me.score.value ?? me.score)) || 0), ga = +((op.score && (op.score.value ?? op.score)) || 0), res = gf > ga ? 1 : gf < ga ? -1 : 0;
  const mk = r => {
    const st = {}; for (const x of r.stats || []) st[x.name] = +x.value || 0;
    const subClock = (r.plays || []).filter(p => p.substitution).map(p => clockMin(p.clock && p.clock.displayValue)).filter(v => v != null);
    let min = r.starter ? 90 : 0;
    if (r.starter && r.subbedOut) min = subClock[0] ?? 70;
    if (!r.starter && r.subbedIn) min = Math.max(1, 90 - (subClock[0] ?? 75));
    const p = { id: +r.athlete.id, name: r.athlete.displayName, num: +r.jersey || 0, pos: (r.position && r.position.abbreviation) || '', place: +r.formationPlace || 0, min, cap: false,
      st: { g: st.totalGoals || 0, a: st.goalAssists || 0, sot: st.shotsOnTarget || 0, sh: st.totalShots || 0, sv: st.saves || 0, gc: st.goalsConceded || 0, yc: st.yellowCards || 0, rc: st.redCards || 0, og: st.ownGoals || 0, fc: st.foulsCommitted || 0, fs: st.foulsSuffered || 0 } };
    p.rt = min ? matchRating(p, { res, ga, gf }) : null;
    return p;
  };
  const all = (ro.roster || []).map(mk), xi = all.filter((p, i) => (ro.roster[i].starter)).sort((a, b) => (a.place || 99) - (b.place || 99)), subs = all.filter((p, i) => !ro.roster[i].starter);
  return { id: +e.id, date: e.date, league: (e.league && (e.league.abbreviation || e.league.name)) || '', home: me.homeAway === 'home', opp: op.team.displayName, oppLogo: (op.team.logos && op.team.logos[0] && op.team.logos[0].href) || '', gf, ga, formation: espnFormation(xi), xi, subs, src: 'espn' };
}
// puntaje propio (escala 0-10 como en las webs): resultado, goles, asistencias, tiros al arco, atajadas, tarjetas…
function matchRating(p, m) {
  const c = p.pos.toUpperCase(), grp = c === 'G' ? 'gk' : /^(CD|SW|LB|RB|LWB|RWB|D)/.test(c) ? 'df' : /^(F|CF|ST|LF|RF|LW|RW|SS)/.test(c) ? 'fw' : 'mf', s = p.st;
  let r = 6.4 + m.res * 0.3;
  r += s.g * (grp === 'fw' ? 0.9 : grp === 'mf' ? 1.1 : 1.3) + s.a * 0.7 + s.sot * 0.15 + (s.sh - s.sot) * 0.02 + s.fs * 0.05 - s.fc * 0.06 - s.yc * 0.25 - s.rc * 1.2 - s.og * 0.9;
  if (grp === 'gk') r += s.sv * 0.28 - m.ga * 0.3 + (m.ga === 0 ? 0.6 : 0);
  if (grp === 'df') r += (m.ga === 0 ? 0.4 : 0) - Math.max(0, m.ga - 1) * 0.15;
  if (p.min < 45) r = 6.4 + (r - 6.4) * Math.max(0.5, p.min / 45); // pocos minutos: puntaje más cerca del promedio
  return Math.round(Math.max(3, Math.min(10, r)) * 10) / 10;
}
// fila / rol / lado a partir de la posición de ESPN (G, CD-L, LB, DM, CM-R, AM, LW, F…)
function espnSlot(code) {
  const c = (code || '').toUpperCase(), side = /-L$|^L/.test(c) ? -1 : /-R$|^R/.test(c) ? 1 : 0;
  if (c === 'G' || c === 'GK') return { row: 0, role: 0, side: 0 };
  if (/^(CD|SW|CB)/.test(c)) return { row: 1, role: 1, side };
  if (/^(LB|LWB)$/.test(c)) return { row: 1, role: 2, side: -2 };
  if (/^(RB|RWB)$/.test(c)) return { row: 1, role: 3, side: 2 };
  if (/^DM/.test(c)) return { row: 2, role: 4, side };
  if (/^CM/.test(c)) return { row: 3, role: 5, side };
  if (c === 'LM') return { row: 3, role: 6, side: -2 };
  if (c === 'RM') return { row: 3, role: 7, side: 2 };
  if (/^AM/.test(c)) return { row: 4, role: 8, side };
  if (/^(LW|LF)$/.test(c)) return { row: 4, role: 9, side: -2 };
  if (/^(RW|RF)$/.test(c)) return { row: 4, role: 10, side: 2 };
  if (c === 'SS') return { row: 5, role: 11, side };
  if (/^(F|CF|ST)/.test(c)) return { row: 5, role: 12, side };
  return { row: 3, role: 5, side: 0 };
}
function espnFormation(xi) {
  let d = 0, mid = 0, am = 0, wing = 0, att = 0;
  for (const p of xi) { const x = espnSlot(p.pos); if (x.row === 1) d++; else if (x.row === 2 || x.row === 3) mid++; else if (x.role === 8) am++; else if (x.role === 9 || x.role === 10) wing++; else if (x.row === 5) att++; }
  return (am ? [d, mid, am + wing, att] : [d, mid, att + wing]).filter(Boolean).join('-');
}
const PROVIDER = () => PROVIDERS[PREFS.lmProv] || PROVIDERS.espn;
// pista para la búsqueda: el país del equipo en el EDIT (ISO-3 y nombre), que en la web aparece como liga ("ita.1", "Italian Serie A")
const lmHint = t => { if (!t || isNat(t)) return null; const row = (typeof T_ !== 'undefined' && T_.countries || []).find(c => c[0] === tget(t, 'country')); return row ? TS.hint(row[2], row[1]) : null; };
function trimFixture(fx, tid) {
  const side = fx.teams.home.id === tid ? 'home' : 'away', other = side === 'home' ? 'away' : 'home', opp = fx.teams[other];
  const lu = (fx.lineups || []).find(l => l.team.id === tid);
  const ps = ((fx.players || []).find(p => p.team.id === tid) || {}).players || [];
  const st = new Map(ps.map(p => [p.player.id, (p.statistics && p.statistics[0]) || {}]));
  const mk = e => { const p = e.player, all = st.get(p.id) || {}, g = all.games || {}, gl = all.goals || {}; return { id: p.id, name: p.name, num: p.number, pos: p.pos, grid: p.grid, min: g.minutes || 0, rt: g.rating ? +g.rating : null, cap: !!g.captain, st: { g: gl.total || 0, a: gl.assists || 0 } }; };
  return { id: fx.fixture.id, date: fx.fixture.date, league: fx.league && fx.league.name, home: side === 'home', opp: opp.name, oppLogo: opp.logo, gf: fx.goals[side], ga: fx.goals[other], formation: lu && lu.formation, xi: lu ? lu.startXI.map(mk) : [], subs: lu ? lu.substitutes.map(mk) : [] };
}

// ---- fetch for one team (2-3 requests; cached 6 h) ----
async function lmFetch(t, force, pick) {
  const P = PROVIDER(); LM.err = ''; LM.busy = t.id; lmRerender();
  try {
    let api = pick || LM.map[lk(t)];
    if (!api) {
      const c = await P.searchTeam(tget(t, 'name'), isNat(t), lmHint(t));
      if (!c.length) throw new Error('No encontré "' + tget(t, 'name') + '" en la web. Probá buscarlo con otro nombre.');
      api = c[0]; LM.cands = c.slice(0, 8);
    }
    LM.map[lk(t)] = api;
    const c0 = LM.cache[lk(t)];
    if (force || !c0 || c0.api.id !== api.id || Date.now() - c0.when > 6 * 3600e3) {
      const fx = await P.lastMatches(api.id, PREFS.lmProv === 'espn' ? 6 : 5);
      const season = fx.season || (() => { const z = { pj: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }; for (const f of fx) { z.pj++; z.gf += f.gf; z.ga += f.ga; f.gf > f.ga ? z.w++ : f.gf < f.ga ? z.l++ : z.d++; } return z; })();
      LM.cache[lk(t)] = { api, when: Date.now(), fx: [...fx], season };
    }
    if (api.logo && !BADGES.url.has(t.id) && !BADGES.online.get(t.id)) { BADGES.online.set(t.id, api.logo); saveOnlineBadges(); }
    lmSave(); LM.sel[t.id] = 0; lmComputeAdj(t); RATE_GEN++;
    if (typeof seasonFetch === 'function') seasonFetch(t, force || (c0 && c0.api.id !== api.id)); // toda la temporada, lesiones e historial: en segundo plano
    const n = LM.cache[lk(t)].fx.length;
    LM.msg = n ? `${n} partido${n > 1 ? 's' : ''} de ${api.name}.` : `API-Football no tiene partidos terminados recientes de ${api.name}.`;
  } catch (e) { LM.err = e.message === 'NOKEY' ? 'Falta la clave de API-Football.' : e.message; }
  LM.busy = 0; lmRerender();
}
let lmRerender = () => { };

// ---- name matching (API lineup names like "L. Messi" vs. full names in the game) ----
function nameScore(api, full, apiNum, num) {
  const a = normTxt(api).split(' ').filter(Boolean), b = normTxt(full).split(' ').filter(Boolean); if (!a.length || !b.length) return 0;
  const bt = new Set(b), aLast = a[a.length - 1]; let s = 0;
  if (a.join(' ') === b.join(' ')) s += 6;
  if (bt.has(aLast)) s += 3; else if (b.some(x => x.length > 3 && aLast.length > 3 && (x.startsWith(aLast) || aLast.startsWith(x)))) s += 2;
  const aw = a.filter(x => x.length > 1); if (aw.length > 1 && aw.every(x => bt.has(x))) s += 2;
  if (s < 2) return 0; // sin coincidencia de apellido no alcanza con la inicial o el dorsal
  const ini = a.length > 1 ? a[0][0] : ''; if (ini && b[0][0] === ini) s += 1;
  if (apiNum && apiNum === num) s += 2;
  return s;
}
function lmMatch(t, fx) {
  const roster = PD.roster(S.d, t).map(x => ({ x, n: playerName(x.pid) }));
  const people = [...fx.xi, ...fx.subs], pairs = [];
  for (const p of people) for (const r of roster) { const s = nameScore(p.name, r.n, p.num, r.x.number); if (s >= 3) pairs.push([s, p.id, r.x]); }
  pairs.sort((a, b) => b[0] - a[0]);
  const out = new Map(), used = new Set();
  for (const [, aid, x] of pairs) { if (out.has(aid) || used.has(x.slot)) continue; out.set(aid, x); used.add(x.slot); }
  return out;
}
// where else is an unmatched player in the game database (informative)
function lmElsewhere(p) {
  if (!S.names.size) return null;
  for (const [id, v] of S.names) if (nameScore(p.name, v.name, 0, 0) >= 4 && teamOf.has(id)) { const c = clubOf(id); return c ? tget(c, 'name') : null; }
  return null;
}

// ---- forma: rendimiento reciente + temporada + goles + equipo + historial + lesiones, ajustado por edad y con topes ----
// Cada componente está en puntos de valoración; el detalle de cada jugador se ve con el botón ⓘ (lmWhy) y la explicación
// general en "Cómo se calcula la forma". Lo que vale para todos: la exigencia sube con la valoración y el valor de mercado.
const GA_EXPECT = { gk: 0, df: 0.07, mf: 0.25, fw: 0.55 }, GA_K = { gk: 0, df: 2, mf: 1.4, fw: 1.4 };
const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function lmComputeAdj(t) {
  const c = LM.cache[lk(t)]; if (!c) return;
  const acc = new Map(), aidOf = new Map();
  c.fx.forEach((fx, k) => {
    const w0 = [1, .85, .72, .6, .5, .42][k] || .35, mm = lmMatch(t, fx);
    for (const p of [...fx.xi, ...fx.subs]) {
      const x = mm.get(p.id); if (!x) continue; if (!aidOf.has(x.pid)) aidOf.set(x.pid, p.id);
      if (p.rt == null || p.min < 10) continue;
      const w = w0 * Math.min(1, p.min / 60), a = acc.get(x.pid) || { s: 0, w: 0, n: 0, last: [], min: 0, g: 0, as: 0 };
      a.s += p.rt * w; a.w += w; a.n++; a.last.push(p.rt); a.min += p.min; a.g += (p.st && p.st.g) || 0; a.as += (p.st && p.st.a) || 0; acc.set(x.pid, a);
    }
  });
  const sd = typeof seasonData === 'function' ? seasonData(t) : null;
  // con la temporada analizada entran también los que no jugaron los últimos partidos (lesionados, suplentes): la forma los refleja
  if (sd) for (const [aid, x] of sd.mm) { if (!acc.has(x.pid)) { if (!sd.agg[aid] && !sd.inj[aid]) continue; acc.set(x.pid, { s: 0, w: 0, n: 0, last: [], min: 0, g: 0, as: 0 }); } if (!aidOf.has(x.pid)) aidOf.set(x.pid, aid); }
  const se = c.season, ppg = se && se.pj ? (se.w * 3 + se.d) / se.pj : null;
  const prevPpg = sd && sd.prev && sd.prev.pj >= 5 ? (sd.prev.w * 3 + sd.prev.d) / sd.prev.pj : null;
  const done = sd ? sd.done : 0;
  for (const [pid, a] of acc) {
    // la exigencia se mide contra la media original del parche (no contra la ya modificada), así no se retroalimenta
    const b0 = pInfoBase(pid) || { r: 75, pos: 5 }, orig = S.names.get(pid), b = orig && orig.r ? Object.assign({}, b0, { r: orig.r }) : b0, age = b.a || 26, grp = POS_GRP[b.pos] || 'mf';
    const value = (playerValueBase(pid) || { v: 1 }).v, avg = a.w ? a.s / a.w : null, rel = Math.min(1, a.w / 2.5);
    // lo que se espera de él: más valoración y más valor de mercado = más exigencia
    const expect = 6.6 + (b.r - 75) * 0.02 + Math.min(0.3, Math.log10(1 + value) * 0.12);
    // 1) últimos partidos: puntaje contra lo esperado (pesan más el más reciente y los minutos)
    const perf = avg == null ? 0 : (avg - expect) * 2.2 * rel;
    // 2) temporada completa: puntaje promedio y cuántos minutos juega de los posibles
    const aid = aidOf.get(pid), s = sd && aid != null ? sd.agg[aid] : null;
    let season = 0, share = null, sAvg = null, sPerf = 0, sMin = 0;
    if (s && done >= 3) {
      const rts = s.r.filter(e => e[2] >= 20); sAvg = rts.length ? rts.reduce((z, e) => z + e[1], 0) / rts.length : null;
      share = Math.min(1, s.min / (done * 90));
      sPerf = sAvg == null ? 0 : clampN((sAvg - expect) * 1.3 * Math.min(1, s.app / 8), -1.5, 1.5);
      sMin = done >= 5 ? (share >= 0.7 ? 0.3 : share >= 0.4 ? 0.1 : share >= 0.2 ? -0.1 : s.app ? -0.4 : -0.6) : 0;
      season = sPerf + sMin;
    }
    // 3) goles y asistencias cada 90' contra lo normal para su puesto (con la temporada si hay 270'+, si no con los últimos partidos)
    const useS = !!(s && s.min >= 270), gMin = useS ? s.min : a.min, gG = useS ? s.g : a.g, gA = useS ? s.a : a.as;
    const ga90 = gMin ? (gG + gA * 0.7) * 90 / gMin : 0, gRel = useS ? Math.min(1, gMin / 900) : rel;
    const goals = grp === 'gk' ? 0 : clampN((ga90 - GA_EXPECT[grp]) * GA_K[grp], -0.5, 1.5) * gRel;
    // 4) equipo: puntos por partido de la temporada y comparación con la anterior
    const team = ppg == null ? 0 : clampN((ppg - 1.4) * 0.5, -0.8, 0.8) + (prevPpg == null || se.pj < 3 ? 0 : clampN((ppg - prevPpg) * 0.4, -0.4, 0.4));
    // 5) historial: lo que hizo en temporadas anteriores modera la actual (una racha de 3 partidos no lo vuelve crack) y premia al titular de siempre
    const hs = sd && aid != null ? sd.hist(aid).filter(h => h.y && h.y < sd.year && (h.app || h.min)).slice(0, 3) : [];
    let hist = 0, hGa90 = null, hApp = null, hBase = null;
    if (hs.length) {
      const tot = hs.reduce((z, h, i) => { const w = [1, .7, .5][i]; z.g += (h.g + h.a * 0.7) * w; z.m += (h.min || h.app * 75) * w; z.app += h.app * w; z.w += w; return z; }, { g: 0, m: 0, app: 0, w: 0 });
      hGa90 = tot.m ? tot.g * 90 / tot.m : 0; hApp = tot.app / tot.w;
      if (grp !== 'gk') { hBase = clampN((hGa90 - GA_EXPECT[grp]) * GA_K[grp], -0.5, 1.5) * Math.min(1, tot.m / (tot.w * 900)); hist = clampN((hBase - goals) * 0.35, -0.6, 0.6); }
      if (hApp >= 25 && share != null && share >= 0.6) hist += 0.2;
    }
    // 6) lesión o ausencia: lesionado baja (más si es larga); duda baja menos; habitual que faltó a las últimas 3 citaciones, baja
    let inj = 0, injury = null, absent = 0;
    if (sd && aid != null) {
      injury = sd.inj[aid] || null; absent = sd.absent(aid);
      if (injury) { const st = String(injury.st).toLowerCase(), days = typeof seasInjDays === 'function' ? seasInjDays(injury) : 0; inj = /doubt|question|day|probable|duda/.test(st) ? -0.5 : days >= 60 ? -1.5 : -1; }
      else if (absent >= 3 && s && s.app >= 3) inj = -1;
    }
    let total = perf + season + goals + team + hist + inj;
    // edad: los jóvenes suben más rápido y bajan menos; los veteranos al revés
    const up = age <= 21 ? 1.3 : age <= 29 ? 1 : age <= 32 ? 0.8 : 0.6, down = age <= 21 ? 0.9 : age <= 29 ? 1 : age <= 32 ? 1.15 : 1.3, mul = total >= 0 ? up : down;
    total *= mul;
    const capUp = age <= 23 ? 4 : age >= 33 ? 2 : 3, capDown = age >= 33 ? -4 : -3;
    const adj = clampN(Math.round(total), capDown, capUp);
    const r2 = v => Math.round(v * 100) / 100;
    LM.adj.set(pid, { adj, avg: avg == null ? null : r2(avg), expect: r2(expect), n: a.n, last: a.last, g: a.g, as: a.as, min: a.min, ppg, age, grp, value,
      parts: { perf: r2(perf), season: r2(season), sPerf: r2(sPerf), sMin: r2(sMin), goals: r2(goals), team: r2(team), hist: r2(hist), inj: r2(inj), mul, raw: r2(total), capUp, capDown },
      s: s ? { app: s.app, st: s.st, min: s.min, g: s.g, a: s.a, yc: s.yc, rc: s.rc, avg: sAvg == null ? null : r2(sAvg), share: share == null ? null : Math.round(share * 100), games: done } : null,
      ga90: r2(ga90), gaExp: GA_EXPECT[grp], useS, prevPpg, injury, absent, hist: hs.map(h => ({ y: h.y, n: h.n, team: h.team, app: h.app, g: h.g, a: h.a, min: h.min })), hGa90: hGa90 == null ? null : r2(hGa90), hApp: hApp == null ? null : Math.round(hApp), deep: !!sd });
  }
}
function lmRestoreAdj() { if (!S.ix) return; LM.adj.clear(); for (const k of Object.keys(LM.cache)) { if (!k.startsWith(PREFS.lmProv + ':')) continue; const t = S.ix.teamById.get(+k.split(':')[1]); if (t) lmComputeAdj(t); } RATE_GEN++; }

// ---- lineup grid ("fila:columna") → PES formation (roles + positions) ----
function lmFormEspn(fx, mirror) {
  if (fx.xi.length !== 11) return null;
  const sl = fx.xi.map(p => ({ p, ...espnSlot(p.pos) })), gk = sl.find(e => e.row === 0); if (!gk) return null;
  const byRow = r => sl.filter(e => e.row === r && e !== gk);
  let r4 = byRow(4), r5 = byRow(5);
  // extremos sin enganche en el medio: juegan en la línea de ataque (4-3-3)
  if (r4.length && r4.every(e => e.role === 9 || e.role === 10) && r5.length) { r5 = [...r5, ...r4]; r4 = []; }
  const rows = [byRow(1), byRow(2), byRow(3), r4, r5].filter(r => r.length);
  const R = rows.length, out = [];
  rows.forEach((row, ri) => {
    row.sort((a, b) => (mirror ? -1 : 1) * (a.side - b.side) || (a.p.place - b.p.place));
    const n = row.length, isDef = ri === 0, isAtt = ri === R - 1;
    const xs = n === 1 ? [52] : n === 2 ? [40, 64] : n === 3 ? (isAtt ? [18, 52, 86] : isDef ? [31, 52, 73] : [28, 52, 76]) : Array.from({ length: n }, (_, k) => Math.round(15 + k * 74 / (n - 1)));
    const y = R === 1 ? 10 : Math.round(10 + ri * 33 / (R - 1));
    row.forEach((e, k) => {
      let role = e.role, x = xs[k];
      if (mirror) { if (role === 2) role = 3; else if (role === 3) role = 2; else if (role === 6) role = 7; else if (role === 7) role = 6; else if (role === 9) role = 10; else if (role === 10) role = 9; }
      const yy = y + ([2, 3].includes(role) ? 2 : role === 4 ? -3 : [9, 10].includes(role) && isAtt ? -5 : 0);
      out.push({ p: e.p, role, y: Math.max(6, Math.min(46, yy)), x });
    });
  });
  return { gk: gk.p, out };
}
function lmForm(fx, mirror) {
  if (fx.src === 'espn' || fx.xi.every(p => !p.grid)) return lmFormEspn(fx, mirror);
  const xi = fx.xi.map(p => ({ p, g: (p.grid || '').split(':').map(Number) }));
  if (xi.length !== 11 || xi.some(e => !(e.g[0] >= 1 && e.g[1] >= 1))) return null;
  const gk = xi.find(e => e.g[0] === 1) || xi.find(e => e.p.pos === 'G'); if (!gk) return null;
  const rows = [...new Set(xi.filter(e => e !== gk).map(e => e.g[0]))].sort((a, b) => a - b).map(r => xi.filter(e => e !== gk && e.g[0] === r).sort((a, b) => a.g[1] - b.g[1]));
  if (mirror) rows.forEach(r => r.reverse());
  const R = rows.length, out = [];
  rows.forEach((row, ri) => {
    const n = row.length, isDef = ri === 0, isAtt = ri === R - 1 && R > 1, M = R - 2, mi = ri - 1;
    const xs = n === 1 ? [52] : n === 2 ? [40, 64] : n === 3 ? (isAtt ? [18, 52, 86] : isDef ? [31, 52, 73] : [28, 52, 76]) : Array.from({ length: n }, (_, k) => Math.round(15 + k * 74 / (n - 1)));
    let y = R === 1 ? 10 : Math.round(10 + ri * 33 / (R - 1));
    row.forEach((e, k) => {
      const outer = k === 0 || k === n - 1, x = xs[k], left = x < 52;
      let role, yy = y;
      if (isDef) { role = n >= 4 && outer ? (left ? 2 : 3) : 1; if (role !== 1) yy += 2; }
      else if (isAtt) { if (n >= 3 && outer) { role = left ? 9 : 10; yy -= 5; } else role = 12; }
      else if (M === 1) { role = n >= 4 && outer ? (left ? 6 : 7) : (n === 3 && k === 1) || (n === 5 && k === 2) ? 4 : 5; if (role === 4) yy -= 6; }
      else if (mi === 0) { role = n >= 4 && outer ? (left ? 6 : 7) : 4; if (role === 4) yy -= 3; }
      else if (mi === M - 1) { role = n >= 3 && outer ? (left ? 9 : 10) : 8; yy += role === 8 ? 2 : 3; }
      else role = n >= 4 && outer ? (left ? 6 : 7) : 5;
      out.push({ p: e.p, role, y: Math.max(6, Math.min(46, yy)), x });
    });
  });
  return { gk: gk.p, out };
}
// auto-detect left/right using the positions the game already knows (LI/MI/EI vs LD/MD/ED)
function lmAutoMirror(t, fx) {
  const mm = lmMatch(t, fx), f = lmForm(fx, false); if (!f) return false;
  let v = 0;
  for (const e of f.out) { const x = mm.get(e.p.id), i = x && pInfoBase(x.pid); if (!i || e.x === 52) continue; const L = [2, 6, 9].includes(i.pos), Rr = [3, 7, 10].includes(i.pos); if (!L && !Rr) continue; v += (L === e.x < 52) ? 1 : -1; }
  return v < 0;
}
function lmMirror(t, fx) { const k = t.id + ':' + fx.id; if (!(k in LM.mirror)) LM.mirror[k] = fx.src === 'espn' ? false : lmAutoMirror(t, fx); return LM.mirror[k]; }

// plan: qué jugador de tu plantel va en cada puesto de la formación del partido (sin escribir nada)
function lmPlan(t, fx) {
  const f = lmForm(fx, lmMirror(t, fx)); if (!f) return null;
  const mm = lmMatch(t, fx), roster = PD.roster(S.d, t), used = new Set();
  const ents = [{ p: f.gk, role: 0, x: 52, y: 3, grp: 'gk' }, ...f.out.map(e => ({ ...e, grp: POS_GRP[e.role] }))];
  // primero los que están en el plantel, después los reemplazos (así un reemplazo no le quita el lugar a un titular real)
  ents.forEach(e => { const x = e.p && mm.get(e.p.id); if (x && !used.has(x.slot)) { used.add(x.slot); e.slot = x.slot; e.matched = true; } });
  ents.forEach(e => {
    if (e.slot != null) return;
    const c = roster.filter(r => !used.has(r.slot)).map(r => ({ r, i: pInfo(r.pid) })).sort((a, b) => ((b.i && POS_GRP[b.i.pos] === e.grp) - (a.i && POS_GRP[a.i.pos] === e.grp)) || ((b.i ? b.i.r : 0) - (a.i ? a.i.r : 0)))[0];
    if (c) { used.add(c.r.slot); e.slot = c.r.slot; e.replaced = true; }
  });
  if (ents.some(e => e.slot == null)) return null;
  const chosen = ents.map(e => e.slot);
  const subs = fx.subs.filter(p => p.min > 0).map(p => mm.get(p.id)).concat(fx.subs.filter(p => !p.min).map(p => mm.get(p.id))).filter(x => x && !used.has(x.slot)).map(x => x.slot);
  // cambios contra el 11 que tenés ahora
  const cur = t.tacticsBase != null ? getOrder(t).slice(0, 11) : [], fm = t.tacticsBase != null ? readForm(t, S.fplan, 0) : null;
  ents.forEach(e => { const k = cur.indexOf(e.slot); e.diff = k < 0 ? 'in' : (k === 0 ? 0 : fm.roles[k]) !== e.role ? 'moved' : 'same'; e.fromRole = k < 0 ? null : (k === 0 ? 0 : fm.roles[k]); });
  const out = cur.filter(s => !chosen.includes(s));
  return { f, mm, ents, chosen, subs, out, filled: ents.filter(e => e.replaced).map(e => e.p ? e.p.name : '?') };
}
function lmApply(t, fx) {
  const P = lmPlan(t, fx); if (!P) { toast('Ese partido no trae la ubicación de los jugadores o tu plantel no tiene 11.', 5000); return; }
  const { f, mm, chosen, subs, filled } = P, roster = PD.roster(S.d, t), n = roster.length;
  const old = getOrder(t), order = [...chosen, ...subs, ...old.filter(v => !chosen.includes(v) && !subs.includes(v))];
  if (order.length !== 40 || new Set(order).size !== 40) { toast('No se pudo armar el orden del plantel.'); return; }
  const tb = t.tacticsBase, best = () => chosen.slice(1).filter(s => s < n).map(s => roster.find(r => r.slot === s)).sort((a, b) => ((pInfo(b.pid) || { r: 0 }).r) - ((pInfo(a.pid) || { r: 0 }).r))[0];
  const capApi = [...fx.xi].find(p => p.cap), capX = capApi && mm.get(capApi.id);
  edit('Formación del último partido (' + (fx.formation || '') + ') en ' + tget(t, 'name'), 't' + t.id, regT(t), () => {
    setOrder(t, order);
    for (const v of [0, 1, 2]) { const fm = readForm(t, S.fplan, v); f.out.forEach((e, i) => { fm.roles[i + 1] = e.role; fm.pos[i + 1] = [e.y, e.x]; }); fm.pos[0] = [3, 52]; writeForm(t, S.fplan, v, fm); }
    if (capX && chosen.includes(capX.slot)) S.d[tb + CAPT] = capX.slot;
    else if (!chosen.includes(S.d[tb + CAPT])) { const b = best(); if (b) S.d[tb + CAPT] = b.slot; }
    const b = best(); for (let k = 0; k < NTAKERS; k++) { const s = S.d[tb + TAKERS + k]; if (s !== 255 && !chosen.slice(1).includes(s) && b) S.d[tb + TAKERS + k] = b.slot; }
  });
  FLUID.set(fluidKey(t), false); S.fvar = 0; S.fsel = null; RATE_GEN++;
  toast(`Formación ${fx.formation || ''} del partido contra ${fx.opp} aplicada al plan ${S.fplan + 1}.` + (filled.length ? (filled.length === 1 ? ` ${filled[0]} no está en tu plantel: puse al mejor disponible de su línea.` : ` ${filled.length} no están en tu plantel: puse a los mejores disponibles de su línea.`) : ''), 6500, ['Deshacer', undo]);
}

// ---- UI (Formación tab) ----
const fmtDate = s => { try { return new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }); } catch { return ''; } };
const rtCls = r => r == null ? '' : r >= 8 ? 'r8' : r >= 7.3 ? 'r7' : r >= 6.5 ? 'r6' : 'r5';
function lastMatchCard(t) {
  const espn = PREFS.lmProv !== 'apifootball', c = LM.cache[lk(t)], key = espn ? 'espn' : lmKey(), api = LM.map[lk(t)], busy = LM.busy === t.id;
  const provSeg = `<div class="seg" id="lmProv" title="De dónde salen los partidos"><button type="button" data-v="espn" aria-pressed="${espn}">ESPN (sin clave)</button><button type="button" data-v="apifootball" aria-pressed="${!espn}">API-Football</button></div>`;
  const hasAdj = PD.roster(S.d, t).some(x => LM.adj.has(x.pid));
  const modeSeg = `<div class="seg" id="lmMode" title="Valoración que se muestra en todo el editor"><button type="button" data-v="base" aria-pressed="${PREFS.rateMode !== 'form'}">Actual</button><button type="button" data-v="form" aria-pressed="${PREFS.rateMode === 'form'}">Por rendimiento</button></div>`;
  if (!LM.open) return `<div class="lmbar"><button class="btn small" type="button" id="lmOpen">⚽ Últimos partidos reales</button>${c ? `<span class="note">${esc(c.api.name)} · ${c.fx.length} partidos guardados${hasAdj ? ' · forma calculada' : ''}</span>` : '<span class="note">Formación, 11, puntajes y forma de los partidos de verdad</span>'}</div>`;
  let body = `<div class="row"><span class="lab">📡 Fuente</span>${provSeg}<span class="note">${espn ? 'ESPN: gratis, sin clave, cubre la liga argentina, Europa, Brasil, MLS y selecciones. El puntaje de cada jugador lo calcula el editor con sus estadísticas del partido.' : 'API-Football: trae puntajes propios, pero el plan gratis ya no deja pedir los últimos partidos.'}</span></div>`;
  if (!key) body += `<div class="lmkey"><p class="note">Los datos salen de <b>API-Football</b> (gratis: 100 consultas por día, alcanza para unos 40 equipos). Creá una cuenta en <b>dashboard.api-football.com</b>, copiá tu clave ("API Key") y pegala acá. Se guarda solo en esta PC.</p>
    <div class="row"><input type="password" id="lmKeyIn" placeholder="Pegá tu clave de API-Football" autocomplete="off" style="max-width:340px"><button class="btn primary small" type="button" id="lmKeySave">Guardar clave</button></div></div>`;
  else if (!c && !busy) body += `<div class="row"><button class="btn primary" type="button" id="lmGo">Buscar los últimos partidos de ${esc(tget(t, 'name'))}</button><span class="note">${espn ? 'Trae los últimos 6 partidos y la campaña de la temporada.' : 'Usa 3 consultas.'} Queda guardado 6 horas.</span></div>`;
  if (busy) body += '<div class="lmload"><span class="spin"></span> Buscando partidos…</div>';
  if (LM.err) body += `<div class="warnbox">${esc(LM.err)}</div>`;
  if (key && (LM.search || (api && LM.cands && LM.cands.length > 1 && !c))) body += `<div class="lmsearch"><div class="row"><input type="search" id="lmQ" placeholder="Nombre del equipo en la web (ej. Boca Juniors)" value="${esc(LM.q || tget(t, 'name'))}" style="max-width:320px"><button class="btn small" type="button" id="lmQGo">Buscar</button></div>
    ${LM.cands ? `<div class="lmcands">${LM.cands.map((x, i) => `<button type="button" class="lmcand ${api && api.id === x.id ? 'on' : ''}" data-cand="${i}">${x.logo ? `<img src="${esc(x.logo)}" alt="">` : ''}<span>${esc(x.name)}<small>${esc(x.country || '')}${x.national ? ' · selección' : ''}</small></span></button>`).join('')}</div>` : ''}</div>`;
  if (c) {
    const i = Math.min(LM.sel[t.id] || 0, c.fx.length - 1), fx = c.fx[i];
    body += `<div class="row lmteam">${c.api.logo ? `<img src="${esc(c.api.logo)}" alt="" class="lmlogo" onerror="this.remove()">` : ''}<b>${esc(c.api.name)}</b><span class="note">${esc(c.api.country || '')}</span>
      <button class="btn ghost small" type="button" id="lmChange">✏️ ¿No es este equipo? Cambiar</button><button class="btn ghost small" type="button" id="lmRefresh" ${busy ? 'disabled' : ''}>🔄 Actualizar</button><span class="note">🕒 Actualizado ${new Date(c.when).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}${espn ? '' : ' · consultas hoy: ' + lmUse(0) + '/100'}</span></div>`;
    const seasChips = typeof seasonChips === 'function' ? seasonChips(t) : '';
    if (c.season && c.season.pj) { const z = c.season, ppg = (z.w * 3 + z.d) / z.pj; body += `<div class="lmseason"><span class="lab">🗓 Temporada</span><span class="chip" title="Partidos jugados">🗓 <b>${z.pj}</b> PJ</span><span class="chip ok" title="Ganados">✅ <b>${z.w}</b> G</span><span class="chip" title="Empatados">🤝 <b>${z.d}</b> E</span><span class="chip warn" title="Perdidos">❌ <b>${z.l}</b> P</span><span class="chip" title="Goles a favor y en contra">⚽ <b>${z.gf}</b>-<b>${z.ga}</b> <small>(${z.gf - z.ga >= 0 ? '+' : ''}${z.gf - z.ga})</small></span><span class="chip" title="Puntos por partido">📈 ${ppg.toFixed(2).replace('.', ',')} pts/PJ ${adjHtml(ppg >= 2 ? 3 : ppg >= 1.6 ? 1 : ppg >= 1.2 ? 0 : ppg >= 0.9 ? -1 : -3, null) || adjHtml(0, {})}</span>${seasChips}</div>`; }
    else if (seasChips) body += `<div class="lmseason"><span class="lab">🗓 Temporada</span>${seasChips}</div>`;
    if (typeof scorersHtml === 'function') body += scorersHtml(t);
    const formRows = PD.roster(S.d, t).map(x => ({ x, f: LM.adj.get(x.pid) })).filter(e => e.f).sort((a, b) => b.f.adj - a.f.adj || (b.f.avg || 0) - (a.f.avg || 0));
    if (formRows.length) body += `<details class="ksgroup lmform" ${LM.formOpen ? 'open' : ''}><summary>📊 Forma del plantel · <span class="up">▲ ${formRows.filter(e => e.f.adj > 0).length} en alza</span> · <span class="eq">➡ ${formRows.filter(e => !e.f.adj).length} estables</span> · <span class="dn">▼ ${formRows.filter(e => e.f.adj < 0).length} en baja</span></summary><p class="note">Tocá ⓘ en un jugador para ver de dónde sale su forma.</p><div class="formgrid">${formRows.map(({ x, f }) => lmFormRow(x, f)).join('')}</div></details>`;
    if (!c.fx.length) body += '<p class="note">No hay partidos terminados recientes con alineaciones.</p>';
    else {
      body += `<div class="lmfx" role="tablist">${c.fx.map((f2, k) => `<button type="button" role="tab" class="lmf ${k === i ? 'on' : ''}" data-fx="${k}" aria-selected="${k === i}"><span class="d">${fmtDate(f2.date)} · ${esc(f2.league || '')}</span><span class="m">${f2.home ? '' : '@ '}${esc(f2.opp)}</span><span class="s ${f2.gf > f2.ga ? 'w' : f2.gf < f2.ga ? 'l' : 'e'}">${f2.gf}-${f2.ga}</span><span class="fo">${esc(f2.formation || '—')}</span></button>`).join('')}</div>`;
      const mm = lmMatch(t, fx), found = fx.xi.filter(p => mm.has(p.id)).length, onPitch = LM.view === 'match';
      const best = [...fx.xi, ...fx.subs].filter(p => p.rt != null && p.min >= 30).sort((a, b) => b.rt - a.rt)[0];
      const scorers = [...fx.xi, ...fx.subs].filter(p => p.st && p.st.g).map(p => esc(p.name.split(' ').slice(-1)[0]) + (p.st.g > 1 ? ' ×' + p.st.g : '')).join(', ');
      body += `<div class="lmbar2">
        <div class="lminfo"><span>${fx.home ? '🏠 Local' : '✈️ Visitante'} vs <b>${esc(fx.opp)}</b> <b class="sc ${fx.gf > fx.ga ? 'w' : fx.gf < fx.ga ? 'l' : 'e'}">${fx.gf}-${fx.ga}</b></span><span>🧩 <b>${esc(fx.formation || '?')}</b></span><span>👥 ${found}/11 en tu plantel</span>${scorers ? `<span>⚽ ${scorers}</span>` : ''}${best ? `<span>⭐ ${esc(best.name.split(' ').slice(-1)[0])} <b class="lrt ${rtCls(best.rt)}">${best.rt.toFixed(1)}</b></span>` : ''}</div>
        <div class="row"><div class="seg" id="lmView"><button type="button" data-v="mine" aria-pressed="${!onPitch}">📋 Mi formación</button><button type="button" data-v="match" aria-pressed="${onPitch}">📺 Ver este partido en la cancha</button></div>
          <button class="btn ghost small" type="button" id="lmMirror" title="Si los laterales o extremos quedaron del lado equivocado">⇆ Espejar</button>
          <button class="btn primary" type="button" id="lmApply">✔ Usar esta formación y este 11</button></div></div>`;
    }
  }
  return `<div class="lmcard"><div class="row" style="justify-content:space-between"><h3>⚽ Últimos partidos reales</h3><span class="row"><button class="btn ghost small" type="button" id="lmClose">✕ Cerrar</button></span></div>
    ${body}
    <details class="lmhelp" ${LM.helpOpen ? 'open' : ''}><summary>ℹ️ Cómo se calcula la forma</summary><div class="note">
      <p><b>Forma:</b> compara lo que se espera de cada jugador con lo que está haciendo en la realidad. Cada parte suma o resta puntos de valoración; el total se redondea y tiene tope. Con ⓘ se ve el detalle de cada jugador con sus números.</p>
      <ul>
        <li><b>📈 Últimos partidos:</b> el puntaje de cada partido (lo calcula el editor con goles, asistencias, tiros, atajadas, tarjetas y resultado) contra lo que se le exige. Pesan más el partido más reciente y los minutos jugados.</li>
        <li><b>🗓 Temporada completa:</b> su puntaje promedio en todos los partidos analizados y qué parte de los minutos posibles juega: el titular fijo suma, el que casi no juega resta.</li>
        <li><b>⚽ Goles y asistencias:</b> cada 90 minutos, contra lo normal para su puesto (un defensor que hace goles suma más que un delantero). Se usa la temporada si ya tiene 270 minutos; si no, los últimos partidos.</li>
        <li><b>🏟 Equipo:</b> los puntos por partido de la campaña y si el equipo mejoró o empeoró respecto de la temporada anterior.</li>
        <li><b>📚 Historial:</b> sus temporadas anteriores moderan la actual (una racha de tres partidos no lo vuelve crack, ni un mal mes lo hunde) y premian al titular de siempre.</li>
        <li><b>🤕 Lesiones y ausencias:</b> lesionado −1 (−1,5 si lleva más de dos meses), en duda −0,5; el habitual que faltó a las últimas tres citaciones, −1.</li>
        <li><b>🎂 Edad:</b> multiplica el total: hasta 21 años sube ×1,3 y baja ×0,9; de 30 a 32 sube ×0,8 y baja ×1,15; de 33 sube ×0,6 y baja ×1,3. Topes: hasta +4 en jóvenes, +3 en general, +2 en mayores de 33; hasta -3 (-4 en veteranos).</li>
        <li><b>⭐ Exigencia:</b> a los cracks se les pide más: el puntaje esperado sube con la valoración del parche y con el valor de mercado.</li>
      </ul>
      <p><b>Fuentes:</b> con ESPN entran los últimos 6 partidos, toda la temporada, el plantel con sus lesionados, la campaña anterior y el historial de cada jugador (se guarda 7 días). Con API-Football solo entran los últimos partidos.</p>
      <p><b>Flechas:</b> ${adjHtml(3, null)} <span>muy en alza</span> · ${adjHtml(1, null)} <span>en alza</span> · ${adjHtml(0, {})} <span>estable</span> · ${adjHtml(-1, null)} <span>en baja</span> · ${adjHtml(-3, null)} <span>muy en baja</span>. <span>"Por rendimiento" aplica ese ajuste a la valoración en todo el editor; no cambia las habilidades guardadas en el juego hasta que tocás "Usar esta formación y este 11".</span></p>
    </div></details></div>`;
}
// una fila de "Forma del plantel": últimos partidos, temporada, goles, lesión y el botón ⓘ con el detalle
function lmFormRow(x, f) {
  const i = pInfoBase(x.pid), s = f.s, bits = [];
  if (f.avg != null) bits.push(`${f.avg} prom.`);
  bits.push(f.n ? `${f.n} PJ` : 'sin partidos recientes');
  if (s) { bits.push(`${s.app} PJ temp.`); if (s.g) bits.push(s.g + ' G'); if (s.a) bits.push(s.a + ' A'); if (s.share != null && s.games >= 5) bits.push(`${s.share}% min.`); }
  else { if (f.g) bits.push(f.g + ' G'); if (f.as) bits.push(f.as + ' A'); }
  if (f.age) bits.push(`${f.age} años`);
  const badge = f.injury ? `<span class="injb out" title="${esc((f.injury.t ? f.injury.t + ' · ' : '') + f.injury.st + (f.injury.d ? ' · ' + f.injury.d : ''))}">🤕 <span>${/doubt|question|day|probable/i.test(f.injury.st) ? 'Duda' : 'Lesionado'}</span></span>` : f.parts.inj && f.absent >= 3 ? `<span class="injb abs" title="Era habitual y faltó a las últimas ${f.absent} citaciones">👻 <span>Ausente</span></span>` : '';
  return `<div class="frow">${i ? posBadge(i.pos) : ''}<span class="cnm"><b>${esc(playerName(x.pid) || 'ID ' + x.pid)}${badge}</b><small>${bits.join(' · ')}</small></span><span class="crt"><b class="${vcls(i ? i.r : 0)}">${i ? i.r : ''}</b>${adjHtml(f.adj, f)}<button type="button" class="why" data-why="${x.pid}" title="Cómo se calcula la forma de este jugador">ⓘ</button></span></div>`;
}
// detalle de un jugador: cada parte de la forma con sus números
const GRP_LONG = { gk: 'arquero', df: 'defensor', mf: 'mediocampista', fw: 'delantero' };
function lmWhy(t, pid) {
  const f = LM.adj.get(pid), i = pInfoBase(pid); if (!f) return;
  const sep = typeof LANG !== 'undefined' && LANG === 'en' ? '.' : ',', dec = v => v == null ? '?' : (+v).toFixed(2).replace('.', sep);
  const P = f.parts, pts = v => `<b class="${v > 0.005 ? 'pos' : v < -0.005 ? 'neg' : ''}" data-noi18n>${v > 0 ? '+' : v < 0 ? '−' : ''}${dec(Math.abs(v))}</b>`;
  const row = (ic, name, data, v) => `<tr><td>${ic} <span>${name}</span></td><td>${data}</td><td>${pts(v)}</td></tr>`;
  const s = f.s, lastTxt = f.last.length ? f.last.map(r => `<b class="lrt ${rtCls(r)}" data-noi18n>${r.toFixed(1)}</b>`).join(' ') : '';
  const rows = [
    row('📈', 'Últimos partidos', f.n ? `<span>${f.n} partidos</span> · <span>promedio ${f.avg}</span> · <span>se esperaba ${f.expect}</span> · ${lastTxt}` : '<span>No jugó los últimos partidos analizados.</span>', P.perf),
    row('🗓', 'Temporada', s ? `<span>${s.app} PJ (${s.st} de titular)</span> · <span>${s.min}′ = ${s.share == null ? '?' : s.share}% de los minutos posibles</span>${s.avg != null ? ` · <span>puntaje promedio ${s.avg}</span>` : ''}${s.games < 5 ? ' · <span>pocos partidos analizados todavía</span>' : ''}` : f.deep ? '<span>Sin partidos en la temporada analizada.</span>' : '<span>Temporada sin analizar (fuente ESPN con "Analizar toda la temporada").</span>', P.season),
    row('⚽', 'Goles y asistencias', f.grp === 'gk' ? '<span>No aplica a arqueros.</span>' : `<span>${f.useS ? s.g : f.g} G y ${f.useS ? s.a : f.as} A en ${f.useS ? s.min : f.min}′</span> (<span>${f.useS ? 'temporada' : 'últimos partidos'}</span>) · <span>${dec(f.ga90)} por 90′</span> · <span>lo normal para un ${GRP_LONG[f.grp]} es ${dec(f.gaExp)}</span>`, P.goals),
    row('🏟', 'Equipo', f.ppg == null ? '<span>Sin campaña.</span>' : `<span>${dec(f.ppg)} pts/PJ esta temporada</span>${f.prevPpg != null ? ` · <span>anterior ${dec(f.prevPpg)}</span>` : ''}`, P.team),
    row('📚', 'Historial', f.hist.length ? `${f.hist.map(h => `<b data-noi18n>${esc(h.n)}</b> <span>${h.app} PJ · ${h.g} G · ${h.a} A${h.min ? ' · ' + h.min + '′' : ''}</span>`).join('<br>')}<br><span>${dec(f.hGa90)} por 90′ en sus últimas ${f.hist.length} temporadas</span>${f.hApp != null ? ` · <span>${f.hApp} partidos por temporada</span>` : ''}` : f.deep ? '<span>Sin historial en la web.</span>' : '<span>Solo con la temporada analizada.</span>', P.hist),
    row('🤕', 'Lesión o ausencia', f.injury ? `<span data-noi18n>${esc((f.injury.t ? f.injury.t + ' · ' : '') + f.injury.st)}</span>${f.injury.d ? ` · <span data-noi18n>${esc(f.injury.d)}</span>` : ''}${f.injury.date ? ` · <span>desde ${fmtDate(f.injury.date)} (${typeof seasInjDays === 'function' ? seasInjDays(f.injury) : '?'} días)</span>` : ''}` : f.absent >= 3 && P.inj ? `<span>Era habitual y faltó a las últimas ${f.absent} citaciones.</span>` : f.deep ? '<span>Sin lesiones informadas.</span>' : '<span>Solo con la temporada analizada.</span>', P.inj),
  ];
  const sum = P.perf + P.season + P.goals + P.team + P.hist + P.inj, base = i ? i.r : '?', r0 = S.names.get(pid), rb = r0 && r0.r ? r0.r : base;
  const html = `<div class="why"><div class="whyhead">${i ? posBadge(i.pos) : ''}<b>${esc(playerName(pid) || 'ID ' + pid)}</b> <span class="chip"><span>Valoración</span> <b data-noi18n>${rb}</b></span> <span class="chip">${f.age} años</span> <span class="chip"><span>Se le exige un puntaje de</span> <b data-noi18n>${f.expect}</b></span></div>
    <p class="note">Más valoración y más valor de mercado = más exigencia. Cada parte suma o resta puntos de valoración.</p>
    <table class="whytable"><tr><th>Parte</th><th>Datos</th><th>Puntos</th></tr>${rows.join('')}
      <tr class="tot"><td><span>Suma</span></td><td></td><td>${pts(sum)}</td></tr>
      <tr><td>🎂 <span>Edad</span></td><td><span>${f.age} años</span> · <span>${f.age <= 21 ? 'joven: sube más rápido y baja menos' : f.age >= 33 ? 'veterano: sube menos y baja más rápido' : f.age >= 30 ? 'sube algo menos y baja algo más' : 'edad normal'}</span></td><td data-noi18n>×${P.mul}</td></tr>
      <tr class="tot"><td><span>Forma</span></td><td><span>${dec(P.raw)} redondeado, con tope ${P.capUp > 0 ? '+' : ''}${P.capUp} / ${P.capDown}</span></td><td>${adjHtml(f.adj, null) || adjHtml(0, {})}</td></tr></table>
    <p class="note">${i ? `<span>Valoración</span> <b class="${vcls(rb)}" data-noi18n>${rb}</b> → <b class="${vcls(Math.max(40, Math.min(rateCap(i.pos), rb + f.adj)))}" data-noi18n>${Math.max(40, Math.min(rateCap(i.pos), rb + f.adj))}</b> <span>en el modo "Por rendimiento". En el juego se guarda solo al tocar "Usar esta formación y este 11".</span>` : ''}</p></div>`;
  ksModal(tr('Cómo se calcula la forma de ') + (playerName(pid) || ''), html, () => { });
}
function bindLastMatch(t, m) {
  lmRerender = () => later(() => renderTeams(m));
  const on = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };
  on('lmOpen', () => { LM.open = true; LM.err = ''; renderTeams(m); });
  on('lmClose', () => { LM.open = false; LM.search = false; renderTeams(m); });
  on('lmKeySave', () => { const v = $('lmKeyIn').value.trim(); if (!v) return; try { localStorage.setItem(LMKEY_LS, v); } catch { } toast('Clave guardada.'); lmFetch(t); });
  on('lmGo', () => lmFetch(t));
  on('lmRefresh', () => lmFetch(t, true));
  on('lmChange', () => { LM.search = true; LM.q = c0name(t); renderTeams(m); });
  const doSearch = async () => { const q = $('lmQ').value.trim(); if (q.length < 3) { toast('Escribí al menos 3 letras.'); return; } LM.q = q; LM.busy = t.id; LM.err = ''; renderTeams(m); try { LM.cands = await PROVIDER().searchTeam(q, isNat(t), lmHint(t)); if (!LM.cands.length) LM.err = 'Sin resultados para "' + q + '".'; } catch (e) { LM.err = e.message === 'NOKEY' ? 'Falta la clave de API-Football.' : e.message; } LM.busy = 0; renderTeams(m); };
  on('lmQGo', doSearch); const q = $('lmQ'); if (q) q.onkeydown = e => { if (e.key === 'Enter') doSearch(); };
  document.querySelectorAll('[data-cand]').forEach(b => b.onclick = () => { const x = LM.cands[+b.dataset.cand]; LM.search = false; delete LM.cache[lk(t)]; lmFetch(t, true, x); });
  document.querySelectorAll('[data-fx]').forEach(b => b.onclick = () => { LM.sel[t.id] = +b.dataset.fx; renderTeams(m); });
  on('lmMirror', () => { const c = LM.cache[lk(t)], fx = c.fx[LM.sel[t.id] || 0], k = t.id + ':' + fx.id; LM.mirror[k] = !lmMirror(t, fx); renderTeams(m); });
  const lv = $('lmView'); if (lv) lv.onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; LM.view = b.dataset.v; S.fsel = null; renderTeams(m); if (LM.view === 'match') later(() => { const p = $('fpitchPv'); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'center' }); }); };
  on('pvBack', () => { LM.view = 'mine'; renderTeams(m); });
  on('pvApply', () => { const c = LM.cache[lk(t)], fx = c.fx[LM.sel[t.id] || 0]; lmConfirmApply(t, fx, m); });
  on('lmApply', () => { const c = LM.cache[lk(t)], fx = c.fx[LM.sel[t.id] || 0]; lmConfirmApply(t, fx, m); });
  const pv = $('lmProv'); if (pv) pv.onclick = e => { const b = e.target.closest('[data-v]'); if (!b || b.dataset.v === PREFS.lmProv) return; PREFS.lmProv = b.dataset.v; savePrefs(); LM.err = ''; LM.cands = null; LM.ready = null; RATE_GEN++; render(); };
  const md = $('lmMode'); if (md) md.onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; PREFS.rateMode = b.dataset.v; savePrefs(); RATE_GEN++; render(); };
  const dp = $('lmDeep'); if (dp) dp.onchange = () => { PREFS.lmDeep = dp.checked; savePrefs(); LM.ready = null; RATE_GEN++; if (dp.checked && typeof seasonFetch === 'function') seasonFetch(t); renderTeams(m); };
  document.querySelectorAll('[data-why]').forEach(b => b.onclick = () => lmWhy(t, +b.dataset.why));
  document.querySelectorAll('details.lmform').forEach(d => d.ontoggle = () => { LM.formOpen = d.open; });
  document.querySelectorAll('details.lmhelp').forEach(d => d.ontoggle = () => { LM.helpOpen = d.open; });
}
const c0name = t => (LM.map[lk(t)] && LM.map[lk(t)].name) || tget(t, 'name');

// ===================== Plantel real (API-Football /players/squads) =====================
const SQ_LS = 'edit21-squads-v1';
const SQ = { cache: {}, open: false, busy: 0, err: '' };
try { SQ.cache = JSON.parse(localStorage.getItem(SQ_LS) || '{}'); } catch { }
const sqSave = () => { try { localStorage.setItem(SQ_LS, JSON.stringify(SQ.cache)); } catch { } };
PROVIDERS.apifootball.squad = async function (tid) {
  const res = await this.get('players/squads', { team: tid });
  const s = res[0]; if (!s) return [];
  return s.players.map(p => ({ id: p.id, name: p.name, num: p.number, age: p.age, pos: p.position, photo: p.photo }));
};
const SQ_GRP = { Goalkeeper: 'gk', Defender: 'df', Midfielder: 'mf', Attacker: 'fw' };
async function sqFetch(t, rer) {
  SQ.err = ''; SQ.busy = t.id; rer();
  try {
    const P = PROVIDER();
    let api = LM.map[lk(t)];
    if (!api) { const c = await P.searchTeam(tget(t, 'name'), isNat(t), lmHint(t)); if (!c.length) throw new Error('No encontré "' + tget(t, 'name') + '" en la web.'); api = c[0]; LM.map[lk(t)] = api; LM.cands = c.slice(0, 8); lmSave(); }
    const players = await P.squad(api.id);
    SQ.cache[lk(t)] = { api, when: Date.now(), players }; sqSave();
    // neutral headshots (no club or national kit): usable everywhere
    const mm = sqMatch(t, players); let n = 0;
    for (const [aid, x] of mm) { const p = players.find(q => q.id === aid); if (p && p.photo && !FACES.idx.has(x.pid) && !(FACES.online.get(x.pid) || {}).m) { FACES.online.set(x.pid, { u: p.photo, k: 'x' }); n++; } }
    if (n) saveOnline();
  } catch (e) { SQ.err = e.message === 'NOKEY' ? 'Falta la clave de API-Football (cargala en Formación → Último partido real).' : e.message; }
  SQ.busy = 0; rer();
}
function sqMatch(t, players) {
  const roster = PD.roster(S.d, t).map(x => ({ x, n: playerName(x.pid) })), pairs = [];
  for (const p of players) for (const r of roster) { const s = nameScore(p.name, r.n, p.num, r.x.number); if (s >= 3) pairs.push([s, p.id, r.x]); }
  pairs.sort((a, b) => b[0] - a[0]); const out = new Map(), used = new Set();
  for (const [, aid, x] of pairs) { if (out.has(aid) || used.has(x.slot)) continue; out.set(aid, x); used.add(x.slot); }
  return out;
}
// find an API player in the game database (best name match; prefer same position group)
function sqFindInGame(p) {
  let best = null, bs = 3;
  const consider = (id, name) => { let s = nameScore(p.name, name, 0, 0); const i = pInfoBase(id); if (i && SQ_GRP[p.pos] === POS_GRP[i.pos]) s += 1; if (i && p.age && i.a && Math.abs(i.a - p.age) <= 1) s += 1; if (s > bs) { bs = s; best = id; } };
  for (const q of S.ix.players) consider(q.id, pget(q, 'name'));
  for (const [id, v] of S.names) if (!S.ix.byId.has(id)) consider(id, v.name);
  return best;
}
function squadCard(t) {
  if (!SQ.open) return `<div class="lmbar"><button class="btn small" type="button" id="sqOpen">Comparar con el plantel real</button><span class="note">Quién llegó, quién se fue y los dorsales de verdad (${PREFS.lmProv === 'apifootball' ? 'API-Football' : 'ESPN'})</span></div>`;
  const c = SQ.cache[lk(t)], busy = SQ.busy === t.id; let body = '';
  if (PREFS.lmProv === 'apifootball' && !lmKey()) body += '<div class="warnbox">Falta la clave de API-Football: cargala en Formación → "Último partido real", o cambiá la fuente a ESPN.</div>';
  else if (!c && !busy) body += `<div class="row"><button class="btn primary" type="button" id="sqGo">Traer el plantel real de ${esc(tget(t, 'name'))}</button><span class="note">Usa 1 o 2 consultas.</span></div>`;
  if (busy) body += '<div class="lmload"><span class="spin"></span> Buscando plantel…</div>';
  if (SQ.err) body += `<div class="warnbox">${esc(SQ.err)}</div>`;
  if (c) {
    const mm = sqMatch(t, c.players), matchedSlots = new Set([...mm.values()].map(x => x.slot));
    const arrivals = c.players.filter(p => !mm.has(p.id)).map(p => ({ p, gid: sqFindInGame(p) }));
    const gone = PD.roster(S.d, t).filter(x => !matchedSlots.has(x.slot));
    const nums = [...mm].map(([aid, x]) => ({ p: c.players.find(q => q.id === aid), x })).filter(e => e.p.num && e.p.num !== e.x.number);
    const where = id => { const cl = clubOf(id); return cl ? tget(cl, 'name') : 'sin club'; };
    body += `<div class="row lmteam">${c.api.logo ? `<img src="${esc(c.api.logo)}" alt="" class="lmlogo" onerror="this.remove()">` : ''}<b>${esc(c.api.name)}</b><span class="note">${c.players.length} jugadores en el plantel real · ${mm.size} coinciden con el tuyo · actualizado ${new Date(c.when).toLocaleDateString('es-AR')}</span><button class="btn ghost small" type="button" id="sqRefresh">Actualizar</button></div>
      <div class="sqgrid">
        <section><h4>Llegaron · ${arrivals.length}</h4>${arrivals.map(({ p, gid }) => `<div class="crow"><span class="posb ${SQ_GRP[p.pos] || ''}">${GRP_LABEL[SQ_GRP[p.pos]] || '?'}</span><span class="cnm"><b>${esc(p.name)}</b><small>${p.num ? '#' + p.num + ' · ' : ''}${p.age ? p.age + ' años · ' : ''}${gid ? 'en el juego: ' + esc(playerName(gid)) + ' (' + esc(where(gid)) + ')' : 'no está en la base del juego'}</small></span><span></span>${gid ? `<button class="btn small primary" type="button" data-sqin="${gid}" data-num="${p.num || 0}">Traer</button>` : '<span></span>'}</div>`).join('') || '<div class="empty">Nadie nuevo.</div>'}</section>
        <section><h4>Ya no están · ${gone.length}</h4>${gone.map(x => { const i = pInfo(x.pid); return `<div class="crow">${i ? posBadge(i.pos) : '<span class="posb">?</span>'}<span class="cnm"><b>${esc(playerName(x.pid) || 'ID ' + x.pid)}</b><small>#${x.number}${i && i.a ? ' · ' + i.a + ' años' : ''}</small></span>${i && i.r ? `<span class="crt"><b class="${vcls(i.r)}">${i.r}</b></span>` : "<span></span>"}<button class="btn small" type="button" data-sqout="${x.slot}">Quitar</button></div>`; }).join('') || '<div class="empty">Todos siguen.</div>'}</section>
      </div>
      ${nums.length ? `<div class="row"><span class="note">${nums.length} dorsales distintos al real (${nums.slice(0, 6).map(e => esc((playerName(e.x.pid) || '').split(' ').slice(-1)[0]) + ' ' + e.x.number + '→' + e.p.num).join(', ')}${nums.length > 6 ? '…' : ''}).</span><button class="btn small" type="button" id="sqNums">Usar los dorsales reales</button></div>` : ''}
      <p class="note">"Traer" pasa al jugador desde su club actual del juego (en una selección solo lo convoca). "Quitar" lo saca de este plantel; si era titular entra el primer suplente. La lista de la web a veces está incompleta (juveniles, lesionados largos): revisá antes de quitar. Todo se puede deshacer.</p>`;
  }
  return `<div class="lmcard"><div class="row" style="justify-content:space-between"><h3>Plantel real</h3><button class="btn ghost small" type="button" id="sqClose">Cerrar</button></div>${body}</div>`;
}
function bindSquad(t, m) {
  const rer = () => later(() => renderTeams(m)), tn = tget(t, 'name'), sh = $('teamSheet');
  const on = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };
  on('sqOpen', () => { SQ.open = true; renderTeams(m); });
  on('sqClose', () => { SQ.open = false; renderTeams(m); });
  on('sqGo', () => sqFetch(t, rer)); on('sqRefresh', () => sqFetch(t, rer));
  on('sqNums', () => {
    const c = SQ.cache[lk(t)], mm = sqMatch(t, c.players);
    edit('Dorsales reales en ' + tn, 't' + t.id, regT(t), () => {
      const want = [...mm].map(([aid, x]) => [x.slot, c.players.find(q => q.id === aid).num]).filter(([, n]) => n);
      for (const [slot] of want) PD.setNumber(S.d, t, slot, 0);
      for (const [slot, n] of want) PD.setNumber(S.d, t, slot, freeNumber(t, n));
      for (const x of PD.roster(S.d, t)) if (!x.number) PD.setNumber(S.d, t, x.slot, freeNumber(t, 0));
    });
    toast('Dorsales actualizados.', 4000, ['Deshacer', undo]); rer();
  });
  sh.querySelectorAll('[data-sqin]').forEach(b => b.onclick = async () => {
    const id = +b.dataset.sqin, who = playerName(id) || 'ID ' + id, e1 = rosterAddCheck(t, id); if (e1) { toast(e1); return; }
    const num = freeNumber(t, +b.dataset.num), old = !isNat(t) ? (teamOf.get(id) || []).find(x => !isNat(x) && x.id !== t.id) : null;
    if (old) {
      if (!await confirmBox(`${who} está en ${tget(old, 'name')}. ¿Pasarlo a ${tn}?`)) return;
      const slot = PD.roster(S.d, old).find(y => y.pid === id).slot; let err = null;
      edit(who + ': ' + tget(old, 'name') + ' → ' + tn, 't' + t.id, [...regT(t), ...regT(old)], () => { err = rosterRemove(old, slot, true); if (!err) rosterAdd(t, id, num); });
      if (err) { toast(err, 6000); return; }
    } else edit('Agregar ' + who + ' a ' + tn, 't' + t.id, regT(t), () => rosterAdd(t, id, num));
    rebuildTeamOf(); RATE_GEN++; toast(who + ' ahora está en ' + tn + ' con el ' + num + '.', 4000, ['Deshacer', undo]); rer();
  });
  sh.querySelectorAll('[data-sqout]').forEach(b => b.onclick = () => {
    const slot = +b.dataset.sqout, x = PD.roster(S.d, t).find(y => y.slot === slot), who = playerName(x.pid) || 'ID ' + x.pid;
    let err = null; edit('Quitar ' + who + ' de ' + tn, 't' + t.id, regT(t), () => { err = rosterRemove(t, slot, true); });
    if (err) toast(err, 5000); else { rebuildTeamOf(); RATE_GEN++; toast(who + ' quitado.', 4000, ['Deshacer', undo]); rer(); }
  });
}

// ===================== Vista del partido en la cancha grande =====================
function lmPreview(t) {
  const c = LM.cache[lk(t)]; if (!c || !c.fx.length) return null;
  const fx = c.fx[Math.min(LM.sel[t.id] || 0, c.fx.length - 1)], P = lmPlan(t, fx);
  return P ? Object.assign(P, { fx }) : null;
}
const statIcons = p => !p || !p.st ? '' : (p.st.g ? '<i class="ic g" title="Goles">⚽' + (p.st.g > 1 ? '×' + p.st.g : '') + '</i>' : '') + (p.st.a ? '<i class="ic a" title="Asistencias">🅰' + (p.st.a > 1 ? '×' + p.st.a : '') + '</i>' : '') + (p.st.yc ? '<i class="ic y" title="Amarilla">🟨</i>' : '') + (p.st.rc ? '<i class="ic r" title="Roja">🟥</i>' : '');
function pvMarker(t, PV, e, i, kitP, kitG, photos) {
  const x = PD.roster(S.d, t).find(r => r.slot === e.slot), full = x ? playerName(x.pid) : '', short = full ? full.split(' ').slice(-1)[0] : '', kit = i ? kitP : kitG;
  const pi = x && pInfoAt(x.pid, e.role), p = e.p;
  const avatar = photos ? faceHtml(x && x.pid, kit, 'big') : `<span class="shirtwrap">${shirtSvg(kit, '100%')}</span>`;
  const badge = e.replaced ? `<span class="pvb rep" title="${esc(p ? p.name : '')} no está en tu plantel">↺ por ${esc(p ? p.name.split(' ').slice(-1)[0] : '?')}</span>` : e.diff === 'in' ? '<span class="pvb in" title="Hoy no es titular en tu equipo">▲ entra</span>' : e.diff === 'moved' ? `<span class="pvb mv" title="Hoy juega de ${POS_LONG[e.fromRole]}">⇄ era ${POS[e.fromRole]}</span>` : '';
  return `<div class="fm pvm ln-${POS_GRP[e.role]} ${e.x > 80 ? 'edge-r' : e.x < 20 ? 'edge-l' : ''} ${i ? '' : 'gk'} ${photos ? 'ph' : ''} ${e.replaced ? 'rep' : ''} d-${e.diff}" style="left:${Math.max(5, Math.min(95, e.x))}%;bottom:${3 + e.y / 50 * 94}%" title="${esc(full)} · ${POS_LONG[e.role]}${p && p.rt != null ? ' · puntaje ' + p.rt.toFixed(1) : ''}${p && p.min && p.min < 90 ? ' · ' + p.min + '′' : ''}">
    ${badge}
    <span class="fav">${avatar}${(() => { const pend = pi && pi.form ? pi.adj - (pi.applied || 0) : 0, k = pend > 0 ? 'up' : pend < 0 ? 'dn' : 'eq'; return `<span class="fxr ${k}" style="--d:${(i * 0.13).toFixed(2)}s" aria-hidden="true"><b class="ring"></b>${k === 'eq' ? '<i>➡</i>' : `<i>${k === 'up' ? '▲' : '▼'}</i><i>${k === 'up' ? '▲' : '▼'}</i><i>${k === 'up' ? '▲' : '▼'}</i><em>${pend > 0 ? '+' : '−'}${Math.abs(pend)}</em>`}</span>`; })()}<span class="fnum">${x ? x.number : ''}</span>${p && p.rt != null && !e.replaced ? `<b class="lrt pvrt ${rtCls(p.rt)}">${p.rt.toFixed(1)}</b>` : ''}</span>
    <span class="fname">${esc(short || '—')}${e.replaced ? '' : statIcons(p)}</span>
    <span class="fmeta"><span class="posb ${POS_GRP[e.role]}">${POS[e.role]}</span>${rateHtml(pi)}</span></div>`;
}
function pvSide(t, PV) {
  const r = PD.roster(S.d, t), nm = s => { const x = r.find(y => y.slot === s); return x ? playerName(x.pid) || 'ID ' + x.pid : '?'; };
  const ins = PV.ents.filter(e => e.diff === 'in' && !e.replaced), moved = PV.ents.filter(e => e.diff === 'moved'), reps = PV.ents.filter(e => e.replaced);
  const li = (ic, txt, cls = '') => `<li class="${cls}"><span class="ico">${ic}</span><span>${txt}</span></li>`;
  const subsUsed = PV.fx.subs.filter(p => p.min > 0);
  return `<div class="pvside">
    <div class="pvhead"><b>📺 ${PV.fx.home ? 'Local' : 'Visitante'} vs ${esc(PV.fx.opp)} ${PV.fx.gf}-${PV.fx.ga}</b><span class="note">${esc(PV.fx.league || '')} · ${fmtDate(PV.fx.date)} · ${esc(PV.fx.formation || '')}</span></div>
    <div class="row"><button class="btn primary" type="button" id="pvApply">✔ Usar esta formación y este 11</button><button class="btn" type="button" id="pvBack">↩ Volver a mi formación</button></div>
    <h4>Cambios contra tu 11 actual</h4>
    <ul class="pvlist">
      ${ins.map(e => li('▲', `<b>${esc(nm(e.slot))}</b> entra de ${POS[e.role]}`, 'in')).join('')}
      ${PV.out.map(s => li('▼', `<b>${esc(nm(s))}</b> sale del 11`, 'out')).join('')}
      ${moved.map(e => li('⇄', `<b>${esc(nm(e.slot))}</b>: ${POS[e.fromRole]} → ${POS[e.role]}`, 'mv')).join('')}
      ${reps.map(e => li('↺', `${esc(e.p ? e.p.name : '?')} no está en tu plantel: va <b>${esc(nm(e.slot))}</b>`, 'rep')).join('')}
      ${!ins.length && !PV.out.length && !moved.length && !reps.length ? li('✓', 'Es el mismo 11 y en los mismos puestos que ya tenés.', 'same') : ''}
    </ul>
    ${subsUsed.length ? `<h4>Cambios del partido</h4><ul class="pvlist">${subsUsed.map(p => { const x = PV.mm.get(p.id); return li('⇆', `<b>${esc(p.name)}</b>${p.min ? ` · ${p.min}′` : ''}${p.rt != null ? ` <b class="lrt ${rtCls(p.rt)}">${p.rt.toFixed(1)}</b>` : ''} ${statIcons(p)}${x ? '' : ' <span class="note">(no está en tu plantel)</span>'}`); }).join('')}</ul>` : ''}
    <p class="note">En la cancha: el número de colores es el puntaje del partido; abajo, la valoración (${{ base: 'del juego', form: 'por rendimiento', cmp: 'del juego › por rendimiento' }[PREFS.rateMode]}) y la flecha de forma. Nada se guarda hasta que tocás "Usar".</p>
  </div>`;
}

// ===================== Aplicar el 11 + valoraciones por rendimiento =====================
// medias recién cambiadas: se revelan con una animación en la cancha, el banco y el plantel
const REVEAL = new Map();
function revealRatings() {
  if (document.querySelector('.rateanim')) return;
  const els = [...document.querySelectorAll('.frt[data-rev]')]; if (!els.length) { REVEAL.clear(); return; }
  els.forEach((el, i) => {
    const fin = +el.textContent, d = +el.dataset.rev; el.removeAttribute('data-rev');
    el.textContent = fin - d; el.classList.add('rv-wait');
    setTimeout(() => {
      el.classList.add('rv-flip');
      setTimeout(() => { el.textContent = fin; el.className = el.className.replace(/\bv(90|80|70|60|lo)\b/, vcls(fin)); el.classList.add(d > 0 ? 'rv-up' : 'rv-dn'); }, 230);
      setTimeout(() => el.classList.remove('rv-wait', 'rv-flip'), 520);
      setTimeout(() => el.classList.remove('rv-up', 'rv-dn'), 2600);
    }, 250 + i * 110);
  });
  REVEAL.clear();
}
const APPLIED_LS = 'edit21-form-applied-v2'; // pid → ajuste ya guardado en el EDIT (respecto del parche)
const APPLIED = (() => { try { return new Map(JSON.parse(localStorage.getItem(APPLIED_LS) || '[]')); } catch { return new Map(); } })();
const saveApplied = () => { try { localStorage.setItem(APPLIED_LS, JSON.stringify([...APPLIED])); } catch { } };
// diálogo con varias opciones (devuelve la clave elegida)
function choiceBox({ title, html, options }) {
  return new Promise(res => {
    const d = document.createElement('div'); d.className = 'modal-bg';
    d.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mdlT"><h3 id="mdlT">${title}</h3><div class="mdlbody">${html}</div><div class="mdlbtns">${options.map(o => `<button type="button" class="btn ${o.cls || ''}" data-k="${o.k}">${o.label}</button>`).join('')}</div></div>`;
    const close = k => { d.classList.add('out'); setTimeout(() => d.remove(), 200); document.removeEventListener('keydown', kd); res(k); };
    const kd = e => { if (e.key === 'Escape') close('no'); };
    d.onclick = e => { const b = e.target.closest('[data-k]'); if (b) close(b.dataset.k); else if (e.target === d) close('no'); };
    document.addEventListener('keydown', kd); document.body.appendChild(d); later(() => { const b = d.querySelector('.btn.primary'); if (b) b.focus(); });
  });
}
// jugadores del partido (titulares y los que entraron) que están en tu plantel y tienen forma calculada
function lmRatingChanges(t, P) {
  const seen = new Set(), out = [];
  for (const p of [...P.fx.xi, ...P.fx.subs.filter(q => q.min > 0)]) {
    const x = P.mm.get(p.id); if (!x || seen.has(x.pid)) continue; seen.add(x.pid);
    const f = LM.adj.get(x.pid), b = pInfoBase(x.pid); if (!f || !b) continue;
    // objetivo = media del parche + forma; si ya se aplicó antes, solo se corrige la diferencia (no se acumula)
    const done = formDone(x.pid), delta = f.adj - done; if (!delta) continue;
    out.push({ pid: x.pid, name: playerName(x.pid) || 'ID ' + x.pid, from: b.r, to: Math.max(40, Math.min(rateCap(b.pos), b.r + delta)), adj: delta, total: f.adj, f, edit: S.ix.byId.has(x.pid) || canMakeEditPlayer(x.pid), isNew: !S.ix.byId.has(x.pid) });
  }
  return out.sort((a, b) => b.adj - a.adj);
}
// sube o baja todas las habilidades lo necesario para que la media cambie "adj" puntos (y protege las habilidades)
function shiftAbilities(p, adj) {
  for (const [k] of ABIL) PD.player.set(S.d, p.base, k, Math.max(40, Math.min(99, pget(p, k) + adj)));
  PD.player.set(S.d, p.base, 'e_ability', 1);
}
async function lmConfirmApply(t, fx, m) {
  const P = lmPlan(t, fx); if (!P) { toast('Ese partido no trae la ubicación de los jugadores o tu plantel no tiene 11.', 5000); return; }
  P.fx = fx;
  const ch = lmRatingChanges(t, P), w = ch.filter(c => c.edit), only = ch.filter(c => !c.edit);
  const row = c => `<li>${adjHtml(c.adj, c.f)}<span class="mn">${esc(c.name)}</span><span class="mr"><b class="${vcls(c.from)}">${c.from}</b> → <b class="${vcls(c.to)}">${c.to}</b></span><span class="mw" title="${c.edit ? (c.isNew ? 'Se agrega a tu EDIT con sus habilidades nuevas; cara, nombre y lo demás siguen saliendo del parche' : 'Ya está en tu EDIT: se cambian sus habilidades') : 'No está en la base cargada: queda solo en el editor'}">${c.edit ? (c.isNew ? '💾＋' : '💾') : '🖥'}</span></li>`;
  const html = `<p>Vas a poner la formación <b>${esc(fx.formation || '')}</b> y el 11 del partido ${fx.home ? 'contra' : 'en cancha de'} <b>${esc(fx.opp)}</b> (${fx.gf}-${fx.ga}).</p>
    ${ch.length ? `<p><b>Esto también modifica las valoraciones de los futbolistas.</b> ¿Estás seguro?</p><ul class="mdlrates">${ch.map(row).join('')}</ul>
    <p class="note">💾 se guarda en el juego (${w.length})${w.some(c => c.isNew) ? ` · 💾＋ ${w.filter(c => c.isNew).length} se agregan a tu EDIT solo con sus habilidades (cara, nombre y lo demás siguen saliendo del parche)` : ''}${only.length ? ` · 🖥 ${only.length} quedan solo en el editor (no están en la base cargada: tocá "Conectar carpeta Sider")` : ''}. Se puede deshacer con Ctrl+Z.</p>` : '<p class="note">Ningún jugador del partido tiene cambios de valoración.</p>'}`;
  const k = await choiceBox({ title: '✔ Usar esta formación y este 11', html, options: [{ k: 'no', label: 'No' }, ...(ch.length ? [{ k: 'lineup', label: 'Sí, pero sin cambios de valoración' }] : []), { k: 'yes', label: 'Sí', cls: 'primary' }] });
  if (k === 'no') return;
  const mode0 = PREFS.rateMode; PREFS.rateMode = 'base'; RATE_GEN++; const before = (teamScore(t) || { raw: 0 }).raw;
  lmApply(t, fx);
  if (k === 'yes' && ch.length) {
    if (w.length) {
      const nNew = w.filter(c => c.isNew).length;
      edit('Valoraciones por rendimiento (' + w.length + ' jugadores) en ' + tget(t, 'name'), 'players', editPlayersRegion(nNew), () => {
        insertEditPlayers(w.filter(c => c.isNew).map(c => c.pid));
        for (const c of w) { const p = S.ix.byId.get(c.pid); if (p) shiftAbilities(p, c.adj); }
      });
      S.hist[S.hp - 1] && (S.hist[S.hp - 1].reindex = true);
      S.ix = PD.index(S.d, S.f.game); rebuildTeamOf();
    }
    for (const c of w) { const pp = S.ix.byId.get(c.pid); APPLIED.set(c.pid, { adj: c.total, date: fx.date, r: pp ? rating(pp) : c.to }); REVEAL.set(c.pid, c.to - c.from); } saveApplied();
    PREFS.rateMode = only.length ? 'form' : mode0 === 'cmp' ? 'cmp' : 'base'; savePrefs();
  } else PREFS.rateMode = mode0;
  LM.ready = null; RATE_GEN++;
  const after = (teamScore(t) || { raw: 0 }).raw;
  LM.view = 'mine'; renderTeams(m);
  if (k === 'yes') rateAnim(t, before, after, ch, w.length, only.length);
}
function rateAnim(t, before, after, ch, wn, on) {
  const d = Math.round((after - before) * 10) / 10, lv = d > 0 ? 'up' : d < 0 ? 'dn' : 'eq', f1 = v => v.toFixed(1).replace('.', ',');
  const o = document.createElement('div'); o.className = 'rateanim ' + lv;
  o.innerHTML = `<div class="ra-card"><div class="ra-crest">${crest(t)}</div><div class="ra-t">Valoración del equipo</div>
    <div class="ra-n"><span class="ra-b">${f1(before)}</span><span class="ra-ar">${d > 0 ? '⬆' : d < 0 ? '⬇' : '➡'}</span><span class="ra-a">${f1(before)}</span></div>
    <div class="ra-d">${d > 0 ? '+' + f1(d) + ' · ¡el equipo sube!' : d < 0 ? f1(d) + ' · el equipo baja' : 'se mantiene igual'}</div>
    <ul class="ra-l">${ch.slice(0, 6).map(c => `<li>${adjHtml(c.adj, c.f)} ${esc(c.name.split(' ').slice(-1)[0])} <b>${c.from}→${c.to}</b></li>`).join('')}</ul>
    <div class="ra-f">💾 ${wn} guardados en el juego${on ? ` · 🖥 ${on} por rendimiento en el editor` : ''} · tocá para cerrar</div></div>`;
  document.body.appendChild(o);
  const a = o.querySelector('.ra-a'), t0 = performance.now(), dur = 1300;
  const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); a.textContent = f1(before + (after - before) * e); if (k < 1) requestAnimationFrame(step); else o.classList.add('done'); };
  setTimeout(() => requestAnimationFrame(step), 450);
  const close = () => { if (o.classList.contains('out')) return; o.classList.add('out'); setTimeout(() => { o.remove(); revealRatings(); }, 300); };
  o.onclick = close; setTimeout(close, 6000);
}
