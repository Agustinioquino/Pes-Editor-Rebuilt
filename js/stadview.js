// Estadio local como lo muestra el juego: vista previa arriba y la lista de opciones abajo (Estadio local, nombre y
// opciones detalladas: césped, color del campo, asientos, arco y red). ↑ ↓ eligen la fila, ← → cambian el valor,
// Enter abre la lista o el color. La fila elegida se resalta con un barrido de luz, como en el menú del juego.
// Los campos del EDIT están en js/pesdata.js (net1r…net_design, turf, side_color, seat_color, e_staddet).
const SV_TURFS = 8, SV_GOALS = 4, SV_NETS = 4, SV_DESIGNS = 4;
// paletas de 16 colores del juego para el borde del campo y los asientos: el 5 está tomado de una captura del juego,
// los demás son aproximados hasta tener la paleta entera
const SV_SIDE = ['#3f6b3a', '#2f5f8a', '#7a2e2e', '#5a5a5a', '#8a6a3a', '#4b5a33', '#2d4f2d', '#9a9a9a', '#1f3f6f', '#6f1f1f', '#b08040', '#3a3a3a', '#2a6a5a', '#5a2a6a', '#c0c0b0', '#203020'];
const SV_SEAT = ['#c0392b', '#2c5fa8', '#d4b20f', '#e0e0e0', '#333333', '#2f9e5b', '#7b2d8b', '#e67e22', '#1abc9c', '#8b0000', '#003366', '#95a5a6', '#f1c40f', '#5d4037', '#ff69b4', '#4caf50'];
const SV_SURE = { side_color: new Set([5]), seat_color: new Set([5]) };
const sv6 = v => Math.round((v & 63) * 255 / 63).toString(16).padStart(2, '0');
const svRgb = (t, n) => '#' + sv6(tget(t, 'net' + n + 'r')) + sv6(tget(t, 'net' + n + 'g')) + sv6(tget(t, 'net' + n + 'b'));
const svTipo = v => v ? 'Tipo ' + v : 'Defecto';
// filas del menú: [clave, etiqueta, tipo de vista previa]
const SV_ROWS = [['stadium', 'Estadio local', 'stand'], ['name', 'Nombre de estadio por equipo', 'stand'],
  ['turf', 'Tipo de césped', 'pitch'], ['side_color', 'Color del campo', 'pitch'], ['seat_color', 'Color de los asientos', 'stand'],
  ['goal_style', 'Estilo de la portería', 'goal'], ['net_pattern', 'Diseño de la red', 'goal'], ['net_design', 'Diseño red portería', 'goal'],
  ['net1', 'Color de red de porterías 1', 'goal'], ['net2', 'Color de red de porterías 2', 'goal']];
const SV_MAX = { turf: SV_TURFS, side_color: 15, seat_color: 15, goal_style: SV_GOALS - 1, net_pattern: SV_NETS - 1, net_design: SV_DESIGNS - 1 };

