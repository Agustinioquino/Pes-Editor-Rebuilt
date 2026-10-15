// ===================== Miniface propia (PNG o JPG → DDS para Sider) =====================
// El juego (con Sider) toma la miniface de livecpk\<carpeta>\common\render\symbol\player\<ID del jugador>.dds.
// Se arma igual que las minifaces nuevas: cuadrada, fondo transparente, DXT3 (BC2) sin mips.
// Se guarda en una carpeta propia del editor (primera en sider.ini, así manda): las minifaces que ya tenés no se tocan.
const MNF_ROOT = 'PESEditor-Minifaces', MNF_DIR = 'common/render/symbol/player', MNF_LS = 'edit21-miniface-v1';
const MNF_SIZES = [2048, 1024, 512, 256];
// dónde va la cabeza dentro del cuadro (medido en minifaces del juego): pelo al 4% de arriba, mentón al 77%, ancho 55%
const MNF_HEAD = { top: .04, chin: .77, w: .55 };
const MNF = { kit: null, wand: [], wandOn: false, mask: null, maskFor: null, aiBusy: false, aiProg: 0, aiErr: '', pid: null, file: '', img: null, src: null, alpha: false, bg: 'off', tol: 45, s: 1, x: 0, y: 0, guide: true, busy: false, prog: 0, msg: '', err: '', done: false, own: null, size: 2048 };
try { const j = JSON.parse(localStorage.getItem(MNF_LS) || '{}'); if (MNF_SIZES.includes(j.size)) MNF.size = j.size; if (j.guide === false) MNF.guide = false; } catch { }
const mnfPrefs = () => { try { localStorage.setItem(MNF_LS, JSON.stringify({ size: MNF.size, guide: MNF.guide })); } catch { } };
function mnfReset(pid) { Object.assign(MNF, { pid, wand: [], wandOn: false, mask: null, maskFor: null, aiBusy: false, aiProg: 0, aiErr: '', file: '', img: null, src: null, alpha: false, bg: 'off', s: 1, x: 0, y: 0, busy: false, prog: 0, msg: '', err: '', done: false, own: null }); }

