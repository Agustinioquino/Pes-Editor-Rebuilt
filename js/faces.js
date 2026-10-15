// ===================== Faces: local minifaces (Sider) + optional online photos =====================
const PREF_LS = 'edit21-prefs-v1';
const PREFS = (() => { try { return Object.assign({ look: 'kits', online: false, apiKey: '3', theme: 'clasico', showIds: true, onlineBadges: true }, JSON.parse(localStorage.getItem(PREF_LS) || '{}')); } catch { return { look: 'kits', online: false, apiKey: '3', theme: 'clasico', showIds: true, onlineBadges: true }; } })();
function savePrefs() { try { localStorage.setItem(PREF_LS, JSON.stringify(PREFS)); } catch { } }
const ONLINE_LS = 'edit21-online-faces-v1';
const FACES = { idx: new Map(), url: new Map(), online: new Map(), loading: new Set(), err: new Set(), queue: [], busy: 0, dir: null, count: 0 };
// online photo entries: { u: url, k: 'c' club kit | 'n' national-team kit | 'x' neutral headshot | '?' unknown, m: manual }
try { FACES.online = new Map(JSON.parse(localStorage.getItem(ONLINE_LS) || '[]').map(([id, v]) => [id, typeof v === 'string' ? { u: v, k: '?' } : v])); } catch { }
const FACE_CTX = { nat: false }; // set while rendering a club or a national team
// se guarda un momento después (con miles de fotos, escribir todo en cada una frenaba la búsqueda)
let saveOnlineT = 0;
const saveOnlineNow = () => { clearTimeout(saveOnlineT); saveOnlineT = 0; try { localStorage.setItem(ONLINE_LS, JSON.stringify([...FACES.online])); } catch { } };
const saveOnline = () => { clearTimeout(saveOnlineT); saveOnlineT = setTimeout(saveOnlineNow, 600); };
if (typeof addEventListener === 'function') addEventListener('pagehide', () => { if (saveOnlineT) saveOnlineNow(); });