// ---------- vistas previas (SVG) ----------
// rayas del césped según el tipo (aproximadas: el juego tiene 8 dibujos)
function svTurf(type, x, y, w, h, id) {
  const a = '#4f9a45', b = '#5fae52', st = [];
  const vs = n => { for (let i = 0; i < n; i += 2) st.push(`<rect x="${x + i * w / n}" y="${y}" width="${w / n}" height="${h}" fill="${b}"/>`); };
  const hs = n => { for (let i = 0; i < n; i += 2) st.push(`<rect x="${x}" y="${y + i * h / n}" width="${w}" height="${h / n}" fill="${b}"/>`); };
  switch (type) {
    case 1: vs(10); break;
    case 2: vs(18); break;
    case 3: hs(8); break;
    case 4: for (let i = 0; i < 12; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) st.push(`<rect x="${x + i * w / 12}" y="${y + j * h / 8}" width="${w / 12}" height="${h / 8}" fill="${b}"/>`); break;
    case 5: for (let r = 7; r >= 1; r--) st.push(`<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${r * w / 13}" fill="${r % 2 ? b : a}"/>`); break;
    case 6: st.push(`<g clip-path="url(#${id}c)">${[...Array(16)].map((_, i) => `<polygon points="${x + i * w / 8 - w / 2},${y + h} ${x + i * w / 8 - w / 2 + w / 16},${y + h} ${x + i * w / 8 + w / 16},${y} ${x + i * w / 8},${y}" fill="${b}"/>`).join('')}</g>`); break;
    case 7: for (let i = 0; i < 14; i++) if (i % 3 !== 1) st.push(`<rect x="${x + i * w / 14}" y="${y}" width="${w / 14 * (i % 3 ? 1 : .5)}" height="${h}" fill="${b}"/>`); break;
    case 8: break;
    default: vs(12);
  }
  return `<clipPath id="${id}c"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${a}"/>${st.join('')}`;
}
function svPitch(t) {
  const x = 40, y = 14, w = 320, h = 182, side = SV_SIDE[tget(t, 'side_color')] || SV_SIDE[0], L = 'stroke="#fff" stroke-width="1.6" fill="none"';
  return `<svg viewBox="0 0 400 210" class="sv-svg sv-pitch" role="img" aria-label="Césped visto desde arriba">
    <rect width="400" height="210" fill="${side}"/>
    ${svTurf(tget(t, 'turf'), x, y, w, h, 'svp')}
    <g ${L}><rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}"/><line x1="${x + w / 2}" y1="${y + 6}" x2="${x + w / 2}" y2="${y + h - 6}"/><circle cx="${x + w / 2}" cy="${y + h / 2}" r="26"/>
      <rect x="${x + 6}" y="${y + h / 2 - 48}" width="46" height="96"/><rect x="${x + 6}" y="${y + h / 2 - 22}" width="16" height="44"/><path d="M${x + 52} ${y + h / 2 - 18} a24 24 0 0 1 0 36"/>
      <rect x="${x + w - 52}" y="${y + h / 2 - 48}" width="46" height="96"/><rect x="${x + w - 22}" y="${y + h / 2 - 22}" width="16" height="44"/><path d="M${x + w - 52} ${y + h / 2 - 18} a24 24 0 0 0 0 36"/></g>
  </svg>`;
}
function svStand(t) {
  const seat = SV_SEAT[tget(t, 'seat_color')] || SV_SEAT[0], side = SV_SIDE[tget(t, 'side_color')] || SV_SIDE[0];
  const dots = []; for (let r = 0; r < 5; r++) for (let i = 0; i < 46; i++) if ((i * 7 + r * 3) % 5) dots.push(`<circle cx="${8 + i * 8.6 + (r % 2) * 4}" cy="${70 + r * 9}" r="1.6" fill="${(i + r) % 4 ? '#f2f2f2' : '#c43b2f'}" opacity=".85"/>`);
  return `<svg viewBox="0 0 400 210" class="sv-svg sv-stand" role="img" aria-label="Vista del estadio">
    <defs><linearGradient id="svsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef3f7"/><stop offset="1" stop-color="#cfd9e0"/></linearGradient></defs>
    <rect width="400" height="210" fill="url(#svsky)"/>
    <path d="M0 52 L20 40 L60 46 L90 34 L130 44 L400 40 L400 64 L0 64Z" fill="#b8c2c8"/>
    <rect x="70" y="10" width="5" height="40" fill="#9aa4aa"/><rect x="64" y="6" width="17" height="9" fill="#e9eef1" stroke="#9aa4aa"/>
    <path d="M0 58 L400 52 L400 64 L0 70Z" fill="#59636a"/>
    <path d="M0 66 L400 60 L400 118 L0 118Z" fill="${seat}"/>
    ${dots.join('')}
    <rect x="0" y="116" width="400" height="10" fill="${side}"/>
    <path d="M0 126 L400 126 L400 210 L0 210Z" fill="#4f9a45"/>
    <g clip-path="url(#svst)"><clipPath id="svst"><path d="M0 126 L400 126 L400 210 L0 210Z"/></clipPath>${[...Array(9)].map((_, i) => `<path d="M${i * 50 - 10} 126 L${i * 50 + 15} 126 L${i * 70 - 100} 210 L${i * 70 - 135} 210Z" fill="#5fae52"/>`).join('')}</g>
    <path d="M0 140 L400 132" stroke="#fff" stroke-width="1.5"/><path d="M190 132 L150 210" stroke="#fff" stroke-width="1.5"/>
    <g transform="translate(330 120)"><rect x="0" y="0" width="34" height="18" fill="none" stroke="#fff" stroke-width="2"/><rect x="2" y="1" width="30" height="16" fill="${svRgb(t, 1)}" opacity=".35"/></g>
  </svg>`;
}
// arco de frente: estilo (forma), diseño de la red (malla) y diseño de colores (color 2 en franjas)
function svGoal(t) {
  const c1 = svRgb(t, 1), c2 = svRgb(t, 2), st = tget(t, 'goal_style'), pat = tget(t, 'net_pattern'), des = tget(t, 'net_design');
  const mesh = pat === 1 ? `<pattern id="svm" width="10" height="9" patternUnits="userSpaceOnUse"><path d="M0 4.5 L2.5 0 L7.5 0 L10 4.5 L7.5 9 L2.5 9Z" fill="none" stroke="${c1}" stroke-width=".8"/></pattern>`
    : pat === 2 ? `<pattern id="svm" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M4.5 0 L9 4.5 L4.5 9 L0 4.5Z" fill="none" stroke="${c1}" stroke-width="1"/></pattern>`
    : pat === 3 ? `<pattern id="svm" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0 L8 8 M8 0 L0 8" stroke="${c1}" stroke-width=".9"/></pattern>`
    : `<pattern id="svm" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0 H8 M0 0 V8" stroke="${c1}" stroke-width=".8"/></pattern>`;
  const bands = des === 1 ? [...Array(6)].map((_, i) => `<rect x="${90 + i * 40}" y="40" width="20" height="120" fill="${c2}" opacity=".4"/>`).join('')
    : des === 2 ? [...Array(4)].map((_, i) => `<rect x="90" y="${40 + i * 32}" width="220" height="16" fill="${c2}" opacity=".4"/>`).join('')
    : des === 3 ? [...Array(11)].map((_, i) => [...Array(6)].map((_, j) => (i + j) % 2 ? `<rect x="${90 + i * 20}" y="${40 + j * 20}" width="20" height="20" fill="${c2}" opacity=".4"/>` : '').join('')).join('') : '';
  const back = st === 1 ? 'M90 40 L310 40 L290 70 L110 70Z' : st === 2 ? 'M90 40 Q200 20 310 40 L290 80 Q200 64 110 80Z' : st === 3 ? 'M90 40 L310 40 L280 90 L120 90Z' : 'M90 40 L310 40 L300 60 L100 60Z';
  return `<svg viewBox="0 0 400 210" class="sv-svg sv-goal" role="img" aria-label="Arco y red">
    <defs>${mesh}<clipPath id="svgc"><rect x="90" y="40" width="220" height="120"/></clipPath></defs>
    <rect width="400" height="210" fill="#cfd9e0"/><rect y="150" width="400" height="60" fill="#4f9a45"/><path d="M0 172 L400 172" stroke="#fff" stroke-width="2"/>
    <path d="${back}" fill="url(#svm)" opacity=".9"/>
    <g clip-path="url(#svgc)">${bands}<rect x="90" y="40" width="220" height="120" fill="url(#svm)"/></g>
    <path d="M90 162 L90 38 L310 38 L310 162" fill="none" stroke="#fafafa" stroke-width="6" stroke-linejoin="${st === 2 ? 'round' : 'miter'}"/>
  </svg>`;
}

