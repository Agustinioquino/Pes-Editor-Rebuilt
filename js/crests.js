// ===================== Subir tu propio escudo =====================
// El juego (con Sider) toma los escudos de livecpk\<carpeta>\common\render\symbol\flag\e_<ID de 6 cifras>_<tamaño>.png.
// Con una imagen se arman todos los tamaños; si subís tus propios archivos e_XXXXXX_*.png, cada uno va a su lugar
// y el ID se cambia al del equipo. Lo que ya había queda guardado como .bak-edit21 (solo la primera vez).
const CREST_SET = [ // tamaño de cada archivo cuando la carpeta del juego no trae otro escudo para copiar la medida
  ['f', 256], ['f_l', 512], ['f_ll', 1024], ['r', 256], ['r_l', 256], ['r_ll', 1024],
  ['r_b', 256], ['r_b_l', 256], ['r_b_ll', 1024], ['r_w', 256], ['r_w_l', 256], ['r_w_ll', 1024]];
const CREST_FLAG = 'common/render/symbol/flag', CREST_ROOT = 'PESEditor-Escudos';
// calidad: 'hd' copia la medida de los escudos que ya hay en la carpeta; '2k' (prueba) usa medidas fijas más grandes
const CREST_Q_LS = 'edit21-crest-q', CREST_2K = { ll: [2056, 2088], l: [1028, 1044], n: [512, 520] };
function crestQ() { try { return localStorage.getItem(CREST_Q_LS) === '2k' ? '2k' : 'hd'; } catch { return 'hd'; } }
function crestQSet(q) { try { localStorage.setItem(CREST_Q_LS, q); } catch { } }
// la letra de tamaño va al final: sin letra = normal, _l = grande, _ll = el más grande
const crestSizeKey = suf => /_ll$/.test(suf) ? 'll' : /_l$/.test(suf) ? 'l' : 'n';
// en HD no se copian medidas de 2K que hayan quedado en la carpeta: arriba de 1028×1044 el juego puede no mostrarlo bien
function crestSize(tg, suf) { if (crestQ() === '2k') return CREST_2K[crestSizeKey(suf)]; const [w, h] = tg.size[suf]; return w > 1028 || h > 1044 ? CREST_2K.l : [w, h]; }
// agrega la carpeta a sider.ini (antes de las otras cpk.root, así sus escudos mandan); copia de seguridad la primera vez
async function crestIniAdd(sider, root, label = 'escudos propios') {
  const f = await sdbFile(sider, 'sider.ini'); if (!f) throw new Error('En esa carpeta no está sider.ini: elegí la carpeta de Sider (la que tiene sider.exe).');
  const orig = typeof siReadIni === 'function' ? await siReadIni(sider) : await f.text(), nl = orig.includes('\r\n') ? '\r\n' : '\n', lines = orig.split(/\r?\n/), line = `cpk.root = ".\\livecpk\\${root}"`;
  if (lines.some(l => new RegExp('^\\s*cpk\\.root\\s*=\\s*"?\\.?[\\\\/]?livecpk[\\\\/]' + root.replace(/[-.]/g, '\\$&') + '[\\\\/]?"?\\s*$', 'i').test(l))) return false;
  const i = lines.findIndex(l => /^\s*cpk\.root\s*=/i.test(l));
  if (i >= 0) lines.splice(i, 0, '; PES Editor: ' + label, line); else lines.push('', '; PES Editor: ' + label, line);
  if (!await sdbFile(sider, 'sider.ini.bak-pes-editor')) await sdbWrite(sider, 'sider.ini.bak-pes-editor', orig);
  await sdbWrite(sider, 'sider.ini', lines.join(nl)); if (typeof siReset === 'function') siReset(); return true;
}
const CR = { team: null, main: null, own: {}, renamed: 0, prev: null, target: null, busy: false, msg: '', err: '', done: false, tone: null, adj: { b: null, w: null }, thumbs: null };
const crestId = id => String(id).padStart(6, '0');
const crestName = (id, suf) => `e_${crestId(id)}_${suf}.png`;
function crestReset(t) { if (CR.prev) URL.revokeObjectURL(CR.prev); Object.assign(CR, { team: t.id, main: null, own: {}, renamed: 0, prev: null, target: null, busy: false, msg: '', err: '', done: false, tone: null, adj: { b: null, w: null }, thumbs: null }); }

