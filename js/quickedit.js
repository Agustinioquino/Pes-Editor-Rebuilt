// ===================== Editar la media desde el plantel =====================
// Tocando la valoración de un jugador en el plantel se abre una ventana encima de la página:
// la media grande con −5/−1/+1/+5 y una barra para elegirla, y el hexágono para ajustar cada área.
// Cambiar la media sube o baja por igual todas las habilidades de juego (las de arquero, si es arquero).
const QE = { pid: null, start: null, close: null };
const QE_GK = ['gk', 'catching', 'clearing', 'reflex', 'cover'];
function qeKeys(p) { return pget(p, 'reg_pos') === 0 ? [...QE_GK, 'jump'] : ABIL.map(a => a[0]).filter(k => !QE_GK.includes(k)); }
const qeRate = (p, get) => Math.round(posFormula(POS_KEY[pget(p, 'reg_pos')] || 'cmf', get));
// el corrimiento d (igual para todas) que deja la media lo más cerca posible del objetivo
function qeProposal(p, target) {
  const ks = qeKeys(p), cur = new Map(ks.map(k => [k, pget(p, k)]));
  const at = d => { const m = new Map(); for (const [k, v] of cur) m.set(k, hexaClamp(v + d)); return m; };
  let best = null, bestErr = Infinity;
  for (let d = -59; d <= 59; d++) {
    const m = at(d), r = qeRate(p, k => (m.has(k) ? m.get(k) : pget(p, k))), err = Math.abs(r - target) * 1000 + Math.abs(d);
    if (err < bestErr) { bestErr = err; best = m; }
  }
  return best;
}
function qeApply(p, prop, label) {
  if (!prop || [...prop].every(([k, v]) => pget(p, k) === v)) return false;
  edit(label, 'p' + p.id, regP(p), () => {
    for (const [k, v] of prop) { PD.player.set(S.d, p.base, k, v); if (S.autoLock) for (const fl of [...LOCK_FLAGS, ...FIELD_FLAGS(k)]) PD.player.set(S.d, p.base, fl, 1); }
  });
  return true;
}
function qeHtml(pid) {
  const p = S.ix.byId.get(pid), name = playerName(pid) || (p && pget(p, 'name')) || 'ID ' + pid;
  const t = clubOf(pid), pos = p ? pget(p, 'reg_pos') : (pInfo(pid) || {}).pos, kit = t ? kitFor(t, pos === 0) : null;
  const age = p ? pget(p, 'age') : (pInfo(pid) || {}).a;
  const head = `<div class="qehead"><span class="qeface">${faceHtml(pid, kit, 'pl')}</span><div class="qewho">${pos != null ? posBadge(pos) : ''}<h2>${esc(name)}</h2>
    <div class="sub">${t ? esc(tget(t, 'name')) + ' · ' : ''}${age ? age + ' años' : ''}</div></div>
    <button class="btn ghost small qex" type="button" data-qx aria-label="Cerrar">✕</button></div>`;
  if (!p) {
    const get = typeof dbVal === 'function' && DBRAW && DBRAW.off.has(pid) ? k => dbVal(pid, k) : null, r = (pInfo(pid) || {}).r;
    return `${head}<div class="qero">
      <div class="qebig"><b class="${vcls(r || 0)}">${r || '–'}</b><span>Media</span></div>
      ${get ? hexaRo(get, pos) : ''}
      <p class="note">Este jugador está en la base del Parche pero todavía no en tu EDIT. Para cambiarle la media, agregalo a tu EDIT: se copia con todas sus habilidades y la cara y el nombre siguen saliendo del Parche.</p>
      <div class="row qefoot"><button class="btn" type="button" data-qx>Cerrar</button><button class="btn primary" type="button" data-qadd ${canMakeEditPlayer(pid) ? '' : 'disabled title="Falta la copia de Player.bin o el EDIT está lleno"'}>Agregar a mi EDIT para editarlo</button></div></div>`;
  }
  const r = rating(p), d = r - QE.start.r;
  return `${head}<div class="qebody">
    <div class="qerate">
      <div class="qebig"><b id="hxRate" class="${vcls(r)}">${r}</b><span>Media</span><i id="hxRateD"></i></div>
      <div class="qesince ${d > 0 ? 'up' : d < 0 ? 'dn' : ''}" id="qeSince">${d ? `${d > 0 ? '▲ +' : '▼ −'}${Math.abs(d)} desde que abriste esta ventana` : 'Sin cambios todavía'}</div>
      <div class="qebtns" role="group" aria-label="Cambiar la media">${[-5, -1, 1, 5].map(n => `<button class="btn" type="button" data-qd="${n}">${n > 0 ? '+' : '−'}${Math.abs(n)}</button>`).join('')}</div>
      <input type="range" class="qerange" id="qeRange" min="40" max="99" value="${r}" aria-label="Media">
      <div class="qescale"><span>40</span><span>50</span><span>60</span><span>70</span><span>80</span><span>90</span><span>99</span></div>
      <p class="note">${pos === 0 ? 'Cambiar la media sube o baja por igual las habilidades de arquero y el salto.' : 'Cambiar la media sube o baja por igual todas las habilidades de juego (las de arquero no se tocan).'} Ctrl+Z deshace.</p>
    </div>
    <div class="qehex">${hexaCard(p, true)}</div>
  </div>
  <div class="row qefoot">${d || QE.start.changed ? '<button class="btn" type="button" data-qreset>Volver a como estaba</button>' : ''}<span style="flex:1"></span>
    <button class="btn" type="button" data-qfull>Abrir ficha completa</button><button class="btn primary" type="button" data-qx>Listo</button></div>`;
}
function qePaint() {
  const m = document.querySelector('.qemodal'); if (!m || QE.pid == null) return;
  m.innerHTML = qeHtml(QE.pid);
  const p = S.ix.byId.get(QE.pid); if (!p) return;
  hexaBind(p, () => { QE.start.changed = true; qePaint(); });
  const rg = $('qeRange');
  rg.addEventListener('input', () => {
    const prop = qeProposal(p, +rg.value);
    hexaPaint(p, hexaAxes(pget(p, 'reg_pos')), prop);
    const big = $('hxRate'); if (big) { big.textContent = rg.value; big.className = vcls(+rg.value); }
    const sc = $('qeSince'), d = +rg.value - QE.start.r; if (sc) { sc.textContent = d ? `${d > 0 ? '▲ +' : '▼ −'}${Math.abs(d)} desde que abriste esta ventana` : 'Sin cambios todavía'; sc.className = 'qesince ' + (d > 0 ? 'up' : d < 0 ? 'dn' : ''); }
  });
  rg.addEventListener('change', () => qeTo(p, +rg.value));
}
function qeTo(p, target) {
  target = Math.max(40, Math.min(99, target));
  const r0 = rating(p), nm = pget(p, 'name') || 'ID ' + p.id;
  if (qeApply(p, qeProposal(p, target), nm + ': media ' + r0 + ' → ' + target)) QE.start.changed = true;
  else if (target !== r0) toast('No se puede llevar la media a ' + target + ': las habilidades ya están en el límite.');
  qePaint();
}
function quickEdit(pid) {
  if (QE.close) QE.close();
  const p = S.ix.byId.get(pid);
  QE.pid = pid; QE.start = { r: p ? rating(p) : 0, hp: S.hp, changed: false };
  const bg = document.createElement('div'); bg.className = 'modal-bg qebg';
  bg.innerHTML = `<div class="modal qemodal" role="dialog" aria-modal="true" aria-label="Editar la media"></div>`;
  document.body.appendChild(bg);
  const keys = e => {
    const k = e.key.toLowerCase(), typing = /^(INPUT|SELECT|TEXTAREA)$/.test((e.target || {}).tagName) && e.target.type !== 'range';
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if ((e.ctrlKey || e.metaKey) && !typing && (k === 'z' || k === 'y')) { e.preventDefault(); e.stopPropagation(); (k === 'y' || e.shiftKey ? redo : undo)(); qePaint(); }
  };
  const close = () => {
    document.removeEventListener('keydown', keys, true); bg.classList.add('out'); setTimeout(() => bg.remove(), 200);
    QE.close = null; QE.pid = null; RATE_GEN++; render();
  };
  QE.close = close;
  document.addEventListener('keydown', keys, true);
  bg.addEventListener('click', async e => {
    if (e.target === bg || e.target.closest('[data-qx]')) { close(); return; }
    const b = e.target.closest('button'); if (!b) return;
    const pl = S.ix.byId.get(QE.pid);
    if (b.dataset.qd && pl) { qeTo(pl, rating(pl) + +b.dataset.qd); return; }
    if (b.dataset.qfull != null) { const id = QE.pid; close(); S.player = id; S.pSrc = 'edit'; S.ptab = 'abil'; setTab('players'); return; }
    if (b.dataset.qreset != null && pl) {
      const nm = pget(pl, 'name') || 'ID ' + pl.id;
      // vuelve atrás los pasos hechos en esta ventana (siguen en Rehacer)
      while (S.hp > QE.start.hp) undo();
      QE.start.changed = false; toast(nm + ': como estaba al abrir la ventana.'); qePaint(); return;
    }
    if (b.dataset.qadd != null) {
      const id = QE.pid; if (!canMakeEditPlayer(id)) return;
      edit('Agregar ' + (playerName(id) || id) + ' al EDIT', 'players', editPlayersRegion(1), () => { insertEditPlayers([id]); });
      S.hist[S.hp - 1] && (S.hist[S.hp - 1].reindex = true); S.ix = PD.index(S.d, S.f.game); rebuildTeamOf();
      const np = S.ix.byId.get(id); QE.start = { r: np ? rating(np) : 0, hp: S.hp, changed: false };
      toast((playerName(id) || 'ID ' + id) + ' agregado a tu EDIT. Ctrl+Z lo deshace.'); qePaint();
    }
  });
  qePaint();
  requestAnimationFrame(() => { const f = bg.querySelector('#qeRange') || bg.querySelector('[data-qx]'); if (f) f.focus({ preventScroll: true }); });
}
