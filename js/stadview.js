// Estadio local como lo muestra el juego: vista previa arriba y la lista de opciones abajo (Estadio local, nombre y
// opciones detalladas: césped, color del campo, asientos, arco y red). ↑ ↓ eligen la fila, ← → cambian el valor,
// Enter abre la lista o el color. La fila elegida se resalta con un barrido de luz, como en el menú del juego.
// Los campos del EDIT están en js/pesdata.js (net1r…net_design, turf, side_color, seat_color, e_staddet).
const SV_TURFS = 8, SV_GOALS = 4, SV_NETS = 2, SV_DESIGNS = 15;
// paletas de "Configurar color" del juego (8 colores cada una, el EDIT guarda 1-8; 0 = sin elegir)
const SV_SIDE = ['#8f8f8f', '#9e5f3e', '#7f3e3e', '#5f3e36', '#465f2e', '#46462e', '#5f96af', '#2e4e87'];
const SV_SEAT = ['#cecece', '#debe1e', '#de8f2e', '#be3e2e', '#2e9e4e', '#7fbede', '#2e6fbe', '#2e3e6f'];
// "Diseño red portería": 1-3 son redes de un color fijo (no usan los colores de red 1 y 2), 4-15 son los tipos 1-12
const SV_DESIGN_FIX = ['Blanca', 'Negra', 'Verde'];
const sv6 = v => Math.round((v & 63) * 255 / 63).toString(16).padStart(2, '0');
const svRgb = (t, n) => '#' + sv6(tget(t, 'net' + n + 'r')) + sv6(tget(t, 'net' + n + 'g')) + sv6(tget(t, 'net' + n + 'b'));
const svTipo = v => v ? 'Tipo ' + v : 'Del juego';
const svDesign = v => !v ? 'Del juego' : v <= 3 ? SV_DESIGN_FIX[v - 1] : 'Tipo ' + (v - 3);
// filas del menú: [clave, etiqueta, tipo de vista previa]
const SV_ROWS = [['stadium', 'Estadio local', 'stand'], ['name', 'Nombre de estadio por equipo', 'stand'],
  ['turf', 'Tipo de césped', 'turf'], ['side_color', 'Color del campo', 'side'], ['seat_color', 'Color de los asientos', 'seat'],
  ['goal_style', 'Estilo de la portería', 'goal'], ['net_pattern', 'Diseño de la red', 'mesh'], ['net_design', 'Diseño red portería', 'net'],
  ['net1', 'Color de red de porterías 1', 'net'], ['net2', 'Color de red de porterías 2', 'net']];
// valores que se recorren con ← →, en el orden del juego. Estilo de portería: goal_style guarda los tipos 1-3 y el
// tipo 4 es un bit aparte (goal4), comparado con un EDIT guardado en el juego con el tipo 4
const svGoalTipo = t => tget(t, 'goal4') ? 4 : tget(t, 'goal_style');
const svRange = (a, b) => [...Array(b - a + 1)].map((_, i) => a + i);
const SV_OPTS = { turf: svRange(1, SV_TURFS), side_color: svRange(1, 8), seat_color: svRange(1, 8), goal_style: [1, 2, 3, 4], net_pattern: svRange(1, SV_NETS), net_design: svRange(1, SV_DESIGNS) };
const SV_MAX = SV_OPTS; // filas con flechas
// fotos tomadas del juego (assets/estadio): estadios que tienen la suya y céspedes con captura
const SV_DIR = 'assets/estadio/';
// los 31 estadios del menú del juego, en su orden. Los 14 primeros tienen licencia: con ellos el juego no deja cambiar
// el nombre ni las opciones detalladas (el 3, Allianz Parque, está deducido: falta su captura)
const SV_GAME = [24, 59, 33, 34, 35, 36, 81, 14, 16, 27, 28, 62, 61, 74, 29, 46, 13, 50, 43, 15, 17, 18, 19, 20, 40, 42, 44, 45, 47, 54, 55];
const SV_LICENSED = new Set(SV_GAME.slice(0, 14));
const SV_STAD_PHOTO = new Set(SV_GAME.filter(id => id !== 33));
const svLocked = t => SV_LICENSED.has(tget(t, 'stadium_id'));
const SV_TURF_PHOTO = new Set([1, 2, 3, 4, 5, 7, 8]);