// ---- imágenes ----
async function crestLoad(file) { const bmp = await createImageBitmap(file); const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height; c.getContext('2d').drawImage(bmp, 0, 0); bmp.close && bmp.close(); return crestTrim(c); }
function crestTrim(c) { // saca el borde transparente para que el escudo ocupe todo el lugar
  const g = c.getContext('2d'), { width: W, height: H } = c; let d; try { d = g.getImageData(0, 0, W, H).data; } catch { return c; }
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0 || (x0 === 0 && y0 === 0 && x1 === W - 1 && y1 === H - 1)) return c;
  const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1; o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height); return o;
}
function crestFit(src, w, h) { // la imagen entra entera, centrada, con fondo transparente
  const o = document.createElement('canvas'); o.width = w; o.height = h; const g = o.getContext('2d'); g.imageSmoothingQuality = 'high';
  const k = Math.min(w / src.width, h / src.height), dw = Math.round(src.width * k), dh = Math.round(src.height * k);
  // achicar de a la mitad se ve más nítido que de un solo salto
  let s = src; while (s.width / 2 >= dw && s.height / 2 >= dh) { const t = document.createElement('canvas'); t.width = Math.round(s.width / 2); t.height = Math.round(s.height / 2); const tg = t.getContext('2d'); tg.imageSmoothingQuality = 'high'; tg.drawImage(s, 0, 0, t.width, t.height); s = t; }
  g.drawImage(s, Math.round((w - dw) / 2), Math.round((h - dh) / 2), dw, dh); return o;
}
const crestBlob = c => new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('No se pudo armar el PNG.')), 'image/png'));
// ---- r_b / r_w: cuánto negro o blanco tiene el escudo y el retoque para que no se pierda sobre esos fondos ----
const CREST_DARK = 50, CREST_LIGHT = 215, CREST_ASK = .15; // luminancia de "negro" y "blanco", y desde qué parte del escudo se pregunta
function crestTone(src) {
  const c = crestFit(src, 128, 128), d = c.getContext('2d').getImageData(0, 0, 128, 128).data; let n = 0, dark = 0, light = 0;
  for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; n++; const L = .299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2]; if (L < CREST_DARK) dark++; else if (L > CREST_LIGHT) light++; }
  return n ? { dark: dark / n, light: light / n } : { dark: 0, light: 0 };
}
const crestKind = suf => /^r_b/.test(suf) ? 'b' : /^r_w/.test(suf) ? 'w' : '';
// 'b': los negros pasan a gris oscuro y lleva un fileteado claro; 'w': los blancos pasan a gris claro y lleva un borde oscuro suave
function crestAdjust(c, kind) {
  const W = c.width, H = c.height, g = c.getContext('2d'), im = g.getImageData(0, 0, W, H), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue; const L = .299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2];
    if (kind === 'b' && L < 90) { const k = (90 - L) / 90 * 48; d[i] += k; d[i + 1] += k; d[i + 2] += k; }
    if (kind === 'w' && L > 190) { const k = (L - 190) / 65 * 38; d[i] -= k; d[i + 1] -= k; d[i + 2] -= k; }
  }
  g.putImageData(im, 0, 0);
  // borde: la silueta del escudo de un color, corrida en 16 direcciones, por debajo de la imagen
  const r = Math.max(1, Math.round(Math.min(W, H) / 170)), sil = document.createElement('canvas'); sil.width = W; sil.height = H;
  const sg = sil.getContext('2d'); sg.drawImage(c, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = kind === 'b' ? '#d9d9d9' : '#3a3a3a'; sg.fillRect(0, 0, W, H);
  const o = document.createElement('canvas'); o.width = W; o.height = H; const og = o.getContext('2d');
  if (kind === 'w') og.globalAlpha = .55;
  for (let a = 0; a < 16; a++) og.drawImage(sil, Math.round(Math.cos(a * Math.PI / 8) * r), Math.round(Math.sin(a * Math.PI / 8) * r));
  og.globalAlpha = 1; og.drawImage(c, 0, 0); return o;
}
// el archivo de cada tamaño, con el retoque de r_b / r_w si el usuario lo pidió (sus propios archivos no se tocan)
function crestMake(suf, w, h) {
  const own = CR.own[suf]; if (own && own.width === w && own.height === h) return own;
  const c = crestFit(own || CR.main, w, h), k = crestKind(suf);
  return k && !own && CR.adj[k] ? crestAdjust(c, k) : c;
}
function crestDims(tg, suf, def) { return tg || crestQ() === '2k' ? crestSize(tg, suf) : [def, def]; }
function crestThumbs() { // vista previa chica de los 11 archivos
  if (!CR.main && !Object.keys(CR.own).length) return null;
  return CREST_SET.map(([suf, def]) => {
    const [w, h] = crestDims(CR.target, suf, def), k = Math.min(1, 84 / Math.max(w, h)), tw = Math.max(1, Math.round(w * k)), th = Math.max(1, Math.round(h * k));
    return { suf, w, h, url: crestMake(suf, tw, th).toDataURL('image/png') };
  });
}
async function pngSize(h) { try { const b = new Uint8Array(await (await h.getFile()).slice(0, 24).arrayBuffer()); if (b[1] !== 0x50 || b[2] !== 0x4e) return null; const v = new DataView(b.buffer); return [v.getUint32(16), v.getUint32(20)]; } catch { return null; } }

