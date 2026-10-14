// ===================== Inicio: busca el EDIT en Documentos (sin elegir el archivo) y muestra la introducción =====================
// El navegador no deja que una página lea Documentos sin permiso: la primera vez se elige la carpeta una sola vez
// (el selector ya se abre en Documentos) y después se recuerda. Desde ahí se busca
// KONAMI\eFootball PES 2021 SEASON UPDATE\<número de Steam>\drmp (Parche) o \save → EDIT00000000, y la carpeta WEPES.
// También la versión sin Steam (CPY y otras: ...\SEASON UPDATE\save\EDIT00000000), Football Life y cualquier otra
// carpeta de guardado del juego; si no aparece nada, se busca el EDIT00000000 unos niveles más abajo.
const PESLOC = { root: null, season: null, edits: [], wepes: null, chosen: null };
const SEASON_RE = /^(eFootball PES 20(21|20)( SEASON UPDATE)?|Football Life.*|PES 202[01].*)$/i;
async function pesFind(root) {
  const out = { season: null, edits: [], wepes: null };
  const has = async (d, n) => { try { return await d.getFileHandle(n); } catch { return null; } };
  const sub = async (d, n) => { try { return await d.getDirectoryHandle(n); } catch { return null; } };
  const dirs = async d => { const r = []; try { for await (const [n, h] of d.entries()) if (h.kind === 'directory') r.push([n, h]); } catch { } return r; };
  const push = async (d, h, kind, steam, path) => { if (out.edits.some(e => e.path.toLowerCase() === path.toLowerCase())) return; const f = await h.getFile(); out.edits.push({ dir: d, handle: h, kind, steam, mtime: f.lastModified, size: f.size, path }); };
  // <temporada>\<número de Steam>\<drmp, save u otra>\EDIT00000000, o sin Steam: <temporada>\save\EDIT00000000
  const addEdits = async (season, label) => {
    for (const [n1, d1] of await dirs(season)) {
      if (/^wepes$/i.test(n1)) continue;
      const h1 = await has(d1, 'EDIT00000000'); if (h1) await push(d1, h1, n1, '', `${label}\\${n1}`);
      for (const [n2, d2] of await dirs(d1)) { const h2 = await has(d2, 'EDIT00000000'); if (h2) await push(d2, h2, n2, n1, `${label}\\${n1}\\${n2}`); }
    }
  };
  // 1) eligieron directamente la carpeta del EDIT (drmp o save)
  const direct = await has(root, 'EDIT00000000');
  if (direct) { const f = await direct.getFile(); out.edits.push({ dir: root, handle: direct, kind: root.name, steam: '', mtime: f.lastModified, size: f.size, path: root.name }); }
  // 2) la carpeta de la temporada: la elegida, dentro de KONAMI, o buscando unos niveles hacia abajo
  let season = SEASON_RE.test(root.name) ? root : null; const others = [];
  if (!season) { const k = /^konami$/i.test(root.name) ? root : await sub(root, 'KONAMI'); if (k) { const all = (await dirs(k)).filter(([n]) => SEASON_RE.test(n)).sort((a, b) => (/2021 SEASON UPDATE$/i.test(b[0]) - /2021 SEASON UPDATE$/i.test(a[0]))); if (all.length) { season = all[0][1]; others.push(...all.slice(1)); } } }
  if (!season && !direct) { const q = [[root, 0]]; let seen = 0; while (q.length && !season && seen < 400) { const [d, depth] = q.shift(); for (const [n, h] of await dirs(d)) { seen++; if (SEASON_RE.test(n)) { season = h; break; } if (depth < 3 && !/^(\.|appdata|node_modules|\$)/i.test(n)) q.push([h, depth + 1]); } } }
  if (!season && !direct && /^(drmp|save)$/i.test(root.name) === false && /^\d{8,}$/.test(root.name)) { for (const kind of ['drmp', 'save']) { const d = await sub(root, kind), h = d && await has(d, 'EDIT00000000'); if (h) { const f = await h.getFile(); out.edits.push({ dir: d, handle: h, kind, steam: root.name, mtime: f.lastModified, size: f.size, path: root.name + '\\' + kind }); } } }
  if (season) { out.season = season; await addEdits(season, season.name); out.wepes = await sub(season, 'WEPES'); }
  for (const [n, d] of others) await addEdits(d, n); // otra instalación (por ejemplo Football Life al lado de PES 2021)
  // nada en los lugares de siempre: se busca el archivo unos niveles más abajo de la carpeta elegida
  if (!out.edits.length) {
    const q = [[root, root.name, 0]]; let seen = 0;
    while (q.length && seen < 800 && out.edits.length < 6) {
      const [d, path, depth] = q.shift();
      for (const [n, h] of await dirs(d)) {
        if (++seen > 800) break; if (/^(\.|\$|appdata$|node_modules$|wepes$)/i.test(n)) continue;
        const e = await has(h, 'EDIT00000000'); if (e) await push(h, e, n, '', `${path}\\${n}`);
        if (depth < 4) q.push([h, `${path}\\${n}`, depth + 1]);
      }
    }
  }
  // el más reciente primero; a igual fecha, el del juego
  out.edits.sort((a, b) => (b.mtime - a.mtime) || ((a.kind === 'drmp') ? -1 : 1));
  return out;
}