// handle persistence (IndexedDB) so the Sider folder is remembered between sessions
function idb() { return new Promise((res, rej) => { const r = indexedDB.open('edit21', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function idbSet(k, v) { try { const db = await idb(); await new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); } catch { } }
async function idbGet(k) { if (k === 'sider' && typeof SIDER_RO !== 'undefined' && SIDER_RO) return SIDER_RO; try { const db = await idb(); return await new Promise((res, rej) => { const tx = db.transaction('kv'); const q = tx.objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); } catch { return null; } }

async function indexFaceDir(d) {
  let n = 0;
  try { for await (const [name, h] of d.entries()) { if (h.kind !== 'file') continue; const m = name.match(/^(\d+)\.dds$/i); if (m && !FACES.idx.has(+m[1])) { FACES.idx.set(+m[1], h); n++; } } } catch { }
  return n;
}
async function indexFaces(sider) {
  FACES.idx.clear(); FACES.url.clear(); FACES.dir = sider;
  // 1) las carpetas de contenido de Sider, en el orden de sider.ini (la primera manda) y después el resto de livecpk
  try { for (const h of await siderCpkRoots(sider)) { try { await indexFaceDir(await subDir(h, 'common/render/symbol/player')); } catch { } } } catch { }
  // 2) miniface_server module content
  try {
    const mf = await subDir(sider, 'content/miniface_server/MiniFaces');
    for await (const [, h] of mf.entries()) if (h.kind === 'directory') { try { await indexFaceDir(await subDir(h, 'common/render/symbol/player')); } catch { } }
  } catch { }
  FACES.count = FACES.idx.size; if (typeof siderBtnLabel === 'function') siderBtnLabel();
  return FACES.count;
}
async function restoreFaces() {
  const h = await idbGet('sider'); if (!h) return;
  try { if ((await h.queryPermission({ mode: 'read' })) === 'granted') { await indexFaces(h); await indexBadges(h); await loadDbQuiet(h); if (typeof sdbLoadAll === 'function') { const st = await sdbLoadAll(h); let told = false; try { told = sessionStorage.getItem('pes-editor-db-notice') === '1'; } catch { } if (st.missing.length && !told) { try { sessionStorage.setItem('pes-editor-db-notice', '1'); } catch { } setTimeout(() => { if (!document.querySelector('.intro')) sdbNotice(st); else setTimeout(() => sdbNotice(st), 2500); }, 1500); } } } else FACES.needsPerm = h; } catch { }
}
async function grantFaces() {
  const h = FACES.needsPerm; if (!h) return;
  try { if ((await h.requestPermission({ mode: 'read' })) === 'granted') { FACES.needsPerm = null; const n = await indexFaces(h); await indexBadges(h); toast(n.toLocaleString('es-AR') + ' minifaces disponibles.'); render(); } } catch { }
}
const isPhoto = pid => !FACES.url.has(pid) && /^(wiki|link)$/.test((FACES.online.get(pid) || {}).s || ''); // foto rectangular (no recortada): va en círculo
function paintFace(pid, url) { const ph = isPhoto(pid); document.querySelectorAll(`img[data-face="${pid}"]`).forEach(i => { i.src = url; const f = i.closest('.face'); if (f) { f.classList.add('has'); f.classList.toggle('ph', ph); } }); }
function onlineFor(pid) {
  const e = FACES.online.get(pid); if (!e || !e.u) return null;
  if (e.k === 'n' && !FACE_CTX.nat) return null;   // foto con la camiseta de la selección: nunca en un club
  if (e.k === 'c' && FACE_CTX.nat && e.m) return null; // marcada a mano como "de club": no en la selección
  return e.u;
}
// cada vez que algo se dibuja y todavía no tiene foto, sube su turno: lo último que se ve en pantalla se busca primero
// (todo lo de una misma pantalla comparte turno y va en el orden en que aparece, de arriba hacia abajo)
let WANT = 0, wantOpen = false;
const wantNow = () => { if (!wantOpen) { wantOpen = true; WANT++; setTimeout(() => { wantOpen = false; }, 0); } return WANT; };
Object.assign(FACES, { want: new Map(), oq: [], obusy: 0 });
function faceUrl(pid) {
  if (FACES.url.has(pid)) return FACES.url.get(pid);
  const ou = onlineFor(pid); if (ou) return ou;
  if (FACES.loading.has(pid)) { FACES.want.set(pid, wantNow()); return null; }
  if (FACES.online.has(pid)) return null;
  if (FACES.idx.has(pid)) { FACES.loading.add(pid); FACES.queue.push(pid); pumpFaces(); }
  // sin nombre (la base del juego todavía no cargó) no se busca: antes quedaba anotado como "sin foto" para siempre
  else if (PREFS.online && playerName(pid)) { FACES.loading.add(pid); FACES.want.set(pid, wantNow()); FACES.oq.push(pid); pumpOnline(); }
  return null;
}
// caras del juego: se leen al toque, varias a la vez
async function pumpFaces() {
  if (FACES.busy >= 3) return; FACES.busy = (FACES.busy || 0) + 1;
  while (FACES.queue.length) {
    const pid = FACES.queue.shift();
    try { const buf = new Uint8Array(await (await FACES.idx.get(pid).getFile()).arrayBuffer()); const url = DDS.toDataURL(buf, 128, true); FACES.url.set(pid, url); paintFace(pid, url); }
    catch { FACES.err.add(pid); }
  }
  FACES.busy--;
}
// fotos de internet: 4 búsquedas a la vez, primero la que se pidió último (lo que está en pantalla)
const takeWanted = (q, want) => { let bi = 0; for (let i = 1; i < q.length; i++) if ((want.get(q[i]) || 0) > (want.get(q[bi]) || 0)) bi = i; return q.splice(bi, 1)[0]; };
async function pumpOnline() {
  if (FACES.obusy >= 4) return; FACES.obusy++;
  while (FACES.oq.length) { const pid = takeWanted(FACES.oq, FACES.want); try { await faceSearch(pid); } catch { faceFailed(pid); } }
  FACES.obusy--;
}
// no contestó ninguna base (sin internet, límite de pedidos o bloqueo): no es "sin foto"; se reintenta en un rato
function faceFailed(pid) { FACES.err.add(pid); setTimeout(() => { FACES.err.delete(pid); if (!FACES.online.has(pid)) FACES.loading.delete(pid); }, 90000); }

// ---- fotos de internet ----
// 1) ESPN (sin límite de pedidos): el plantel real del club (un pedido para todo el equipo) o, si no está ahí, la búsqueda de
//    jugadores. Da el nombre completo ("L. MARTÍNEZ" → "Lisandro Martínez") y, a veces, una foto recortada.
// 2) Wikipedia (sin límite, en inglés y en el idioma del país del jugador): la foto real, y el nombre completo si ESPN no lo tenía.
// 3) TheSportsDB (gratis: 30 pedidos por minuto y 1 solo resultado por búsqueda): se busca con el nombre completo, así encuentra
//    al jugador justo aunque haya muchos con el mismo apellido. Los pedidos esperan su turno en una cola única con los escudos.
// En "Mezcla" la foto de Wikipedia se ve enseguida y, si después aparece la recortada, la reemplaza.
const FACE_SRC_LS = 'edit21-face-src-v1';
const FACE_SRC = { espn: 'ESPN', wiki: 'Wikipedia', tsdb: 'TheSportsDB' };
FACES.src = (() => { const z = () => ({ n: 0, ms: 0, hit: 0, win: 0 }); let j = {}; try { j = JSON.parse(localStorage.getItem(FACE_SRC_LS) || '{}'); } catch { } return Object.fromEntries(Object.keys(FACE_SRC).map(k => [k, Object.assign(z(), j[k])])); })();
// la primera vez con dos bases: volver a buscar a los que TheSportsDB sola no encontró
try { if (!localStorage.getItem(FACE_SRC_LS)) { for (const [k, v] of FACES.online) if (!v.u && !v.m) FACES.online.delete(k); saveOnline(); } } catch { }
let faceSrcT = 0;
const saveFaceSrc = () => { clearTimeout(faceSrcT); faceSrcT = setTimeout(() => { try { localStorage.setItem(FACE_SRC_LS, JSON.stringify(FACES.src)); } catch { } }, 800); };
// si la base no contestó devuelve { err }: eso no es "no tiene foto"
async function faceTimed(k, fn) {
  const t = performance.now(); let r = null, err = null; try { r = await fn(); } catch (e) { err = e; }
  const s = FACES.src[k]; s.n++; s.ms += performance.now() - t; if (r) s.hit++; saveFaceSrc();
  return r ? r : err ? { err } : null;
}
// los que no se encontraron se vuelven a buscar al mes (las bases suman fotos todo el tiempo)
const FACE_RETRY = 30 * 864e5;
try { const now = Date.now(); let n = 0; for (const [k, v] of FACES.online) if (!v.u && !v.m && v.t && now - v.t > FACE_RETRY) { FACES.online.delete(k); n++; } if (n) saveOnline(); } catch { }
// v0.052: la búsqueda nueva (nombre completo, ESPN, Wikipedia en otros idiomas) encuentra muchos más: se reintentan una vez
try { if (!localStorage.getItem('edit21-retry-v051')) { for (const [k, v] of FACES.online) if (!v.u && !v.m) FACES.online.delete(k); saveOnline(); localStorage.setItem('edit21-retry-v051', '1'); } } catch { }
const PHOTO_SRC = { tsdb: 'Recortadas', mix: 'Mezcla', off: 'No' };
function setPhotoSrc(v) {
  PREFS.photoSrc = v; PREFS.online = v !== 'off'; savePrefs();
  // volver a buscar a los que no se encontraron; con "recortadas" se sacan las fotos de Wikipedia
  for (const [k, e] of FACES.online) if (!e.m && (!e.u || (v === 'tsdb' && e.s === 'wiki'))) { FACES.online.delete(k); FACES.loading.delete(k); }
  saveOnline();
}
function faceSrcStats() {
  const f = k => { const s = FACES.src[k]; return s.n ? `${FACE_SRC[k]}: ${(s.ms / s.n / 1000).toFixed(1).replace('.', ',')} s por búsqueda, ${s.win} foto${s.win === 1 ? '' : 's'}` : ''; };
  return Object.keys(FACE_SRC).map(f).filter(Boolean).join(' · ');
}
async function faceSearch(pid) {
  if (navigator.onLine === false) throw new Error('sin internet');
  const mix = PREFS.photoSrc === 'mix', nm = faceName(playerName(pid)); if (!nm) { FACES.loading.delete(pid); return; } // sin nombre todavía (falta la base del juego): se busca cuando aparezca
  const e = await faceTimed('espn', () => espnHint(pid, nm)), hint = e && !e.err ? e : null;
  if (hint && hint.sure && hint.img) { await faceDone(pid, { u: hint.img, tm: hint.team, src: 'espn' }); return; }
  // Wikipedia: la foto (en "Mezcla") o el nombre completo para TheSportsDB si ESPN no lo dio seguro
  const w = mix || !(hint && hint.sure) ? await faceTimed('wiki', () => wikiFace(pid, nm, hint)) : null, wiki = w && !w.err ? w : null;
  const name = hint && hint.sure ? hint : wiki ? { full: wiki.full, sure: true } : hint;
  if (mix && wiki) await faceDone(pid, wiki, true); // se ve ya; TheSportsDB puede cambiarla por la recortada
  // TheSportsDB espera su turno en la cola sin frenar la búsqueda de los demás jugadores
  faceTsdb(pid, nm, name, mix && wiki, w && w.err).catch(() => faceFailed(pid));
}
async function faceTsdb(pid, nm, name, wiki, wErr) {
  let t = null; try { t = await onlineFace(pid, nm, name); } catch (er) { t = { err: er }; }
  if (t && !t.err) { await faceDone(pid, t); return; }
  if (wiki) { FACES.src.wiki.win++; saveFaceSrc(); return; } // queda la de Wikipedia
  if ((t && t.err) || wErr) throw (t && t.err) || wErr;
  faceMiss(pid);
}
function faceMiss(pid) { if ((FACES.online.get(pid) || {}).m) return; FACES.online.set(pid, { u: '', k: '?', t: Date.now() }); saveOnline(); }
async function faceDone(pid, r, provisional) {
  const k = await classifyPhoto(pid, r.u), prev = FACES.online.get(pid);
  if (prev && prev.m) return; // la marcó a mano mientras tanto
  FACES.online.set(pid, { u: r.u, k, tm: r.tm || '', s: r.src }); saveOnline();
  if (!provisional) { FACES.src[r.src].win++; saveFaceSrc(); }
  const u = onlineFor(pid); if (u) paintFace(pid, u);
}
// "L. MARTÍNEZ" → inicial "l", apellido "MARTÍNEZ", última palabra "martinez"
function faceName(full) {
  if (!full) return null;
  const parts = String(full).replace(/\./g, '. ').split(/\s+/).filter(Boolean);
  const initial = parts.length > 1 && /\.$/.test(parts[0]) ? normTxt(parts[0])[0] || '' : '';
  const surname = parts.filter(p => !/\.$/.test(p)).join(' '), ns = normTxt(surname).split(' ').filter(Boolean);
  if (!ns.length) return null;
  return { full: String(full), initial, surname, last: ns[ns.length - 1] };
}
// ¿el nombre de afuera puede ser este jugador? (mismo apellido y, si el juego da la inicial, la misma inicial)
function faceNameOk(nm, other) {
  const o = normTxt(String(other || '').replace(/\(.*?\)/g, '')).split(' ').filter(Boolean);
  if (!o.length || !o.includes(nm.last)) return false;
  return !nm.initial || o[0][0] === nm.initial;
}
// ¿el club de afuera ("Manchester United", "River Plate") es el del juego? alcanza con una palabra importante en común
// ("Atlético", "United", "Real"… no alcanzan solas: hay muchos)
const TEAM_GENERIC = new Set(['atletico', 'athletic', 'deportivo', 'sporting', 'real', 'union', 'united', 'city', 'racing', 'sport', 'sports', 'olympique', 'dynamo', 'dinamo', 'inter', 'new', 'san', 'santa', 'saint', 'town', 'county', 'rovers', 'wanderers', 'albion']);
function faceTeamLike(a, b) {
  const tk = s => TS.toks(TS.clean(s || '')).filter(w => w.length > 2);
  let x = tk(a), y = tk(b); if (!x.length || !y.length) return false;
  const xs = x.filter(w => !TEAM_GENERIC.has(w)), ys = y.filter(w => !TEAM_GENERIC.has(w)); if (xs.length && ys.length) { x = xs; y = ys; }
  return x.some(w => y.some(v => v === w || (Math.min(v.length, w.length) >= 4 && (v.startsWith(w) || w.startsWith(v)))));
}
const faceClub = pid => { const c = clubOf(pid); return c && !isNat(c) ? c : null; }; // el club, no la selección
const unAccent = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');

// ---- ESPN: plantel real del club (cacheado por sesión; qué equipo de ESPN es cada club queda guardado) ----
const FTEAM_LS = 'edit21-face-teams-v1';
const FTEAM = (() => { try { return JSON.parse(localStorage.getItem(FTEAM_LS) || '{}'); } catch { return {}; } })();
const FROSTER = new Map();
const espnJson = async u => { const r = await fetch(u); if (!r.ok) throw new Error('ESPN ' + r.status); return r.json(); };
async function espnTeamOf(club) {
  const m = typeof LM !== 'undefined' && LM.map['espn:' + club.id]; if (m && m.id) return m; // el que eligió en "Últimos partidos"
  const c = FTEAM[club.id]; if (c && (c.id || Date.now() - c.t < FACE_RETRY)) return c.id ? c : null;
  const list = await PROVIDERS.espn.searchTeam(tget(club, 'name'), false, lmHint(club)), [a, b] = list;
  const ok = a && TS.confident(a.score) && (!b || a.score - b.score >= 2);
  FTEAM[club.id] = ok ? { id: a.id, league: a.league || '' } : { id: 0, t: Date.now() };
  try { localStorage.setItem(FTEAM_LS, JSON.stringify(FTEAM)); } catch { }
  return ok ? FTEAM[club.id] : null;
}
function espnRoster(club) {
  if (!FROSTER.has(club.id)) FROSTER.set(club.id, (async () => {
    const api = await espnTeamOf(club); if (!api) return new Map();
    const j = await espnJson(`https://site.api.espn.com/apis/site/v2/sports/soccer/${api.league || 'all'}/teams/${api.id}/roster`);
    const team = (j.team && j.team.displayName) || '';
    const players = (j.athletes || []).map(a => ({ id: +a.id, name: a.displayName || a.fullName || '', num: +a.jersey || 0, photo: (a.headshot && a.headshot.href) || '' })).filter(p => p.name);
    const out = new Map();
    for (const [aid, x] of sqMatch(club, players)) { const p = players.find(q => q.id === aid); out.set(x.pid, { full: p.name, img: p.photo, team, sure: true }); }
    return out;
  })().catch(() => { setTimeout(() => FROSTER.delete(club.id), 60000); return new Map(); }));
  return FROSTER.get(club.id);
}
// de la búsqueda de jugadores de ESPN, el que es: mismo apellido (e inicial) y, mejor, el mismo club
function espnPick(list, nm, clubName) {
  const c = list.filter(x => x && x.displayName && faceNameOk(nm, x.displayName)).map(x => ({ x, s: nameScore(x.displayName, nm.full), team: !!clubName && faceTeamLike(x.subtitle, clubName) }));
  const withTeam = c.filter(e => e.team).sort((a, b) => b.s - a.s);
  if (withTeam.length) return { x: withTeam[0].x, sure: true };
  if (c.length === 1) return { x: c[0].x, sure: c[0].s >= 6 }; // sin el club: seguro solo si el nombre es igual entero ("Bruno Fernandes")
  return null;
}
async function espnHint(pid, nm) {
  const club = faceClub(pid);
  if (club) { const h = (await espnRoster(club)).get(pid); if (h) return h; }
  const j = await espnJson('https://site.web.api.espn.com/apis/search/v2?limit=25&type=player&query=' + encodeURIComponent(unAccent(nm.surname)));
  const list = (j.results || []).filter(x => x.type === 'player').flatMap(x => x.contents || []).filter(x => /^s:600~/.test(x.uid || '') || x.sport === 'soccer');
  const p = espnPick(list, nm, club ? tget(club, 'name') : ''); if (!p) return null;
  return { full: p.x.displayName, img: (p.sure && p.x.image && p.x.image.default) || '', team: p.x.subtitle || '', sure: p.sure };
}

// ---- Wikipedia: en inglés y, si no está, en el idioma del país del jugador o de su club ----
const WIKI_LANG = { es: 'ARG URY PRY CHL BOL PER ECU COL VEN MEX ESP CRI HND GTM SLV PAN CUB DOM NIC', pt: 'BRA PRT AGO MOZ CPV GNB', it: 'ITA SMR', fr: 'FRA CIV SEN CMR MLI GIN BFA COD COG GAB BEN TGO MAR DZA TUN HTI', de: 'DEU AUT', nl: 'NLD SUR' };
const WIKI_WORD = { en: 'footballer', es: 'futbolista', pt: 'futebolista', it: 'calciatore', fr: 'footballeur', de: 'Fußballspieler', nl: 'voetballer' };
const WIKI_PLAYER = /footballer|soccer player|futbolista|futebolista|calciatore|footballeur|fu(ss)?ballspieler|voetballer/;
const WIKI_NOT = /\b(club|team|league|season|stadium|manager|coach|referee|equipo|liga|temporada|estadio|entrenador|arbitro|clube|equipe|treinador|squadra|stagione|allenatore|saison|entraineur|verein|trainer|seleccion|selecao)\b/;
const isoOf = id => (((typeof T_ !== 'undefined' && T_.countries) || []).find(c => c[0] === id) || [])[2] || '';
function wikiLangs(pid) {
  const p = S.ix && S.ix.byId.get(pid), nat = p ? pget(p, 'nation') : (S.names.get(pid) || {}).n, club = faceClub(pid), out = ['en'];
  for (const iso of [isoOf(nat), club ? isoOf(tget(club, 'country')) : '']) for (const [l, s] of Object.entries(WIKI_LANG)) if (iso && s.split(' ').includes(iso) && !out.includes(l)) out.push(l);
  return out;
}
// de los resultados de la búsqueda, la página del jugador (con foto); el nombre completo, si se conoce, manda
function wikiPick(pages, nm, hint) {
  const hn = hint && hint.full ? normTxt(hint.full) : '', hf = hn.split(' ')[0];
  let best = null, bestScore = -1;
  for (const p of pages) {
    const t = normTxt(p.title.replace(/\(.*?\)/g, '')), d = normTxt((p.description || '') + ' ' + ((p.title.match(/\((.*?)\)/) || [])[1] || ''));
    if (!p.thumbnail || !WIKI_PLAYER.test(d) || WIKI_NOT.test(d) || !faceNameOk(nm, p.title)) continue;
    let s = 3;
    if (hn && t === hn) s += 3; else if (hf && hf.length > 1 && t.split(' ').includes(hf)) s += 1;
    if (nm.initial) s += 1;
    if (/footballer|futbolista|futebolista|calciatore|footballeur|spieler|voetballer/.test(d)) s += 1;
    s -= (p.index || 0) * .2; // el primero de la búsqueda suele ser el correcto
    if (s > bestScore) { bestScore = s; best = p; }
  }
  return best && bestScore >= 3.5 ? best : null;
}
async function wikiFace(pid, nm, hint) {
  const club = faceClub(pid), clubName = club ? tget(club, 'name') : '';
  let err = null;
  for (const lang of wikiLangs(pid)) {
    const q = hint && hint.sure ? `${hint.full} ${WIKI_WORD[lang]}` : `${nm.surname} ${WIKI_WORD[lang]}${clubName ? ' ' + clubName : ''}`;
    try {
      const r = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=6&prop=pageimages%7Cdescription&piprop=thumbnail&pithumbsize=240`);
      if (!r.ok) throw new Error('Wikipedia ' + r.status);
      const j = await r.json(), pages = Object.values((j.query && j.query.pages) || {}).sort((a, b) => a.index - b.index);
      const best = wikiPick(pages, nm, hint && hint.sure ? hint : null);
      if (best) return { u: best.thumbnail.source, tm: best.description || '', full: best.title.replace(/\s*\(.*?\)\s*/g, ' ').trim(), src: 'wiki' };
    } catch (e) { err = e; }
  }
  if (err) throw err;
  return null;
}
const normTxt = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

// ---- TheSportsDB: una sola cola para fotos, escudos y estadios (gratis: 30 pedidos por minuto en total) ----
// Antes las fotos y los escudos pedían cada uno a su ritmo y juntos pasaban el límite: TheSportsDB contestaba "pará" y todo se frenaba.
const TSDB = { next: 0, q: [], run: false };
function tsdbGet(path, pri) { return new Promise((ok, ko) => { TSDB.q.push({ path, pri: pri || (() => -1), ok, ko }); tsdbRun(); }); }
async function tsdbRun() {
  if (TSDB.run) return; TSDB.run = true;
  while (TSDB.q.length) {
    let w; while ((w = TSDB.next - Date.now()) > 0) await new Promise(ok => setTimeout(ok, w));
    const j = takeWanted(TSDB.q, { get: x => x.pri() }); TSDB.next = Date.now() + 2100;
    const t = performance.now();
    try {
      const r = await fetch(`https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(PREFS.apiKey || '3')}/${j.path}`);
      if (r.status === 429 && !j.again) { j.again = 1; TSDB.q.push(j); TSDB.next = Date.now() + 30000; continue; } // pidió frenar: se espera y se repite
      if (!r.ok) throw new Error('TheSportsDB ' + r.status);
      j.ok(await r.json());
    } catch (e) { TSDB.next = Math.max(TSDB.next, Date.now() + 8000); j.ko(e); }
    const s = FACES.src.tsdb; s.n++; s.ms += performance.now() - t; saveFaceSrc();
  }
  TSDB.run = false;
}
// el jugador entre lo que devolvió TheSportsDB: mismo apellido (e inicial), y el club o el nombre completo seguro
function tsdbPick(list, nm, clubName, name) {
  const hf = name && name.sure ? normTxt(name.full).split(' ')[0] : '';
  let best = null, bestScore = -1;
  for (const p of list) {
    if (!/soccer/i.test(p.strSport || 'soccer') || !faceNameOk(nm, p.strPlayer)) continue;
    const pn = normTxt(p.strPlayer), team = p.strTeam || '';
    let s = 2;
    if (nm.initial) s += 1;
    if (hf && hf.length > 1 && pn.split(' ')[0] === hf) s += 2;
    if (clubName && team && faceTeamLike(team, clubName)) s += 3;
    if (!(p.strCutout || p.strThumb || p.strRender)) s -= 10;
    if (s > bestScore) { bestScore = s; best = p; }
  }
  return best && bestScore >= 3 ? best : null; // not confident enough
}
async function onlineFace(pid, nm, name) {
  const club = faceClub(pid), clubName = club ? tget(club, 'name') : '', pri = () => FACES.want.get(pid) || 0;
  const ask = async q => { const j = await tsdbGet('searchplayers.php?p=' + encodeURIComponent(unAccent(q)), pri); return tsdbPick(j.player || j.players || [], nm, clubName, name); };
  // con el nombre completo trae justo a ese jugador; si no, por apellido (1 solo resultado: el más conocido con ese apellido)
  const qs = name && name.full ? [name.full] : [], same = qs.length && normTxt(qs[0]) === normTxt(nm.surname);
  if (!qs.length || (!same && !(name.sure && PREFS.photoSrc === 'mix'))) qs.push(nm.surname);
  let best = null; for (const q of qs) if (!best) best = await ask(q);
  if (!best) return null;
  FACES.src.tsdb.hit++;
  const u = best.strCutout || best.strThumb || best.strRender; return u ? { u, tm: best.strTeam || '', src: 'tsdb' } : null;
}
function faceHtml(pid, kit, cls = '') {
  const url = pid ? faceUrl(pid) : null;
  const glow = kit ? `--g1:${kit.c1};--g2:${kit.c2}` : '';
  return `<span class="face ${url ? 'has' : ''}${url && isPhoto(pid) ? ' ph' : ''} ${cls}" style="${glow}"><img data-face="${pid || ''}" alt="" ${url ? `src="${url}"` : ''}>${shirtSvg(kit, '86%')}</span>`;
}

// ===================== Team badges: Sider flag/emblem PNGs + optional online fallback =====================
const BADGE_LS = 'edit21-online-badges-v1';
const BADGES = { idx: new Map(), url: new Map(), online: new Map(), loading: new Set(), err: new Set(), queue: [], urgent: new Set(), busy: false, count: 0 };
try { BADGES.online = new Map(JSON.parse(localStorage.getItem(BADGE_LS) || '[]')); } catch { }
// los escudos que TheSportsDB no encontró se vuelven a buscar una vez, ahora también en Wikipedia
try { if (!localStorage.getItem('edit21-badges-wiki')) { for (const [k, v] of BADGES.online) if (!v) BADGES.online.delete(k); localStorage.setItem(BADGE_LS, JSON.stringify([...BADGES.online])); localStorage.setItem('edit21-badges-wiki', '1'); } } catch { }
// v0.045: antes, si TheSportsDB o Wikipedia no contestaban (límite de pedidos, sin internet, o en la app de Windows
// que algunos sitios frenaban), el jugador o el equipo quedaba anotado como "sin foto" para siempre. Se buscan de nuevo una vez.
try {
  if (!localStorage.getItem('edit21-retry-v045')) {
    for (const [k, v] of FACES.online) if (!v.u && !v.m) FACES.online.delete(k);
    for (const [k, v] of BADGES.online) if (!v) BADGES.online.delete(k);
    localStorage.setItem(ONLINE_LS, JSON.stringify([...FACES.online])); localStorage.setItem(BADGE_LS, JSON.stringify([...BADGES.online])); localStorage.setItem('edit21-retry-v045', '1');
  }
} catch { }
const saveOnlineBadges = () => { try { localStorage.setItem(BADGE_LS, JSON.stringify([...BADGES.online])); } catch { } };
// lower number = better candidate for a small crest (emblemLc/emb_XXXX are competition logos, not team badges)
const BADGE_RANK = [[/^e_(\d{6})_r\.png$/i, 0], [/^e_(\d{6})_r_l\.png$/i, 1], [/^e_(\d{6})_r_ll\.png$/i, 2], [/^e_(\d{6})_f\.png$/i, 3], [/^e_(\d{6})_\w+\.png$/i, 4]];
async function indexBadgeDir(d, best) {
  try {
    for await (const [name, h] of d.entries()) {
      if (h.kind !== 'file') continue;
      for (const [re, rank] of BADGE_RANK) { const m = name.match(re); if (!m) continue; const id = +m[1]; const cur = best.get(id); if (!cur || rank < cur.rank) best.set(id, { h, rank }); break; }
    }
  } catch { }
}
async function indexBadges(sider) {
  const best = new Map();
  try { for (const root of await siderCpkRoots(sider)) { try { await indexBadgeDir(await subDir(root, 'common/render/symbol/flag'), best); } catch { } } } catch { }
  BADGES.idx = new Map([...best].map(([id, v]) => [id, v.h])); for (const u of BADGES.url.values()) URL.revokeObjectURL(u); BADGES.url.clear(); BADGES.loading.clear(); BADGES.count = BADGES.idx.size;
  return BADGES.count;
}
function paintBadge(id, url) { document.querySelectorAll(`img[data-badge="${id}"]`).forEach(i => { i.src = url; i.closest('.crest')?.classList.add('img'); }); }
async function loadLocalBadge(id) {
  try { const url = URL.createObjectURL(await BADGES.idx.get(id).getFile()); BADGES.url.set(id, url); paintBadge(id, url); } catch { }
  BADGES.loading.delete(id);
}
function badgeUrl(t, urgent) {
  const id = t.id;
  if (BADGES.url.has(id)) return BADGES.url.get(id);
  if (BADGES.idx.has(id)) { if (!BADGES.loading.has(id)) { BADGES.loading.add(id); loadLocalBadge(id); } return null; }
  if (BADGES.online.get(id)) return BADGES.online.get(id);
  if (PREFS.onlineBadges && !BADGES.online.has(id) && tget(t, 'name')) {
    const k = BADGES.queue.indexOf(id);
    if (urgent) BADGES.urgent.add(id);
    if (k < 0) { urgent ? BADGES.queue.unshift(id) : BADGES.queue.push(id); pumpBadges(); }
    else if (urgent && k > 0) { BADGES.queue.splice(k, 1); BADGES.queue.unshift(id); }
  }
  return null;
}
async function pumpBadges() {
  if (BADGES.busy) return; BADGES.busy = true;
  while (BADGES.queue.length && PREFS.onlineBadges) {
    const id = BADGES.queue.shift();
    if (BADGES.idx.has(id) || BADGES.online.has(id)) continue;
    const t = S.ix && S.ix.teamById.get(id); if (!t) continue;
    let url = null, ok = true;
    // TheSportsDB marca el ritmo con su cola (compartida con las fotos): los escudos que se ven primero pasan adelante
    try { url = await onlineBadge(t, BADGES.urgent.has(id) ? () => WANT + 1 : null); } catch { ok = false; BADGES.err.add(id); }
    if (ok) { BADGES.online.set(id, url || ''); saveOnlineBadges(); if (url) paintBadge(id, url); }
  }
  BADGES.busy = false;
}
async function onlineBadge(t, pri) {
  const name = tget(t, 'name'); const n = normTxt(name).replace(/\b(fc|cf|sc|ac|cd|ca|afc|club|de|the)\b/g, ' ').replace(/\s+/g, ' ').trim();
  const q = async s => { const j = await tsdbGet('searchteams.php?t=' + encodeURIComponent(s), pri); return (j.teams || []).filter(x => /soccer/i.test(x.strSport || 'soccer')); };
  // si TheSportsDB no contesta, se prueba Wikipedia; si ninguna contesta, no se anota como "sin escudo" (se reintenta)
  let list; try { list = await q(name); if (!list.length && n && n !== normTxt(name)) list = await q(n); } catch (e) { const w = await wikiBadge(t); if (w) return w; throw e; }
  const nat = isNat(t); let best = null, bs = -1;
  for (const x of list) {
    const tn = normTxt(x.strTeam), alt = normTxt(x.strTeamAlternate || '');
    let s = 0;
    if (tn === normTxt(name) || alt.split(' ').join(' ').includes(normTxt(name))) s += 4;
    else if (n && (tn.includes(n) || n.includes(tn))) s += 2;
    const intl = /international|world cup|nations|copa america|euro/i.test(x.strLeague || '');
    if (nat === intl) s += 1; else s -= 2;
    if (!(x.strBadge || x.strTeamBadge)) s -= 10;
    if (s > bs) { bs = s; best = x; }
  }
  if (!best || bs < 2) { STADS.set(t.id, ''); saveStads(); return wikiBadge(t); }
  STADS.set(t.id, best.strStadium || ''); saveStads(); stadPaint(t);
  return best.strBadge || best.strTeamBadge || wikiBadge(t);
}
// escudo desde Wikipedia: la imagen del cuadro de la página del club (o de la selección)
async function wikiBadge(t) {
  const name = tget(t, 'name'); if (!name) return null;
  const nat = isNat(t), nn = normTxt(name), words = nn.split(' ').filter(w => w.length > 2 && !/^(fc|cf|sc|ac|cd|ca|afc|club|the)$/.test(w));
  const api = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*';
  const r = await fetch(`${api}&generator=search&gsrsearch=${encodeURIComponent(name + (nat ? ' national football team' : ' football club'))}&gsrlimit=5&prop=pageprops%7Cdescription&ppprop=page_image`);
  if (!r.ok) throw new Error('Wikipedia ' + r.status);
  const pages = Object.values(((await r.json()).query || {}).pages || {}).sort((a, b) => a.index - b.index);
  const pick = pages.find(p => {
    const img = p.pageprops && p.pageprops.page_image, d = normTxt(p.description), tt = normTxt(p.title.replace(/\(.*?\)/g, ''));
    if (!img || !/\.(svg|png)$/i.test(img)) return false; // los escudos son svg o png; las fotos de estadios, jpg
    if (!/football|soccer/.test(d + ' ' + tt) || /season|league|stadium|player|footballer|manager|cup$/.test(d)) return false;
    if (nat !== /national/.test(d + ' ' + tt)) return false;
    return !words.length || words.some(w => tt.includes(w));
  });
  if (!pick) return null;
  const r2 = await fetch(`${api}&titles=${encodeURIComponent('File:' + pick.pageprops.page_image)}&prop=imageinfo&iiprop=url&iiurlwidth=128`);
  if (!r2.ok) throw new Error('Wikipedia ' + r2.status);
  const f = Object.values(((await r2.json()).query || {}).pages || {})[0], ii = f && f.imageinfo && f.imageinfo[0];
  return ii ? ii.thumburl || ii.url : null;
}

// ---- nombre real del estadio (TheSportsDB, la misma búsqueda que el escudo) ----
const STAD_LS = 'edit21-online-stadiums-v1';
const STADS = (() => { try { return new Map(JSON.parse(localStorage.getItem(STAD_LS) || '[]')); } catch { return new Map(); } })();
const saveStads = () => { try { localStorage.setItem(STAD_LS, JSON.stringify([...STADS])); } catch { } };
const STAD_Q = new Set();
function stadPaint(t) { document.querySelectorAll(`[data-stad="${t.id}"]`).forEach(e => { e.innerHTML = '🏟️ ' + stadLabel(t); }); }
function realStadium(t) {
  if (STADS.has(t.id)) return STADS.get(t.id);
  if (PREFS.onlineBadges && navigator.onLine !== false && tget(t, 'name') && !STAD_Q.has(t.id)) { STAD_Q.add(t.id); setTimeout(() => onlineBadge(t).then(u => { if (u && !BADGES.online.get(t.id) && !BADGES.idx.has(t.id)) { BADGES.online.set(t.id, u); saveOnlineBadges(); paintBadge(t.id, u); } }).catch(() => STAD_Q.delete(t.id)), 400); }
  return '';
}

// ---- club vs. national-team photo: compare the shirt color in the photo with both kits ----
const hexRgb = h => [1, 3, 5].map(i => parseInt((h || '#808080').slice(i, i + 2), 16));
function natTeamOf(pid) {
  const p = S.ix && S.ix.byId.get(pid), n = p ? pget(p, 'nation') : (S.names.get(pid) || {}).n;
  if (!n) return null;
  return S.ix.teams.find(t => isNat(t) && tget(t, 'country') === n && PD.roster(S.d, t).length) || S.ix.teams.find(t => isNat(t) && tget(t, 'country') === n) || null;
}
function classifyPhoto(pid, url) {
  return new Promise(res => {
    const club = clubOf(pid), nat = natTeamOf(pid);
    if (!club || !nat) { res('?'); return; }
    const img = new Image(); img.crossOrigin = 'anonymous';
    const done = k => { clearTimeout(to); res(k); }, to = setTimeout(() => res('?'), 8000);
    img.onerror = () => done('?');
    img.onload = () => {
      try {
        const W = 48, H = 64, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(img, 0, 0, W, H);
        const d = g.getImageData(Math.round(W * .28), Math.round(H * .58), Math.round(W * .44), Math.round(H * .3)).data;
        let r = 0, gg = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) {
          const R = d[i], G = d[i + 1], B = d[i + 2]; if (d[i + 3] < 200) continue;
          const skin = R > 95 && G > 40 && B > 20 && R > G && R > B && R - Math.min(G, B) > 15 && Math.abs(R - G) > 15; if (skin) continue;
          r += R; gg += G; b += B; n++;
        }
        if (n < 20) { done('?'); return; }
        const pc = [r / n, gg / n, b / n], dist = (a, h) => { const q = hexRgb(h); return Math.hypot(a[0] - q[0], a[1] - q[1], a[2] - q[2]); };
        const kc = kitFor(club, false), kn = kitFor(nat, false);
        const dc = Math.min(dist(pc, kc.c1), dist(pc, kc.c2) + 30), dn = Math.min(dist(pc, kn.c1), dist(pc, kn.c2) + 30);
        done(dn + 35 < dc ? 'n' : dc + 35 < dn ? 'c' : '?');
      } catch { done('?'); } // the image server doesn't allow reading pixels
    };
    img.src = url;
  });
}
function setFaceKind(pid, k) {
  const e = FACES.online.get(pid);
  if (k === 'del') FACES.online.set(pid, { u: '', k: '?', m: 1 });
  else if (e) FACES.online.set(pid, Object.assign({}, e, { k, m: 1 }));
  saveOnline();
}
function faceTools(pid) {
  const e = FACES.online.get(pid);
  if (FACES.url.has(pid)) return '<p class="note">Foto: miniface del juego.</p>';
  const link = `<div class="row"><input type="text" id="faceLink" data-pid="${pid}" placeholder="Link de SoFIFA, Sortitoutsi, PES Master, SoccerWiki o de una foto" style="flex:1;min-width:10em"><button class="btn small" type="button" id="faceLinkGo" data-pid="${pid}">Usar esta foto</button></div>`;
  if (!e || !e.u) return `<div class="facetools"><span class="note">Sin foto de internet. Pegá el link del jugador en SoFIFA, Sortitoutsi, PES Master o SoccerWiki, o el de cualquier foto.</span>${link}</div>`;
  const lab = { c: 'con camiseta del club', n: 'con camiseta de la selección', x: 'neutral (sin camiseta)', '?': 'sin clasificar' }[e.k] || '';
  const from = LINK_SRC[e.s] && 'Foto de ' + LINK_SRC[e.s];
  return `<div class="facetools"><span class="note">${from ? from + ' (elegida a mano).' : `Foto de internet ${lab}${e.m ? ' (marcada a mano)' : ''}. ¿Es correcta?`}</span>
    <div class="row"><button class="btn small" type="button" data-fk="c" data-pid="${pid}">Es del club</button><button class="btn small" type="button" data-fk="n" data-pid="${pid}">Es de la selección</button><button class="btn small" type="button" data-fk="del" data-pid="${pid}">Quitar foto</button></div>${link}</div>`;
}
// ---- foto elegida a mano: link de SoFIFA (sofifa.com/player/231478/…) o de cualquier imagen ----
// SoFIFA no tiene API ni deja que otra página lea sus búsquedas, pero la foto de cada jugador tiene una dirección fija según su número.
const imgOk = u => new Promise(res => { const i = new Image(), t = setTimeout(() => res(false), 8000); i.onload = () => { clearTimeout(t); res(i.naturalWidth > 1); }; i.onerror = () => { clearTimeout(t); res(false); }; i.src = u; });
function sofifaUrls(text) {
  const s = String(text || '').trim(), m = s.match(/sofifa\.com\/player\/(\d+)/i) || s.match(/^(\d{3,7})$/);
  if (!m) return null;
  const id = m[1].padStart(6, '0'), a = id.slice(0, -3), b = id.slice(-3);
  return ['26', '25', '24', '23', '22'].map(v => `https://cdn.sofifa.net/players/${a}/${b}/${v}_120.png`); // la más nueva que tenga
}
// otras páginas con fotos fijas por número de jugador: Sortitoutsi (caras de Football Manager), PES Master (por juego,
// también leyendas y clásicos) y SoccerWiki. Ninguna tiene búsqueda automática: se pega el link de la página del jugador.
const LINK_SRC = { sofifa: 'SoFIFA', sortitoutsi: 'Sortitoutsi', pesmaster: 'PES Master', soccerwiki: 'SoccerWiki', link: 'tu link' };
function linkUrls(text) {
  const s = String(text || '').trim(); let m;
  const sf = sofifaUrls(s); if (sf) return { s: 'sofifa', list: sf };
  if ((m = s.match(/sortitoutsi\.net\/\S*?person\/(\d+)/i))) return { s: 'sortitoutsi', list: [`https://sortitoutsi.b-cdn.net/uploads/face/face_${m[1]}.png`] };
  if ((m = s.match(/pesmaster\.com\/[^/\s]+\/((?:pes|efootball)-\d{4})\/player\/(\d+)/i))) {
    const g = m[1].toLowerCase(), id = m[2], png = y => [`https://www.pesmaster.com/${y}/graphics/players/player_${id}_l.png`, `https://www.pesmaster.com/${y}/graphics/players/player_${id}.png`];
    return { s: 'pesmaster', list: /^efootball/.test(g) ? [`https://www.pesmaster.com/${g}/graphics/players/${id}_.webp`, ...png('pes-2021')] : [...png(g), ...(g === 'pes-2021' ? [] : png('pes-2021'))] };
  }
  if ((m = s.match(/soccerwiki\.org\/\S*?pid=(\d+)/i))) return { s: 'soccerwiki', list: ['png', 'jpg'].map(x => `https://cdn.soccerwiki.org/images/player/${m[1]}.${x}`) };
  if (/^https?:\/\/\S+$/i.test(s)) return { s: 'link', list: [s] };
  return null;
}
async function faceFromLink(pid, text) {
  const L = linkUrls(text);
  if (!L) throw new Error('Eso no parece un link de SoFIFA, Sortitoutsi, PES Master, SoccerWiki ni de una foto.');
  for (const u of L.list) if (await imgOk(u)) { FACES.online.set(pid, { u, k: 'x', m: 1, s: L.s }); saveOnline(); paintFace(pid, u); return u; }
  throw new Error(L.s === 'link' ? 'No se pudo cargar esa imagen.' : LINK_SRC[L.s] + ' no devolvió la foto de ese jugador. Probá abrir el link en el navegador, tocar la foto con el botón derecho y copiar la dirección de la imagen.');
}

// carga la base del juego (copia hecha por el módulo edit21_db de Sider, o los archivos del juego) sin mostrar nada
async function loadDbQuiet(sider, force) {
  try { const st = typeof sdbCheck === 'function' ? await sdbCheck(sider, force) : null, b = st && await sdbBin(st, 'Player.bin'); if (!b) return; const m = await namesFromBin(b); if (!S.names.size || force || S.namesStale) { S.names = m; S.namesFrom = 'la base del juego'; namesSave(); RATE_GEN++; } } catch { }
}