// ---- dónde guardar: la carpeta de Sider que ya tiene escudos ----
async function crestSider(write) {
  const h = await idbGet('sider'); if (!h) throw new Error('Primero tocá "Conectar carpeta Sider".');
  const mode = write ? 'readwrite' : 'read';
  if ((await h.queryPermission({ mode })) !== 'granted' && (await h.requestPermission({ mode })) !== 'granted') throw new Error(write ? 'Sin permiso para guardar en la carpeta del juego.' : 'Sin permiso para leer la carpeta del juego.');
  return h;
}
async function crestTarget(t, sider) {
  let live = null; try { live = await sider.getDirectoryHandle('livecpk'); } catch { }
  // orden de sider.ini: la primera carpeta de la lista es la que manda en el juego
  const ini = (typeof siReadIni === 'function' ? await siReadIni(sider) : await readText(sider, 'sider.ini')) || '', order = [];
  for (const m of ini.matchAll(/^\s*cpk\.root\s*=\s*"?([^"\r\n]+)"?/gim)) { const p = m[1].trim().replace(/\\/g, '/').replace(/^\.\//, ''); const k = p.match(/(?:^|\/)livecpk\/([^/]+)\/?$/i); if (k) order.push(k[1].toLowerCase()); }
  const rank = n => { const i = order.indexOf(n.toLowerCase()); return i < 0 ? 1e6 : i; };
  const roots = []; if (live) for await (const [name, h] of live.entries()) if (h.kind === 'directory') roots.push({ name, h, r: rank(name) });
  roots.sort((a, b) => a.r - b.r || a.name.localeCompare(b.name));
  const mine = new RegExp('^e_' + crestId(t.id) + '_', 'i'); let best = null;
  for (const ro of roots) {
    // Sider no la lee: no se toca (si sider.ini no se pudo leer, por ejemplo en Chrome, vale cualquiera que ya tenga escudos)
    if (order.length && ro.r >= 1e6 && ro.name.toLowerCase() !== CREST_ROOT.toLowerCase()) continue;
    let flag; try { flag = await subDir(ro.h, CREST_FLAG); } catch { continue; }
    let n = 0, has = false; const sample = {};
    for await (const [name, fh] of flag.entries()) {
      if (fh.kind !== 'file') continue; const m = name.match(/^e_\d{6}_(\w+)\.png$/i); if (!m) continue;
      n++; if (mine.test(name)) has = true; else if (!sample[m[1].toLowerCase()]) sample[m[1].toLowerCase()] = fh;
    }
    const c = { root: ro.name, h: ro.h, flag, n, has, sample, listed: ro.r < 1e6 || !order.length };
    if (has) { best = c; break; } // la primera (en el orden de Sider) que ya tiene escudo de este equipo
    if (n && (!best || n > best.n)) best = c;
  }
  // ninguna carpeta tiene escudos: se crea una propia en livecpk y se agrega a sider.ini
  if (!best) { const ro = roots.find(r => r.name.toLowerCase() === CREST_ROOT.toLowerCase()); best = { root: CREST_ROOT, h: ro ? ro.h : null, flag: null, n: 0, has: false, sample: {}, listed: !!ro && ro.r < 1e6, create: !ro }; }
  // la medida de cada archivo: la misma que usan los escudos que ya están en esa carpeta
  best.size = {}; for (const [suf, def] of CREST_SET) best.size[suf] = (best.sample[suf] && await pngSize(best.sample[suf])) || [def, def];
  return best;
}