// ---------- fotos teñidas ----------
// Las capturas del juego muestran un color de ejemplo (borde verde, asientos verdes, red roja y amarilla). Se cambia ese
// color por el elegido conservando las luces y sombras: cada píxel se mide contra el color de ejemplo y se le suma la
// diferencia con el color nuevo en la misma proporción.
const SV_TINT = new Map();
const svHex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function svTintSrc(file, pairs) {
  const key = file + '|' + pairs.map(([a, b]) => a + b).join();
  if (SV_TINT.has(key)) return SV_TINT.get(key);
  const pr = new Promise(res => {
    const im = new Image();
    im.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
        const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
        const img = x.getImageData(0, 0, c.width, c.height), d = img.data;
        const P = pairs.map(([from, to]) => { const f = svHex(from), m = (f[0] + f[1] + f[2]) / 3, ch = f.map(v => v - m), n2 = ch.reduce((a, v) => a + v * v, 0); return { f, ch, n2, nn: Math.sqrt(n2), to: svHex(to) }; });
        for (let i = 0; i < d.length; i += 4) {
          const m = (d[i] + d[i + 1] + d[i + 2]) / 3, c0 = d[i] - m, c1 = d[i + 1] - m, c2 = d[i + 2] - m, cn = Math.hypot(c0, c1, c2);
          if (cn < 6) continue;
          for (const p of P) {
            const dot = c0 * p.ch[0] + c1 * p.ch[1] + c2 * p.ch[2];
            if (dot / (cn * p.nn) < .82) continue;
            const a = Math.min(1.25, dot / p.n2);
            for (let k = 0; k < 3; k++) d[i + k] = Math.max(0, Math.min(255, d[i + k] + a * (p.to[k] - p.f[k])));
            break;
          }
        }
        x.putImageData(img, 0, 0); res(c.toDataURL('image/jpeg', .88));
      } catch { res(SV_DIR + file); }
    };
    im.onerror = () => res(null);
    im.src = SV_DIR + file;
  });
  SV_TINT.set(key, pr); return pr;
}
// colores de ejemplo de cada captura
const SV_FROM = { side: '#46602e', seat: '#14a014', red: '#c81e23', yellow: '#d2dc3c' };
function svPhoto(file, alt, tint) {
  return `<img class="sv-img" src="${SV_DIR + file}" alt="${esc(alt)}" draggable="false"${tint ? ` data-tint="${esc(JSON.stringify(tint))}"` : ''} onerror="this.closest('.sv-shot')&&this.closest('.sv-shot').classList.add('sv-noimg')">`;
}
// cambia las fotos con data-tint por su versión teñida (quedan ocultas hasta tenerla, así no se ve el color de ejemplo)
function svApplyTint(root) {
  root.querySelectorAll('img[data-tint]').forEach(im => {
    const [file, pairs] = JSON.parse(im.dataset.tint);
    svTintSrc(file, pairs).then(src => { if (!im.isConnected) return; if (src) im.src = src; im.removeAttribute('data-tint'); });
  });
}

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
  const x = 40, y = 14, w = 320, h = 182, side = SV_SIDE[tget(t, 'side_color') - 1] || SV_SIDE[4], L = 'stroke="#fff" stroke-width="1.6" fill="none"';
  return `<svg viewBox="0 0 400 210" preserveAspectRatio="xMidYMid slice" class="sv-svg sv-pitch" role="img" aria-label="Césped visto desde arriba">
    <rect width="400" height="210" fill="${side}"/>
    ${svTurf(tget(t, 'turf'), x, y, w, h, 'svp')}
    <g ${L}><rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}"/><line x1="${x + w / 2}" y1="${y + 6}" x2="${x + w / 2}" y2="${y + h - 6}"/><circle cx="${x + w / 2}" cy="${y + h / 2}" r="26"/>
      <rect x="${x + 6}" y="${y + h / 2 - 48}" width="46" height="96"/><rect x="${x + 6}" y="${y + h / 2 - 22}" width="16" height="44"/><path d="M${x + 52} ${y + h / 2 - 18} a24 24 0 0 1 0 36"/>
      <rect x="${x + w - 52}" y="${y + h / 2 - 48}" width="46" height="96"/><rect x="${x + w - 22}" y="${y + h / 2 - 22}" width="16" height="44"/><path d="M${x + w - 52} ${y + h / 2 - 18} a24 24 0 0 0 0 36"/></g>
  </svg>`;
}
function svStand(t) {
  const seat = SV_SEAT[tget(t, 'seat_color') - 1] || SV_SEAT[0], side = SV_SIDE[tget(t, 'side_color') - 1] || SV_SIDE[4];
  const dots = []; for (let r = 0; r < 5; r++) for (let i = 0; i < 46; i++) if ((i * 7 + r * 3) % 5) dots.push(`<circle cx="${8 + i * 8.6 + (r % 2) * 4}" cy="${70 + r * 9}" r="1.6" fill="${(i + r) % 4 ? '#f2f2f2' : '#c43b2f'}" opacity=".85"/>`);
  return `<svg viewBox="0 0 400 210" preserveAspectRatio="xMidYMid slice" class="sv-svg sv-stand" role="img" aria-label="Vista del estadio">
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
  const st = tget(t, 'goal_style'), pat = tget(t, 'net_pattern'), des = Math.max(0, tget(t, 'net_design') - 3) % 4, fix = ['#f4f4f4', '#222', '#1f7a2e'][tget(t, 'net_design') - 1], c1 = fix || svRgb(t, 1), c2 = fix || svRgb(t, 2);
  const mesh = pat === 1 ? `<pattern id="svm" width="10" height="9" patternUnits="userSpaceOnUse"><path d="M0 4.5 L2.5 0 L7.5 0 L10 4.5 L7.5 9 L2.5 9Z" fill="none" stroke="${c1}" stroke-width=".8"/></pattern>`
    : pat === 2 ? `<pattern id="svm" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M4.5 0 L9 4.5 L4.5 9 L0 4.5Z" fill="none" stroke="${c1}" stroke-width="1"/></pattern>`
    : pat === 3 ? `<pattern id="svm" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0 L8 8 M8 0 L0 8" stroke="${c1}" stroke-width=".9"/></pattern>`
    : `<pattern id="svm" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0 H8 M0 0 V8" stroke="${c1}" stroke-width=".8"/></pattern>`;
  const bands = des === 1 ? [...Array(6)].map((_, i) => `<rect x="${90 + i * 40}" y="40" width="20" height="120" fill="${c2}" opacity=".4"/>`).join('')
    : des === 2 ? [...Array(4)].map((_, i) => `<rect x="90" y="${40 + i * 32}" width="220" height="16" fill="${c2}" opacity=".4"/>`).join('')
    : des === 3 ? [...Array(11)].map((_, i) => [...Array(6)].map((_, j) => (i + j) % 2 ? `<rect x="${90 + i * 20}" y="${40 + j * 20}" width="20" height="20" fill="${c2}" opacity=".4"/>` : '').join('')).join('') : '';
  const back = st === 1 ? 'M90 40 L310 40 L290 70 L110 70Z' : st === 2 ? 'M90 40 Q200 20 310 40 L290 80 Q200 64 110 80Z' : st === 3 ? 'M90 40 L310 40 L280 90 L120 90Z' : 'M90 40 L310 40 L300 60 L100 60Z';
  return `<svg viewBox="0 0 400 210" preserveAspectRatio="xMidYMid slice" class="sv-svg sv-goal" role="img" aria-label="Arco y red">
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
  if (k === 'stadium') { const sid = tget(t, 'stadium_id'); return `<span class="sv-val">${esc(STADIUM.get(sid) || 'Estadio ' + sid)}</span><select id="tStad" class="sv-pick" tabindex="-1" aria-label="Estadio local">${STADIUM.has(sid) ? '' : `<option value="${sid}" selected>ID ${sid}</option>`}${svStadOpts(sid)}</select>`; }
  if (k === 'name') return `<input type="text" id="tStadName" class="sv-text" value="${esc(tget(t, 'stadium_name'))}" maxlength="120" placeholder="El del juego" aria-label="Nombre de estadio por equipo">`;
  if (k === 'side_color' || k === 'seat_color') { const v = tget(t, k), pal = k === 'side_color' ? SV_SIDE : SV_SEAT; return pal[v - 1] ? sw(pal[v - 1], `Color ${v} de 8`) : `<span class="sv-val">${v ? 'Valor ' + v : 'Del juego'}</span>`; }
  if (k === 'net1' || k === 'net2') { const c = svRgb(t, k.slice(3)); return `${sw(c, c)}<input type="color" class="sv-color" data-svc="${k}" value="${c}" tabindex="-1" aria-label="Elegir color">`; }
  if (k === 'net_design') return `<span class="sv-val">${svDesign(tget(t, k))}</span>`;
  if (k === 'goal_style') return `<span class="sv-val">${svTipo(svGoalTipo(t))}</span>`;
  return `<span class="sv-val">${svTipo(tget(t, k))}</span>`;
}
// lista de estadios: primero los 31 del menú del juego y después los que solo usan sus equipos
function svStadOpts(sid) {
  const o = id => `<option value="${id}" ${id === sid ? 'selected' : ''}>${esc(STADIUM.get(id) || 'Estadio ' + id)}</option>`;
  const rest = [...STADIUM.keys()].filter(id => !SV_GAME.includes(id));
  return `<optgroup label="Menú del juego">${SV_GAME.filter(id => STADIUM.has(id)).map(o).join('')}</optgroup>${rest.length ? `<optgroup label="Otros estadios (solo de sus equipos)">${rest.map(o).join('')}</optgroup>` : ''}`;
}
// paleta de 8 colores como "Configurar color" del juego
function svPalette(t, k) {
  const v = tget(t, k), pal = k === 'side_color' ? SV_SIDE : SV_SEAT;
  return `<div class="sv-pal" role="listbox" aria-label="Configurar color">${pal.map((c, i) => `<button type="button" class="sv-pc${i + 1 === v ? ' on' : ''}" style="--c:${c}" data-pc="${i + 1}" role="option" aria-selected="${i + 1 === v}" aria-label="Color ${i + 1}" tabindex="-1"></button>`).join('')}</div>`;
}
const svDesignUsesColors = t => tget(t, 'net_design') > 3;
function svPreview(t, row) {
  // S.svPeek: color que se está mirando en la paleta abierta (todavía sin elegir)
  const k = SV_ROWS[row][0], kind = SV_ROWS[row][2], pk = S.svPeek, g = f => pk && pk.k === f ? pk.v : tget(t, f);
  let shot = '', count = '';
  if (kind === 'stand') {
    const sid = g('stadium_id'), nm = STADIUM.get(sid) || 'Estadio ' + sid;
    shot = SV_STAD_PHOTO.has(sid) ? svPhoto('est-' + sid + '.jpg', nm) : svStand(t);
    count = `${SV_GAME.indexOf(sid) + 1 || '–'}/${SV_GAME.length}`;
  } else if (kind === 'turf') {
    const v = g('turf'); shot = SV_TURF_PHOTO.has(v) ? svPhoto('cesped-' + v + '.jpg', 'Césped tipo ' + v) : svPitch(t); count = `${v || '–'}/${SV_TURFS}`;
  } else if (kind === 'side') {
    const c = SV_SIDE[g('side_color') - 1]; shot = svPhoto('campo.jpg', 'Color del campo', c && ['campo.jpg', [[SV_FROM.side, c]]]);
  } else if (kind === 'seat') {
    const c = SV_SEAT[g('seat_color') - 1]; shot = svPhoto('asientos.jpg', 'Color de los asientos', c && ['asientos.jpg', [[SV_FROM.seat, c]]]);
  } else if (kind === 'goal') {
    const v = svGoalTipo(t); shot = v ? svPhoto('arco-' + v + '.jpg', 'Portería tipo ' + v) : svGoal(t); count = `${v || '–'}/${SV_GOALS}`;
  } else if (kind === 'mesh') {
    const v = g('net_pattern'); shot = v >= 1 && v <= SV_NETS ? svPhoto('malla-' + v + '.jpg', 'Red tipo ' + v) : svGoal(t); count = `${v || '–'}/${SV_NETS}`;
  } else {
    const v = g('net_design');
    shot = v ? svPhoto('red-' + v + '.jpg', 'Diseño de red: ' + svDesign(v), v > 3 && ['red-' + v + '.jpg', [[SV_FROM.red, svRgb(t, 1)], [SV_FROM.yellow, svRgb(t, 2)]]]) : svGoal(t);
    count = `${v || '–'}/${SV_DESIGNS}`;
  }
  return `<div class="sv-shot sv-${kind}" data-kind="${kind}">${shot}</div><div class="sv-count">${count}</div>`;
}
function stadViewCard(t) {
  S.svPeek = null;
  const row = Math.max(0, Math.min(SV_ROWS.length - 1, S.svRow || 0)), off = !svDesignUsesColors(t);
  return `<div class="card sv-card${svLocked(t) ? ' sv-locked' : ''}" id="stadView"><div class="sv-head">${crest(t, 'mini')}<b>Opciones de estadio local</b><span class="sv-help">↑ ↓ elegir · ← → cambiar · Enter abrir</span></div>
    <div class="sv-prev" id="svPrev">${svPreview(t, row)}</div>
    <div class="sv-list" id="svList" role="listbox" tabindex="0" aria-label="Opciones de estadio local" aria-activedescendant="svr${row}">
      ${SV_ROWS.map(([k, n], i) => `${i === 2 ? '<div class="sv-sep">Opciones detalladas</div>' : ''}<div class="sv-row${i === row ? ' on' : ''}${off && /^net[12]$/.test(k) ? ' sv-off" title="Las redes Blanca, Negra y Verde no usan este color' : ''}" id="svr${i}" role="option" aria-selected="${i === row}" data-svr="${i}" data-k="${k}">
        <span class="sv-lab">${n}</span><span class="sv-cell">${SV_MAX[k] ? '<button type="button" class="sv-arr" data-step="-1" aria-label="Anterior" tabindex="-1">❮</button>' : ''}<span class="sv-v">${svValue(t, k)}</span>${SV_MAX[k] ? '<button type="button" class="sv-arr" data-step="1" aria-label="Siguiente" tabindex="-1">❯</button>' : ''}</span></div>`).join('')}
    </div>
    <p class="note">Las fotos son del juego. Los colores de los asientos, del borde del campo y de la red se pintan sobre la foto con el color que guarda el EDIT. Al cambiar algo se activa "Opciones detalladas: Establecido" para este equipo.</p></div>`;
}
function bindStadView(t) {
  const card = $('stadView'); if (!card) return;
  const list = $('svList');
  const svRedraw = swap => {
    // mientras se pinta la foto nueva queda de fondo la anterior, así no parpadea en gris
    const p = $('svPrev'), was = p.querySelector('.sv-img:not([data-tint])'), prevSrc = !swap && was && was.currentSrc;
    p.innerHTML = svPreview(t, S.svRow || 0);
    const sh = p.querySelector('.sv-shot'); if (prevSrc && p.querySelector('img[data-tint]')) sh.style.background = `#3a4049 url("${prevSrc}") center/cover`;
    svApplyTint(p); if (swap) { p.classList.remove('sv-swap'); void p.offsetWidth; p.classList.add('sv-swap'); }
  };
  const closePal = () => { const had = S.svPeek; S.svPeek = null; card.querySelectorAll('.sv-pal').forEach(x => x.remove()); if (had) svRedraw(false); };
  const sel = (i, focus) => {
    i = (i + SV_ROWS.length) % SV_ROWS.length; const prev = S.svRow || 0; S.svRow = i; closePal();
    card.querySelectorAll('.sv-row').forEach(r => { const on = +r.dataset.svr === i; r.classList.toggle('on', on); r.setAttribute('aria-selected', on); });
    list.setAttribute('aria-activedescendant', 'svr' + i);
    const r = card.querySelector(`[data-svr="${i}"]`); r.classList.remove('sv-hit'); void r.offsetWidth; r.classList.add('sv-hit');
    svRedraw(SV_ROWS[prev][2] !== SV_ROWS[i][2]);
    if (focus) r.scrollIntoView({ block: 'nearest' });
  };
  // con un estadio con licencia el juego deja elegir solo el estadio: el resto queda apagado, igual que en el menú
  const svLock = () => { const L = svLocked(t); card.classList.toggle('sv-locked', L); card.querySelectorAll('#tStadName, .sv-color').forEach(x => { x.disabled = L; }); };
  const svLockTip = () => toast('Con un estadio con licencia el juego no deja cambiar el nombre ni las opciones detalladas.', 4500);
  const label = k => 'Estadio de ' + tget(t, 'name') + ': ' + SV_ROWS.find(r => r[0] === k)[1].toLowerCase();
  const refresh = k => {
    const r = card.querySelector(`.sv-row[data-k="${k}"]`); r.querySelector('.sv-v').innerHTML = svValue(t, k);
    const v = r.querySelector('.sv-v'); v.classList.remove('sv-bump'); void v.offsetWidth; v.classList.add('sv-bump');
    const off = !svDesignUsesColors(t); card.querySelectorAll('.sv-row[data-k^="net"]').forEach(x => { if (/^net[12]$/.test(x.dataset.k)) { x.classList.toggle('sv-off', off); if (off) x.title = 'Las redes Blanca, Negra y Verde no usan este color'; else x.removeAttribute('title'); } });
    svRedraw(false);
  };
  const put = (k, v) => {
    if (k === 'goal_style') { if (svGoalTipo(t) === v && tget(t, 'e_staddet')) return; setT(t, [...(v === 4 ? [['goal4', 1]] : [['goal_style', v], ['goal4', 0]]), ['e_staddet', 1]], label(k)); refresh(k); updateTop(); return; }
    if (tget(t, k) === v && tget(t, 'e_staddet')) return; setT(t, [[k, v], ['e_staddet', 1]], label(k)); refresh(k); updateTop();
  };
  const step = (k, d) => {
    if (k === 'stadium') { const at = SV_GAME.indexOf(tget(t, 'stadium_id')), nx = at < 0 ? SV_GAME[d > 0 ? 0 : SV_GAME.length - 1] : SV_GAME[(at + d + SV_GAME.length) % SV_GAME.length]; setT(t, [['stadium_id', nx], ['e_stadium', 1]], 'Estadio de ' + tget(t, 'name')); refresh(k); svLock(); updateTop(); return; }
    if (svLocked(t)) { svLockTip(); return; }
    const o = SV_OPTS[k]; if (!o) return;
    const at = o.indexOf(k === 'goal_style' ? svGoalTipo(t) : tget(t, k));
    put(k, at < 0 ? o[d > 0 ? 0 : o.length - 1] : o[(at + d + o.length) % o.length]);
  };
  const open = k => {
    if (k !== 'stadium' && svLocked(t)) { svLockTip(); return; }
    const r = card.querySelector(`.sv-row[data-k="${k}"]`);
    if (k === 'side_color' || k === 'seat_color') { if (r.querySelector('.sv-pal')) { closePal(); return; } closePal(); r.insertAdjacentHTML('beforeend', svPalette(t, k)); return; }
    const x = r.querySelector('#tStad, #tStadName, .sv-color'); if (!x) return;
    if (x.type === 'text') { x.focus(); x.select(); } else if (x.showPicker) { try { x.showPicker(); } catch { x.click(); } } else x.click();
  };
  card.addEventListener('click', e => {
    const r = e.target.closest('.sv-row'); if (!r) return;
    const pc = e.target.closest('[data-pc]'); if (pc) { e.stopPropagation(); S.svPeek = null; put(r.dataset.k, +pc.dataset.pc); closePal(); list.focus(); return; }
    const i = +r.dataset.svr; if (i !== (S.svRow || 0)) sel(i);
    const a = e.target.closest('[data-step]'); if (a) { step(r.dataset.k, +a.dataset.step); return; }
    if (!e.target.closest('input, select') && e.target.closest('.sv-cell')) {
      if (/^(side_color|seat_color|net1|net2|stadium)$/.test(r.dataset.k)) open(r.dataset.k); else if (SV_OPTS[r.dataset.k]) step(r.dataset.k, 1);
    }
  });
  card.addEventListener('mouseover', e => { const pc = e.target.closest('[data-pc]'); if (!pc) return; const k = pc.closest('.sv-row').dataset.k; if (S.svPeek && S.svPeek.k === k && S.svPeek.v === +pc.dataset.pc) return; S.svPeek = { k, v: +pc.dataset.pc }; svRedraw(false); });
  card.addEventListener('input', e => { const c = e.target.closest('[data-svc]'); if (!c) return; const sw = c.previousElementSibling; if (sw) sw.style.setProperty('--c', c.value); });
  card.addEventListener('change', e => {
    const c = e.target.closest('[data-svc]'); if (!c) return;
    const n = c.dataset.svc.slice(3), h = c.value.slice(1), to6 = s => Math.round(parseInt(s, 16) * 63 / 255);
    setT(t, [['net' + n + 'r', to6(h.slice(0, 2))], ['net' + n + 'g', to6(h.slice(2, 4))], ['net' + n + 'b', to6(h.slice(4, 6))], ['e_staddet', 1]], label(c.dataset.svc)); refresh(c.dataset.svc); updateTop();
  });
  list.addEventListener('keydown', e => {
    if (e.target.closest('input[type=text]')) { if (e.key === 'Enter' || e.key === 'Escape') { e.target.blur(); list.focus(); } return; }
    const i = S.svRow || 0, k = SV_ROWS[i][0], pal = card.querySelector('.sv-pal');
    if (pal) {
      // con la paleta abierta, ← → recorren los colores y Enter elige, como en el juego
      const cur = Math.max(0, [...pal.children].findIndex(b => b.classList.contains('on')));
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); const nx = (cur + (e.key === 'ArrowRight' ? 1 : -1) + 8) % 8; pal.querySelectorAll('.sv-pc').forEach((b, j) => { b.classList.toggle('on', j === nx); b.setAttribute('aria-selected', j === nx); }); S.svPeek = { k, v: nx + 1 }; svRedraw(false); return; }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); S.svPeek = null; put(k, cur + 1); closePal(); return; }
      if (e.key === 'Escape') { e.preventDefault(); closePal(); return; }
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel(i + (e.key === 'ArrowDown' ? 1 : -1), true); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); step(k, e.key === 'ArrowRight' ? 1 : -1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(k); }
  });
  svLock(); svApplyTint(card);
}