// ---- imagen ----
function mnfShrink(src, max) { // lleva la imagen a un tamaño de trabajo (de a la mitad, se ve más nítido)
  let s = src, w = src.width, h = src.height;
  while (Math.max(w, h) > max * 1.5) { w = Math.round(w / 2); h = Math.round(h / 2); const t = document.createElement('canvas'); t.width = w; t.height = h; const g = t.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(s, 0, 0, w, h); s = t; }
  const k = Math.min(1, max / Math.max(w, h)), c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(s, 0, 0, c.width, c.height); return c;
}
function mnfHasAlpha(c) {
  const d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data;
  for (let i = 3; i < d.length; i += 4 * 7) if (d[i] < 250) return true; return false;
}
// Borrado de fondo. Cada paso compara con el píxel vecino (sigue los degradés) y con el color de donde arrancó (no se mete en la cara).
// Automático: arranca desde los bordes de arriba y de los costados (los hombros que tocan abajo quedan).
// Con un clic: arranca donde tocaste y borra lo de ese color que esté pegado.
function mnfFill(d, W, H, seen, starts, tol) {
  const n = W * H, seed = new Int32Array(n), q = new Int32Array(n), step = Math.max(8, tol * .6), cap = tol * 2; let qt = 0, qh = 0;
  const near = (a, b, t) => Math.abs(d[a * 4] - d[b * 4]) + Math.abs(d[a * 4 + 1] - d[b * 4 + 1]) + Math.abs(d[a * 4 + 2] - d[b * 4 + 2]) <= t;
  for (const i of starts) if (seen[i] !== 1) { seen[i] = 1; seed[i] = i; q[qt++] = i; }
  while (qh < qt) {
    const i = q[qh++], x = i % W, s0 = seed[i];
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) {
      if (j < 0 || j >= n || seen[j] === 1) continue;
      if (near(j, i, step) && near(j, s0, cap)) { seen[j] = 1; seed[j] = s0; q[qt++] = j; }
    }
  }
}
function mnfCutBg(src, tol, auto, wand, mask) {
  const W = src.width, H = src.height, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(src, 0, 0);
  const im = g.getImageData(0, 0, W, H), d = im.data, n = W * H, seen = new Uint8Array(n);
  if (mask) for (let i = 0; i < n; i++) d[i * 4 + 3] = d[i * 4 + 3] * mask[i] / 255 + .5 | 0;
  if (auto) {
    // solo arrancan los bordes del color que más se repite (si el pelo toca arriba, no se lo come)
    const border = []; for (let x = 0; x < W; x++) border.push(x); for (let y = 1; y < Math.round(H * .6); y++) border.push(y * W, y * W + W - 1);
    const med = k => { const v = border.map(i => d[i * 4 + k]).sort((a, b) => a - b); return v[v.length >> 1]; }, mr = med(0), mg = med(1), mb = med(2);
    mnfFill(d, W, H, seen, border.filter(i => Math.abs(d[i * 4] - mr) + Math.abs(d[i * 4 + 1] - mg) + Math.abs(d[i * 4 + 2] - mb) <= tol * 2), tol);
  }
  for (const [x, y, t] of wand || []) if (x >= 0 && y >= 0 && x < W && y < H) mnfFill(d, W, H, seen, [y * W + x], t);
  for (let i = 0; i < n; i++) if (seen[i] === 1) d[i * 4 + 3] = 0;
  // borde suave: medio transparente lo que toca lo borrado
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (seen[i]) continue; const k = (seen[i - 1] ? 1 : 0) + (seen[i + 1] ? 1 : 0) + (seen[i - W] ? 1 : 0) + (seen[i + W] ? 1 : 0); if (k) d[i * 4 + 3] = Math.min(d[i * 4 + 3], 255 - k * 40); }
  g.putImageData(im, 0, 0); return c;
}
function mnfApplyBg() {
  const color = MNF.bg === 'color', mask = MNF.bg === 'ai' && MNF.mask && MNF.maskFor === MNF.img ? MNF.mask : null;
  MNF.src = color || mask || MNF.wand.length ? mnfCutBg(MNF.img, MNF.tol, color, MNF.wand, mask) : MNF.img;
}
// ---- quitar el fondo con IA: MODNet (recorte de retratos, licencia Apache 2.0) con transformers.js, todo en la compu ----
// El modelo (unos 7 MB) se descarga la primera vez que se usa y el navegador lo guarda; la foto no sale de la compu.
const MNF_TFJS = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js', MNF_MODEL = 'Xenova/modnet';
const MNF_AI = { lib: null, model: null, proc: null };
async function mnfAiMask(img, onProg) {
  if (!MNF_AI.model) {
    const T = MNF_AI.lib || (MNF_AI.lib = await import(MNF_TFJS)), files = {};
    const prog = e => { if (e && e.status === 'progress' && e.total) { files[e.file] = [e.loaded, e.total]; let a = 0, b = 0; for (const [l, t] of Object.values(files)) { a += l; b += t; } onProg && onProg(a / b); } };
    MNF_AI.model = await T.AutoModel.from_pretrained(MNF_MODEL, { dtype: 'q8', device: 'wasm', progress_callback: prog });
    MNF_AI.proc = await T.AutoProcessor.from_pretrained(MNF_MODEL);
  }
  const T = MNF_AI.lib, W = img.width, H = img.height, image = T.RawImage.fromCanvas(img);
  const { pixel_values } = await MNF_AI.proc(image), { output } = await MNF_AI.model({ input: pixel_values });
  const m = await T.RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(W, H), out = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = m.data[i * m.channels];
  return out;
}
async function mnfRunAi() {
  const img = MNF.img; if (!img) return;
  MNF.aiBusy = true; MNF.aiProg = 0; MNF.aiErr = ''; mnfPaint();
  try {
    const mask = await mnfAiMask(img, p => { MNF.aiProg = p; const b = document.querySelector('#mnfCard .mfai b'); if (b) b.style.width = Math.round(p * 100) + '%'; });
    if (MNF.img === img) { MNF.mask = mask; MNF.maskFor = img; MNF.bg = 'ai'; mnfApplyBg(); mnfAuto(); }
  } catch (e) {
    MNF.aiErr = 'No se pudo usar la IA (' + (e && e.message || e) + '). Hace falta internet la primera vez. Mientras tanto quité el fondo por color.';
    if (MNF.img === img && MNF.bg === 'ai') { MNF.bg = 'color'; mnfApplyBg(); mnfAuto(); }
  }
  MNF.aiBusy = false; mnfPaint();
}
// clic con la varita: el punto de la vista previa pasa a píxel de la imagen
function mnfWandAt(fx, fy) {
  const W = MNF.img.width, x = Math.floor((fx - MNF.x) / MNF.s * W), y = Math.floor((fy - MNF.y) / MNF.s * W);
  if (x < 0 || y < 0 || x >= W || y >= MNF.img.height) return false;
  MNF.wand.push([x, y, MNF.tol]); mnfApplyBg(); return true;
}
// encuadre automático: busca la cabeza (lo visible arriba de todo) y la lleva a la guía
function mnfAuto() {
  const c = MNF.src; if (!c) return; const W = c.width, H = c.height;
  const cover = () => { MNF.s = Math.max(1, W / H); MNF.x = (1 - MNF.s) / 2; MNF.y = 0; };
  if (MNF.bg === 'off' && !MNF.alpha && !MNF.wand.length) return cover();
  const d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data, row = y => { let l = -1, r = -1; for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 128) { if (l < 0) l = x; r = x; } return [l, r]; };
  let top = -1, x0 = W, x1 = -1;
  for (let y = 0; y < H; y++) { const [l, r] = row(y); if (r - l > 2) { if (top < 0) top = y; if (l < x0) x0 = l; if (r > x1) x1 = r; } }
  if (top < 0 || x1 - x0 < 8) return cover();
  const bw = x1 - x0, ws = [], cs = [];
  for (let y = Math.round(top + bw * .15); y < Math.min(H, top + bw * .4); y++) { const [l, r] = row(y); if (r - l > 2) { ws.push(r - l); cs.push((l + r) / 2); } }
  if (!ws.length) return cover();
  const med = a => a.slice().sort((p, q) => p - q)[a.length >> 1], hw = med(ws), cx = med(cs);
  MNF.s = Math.max(.1, Math.min(8, MNF_HEAD.w * W / hw)); MNF.x = .5 - cx / W * MNF.s; MNF.y = MNF_HEAD.top - top / W * MNF.s;
}
async function mnfFile(file) {
  if (!file) return;
  if (!/^image\/(png|jpeg|webp)$/.test(file.type) && !/\.(png|jpe?g|webp)$/i.test(file.name)) { MNF.err = 'Elegí una imagen PNG o JPG.'; return; }
  MNF.err = ''; MNF.msg = ''; MNF.done = false;
  try {
    const bmp = await createImageBitmap(file); MNF.img = mnfShrink(bmp, 2048); bmp.close && bmp.close();
    MNF.file = file.name; MNF.alpha = mnfHasAlpha(MNF.img); MNF.wand = []; MNF.mask = null; MNF.bg = MNF.alpha ? 'off' : 'ai'; mnfApplyBg(); mnfAuto();
    if (MNF.bg === 'ai') setTimeout(mnfRunAi, 0);
  } catch (e) { MNF.err = 'No se pudo leer ' + file.name + ': ' + e.message; }
}
// el cuadro final (N×N) con la imagen donde la dejaste
function mnfRender(N) {
  const c = document.createElement('canvas'); c.width = N; c.height = N; if (!MNF.src) return c;
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
  let s = MNF.src; const dw = MNF.s * N, dh = dw * s.height / s.width;
  while (s.width / 2 >= dw && s.width > 2) { const t = document.createElement('canvas'); t.width = Math.round(s.width / 2); t.height = Math.round(s.height / 2); const tg = t.getContext('2d'); tg.imageSmoothingQuality = 'high'; tg.drawImage(s, 0, 0, t.width, t.height); s = t; }
  g.drawImage(s, MNF.x * N, MNF.y * N, dw, dh); return c;
}
async function mnfBuild() {
  const N = MNF.size, c = mnfRender(N), px = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, N, N).data;
  const blocks = await FTEXW.encodeDxt3(px, N, N, p => { MNF.prog = p; const b = document.querySelector('#mnfCard .mfprog b'); if (b) b.style.width = Math.round(p * 100) + '%'; });
  return { dds: FTEXW.ddsFile(blocks, N, N), small: mnfRender(128).toDataURL('image/webp', .85) };
}