// ---- pantalla (dentro de "Datos y colores") ----
function crestAskHtml() {
  if (!CR.main || !CR.tone) return '';
  const pct = v => Math.round(v * 100) + '%', rows = [['b', 'dark', 'r_b', 'fondos oscuros', 'negro o colores muy oscuros', 'aclarar un poco los negros y ponerle un fileteado claro', 'Aclarar negros'], ['w', 'light', 'r_w', 'fondos claros', 'blanco o colores muy claros', 'bajar un poco los blancos y ponerle un borde oscuro suave', 'Bajar blancos']];
  return rows.map(([k, tk, suf, fondo, que, hace, btn]) => {
    const v = CR.tone[tk], ask = v >= CREST_ASK && CR.adj[k] === null;
    if (ask) return `<div class="crestask"><p class="note" style="margin:0">El escudo tiene mucho ${que} (${pct(v)}). ¿Querés que la versión <code>${suf}</code> (para ${fondo}) tenga un retoque para que no se pierda? Voy a ${hace}.</p><div class="row"><button class="btn small primary" type="button" data-crestadj="${k}" data-v="1">Sí, retocar ${suf}</button><button class="btn small ghost" type="button" data-crestadj="${k}" data-v="0">No, dejarla igual</button></div></div>`;
    return `<div class="mfline"><span>${suf}</span><div class="seg">${[['0', 'Igual que r'], ['1', btn]].map(([x, n]) => `<button type="button" data-crestadj="${k}" data-v="${x}" aria-pressed="${!!CR.adj[k] === (x === '1')}" ${CR.busy ? 'disabled' : ''}>${n}</button>`).join('')}</div><small class="muted">${pct(v)} ${k === 'b' ? 'oscuro' : 'claro'}</small></div>`;
  }).join('');
}
function crestCard(t) {
  if (CR.team !== t.id) crestReset(t);
  const own = Object.keys(CR.own), ready = CR.main || own.length, tg = CR.target, path = tg ? `livecpk\\${tg.root}\\common\\render\\symbol\\flag\\` : 'livecpk\\…\\common\\render\\symbol\\flag\\';
  const q = crestQ(), sizes = CREST_SET.map(([s]) => { const z = tg || q === '2k' ? crestSize(tg, s) : null; return `<span class="chip"${z ? ` title="${z[0]}×${z[1]}"` : ''}>${crestName(t.id, s)}${z ? ` <small>${z[0]}×${z[1]}</small>` : ''}</span>`; }).join('');
  return `<div class="card crestup" id="crestCard"><h3>🛡️ Escudo</h3>
    <div class="crestrow">
      <div class="crestbox"><span class="lab">Ahora</span>${crest(t, 'big', true)}</div>
      <div class="crestbox"><span class="lab">Nuevo</span><div class="crestnew${CR.prev ? '' : ' empty'}" id="crestDrop">${CR.prev ? `<img src="${CR.prev}" alt="Escudo nuevo">` : '<span>Soltá acá un PNG<br>o tocá Elegir</span>'}</div></div>
      <div class="crestinfo">
        <p class="note" style="margin:0">Subí un PNG (mejor con fondo transparente). El editor arma los ${CREST_SET.length} archivos que usa el juego, cada uno con su tamaño, y les pone el ID <b>${crestId(t.id)}</b> de este equipo. También podés subir tus propios archivos <code>e_XXXXXX_f.png</code>, <code>e_XXXXXX_r_l.png</code>…: cada uno va a su lugar y el ID se corrige solo.</p>
        <div class="mfline"><span>Calidad</span><div class="seg" id="crestQSeg">${[['hd', 'HD normal'], ['2k', '2K (experimental)']].map(([k, n]) => `<button type="button" data-crestq="${k}" aria-pressed="${q === k}" ${CR.busy ? 'disabled' : ''}>${n}</button>`).join('')}</div></div>
        <p class="note" style="margin:0">${q === '2k' ? 'En 2K los archivos sin letra de tamaño quedan en <b>512×520</b>, los <code>_l</code> en <b>1028×1044</b> y los <code>_ll</code> en <b>2056×2088</b>. <b>Es experimental:</b> en las pruebas el juego bajó 3 o 4 FPS y tuvo lag en algunos menús. Si te pasa, volvé a HD normal y guardá de nuevo.' : 'En HD normal cada archivo copia la medida de los escudos que ya hay en la carpeta (si no hay ninguno: 256, 512 y 1024).'}</p>
        <div class="row"><button class="btn small" type="button" id="crestPick">📁 Elegir imagen o archivos</button><button class="btn small" type="button" id="plOpen" aria-expanded="${PL.open && PL.team === t.id}">🔎 Buscar en PES Logos</button>
          <button class="btn small primary" type="button" id="crestSave" ${ready && !CR.busy ? '' : 'disabled'}>${CR.busy ? 'Guardando…' : '💾 Guardar escudo en el juego'}</button>
          ${ready ? '<button class="btn small ghost" type="button" id="crestClear">✕ Quitar</button>' : ''}</div>
        ${plHtml(t)}
        ${crestAskHtml()}
        ${CR.err ? `<p class="note bad" role="alert">${esc(CR.err)}</p>` : ''}${CR.msg ? `<p class="note ${CR.done ? 'ok' : ''}" role="status">${CR.msg}</p>` : ''}
        ${own.length ? `<p class="note"><span>Tus archivos:</span> ${own.map(s => `<b>${s}</b>`).join(', ')}.${own.length < CREST_SET.length ? ' <span>Los demás tamaños salen de la imagen más grande.</span>' : ''}${CR.renamed ? ` <span>(${CR.renamed} con otro ID: se guardan con el ${crestId(t.id)})</span>` : ''}</p>` : ''}
        ${tg && tg.create && !CR.done ? '<p class="note warn">📂 Tu Sider no tiene una carpeta de escudos: al guardar la creo y la agrego a sider.ini para que se lea con livecpk.</p>' : ''}
        ${tget(t, 'e_emblem') ? '<p class="note warn">Este equipo usa un escudo hecho en el modo Editar del juego, que tapa al de la carpeta Sider. <button class="btn small" type="button" id="crestUsePatch">Usar el escudo de Sider</button></p>' : ''}
      </div>
    </div>
    ${CR.thumbs ? `<div class="crestprev"><span class="lab">Vista previa de los archivos</span><div class="crestthumbs">${CR.thumbs.map(x => `<figure class="crestthumb ${crestKind(x.suf) || 'n'}"><div><img src="${x.url}" alt="${x.suf}"></div><figcaption><b>${x.suf}</b> <small>${x.w}×${x.h}</small>${crestKind(x.suf) && CR.adj[crestKind(x.suf)] && !CR.own[x.suf] ? ' <small class="crestfix">retocado</small>' : ''}</figcaption></figure>`).join('')}</div></div>` : ''}
    <details class="crestfiles"><summary>Dónde y cómo se guarda</summary><p class="note">En <code>${esc(path)}</code>${tg && tg.create ? '. <span>Tu Sider no tiene una carpeta de escudos: al guardar la creo y la agrego a sider.ini para que se lea con livecpk</span>' : tg && !tg.listed ? '. <span>Esa carpeta no figura en sider.ini: al guardar la agrego para que Sider la lea</span>' : ''}. Si ya había un escudo, se guarda una copia <code>.bak-edit21</code> al lado, que se borra sola la próxima vez que abrís el editor. Abrí el juego de nuevo para verlo.</p><div class="chips">${sizes}</div>
      <p class="note"><b>Qué significan las letras.</b> La primera dice dónde se usa el escudo: <code>f</code> plano (como bandera), <code>r</code> render (con relieve), <code>r_b</code> render para fondos oscuros o negros y <code>r_w</code> render para fondos claros o blancos. La última dice el tamaño: sin letra es el normal o miniatura, <code>_l</code> el grande y <code>_ll</code> el más grande.</p></details>
  </div>`;
}
async function crestFiles(t, files) {
  CR.err = ''; CR.msg = ''; CR.done = false;
  PL.got = null; // si después llega un escudo de PES Logos, plUse vuelve a poner de dónde salió
  for (const f of files) {
    if (!/^image\//.test(f.type) && !/\.(png|jpe?g|webp)$/i.test(f.name)) continue;
    try {
      const c = await crestLoad(f), m = f.name.match(/^e_(\d{6})_(\w+?)(?:\s*-\s*copia)?\.png$/i), suf = m && m[2].toLowerCase();
      if (suf && CREST_SET.some(([s]) => s === suf)) { CR.own[suf] = c; if (+m[1] !== t.id) CR.renamed++; }
      if (!CR.main || c.width * c.height > CR.main.width * CR.main.height) CR.main = c;
    } catch (e) { CR.err = 'No se pudo leer ' + f.name + ': ' + e.message; }
  }
  if (CR.main) { if (CR.prev) URL.revokeObjectURL(CR.prev); CR.prev = URL.createObjectURL(await crestBlob(crestFit(CR.main, 256, 256))); }
  try { if (!CR.target) CR.target = await crestTarget(t, await crestSider(false)); } catch { }
  if (CR.main) { CR.tone = crestTone(CR.main); CR.adj = { b: null, w: null }; }
  CR.thumbs = crestThumbs();
}
async function crestSave(t) {
  CR.busy = true; CR.err = ''; CR.msg = ''; crestPaint(t);
  try {
    const sider = await crestSider(true), tg = CR.target = await crestTarget(t, sider);
    // primero sider.ini: si no se puede agregar la carpeta, no se crea nada (antes quedaba una carpeta vacía)
    const iniAdded = !tg.listed && await crestIniAdd(sider, tg.root);
    if (!tg.h) tg.h = await (await sider.getDirectoryHandle('livecpk', { create: true })).getDirectoryHandle(tg.root, { create: true });
    const flag = tg.flag || await CREST_FLAG.split('/').reduce(async (d, seg) => (await d).getDirectoryHandle(seg, { create: true }), Promise.resolve(tg.h));
    let backed = 0, n = 0, last = null;
    for (const [suf] of CREST_SET) {
      const name = crestName(t.id, suf), [w, h] = crestSize(tg, suf), src = crestMake(suf, w, h);
      let old = null; try { old = await flag.getFileHandle(name); } catch { }
      if (old) { let bak = null; try { bak = await flag.getFileHandle(name + '.bak-edit21'); } catch { } if (!bak) { const b = await flag.getFileHandle(name + '.bak-edit21', { create: true }), wr = await b.createWritable(); await wr.write(await old.getFile()); await wr.close(); backed++; } }
      const fh = await flag.getFileHandle(name, { create: true }), wr = await fh.createWritable(); await wr.write(await crestBlob(src)); await wr.close(); n++;
      if (suf === 'r') last = fh;
    }
    if (backed) bakNote(flag);
    // el editor muestra el escudo nuevo enseguida
    if (last) { const u = BADGES.url.get(t.id); if (u && u.startsWith('blob:')) URL.revokeObjectURL(u); BADGES.url.delete(t.id); BADGES.idx.set(t.id, last); BADGES.count = BADGES.idx.size; BADGES.loading.add(t.id); await loadLocalBadge(t.id); }
    CR.done = true; CR.msg = `Listo: ${n} archivos${crestQ() === '2k' ? ' en 2K' : ''} guardados en livecpk\\${esc(tg.root)}\\common\\render\\symbol\\flag${backed ? ' (lo que había quedó como .bak-edit21 hasta la próxima vez que abras el editor)' : ''}. Abrí el juego de nuevo para verlo.`
      + (iniAdded ? ` <span>Agregué la carpeta ${esc(tg.root)} a sider.ini para que Sider la lea (copia en sider.ini.bak-pes-editor).</span>` : '');
    tg.listed = true; tg.create = false; tg.flag = flag;
    toast('Escudo de ' + tget(t, 'name') + ' guardado.');
  } catch (e) { CR.err = e.message; }
  CR.busy = false; crestPaint(t);
}
function crestPaint(t) { const el = $('crestCard'); if (!el) return; el.outerHTML = crestCard(t); bindCrest(t); }
function bindCrest(t) {
  const card = $('crestCard'); if (!card) return;
  const pick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true; inp.accept = 'image/png,image/jpeg,image/webp,.png'; inp.onchange = async () => { await crestFiles(t, [...inp.files]); crestPaint(t); }; inp.click(); };
  $('crestPick').onclick = pick; $('crestDrop').onclick = pick;
  $('crestSave').onclick = () => crestSave(t);
  plBind(t);
  card.querySelectorAll('[data-crestq]').forEach(b => b.onclick = () => { crestQSet(b.dataset.crestq); CR.done = false; CR.msg = ''; CR.thumbs = crestThumbs(); crestPaint(t); });
  card.querySelectorAll('[data-crestadj]').forEach(b => b.onclick = () => { CR.adj[b.dataset.crestadj] = b.dataset.v === '1'; CR.done = false; CR.msg = ''; CR.thumbs = crestThumbs(); crestPaint(t); });
  const cl = $('crestClear'); if (cl) cl.onclick = () => { PL.got = null; crestReset(t); crestPaint(t); };
  const up = $('crestUsePatch'); if (up) up.onclick = () => { setT(t, [['e_emblem', 0]], 'Escudo de Sider para ' + tget(t, 'name')); crestPaint(t); toast('Listo. Guardá el EDIT para que el juego use el escudo de Sider.'); };
  card.ondragover = e => { e.preventDefault(); card.classList.add('drag'); };
  card.ondragleave = e => { if (!card.contains(e.relatedTarget)) card.classList.remove('drag'); };
  card.ondrop = async e => { e.preventDefault(); card.classList.remove('drag'); await crestFiles(t, [...e.dataTransfer.files]); crestPaint(t); };
  if (!CR.target) idbGet('sider').then(async h => { if (!h || (await h.queryPermission({ mode: 'read' })) !== 'granted') return; try { CR.target = await crestTarget(t, h); CR.thumbs = crestThumbs(); if (CR.team === t.id && $('crestCard')) crestPaint(t); } catch { } });
}
