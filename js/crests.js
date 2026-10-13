// ===================== Subir tu propio escudo =====================
// El juego (con Sider) toma los escudos de livecpk\<carpeta>\common\render\symbol\flag\e_<ID de 6 cifras>_<tamaño>.png.
// Con una imagen se arman todos los tamaños; si subís tus propios archivos e_XXXXXX_*.png, cada uno va a su lugar
// y el ID se cambia al del equipo. Lo que ya había queda guardado como .bak-edit21 (solo la primera vez).
const CREST_SET = [ // tamaño de cada archivo cuando la carpeta del Parche no trae otro escudo para copiar la medida
  ['f', 256], ['f_l', 512], ['f_ll', 1024], ['r', 256], ['r_l', 256], ['r_ll', 1024],
  ['r_b_l', 256], ['r_b_ll', 1024], ['r_w', 256], ['r_w_l', 256], ['r_w_ll', 1024]];
const CREST_FLAG = 'common/render/symbol/flag';
const CR = { team: null, main: null, own: {}, renamed: 0, prev: null, target: null, busy: false, msg: '', err: '', done: false };
const crestId = id => String(id).padStart(6, '0');
const crestName = (id, suf) => `e_${crestId(id)}_${suf}.png`;
function crestReset(t) { if (CR.prev) URL.revokeObjectURL(CR.prev); Object.assign(CR, { team: t.id, main: null, own: {}, renamed: 0, prev: null, target: null, busy: false, msg: '', err: '', done: false }); }

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
async function pngSize(h) { try { const b = new Uint8Array(await (await h.getFile()).slice(0, 24).arrayBuffer()); if (b[1] !== 0x50 || b[2] !== 0x4e) return null; const v = new DataView(b.buffer); return [v.getUint32(16), v.getUint32(20)]; } catch { return null; } }

// ---- dónde guardar: la carpeta de Sider que ya tiene escudos ----
async function crestSider(write) {
  const h = await idbGet('sider'); if (!h) throw new Error('Primero tocá "Conectar carpeta Sider".');
  const mode = write ? 'readwrite' : 'read';
  if ((await h.queryPermission({ mode })) !== 'granted' && (await h.requestPermission({ mode })) !== 'granted') throw new Error(write ? 'Sin permiso para guardar en la carpeta del Parche.' : 'Sin permiso para leer la carpeta del Parche.');
  return h;
}
async function crestTarget(t, sider) {
  const live = await sider.getDirectoryHandle('livecpk');
  // orden de sider.ini: la primera carpeta de la lista es la que manda en el juego
  const ini = (await readText(sider, 'sider.ini')) || '', order = [];
  for (const m of ini.matchAll(/^\s*cpk\.root\s*=\s*"?([^"\r\n]+)"?/gim)) { const p = m[1].trim().replace(/\\/g, '/').replace(/^\.\//, ''); const k = p.match(/^livecpk\/([^/]+)\/?$/i); if (k) order.push(k[1].toLowerCase()); }
  const rank = n => { const i = order.indexOf(n.toLowerCase()); return i < 0 ? 1e6 : i; };
  const roots = []; for await (const [name, h] of live.entries()) if (h.kind === 'directory') roots.push({ name, h, r: rank(name) });
  roots.sort((a, b) => a.r - b.r || a.name.localeCompare(b.name));
  const mine = new RegExp('^e_' + crestId(t.id) + '_', 'i'); let best = null;
  for (const ro of roots) {
    let flag; try { flag = await subDir(ro.h, CREST_FLAG); } catch { continue; }
    let n = 0, has = false; const sample = {};
    for await (const [name, fh] of flag.entries()) {
      if (fh.kind !== 'file') continue; const m = name.match(/^e_\d{6}_(\w+)\.png$/i); if (!m) continue;
      n++; if (mine.test(name)) has = true; else if (!sample[m[1].toLowerCase()]) sample[m[1].toLowerCase()] = fh;
    }
    const c = { root: ro.name, h: ro.h, flag, n, has, sample, listed: ro.r < 1e6 };
    if (has) { best = c; break; } // la primera (en el orden de Sider) que ya tiene escudo de este equipo
    if (n && (!best || n > best.n)) best = c;
  }
  if (!best) { const ro = roots.find(r => r.r < 1e6) || roots[0]; if (!ro) throw new Error('No encontré carpetas dentro de livecpk.'); best = { root: ro.name, h: ro.h, flag: null, n: 0, has: false, sample: {}, listed: ro.r < 1e6 }; }
  // la medida de cada archivo: la misma que usan los escudos que ya están en esa carpeta
  best.size = {}; for (const [suf, def] of CREST_SET) best.size[suf] = (best.sample[suf] && await pngSize(best.sample[suf])) || [def, def];
  return best;
}

