// KitPos (modules\kitpos.lua en Sider): posición libre, sin pasos, del nombre y los números del kit.
// Lee y escribe content\kitpos\kitpos_slots.ini, el mismo archivo que usa el panel de KitPos en el juego:
//   [equipo 1234]      todos los kits de jugador del equipo
//   [equipo 1234 p2]   el 2.º kit de order.ini (pisa lo del equipo)
//   [equipo 1234 gk]   el kit de arquero
// Cada campo es el valor real que usa el juego (float). "Campo_steps = n" también se acepta al leer.
const KPOS = (() => {
  // pasos de kserv (config.txt) -> valor del juego, igual que en kitpos.lua
  const STEPS = {
    NameY: n => 0.05 + n * 0.37 / 39, NameSize: n => 0.9 + n * 1.5 / 20, NameStretch: n => 0.5 + n * 0.5 / 3,
    BackNumberY: n => 1.2 - n * 1.2 / 29, BackNumberSize: n => n / 28, BackNumberSpacing: n => n / 14,
    ChestNumberX: n => 0.4 + n * 0.207 / 29, ChestNumberY: n => 0.78 - n * 0.24 / 29, ChestNumberSize: n => 0.6 + n * 1.2 / 28,
    ShortsNumberX: n => 0.9 - n * 0.14 / 29, ShortsNumberSize: n => 0.6 + n * 1.2 / 28,
  };
  // la altura del número del short depende del lado (ShortsNumberSide)
  const shortsY = (n, side) => +side === 1 ? 0.04 + n * 0.19 / 29 : 0.96 - n * 0.19 / 29;
  // curva del nombre: KitPos la mide como 1000 / radio. Las 3 formas de kserv: leve, media y extrema
  const CURVES = [0, 1000 / 672, 1000 / 336, 1000 / 292];
  const curveToSteps = v => { if (v < 0) return v / CURVES[1]; for (let i = 1; i <= 3; i++) { const a = CURVES[i - 1], b = CURVES[i]; if (v <= b || i === 3) return i - 1 + (v - a) / (b - a); } return 0; };
  const stepsToCurve = s => { if (s < 0) return s * CURVES[1]; const i = Math.min(3, Math.max(1, Math.ceil(s))), a = CURVES[i - 1], b = CURVES[i]; return a + (s - (i - 1)) * (b - a); };
  const fromSteps = (f, n, side = 0) => f === 'ShortsNumberY' ? shortsY(n, side) : f === 'NameCurve' ? stepsToCurve(n) : f === 'NameSpacing' ? n : STEPS[f] ? STEPS[f](n) : n;
  const toSteps = (f, v, side = 0) => {
    if (v == null || !isFinite(v)) return null;
    if (f === 'ShortsNumberY') { const a = shortsY(0, side), b = shortsY(1, side); return (v - a) / (b - a); }
    if (f === 'NameCurve') return curveToSteps(v);
    if (f === 'NameSpacing') return v;
    const fn = STEPS[f]; if (!fn) return null; const a = fn(0), b = fn(1); return (v - a) / (b - a);
  };
  // g: grupo, n: nombre, max: último paso de kserv (rango del juego), cfg: el campo del config.txt equivalente
  const FIELDS = {
    NameY: { g: 'name', n: 'Altura', max: 39 }, NameSize: { g: 'name', n: 'Tamaño', max: 20 }, NameStretch: { g: 'name', n: 'Ancho', max: 3 },
    NameSpacing: { g: 'name', n: 'Separación', min: -40, maxv: 80, unit: true }, NameCurve: { g: 'name', n: 'Arco', max: 3, cfg: 'NameShape' },
    BackNumberY: { g: 'num', n: 'Altura', max: 29 }, BackNumberSize: { g: 'num', n: 'Tamaño', max: 28 }, BackNumberSpacing: { g: 'num', n: 'Separación', max: 14 },
    ChestNumberX: { g: 'chest', n: 'Horizontal', max: 29 }, ChestNumberY: { g: 'chest', n: 'Vertical', max: 29 }, ChestNumberSize: { g: 'chest', n: 'Tamaño', max: 28 },
    ShortsNumberX: { g: 'leg', n: 'Horizontal', max: 29 }, ShortsNumberY: { g: 'leg', n: 'Vertical', max: 29 }, ShortsNumberSize: { g: 'leg', n: 'Tamaño', max: 28 },
  };
  const GROUPS = { name: 'Nombre', num: 'Número de la espalda', chest: 'Número del pecho', leg: 'Número del short' };
  // rango del control, en pasos de kserv: un poco más allá de lo que permite el juego
  const range = f => { const F = FIELDS[f]; if (F.unit) return [F.min, F.maxv]; if (f === 'NameCurve') return [-3, 6]; const x = Math.max(2, Math.round(F.max * .3)); return [-x, F.max + x]; };
  // valor del juego para un campo según el config.txt del kit (lo que se ve sin KitPos)
  const fromCfg = (f, get) => {
    const F = FIELDS[f], raw = get(F.cfg || f), n = raw === '' || raw == null ? null : +raw;
    if (f === 'NameSpacing') return 0;
    if (n == null || !isFinite(n)) return null;
    if (f === 'NameCurve') return CURVES[Math.max(0, Math.min(3, Math.round(n)))];
    if (f === 'NameStretch') return STEPS.NameStretch(n === 0 ? 3 : n); // el juego toma 0 como 3 (ancho normal)
    if (f === 'ShortsNumberY') return shortsY(n, +(get('ShortsNumberSide') || 0));
    return fromSteps(f, n);
  };
  const norm = s => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
  const secKey = (team, kit, gk) => 'equipo ' + (+team) + (gk ? ' gk' : kit ? ' p' + kit : '');
  function parse(text) {
    const secs = {}, opts = {}; let cur = null;
    for (let line of String(text || '').split(/\r?\n/)) {
      line = line.replace(/;.*$/, '').trim(); const h = line.match(/^\[(.*)\]$/);
      if (h) { const s = norm(h[1]); cur = s === 'opciones' ? opts : /^equipo \d+( (p\d+|gk))?$/.test(s) || /^\d+$/.test(s) ? (secs[s] = secs[s] || {}) : null; continue; }
      const m = cur && line.match(/^([\w]+)\s*=\s*(.+)$/); if (!m) continue;
      if (cur === opts) { opts[m[1].toLowerCase()] = m[2].trim(); continue; }
      const v = +m[2]; if (!isFinite(v)) continue; const st = m[1].match(/^(.+)_steps$/);
      if (st && STEPS[st[1]]) cur[st[1]] = STEPS[st[1]](v); else if (FIELDS[m[1]] || m[1] === 'NameLower') cur[m[1]] = v;
    }
    return { secs, opts };
  }
  // valores finales de un kit: lo del equipo (solo kits de jugador) y encima lo del kit, como hace KitPos
  function resolve(P, team, kit, gk) { const out = {}; if (!gk) Object.assign(out, P.secs[secKey(team)] || {}); Object.assign(out, P.secs[secKey(team, kit, gk)] || {}); return out; }
  const fmt = v => (Math.round(v * 1e5) / 1e5).toFixed(5);
  // escribe los campos de una sección; null borra el campo. Respeta el resto del archivo (comentarios incluidos)
  function setValues(text, sec, vals) {
    const L = String(text || '').replace(/\r?\n$/, '').split(/\r?\n/); if (L.length === 1 && L[0] === '') L.length = 0;
    const want = norm(sec), isHead = l => /^\s*\[.*\]\s*(;.*)?$/.test(l);
    let a = L.findIndex(l => isHead(l) && norm(l.replace(/;.*$/, '').trim().slice(1, -1)) === want);
    if (a < 0) { if (!Object.values(vals).some(v => v != null)) return L.join('\r\n') + (L.length ? '\r\n' : ''); if (L.length && L[L.length - 1].trim()) L.push(''); L.push('[' + sec + ']'); a = L.length - 1; }
    let b = a + 1; while (b < L.length && !isHead(L[b])) b++;
    let end = b; while (end > a + 1 && !L[end - 1].trim()) end--;
    for (const [k, v] of Object.entries(vals)) {
      const re = new RegExp('^\\s*' + k + '(_steps)?\\s*=', 'i'); let at = -1;
      for (let i = end - 1; i > a; i--) if (re.test(L[i])) { L.splice(i, 1); end--; b--; at = i; }
      if (v != null && isFinite(v)) { const pos = at >= 0 ? at : end; L.splice(pos, 0, k + ' = ' + fmt(v)); end++; b++; }
    }
    // sección vacía: se quita (con las líneas en blanco que la seguían)
    if (!L.slice(a + 1, end).some(l => l.trim() && !/^\s*;/.test(l))) { let z = b; L.splice(a, z - a); if (a > 0 && !L[a - 1].trim() && (a >= L.length || !L[a] || !L[a].trim())) L.splice(a - 1, 1); }
    return L.join('\r\n') + '\r\n';
  }
  const SEED = ['; kitpos_slots.ini - lo lee kitpos.lua (KitPos) y lo escriben el panel de KitPos en el juego y PES Editor Rebuilt',
    '; [equipo ID] = todos los kits de jugador | [equipo ID pN] = kit N | [equipo ID gk] = arquero', '',
    '[opciones]', 'idioma = es      ; es / en', 'limites = 1', 'imagen = 1       ; panel con logo a la derecha del overlay',
    'curva_ajuste = 1   ; correccion del corrimiento de la curva (1 = auto, 0 = sin corregir)',
    'minusculas_juego = 1   ; 1 = el juego no pasa el nombre a mayusculas ni le quita los acentos (camiseta y editor)', ''].join('\r\n');
  // sider.ini: lua.module = "kitpos.lua" debajo de kserv.lua (o del último módulo), con lua.enabled y luajit.ext.enabled en 1
  function siderIni(text) {
    const nl = text.includes('\r\n') ? '\r\n' : '\n', L = text.split(/\r?\n/), act = l => !/^\s*[;#]/.test(l); let changed = false;
    const sider = () => L.findIndex(l => /^\s*\[sider\]/i.test(l));
    if (!L.some(l => act(l) && /^\s*lua\.module\s*=\s*"?kitpos\.lua"?\s*([;#].*)?$/i.test(l))) {
      let at = L.findIndex(l => act(l) && /^\s*lua\.module\s*=\s*"?kserv\.lua"?/i.test(l));
      if (at < 0) L.forEach((l, i) => { if (act(l) && /^\s*lua\.module\s*=/i.test(l)) at = i; });
      if (at < 0) { const s = sider(); at = s >= 0 ? s : L.length - 1; }
      L.splice(at + 1, 0, 'lua.module = "kitpos.lua"'); changed = true;
    }
    for (const k of ['lua.enabled', 'luajit.ext.enabled']) {
      const re = new RegExp('^\\s*' + k.replace(/\./g, '\\.') + '\\s*=\\s*(\\S*)', 'i'), i = L.findIndex(l => re.test(l));
      if (i >= 0) { if (L[i].match(re)[1] !== '1') { L[i] = L[i].replace(/=\s*\S*/, '= 1'); changed = true; } continue; }
      const j = L.findIndex(l => /^\s*lua\.enabled\s*=/i.test(l)), s = sider(); L.splice(j >= 0 ? j + 1 : s + 1, 0, k + ' = 1'); changed = true;
    }
    return { text: L.join(nl), changed };
  }
  return { STEPS, CURVES, FIELDS, GROUPS, shortsY, curveToSteps, stepsToCurve, fromSteps, toSteps, fromCfg, range, secKey, parse, resolve, setValues, siderIni, fmt, SEED, norm };
})();
