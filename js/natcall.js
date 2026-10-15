// ===================== Selecciones: convocatoria =====================
let CALL_MAX = 26; // el juego usa listas de 26; se puede bajar a 23
const CALL = { q: '', grp: 'all', sort: 'r', limit: 60 };
function natCountry(t) { const c = tget(t, 'country'); if (COUNTRY.has(c)) return c; const n = normName(tget(t, 'name')); for (const [id, nm] of COUNTRY) if (normName(nm) === n) return id; return c; }
function playerNation(pid) { const p = S.ix.byId.get(pid); if (p) return pget(p, 'nation'); const n = S.names.get(pid); return n ? n.n || 0 : 0; }
const GRP_LABEL = { gk: 'ARQ', df: 'DEF', mf: 'MED', fw: 'DEL' };
function callPool(t) {
  const country = natCountry(t), inSquad = new Set(PD.roster(S.d, t).map(x => x.pid)), out = [];
  const seen = new Set();
  for (const p of S.ix.players) if (pget(p, 'nation') === country) { seen.add(p.id); if (!inSquad.has(p.id)) out.push(p.id); }
  for (const [id, v] of S.names) if (!seen.has(id) && v.n === country && v.pos != null && !inSquad.has(id)) out.push(id);
  return out;
}
function callRow(t, pid, inSquad, x) {
  const i = pInfo(pid), club = clubOf(pid), pv = playerValue(pid), grp = i ? POS_GRP[i.pos] : '';
  return `<div class="crow ${inSquad ? 'in' : ''}" data-grp="${grp}">
    ${i ? posBadge(i.pos) : '<span class="posb">?</span>'}
    <span class="cnm"><b>${esc(playerName(pid) || 'ID ' + pid)}</b><small>${club && !isNat(club) ? esc(tget(club, 'name')) : 'sin club'}${i && i.a ? ' · ' + i.a + ' años' : ''}${pv ? ' · ' + fmtMoney(pv.v) : ''}</small></span>
    ${i && i.r ? `<span class="crt"><b class="${vcls(i.r)}">${i.r}</b>${adjHtml(i.adj, i.form)}</span>` : "<span></span>"}
    ${inSquad ? `<button class="btn small" type="button" data-uncall="${x.slot}">Desconvocar</button>` : `<button class="btn small primary" type="button" data-call="${pid}">Convocar</button>`}</div>`;
}
function callCard(t) {
  if (t.rosterBase == null) return '<div class="card empty">Esta selección no tiene plantel en el archivo.</div>';
  const country = natCountry(t), r = PD.roster(S.d, t);
  const cnt = { gk: 0, df: 0, mf: 0, fw: 0 }; for (const x of r) { const i = pInfo(x.pid); if (i) cnt[POS_GRP[i.pos]]++; }
  const noNat = S.names.size && ![...S.names.values()].some(v => v.n);
  let pool = callPool(t);
  const q = normName(CALL.q).toLowerCase();
  if (q) pool = pool.filter(id => normName(playerName(id)).toLowerCase().includes(q) || (clubOf(id) && normName(tget(clubOf(id), 'name')).toLowerCase().includes(q)));
  if (CALL.grp !== 'all') pool = pool.filter(id => { const i = pInfo(id); return i && POS_GRP[i.pos] === CALL.grp; });
  const key = { r: id => -((pInfo(id) || { r: 0 }).r), a: id => (pInfo(id) || { a: 99 }).a || 99, v: id => -((playerValue(id) || { v: 0 }).v) }[CALL.sort];
  pool.sort((a, b) => key(a) - key(b));
  const total = pool.length; pool = pool.slice(0, CALL.limit);
  const squad = [...r].sort((a, b) => { const ia = pInfo(a.pid), ib = pInfo(b.pid); return (ia ? ia.pos : 99) - (ib ? ib.pos : 99) || ((ib ? ib.r : 0) - (ia ? ia.r : 0)); });
  const warn = [];
  if (r.length > CALL_MAX) warn.push(`Hay ${r.length} convocados y la lista elegida es de ${CALL_MAX}.`);
  if (cnt.gk < 3 && r.length) warn.push('Conviene tener 3 arqueros.');
  return `<div class="card">
    <div class="row" style="justify-content:space-between"><h3>Convocatoria de ${esc(COUNTRY.get(country) || tget(t, 'name'))} · ${r.length}/${CALL_MAX}</h3>
      <div class="row">${Object.entries(cnt).map(([k, n]) => `<span class="chip"><span>${GRP_LABEL[k]}</span> ${n}</span>`).join('')}<label class="lab" for="callMax">Lista de</label><select id="callMax" style="width:auto">${[23, 26].map(n => `<option ${n === CALL_MAX ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
    <div class="row"><button class="btn primary" type="button" id="autoCall">Convocatoria automática (los ${CALL_MAX} mejores)</button><button class="btn" type="button" id="best11">Armar el mejor 11 con los convocados</button>
      <span class="note">Usa la valoración ${PREFS.rateMode === 'form' ? 'por rendimiento' : 'actual'}; los convocados siguen en sus clubes.</span></div>
    ${warn.length ? `<div class="warnbox">${warn.map(esc).join(' ')}</div>` : ''}
    ${noNat || !S.names.size ? '<div class="warnbox">Para ver a todos los jugadores del país tocá "Conectar carpeta Sider" otra vez: así se cargan las nacionalidades de la base del juego.</div>' : ''}
    <div class="callgrid">
      <section><h4>Convocados</h4><div class="clist">${squad.map(x => callRow(t, x.pid, true, x)).join('') || '<div class="empty">Sin convocados.</div>'}</div></section>
      <section><h4>Disponibles · ${total}</h4>
        <div class="row"><input type="search" id="callQ" placeholder="Buscar jugador o club…" value="${esc(CALL.q)}" style="flex:1 1 160px">
          <select id="callSort" style="width:auto"><option value="r" ${CALL.sort === 'r' ? 'selected' : ''}>Valoración</option><option value="a" ${CALL.sort === 'a' ? 'selected' : ''}>Más jóvenes</option><option value="v" ${CALL.sort === 'v' ? 'selected' : ''}>Valor</option></select></div>
        <div class="fchips" id="callGrp">${[['all', 'Todos'], ['gk', 'Arqueros'], ['df', 'Defensores'], ['mf', 'Mediocampistas'], ['fw', 'Delanteros']].map(([k, n]) => `<button type="button" data-cg="${k}" aria-pressed="${CALL.grp === k}">${n}</button>`).join('')}</div>
        <div class="clist">${pool.map(id => callRow(t, id, false)).join('') || '<div class="empty">No hay más jugadores de este país.</div>'}</div>
        ${total > pool.length ? `<button class="btn small" type="button" id="callMore">Ver más (${total - pool.length})</button>` : ''}</section>
    </div></div>`;
}
// best XI for the current formation of plan 1 (roles), then bench by rating
function fit(i, role) {
  if (!i) return -999;
  if (role === 0) return i.pos === 0 ? i.r : -999;
  if (i.pos === 0) return -999;
  const sideL = [2, 6, 9], sideR = [3, 7, 10];
  let pen = i.pos === role ? 0 : POS_GRP[i.pos] === POS_GRP[role] ? 6 : 12;
  if (POS_GRP[i.pos] === POS_GRP[role] && ((sideL.includes(role) && sideR.includes(i.pos)) || (sideR.includes(role) && sideL.includes(i.pos)))) pen = 3;
  return i.r - pen;
}
function bestXIOrder(t) {
  const r = PD.roster(S.d, t), f = readForm(t, S.fplan, 0), roles = [0, ...f.roles.slice(1, 11)];
  const used = new Set(), chosen = new Array(11);
  const ordRoles = roles.map((role, idx) => ({ role, idx })).sort((a, b) => (a.role === 0 ? -1 : b.role === 0 ? 1 : r.filter(x => (pInfo(x.pid) || {}).pos === a.role).length - r.filter(x => (pInfo(x.pid) || {}).pos === b.role).length));
  for (const { role, idx } of ordRoles) {
    let best = null, bs = -1e9; for (const x of r) { if (used.has(x.slot)) continue; const s = fit(pInfo(x.pid), role); if (s > bs) { bs = s; best = x; } }
    if (best) { used.add(best.slot); chosen[idx] = best.slot; }
  }
  if (chosen.some(v => v == null)) return null;
  const bench = r.filter(x => !used.has(x.slot)).sort((a, b) => ((pInfo(b.pid) || { r: 0 }).r) - ((pInfo(a.pid) || { r: 0 }).r)).map(x => x.slot);
  const old = getOrder(t); return [...chosen, ...bench, ...old.filter(v => !chosen.includes(v) && !bench.includes(v))];
}
function fixCaptainTakers(t, xi) {
  const tb = t.tacticsBase, n = PD.roster(S.d, t), field = xi.slice(1);
  const best = field.map(s => n.find(x => x.slot === s)).filter(Boolean).sort((a, b) => ((pInfo(b.pid) || { r: 0 }).r) - ((pInfo(a.pid) || { r: 0 }).r))[0];
  if (!best) return;
  if (!xi.includes(S.d[tb + CAPT])) S.d[tb + CAPT] = best.slot;
  for (let k = 0; k < NTAKERS; k++) { const s = S.d[tb + TAKERS + k]; if (s !== 255 && !field.includes(s)) S.d[tb + TAKERS + k] = best.slot; }
}
function applyBestXI(t) {
  if (t.tacticsBase == null) return 'Sin tácticas en el archivo.';
  const o = bestXIOrder(t); if (!o || o.length !== 40 || new Set(o).size !== 40) return 'No hay jugadores suficientes para armar el 11.';
  setOrder(t, o); fixCaptainTakers(t, o.slice(0, 11)); return null;
}
function autoCallList(t) {
  const country = natCountry(t), quota = CALL_MAX >= 26 ? { gk: 3, df: 9, mf: 8, fw: 6 } : { gk: 3, df: 8, mf: 7, fw: 5 }, got = { gk: [], df: [], mf: [], fw: [] };
  const all = [...new Set([...PD.roster(S.d, t).map(x => x.pid).filter(id => playerNation(id) === country || !playerNation(id)), ...callPool(t)])];
  all.sort((a, b) => ((pInfo(b) || { r: 0 }).r) - ((pInfo(a) || { r: 0 }).r));
  const rest = [];
  for (const id of all) { const i = pInfo(id); if (!i || !i.r) continue; const g = POS_GRP[i.pos]; if (got[g].length < quota[g]) got[g].push(id); else rest.push(id); }
  const pick = [...got.gk, ...got.df, ...got.mf, ...got.fw];
  for (const id of rest) { if (pick.length >= CALL_MAX) break; const i = pInfo(id); if (POS_GRP[i.pos] !== 'gk') pick.push(id); }
  return pick.slice(0, CALL_MAX);
}
function applyAutoCall(t, pick) {
  const r = PD.roster(S.d, t), keep = new Set(pick), ins = pick.filter(id => !r.some(x => x.pid === id)), outs = r.filter(x => !keep.has(x.pid));
  const clubNum = id => { const c = clubOf(id); const x = c && PD.roster(S.d, c).find(y => y.pid === id); return x ? x.number : 0; };
  // replace in place (keeps the 40-slot order intact), then add or remove the difference
  while (ins.length && outs.length) { const x = outs.shift(), id = ins.shift(); PD.setRosterPlayer(S.d, t, x.slot, id); PD.setNumber(S.d, t, x.slot, 0); PD.setNumber(S.d, t, x.slot, freeNumber(t, clubNum(id))); }
  for (const id of ins) rosterAdd(t, id, freeNumber(t, clubNum(id)));
  // rosterRemove compacts the slots: remove from the highest slot down
  for (const x of outs.sort((a, b) => b.slot - a.slot)) { const e = rosterRemove(t, x.slot, true); if (e) return e; }
  return applyBestXI(t);
}
function bindCall(t, m) {
  const sh = $('teamSheet'), rer = () => later(() => renderTeams(m)), tn = tget(t, 'name');
  const q = $('callQ'); if (q) q.oninput = () => { CALL.q = q.value; CALL.limit = 60; const pos = q.selectionStart; renderTeams(m); const el = $('callQ'); el.focus(); el.setSelectionRange(pos, pos); el.classList.add('kick'); };
  const cm = $('callMax'); if (cm) cm.onchange = () => { CALL_MAX = +cm.value; rer(); };
  const so = $('callSort'); if (so) so.onchange = () => { CALL.sort = so.value; rer(); };
  const cg = $('callGrp'); if (cg) cg.onclick = e => { const b = e.target.closest('[data-cg]'); if (b) { CALL.grp = b.dataset.cg; CALL.limit = 60; renderTeams(m); } };
  const mo = $('callMore'); if (mo) mo.onclick = () => { CALL.limit += 60; renderTeams(m); };
  sh.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.call) {
      const id = +b.dataset.call, who = playerName(id) || 'ID ' + id;
      if (PD.roster(S.d, t).length >= CALL_MAX) { toast(`Ya hay ${CALL_MAX} convocados. Desconvocá a alguien primero.`, 5000); return; }
      const err = rosterAddCheck(t, id); if (err) { toast(err); return; }
      const c = clubOf(id), cn = c ? (PD.roster(S.d, c).find(y => y.pid === id) || {}).number : 0;
      edit('Convocar a ' + who + ' (' + tn + ')', 't' + t.id, regT(t), () => rosterAdd(t, id, freeNumber(t, cn)));
      rebuildTeamOf(); toast(who + ' convocado.', 3500, ['Deshacer', undo]); rer();
    }
    if (b.dataset.uncall != null) {
      const slot = +b.dataset.uncall, x = PD.roster(S.d, t).find(y => y.slot === slot), who = playerName(x.pid) || 'ID ' + x.pid;
      let err = null; edit('Desconvocar a ' + who + ' (' + tn + ')', 't' + t.id, regT(t), () => { err = rosterRemove(t, slot, true); });
      if (err) toast(err, 5000); else { rebuildTeamOf(); toast(who + ' desconvocado.', 3500, ['Deshacer', undo]); rer(); }
    }
    if (b.id === 'autoCall') {
      const pick = autoCallList(t); if (pick.length < 14) { toast('No encontré suficientes jugadores de este país. Conectá la carpeta Sider para cargar la base.', 6000); return; }
      if (!await confirmBox(`¿Reemplazar la convocatoria por los ${pick.length} mejores del país (3 arqueros y el resto repartido por línea) y armar el mejor 11?`)) return;
      let err = null; edit('Convocatoria automática de ' + tn, 't' + t.id, regT(t), () => { err = applyAutoCall(t, pick); });
      if (err) toast(err, 6000); else { rebuildTeamOf(); RATE_GEN++; toast('Convocatoria lista: ' + pick.length + ' jugadores.', 5000, ['Deshacer', undo]); rer(); }
    }
    if (b.id === 'best11') {
      let err = null; edit('Mejor 11 de ' + tn, 't' + t.id, regT(t), () => { err = applyBestXI(t); });
      if (err) toast(err); else { toast('Mejor 11 armado para la formación del plan ' + (S.fplan + 1) + '.', 4000, ['Deshacer', undo]); rer(); }
    }
  });
}