// ---- guardar ----
// dónde guardar: la carpeta propia del editor, que se agrega primera en sider.ini. Si sider.ini no se puede leer o
// escribir (Chrome esconde los .ini, o no hay permiso), va a una carpeta que Sider ya lee: si no, el juego no la vería.
const MNF_WHERE_LS = 'edit21-minifaces-where-v1';
const mnfWhere = () => { try { return JSON.parse(localStorage.getItem(MNF_WHERE_LS) || '{}'); } catch { return {}; } };
const mnfWhereSet = (pid, root) => { const w = mnfWhere(); if (root) w[pid] = root; else delete w[pid]; try { localStorage.setItem(MNF_WHERE_LS, JSON.stringify(w)); } catch { } };
async function mnfPlayerDir(root, create) { let d = root; for (const seg of MNF_DIR.split('/')) d = create ? await d.getDirectoryHandle(seg, { create: true }) : await subDir(d, seg); return d; }
async function mnfRootDir(sider, name, create) { const live = await sider.getDirectoryHandle('livecpk', create ? { create: true } : undefined); return create ? live.getDirectoryHandle(name, { create: true }) : subDir(live, name); }
async function mnfTarget(sider, pid) {
  let ini = null, iniErr = ''; try { ini = typeof siReadIni === 'function' ? await siReadIni(sider) : await readText(sider, 'sider.ini'); } catch { }
  const order = []; for (const m of (ini || '').matchAll(/^\s*cpk\.root\s*=\s*"?([^"\r\n;]+)"?/gim)) { const k = m[1].trim().replace(/\\/g, '/').match(/(?:^|\/)livecpk\/([^/]+)\/?$/i); if (k) order.push(k[1]); }
  if (order.some(n => n.toLowerCase() === MNF_ROOT.toLowerCase())) return { name: MNF_ROOT };
  if (ini != null) { try { await crestIniAdd(sider, MNF_ROOT, 'minifaces propias'); return { name: MNF_ROOT, iniAdded: true }; } catch (e) { iniErr = e.message; } }
  else iniErr = 'el navegador no deja leer sider.ini';
  let live = null; try { live = await sider.getDirectoryHandle('livecpk'); } catch { }
  const dirs = []; if (live) for await (const [n, h] of live.entries()) if (h.kind === 'directory' && n.toLowerCase() !== MNF_ROOT.toLowerCase()) dirs.push([n, h]);
  // sider.ini se pudo leer: la primera carpeta de la lista (es la que manda)
  for (const n of order) { const d = dirs.find(([x]) => x.toLowerCase() === n.toLowerCase()); if (d) return { name: d[0], iniErr, listed: true }; }
  // no se pudo leer: la carpeta que ya tiene minifaces (la de este jugador, o la que tiene más)
  let best = null;
  for (const [n, h] of dirs) {
    let pl; try { pl = await mnfPlayerDir(h, false); } catch { continue; }
    let c = 0, mine = false; for await (const [f, fh] of pl.entries()) if (fh.kind === 'file' && /^\d+\.dds$/i.test(f)) { c++; if (f.toLowerCase() === pid + '.dds') mine = true; }
    if (mine) return { name: n, iniErr, listed: true };
    if (c && (!best || c > best.c)) best = { name: n, c };
  }
  if (best) return { name: best.name, iniErr, listed: true };
  return { name: MNF_ROOT, iniErr };
}
async function mnfSave() {
  const pid = MNF.pid; MNF.busy = true; MNF.err = ''; MNF.msg = ''; MNF.done = false; MNF.prog = 0; mnfPaint();
  try {
    const sider = await crestSider(true), { dds, small } = await mnfBuild(), tg = await mnfTarget(sider, pid), dir = await mnfPlayerDir(await mnfRootDir(sider, tg.name, true), true), name = pid + '.dds';
    let old = null, backed = false; try { old = await dir.getFileHandle(name); } catch { }
    // copia de lo que había, salvo que sea una miniface que ya hizo el editor
    if (old && mnfWhere()[pid] !== tg.name) { let bak = null; try { bak = await dir.getFileHandle(name + '.bak-edit21'); } catch { } if (!bak) { const b = await dir.getFileHandle(name + '.bak-edit21', { create: true }), w = await b.createWritable(); await w.write(await old.getFile()); await w.close(); backed = true; } }
    const fh = await dir.getFileHandle(name, { create: true }), w = await fh.createWritable(); await w.write(dds); await w.close();
    mnfWhereSet(pid, tg.name);
    // el editor la muestra enseguida
    FACES.idx.set(pid, fh); FACES.url.set(pid, small); FACES.err.delete(pid); FACES.loading.delete(pid); FACES.count = FACES.idx.size; paintFace(pid, small);
    MNF.own = true; MNF.done = true;
    MNF.msg = `Listo: guardé <b>${name}</b> (${MNF.size}×${MNF.size}, DXT3) en livecpk\\${esc(tg.name)}\\common\\render\\symbol\\player${backed ? ' (la anterior quedó como .bak-edit21)' : ''}. Abrí el juego de nuevo para verla.`
      + (tg.iniAdded ? ` <span>Agregué la carpeta ${MNF_ROOT} a sider.ini, primera en la lista para que mande (copia en sider.ini.bak-pes-editor).</span>` : '')
      + (tg.iniErr && tg.listed ? ` <span>No pude agregar mi carpeta a sider.ini (${esc(tg.iniErr)}), así que la guardé en ${esc(tg.name)}, que Sider ya lee.</span>` : '')
      + (tg.iniErr && !tg.listed ? ` <span>Ojo: no pude agregar la carpeta a sider.ini (${esc(tg.iniErr)}). Para que el juego la vea, agregá en sider.ini, antes de las otras, la línea cpk.root = ".\\livecpk\\${MNF_ROOT}".</span>` : '');
    if (tg.iniErr && !tg.listed) MNF.done = false;
    toast('Miniface de ' + (playerName(pid) || 'ID ' + pid) + ' guardada.');
  } catch (e) { MNF.err = e.message; }
  MNF.busy = false; mnfPaint();
}
async function mnfDownload() {
  MNF.busy = true; MNF.err = ''; MNF.prog = 0; mnfPaint();
  try { const { dds } = await mnfBuild(), a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([dds], { type: 'image/vnd-ms.dds' })); a.download = MNF.pid + '.dds'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
  catch (e) { MNF.err = e.message; }
  MNF.busy = false; mnfPaint();
}
// borra la miniface que hizo el editor (si había una anterior en esa carpeta, vuelve esa)
async function mnfDelete() {
  const pid = MNF.pid, name = pid + '.dds';
  try {
    const sider = await crestSider(true), dir = await mnfPlayerDir(await mnfRootDir(sider, mnfWhere()[pid] || MNF_ROOT, false), false);
    let bak = null; try { bak = await dir.getFileHandle(name + '.bak-edit21'); } catch { }
    if (bak) { const fh = await dir.getFileHandle(name, { create: true }), w = await fh.createWritable(); await w.write(await bak.getFile()); await w.close(); await dir.removeEntry(name + '.bak-edit21'); }
    else await dir.removeEntry(name);
    MNF.own = false; mnfWhereSet(pid, null); MNF.msg = bak ? 'Volvió la miniface que había antes.' : 'Borré la miniface que hizo el editor. El juego vuelve a usar la que tenía.'; MNF.done = true;
    FACES.url.delete(pid); await indexFaces(sider); toast('Miniface borrada.'); if (typeof render === 'function') render(); else mnfPaint();
  } catch (e) { MNF.err = e.message; mnfPaint(); }
}
async function mnfOwnCheck(pid) {
  try { const h = await idbGet('sider'); if (!h || (await h.queryPermission({ mode: 'read' })) !== 'granted') return; const d = await mnfPlayerDir(await mnfRootDir(h, mnfWhere()[pid] || MNF_ROOT, false), false); await d.getFileHandle(pid + '.dds'); if (MNF.pid === pid) { MNF.own = true; mnfPaint(); } }
  catch { if (MNF.pid === pid && MNF.own == null) MNF.own = false; }
}