// ---------- tarjeta ----------
function svValue(t, k) {
  const sw = (c, tip) => `<span class="sv-sw" style="--c:${c}" title="${esc(tip)}"></span>`;
  if (k === 'stadium') { const sid = tget(t, 'stadium_id'); return `<span class="sv-val">${esc(STADIUM.get(sid) || 'Estadio ' + sid)}</span><select id="tStad" class="sv-pick" tabindex="-1" aria-label="Estadio local">${STADIUM.has(sid) ? '' : `<option value="${sid}" selected>ID ${sid}</option>`}${[...STADIUM].map(([id, n]) => `<option value="${id}" ${id === sid ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`; }
  if (k === 'name') return `<input type="text" id="tStadName" class="sv-text" value="${esc(tget(t, 'stadium_name'))}" maxlength="120" placeholder="El del juego" aria-label="Nombre de estadio por equipo">`;
  if (k === 'side_color' || k === 'seat_color') { const v = tget(t, k), pal = k === 'side_color' ? SV_SIDE : SV_SEAT; return sw(pal[v] || '#888', `Color ${v + 1} de 16${SV_SURE[k].has(v) ? '' : ' (tono aproximado)'}`); }
  if (k === 'net1' || k === 'net2') { const c = svRgb(t, k.slice(3)); return `${sw(c, c)}<input type="color" class="sv-color" data-svc="${k}" value="${c}" tabindex="-1" aria-label="Elegir color">`; }
  if (k === 'net_design') return `<span class="sv-val">${tget(t, k) ? 'Tipo ' + tget(t, k) : 'Sin franjas'}</span>`;
  return `<span class="sv-val">${svTipo(tget(t, k))}</span>`;
}
function svPreview(t, row) {
  const kind = SV_ROWS[row][2];
  const sid = tget(t, 'stadium_id'), ids = [...STADIUM.keys()];
  const count = kind === 'pitch' && SV_ROWS[row][0] === 'turf' ? `${tget(t, 'turf') || '–'}/${SV_TURFS}` : kind === 'stand' ? `${ids.indexOf(sid) + 1 || '–'}/${ids.length}` : '';
  return `<div class="sv-shot sv-${kind}" data-kind="${kind}">${kind === 'pitch' ? svPitch(t) : kind === 'goal' ? svGoal(t) : svStand(t)}</div><div class="sv-count">${count}</div>`;
}
function stadViewCard(t) {
  const row = Math.max(0, Math.min(SV_ROWS.length - 1, S.svRow || 0));
  return `<div class="card sv-card" id="stadView"><div class="sv-head">${crest(t, 'mini')}<b>Opciones de estadio local</b><span class="sv-help">↑ ↓ elegir · ← → cambiar · Enter abrir</span></div>
    <div class="sv-prev" id="svPrev">${svPreview(t, row)}</div>
    <div class="sv-list" id="svList" role="listbox" tabindex="0" aria-label="Opciones de estadio local" aria-activedescendant="svr${row}">
      ${SV_ROWS.map(([k, n], i) => `${i === 2 ? '<div class="sv-sep">Opciones detalladas</div>' : ''}<div class="sv-row${i === row ? ' on' : ''}" id="svr${i}" role="option" aria-selected="${i === row}" data-svr="${i}" data-k="${k}">
        <span class="sv-lab">${n}</span><span class="sv-cell">${SV_MAX[k] != null ? '<button type="button" class="sv-arr" data-step="-1" aria-label="Anterior" tabindex="-1">❮</button>' : ''}<span class="sv-v">${svValue(t, k)}</span>${SV_MAX[k] != null ? '<button type="button" class="sv-arr" data-step="1" aria-label="Siguiente" tabindex="-1">❯</button>' : ''}</span></div>`).join('')}
    </div>
    <p class="note">La vista es aproximada: muestra los colores y tipos que guarda el EDIT. Al cambiar algo se activa "Opciones detalladas: Establecido" para este equipo.</p></div>`;
}
function bindStadView(t) {
  const card = $('stadView'); if (!card) return;
  const list = $('svList');
  const sel = (i, focus) => {
    i = (i + SV_ROWS.length) % SV_ROWS.length; const prev = S.svRow || 0; S.svRow = i;
    card.querySelectorAll('.sv-row').forEach(r => { const on = +r.dataset.svr === i; r.classList.toggle('on', on); r.setAttribute('aria-selected', on); });
    list.setAttribute('aria-activedescendant', 'svr' + i);
    const r = card.querySelector(`[data-svr="${i}"]`); r.classList.remove('sv-hit'); void r.offsetWidth; r.classList.add('sv-hit');
    if (SV_ROWS[prev][2] !== SV_ROWS[i][2] || SV_ROWS[i][0] === 'turf' || SV_ROWS[prev][0] === 'turf') svRedraw(true); else svRedraw(false);
    if (focus) r.scrollIntoView({ block: 'nearest' });
  };
  const svRedraw = swap => { const p = $('svPrev'); p.innerHTML = svPreview(t, S.svRow || 0); if (swap) { p.classList.remove('sv-swap'); void p.offsetWidth; p.classList.add('sv-swap'); } };
  const label = k => 'Estadio de ' + tget(t, 'name') + ': ' + SV_ROWS.find(r => r[0] === k)[1].toLowerCase();
  const refresh = k => { const r = card.querySelector(`.sv-row[data-k="${k}"]`); r.querySelector('.sv-v').innerHTML = svValue(t, k); const v = r.querySelector('.sv-v'); v.classList.remove('sv-bump'); void v.offsetWidth; v.classList.add('sv-bump'); svRedraw(false); };
  const step = (k, d) => {
    if (k === 'stadium') { const ids = [...STADIUM.keys()], at = ids.indexOf(tget(t, 'stadium_id')), nx = ids[(at + d + ids.length) % ids.length]; setT(t, [['stadium_id', nx], ['e_stadium', 1]], 'Estadio de ' + tget(t, 'name')); refresh(k); updateTop(); return; }
    const mx = SV_MAX[k]; if (mx == null) return;
    const v = (tget(t, k) + d + mx + 1) % (mx + 1);
    setT(t, [[k, v], ['e_staddet', 1]], label(k)); refresh(k); updateTop();
  };
  const open = k => { const r = card.querySelector(`.sv-row[data-k="${k}"]`); const x = r.querySelector('#tStad, #tStadName, .sv-color'); if (!x) return; if (x.type === 'text') { x.focus(); x.select(); } else if (x.showPicker) { try { x.showPicker(); } catch { x.click(); } } else x.click(); };
  card.addEventListener('click', e => {
    const r = e.target.closest('.sv-row'); if (!r) return;
    const i = +r.dataset.svr; if (i !== (S.svRow || 0)) sel(i);
    const a = e.target.closest('[data-step]'); if (a) { step(r.dataset.k, +a.dataset.step); return; }
    if (!e.target.closest('input, select')) { if (SV_MAX[r.dataset.k] != null && e.target.closest('.sv-cell')) step(r.dataset.k, 1); else if (/^(net1|net2|stadium)$/.test(r.dataset.k) && e.target.closest('.sv-cell')) open(r.dataset.k); }
  });
  card.addEventListener('input', e => { const c = e.target.closest('[data-svc]'); if (!c) return; const sw = c.previousElementSibling; if (sw) sw.style.setProperty('--c', c.value); });
  card.addEventListener('change', e => {
    const c = e.target.closest('[data-svc]'); if (!c) return;
    const n = c.dataset.svc.slice(3), h = c.value.slice(1), to6 = s => Math.round(parseInt(s, 16) * 63 / 255);
    setT(t, [['net' + n + 'r', to6(h.slice(0, 2))], ['net' + n + 'g', to6(h.slice(2, 4))], ['net' + n + 'b', to6(h.slice(4, 6))], ['e_staddet', 1]], label(c.dataset.svc)); refresh(c.dataset.svc); updateTop();
  });
  list.addEventListener('keydown', e => {
    if (e.target.closest('input[type=text]')) { if (e.key === 'Enter' || e.key === 'Escape') { e.target.blur(); list.focus(); } return; }
    const i = S.svRow || 0, k = SV_ROWS[i][0];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel(i + (e.key === 'ArrowDown' ? 1 : -1), true); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); step(k, e.key === 'ArrowRight' ? 1 : -1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(k); }
  });
}