// ---- pantalla de introducción ----
const INTRO = { el: null, steps: [] };
function introShow() {
  if (INTRO.el) return INTRO.el;
  const el = document.createElement('div'); el.className = 'intro'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Cargando PES Editor Rebuilt');
  const nSp = typeof GFX === 'function' ? { low: 0, mid: 22, high: 48 }[GFX().q] : 22, sparks = Array.from({ length: nSp }, () => `<b style="left:${(Math.random() * 100).toFixed(1)}%;animation-duration:${(5 + Math.random() * 7).toFixed(1)}s;animation-delay:-${(Math.random() * 10).toFixed(1)}s;--dx:${((Math.random() - .5) * 120).toFixed(0)}px;scale:${(.5 + Math.random()).toFixed(2)}"></b>`).join('');
  el.innerHTML = `${typeof musBtn === 'function' ? musBtn('intromus') : ''}<div class="introbg" aria-hidden="true"><span class="introrays"></span><i></i><i></i><i></i><span class="introfloor"></span><span class="introsparks">${sparks}</span></div>
    <div class="introc"><div class="introlog"><span class="introhalo" aria-hidden="true"></span><span class="introback" aria-hidden="true"><i></i></span><img id="introLogo" alt="PES Editor Rebuilt · Pro Evolution Soccer">
        <span class="introsheenwrap" aria-hidden="true"><span class="sheen"></span></span><span class="introneon" aria-hidden="true"><i></i></span><span class="introflash" aria-hidden="true"></span></div>
      <ol class="introsteps" id="introSteps" aria-live="polite"></ol>
      <div class="introbar" aria-hidden="true"><b id="introBar"></b></div>
      <div class="introact" id="introAct"></div></div>`;
  document.body.appendChild(el); INTRO.el = el; document.documentElement.classList.add('introing'); if (typeof musUi === 'function') musUi();
  // logo en PNG (sacado del vector, con transparencia) + capa de neón con el contorno de las letras
  if (typeof LOGO_SRC !== 'undefined') {
    const dark = isDarkUi() || /^(retro|pes6)$/.test(document.documentElement.dataset.gfx || ''), src = LOGO_SRC[dark ? 'dark' : 'light'], img = $('introLogo');
    el.classList.toggle('dk', dark);
    el.style.setProperty('--nm', `url("${LOGO_SRC.neon}")`); el.style.setProperty('--lm', `url("${src}")`);
    img.onload = () => { el.classList.add('logo-in'); INTRO.t = setTimeout(() => el.classList.add('neon-on'), ANIM.reduce.matches ? 0 : 1100); };
    img.src = src;
  }
  return el;
}
function introStep(text, state = 'run') {
  if ((state === 'err' || state === 'wait') && INTRO.el) INTRO.el.classList.remove('busy');
  const ol = $('introSteps'); if (!ol) return;
  const last = ol.lastElementChild; if (last && last.dataset.s === 'run' && state !== 'err') { last.dataset.s = 'ok'; }
  const li = document.createElement('li'); li.dataset.s = state; li.textContent = text; ol.appendChild(li);
  const n = ol.children.length; $('introBar').style.width = Math.min(100, n * 22) + '%';
}
function introActions(html, bind) { const a = $('introAct'); if (!a) return; a.innerHTML = html; a.classList.toggle('on', !!html); if (bind) bind(a); }
function introDone(msg) {
  const el = INTRO.el; if (!el) return; if (msg) introStep(msg, 'ok'); $('introBar').style.width = '100%';
  const ol = $('introSteps'); if (ol) [...ol.children].forEach(li => { if (li.dataset.s === 'run') li.dataset.s = 'ok'; });
  el.classList.remove('busy'); el.classList.add('neon-on', 'finish');
  const go = () => {
    // el logo vuela a su lugar en la cabecera mientras la pantalla se desvanece
    const from = $('introLogo'), to = $('brandLogo');
    if (from && to && !ANIM.reduce.matches) { const a = from.getBoundingClientRect(), b = to.getBoundingClientRect(); if (a.width && b.width) { const dx = b.left - a.left, dy = b.top - a.top, k = b.width / a.width; from.parentElement.style.transformOrigin = '0 0'; from.parentElement.animate([{ transform: 'none' }, { transform: `translate(${dx}px,${dy}px) scale(${k})` }], { duration: 950, easing: 'cubic-bezier(.65,0,.25,1)', fill: 'forwards' }); } }
    const de = document.documentElement; el.classList.add('out'); de.classList.add('revealing'); de.classList.remove('introing'); setTimeout(() => de.classList.remove('revealing'), 1600);
    setTimeout(() => { el.remove(); INTRO.el = null; clearTimeout(INTRO.t); }, ANIM.reduce.matches ? 0 : 1150);
  };
  setTimeout(go, ANIM.reduce.matches ? 0 : 900);
}
// ---- flujo de inicio ----
async function pesStart(force) {
  // el trabajo que quedó en el caché al recargar (si era un archivo abierto a mano, se recupera sin buscar la carpeta)
  if (!force && typeof sessResume === 'function' && await sessResume()) return;
  introShow();
  if (!window.showDirectoryPicker) {
    introStep('Tu navegador no permite leer carpetas (hace falta Chrome o Edge).', 'err');
    introActions(`<p>Podés abrir el archivo a mano: está en Documentos\\KONAMI\\eFootball PES 2021 SEASON UPDATE\\&lt;número&gt;\\drmp\\EDIT00000000.</p><button class="btn primary" type="button" id="introFile">Abrir EDIT00000000…</button>`, a => a.querySelector('#introFile').onclick = () => $('fFile').click());
    return;
  }
  introStep('Buscando tu carpeta de PES 2021…');
  let root = force ? null : await idbGet('pesDocs').catch(() => null);
  if (root) {
    let perm = 'granted'; try { perm = root.queryPermission ? await root.queryPermission({ mode: 'readwrite' }) : 'granted'; } catch { }
    if (perm === 'granted') return pesOpen(root);
    introStep('Hace falta tu permiso para volver a entrar a ' + root.name + '.', 'wait');
    introActions(`<button class="btn primary big" type="button" id="introGo">Continuar</button><button class="btn ghost" type="button" id="introOther">Elegir otra carpeta</button>
      <p class="note">Es un pedido del navegador. Si en el aviso elegís "Permitir en cada visita", la próxima vez entra solo.</p>`, a => {
      a.querySelector('#introGo').onclick = async () => { try { if ((await root.requestPermission({ mode: 'readwrite' })) === 'granted') { introActions(''); pesOpen(root); } } catch (e) { introStep('No se pudo: ' + e.message, 'err'); } };
      a.querySelector('#introOther').onclick = () => pesPick(); });
    return;
  }
  introStep('Para encontrar el EDIT, elegí tu carpeta Documentos (una sola vez).', 'wait');
  introActions(`<button class="btn primary big" type="button" id="introGo">📂 Elegir mi carpeta Documentos</button>
    <p class="note">${window.pesNative ? 'Se abre el selector de carpetas de Windows en Documentos: elegí Documentos y listo.' : 'El navegador no deja que una página lea tus archivos sin permiso. La ventana se abre en Documentos: tocá "Seleccionar carpeta" y listo.'} El editor busca solo <b>KONAMI\\eFootball PES 2021 SEASON UPDATE</b>, el EDIT00000000 y la carpeta WEPES, y lo recuerda para la próxima.</p>`, a => a.querySelector('#introGo').onclick = () => pesPick());
}
async function pesPick() {
  let root; try { root = await window.showDirectoryPicker({ id: 'pesdocs', mode: 'readwrite', startIn: 'documents' }); }
  catch (e) { if (e.name !== 'AbortError') introStep('No se pudo abrir la carpeta: ' + e.message, 'err'); return; }
  introActions(''); try { await idbSet('pesDocs', root); } catch { }
  pesOpen(root);
}
async function pesOpen(root) {
  introShow().classList.add('busy'); PESLOC.root = root; const t0 = Date.now();
  introStep('Revisando ' + root.name + '…');
  let f; try { f = await pesFind(root); } catch (e) { introStep('No se pudo recorrer la carpeta: ' + e.message, 'err'); return; }
  Object.assign(PESLOC, f);
  if (f.season) introStep('Encontrada: ' + f.season.name + (f.wepes ? ' (con WEPES)' : ''));
  if (!f.edits.length) {
    introStep('No encontré ningún EDIT00000000 ahí.', 'err');
    introActions(`<button class="btn primary" type="button" id="introOther">Elegir otra carpeta</button><p class="note">Suele estar en Documentos\\KONAMI\\eFootball PES 2021 SEASON UPDATE\\&lt;número&gt;\\drmp (o \\save; sin Steam, como CPY, directo en \\save). Si nunca guardaste en el modo Editar del juego, el archivo todavía no existe.</p>`, a => a.querySelector('#introOther').onclick = () => pesPick());
    return;
  }
  if (typeof sessPeek === 'function') await sessPeek();
  // si antes de recargar había un EDIT abierto (y quedó guardado en el caché), se abre ese mismo
  const e = (typeof sessWants === 'function' && sessWants(f.edits)) || f.edits[0]; PESLOC.chosen = e;
  introStep(`Leyendo ${e.path}\\EDIT00000000 (${(e.size / 1048576).toFixed(1).replace('.', ',')} MB)…`);
  try {
    const file = await e.handle.getFile(), bytes = new Uint8Array(await file.arrayBuffer());
    introStep('Descifrando y armando equipos y jugadores…'); await new Promise(r => setTimeout(r, 30));
    S.dir = e.dir; S.editHandle = e.handle; S.mtime = file.lastModified;
    openBytes(bytes, e.path + '\\EDIT00000000');
    { const r = typeof sessAfterOpen === 'function' && sessAfterOpen(file.lastModified); if (r) introStep(r); }
    if (typeof wepesCount === 'function') wepesCount();
    await introSider(t0);
    introDone(`Listo: ${S.ix.teams.length} equipos y ${S.ix.players.length} jugadores editados.`);
    if (f.edits.length > 1 && e === f.edits[0]) toast(`Abrí el EDIT más reciente (${e.kind === 'drmp' ? 'drmp' : e.kind}). En la pestaña Archivo podés cambiar al otro.`, 6000);
  } catch (er) { introStep('No se pudo abrir el EDIT: ' + er.message, 'err'); introActions(`<button class="btn" type="button" id="introOther">Elegir otra carpeta</button>`, a => a.querySelector('#introOther').onclick = () => pesPick()); }
}
// ---- Sider: pedir la carpeta (o el permiso) y esperar a que carguen caras, escudos y nombres ----
const introWait = ms => new Promise(r => setTimeout(r, ms));
function introAsk(html) { return new Promise(res => introActions(html, a => a.querySelectorAll('[data-a]').forEach(b => b.onclick = () => res(b.dataset.a)))); }
// Chrome no deja abrir (para escribir) carpetas dentro de Archivos de programa: ahí se ofrece abrirla solo para ver
const INTRO_BROWSER = window.pesNative ? '' : /Edg\//.test(navigator.userAgent) ? 'Edge' : /Chrome\//.test(navigator.userAgent) ? 'Chrome' : '';
const introRoNote = () => '<p class="note">¿Te dijo <b>"contiene archivos del sistema"</b>? ' + (INTRO_BROWSER || 'El navegador') + ' no deja escribir en <b>Archivos de programa</b>. <a href="' + APP_DL_URL() + '" target="_blank" rel="noopener">Descargá PES Editor Rebuilt para Windows</a>, que sí puede, o tocá Cómo moverla.</p>';
async function introSider(t0) {
  let h = await idbGet('sider').catch(() => null), ready = false;
  if (h) {
    let perm = 'granted'; try { perm = h.queryPermission ? await h.queryPermission({ mode: 'read' }) : 'granted'; } catch { }
    if (perm === 'granted') ready = true;
    else {
      introStep('Sider: hace falta tu permiso para volver a leer ' + h.name + '.', 'wait');
      for (;;) {
        const a = await introAsk(`<button class="btn primary big" type="button" data-a="ok"><img src="${typeof SIDER_ICON !== 'undefined' ? SIDER_ICON : ''}" alt="" width="22" height="22"> Permitir leer Sider</button><button class="btn ghost" type="button" data-a="new">Elegir otra carpeta Sider</button><button class="btn ghost" type="button" data-a="no">Seguir sin Sider</button>
          <p class="note">De Sider salen las caras, los kits, los escudos y los nombres de todos los jugadores del juego.</p>`);
        if (a === 'no') break;
        if (a === 'new') { if (await connectKits()) { ready = true; break; } continue; }
        try { if ((await h.requestPermission({ mode: 'read' })) === 'granted') { FACES.needsPerm = null; FACES.ready = restoreFaces(); ready = true; break; } } catch { }
      }
    }
  } else {
    introStep('Conectá tu carpeta Sider para ver caras, kits, escudos y nombres del juego.', 'wait');
    let failed = !!INTRO_BROWSER; // en Chrome y Edge se avisa desde el principio
    for (;;) {
      let a = await introAsk(`<button class="btn primary big siderbtn" type="button" data-a="ok"><img src="${typeof SIDER_ICON !== 'undefined' ? SIDER_ICON : ''}" alt="" width="22" height="22"> Conectar carpeta Sider</button>${failed ? '<button class="btn" type="button" data-a="ro">📂 Abrir solo para ver</button>' : ''}${failed ? '<button class="btn ghost" type="button" data-a="how">Cómo moverla</button>' : ''}<button class="btn ghost" type="button" data-a="no">Ahora no</button>
        <p class="note">Elegí la carpeta de Sider de tu juego (la que tiene <b>sider.exe</b>; en Football Life, la carpeta del juego). Se hace una sola vez: después el editor la recuerda.</p>${failed ? introRoNote() : ''}`);
      if (a === 'no') break;
      if (a === 'how') {
        const b = await introAsk(`${siderMoveSteps(siderRoName(), 'Ya la moví: elegir la carpeta')}
          <button class="btn primary big" type="button" data-a="ok">Ya la moví: elegir la carpeta</button><div class="introrow"><button class="btn" type="button" data-a="ro">📂 Abrir solo para ver</button><button class="btn ghost" type="button" data-a="back">Volver</button></div>`);
        if (b === 'back') continue; a = b;
      }
      if (a === 'ro') { introActions(''); introStep('Leyendo tu carpeta Sider…'); if (await connectSiderRO()) { ready = true; break; } continue; }
      introActions(''); introStep('Leyendo tu carpeta Sider…');
      if (await connectKits()) { ready = true; break; }
      introStep('No se conectó Sider. Probá de nuevo con la carpeta que tiene sider.exe.', 'wait'); failed = true;
    }
  }
  introActions(''); INTRO.el && INTRO.el.classList.add('busy');
  if (ready) {
    introStep('Cargando caras, escudos y la base del juego desde Sider…');
    await Promise.race([FACES.ready || Promise.resolve(), introWait(12000)]);
    introStep(`Sider listo: ${(FACES.count || 0).toLocaleString('es-AR')} caras y ${(BADGES.count || 0).toLocaleString('es-AR')} escudos.`);
    // qué dice sider.ini y si todo lo que nombra existe (carpetas de contenido, módulos, kit-server, edit21-db)
    if (typeof siIntroCheck === 'function') {
      const sh = await idbGet('sider').catch(() => null); // idbGet devuelve SIDER_RO si está; no el handle viejo si eligió otra carpeta
      if (sh) { introStep('Revisando sider.ini…'); const c = await Promise.race([siIntroCheck(sh).catch(() => null), introWait(20000)]); introStep(c ? c.text : 'sider.ini: la revisión sigue en la pestaña Sider.', c && !c.ok && !c.warn ? 'warn' : 'ok'); if (c && c.warn) introStep(c.warn, 'warn'); }
    }
  } else introStep('Sin Sider por ahora: podés conectarlo después con el botón de arriba.');
  // fotos de internet para los que no tienen miniface: se elige una vez
  if (!PREFS.photoSrc) {
    introStep('¿Qué fotos querés para los jugadores sin miniface del juego?', 'wait');
    const a = await introAsk(`<div class="introchoice"><button class="btn primary big" type="button" data-a="tsdb">✂️ Recortadas<small>Fotos sin fondo de TheSportsDB. Las que no estén, quedan con la camiseta.</small></button><button class="btn big" type="button" data-a="mix">🧩 Mezcla<small>Recortadas de TheSportsDB y, si no hay, la foto real de Wikipedia.</small></button></div>
      <button class="btn ghost" type="button" data-a="off">Sin fotos de internet</button><p class="note">Lo podés cambiar cuando quieras en la Formación de cualquier equipo (vista Fotos).</p>`);
    setPhotoSrc(a); introActions(''); INTRO.el && INTRO.el.classList.add('busy');
    introStep({ tsdb: 'Fotos: recortadas de TheSportsDB.', mix: 'Fotos: recortadas y, si faltan, de Wikipedia.', off: 'Fotos: solo las del juego.' }[a]);
  }
  await introImages();
  if (typeof SI !== 'undefined' && SI.introProbs) { const probs = SI.introProbs; setTimeout(() => toast('Sider: ' + probs.join('; ') + '.', 12000, ['Ver en la pestaña Sider', () => setTab('sider')]), 2200); }
  // un momento más para que terminen de cargar las fuentes y el logo
  introStep('Preparando la pantalla…');
  await Promise.race([Promise.all([document.fonts ? document.fonts.ready : null, introWait(Math.max(0, t0 + 2600 - Date.now()))]), introWait(8000)]);
}
// ---- escudos y fotos listos antes de mostrar el editor, así nada aparece de golpe ----
// Se cargan todos los escudos (los de Sider y los de internet ya encontrados), las caras del equipo que se abre y lo que
// se ve en pantalla. Lo que todavía no se buscó en internet (la primera vez) se espera solo para lo que se ve primero,
// con un tope de tiempo y un botón para entrar antes.
async function introImages() {
  if (!S.ix) return;
  const T0 = Date.now(), CAP = 45000, out = () => skip || Date.now() - T0 > CAP;
  let skip = false, done = 0, total = 0;
  introStep('Cargando escudos y fotos…');
  const li = $('introSteps') && $('introSteps').lastElementChild;
  const say = () => { if (li) li.textContent = `Cargando escudos y fotos… ${Math.min(done, total).toLocaleString('es-AR')} de ${total.toLocaleString('es-AR')}`; const bar = $('introBar'); if (bar && total) bar.style.width = Math.max(4, Math.round(100 * Math.min(done, total) / total)) + '%'; };
  const skipT = setTimeout(() => introActions('<button class="btn ghost" type="button" id="introSkip">Entrar ya (el resto carga después)</button><p class="note">La primera vez tarda más porque busca escudos y fotos en internet. Después quedan guardados y la carga es rápida.</p>', a => a.querySelector('#introSkip').onclick = () => { skip = true; introActions(''); }), 6000);
  const pool = async (items, n, fn) => { const q = items.slice(); await Promise.all(Array.from({ length: n }, async () => { while (q.length && !out()) { await fn(q.shift()); done++; say(); } })); };
  const pic = u => new Promise(res => { if (!u) return res(); const im = new Image(), t = setTimeout(res, 8000); if (!/^(blob|data):/.test(u)) im.crossOrigin = null; im.onload = () => { clearTimeout(t); (im.decode ? im.decode() : Promise.resolve()).catch(() => { }).then(res); }; im.onerror = () => { clearTimeout(t); res(); }; im.src = u; });
  const until = async (ok, ms) => { const t = Date.now(); while (!ok() && !out() && Date.now() - t < ms) await introWait(150); };
  const teams = S.ix.teams.filter(t => PD.roster(S.d, t).length || BADGES.idx.has(t.id));
  const cur = S.ix.teamById.get(S.team), roster = cur ? PD.roster(S.d, cur).map(r => r.pid) : [];
  // 1) escudos de Sider (archivos locales) y caras del juego del equipo que se abre
  const local = teams.filter(t => BADGES.idx.has(t.id) && !BADGES.url.has(t.id));
  const facesLocal = roster.filter(pid => FACES.idx.has(pid) && !FACES.url.has(pid));
  total = local.length + facesLocal.length; say();
  await pool(local, 8, async t => { BADGES.loading.add(t.id); await loadLocalBadge(t.id); });
  facesLocal.forEach(pid => faceUrl(pid)); await until(() => facesLocal.every(pid => FACES.url.has(pid)), 8000); done += facesLocal.length; say();
  // 2) lo que se ve primero y todavía no se buscó en internet: escudos de los primeros equipos de la lista y caras del equipo abierto
  render(); await introWait(60);
  const firstIds = [...new Set([...document.querySelectorAll('img[data-badge]')].filter(i => { const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }).slice(0, 24).map(i => +i.dataset.badge))];
  if (PREFS.onlineBadges) firstIds.forEach(id => { const t = S.ix.teamById.get(id); if (t && !BADGES.idx.has(id) && !BADGES.online.has(id)) badgeUrl(t, true); });
  if (PREFS.online) roster.forEach(pid => { if (!FACES.idx.has(pid) && !FACES.online.has(pid)) faceUrl(pid); });
  const pend = () => firstIds.filter(id => PREFS.onlineBadges && !BADGES.idx.has(id) && !BADGES.online.has(id) && !BADGES.err.has(id)).length + (PREFS.online ? roster.filter(pid => !FACES.idx.has(pid) && !FACES.online.has(pid) && !FACES.err.has(pid)).length : 0);
  const p0 = pend();
  if (p0) { total += p0; done = total - p0; say(); await until(() => { const p = pend(); done = total - p; say(); return !p; }, CAP); }
  // 3) todas las imágenes ya conocidas (escudos y caras), descargadas y listas para dibujar
  const urls = new Set();
  for (const t of teams) { const u = BADGES.url.get(t.id) || BADGES.online.get(t.id); if (u) urls.add(u); }
  FACE_CTX.nat = !!(cur && isNat(cur)); for (const pid of roster) { const u = FACES.url.get(pid) || onlineFor(pid); if (u) urls.add(u); }
  total += urls.size; say();
  await pool([...urls], 10, pic);
  // 4) lo que quedó en pantalla (banderas, logos, fotos) terminado de dibujar
  render(); await introWait(60);
  const vis = [...document.querySelectorAll('img')].filter(i => !(INTRO.el && INTRO.el.contains(i))).filter(i => i.getAttribute('src') && i.getBoundingClientRect().top < innerHeight);
  await Promise.race([Promise.all(vis.map(i => i.complete ? (i.decode ? i.decode().catch(() => { }) : null) : new Promise(r => { i.onload = i.onerror = r; }))), introWait(Math.max(1500, CAP - (Date.now() - T0)))]);
  clearTimeout(skipT); introActions('');
  if (li) li.textContent = skip ? 'Escudos y fotos: el resto termina de cargar en el editor.' : 'Escudos y fotos listos.';
}
// cambiar entre EDITs encontrados (drmp / save / otra cuenta de Steam)
async function pesSwitch(i) {
  const e = PESLOC.edits[i]; if (!e) return;
  if (pending() && !await confirmBox('Tenés cambios sin guardar. ¿Abrir el otro EDIT igual?')) return;
  try { const file = await e.handle.getFile(); PESLOC.chosen = e; S.dir = e.dir; S.editHandle = e.handle; S.mtime = file.lastModified; openBytes(new Uint8Array(await file.arrayBuffer()), e.path + '\\EDIT00000000'); toast('Abierto ' + e.path + '.'); } catch (er) { toast(er.message, 6000); }
}