// ---- pantalla (Jugadores: en Apariencia, y en la ficha de los jugadores del juego) ----
const MNF_GUIDE = `<svg class="mfguide" viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="${(MNF_HEAD.top + MNF_HEAD.chin) * 50}" rx="${MNF_HEAD.w * 50}" ry="${(MNF_HEAD.chin - MNF_HEAD.top) * 50}"/><line x1="30" x2="70" y1="${MNF_HEAD.chin * 100}" y2="${MNF_HEAD.chin * 100}"/></svg>`;
function mnfCard(pid, kit) {
  if (MNF.pid !== pid) { mnfReset(pid); mnfOwnCheck(pid); }
  if (kit !== undefined) MNF.kit = kit;
  setTimeout(mnfDraw, 0);
  const has = !!MNF.src, zoom = Math.round(MNF.s * 100);
  return `<div class="card mfcard" id="mnfCard" data-pid="${pid}"><h3>🙂 Miniface</h3>
    <div class="mfrow">
      <div class="mfbox"><span class="lab">Ahora</span><div class="mfnow">${faceHtml(pid, MNF.kit, 'pl')}</div></div>
      <div class="mfbox"><span class="lab">Nueva</span><div class="mfstage${has ? '' : ' empty'}${MNF.wandOn ? ' wand' : ''}" id="mnfStage" title="${has ? (MNF.wandOn ? 'Tocá el fondo para borrarlo' : 'Arrastrá para mover, rueda del mouse para acercar') : 'Elegir imagen'}">${has ? `<canvas id="mnfCv" width="480" height="480"></canvas>${MNF.guide ? MNF_GUIDE : ''}` : '<span>Soltá acá un PNG o JPG<br>o tocá Elegir</span>'}</div></div>
      <div class="mfinfo">
        <p class="note" style="margin:0">Subí una foto PNG o JPG del jugador. El editor la deja cuadrada con fondo transparente, la convierte en <b>${pid}.dds</b> (DXT3, el formato de las minifaces del juego) y la guarda en la carpeta de Sider.</p>
        <div class="row"><button class="btn small" type="button" id="mnfPick">📁 Elegir imagen</button>${has ? '<button class="btn small" type="button" id="mnfAuto" title="Lleva la cabeza a la guía">🎯 Encuadrar solo</button><button class="btn small ghost" type="button" id="mnfClear">✕ Quitar</button>' : ''}</div>
        ${has ? `<label class="mfline"><span>Zoom</span><input type="range" id="mnfZoom" min="20" max="400" value="${Math.max(20, Math.min(400, zoom))}" aria-label="Zoom"></label>
        <div class="mfline"><span>Fondo</span><div class="seg" id="mnfBgSeg">${[['ai', '✨ Quitar con IA'], ['color', 'Por color'], ['off', 'Dejarlo']].map(([k, n]) => `<button type="button" data-bg="${k}" aria-pressed="${MNF.bg === k}" ${MNF.aiBusy ? 'disabled' : ''}>${n}</button>`).join('')}</div></div>
        ${MNF.aiBusy ? `<div class="mfprog mfai" role="progressbar" aria-label="Quitando el fondo"><b style="width:${Math.round(MNF.aiProg * 100)}%"></b></div><p class="note" style="margin:0">Quitando el fondo con IA…${MNF_AI.model ? '' : ' La primera vez descarga el modelo (unos 7 MB).'}</p>` : ''}
        ${MNF.aiErr ? `<p class="note warn" style="margin:0">${esc(MNF.aiErr)}</p>` : ''}
        <div class="row"><button class="btn small${MNF.wandOn ? ' primary' : ''}" type="button" id="mnfWand" aria-pressed="${MNF.wandOn}">🪄 Borrar fondo con un clic</button>${MNF.wand.length ? `<button class="btn small ghost" type="button" id="mnfUndo">↶ Deshacer (${MNF.wand.length})</button>` : ''}</div>
        ${MNF.wandOn ? '<p class="note" style="margin:0">Tocá en la imagen la parte del fondo que querés borrar. Si borra de más, deshacé y bajá la tolerancia; si borra poco, subila.</p>' : ''}
        <label class="mfline"><span>Tolerancia</span><input type="range" id="mnfTol" min="10" max="120" value="${MNF.tol}" aria-label="Tolerancia del fondo"></label>
        <label class="chk"><input type="checkbox" id="mnfGuide" ${MNF.guide ? 'checked' : ''}> Ver la guía de la cabeza</label>` : ''}
        <label class="mfline"><span>Tamaño</span><select id="mnfSize" aria-label="Tamaño de la miniface">${MNF_SIZES.map(s => `<option value="${s}" ${s === MNF.size ? 'selected' : ''}>${s}×${s}${s === 2048 ? ' (recomendado)' : ''}</option>`).join('')}</select></label>
        <div class="row"><button class="btn small primary" type="button" id="mnfSave" ${has && !MNF.busy ? '' : 'disabled'}>${MNF.busy ? 'Armando el DDS…' : '💾 Guardar en el juego'}</button><button class="btn small" type="button" id="mnfDl" ${has && !MNF.busy ? '' : 'disabled'}>⬇ Descargar .dds</button></div>
        ${MNF.busy ? `<div class="mfprog" role="progressbar" aria-label="Armando el DDS"><b style="width:${Math.round(MNF.prog * 100)}%"></b></div>` : ''}
        ${MNF.err ? `<p class="note bad" role="alert">${esc(MNF.err)}</p>` : ''}${MNF.msg ? `<p class="note ${MNF.done ? 'ok' : ''}" role="status">${MNF.msg}</p>` : ''}
        ${MNF.own ? `<p class="note">Este jugador tiene una miniface hecha con el editor. <button class="btn small ghost" type="button" id="mnfDel">🗑 Borrarla</button></p>` : ''}
      </div>
    </div>
    <details class="crestfiles"><summary>Dónde y cómo se guarda</summary><p class="note">En <code>livecpk\\${MNF_ROOT}\\common\\render\\symbol\\player\\${pid}.dds</code>. Es una carpeta del editor que va primera en sider.ini, así su miniface manda; las minifaces que ya tenés en otras carpetas no se tocan. Si sider.ini no se puede leer o cambiar (por ejemplo, Chrome no deja tocar los .ini), se guarda en una carpeta que Sider ya lee, con copia de lo que hubiera. Formato DXT3 (BC2) sin mips, con transparencia. Si ya había una del editor, la primera vez queda una copia <code>.bak-edit21</code>. Abrí el juego de nuevo para verla.</p></div>
  </div>`;
}
function mnfDraw() {
  const cv = document.getElementById('mnfCv'); if (!cv || !MNF.src) return;
  const g = cv.getContext('2d'), N = cv.width; g.clearRect(0, 0, N, N); g.imageSmoothingQuality = 'high';
  g.drawImage(MNF.src, MNF.x * N, MNF.y * N, MNF.s * N, MNF.s * N * MNF.src.height / MNF.src.width);
}
function mnfPaint() { const el = document.getElementById('mnfCard'); if (!el || +el.dataset.pid !== MNF.pid) return; el.outerHTML = mnfCard(MNF.pid); }
function mnfZoomAt(ns, cx, cy) { ns = Math.max(.2, Math.min(4, ns)); MNF.x = cx - (cx - MNF.x) * ns / MNF.s; MNF.y = cy - (cy - MNF.y) * ns / MNF.s; MNF.s = ns; mnfDraw(); const z = document.getElementById('mnfZoom'); if (z) z.value = Math.round(ns * 100); }
function mnfPick() { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg'; inp.onchange = async () => { await mnfFile(inp.files[0]); mnfPaint(); }; inp.click(); }
// los eventos se escuchan una sola vez en la página: la tarjeta se vuelve a dibujar seguido
if (typeof document !== 'undefined' && document.addEventListener) {
  const inCard = e => e.target.closest && e.target.closest('#mnfCard');
  let tolT = 0, drag = null;
  document.addEventListener('click', e => {
    if (!inCard(e)) return; const id = e.target.closest('[id]') && e.target.closest('[id]').id;
    const bgb = e.target.closest('[data-bg]');
    if (bgb) { MNF.bg = bgb.dataset.bg; MNF.aiErr = ''; if (MNF.bg === 'ai' && MNF.maskFor !== MNF.img) mnfRunAi(); else { mnfApplyBg(); mnfPaint(); } return; }
    if (id === 'mnfPick' || (id === 'mnfStage' && !MNF.src)) mnfPick();
    else if (id === 'mnfAuto') { mnfAuto(); mnfPaint(); }
    else if (id === 'mnfClear') { const pid = MNF.pid, own = MNF.own; mnfReset(pid); MNF.own = own; mnfPaint(); }
    else if (id === 'mnfWand') { MNF.wandOn = !MNF.wandOn; mnfPaint(); }
    else if (id === 'mnfUndo') { MNF.wand.pop(); mnfApplyBg(); mnfPaint(); }
    else if (id === 'mnfSave') mnfSave();
    else if (id === 'mnfDl') mnfDownload();
    else if (id === 'mnfDel') mnfDelete();
  });
  document.addEventListener('input', e => {
    if (!inCard(e)) return;
    if (e.target.id === 'mnfZoom') mnfZoomAt(e.target.value / 100, .5, .5);
    if (e.target.id === 'mnfTol') { MNF.tol = +e.target.value; clearTimeout(tolT); tolT = setTimeout(() => { mnfApplyBg(); mnfDraw(); }, 150); }
  });
  document.addEventListener('change', e => {
    if (!inCard(e)) return;
    if (e.target.id === 'mnfGuide') { MNF.guide = e.target.checked; mnfPrefs(); mnfPaint(); }
    if (e.target.id === 'mnfSize') { MNF.size = +e.target.value; mnfPrefs(); }
  });
  document.addEventListener('pointerdown', e => {
    const st = e.target.closest && e.target.closest('#mnfStage'); if (!st || !MNF.src) return;
    e.preventDefault(); const r = st.getBoundingClientRect(); drag = { x: e.clientX, y: e.clientY, w: r.width, h: r.height, ox: MNF.x, oy: MNF.y };
    try { st.setPointerCapture(e.pointerId); } catch { }
  });
  document.addEventListener('pointermove', e => { if (!drag) return; MNF.x = drag.ox + (e.clientX - drag.x) / drag.w; MNF.y = drag.oy + (e.clientY - drag.y) / drag.h; mnfDraw(); });
  document.addEventListener('pointerup', e => {
    const d = drag; drag = null; if (!d || !MNF.wandOn || Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 4) return;
    // con la varita, un toque sin arrastrar borra el fondo en ese lugar (y la imagen vuelve a su lugar si se movió apenas)
    MNF.x = d.ox; MNF.y = d.oy; const st = document.getElementById('mnfStage'), r = st && st.getBoundingClientRect();
    if (r && mnfWandAt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)) mnfPaint(); else mnfDraw();
  });
  document.addEventListener('wheel', e => {
    const st = e.target.closest && e.target.closest('#mnfStage'); if (!st || !MNF.src) return;
    e.preventDefault(); const r = st.getBoundingClientRect(); mnfZoomAt(MNF.s * (e.deltaY < 0 ? 1.06 : 1 / 1.06), (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  }, { passive: false });
  document.addEventListener('dragover', e => { const c = inCard(e); if (!c) return; e.preventDefault(); c.classList.add('drag'); });
  document.addEventListener('dragleave', e => { const c = inCard(e); if (c && !c.contains(e.relatedTarget)) c.classList.remove('drag'); });
  document.addEventListener('drop', async e => { const c = inCard(e); if (!c) return; e.preventDefault(); e.stopPropagation(); c.classList.remove('drag'); await mnfFile(e.dataTransfer.files[0]); mnfPaint(); }, true);
}
