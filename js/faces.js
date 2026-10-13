// ===================== Faces: local minifaces (Parche) + optional online photos =====================
const PREF_LS = 'edit21-prefs-v1';
const PREFS = (() => { try { return Object.assign({ look: 'kits', online: false, apiKey: '3', theme: 'clasico', showIds: true, onlineBadges: true }, JSON.parse(localStorage.getItem(PREF_LS) || '{}')); } catch { return { look: 'kits', online: false, apiKey: '3', theme: 'clasico', showIds: true, onlineBadges: true }; } })();
function savePrefs() { try { localStorage.setItem(PREF_LS, JSON.stringify(PREFS)); } catch { } }
const ONLINE_LS = 'edit21-online-faces-v1';
const FACES = { idx: new Map(), url: new Map(), online: new Map(), loading: new Set(), queue: [], busy: 0, dir: null, count: 0 };
// online photo entries: { u: url, k: 'c' club kit | 'n' national-team kit | 'x' neutral headshot | '?' unknown, m: manual }
try { FACES.online = new Map(JSON.parse(localStorage.getItem(ONLINE_LS) || '[]').map(([id, v]) => [id, typeof v === 'string' ? { u: v, k: '?' } : v])); } catch { }
const FACE_CTX = { nat: false }; // set while rendering a club or a national team
const saveOnline = () => { try { localStorage.setItem(ONLINE_LS, JSON.stringify([...FACES.online])); } catch { } };