// ===================== WEPES: archivos que el juego importa (imágenes para escudos, uniformes, carteles…) =====================
const WEP = { path: [], items: null, sel: null, err: '' };
const wepFmt = n => n >= 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : n >= 1024 ? Math.round(n / 1024) + ' KB' : n + ' B';
const wepKind = n => /\.(png|jpe?g|bmp|gif|webp)$/i.test(n) ? 'img' : /\.dds$/i.test(n) ? 'dds' : /\.(ftex)$/i.test(n) ? 'ftex' : 'file';
async function wepDir() { let d = PESLOC.wepes; for (const p of WEP.path) d = await d.getDirectoryHandle(p); return d; }
async function wepesCount() { const c = $('cWepes'); if (!c) return; if (!PESLOC.wepes) { c.textContent = ''; return; } let n = 0; try { for await (const [, h] of PESLOC.wepes.entries()) if (h.kind === 'file') n++; } catch { } c.textContent = n || ''; }
async function wepLoad() {
  WEP.items = null; WEP.err = '';
  try { const d = await wepDir(), items = []; for await (const [n, h] of d.entries()) { if (h.kind === 'directory') items.push({ n, h, dir: true }); else { const f = await h.getFile(); items.push({ n, h, size: f.size, mtime: f.lastModified, kind: wepKind(n) }); } }
    items.sort((a, b) => (b.dir - a.dir) || a.n.localeCompare(b.n, 'es', { numeric: true })); WEP.items = items; } catch (e) { WEP.err = e.message; WEP.items = []; }
}
function renderWepes(m) {
  if (!PESLOC.wepes) { m.innerHTML = `<div class="sheet" style="max-width:900px"><div class="card"><h3>Carpeta WEPES</h3><p class="note">${PESLOC.season ? 'No hay carpeta WEPES dentro de ' + esc(PESLOC.season.name) + '. El juego la crea la primera vez que exportás o importás algo en el modo Editar.' : 'Todavía no se encontró la carpeta del juego.'}</p>
    <div class="row">${PESLOC.season ? '<button class="btn primary" type="button" id="wepMake">Crear la carpeta WEPES</button>' : '<button class="btn primary" type="button" id="wepFind">Buscar mi carpeta de PES</button>'}</div></div>${helpCard('wepes')}</div>`;
    const mk = $('wepMake'); if (mk) mk.onclick = async () => { try { PESLOC.wepes = await PESLOC.season.getDirectoryHandle('WEPES', { create: true }); render(); } catch (e) { toast('No se pudo crear: ' + e.message, 6000); } };
    const fd = $('wepFind'); if (fd) fd.onclick = () => pesStart(true);
    return; }
  if (!WEP.items) { m.innerHTML = '<div class="card"><div class="lmload"><span class="spin"></span> Leyendo la carpeta WEPES…</div></div>'; wepLoad().then(() => { if (S.tab === 'wepes') render(); }); return; }
  const crumbs = [PESLOC.season ? PESLOC.season.name : '', 'WEPES', ...WEP.path].filter(Boolean);
  const files = WEP.items.filter(x => !x.dir), total = files.reduce((a, x) => a + x.size, 0);
  m.innerHTML = `<div class="sheet"><div class="card">
    <div class="row" style="justify-content:space-between"><div class="wepcrumb">${crumbs.map((c, i) => i >= 1 && i < crumbs.length - 1 ? `<button type="button" class="btn ghost small" data-up="${crumbs.length - 1 - i}">${esc(c)}</button>` : `<span>${esc(c)}</span>`).join('<i>›</i>')}</div>
      <div class="row"><span class="note">${files.length} archivo${files.length === 1 ? '' : 's'} · ${wepFmt(total)}</span><button class="btn small" type="button" id="wepRef">↻ Actualizar</button><button class="btn small primary" type="button" id="wepAdd">＋ Agregar archivos…</button></div></div>
    ${WEP.err ? `<div class="warnbox">${esc(WEP.err)}</div>` : ''}
    ${WEP.items.length ? `<div class="wepgrid" id="wepGrid">${WEP.items.map((x, i) => `<button type="button" class="wepi ${x.dir ? 'dir' : x.kind}" data-i="${i}" title="${esc(x.n)}">
        <span class="wept">${x.dir ? '📁' : x.kind === 'img' || x.kind === 'dds' || x.kind === 'ftex' ? '<canvas width="132" height="100"></canvas>' : '📄'}</span>
        <b>${esc(x.n)}</b><small>${x.dir ? 'Carpeta' : wepFmt(x.size) + ' · ' + new Date(x.mtime).toLocaleDateString('es-AR')}</small></button>`).join('')}</div>`
      : `<div class="wepempty"><b>La carpeta WEPES está vacía.</b><span>Poné acá las imágenes que quieras importar en el modo Editar del juego (escudos, uniformes, carteles, fotos). También aparecen acá los archivos que exportes desde el juego.</span></div>`}
    <p class="note">Ubicación: Documentos\\KONAMI\\${esc(crumbs.join('\\'))}. Lo que agregues desde acá se copia a esa carpeta; el juego lo ve la próxima vez que entres a importar imágenes.</p>
  </div>${helpCard('wepes')}</div>`;
  // miniaturas
  m.querySelectorAll('.wepi canvas').forEach(async c => { const x = WEP.items[+c.closest('.wepi').dataset.i]; try { const f = await x.h.getFile(), buf = await f.arrayBuffer(); let src;
    if (x.kind === 'img') src = await createImageBitmap(new Blob([buf])); else src = imgToCanvas(x.kind === 'dds' ? DDS.decodeSmall(buf, 256) : await ftexDecode(buf, 256));
    const g = c.getContext('2d'), k = Math.min(c.width / src.width, c.height / src.height); g.drawImage(src, (c.width - src.width * k) / 2, (c.height - src.height * k) / 2, src.width * k, src.height * k); } catch { c.replaceWith(Object.assign(document.createElement('span'), { textContent: '🖼' })); } });
  $('wepRef').onclick = () => { WEP.items = null; render(); };
  m.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { WEP.path = WEP.path.slice(0, WEP.path.length - +b.dataset.up); WEP.items = null; render(); });
  $('wepAdd').onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true; inp.onchange = async () => { const fs = [...inp.files]; if (!fs.length) return; try { const d = await wepDir(); for (const f of fs) { const h = await d.getFileHandle(f.name, { create: true }), w = await h.createWritable(); await w.write(await f.arrayBuffer()); await w.close(); } toast(fs.length + ' archivo' + (fs.length > 1 ? 's copiados' : ' copiado') + ' a WEPES.'); WEP.items = null; wepesCount(); render(); } catch (e) { toast('No se pudo copiar: ' + e.message, 6000); } }; inp.click(); };
  const grid = $('wepGrid'); if (grid) grid.onclick = async e => { const b = e.target.closest('.wepi'); if (!b) return; const x = WEP.items[+b.dataset.i];
    if (x.dir) { WEP.path.push(x.n); WEP.items = null; render(); return; }
    const f = await x.h.getFile(), url = URL.createObjectURL(f), img = x.kind === 'img';
    let prev = img ? `<img src="${url}" alt="${esc(x.n)}">` : '';
    if (!img && (x.kind === 'dds' || x.kind === 'ftex')) { try { const cv = imgToCanvas(x.kind === 'dds' ? DDS.decodeSmall(await f.arrayBuffer(), 1024) : await ftexDecode(await f.arrayBuffer(), 1024)); prev = `<img src="${cv.toDataURL()}" alt="${esc(x.n)}">`; } catch { } }
    const dims = img ? await new Promise(r => { const i = new Image(); i.onload = () => r(i.naturalWidth + ' × ' + i.naturalHeight + ' px'); i.onerror = () => r(''); i.src = url; }) : '';
    ksModal(x.n, `<div class="wepprev">${prev || '<p class="note">Sin vista previa para este tipo de archivo.</p>'}</div><p class="note">${wepFmt(x.size)}${dims ? ' · ' + dims : ''} · ${new Date(x.mtime).toLocaleString('es-AR')}</p>
      <div class="mdlbtns"><a class="btn" href="${url}" download="${esc(x.n)}">Descargar una copia</a><button class="btn primary" type="button" data-x>Cerrar</button></div>`, () => { });
  };
}