// ---- pantalla (dentro de "Datos y colores") ----
function crestCard(t) {
  if (CR.team !== t.id) crestReset(t);
  const own = Object.keys(CR.own), ready = CR.main || own.length, tg = CR.target, path = tg ? `livecpk\\${tg.root}\\common\\render\\symbol\\flag\\` : 'livecpk\\…\\common\\render\\symbol\\flag\\';
  const sizes = tg ? CREST_SET.map(([s]) => `<span class="chip" title="${tg.size[s][0]}×${tg.size[s][1]}">${crestName(t.id, s)}</span>`).join('') : CREST_SET.map(([s]) => `<span class="chip">${crestName(t.id, s)}</span>`).join('');
  return `<div class="card crestup" id="crestCard"><h3>🛡️ Escudo</h3>
    <div class="crestrow">
      <div class="crestbox"><span class="lab">Ahora</span>${crest(t, 'big', true)}</div>
      <div class="crestbox"><span class="lab">Nuevo</span><div class="crestnew${CR.prev ? '' : ' empty'}" id="crestDrop">${CR.prev ? `<img src="${CR.prev}" alt="Escudo nuevo">` : '<span>Soltá acá un PNG<br>o tocá Elegir</span>'}</div></div>
      <div class="crestinfo">
        <p class="note" style="margin:0">Subí un PNG (mejor con fondo transparente). El editor arma los ${CREST_SET.length} archivos que usa el juego, cada uno con su tamaño, y les pone el ID <b>${crestId(t.id)}</b> de este equipo. También podés subir tus propios archivos <code>e_XXXXXX_f.png</code>, <code>e_XXXXXX_r_l.png</code>…: cada uno va a su lugar y el ID se corrige solo.</p>
        <div class="row"><button class="btn small" type="button" id="crestPick">📁 Elegir imagen o archivos</button>
          <button class="btn small primary" type="button" id="crestSave" ${ready && !CR.busy ? '' : 'disabled'}>${CR.busy ? 'Guardando…' : '💾 Guardar escudo en el Parche'}</button>
          ${ready ? '<button class="btn small ghost" type="button" id="crestClear">✕ Quitar</button>' : ''}</div>
        ${CR.err ? `<p class="note bad" role="alert">${esc(CR.err)}</p>` : ''}${CR.msg ? `<p class="note ${CR.done ? 'ok' : ''}" role="status">${CR.msg}</p>` : ''}
        ${own.length ? `<p class="note"><span>Tus archivos:</span> ${own.map(s => `<b>${s}</b>`).join(', ')}.${own.length < CREST_SET.length ? ' <span>Los demás tamaños salen de la imagen más grande.</span>' : ''}${CR.renamed ? ` <span>(${CR.renamed} con otro ID: se guardan con el ${crestId(t.id)})</span>` : ''}</p>` : ''}
        ${tget(t, 'e_emblem') ? '<p class="note warn">Este equipo usa un escudo hecho en el modo Editar del juego, que tapa al del Parche. <button class="btn small" type="button" id="crestUsePatch">Usar el escudo del Parche</button></p>' : ''}
      </div>
    </div>
    <details class="crestfiles"><summary>Dónde y cómo se guarda</summary><p class="note">En <code>${esc(path)}</code>${tg && !tg.listed ? ' (ojo: esa carpeta no figura en sider.ini)' : ''}. Si ya había un escudo, la primera vez se guarda una copia <code>.bak-edit21</code> al lado. Abrí el juego de nuevo para verlo.</p><div class="chips">${sizes}</div></details>
  </div>`;
}
async function crestFiles(t, files) {
  CR.err = ''; CR.msg = ''; CR.done = false;
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
}
async function crestSave(t) {
  CR.busy = true; CR.err = ''; CR.msg = ''; crestPaint(t);
  try {
    const sider = await crestSider(true), tg = CR.target = await crestTarget(t, sider);
    const flag = tg.flag || await CREST_FLAG.split('/').reduce(async (d, seg) => (await d).getDirectoryHandle(seg, { create: true }), Promise.resolve(tg.h));
    let backed = 0, n = 0, last = null;
    for (const [suf] of CREST_SET) {
      const name = crestName(t.id, suf), [w, h] = tg.size[suf], src = CR.own[suf] && CR.own[suf].width === w && CR.own[suf].height === h ? CR.own[suf] : crestFit(CR.own[suf] || CR.main, w, h);
      let old = null; try { old = await flag.getFileHandle(name); } catch { }
      if (old) { let bak = null; try { bak = await flag.getFileHandle(name + '.bak-edit21'); } catch { } if (!bak) { const b = await flag.getFileHandle(name + '.bak-edit21', { create: true }), wr = await b.createWritable(); await wr.write(await old.getFile()); await wr.close(); backed++; } }
      const fh = await flag.getFileHandle(name, { create: true }), wr = await fh.createWritable(); await wr.write(await crestBlob(src)); await wr.close(); n++;
      if (suf === 'r') last = fh;
    }
    // el editor muestra el escudo nuevo enseguida
    if (last) { const u = BADGES.url.get(t.id); if (u && u.startsWith('blob:')) URL.revokeObjectURL(u); BADGES.url.delete(t.id); BADGES.idx.set(t.id, last); BADGES.count = BADGES.idx.size; BADGES.loading.add(t.id); await loadLocalBadge(t.id); }
    CR.done = true; CR.msg = `Listo: ${n} archivos guardados en livecpk\\${esc(tg.root)}\\common\\render\\symbol\\flag${backed ? ' (lo que había quedó guardado como .bak-edit21)' : ''}. Abrí el juego de nuevo para verlo.`;
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
  const cl = $('crestClear'); if (cl) cl.onclick = () => { crestReset(t); crestPaint(t); };
  const up = $('crestUsePatch'); if (up) up.onclick = () => { setT(t, [['e_emblem', 0]], 'Escudo del Parche para ' + tget(t, 'name')); crestPaint(t); toast('Listo. Guardá el EDIT para que el juego use el escudo del Parche.'); };
  card.ondragover = e => { e.preventDefault(); card.classList.add('drag'); };
  card.ondragleave = e => { if (!card.contains(e.relatedTarget)) card.classList.remove('drag'); };
  card.ondrop = async e => { e.preventDefault(); card.classList.remove('drag'); await crestFiles(t, [...e.dataTransfer.files]); crestPaint(t); };
  if (!CR.target) idbGet('sider').then(async h => { if (!h || (await h.queryPermission({ mode: 'read' })) !== 'granted') return; try { CR.target = await crestTarget(t, h); if (CR.team === t.id && $('crestCard')) crestPaint(t); } catch { } });
}