// handle persistence (IndexedDB) so the Parche folder is remembered between sessions
function idb() { return new Promise((res, rej) => { const r = indexedDB.open('edit21', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function idbSet(k, v) { try { const db = await idb(); await new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); } catch { } }
async function idbGet(k) { try { const db = await idb(); return await new Promise((res, rej) => { const tx = db.transaction('kv'); const q = tx.objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); } catch { return null; } }

async function indexFaceDir(d) {
  let n = 0;
  try { for await (const [name, h] of d.entries()) { if (h.kind !== 'file') continue; const m = name.match(/^(\d+)\.dds$/i); if (m && !FACES.idx.has(+m[1])) { FACES.idx.set(+m[1], h); n++; } } } catch { }
  return n;
}
async function indexFaces(sider) {
  FACES.idx.clear(); FACES.url.clear(); FACES.dir = sider;
  // 1) livecpk roots (Sider priority order is unknown here; folders named "Faces" first)
  try {
    const live = await sider.getDirectoryHandle('livecpk'); const roots = [];
    for await (const [name, h] of live.entries()) if (h.kind === 'directory') roots.push([name, h]);
    roots.sort((a, b) => (/face/i.test(b[0]) - /face/i.test(a[0])));
    for (const [, h] of roots) { try { await indexFaceDir(await subDir(h, 'common/render/symbol/player')); } catch { } }
  } catch { }
  // 2) miniface_server module content
  try {
    const mf = await subDir(sider, 'content/miniface_server/MiniFaces');
    for await (const [, h] of mf.entries()) if (h.kind === 'directory') { try { await indexFaceDir(await subDir(h, 'common/render/symbol/player')); } catch { } }
  } catch { }
  FACES.count = FACES.idx.size;
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
const isPhoto = pid => !FACES.url.has(pid) && (FACES.online.get(pid) || {}).s === 'wiki'; // foto rectangular (no recortada): va en círculo
function paintFace(pid, url) { const ph = isPhoto(pid); document.querySelectorAll(`img[data-face="${pid}"]`).forEach(i => { i.src = url; const f = i.closest('.face'); if (f) { f.classList.add('has'); f.classList.toggle('ph', ph); } }); }
function onlineFor(pid) {
  const e = FACES.online.get(pid); if (!e || !e.u) return null;
  if (e.k === 'n' && !FACE_CTX.nat) return null;   // foto con la camiseta de la selección: nunca en un club
  if (e.k === 'c' && FACE_CTX.nat && e.m) return null; // marcada a mano como "de club": no en la selección
  return e.u;
}
function faceUrl(pid) {
  if (FACES.url.has(pid)) return FACES.url.get(pid);
  const ou = onlineFor(pid); if (ou) return ou;
  if (FACES.online.has(pid)) return null;
  if (!FACES.loading.has(pid) && (FACES.idx.has(pid) || (PREFS.online && !FACES.online.has(pid)))) { FACES.loading.add(pid); FACES.queue.push(pid); pumpFaces(); }
  return null;
}
// varias búsquedas a la vez: las caras del Parche se leen al toque y las de internet no se esperan entre sí
async function pumpFaces() {
  if (FACES.busy >= 3) return; FACES.busy = (FACES.busy || 0) + 1;
  while (FACES.queue.length) {
    const pid = FACES.queue.shift();
    try {
      if (FACES.idx.has(pid)) {
        const buf = new Uint8Array(await (await FACES.idx.get(pid).getFile()).arrayBuffer());
        const url = DDS.toDataURL(buf, 128, true); FACES.url.set(pid, url); paintFace(pid, url);
      } else if (PREFS.online) {
        const res = await findOnlineFace(pid);
        if (!res) { FACES.online.set(pid, { u: '', k: '?' }); saveOnline(); }
        else { const k = await classifyPhoto(pid, res.u); FACES.online.set(pid, { u: res.u, k, tm: res.tm, s: res.src }); saveOnline(); const u = onlineFor(pid); if (u) paintFace(pid, u); }
      }
    } catch { }
  }
  FACES.busy--;
}
// ---- fotos de internet: dos bases (Wikipedia y TheSportsDB) compiten y gana la que contesta primero con una foto confiable ----
const FACE_SRC_LS = 'edit21-face-src-v1';
const FACE_SRC = { wiki: 'Wikipedia', tsdb: 'TheSportsDB' };
FACES.src = (() => { const z = () => ({ n: 0, ms: 0, hit: 0, win: 0 }); try { const j = JSON.parse(localStorage.getItem(FACE_SRC_LS) || '{}'); return { wiki: Object.assign(z(), j.wiki), tsdb: Object.assign(z(), j.tsdb) }; } catch { return { wiki: z(), tsdb: z() }; } })();
// la primera vez con dos bases: volver a buscar a los que TheSportsDB sola no encontró
try { if (!localStorage.getItem(FACE_SRC_LS)) { for (const [k, v] of FACES.online) if (!v.u && !v.m) FACES.online.delete(k); saveOnline(); } } catch { }
const saveFaceSrc = () => { try { localStorage.setItem(FACE_SRC_LS, JSON.stringify(FACES.src)); } catch { } };
let tsdbNext = 0; // TheSportsDB gratis: una búsqueda cada ~2 segundos
async function faceTimed(k, fn) {
  const t = performance.now(); let r = null; try { r = await fn(); } catch { }
  const s = FACES.src[k]; s.n++; s.ms += performance.now() - t; if (r) s.hit++; saveFaceSrc();
  return r ? Object.assign(r, { src: k }) : null;
}
async function findOnlineFace(pid) {
  const jobs = [faceTimed('wiki', () => wikiFace(pid))];
  if (Date.now() >= tsdbNext) { tsdbNext = Date.now() + 2100; jobs.push(faceTimed('tsdb', () => onlineFace(pid))); }
  let r = await new Promise(res => { let left = jobs.length; jobs.forEach(j => j.then(x => x ? res(x) : --left || res(null))); });
  // Wikipedia no la encontró y TheSportsDB estaba ocupada: esperar su turno y probar ahí
  if (!r && jobs.length === 1) { let w; while ((w = tsdbNext - Date.now()) > 0) await new Promise(ok => setTimeout(ok, w)); tsdbNext = Date.now() + 2100; r = await faceTimed('tsdb', () => onlineFace(pid)); }
  if (r) { FACES.src[r.src].win++; saveFaceSrc(); }
  return r;
}
function faceSrcStats() {
  const f = k => { const s = FACES.src[k]; return s.n ? `${FACE_SRC[k]}: ${(s.ms / s.n / 1000).toFixed(1).replace('.', ',')} s por búsqueda, ${s.win} foto${s.win === 1 ? '' : 's'}` : ''; };
  return ['wiki', 'tsdb'].map(f).filter(Boolean).join(' · ');
}
async function wikiFace(pid) {
  const full = playerName(pid); if (!full) return null;
  const parts = full.replace(/\./g, '. ').split(/\s+/).filter(Boolean);
  const initial = parts.length > 1 && /\.$/.test(parts[0]) ? normTxt(parts[0])[0] : '';
  const surname = parts.filter(p => !/\.$/.test(p)).join(' '), last = normTxt(surname).split(' ').slice(-1)[0];
  const club = clubOf(pid), clubName = club ? normTxt(tget(club, 'name')) : '';
  const q = `${surname} footballer${clubName ? ' ' + clubName : ''}`;
  const r = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=6&prop=pageimages%7Cdescription&piprop=thumbnail&pithumbsize=240`);
  if (!r.ok) return null;
  const j = await r.json(), pages = Object.values((j.query && j.query.pages) || {}).sort((a, b) => a.index - b.index);
  let best = null, bestScore = -1;
  for (const p of pages) {
    const t = normTxt(p.title.replace(/\(.*?\)/g, '')), d = normTxt(p.description);
    if (!p.thumbnail || !/football|soccer/.test(d) || /club|team|league|season|stadium|manager|coach/.test(d)) continue;
    let s = 0;
    if (t.split(' ').includes(last)) s += 3;
    if (initial && t.startsWith(initial)) s += 1;
    if (/footballer|soccer player/.test(d)) s += 1;
    s -= p.index * .2; // el primero de la búsqueda suele ser el correcto
    if (s > bestScore) { bestScore = s; best = p; }
  }
  if (!best || bestScore < 3.5) return null;
  return { u: best.thumbnail.source, tm: best.description || '' };
}
const normTxt = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
async function onlineFace(pid) {
  const full = playerName(pid); if (!full) return null;
  const parts = full.replace(/\./g, '. ').split(/\s+/).filter(Boolean);
  const initial = parts.length > 1 && /\.$/.test(parts[0]) ? parts[0][0].toLowerCase() : '';
  const surname = parts.filter(p => !/\.$/.test(p)).join(' ');
  const club = clubOf(pid), clubName = club ? normTxt(tget(club, 'name')) : '';
  const r = await fetch(`https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(PREFS.apiKey || '3')}/searchplayers.php?p=${encodeURIComponent(surname)}`);
  if (!r.ok) return null;
  const j = await r.json(); const list = (j.player || j.players || []).filter(p => /soccer/i.test(p.strSport || 'soccer'));
  let best = null, bestScore = -1;
  for (const p of list) {
    const pn = normTxt(p.strPlayer), team = normTxt(p.strTeam);
    let s = 0;
    if (pn.split(' ').slice(-1)[0] === normTxt(surname).split(' ').slice(-1)[0]) s += 2;
    if (initial && pn.startsWith(initial)) s += 1;
    if (clubName && team && (team.includes(clubName.split(' ')[0]) || clubName.includes(team.split(' ')[0]))) s += 3;
    if (!(p.strCutout || p.strThumb || p.strRender)) s -= 10;
    if (s > bestScore) { bestScore = s; best = p; }
  }
  if (!best || bestScore < 3) return null; // not confident enough
  const u = best.strCutout || best.strThumb || best.strRender; return u ? { u, tm: best.strTeam || '' } : null;
}
function faceHtml(pid, kit, cls = '') {
  const url = pid ? faceUrl(pid) : null;
  const glow = kit ? `--g1:${kit.c1};--g2:${kit.c2}` : '';
  return `<span class="face ${url ? 'has' : ''}${url && isPhoto(pid) ? ' ph' : ''} ${cls}" style="${glow}"><img data-face="${pid || ''}" alt="" ${url ? `src="${url}"` : ''}>${shirtSvg(kit, '86%')}</span>`;
}

// ===================== Team badges: Parche flag/emblem PNGs + optional online fallback =====================
const BADGE_LS = 'edit21-online-badges-v1';
const BADGES = { idx: new Map(), url: new Map(), online: new Map(), loading: new Set(), queue: [], busy: false, count: 0 };
try { BADGES.online = new Map(JSON.parse(localStorage.getItem(BADGE_LS) || '[]')); } catch { }
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
  try {
    const live = await sider.getDirectoryHandle('livecpk');
    for await (const [, root] of live.entries()) {
      if (root.kind !== 'directory') continue;
      for (const sub of ['common/render/symbol/flag']) { try { await indexBadgeDir(await subDir(root, sub), best); } catch { } }
    }
  } catch { }
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
    try { url = await onlineBadge(t); } catch { ok = false; }
    if (ok) { BADGES.online.set(id, url || ''); saveOnlineBadges(); if (url) paintBadge(id, url); }
    await new Promise(r => setTimeout(r, ok ? 2100 : 8000)); // free API: ~30 requests per minute
  }
  BADGES.busy = false;
}
async function onlineBadge(t) {
  const name = tget(t, 'name'); const n = normTxt(name).replace(/\b(fc|cf|sc|ac|cd|ca|afc|club|de|the)\b/g, ' ').replace(/\s+/g, ' ').trim();
  const q = async s => { const r = await fetch(`https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(PREFS.apiKey || '3')}/searchteams.php?t=${encodeURIComponent(s)}`); if (!r.ok) return []; const j = await r.json(); return (j.teams || []).filter(x => /soccer/i.test(x.strSport || 'soccer')); };
  let list = await q(name); if (!list.length && n && n !== normTxt(name)) list = await q(n);
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
  if (!best || bs < 2) return null;
  return best.strBadge || best.strTeamBadge || null;
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
  if (FACES.url.has(pid)) return '<p class="note">Foto: miniface del Parche.</p>';
  if (!e || !e.u) return '';
  const lab = { c: 'con camiseta del club', n: 'con camiseta de la selección', x: 'neutral (sin camiseta)', '?': 'sin clasificar' }[e.k] || '';
  return `<div class="facetools"><span class="note">Foto de internet ${lab}${e.m ? ' (marcada a mano)' : ''}. ¿Es correcta?</span>
    <div class="row"><button class="btn small" type="button" data-fk="c" data-pid="${pid}">Es del club</button><button class="btn small" type="button" data-fk="n" data-pid="${pid}">Es de la selección</button><button class="btn small" type="button" data-fk="del" data-pid="${pid}">Quitar foto</button></div></div>`;
}

// carga la base del juego (copia hecha por el módulo edit21_db de Sider) sin mostrar nada
async function loadDbQuiet(sider, force) {
  try { const d = typeof sdbDbDir === 'function' ? await sdbDbDir(sider) : await subDir(sider, 'content/edit21-db'), f = await (await d.getFileHandle('Player.bin')).getFile(); const m = await namesFromBin(new Uint8Array(await f.arrayBuffer())); if (!S.names.size || force) { S.names = m; S.namesFrom = 'Parche (base del juego)'; namesSave(); RATE_GEN++; } } catch { }
}
