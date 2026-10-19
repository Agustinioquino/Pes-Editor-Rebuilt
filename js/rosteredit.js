// Edición directa en la tabla del plantel: un clic en el nombre, la posición, la edad, la altura, la nacionalidad
// o el pie abre el campo ahí mismo; Enter (o salir del campo) guarda, Esc cancela y Tab pasa al siguiente dato de la fila.
// La celda se abre con una animación y, al guardar, el valor nuevo entra con un destello.
const RIE_LABEL = { name: 'nombre', pos: 'posición', age: 'edad', h: 'altura', nat: 'nacionalidad', foot: 'pie hábil' };
// atributo para las celdas que se pueden editar (los jugadores de la base del juego ofrecen agregarlos al EDIT)
const RIE_WHAT = { name: 'el nombre', pos: 'la posición', age: 'la edad', h: 'la altura', nat: 'la nacionalidad', foot: 'el pie hábil' };
const rieAttr = (pid, kind) => ` data-ie="${kind}" tabindex="0" title="${S.ix.byId.has(pid) ? 'Tocá para cambiar ' + RIE_WHAT[kind] : 'Está en la base del juego: tocá para agregarlo a tu EDIT y editarlo'}"`;
let RIE_NAT = null;
function rieNatOptions(v) {
  if (!RIE_NAT) RIE_NAT = [...COUNTRY].sort((a, b) => a[1].localeCompare(b[1], 'es'));
  return (COUNTRY.has(v) ? '' : `<option value="${v}" selected>ID ${v}</option>`) + RIE_NAT.map(([id, n]) => `<option value="${id}"${id === v ? ' selected' : ''}>${esc(n)}</option>`).join('');
}
function rieField(p, kind) {
  const g = k => pget(p, k);
  if (kind === 'name') return `<input type="text" class="ie-in ie-name" value="${esc(g('name'))}" maxlength="60" spellcheck="false" aria-label="Nombre del jugador">`;
  if (kind === 'age') return `<input type="number" class="ie-in ie-num" value="${g('age')}" min="15" max="50" aria-label="Edad">`;
  if (kind === 'h') return `<input type="number" class="ie-in ie-num" value="${g('height')}" min="140" max="220" aria-label="Altura en cm">`;
  if (kind === 'pos') { const reg = g('reg_pos'); return `<select class="ie-in" aria-label="Posición">${POS.map((_, i) => `<option value="${i}"${i === reg ? ' selected' : ''}>${posCode(i)} · ${POS_LONG[i]}</option>`).join('')}</select>`; }
  if (kind === 'nat') return `<select class="ie-in" aria-label="Nacionalidad">${rieNatOptions(g('nation'))}</select>`;
  return '';
}
// lo que se ve en la celda después de guardar (sin volver a dibujar toda la tabla)
function rieShow(cell, p, kind) {
  if (kind === 'name') cell.textContent = pget(p, 'name') || playerName(p.id);
  else if (kind === 'age') cell.textContent = pget(p, 'age');
  else if (kind === 'h') cell.textContent = pget(p, 'height');
  else if (kind === 'foot') cell.textContent = pget(p, 'strong_foot') ? 'Izq.' : 'Der.';
  else if (kind === 'nat') { const n = pget(p, 'nation'), nm = COUNTRY.get(n) || 'País ' + n; cell.innerHTML = `<span class="natw">${natFlag(n)}<span class="natc" title="${esc(nm)}">${esc(nm)}</span></span>`; }
}
function rieFlash(el) {
  if (!el) return;
  el.classList.remove('ie-ok'); void el.offsetWidth; el.classList.add('ie-ok');
  setTimeout(() => el.classList.remove('ie-ok'), 1300);
}
function rieBind(t, m, tb) {
  let open = null;
  const rowOf = pid => tb.querySelector(`tr.prow[data-pid="${pid}"]`);
  const cellOf = (pid, kind) => { const tr = rowOf(pid); return tr && tr.querySelector(`[data-ie="${kind}"]`); };
  // guarda el cambio en el EDIT (con deshacer) y actualiza la fila en el lugar
  function apply(p, kind, raw) {
    const nm = pget(p, 'name') || playerName(p.id) || 'Jugador ' + p.id, lab = nm + ': ' + RIE_LABEL[kind];
    let k, v;
    if (kind === 'name') { v = String(raw).trim(); if (!v) { toast('El jugador necesita un nombre.'); return false; } if (nameBytes(v) > NAME_MAX) toast('El nombre pasa los ' + NAME_MAX + ' caracteres que guarda el juego: se corta al final.', 5000); k = 'name'; }
    else if (kind === 'age' || kind === 'h') { const [lo, hi] = kind === 'age' ? [15, 50] : [140, 220]; v = Math.round(parseFloat(raw)); if (isNaN(v)) return false; v = Math.max(lo, Math.min(hi, v)); k = kind === 'age' ? 'age' : 'height'; }
    else if (kind === 'pos') { v = +raw; k = 'reg_pos'; }
    else if (kind === 'nat') { v = +raw; k = 'nation'; }
    else if (kind === 'foot') { v = pget(p, 'strong_foot') ? 0 : 1; k = 'strong_foot'; }
    if (pget(p, k) === v) return false;
    // la posición natural también queda como A en el mapa de posiciones (un solo paso para deshacer)
    if (k === 'reg_pos') edit(lab, 'p' + p.id, regP(p), () => { PD.player.set(S.d, p.base, k, v); const pp = 'pos' + POS_TO_PP[v]; if (pget(p, pp) < 2) PD.player.set(S.d, p.base, pp, 2); if (S.autoLock) for (const fl of [...LOCK_FLAGS, ...FIELD_FLAGS(k), ...FIELD_FLAGS(pp)]) PD.player.set(S.d, p.base, fl, 1); });
    else setP(p, k, v, lab);
    return true;
  }
  function close(commit, next) {
    if (!open) return;
    const o = open; open = null;
    const val = o.input.value, p = o.p;
    const changed = commit && apply(p, o.kind, val);
    if (changed && o.kind === 'pos') {
      // la posición cambia la valoración, el grupo y el orden: se vuelve a dibujar y después se marca la fila
      renderTeams(m);
      const tr = document.querySelector(`#rtable tr.prow[data-pid="${p.id}"]`);
      if (tr) { rieFlash(tr.querySelector('[data-ie="pos"]')); rieFlash(tr.querySelector('.c-val')); }
      return;
    }
    o.cell.classList.remove('ie-on');
    if (changed) { rieShow(o.cell, p, o.kind); rieSync(p, o.kind); rieFlash(o.cell); updateTop(); }
    else o.cell.innerHTML = o.html;
    if (next) { const c = cellOf(p.id, next); if (c) start(c); }
  }
  // datos de la fila que usan el filtro, el orden y el resumen de abajo
  function rieSync(p, kind) {
    const tr = rowOf(p.id), w = S._rrows && S._rrows.find(x => x.pid === p.id); if (!tr) return;
    const m2 = pMeta(p.id), nm = playerName(p.id);
    if (w) Object.assign(w, m2, { name: nm, age: pget(p, 'age') });
    if (kind === 'age') tr.dataset.a = pget(p, 'age');
    if (kind === 'h') tr.dataset.h = pget(p, 'height');
    if (kind === 'name' || kind === 'nat') { const i = pInfo(p.id); tr.dataset.q = foldTxt([nm, p.id, w ? w.num : '', i ? POS[i.pos] : '', m2.natName].join(' ')); }
    rosterFilter();
  }
  function start(cell) {
    if (open) close(true);
    const tr = cell.closest('tr.prow'), pid = +tr.dataset.pid, kind = cell.dataset.ie, p = S.ix.byId.get(pid);
    if (!p) { toast((playerName(pid) || 'ID ' + pid) + ' sale de la base del juego. Agregalo a tu EDIT para editarlo.', 6000, typeof canMakeEditPlayer === 'function' && canMakeEditPlayer(pid) ? ['Agregar a mi EDIT', () => addDbPlayer(pid, false)] : undefined); return; }
    if (kind === 'foot') { if (apply(p, 'foot')) { rieShow(cell, p, 'foot'); rieSync(p, 'foot'); rieFlash(cell); updateTop(); } return; }
    open = { cell, kind, p, html: cell.innerHTML };
    cell.innerHTML = `<span class="ie-box">${rieField(p, kind)}</span>`; cell.classList.add('ie-on');
    const input = open.input = cell.querySelector('.ie-in');
    input.focus(); if (input.select && input.tagName === 'INPUT') input.select();
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(false); }
      else if (e.key === 'Enter') { e.preventDefault(); close(true); }
      else if (e.key === 'Tab') {
        e.preventDefault();
        const ks = [...tr.querySelectorAll('[data-ie]')].filter(c => c.offsetParent).map(c => c.dataset.ie).filter(k => k !== 'foot'), at = ks.indexOf(kind);
        close(true, ks[(at + (e.shiftKey ? -1 : 1) + ks.length) % ks.length]);
      }
    });
    if (input.tagName === 'SELECT') input.addEventListener('change', () => close(true));
    input.addEventListener('blur', () => setTimeout(() => { if (open && open.input === input) close(true); }, 0));
  }
  tb.addEventListener('click', e => {
    const c = e.target.closest('[data-ie]'); if (!c || !tb.contains(c) || c.classList.contains('ie-on')) return;
    if (e.target.closest('button, a, input, select') && !e.target.closest('.ie-in')) return;
    start(c);
  });
  tb.addEventListener('keydown', e => { const c = e.target.closest && e.target.closest('[data-ie]'); if (c && !c.classList.contains('ie-on') && (e.key === 'Enter' || e.key === 'F2')) { e.preventDefault(); start(c); } });
}
