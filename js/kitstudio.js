// ===================== Kit Studio Pro (kit-server config.txt + texturas) =====================
// Lee y escribe content\kit-server\<ruta>\<kit>\config.txt, order.ini y gk_order.ini del juego,
// y muestra la textura del kit (.ftex del juego o .dds) con una maqueta aproximada.
const KS = { mode: 'list', team: null, kits: [], gk: [], sel: null, cfg: null, dirty: false, view: '3d', T: {}, sample: { name: 'JUGADOR', num: '10' }, mat: { fabric: 'malla', repeat: 48, fabricStrength: .5, emboss: .5 }, busy: false, err: '', tex: new Map(), texIdx: null, sync: true, side: 'front' };

// ---- FTEX (Fox Engine texture): header 64 bytes + mip table (16 bytes each) + zlib chunks ----
async function ftexDecode(buf, max = 1024) {
  const b = new Uint8Array(buf), dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (dv.getUint32(0, true) !== 0x58455446) throw new Error('No es una textura FTEX');
  const fmt = dv.getUint16(8, true), W = dv.getUint16(10, true), H = dv.getUint16(12, true), mips = b[16];
  const kind = { 0: 0, 2: 1, 3: 3, 4: 5, 11: 7 }[fmt];
  if (kind === undefined) throw new Error(`Formato FTEX ${fmt} desconocido: la vista previa todavía no lo soporta.`);
  const ents = []; for (let i = 0; i < mips; i++) { const o = 0x40 + i * 16; ents.push({ off: dv.getUint32(o, true), unc: dv.getUint32(o + 4, true), cmp: dv.getUint32(o + 8, true), lvl: b[o + 12], fx: b[o + 13], chunks: dv.getUint16(o + 14, true) }); }
  let e = ents.filter(x => (W >> x.lvl) <= max && x.fx === 0).sort((a, c) => a.lvl - c.lvl)[0] || ents[ents.length - 1];
  const out = new Uint8Array(e.unc); let p = 0;
  for (let k = 0; k < e.chunks; k++) {
    const o = e.off + k * 8, cs = dv.getUint16(o, true), us = dv.getUint16(o + 2, true) || 65536, dof = dv.getUint32(o + 4, true);
    const start = e.off + (dof & 0x7fffffff), rawc = b.subarray(start, start + cs);
    let d;
    if ((dof & 0x80000000) || cs === us) d = rawc;
    else d = new Uint8Array(await new Response(new Blob([rawc]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
    out.set(d.subarray(0, Math.min(d.length, out.length - p)), p); p += d.length;
  }
  return DDS.raw(out, 0, Math.max(1, W >> e.lvl), Math.max(1, H >> e.lvl), kind);
}
function imgToCanvas(img) { const c = document.createElement('canvas'); c.width = img.w; c.height = img.h; c.getContext('2d').putImageData(new ImageData(img.data, img.w, img.h), 0, 0); return c; }

// ---- config.txt: keep every line (comments, order, padding) and only replace values ----
function cfgParse(txt) {
  const lines = txt.replace(/^﻿/, '').split(/\r?\n/), fields = []; let section = 'General', pending = null;
  lines.forEach((ln, i) => {
    const m = ln.match(/^(\s*)([A-Za-z][A-Za-z0-9_]*)(\s*=\s*)([^;]*?)(\s*)(;.*)?$/);
    if (m) { if (pending) { section = pending; pending = null; } fields.push({ i, key: m[2], value: m[4], pre: m[1] + m[2] + m[3], gap: m[5], comment: (m[6] || '').replace(/^;\s*/, ''), section }); }
    else { const c = ln.match(/^\s*;\s*(.+?)\s*$/); if (c && !/processed with/i.test(c[1])) pending = c[1]; }
  });
  return { lines, fields, eol: /\r\n/.test(txt) ? '\r\n' : '\n' };
}
function cfgSerialize(cfg) {
  const lines = cfg.lines.slice();
  for (const f of cfg.fields) { const width = f.value.length + f.gap.length; const v = String(f.value); const pad = f.gap ? ' '.repeat(Math.max(1, width - v.length)) : ''; lines[f.i] = f.pre + v + (f.comment ? pad + '; ' + f.comment : ''); }
  return lines.join(cfg.eol);
}
const cfgGet = (cfg, k) => { const f = cfg.fields.find(x => x.key === k); return f ? f.value : null; };
const cfgSet = (cfg, k, v) => { const f = cfg.fields.find(x => x.key === k); if (f && f.value !== String(v)) { f.value = String(v); KS.dirty = true; } };

const KEY_ES = {
  ShortSleevesModel: 'Modelo de manga corta', ShirtModel: 'Modelo de camiseta', Collar: 'Cuello', TightKit: 'Camiseta ajustada', ShirtPattern: 'Patrón de la camiseta', WinterCollar: 'Cuello de invierno', LongSleevesType: 'Manga larga',
  Name: 'Nombre en la espalda', NameShape: 'Forma del nombre', NameY: 'Altura del nombre', NameSize: 'Tamaño del nombre', NameStretch: 'Ancho del nombre',
  BackNumberY: 'Altura del número', BackNumberSize: 'Tamaño del número', BackNumberSpacing: 'Separación de los dígitos', BackNumberType: 'Tipo de número',
  ChestNumberX: 'Número en el pecho: horizontal', ChestNumberY: 'Número en el pecho: vertical', ChestNumberSize: 'Número en el pecho: tamaño',
  ShortsModel: 'Modelo de short', ShortsNumberSide: 'Lado del número en el short', ShortsNumberX: 'Número del short: horizontal', ShortsNumberY: 'Número del short: vertical', ShortsNumberSize: 'Número del short: tamaño',
  KitFile: 'Textura del kit', BackNumbersFile: 'Números de la espalda', ChestNumbersFile: 'Números del pecho', LegNumbersFile: 'Números del short', NameFontFile: 'Letras del nombre',
  ShirtColor1: 'Color principal (radar)', ShirtColor2: 'Color secundario (radar)', UndershirtColor: 'Camiseta interior', ShortsColor: 'Short', SocksColor: 'Medias',
  RightShortX: 'Logo manga corta der.: X', RightShortY: 'Logo manga corta der.: Y', RightLongX: 'Logo manga larga der.: X', RightLongY: 'Logo manga larga der.: Y',
  LeftShortX: 'Logo manga corta izq.: X', LeftShortY: 'Logo manga corta izq.: Y', LeftLongX: 'Logo manga larga izq.: X', LeftLongY: 'Logo manga larga izq.: Y',
  UniColor_Color1: 'Color 1 del menú', UniColor_Color2: 'Color 2 del menú', CaptainArmband: 'Cinta de capitán', Unk_Offset0x1C_Bits0to1: 'Valor sin identificar (0x1C)',
};
const SEC_ES = { 'shirt parameters': 'Camiseta', 'shirt - back side': 'Espalda: nombre y número', 'shirt - front side': 'Pecho', 'shorts parameters': 'Short', 'texture files': 'Archivos de textura', 'kit colors': 'Colores', 'sleeve badge positions': 'Logos de las mangas', 'kit colors from UniColor.bin': 'Colores del menú (UniColor)', 'values added by kserv.lua': 'Otros (kserv)' };
const OPT_ES = { Off: 'No', On: 'Sí', Normal: 'Normal', Straight: 'Recto', 'Light curve': 'Curva suave', 'Medium curve': 'Curva media', 'Extreme curve': 'Curva fuerte', Left: 'Izquierda', Right: 'Derecha', 'Forced two-digit': 'Siempre dos dígitos', 'Normal & Undershirt': 'Normal + camiseta interior', 'Only Undershirt': 'Solo camiseta interior', 'Semi-long short sleeves': 'Manga semilarga', Legacy: 'Clásica', 'Kappa (players)': 'Kappa (ajustada)', 'Normal (players)': 'Normal', 'Referee kits only': 'Solo árbitros' };
function fieldType(f) {
  if (/^#[0-9a-f]{6}$/i.test(f.value.trim())) return { t: 'color' };
  if (/File$/.test(f.key)) return { t: 'text' };
  const rng = f.comment.match(/(-?\d+)\s*to\s*(-?\d+)/);
  const toks = f.comment.replace(/\(.*?\)/g, '').split(',').map(s => s.trim()).filter(Boolean);
  const opts = toks.map(tk => tk.match(/^(-?\d+)\s*(?:=\s*(.+))?$/)).filter(Boolean);
  if (!rng && opts.length >= 2 && opts.length === toks.length) return { t: 'enum', opts: opts.map(o => [o[1], o[2] ? (OPT_ES[o[2].trim()] || o[2].trim()) : o[1]]) };
  if (rng) return { t: 'range', min: +rng[1], max: +rng[2], hint: (f.comment.match(/\((.*)\)/) || [])[1] || '' };
  if (/^-?\d+$/.test(f.value.trim())) return { t: 'num' };
  return { t: 'text' };
}

// ---- files on disk ----
async function ksRoot(write) {
  const h = await idbGet('sider'); if (!h) throw new Error('Primero tocá "Conectar carpeta Sider".');
  const mode = write ? 'readwrite' : 'read';
  if ((await h.queryPermission({ mode })) !== 'granted' && (await h.requestPermission({ mode })) !== 'granted') throw new Error(write ? 'Sin permiso para guardar en la carpeta del juego.' : 'Sin permiso para leer la carpeta del juego.');
  const lay = await siderLayout(h); if (lay && lay.kit) return { sider: h, kit: lay.kit };
  throw new Error('Tu Sider no tiene kit-server (content\\kit-server\\map.txt): los kits de este juego no se pueden editar acá.');
}
async function ksLoad(t) {
  KS.err = ''; KS.busy = true;
  try {
    const k = KITS.map.get(t.id); if (!k || !k.path) throw new Error('Este equipo no tiene kits en el kit-server del juego (o falta conectarlo).');
    const { kit } = await ksRoot(false), dir = await subDir(kit, k.path);
    const ord = lines(await readText(dir, 'order.ini')), gk = lines(await readText(dir, 'gk_order.ini'));
    const all = []; for await (const [name, h] of dir.entries()) if (h.kind === 'directory') all.push(name);
    KS.team = t.id; KS.path = k.path; KS.kits = ord.length ? ord : all.filter(n => /^p/i.test(n)).sort(); KS.gk = gk.length ? gk : all.filter(n => /^g/i.test(n)).sort(); KS.all = all;
    if (!KS.sel || ![...KS.kits, ...KS.gk].includes(KS.sel)) KS.sel = KS.kits[0] || KS.gk[0];
    KS.meta = {}; KS.cfgTxt = {}; KS.thumbs = {}; for (const n of all) { try { const c = await readText(await dir.getDirectoryHandle(n), 'config.txt'); if (c) { KS.meta[n] = parseKitCfg(c, n); KS.cfgTxt[n] = c; } } catch { } }
    await kpsLoad(); await ksOpenKit(KS.sel, dir);
  } catch (e) { KS.err = e.message; }
  KS.busy = false;
}
// texture: first in the kit folder, then in every livecpk uniform texture folder
async function ksTexIndex(sider) {
  if (KS.texIdx) return KS.texIdx; const idx = new Map();
  try { const live = await sider.getDirectoryHandle('livecpk');
    for await (const [, root] of live.entries()) { if (root.kind !== 'directory') continue;
      for (const p of ['Asset/model/character/uniform/texture/#windx11', 'common/character0/model/character/uniform/texture/#windx11', 'common/character0/model/character/uniform/texture']) { try { const d = await subDir(root, p); for await (const [n, h] of d.entries()) if (h.kind === 'file') { const k = n.toLowerCase(); if (!idx.has(k)) idx.set(k, h); } } catch { } } } } catch { }
  return (KS.texIdx = idx);
}
async function ksOpenKit(name, dir) {
  if (!dir) dir = await subDir((await ksRoot(false)).kit, KS.path);
  const txt = await readText(await dir.getDirectoryHandle(name), 'config.txt');
  if (txt == null) throw new Error('El kit ' + name + ' no tiene config.txt.');
  KS.sel = name; KS.cfg = cfgParse(txt); KS.orig = txt; KS.dirty = false; KS.T = {}; KS.dispKey = ''; KS.texLoading = true; KS.gl = null; KS.genNrm = null;
  ksLoadSlots(dir).then(() => { KS.texLoading = false; ksRerender(); });
}
// ---- texturas del kit: cada "casilla" es un archivo que usa el juego ----
const KS_SLOTS = [
  { k: 'kit', n: 'Textura del kit', f: 'KitFile', suf: '', d: 'Colores y dibujos de camiseta, short y medias (y la cinta de capitán).', opaque: true, max: 4096 },
  { k: 'nrm', n: 'Normal map', f: 'KitFile', suf: '_nrm', d: 'El relieve: la trama de la tela y los dibujos en relieve con la luz.', opaque: true, max: 4096, derived: true },
  { k: 'srm', n: 'Brillo (SRM)', f: 'KitFile', suf: '_srm', d: 'Cuánto brilla y qué tan áspera es la tela.', opaque: true, max: 4096, derived: true },
  { k: 'back', n: 'Números de la espalda', f: 'BackNumbersFile', suf: '_back', d: 'Los 10 números (0 a 9) de la espalda.', font: 'back', max: 2048 },
  { k: 'chest', n: 'Números del pecho', f: 'ChestNumbersFile', suf: '_chest', d: 'Número chico adelante. Si queda vacío, el kit no lleva número en el pecho.', font: 'chest', max: 2048 },
  { k: 'leg', n: 'Números del short', f: 'LegNumbersFile', suf: '_leg', d: 'Número del short.', font: 'leg', max: 2048 },
  { k: 'name', n: 'Letras del nombre', f: 'NameFontFile', suf: '_name', d: 'Las letras A a Z y el punto del nombre en la espalda.', font: 'name', max: 2048 },
];
const ksBase = () => (cfgGet(KS.cfg, 'KitFile') || '').trim() || 'u' + String(KS.team).padStart(4, '0') + KS.sel;
function ksSlotFile(s) { const S = typeof s === 'string' ? KS_SLOTS.find(x => x.k === s) : s, v = (cfgGet(KS.cfg, S.f) || '').trim(); return S.derived ? (v ? v + S.suf : '') : v; }
const ksSlotDefault = s => ksBase() + s.suf;
async function ksDecodeTex(h, S) {
  const buf = await (await h.getFile()).arrayBuffer(), n = h.name.toLowerCase();
  let img;
  if (n.endsWith('.ftex')) img = await ftexDecode(buf, S.max);
  else if (n.endsWith('.dds')) img = DDS.decodeSmall(buf, S.max);
  else img = ksShrink(await FTEXW.rawFromImage(new Blob([buf])), S.max);
  if (!S.opaque) return imgToCanvas(img);
  const gl = S.k === 'kit' ? ksAlphaCanvas(img) : null; for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
  const cv = imgToCanvas(img); cv.__gloss = gl; return cv;
}
// el alfa de la textura del kit es el brillo que usa el juego (blanco = brilla más): va a su propio mapa en gris
function ksAlphaCanvas(img) { const c = document.createElement('canvas'); c.width = img.w; c.height = img.h; const g = c.getContext('2d'), im = g.createImageData(img.w, img.h); for (let i = 0; i < im.data.length; i += 4) { im.data[i] = im.data[i + 1] = im.data[i + 2] = img.data[i + 3]; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); return c; }
function ksShrink(img, max) { if (img.w <= max) return { w: img.w, h: img.h, data: new Uint8ClampedArray(img.data) }; const k = max / img.w, w = Math.round(img.w * k), h = Math.round(img.h * k), o = new Uint8ClampedArray(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = (Math.floor(y / k) * img.w + Math.floor(x / k)) * 4, d = (y * w + x) * 4; o[d] = img.data[s]; o[d + 1] = img.data[s + 1]; o[d + 2] = img.data[s + 2]; o[d + 3] = img.data[s + 3]; } return { w, h, data: o }; }
async function ksFindTex(dir, file, kit = KS.sel) {
  const kd = await dir.getDirectoryHandle(kit);
  for (const ext of ['.ftex', '.dds', '.png']) { try { return { h: await kd.getFileHandle(file + ext), where: 'kit' }; } catch { } }
  const idx = await ksTexIndex((await ksRoot(false)).sider);
  for (const ext of ['.ftex', '.dds']) { const h = idx.get((file + ext).toLowerCase()); if (h) return { h, where: 'live' }; }
  return null;
}
async function ksLoadSlots(dir) {
  if (!dir) dir = await subDir((await ksRoot(false)).kit, KS.path);
  await Promise.all(KS_SLOTS.map(async S => {
    const file = ksSlotFile(S); if (!file) { KS.T[S.k] = { none: true }; return; }
    const key = KS.path + '/' + KS.sel + ':' + file; if (KS.tex.has(key)) { KS.T[S.k] = KS.tex.get(key); return; }
    try { const f = await ksFindTex(dir, file); if (!f) { KS.T[S.k] = { missing: true, file }; return; }
      const c = await ksDecodeTex(f.h, S); if (S.k === 'name') await ksKitPosFont(dir, KS.sel, c); KS.T[S.k] = { c, g: c.__gloss || null, file: f.h.name, where: f.where }; KS.tex.set(key, KS.T[S.k]);
    } catch (e) { KS.T[S.k] = { err: e.message, file }; }
  }));
  KS.dispKey = '';
}
const ksTexOf = k => KS.T && KS.T[k] && KS.T[k].c || null;
// fuente de KitPos: si la carpeta del kit tiene kitpos_letras.txt, la textura del nombre se lee con esa tabla (con minúsculas)
async function ksKitPosFont(dir, kit, c) { try { const t = await readText(await dir.getDirectoryHandle(kit), 'kitpos_letras.txt'), list = t ? KPF.parseLetras(t) : []; if (list.length) c.__kp = KPF.glyphMap(list, c.width, c.height); } catch { } }
// escribe una textura en la carpeta del kit (la primera vez guarda copia de la anterior) y actualiza el config si hacía falta
async function ksWriteTex(S, canvas, { bytes, ext = '.ftex', progress } = {}) {
  const { kit } = await ksRoot(true), dir = await subDir(kit, KS.path), kd = await dir.getDirectoryHandle(KS.sel);
  let file = ksSlotFile(S); const wasDirty = KS.dirty;
  if (!file) { file = ksSlotDefault(S); if (S.derived) { if (!(cfgGet(KS.cfg, 'KitFile') || '').trim()) cfgSet(KS.cfg, 'KitFile', ksBase()); } else cfgSet(KS.cfg, S.f, file); }
  if (!bytes) bytes = await FTEXW.fromCanvas(canvas, { dxt5: S.k !== 'srm', progress });
  for (const e of ['.ftex', '.dds', '.png']) { if (e === ext) continue; try { await kd.getFileHandle(file + e); /* otra extensión vieja: se deja, el kitserver prioriza .ftex */ } catch { } }
  try { const old = await kd.getFileHandle(file + ext); try { await kd.getFileHandle(file + ext + '.bak-edit21'); } catch { const bk = await kd.getFileHandle(file + ext + '.bak-edit21', { create: true }), w0 = await bk.createWritable(); await w0.write(await (await old.getFile()).arrayBuffer()); await w0.close(); bakNote(kd); } } catch { }
  const fh = await kd.getFileHandle(file + ext, { create: true }), w = await fh.createWritable(); await w.write(bytes); await w.close();
  const prev = KS.T[S.k] || {}; KS.T[S.k] = { c: canvas || prev.c, g: prev.g, file: file + ext, where: 'kit' };
  KS.tex.set(KS.path + '/' + KS.sel + ':' + file, KS.T[S.k]); KS.dispKey = '';
  // si el config solo cambió para anotar el nombre de esta textura, se guarda ya: así no se pierde al cambiar de kit
  if (!wasDirty && KS.dirty) await ksSave();
  return file + ext;
}
async function ksSave() {
  const { kit } = await ksRoot(true), dir = await subDir(kit, KS.path), kd = await dir.getDirectoryHandle(KS.sel);
  try { await kd.getFileHandle('config.txt.bak-edit21'); } catch { const bk = await kd.getFileHandle('config.txt.bak-edit21', { create: true }), w0 = await bk.createWritable(); await w0.write(KS.orig); await w0.close(); bakNote(kd); }
  const txt = cfgSerialize(KS.cfg), fh = await kd.getFileHandle('config.txt'), w = await fh.createWritable(); await w.write(txt); await w.close();
  KS.orig = txt; KS.dirty = false; KS.meta[KS.sel] = parseKitCfg(txt, KS.sel);
  ksRefreshKitsMap(); return txt;
}
function ksRefreshKitsMap() {
  const k = KITS.map.get(KS.team); if (!k) return;
  k.k = KS.kits.slice(0, 4).map(n => KS.meta[n]).filter(Boolean); k.g = KS.gk.slice(0, 2).map(n => KS.meta[n]).filter(Boolean); kitsSaveCache();
}
async function ksWriteOrder(file, list) {
  const { kit } = await ksRoot(true), dir = await subDir(kit, KS.path);
  const fh = await dir.getFileHandle(file, { create: true }), w = await fh.createWritable(); await w.write(list.join('\r\n') + '\r\n'); await w.close();
}
// copia un kit a uno nuevo; asGk elige si la copia va a la lista de arqueros (por ejemplo, un kit de jugador como base del arquero)
async function ksDuplicate(name, asGk) {
  const { kit } = await ksRoot(true), dir = await subDir(kit, KS.path), gk = asGk === undefined ? /^g/i.test(name) : asGk;
  let n = 1, nn; do nn = (gk ? "g" : "p") + n++; while (KS.all.includes(nn) || KS.kits.includes(nn) || KS.gk.includes(nn));
  const src = await dir.getDirectoryHandle(name), dst = await dir.getDirectoryHandle(nn, { create: true });
  await ksCopyDir(src, dst);
  const list = gk ? KS.gk : KS.kits; list.push(nn); KS.all.push(nn); await ksWriteOrder(gk ? 'gk_order.ini' : 'order.ini', list);
  try { const c = await readText(dst, 'config.txt'); if (c) KS.meta[nn] = parseKitCfg(c, nn); } catch { }
  ksRefreshKitsMap(); return nn;
}
async function ksCopyDir(src, dst) {
  for await (const [fn, h] of src.entries()) { if (h.kind !== 'file' || /\.bak-edit21$/.test(fn)) continue; const f = await h.getFile(), o = await dst.getFileHandle(fn, { create: true }), w = await o.createWritable(); await w.write(await f.arrayBuffer()); await w.close(); }
}
// borra un kit: lo saca de order.ini / gk_order.ini y mueve su carpeta a _borrados (se puede recuperar a mano)
async function ksDelete(name) {
  const { kit } = await ksRoot(true), dir = await subDir(kit, KS.path), gk = KS.gk.includes(name), list = gk ? KS.gk : KS.kits;
  if (!gk && list.length < 2) throw new Error('El equipo necesita al menos un kit de jugador.');
  const trash = await dir.getDirectoryHandle('_borrados', { create: true }); let tn = name, i = 2;
  for (;;) { try { await trash.getDirectoryHandle(tn); tn = name + '-' + i++; } catch { break; } }
  const src = await dir.getDirectoryHandle(name); await ksCopyDir(src, await trash.getDirectoryHandle(tn, { create: true }));
  list.splice(list.indexOf(name), 1); await ksWriteOrder(gk ? 'gk_order.ini' : 'order.ini', list);
  await dir.removeEntry(name, { recursive: true });
  KS.all = KS.all.filter(x => x !== name); delete KS.meta[name];
  for (const k of [...KS.tex.keys()]) if (k.startsWith(KS.path + '/' + name + ':')) KS.tex.delete(k);
  ksRefreshKitsMap(); return tn;
}
let ksRerender = () => { };
// ---- textura que se muestra: la del kit + número, nombre y número del short dibujados con las fuentes del kit ----
// Regiones de la textura (sacadas de los modelos reales): la espalda está girada 180°.
const UVR = { back: [.357, .642, .023, .464], front: [.344, .656, .49, .906] };
const ksN = k => +(cfgGet(KS.cfg, k) || 0);
// ---- KitPos: posición libre, sin pasos (content\kitpos\kitpos_slots.ini, js/kitpos.js) ----
// Los valores se guardan como los usa el juego; en el editor se trabajan en "pasos de kserv" con decimales para
// que la vista previa use las mismas cuentas que con el config.txt.
const KPS = { st: null, for: '', base: null, orig: '', curText: '', cur: null, scope: 'kit' };
const KS_KP = { NameShape: 'NameCurve' }; // campo del config.txt -> campo de KitPos (cuando se llaman distinto)
const kpsVerN = v => { const [a, b] = String(v || '0').split('.').map(Number); return (a || 0) * 100 + (b || 0); };
const kpsDirty = () => !!KPS.cur && KPS.curText !== KPS.orig;
const ksKpOn = () => !!(KPS.st && KPS.st.lua && KPS.st.slots !== 'hidden' && KPS.cur && PREFS.kpFree !== false && KS.cfg);
function kpsKit() { const gk = KS.gk.includes(KS.sel); return { gk, n: gk ? 0 : KS.kits.indexOf(KS.sel) + 1 }; }
function kpsSec(scope = KPS.scope) { const k = kpsKit(); return scope === 'team' && !k.gk ? KPOS.secKey(KS.team) : KPOS.secKey(KS.team, k.n, k.gk); }
function kpsVals() { if (!KPS.cur || !KS.cfg) return {}; const k = kpsKit(); return KPOS.resolve(KPS.cur, KS.team, k.n, k.gk); }
const kpsOwn = scope => (KPS.cur && KPS.cur.secs[kpsSec(scope)]) || {};
// cambia campos de KitPos ({campo: valor o null para quitarlo}); con "todo el equipo" también se saca el valor propio del kit
function kpsSet(vals) {
  let t = KPOS.setValues(KPS.curText, kpsSec(), vals);
  if (KPS.scope === 'team' && !kpsKit().gk) { const own = kpsOwn('kit'), drop = {}; for (const f of Object.keys(vals)) if (f in own) drop[f] = null; if (Object.keys(drop).length) t = KPOS.setValues(t, kpsSec('kit'), drop); }
  KPS.curText = t; KPS.cur = KPOS.parse(t); KS.dispKey = '';
}
const ksSide = () => +(cfgGet(KS.cfg, 'ShortsNumberSide') || 0);
// paso (con decimales) de un campo: el de KitPos si este kit tiene uno, si no el del config.txt
function ksP(k) {
  if (KS.pOver && KS.pOver[k] != null) return KS.pOver[k]; // valor de prueba (para medir cuánto se mueve en pantalla un paso)
  if (ksKpOn()) { const f = KS_KP[k] || k, v = kpsVals()[f]; if (v != null) return KPOS.toSteps(f, v, ksSide()); }
  const n = ksN(k); return k === 'NameStretch' && n === 0 ? 3 : n; // el juego toma NameStretch 0 como 3 (ancho normal)
}
const ksKpSetSteps = (k, s) => { const f = KS_KP[k] || k; kpsSet({ [f]: KPOS.fromSteps(f, s, ksSide()) }); };
// curva del nombre como la usa el juego (1000 / radio) para un paso de NameShape con decimales (negativo = al revés)
const ksCurve = s => KPOS.fromSteps('NameCurve', s);
async function kpsLoad(force) {
  const key = KITS.from + '|' + (KITS.when || 0); if (!force && KPS.st && KPS.for === key) return KPS.st;
  const st = { lua: false, ver: '', old: false, slots: null };
  try {
    const { sider } = await ksRoot(false);
    try { const t = await readText(await sider.getDirectoryHandle('modules'), 'kitpos.lua'); if (t) { st.lua = true; st.ver = (t.match(/version\s*=\s*"([\d.]+)"/) || [])[1] || ''; } } catch { }
    let text = null, blocked = false;
    try { const kd = await subDir(sider, 'content/kitpos'); try { await kd.getFileHandle('kitpos_slots.ini'); } catch (e) { blocked = !!e && e.name === 'TypeError'; } text = await readText(kd, 'kitpos_slots.ini'); } catch { }
    st.slots = text != null ? 'ok' : blocked ? 'hidden' : 'none';
    KPS.base = text; KPS.orig = text ?? KPOS.SEED; KPS.curText = KPS.orig; KPS.cur = KPOS.parse(KPS.orig);
  } catch (e) { st.err = e.message; KPS.cur = null; }
  KPS.for = key; KPS.st = st; KS.dispKey = ''; return st;
}
async function kpsSave() {
  if (!kpsDirty()) return false;
  const { sider } = await ksRoot(true), content = await sider.getDirectoryHandle('content', { create: true }), kd = await content.getDirectoryHandle('kitpos', { create: true });
  if (KPS.base != null) { try { await kd.getFileHandle('kitpos_slots.ini.bak-edit21'); } catch { const b = await kd.getFileHandle('kitpos_slots.ini.bak-edit21', { create: true }), w0 = await b.createWritable(); await w0.write(KPS.base); await w0.close(); } }
  const h = await fsFile(kd, 'kitpos_slots.ini', true), w = await h.createWritable(); await w.write(KPS.curText); await w.close();
  KPS.base = KPS.orig = KPS.curText; KPS.st.slots = 'ok'; return true;
}
// Chrome no deja leer los .ini por nombre: se elige el archivo una vez con el selector y el editor lo recuerda
async function kpsPick() {
  const { sider } = await ksRoot(true), kd = await subDir(sider, 'content/kitpos'); let f;
  try { [f] = await window.showOpenFilePicker({ id: 'kitposini', startIn: kd, types: [{ description: 'kitpos_slots.ini', accept: { 'text/plain': ['.ini'] } }] }); } catch (e) { if (e.name === 'AbortError') return false; throw e; }
  if ((f.name || '').toLowerCase() !== 'kitpos_slots.ini') throw new Error('ese archivo se llama ' + f.name + ': tiene que ser kitpos_slots.ini');
  let r = null; try { r = await kd.resolve(f); } catch { } if (!r || r.length !== 1) throw new Error('ese kitpos_slots.ini no está en content\\kitpos de esta carpeta Sider');
  try { if ((await f.queryPermission({ mode: 'readwrite' })) !== 'granted') await f.requestPermission({ mode: 'readwrite' }); } catch { }
  await fsPin(f); await kpsLoad(true); return true;
}
// instala o actualiza KitPos: modules\kitpos.lua (el que viene con el editor) y sus líneas en sider.ini, con copias
async function kpsInstall() {
  const { sider } = await ksRoot(true), r = { lua: 'ok', ini: 'ok' };
  const res = await fetch('sider/kitpos.lua', { cache: 'no-cache' }); const src = res.ok ? await res.text() : '';
  const ver = (src.match(/local m = \{ version = "([\d.]+)"/) || [])[1]; if (!ver) throw new Error('no se pudo bajar kitpos.lua (¿sin internet?)');
  const mods = await sider.getDirectoryHandle('modules', { create: true }), cur = await readText(mods, 'kitpos.lua'), curV = cur && (cur.match(/version\s*=\s*"([\d.]+)"/) || [])[1];
  if (cur && kpsVerN(curV) > kpsVerN(ver)) r.lua = 'mas-nuevo';
  else if (cur !== src) { if (cur) { const b = await mods.getFileHandle('kitpos.lua.anterior', { create: true }), w0 = await b.createWritable(); await w0.write(cur); await w0.close(); } const h = await mods.getFileHandle('kitpos.lua', { create: true }), w = await h.createWritable(); await w.write(src); await w.close(); r.lua = cur ? 'actualizado' : 'nuevo'; }
  const ini = typeof siReadIni === 'function' ? await siReadIni(sider) : await readText(sider, 'sider.ini');
  if (ini == null) r.ini = 'oculto';
  else { const o = KPOS.siderIni(ini); if (o.changed) { if (!await sdbFile(sider, 'sider.ini.bak-pes-editor')) await sdbWrite(sider, 'sider.ini.bak-pes-editor', ini); await sdbWrite(sider, 'sider.ini', o.text); r.ini = 'agregado'; if (typeof siReset === 'function') siReset(); } }
  const content = await sider.getDirectoryHandle('content', { create: true }); await content.getDirectoryHandle('kitpos', { create: true });
  await kpsLoad(true); return r;
}
// panel de posición libre (lo usan el Editor y Fuentes de Kit Studio Pro)
// botón para elegir (o cambiar) content\kitpos\kitpos_slots.ini a mano: algunos navegadores esconden los .ini
const kpsPickBtn = (cls = '') => { const ok = KPS.st && KPS.st.slots === 'ok';
  return `<button class="btn small ${cls}" type="button" data-kppick title="${ok ? 'Se está usando content\\kitpos\\kitpos_slots.ini de la carpeta Sider. Tocá para elegir el archivo de nuevo.' : 'Elegí content\\kitpos\\kitpos_slots.ini de la carpeta Sider: el editor lo recuerda'}">📄 ${ok ? 'kitpos_slots.ini ✓' : 'Elegir kitpos_slots.ini'}</button>`; };
async function kpsPickRun(rerender) { try { if (await kpsPick()) { toast('kitpos_slots.ini elegido: el editor lo recuerda.'); rerender(); } } catch (e) { toast('No se pudo usar: ' + e.message, 7000); } }
function kposHtml(groups = ['name', 'num', 'chest', 'leg'], o = {}) {
  const st = KPS.st, on = ksKpOn(), gk = KS.cfg && kpsKit().gk;
  if (!st) return '<section class="kpos"><p class="note">Revisando KitPos en la carpeta Sider…</p></section>';
  const head = `<div class="kposh"><h4>📐 Posición libre <small>KitPos</small></h4>
    ${st.lua && st.slots !== 'hidden' ? `<label class="chk"><input type="checkbox" id="kposOn" ${PREFS.kpFree !== false ? 'checked' : ''}> Sin pasos</label>` : ''}
    ${on && !gk ? `<div class="seg" id="kposScope" aria-label="Dónde se guarda">${[['kit', 'Este kit · ' + esc(KS.sel)], ['team', 'Todo el equipo']].map(([v, n]) => `<button type="button" data-v="${v}" aria-pressed="${KPS.scope === v}">${n}</button>`).join('')}</div>` : ''}
    ${on ? `<span class="chip mono" title="Sección de content\\kitpos\\kitpos_slots.ini">[${esc(kpsSec())}]</span>` : ''}
    ${st.lua && st.slots === 'ok' ? kpsPickBtn() : ''}
    ${on && o.save ? `<button class="btn small primary" type="button" id="kposSave" ${kpsDirty() ? '' : 'disabled'} title="Guarda solo la posición en kitpos_slots.ini, sin tocar la textura">💾 Guardar posición</button>` : ''}</div>`;
  let body;
  if (!st.lua) body = `<div class="kposinst"><p>Con <b>KitPos</b> en Sider, el nombre y los números se ubican sin los pasos del juego: altura, tamaño, ancho, separación y arco exactos, también en el pecho y el short.</p><button class="btn primary small" type="button" id="kposInstall">⬇ Instalar KitPos en Sider</button></div>`;
  else if (st.slots === 'hidden') body = `<div class="kposinst"><p>El navegador no deja leer <span class="mono">content\\kitpos\\kitpos_slots.ini</span> por su nombre. Elegilo una vez con el selector y el editor lo recuerda (en la app de Windows no hace falta).</p>${kpsPickBtn('primary')}</div>`;
  else if (!on) body = '<p class="note">Apagado: el nombre y los números se mueven con los pasos del config.txt.</p>';
  else {
    const vals = kpsVals(), own = kpsOwn(), inh = KPS.scope === 'kit' && !gk ? kpsOwn('team') : {};
    const row = f => { const F = KPOS.FIELDS[f], [a, b] = KPOS.range(f), s = F.unit ? (vals[f] || 0) : ksP(F.cfg || f), mine = f in own, from = mine ? '' : f in inh ? 'del equipo' : 'del kit';
      return `<div class="kposr ${mine ? 'own' : ''}" data-f="${f}"><label for="kpos_${f}">${F.n}</label><input type="range" class="k3r" id="kpos_${f}" min="${a}" max="${b}" step="${F.unit ? .5 : .05}" value="${s}" style="--p:${((s - a) / (b - a) * 100).toFixed(1)}%"><input type="number" step="${F.unit ? .5 : .05}" value="${+s.toFixed(2)}" aria-label="${F.n}: valor exacto"><small class="kposv">${kposLabel(f, s)}${from ? ' · ' + from : ''}</small><button type="button" class="kposx" data-reset="${f}" title="Volver al valor ${KPS.scope === 'team' ? 'del config.txt' : 'del config.txt (o del equipo)'}" ${mine ? '' : 'disabled'}>↺</button></div>`; };
    body = `${st.slots === 'none' ? `<div class="kposinst"><p>No se encontró <span class="mono">content\\kitpos\\kitpos_slots.ini</span>. Si ya lo tenés, elegilo (algunos navegadores lo esconden); si no, se crea al guardar.</p>${kpsPickBtn('primary')}</div>` : ''}<div class="kposg">${groups.map(g => `<fieldset><legend>${KPOS.GROUPS[g]}</legend>${Object.keys(KPOS.FIELDS).filter(f => KPOS.FIELDS[f].g === g).map(row).join('')}</fieldset>`).join('')}</div>
      <p class="note">El config.txt solo admite pasos enteros (NameY de 0 a 39, por ejemplo); KitPos los usa con decimales y un poco más allá del rango del juego. ${groups.length > 1 ? 'Arrastrá el nombre o un número en el 3D o en la maqueta y queda exacto. ' : ''}Se guarda en content\\kitpos\\kitpos_slots.ini${KPS.st.slots === 'none' ? ' (se crea al guardar)' : ''}; en el juego, el panel de KitPos en el overlay de Sider lee lo mismo.</p>`;
  }
  return `<section class="kpos ${on ? 'on' : ''}" id="kposBox">${head}${body}</section>`;
}
function kposLabel(f, s) {
  const F = KPOS.FIELDS[f];
  if (F.unit) return (s > 0 ? '+' : '') + (+s.toFixed(1)) + ' px';
  if (/Size$/.test(f) && Math.abs(KPOS.fromSteps(f, s)) < 1e-4) return 'oculto (tamaño 0)';
  if (f === 'NameCurve') { if (Math.abs(s) < .05) return 'recto'; if (s < 0) return 'al revés'; const n = ['recto', 'leve', 'media', 'extrema'], i = Math.min(3, Math.round(s)); return (Math.abs(s - i) < .05 ? '' : '≈ ') + (i ? 'curva ' + n[i] : 'casi recto') + (s > 3.05 ? ' +' : ''); }
  return 'paso ' + (+s.toFixed(2)) + ' de ' + F.max + (s < -.01 || s > F.max + .01 ? ' (fuera del rango del juego)' : '');
}
// enlaza el panel; changed() redibuja la vista previa
function kposBind(root, changed, rerender) {
  const box = root.querySelector('#kposBox'); if (!box) return;
  const sync = () => box.querySelectorAll('.kposr').forEach(r => { const f = r.dataset.f, F = KPOS.FIELDS[f], s = F.unit ? (kpsVals()[f] || 0) : ksP(F.cfg || f), [rg, nb] = r.querySelectorAll('input'), [a, b] = KPOS.range(f), own = f in kpsOwn(), inh = KPS.scope === 'kit' && !kpsKit().gk && f in kpsOwn('team');
    if (document.activeElement !== rg) rg.value = s; rg.style.setProperty('--p', ((s - a) / (b - a) * 100).toFixed(1) + '%'); if (document.activeElement !== nb) nb.value = +s.toFixed(2);
    r.querySelector('.kposv').textContent = kposLabel(f, s) + (own ? '' : inh ? ' · del equipo' : ' · del kit'); r.classList.toggle('own', own); r.querySelector('[data-reset]').disabled = !own; });
  KPS.sync = () => { sync(); const sv = box.querySelector('#kposSave'); if (sv) sv.disabled = !kpsDirty(); };
  const put = (f, s) => { const F = KPOS.FIELDS[f]; if (F.unit) kpsSet({ [f]: s }); else ksKpSetSteps(F.cfg || f, s); KPS.sync(); changed(); };
  box.querySelectorAll('.kposr').forEach(r => { const f = r.dataset.f, [rg, nb] = r.querySelectorAll('input');
    rg.oninput = () => put(f, +rg.value); nb.onchange = () => { const v = parseFloat(String(nb.value).replace(',', '.')); if (isFinite(v)) put(f, v); }; });
  box.querySelectorAll('[data-reset]').forEach(b => b.onclick = () => { kpsSet({ [b.dataset.reset]: null }); KPS.sync(); changed(); });
  const sv = box.querySelector('#kposSave'); if (sv) sv.onclick = async () => { sv.disabled = true; try { await kpsSave(); toast('Posición guardada en content\\kitpos\\kitpos_slots.ini. Abrí el juego de nuevo (o tocá C en el panel de KitPos) para verla.', 7000); } catch (e) { toast('No se pudo guardar: ' + e.message, 7000); } KPS.sync(); };
  const sc = box.querySelector('#kposScope'); if (sc) sc.onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; KPS.scope = b.dataset.v; sc.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); const c = box.querySelector('.kposh .chip'); if (c) c.textContent = '[' + kpsSec() + ']'; KPS.sync(); };
  const on = box.querySelector('#kposOn'); if (on) on.onchange = () => { PREFS.kpFree = on.checked; savePrefs(); KS.dispKey = ''; rerender(); };
  const ins = box.querySelector('#kposInstall'); if (ins) ins.onclick = async () => { ins.disabled = true; try { const r = await kpsInstall();
    toast(r.lua === 'mas-nuevo' ? 'Ya tenías una versión más nueva de KitPos: no se tocó.' : 'KitPos ' + (r.lua === 'actualizado' ? 'actualizado' : 'instalado') + ' en modules\\kitpos.lua' + (r.ini === 'agregado' ? ' y agregado a sider.ini (copia en sider.ini.bak-pes-editor)' : r.ini === 'oculto' ? '. Falta agregar lua.module = "kitpos.lua" en sider.ini (debajo de kserv.lua): hacelo en la pestaña Sider' : '') + '. Abrí el juego de nuevo.', 10000); }
    catch (e) { toast('No se pudo instalar KitPos: ' + e.message, 8000); } rerender(); };
  box.querySelectorAll('[data-kppick]').forEach(b => b.onclick = () => kpsPickRun(rerender));
}
// valor del juego de un campo (el de KitPos si está activo, si no el del config.txt pasado con las fórmulas de kitpos.lua)
const ksF = k => KPOS.fromSteps(KS_KP[k] || k, ksP(k), ksSide());
// Posiciones medidas en el juego con el panel de KitPos abierto (Agustin, 17/10/2026, 46 capturas) y pasadas a la textura con el
// modelo de la camiseta del juego (el mismo del 3D). En la textura: la espalda va de v .464 (cuello) a .023 (abajo), el frente de
// .49 a .906 y el short tiene la pierna a lo ancho.
// - Nombre: el centro de las mayúsculas queda en v = NameY - .008; alto de mayúscula .0166 × NameSize; ancho ∝ NameStretch.
// - Número de la espalda: centro en v = .3146 - .1416 × BackNumberY; alto .117 × BackNumberSize.
// - Pecho: centro en (u, v) = (ChestNumberX, ChestNumberY); alto .031 × ChestNumberSize.
// - Short: centro en (u, v) = (ShortsNumberY, ShortsNumberX); alto .029 × ShortsNumberSize.
const KS_GAME = { nameDv: -.008, nameH: .0166, numA: .3146, numB: .1416, numH: .117, chestDv: 0, chestH: .031, legH: .029 };
const KS_POS = {
  // espalda (y, h: fracción del largo de la espalda desde el cuello; y es el centro)
  name: () => { const [, , v0, v1] = UVR.back, G = KS_GAME, h = G.nameH * ksF('NameSize') / (v1 - v0);
    return { y: (v1 - ksF('NameY') - G.nameDv) / (v1 - v0), h, stretch: 1.2 * ksF('NameStretch'), curve: ksCurve(ksP('NameShape')), spacing: ksKpOn() ? (kpsVals().NameSpacing || 0) / 72 : 0 }; },
  num: () => { const [, , v0, v1] = UVR.back, G = KS_GAME;
    return { y: (v1 - G.numA + G.numB * ksF('BackNumberY')) / (v1 - v0), h: Math.max(.01, G.numH * ksF('BackNumberSize') / (v1 - v0)), spacing: (ksP('BackNumberSpacing') - 7) * .012 }; },
  // frente (x, y: fracción del ancho y del largo del frente; h: fracción del largo)
  chest: () => { const [f0, f1, t0, t1] = UVR.front; return { x: (ksF('ChestNumberX') - f0) / (f1 - f0), y: (ksF('ChestNumberY') + KS_GAME.chestDv - t0) / (t1 - t0), h: KS_GAME.chestH * ksF('ChestNumberSize') / (t1 - t0) }; },
  // short: centro en la textura (u, v) y alto en la textura
  leg: () => ({ u: ksF('ShortsNumberY'), v: ksF('ShortsNumberX'), h: KS_GAME.legH * ksF('ShortsNumberSize') }),
};
// ---- mover nombre y números directo sobre el modelo 3D: la posición tocada se pasa a los valores del config.txt ----
function ksDecalAt(u, v) {
  const D = KS.decals || {}, x = u * 1024, y = v * 1024; let best = null;
  for (const [k, b] of Object.entries(D)) { const pw = b.w * .65 + 10, ph = b.h * .65 + 10; if (Math.abs(x - b.x) <= pw && Math.abs(y - b.y) <= ph && (!best || b.w * b.h < D[best].w * D[best].h)) best = k; }
  return best;
}
// valores del config para que el centro de cada cosa quede en (x, y) de la textura (inversa de KS_POS)
function ksDecalVals(k, x, y) { const out = ksDecalVals0(k, x, y); for (const key of Object.keys(out)) out[key] = ksClampKey(key, out[key]); return out; }
// el rango de cada valor sale del comentario del config.txt (algunos kits traen, por ejemplo, ChestNumberY de 0 a 6)
function ksClampKey(key, v) { const f = KS.cfg && KS.cfg.fields.find(x => x.key === key), ty = f && fieldType(f); return ty && ty.t === 'range' ? Math.max(ty.min, Math.min(ty.max, v)) : v; }
function ksDecalVals0(k, x, y, fine) {
  const S = 1024, cl = fine ? (v, a, b, f) => { const [lo, hi] = KPOS.range(f); return Math.max(lo, Math.min(hi, v)); } : (v, a, b) => Math.max(a, Math.min(b, Math.round(v)));
  // inversa de KS_POS: (x, y) es el centro buscado en la textura (escala S)
  const G = KS_GAME, st = (f, v, a, b) => cl(KPOS.toSteps(f, v, ksSide()), a, b, f), u = x / S, v = y / S;
  if (k === 'name') return { NameY: st('NameY', v - G.nameDv, 0, 39) };
  if (k === 'num') return { BackNumberY: st('BackNumberY', (G.numA - v) / G.numB, 0, 29) };
  if (k === 'chest') return { ChestNumberX: st('ChestNumberX', u, 0, 29), ChestNumberY: st('ChestNumberY', v - G.chestDv, 0, 29) };
  if (k === 'leg') return { ShortsNumberX: st('ShortsNumberX', v, 0, 29), ShortsNumberY: st('ShortsNumberY', u, 0, 29) };
  return {};
}
const KS_DECAL_SIZE = { name: ['NameSize', 20], num: ['BackNumberSize', 28], chest: ['ChestNumberSize', 28], leg: ['ShortsNumberSize', 28] };
const KS_DECAL_N = { name: 'Nombre', num: 'Número de la espalda', chest: 'Número del pecho', leg: 'Número del short' };
function ksFallbackTex(S = 1024) {
  const c = document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d'), col = k => cfgGet(KS.cfg, k) || '#888888';
  g.fillStyle = col('ShirtColor1'); g.fillRect(0, 0, S, S);
  g.fillStyle = col('ShirtColor2'); for (const [u0, u1] of [[.40, .43], [.57, .60]]) g.fillRect(u0 * S, .49 * S, (u1 - u0) * S, .42 * S);
  g.fillStyle = col('SocksColor'); g.fillRect(0, .31 * S, .33 * S, .25 * S); g.fillRect(.67 * S, .31 * S, .33 * S, .25 * S);
  g.fillStyle = col('ShortsColor'); g.fillRect(0, .585 * S, .335 * S, .4 * S); g.fillRect(.665 * S, .585 * S, .335 * S, .4 * S);
  return c;
}
// nombre y números sobre la textura del kit (S×S); only: dibuja uno solo ('name', 'num', 'chest' o 'leg'); D: cajas en escala 1024
function ksDrawDecals(g, S, only, D) {
  const kk = 1024 / S, on = k => !only || only === k, box = (k, x, y, w, h) => { if (D) D[k] = { x: x * kk, y: y * kk, w: Math.max(w * kk, 24), h: Math.max(h * kk, 24) }; };
  const [u0, u1, v0, v1] = UVR.back, bw = (u1 - u0) * S, bh = (v1 - v0) * S;
  g.save(); g.translate(u1 * S, v1 * S); g.rotate(Math.PI); // espalda: girada 180° en la textura
  // la letra genérica ya es ancha: con el ancho normal del juego (NameStretch 3) se dibuja sin estirar
  if (on('name') && cfgGet(KS.cfg, 'Name') !== '1' && KS.sample.name) { const p = KS_POS.name(); KFONT.drawText(g, ksTexOf('name'), 'name', KS.sample.name, bw / 2, p.y * bh, p.h * bh, { stretch: ksGenName() || (ksTexOf('name') || {}).__kp ? p.stretch / 1.2 : p.stretch, curve: p.curve, spacing: p.spacing, generic: ksGenName(), color: ksNameColor() }); box('name', u1 * S - bw / 2, v1 * S - p.y * bh, KS.sample.name.length * p.h * bh * .62 * p.stretch, p.h * bh * 1.2); }
  if (on('num') && KS.sample.num) { const p = KS_POS.num(), n = cfgGet(KS.cfg, 'BackNumberType') === '1' ? KS.sample.num.padStart(2, '0') : KS.sample.num; KFONT.drawText(g, ksTexOf('back'), 'back', n, bw / 2, p.y * bh, p.h * bh, { spacing: p.spacing }); box('num', u1 * S - bw / 2, v1 * S - p.y * bh, n.length * p.h * bh * .62, p.h * bh); }
  g.restore();
  if (on('chest') && kplOn('chest')) { const [f0, f1, t0, t1] = UVR.front, p = KS_POS.chest(); KFONT.drawText(g, ksTexOf('chest') || ksTexOf('back'), ksTexOf('chest') ? 'chest' : 'back', KS.sample.num, (f0 + p.x * (f1 - f0)) * S, (t0 + p.y * (t1 - t0)) * S, p.h * (t1 - t0) * S); box('chest', (f0 + p.x * (f1 - f0)) * S, (t0 + p.y * (t1 - t0)) * S, KS.sample.num.length * p.h * (t1 - t0) * S * .62, p.h * (t1 - t0) * S); }
  if (on('leg') && ksN('ShortsNumberX') < 30 && ksN('ShortsNumberY') < 30 && KS.sample.num) {
    // el short está girado 90° en la textura: lo largo de la pierna va a lo ancho
    const L = cfgGet(KS.cfg, 'ShortsNumberSide') !== '1', M = L ? [.0007, -.0063, .0065, .0007, .944, .865] : [.0008, .0066, -.0066, .001, .053, .862];
    g.save(); g.setTransform(M[0] * S, M[1] * S, M[2] * S, M[3] * S, M[4] * S, M[5] * S);
    // centro medido en el juego (KS_POS.leg, en la textura) pasado a las coordenadas de la pierna
    const P = KS_POS.leg(), det = M[0] * M[3] - M[2] * M[1], pu = P.u - M[4], pv = P.v - M[5], dx = (M[3] * pu - M[2] * pv) / det, dy = (-M[1] * pu + M[0] * pv) / det, hh = P.h / Math.hypot(M[2], M[3]);
    KFONT.drawText(g, ksTexOf('leg') || ksTexOf('back'), ksTexOf('leg') ? 'leg' : 'back', KS.sample.num, dx, dy, hh); g.restore();
    const sc = Math.hypot(M[0], M[1]) * S, side = hh * sc * 1.3; box('leg', (M[0] * dx + M[2] * dy + M[4]) * S, (M[1] * dx + M[3] * dy + M[5]) * S, side, side); KS.legM = M; KS.legL = L;
  }
}
// nombre genérico (letra común del color de los números) en vez de la fuente del kit: la fuente puede no estar o no
// leerse bien (una de KitPos sin su kitpos_letras.txt, por ejemplo). Se elige en el panel Dorsales.
const ksGenName = () => PREFS.ksNameFont !== 'kit' || !ksNameFontOk();
function ksNameFontOk() { const T = ksTexOf('name'); return !!T && (!!T.__kp || Math.abs(T.width / T.height - 4) < .01); } // la del juego es 4096 × 1024
function ksNameColor() {
  const T = ksTexOf('back'); if (!T) return inkFor(cfgGet(KS.cfg, 'ShirtColor1') || '#888888');
  if (T.__ink) return T.__ink; const q = KFONT.glyph(T, 'back', '0'); let r = 0, gg = 0, b = 0, n = 0;
  if (q) { const d = T.getContext('2d', { willReadFrequently: true }).getImageData(q.sx, q.sy, q.sw, q.sh).data; for (let i = 0; i < d.length; i += 16) if (d[i + 3] > 200) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; } }
  return (T.__ink = n ? '#' + [r, gg, b].map(v => Math.round(v / n).toString(16).padStart(2, '0')).join('') : '#ffffff');
}
function ksDisplayTex() {
  const base = ksTexOf('kit'), key = JSON.stringify([KS.sel, ksGenName(), !!base, base && base.width, K3.light.decals, KS.sample, ['NameY', 'NameSize', 'NameStretch', 'NameShape', 'Name', 'BackNumberY', 'BackNumberSize', 'BackNumberSpacing', 'ChestNumberX', 'ChestNumberY', 'ChestNumberSize', 'ShortsNumberSide', 'ShortsNumberX', 'ShortsNumberY', 'ShortsNumberSize', 'BackNumberType', 'ShirtColor1', 'ShirtColor2', 'ShortsColor', 'SocksColor', 'ChestNumbersFile'].map(k => cfgGet(KS.cfg, k)), ['back', 'chest', 'leg', 'name'].map(k => !!ksTexOf(k)), KS.texRev || 0, KS.hot || '', ksKpOn() ? kpsVals() : 0]);
  if (KS.dispKey === key && KS.disp) return KS.disp;
  // la textura se muestra a su resolución completa (hasta 4096); las cajas de nombre y números se guardan en escala 1024
  const S = base ? Math.min(4096, base.width) : 1024, D = KS.decals = {};
  const c = KS.disp && KS.disp.width === S ? KS.disp : document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d');
  g.clearRect(0, 0, S, S); g.drawImage(base || ksFallbackTex(S), 0, 0, S, S);
  if (K3.light.decals !== false) ksDrawDecals(g, S, null, D);
  const hb = KS.hot && D[KS.hot]; if (hb) { const q = S / 1024; g.save(); g.lineWidth = 3 * q; g.setLineDash([10 * q, 6 * q]); g.strokeStyle = '#ffd84a'; g.strokeRect((hb.x - hb.w / 2 - 4) * q, (hb.y - hb.h / 2 - 4) * q, (hb.w + 8) * q, (hb.h + 8) * q); g.restore(); }
  c.__rev = (c.__rev || 0) + 1; KS.disp = c; KS.dispKey = key; return c;
}
const ksMaps = () => ({ nrm: K3.light.nrm === false ? null : (KS.genNrm || ksTexOf('nrm')), srm: KS.genSrm || ksTexOf('srm'), gloss: ksGloss() });
// ---- brillo (alfa del kit): se puede ajustar y pintar sobre el modelo ----
function ksGlossState() {
  const T = KS.T && KS.T.kit; if (!T || !T.c) return null;
  if (!KS.gl) { const base = document.createElement('canvas'), S = 1024; base.width = S; base.height = S; const g = base.getContext('2d', { willReadFrequently: true });
    if (T.g) g.drawImage(T.g, 0, 0, S, S); else { g.fillStyle = '#808080'; g.fillRect(0, 0, S, S); }
    KS.gl = { base, level: 0, contrast: 1, invert: false, rev: 0, undo: [], had: !!T.g, changed: false, dabs: [], replaced: false }; }
  return KS.gl;
}
function ksGloss() {
  const G = ksGlossState(); if (!G) return null;
  const key = [G.rev, G.level, G.contrast, G.invert].join('|'); if (G.out && G.key === key) return G.out;
  const S = G.base.width, o = G.out || document.createElement('canvas'); o.width = S; o.height = S;
  const src = G.base.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, S, S), d = src.data, og = o.getContext('2d'), out = og.createImageData(S, S), od = out.data;
  const lut = new Uint8Array(256); for (let i = 0; i < 256; i++) { let v = i / 255; if (G.invert) v = 1 - v; v = (v - .5) * G.contrast + .5 + G.level; lut[i] = Math.max(0, Math.min(255, Math.round(v * 255))); }
  for (let i = 0; i < d.length; i += 4) { const v = lut[d[i]]; od[i] = od[i + 1] = od[i + 2] = v; od[i + 3] = 255; }
  og.putImageData(out, 0, 0); o.__rev = (o.__rev || 0) + 1; G.out = o; G.key = key; return o;
}
function ksGlossFill(kind) {
  const G = ksGlossState(); if (!G) return; ksGlossPush(); const S = G.base.width, g = G.base.getContext('2d', { willReadFrequently: true });
  if (kind === 'mate' || kind === 'brillo') { g.fillStyle = kind === 'mate' ? '#262626' : '#d9d9d9'; g.fillRect(0, 0, S, S); }
  else if (kind === 'colores') { const t = ksTexOf('kit'), c = document.createElement('canvas'); c.width = S; c.height = S; const cg = c.getContext('2d', { willReadFrequently: true }); cg.drawImage(t, 0, 0, S, S); const im = cg.getImageData(0, 0, S, S), d = im.data; for (let i = 0; i < d.length; i += 4) { const l = d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; d[i] = d[i + 1] = d[i + 2] = 40 + l * .7; } g.putImageData(im, 0, 0); }
  else if (kind === 'original') { const T = KS.T.kit; g.clearRect(0, 0, S, S); if (T.g) g.drawImage(T.g, 0, 0, S, S); else { g.fillStyle = '#808080'; g.fillRect(0, 0, S, S); } G.level = 0; G.contrast = 1; G.invert = false; }
  G.dabs = []; G.replaced = kind !== 'original' || !G.had; G.rev++; G.changed = kind !== 'original';
}
function ksGlossPush() { const G = KS.gl; if (!G) return; const c = document.createElement('canvas'); c.width = G.base.width; c.height = G.base.height; c.getContext('2d').drawImage(G.base, 0, 0); G.undo.push({ c, n: G.dabs.length, r: G.replaced }); if (G.undo.length > 12) G.undo.shift(); }
function ksGlossUndo() { const G = KS.gl; if (!G || !G.undo.length) return false; const u = G.undo.pop(), g = G.base.getContext('2d'); g.clearRect(0, 0, G.base.width, G.base.height); g.drawImage(u.c, 0, 0); G.dabs.length = u.n; G.replaced = u.r; G.rev++; return true; }
function ksGlossPaint(u, v) {
  const G = ksGlossState(); if (!G) return; const B = KS.brush || (KS.brush = { size: 40, value: 85, soft: .6 }), S = G.base.width, g = G.base.getContext('2d');
  ksDab(g, S, { u, v, size: B.size, value: B.value, soft: B.soft }); G.dabs.push({ u, v, size: B.size, value: B.value, soft: B.soft });
  G.rev++; G.changed = true;
}
function ksDab(g, S, d) { const k = S / 1024, x = d.u * S, y = d.v * S, r = d.size * k, val = Math.round(d.value * 2.55), gr = g.createRadialGradient(x, y, r * (1 - d.soft), x, y, r); gr.addColorStop(0, `rgba(${val},${val},${val},.9)`); gr.addColorStop(1, `rgba(${val},${val},${val},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
// guarda el brillo dentro del alfa de la textura del kit, a resolución completa
async function ksGlossSave(progress) {
  const dir = await subDir((await ksRoot(false)).kit, KS.path), file = ksSlotFile('kit'), f = file && await ksFindTex(dir, file); if (!f) throw new Error('No encontré la textura del kit para escribirle el brillo.');
  const buf = await (await f.h.getFile()).arrayBuffer(), n = f.h.name.toLowerCase();
  const img = n.endsWith('.ftex') ? await ftexDecode(buf, 4096) : n.endsWith('.dds') ? DDS.decode(buf) : null; if (!img) throw new Error('Formato de textura no soportado para guardar el brillo.');
  // el color se toma crudo del archivo; el alfa: el original a resolución completa con nivel/contraste aplicados y las pinceladas repetidas encima
  const G = ksGlossState(), W = img.w, H = img.h, px = new Uint8Array(img.data.buffer, img.data.byteOffset, img.data.length), A = document.createElement('canvas'); A.width = W; A.height = H;
  const ag = A.getContext('2d', { willReadFrequently: true });
  if (G.replaced) { ag.imageSmoothingQuality = 'high'; ag.drawImage(G.base, 0, 0, W, H); }
  else { const im = ag.createImageData(W, H); for (let i = 0; i < px.length; i += 4) { im.data[i] = im.data[i + 1] = im.data[i + 2] = G.had ? px[i + 3] : 128; im.data[i + 3] = 255; } ag.putImageData(im, 0, 0); for (const d of G.dabs) ksDab(ag, W, d); }
  const ad = ag.getImageData(0, 0, W, H).data, lut = new Uint8Array(256); for (let i = 0; i < 256; i++) { let v = i / 255; if (G.invert) v = 1 - v; v = (v - .5) * G.contrast + .5 + G.level; lut[i] = Math.max(0, Math.min(255, Math.round(v * 255))); }
  for (let i = 0; i < px.length; i += 4) px[i + 3] = lut[ad[i]];
  const P2 = FTEXW.pow2Pixels(px, W, H, 4096), bytes = await FTEXW.fromPixels(P2.px, P2.w, P2.h, { dxt5: true, progress });
  const out = await ksWriteTex(KS_SLOTS[0], null, { bytes }); const T = KS.T.kit; T.file = out; T.g = ksGloss(); KS.gl.changed = false; return out;
}

// ---- generadores (fuentes y normal map) en ventanas ----
function ksModal(title, html, bind) {
  const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.innerHTML = `<div class="modal ksmodal" role="dialog" aria-label="${esc(title)}"><div class="row" style="justify-content:space-between"><h3>${esc(title)}</h3><button class="btn ghost small" type="button" data-x aria-label="Cerrar">✕</button></div>${html}</div>`;
  document.body.appendChild(bg); const close = () => { bg.classList.add('out'); setTimeout(() => bg.remove(), 200); document.removeEventListener('keydown', esc_); };
  const esc_ = e => { if (e.key === 'Escape') close(); }; document.addEventListener('keydown', esc_);
  bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-x]')) close(); });
  bind(bg.querySelector('.modal'), close); return close;
}
const KS_FONTS = ['Saira Condensed', 'Bahnschrift', 'Impact', 'Arial Black', 'Arial Narrow', 'Franklin Gothic Medium', 'Haettenschweiler', 'Agency FB', 'Segoe UI Black', 'Trebuchet MS', 'Verdana', 'Tahoma', 'Georgia', 'Century Gothic', 'Eras Bold ITC', 'Rockwell', 'Copperplate Gothic Bold', 'Stencil', 'Bebas Neue', 'Oswald', 'Anton', 'Teko'];
function ksFontModal(m) {
  const O = KS.fontOpt || (KS.fontOpt = { font: 'Saira Condensed', weight: 800, italic: false, width: 1, fill: '#ffffff', stroke1: 0, color1: '#000000', stroke2: 0, color2: '#ffffff', shadow: 0, shadowColor: '#000000', legOwn: false, legFill: '#000000', kinds: { name: true, back: true, chest: !!(cfgGet(KS.cfg, 'ChestNumbersFile') || '').trim(), leg: true } });
  const avail = KS_FONTS.filter(f => { try { return document.fonts.check(`16px "${f}"`) && (f === 'Saira Condensed' || ksFontInstalled(f)); } catch { return false; } });
  if (KS.userFont && !avail.includes(KS.userFont)) avail.unshift(KS.userFont);
  const html = `<div class="ksgen">
    <div class="ksgenl">
      <div class="f"><label for="kfFont">Fuente</label><div class="row" style="flex-wrap:nowrap"><select id="kfFont">${avail.map(f => `<option ${f === O.font ? 'selected' : ''} style="font-family:'${esc(f)}'">${esc(f)}</option>`).join('')}</select><button class="btn small" type="button" id="kfLoad" title="Usar un archivo de fuente .ttf, .otf o .woff que tengas en la compu">Cargar…</button></div></div>
      <div class="grid2"><div class="f"><label for="kfW">Grosor</label><select id="kfW">${[[400, 'Normal'], [700, 'Negrita'], [800, 'Extra negrita'], [900, 'Black']].map(([v, n]) => `<option value="${v}" ${+O.weight === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="f"><label for="kfWidth">Ancho <output>${Math.round(O.width * 100)}%</output></label><input type="range" id="kfWidth" min="60" max="140" value="${Math.round(O.width * 100)}"></div></div>
      <label class="chk"><input type="checkbox" id="kfIt" ${O.italic ? 'checked' : ''}> Cursiva</label>
      <div class="grid2"><div class="f"><label for="kfFill">Relleno</label><input type="color" id="kfFill" value="${O.fill}"></div><div class="f"><label for="kfSh">Sombra <output>${O.shadow}</output></label><div class="row" style="flex-wrap:nowrap"><input type="range" id="kfSh" min="0" max="12" value="${O.shadow}"><input type="color" id="kfShC" value="${O.shadowColor}"></div></div></div>
      <div class="grid2"><div class="f"><label for="kfS1">Borde <output>${O.stroke1}</output></label><div class="row" style="flex-wrap:nowrap"><input type="range" id="kfS1" min="0" max="16" value="${O.stroke1}"><input type="color" id="kfC1" value="${O.color1}"></div></div>
        <div class="f"><label for="kfS2">Segundo borde <output>${O.stroke2}</output></label><div class="row" style="flex-wrap:nowrap"><input type="range" id="kfS2" min="0" max="16" value="${O.stroke2}"><input type="color" id="kfC2" value="${O.color2}"></div></div></div>
      <div class="f"><span class="lab">Qué texturas crear</span><div class="fchips" id="kfKinds">${[['name', 'Nombre'], ['back', 'Espalda'], ['chest', 'Pecho'], ['leg', 'Short']].map(([k, n]) => `<button type="button" data-k="${k}" aria-pressed="${!!O.kinds[k]}">${n}</button>`).join('')}</div></div>
      <div class="f"><label class="chk"><input type="checkbox" id="kfLegOwn" ${O.legOwn ? 'checked' : ''}> Número del short con otro color</label><div class="row" style="flex-wrap:nowrap"><input type="color" id="kfLegFill" value="${O.legFill}" aria-label="Color del número del short" ${O.legOwn ? '' : 'disabled'}><small class="note">El juego usa una textura aparte para el short (LegNumbersFile), así que puede tener su propio color.</small></div></div>
      <p class="note">Las letras y números se ubican en las mismas casillas que las plantillas de Photoshop (Letters / Numbers Template), con fondo transparente, como las espera el juego.</p>
    </div>
    <div class="ksgenr"><canvas id="kfPrev" width="560" height="300" aria-label="Vista previa del nombre y el número"></canvas><canvas id="kfStrip" width="560" height="140" aria-label="Textura de letras generada"></canvas></div>
  </div>
  <div class="mdlbtns"><button class="btn" type="button" data-x>Cancelar</button><button class="btn" type="button" id="kfTry">Probar en el kit</button><button class="btn primary" type="button" id="kfSave">Guardar en el kit</button></div>`;
  ksModal('Generador de fuentes', html, (M, close) => {
    const gen = () => { const r = {}; for (const k of ['name', 'back', 'chest', 'leg']) if (O.kinds[k]) r[k] = KFONT.generate(k, k === 'leg' && O.legOwn ? { ...O, fill: O.legFill } : O); return r; };
    const prev = () => {
      const T = gen(), pc = M.querySelector('#kfPrev'), g = pc.getContext('2d'), c1 = cfgGet(KS.cfg, 'ShirtColor1') || '#1e3576';
      g.fillStyle = c1; g.fillRect(0, 0, pc.width, pc.height); g.fillStyle = '#0002'; for (let x = 0; x < pc.width; x += 16) g.fillRect(x, 0, 6, pc.height);
      KFONT.drawText(g, T.name || ksTexOf('name'), 'name', KS.sample.name || 'JUGADOR', pc.width / 2, 58, 52, {});
      KFONT.drawText(g, T.back || ksTexOf('back'), 'back', KS.sample.num || '10', pc.width / 2, 185, 170, {});
      if (T.leg) { g.fillStyle = cfgGet(KS.cfg, 'ShortsColor') || '#1e3576'; g.fillRect(pc.width - 104, pc.height - 92, 92, 80); KFONT.drawText(g, T.leg, 'leg', KS.sample.num || '10', pc.width - 58, pc.height - 52, 52, {}); g.fillStyle = '#fffa'; g.font = '11px sans-serif'; g.fillText('Short', pc.width - 100, pc.height - 80); }
      const st = M.querySelector('#kfStrip'), sg = st.getContext('2d'); sg.clearRect(0, 0, st.width, st.height);
      for (let y = 0; y < st.height; y += 10) for (let x = 0; x < st.width; x += 10) { sg.fillStyle = (x + y) / 10 % 2 ? '#2a2f36' : '#353b44'; sg.fillRect(x, y, 10, 10); }
      const src = T.name || T.back || T.leg || T.chest; if (src) sg.drawImage(src, 0, 0, st.width, st.width * src.height / src.width);
      M._T = T;
    };
    const upd = () => { if (upd.r) return; upd.r = requestAnimationFrame(() => { upd.r = 0; prev(); }); };
    const on = (id, fn) => { const el = M.querySelector('#' + id); el.oninput = el.onchange = () => { fn(el); const o = el.parentElement.parentElement.querySelector('output') || el.parentElement.querySelector('output'); if (o && el.type === 'range') o.textContent = id === 'kfWidth' ? el.value + '%' : el.value; upd(); }; };
    on('kfFont', el => O.font = el.value); on('kfW', el => O.weight = +el.value); on('kfWidth', el => O.width = el.value / 100); on('kfIt', el => O.italic = el.checked);
    on('kfFill', el => O.fill = el.value); on('kfLegOwn', el => { O.legOwn = el.checked; M.querySelector('#kfLegFill').disabled = !el.checked; if (el.checked && !O.kinds.leg) { O.kinds.leg = true; M.querySelector('#kfKinds [data-k="leg"]').setAttribute('aria-pressed', true); } }); on('kfLegFill', el => O.legFill = el.value); on('kfSh', el => O.shadow = +el.value); on('kfShC', el => O.shadowColor = el.value);
    on('kfS1', el => O.stroke1 = +el.value); on('kfC1', el => O.color1 = el.value); on('kfS2', el => O.stroke2 = +el.value); on('kfC2', el => O.color2 = el.value);
    M.querySelector('#kfKinds').onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; O.kinds[b.dataset.k] = !O.kinds[b.dataset.k]; b.setAttribute('aria-pressed', O.kinds[b.dataset.k]); upd(); };
    M.querySelector('#kfLoad').onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.ttf,.otf,.woff,.woff2'; inp.onchange = async () => { const f = inp.files[0]; if (!f) return; try { const fam = f.name.replace(/\.[^.]+$/, ''); const ff = new FontFace(fam, await f.arrayBuffer()); await ff.load(); document.fonts.add(ff); KS.userFont = fam; O.font = fam; const sel = M.querySelector('#kfFont'); sel.insertAdjacentHTML('afterbegin', `<option selected>${esc(fam)}</option>`); upd(); toast('Fuente ' + fam + ' cargada.'); } catch (e) { toast('No se pudo usar esa fuente: ' + e.message, 6000); } }; inp.click(); };
    M.querySelector('#kfTry').onclick = () => { const T = M._T || gen(); for (const [k, c] of Object.entries(T)) KS.T[k] = { c, file: '(sin guardar)', where: 'gen' }; KS.texRev = (KS.texRev || 0) + 1; close(); ksRerender(); toast('Probando las fuentes nuevas. Para que el juego las use tocá "Guardar en el kit" en el generador.'); };
    M.querySelector('#kfSave').onclick = async () => {
      const T = M._T || gen(), b = M.querySelector('#kfSave'); b.disabled = true;
      try { const out = []; for (const [k, c] of Object.entries(T)) { b.textContent = 'Guardando ' + k + '…'; out.push(await ksWriteTex(KS_SLOTS.find(s => s.k === k), c)); }
        KS.texRev = (KS.texRev || 0) + 1; close(); ksRerender(); toast('Guardado en la carpeta del kit: ' + out.join(', ') + (KS.dirty ? '. Tocá "Guardar kit" para anotar los nombres en el config.txt.' : '.'), 8000);
      } catch (e) { b.disabled = false; b.textContent = 'Guardar en el kit'; toast('No se pudo guardar: ' + e.message, 7000); }
    };
    prev();
  });
}
function ksFontInstalled(f) { const c = document.createElement('canvas').getContext('2d'), t = 'mmmmmmmmmmWWWli10'; c.font = '40px monospace'; const a = c.measureText(t).width; c.font = `40px "${f}", monospace`; const b = c.measureText(t).width; c.font = '40px serif'; const a2 = c.measureText(t).width; c.font = `40px "${f}", serif`; return a !== b || a2 !== c.measureText(t).width; }
// ---- elegir cuello o short: miniaturas con la textura del kit y vista previa grande que gira ----
async function ksPicker(kind, m) {
  const P = await k3Pack(), tex = ksDisplayTex(), maps = ksMaps(), isC = kind === 'collar';
  const items = (isC ? P.names().filter(n => /^collar_\d+$/.test(n)) : P.names().filter(n => /^pants_\d+$/.test(n))).sort();
  const cur = isC ? ksN('Collar') : ksN('ShortsModel'); let sel = cur;
  const base = (KS.model && KS.model.parts) || [], shirt = base.find(p => p.k === 'shirt'), socks = base.find(p => p.k === 'socks');
  const partOf = v => { const n = (isC ? 'collar_' : 'pants_') + String(v).padStart(3, '0'), mm = P.get(n); if (!mm) return null; if (isC) return { k: 'collar', m: mm }; const sub = P.get(K3.tuck === 'in' ? 'pants_sub_in' : cfgGet(KS.cfg, 'TightKit') === '1' ? 'pants_sub_tight' : 'pants_sub_out'); return { k: 'shorts', m: { meshes: [...mm.meshes, ...(sub ? sub.meshes : [])] } }; };
  const modelWith = v => { const p = partOf(v); if (!p) return KS.model; return { parts: K3GL.weld([...base.filter(x => x.k !== p.k), p]) }; };
  const html = `<div class="kpwrap"><div><p class="note">${isC ? 'Tocá un cuello para verlo en el kit; doble clic o "Usar este cuello" lo pone en el config.txt (Collar).' : 'Tocá un short para verlo en el kit; doble clic o "Usar este short" lo pone en el config.txt (ShortsModel). Del 17 en adelante el juego suele mostrar partes en negro.'}</p>
      <div class="kpgrid" id="kpGrid">${items.map(n => { const v = +n.split('_')[1]; return `<button type="button" class="kpi ${v === cur ? 'on cur' : ''}" data-v="${v}" title="${isC ? 'Cuello' : 'Short'} ${v}"><canvas width="112" height="112"></canvas><b>${v}</b>${v === cur ? '<i>actual</i>' : ''}</button>`; }).join('')}</div></div>
    <aside class="kpprev"><div class="kpview"><canvas id="kpV"></canvas><canvas class="k3fade" id="kpVF"></canvas></div>
      <div class="kpinfo"><b id="kpName">${isC ? 'Cuello' : 'Short'} ${cur}</b><span class="note" id="kpNote">El que tiene el kit ahora.</span></div>
      ${isC ? '<label class="chk"><input type="checkbox" id="kpWinter" checked> Usar el mismo como cuello de invierno (WinterCollar)</label>' : ''}
      <div class="mdlbtns"><button class="btn" type="button" data-x>Cancelar</button><button class="btn primary" type="button" id="kpUse" disabled>Usar este ${isC ? 'cuello' : 'short'}</button></div></aside></div>`;
  ksModal(isC ? 'Elegir cuello' : 'Elegir modelo de short', html, (M, close) => {
    M.classList.add('kpmodal');
    const view = { yaw: isC ? -.5 : -.35, pitch: isC ? .32 : .12, dist: 0, panX: 0, panY: 0, fov: 34 }, cv = M.querySelector('#kpV');
    let V = null; requestAnimationFrame(() => { V = k3Viewer(cv, modelWith(cur), KS.cfg, tex, maps, { view, scene: { bg: false } }); if (V) { const f = V.fit(); view.dist = f.radius * (isC ? 1.8 : 1.7); view.panY = isC ? f.radius * .64 : -f.radius * .22; V.auto(true); } });
    const btns = [...M.querySelectorAll('.kpi')]; let i = 0;
    const step = () => { const t0 = performance.now(); while (i < btns.length && performance.now() - t0 < 22) { const b = btns[i++], p = partOf(b.dataset.v); if (!p) continue; const parts = isC ? [shirt, p].filter(Boolean) : [p, socks].filter(Boolean), th = k3Thumb(K3GL.weld(parts), tex, isC ? 'collar' : 'shorts', 112, maps); if (th) b.querySelector('canvas').getContext('2d').drawImage(th, 0, 0); } if (i < btns.length) requestAnimationFrame(step); else if (K3.off) K3.off.model = null; };
    requestAnimationFrame(step);
    const on = btns.find(b => b.classList.contains('on')); if (on) on.scrollIntoView({ block: 'center' });
    const choose = v => { sel = +v; btns.forEach(b => b.classList.toggle('on', +b.dataset.v === sel)); M.querySelector('#kpName').textContent = (isC ? 'Cuello ' : 'Short ') + sel; M.querySelector('#kpNote').textContent = sel === cur ? 'El que tiene el kit ahora.' : 'Vista previa: todavía no está en el config.'; M.querySelector('#kpUse').disabled = sel === cur; if (V) V.swap(modelWith(sel), M.querySelector('#kpVF')); };
    const use = () => { if (sel === cur) { close(); return; } if (isC) { KS.setVal('Collar', sel); if (M.querySelector('#kpWinter').checked) KS.setVal('WinterCollar', sel); } else KS.setVal('ShortsModel', sel);
      toast(`${isC ? 'Cuello' : 'Short'} ${sel} puesto en el config.txt. Tocá "Guardar kit" para escribirlo en el juego.`, 5000); const f = document.querySelector(`[data-pick="${kind}"]`); if (f) { f.classList.remove('flash'); void f.offsetWidth; f.classList.add('flash'); } V && V.dispose(); close(); };
    M.querySelector('#kpGrid').onclick = e => { const b = e.target.closest('.kpi'); if (b) choose(b.dataset.v); };
    M.querySelector('#kpGrid').ondblclick = e => { const b = e.target.closest('.kpi'); if (b) { choose(b.dataset.v); use(); } };
    M.querySelector('#kpUse').onclick = use;
    M.addEventListener('click', e => { if (e.target.closest('[data-x]') && V) V.dispose(); });
  });
}
// ---- subir una imagen a una casilla (se convierte a .ftex y se guarda en la carpeta del kit) ----
function ksUpload(S, m) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.png,.jpg,.jpeg,.webp,.dds,.ftex';
  inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return; const n = f.name.toLowerCase();
    try {
      let bytes = null, img;
      if (n.endsWith('.ftex')) { bytes = new Uint8Array(await f.arrayBuffer()); img = await ftexDecode(bytes.buffer, 4096); }
      else if (n.endsWith('.dds')) img = DDS.decode(await f.arrayBuffer());
      else img = await FTEXW.rawFromImage(f);
      toast('Convirtiendo ' + f.name + ' a .ftex…', 60000);
      if (!bytes) { const P2 = FTEXW.pow2Pixels(new Uint8Array(img.data.buffer, img.data.byteOffset, img.data.length), img.w, img.h, 4096); bytes = await FTEXW.fromPixels(P2.px, P2.w, P2.h, { dxt5: S.k !== 'srm', progress: p => { const t = $('toast'); if (t && t.firstChild) t.firstChild.textContent = `Convirtiendo ${f.name} a .ftex… ${Math.round(p * 100)}%`; } }); }
      const file = await ksWriteTex(S, null, { bytes });
      const small = ksShrink(img, S.max), gls = S.k === 'kit' ? ksAlphaCanvas(small) : null; if (S.opaque) for (let i = 3; i < small.data.length; i += 4) small.data[i] = 255;
      Object.assign(KS.T[S.k], { c: imgToCanvas(small), g: gls, file, where: 'kit' }); /* mismo objeto que quedó en la caché: al volver a este kit se sigue viendo */ if (S.k === 'kit') KS.gl = null; if (S.k === 'nrm') KS.genNrm = null; if (S.k === 'srm') KS.genSrm = null; KS.texRev = (KS.texRev || 0) + 1;
      toast(`${S.n}: guardada como ${file} en la carpeta del kit.` + (KS.dirty ? ' Tocá "Guardar kit" para anotarla en el config.txt.' : ''), 7000); renderTeams(m);
    } catch (e) { toast('No se pudo cargar la textura: ' + e.message, 7000); }
  };
  inp.click();
}

// ---- Uniformes: todos los kits del equipo con sus texturas (miniaturas chicas, se leen una sola vez) ----
const KS_ROLE = (n, i, gk) => gk ? (i ? 'Arquero alternativo ' + (i + 1) : 'Arquero') : ['Titular', 'Suplente', 'Alternativa', 'Cuarto kit'][i] || 'Kit ' + (i + 1);
function ksKitFiles(n) {
  const cfg = KS.cfgTxt && KS.cfgTxt[n] ? cfgParse(KS.cfgTxt[n]) : null;
  return KS_SLOTS.map(S => { const v = cfg ? (cfgGet(cfg, S.f) || '').trim() : ''; return { S, file: S.derived ? (v ? v + S.suf : '') : v }; });
}
async function ksLoadThumbs() {
  if (KS.thumbBusy) return; KS.thumbBusy = true;
  try { const dir = await subDir((await ksRoot(false)).kit, KS.path);
    for (const n of [...KS.kits, ...KS.gk]) { if (KS.thumbs[n]) continue; const T = {};
      await Promise.all(ksKitFiles(n).map(async ({ S, file }) => {
        if (!file) { T[S.k] = { none: true }; return; }
        try { const f = await ksFindTex(dir, file, n); if (!f) { T[S.k] = { missing: true, file }; return; }
          const c = await ksDecodeTex(f.h, Object.assign({}, S, { max: S.font ? 512 : 256 })); T[S.k] = { c, file: f.h.name, where: f.where };
        } catch (e) { T[S.k] = { err: e.message, file }; } }));
      KS.thumbs[n] = T; if (KS.mode === 'list') ksRerender(); }
  } catch { }
  KS.thumbBusy = false;
}
function ksOverview(t) {
  const card = (n, i, gk) => { const m = KS.meta[n], T = KS.thumbs[n], files = ksKitFiles(n), have = T ? files.filter(x => T[x.S.k] && T[x.S.k].c).length : 0;
    const slot = ({ S, file }) => { const x = T && T[S.k] || {}, st = x.c ? (x.where === 'kit' ? 'ok' : 'live') : x.none ? 'none' : x.missing ? 'cpk' : x.err ? 'err' : 'wait';
      const tip = S.n + ': ' + (x.c ? x.file + (x.where === 'kit' ? ' (en la carpeta del kit)' : ' (suelta en livecpk)') : x.none ? (S.font ? 'no usa' : 'sin textura') : x.missing ? (file + ' dentro de los .cpk del juego') : x.err ? 'no se pudo leer' : 'buscando…');
      return `<span class="ksfile ${st}" title="${esc(tip)}">${x.c ? `<canvas data-kth="${esc(n)}:${S.k}" width="${S.font ? 72 : 40}" height="40"></canvas>` : '<i></i>'}<small>${S.n.replace('Números de la ', 'Nº ').replace('Números del ', 'Nº ').replace('Textura del kit', 'Kit').replace('Letras del nombre', 'Nombre').replace('Brillo (SRM)', 'Brillo')}</small></span>`; };
    return `<article class="ksucard ${KS.sel === n ? 'on' : ''}">
      <button type="button" class="ksuthumb" data-open="${esc(n)}" title="Abrir ${esc(n)} en el Editor">${T && T.kit && T.kit.c ? `<canvas data-kth="${esc(n)}:kit" width="200" height="200"></canvas>` : `<span class="ksuph">${shirtSvg(m || kitFor(t, gk), '5.5em')}${T ? '' : '<small>Leyendo texturas…</small>'}</span>`}</button>
      <div class="ksuhead">${shirtSvg(m || kitFor(t, gk), '1.6em')}<b>${esc(n)}</b><small>${KS_ROLE(n, i, gk)}${m && m.t ? ' · ajustada' : ''}</small><span class="chip">${T ? have + '/' + files.length + ' texturas' : '…'}</span></div>
      <div class="ksfiles">${files.map(slot).join('')}</div>
      <div class="row ksuact"><button type="button" class="btn small primary" data-open="${esc(n)}">✎ Editar</button><button type="button" class="btn ghost small" data-up="${esc(n)}" title="Subir en el orden" ${i ? '' : 'disabled'}>↑</button><button type="button" class="btn ghost small" data-dup="${esc(n)}" title="Duplicar como kit nuevo">⧉</button>${gk ? '' : `<button type="button" class="btn ghost small" data-dupgk="${esc(n)}" title="Copiar como kit de arquero">🧤</button>`}<button type="button" class="btn ghost small" data-del="${esc(n)}" title="Borrar este kit" ${!gk && KS.kits.length < 2 ? 'disabled' : ''}>🗑</button></div>
    </article>`; };
  return `${ksDropHtml()}<h4 class="kssec">Jugadores <small>${KS.kits.length}</small></h4><div class="ksugrid">${KS.kits.map((n, i) => card(n, i, false)).join('')}</div>
    <h4 class="kssec">Arqueros <small>${KS.gk.length}</small></h4>${KS.gk.length ? `<div class="ksugrid">${KS.gk.map((n, i) => card(n, i, true)).join('')}</div>` : '<p class="note">Sin kits de arquero. Usá 🧤 en un kit de jugador para crear uno.</p>'}
    <p class="note">El orden es el de order.ini y gk_order.ini: el primero es el titular. ⧉ crea una copia (p5, g4…), 🧤 copia un kit de jugador como kit de arquero y 🗑 borra el kit (su carpeta queda guardada en _borrados). Verde: la textura está en la carpeta del kit; azul: suelta en livecpk; gris: dentro de los .cpk del juego o sin usar.</p>`;
}
// ---- tarjeta ----
// Uniformes, Editor (el kit en 3D con sus dorsales, luz y texturas) y Fuentes (el creador de fuentes de KitPos, kitposfont.js); sin carpeta de kits solo hay Uniformes y Fuentes
function ksModeSeg(n) {
  const b = (v, l) => `<button type="button" data-v="${v}" aria-pressed="${KS.mode === v || (v === 'list' && n == null && KS.mode !== 'fonts')}">${l}</button>`;
  return `<div class="seg ksmode" id="ksMode" aria-label="Sección de Kit Studio Pro">${b('list', `👕 Uniformes${n != null ? ` <small>${n}</small>` : ''}`)}${n != null ? b('edit', `🎥 Editor · ${esc(KS.sel)}`) : ''}${b('fonts', '🔤 Fuentes')}</div>`;
}
// Chrome no deja leer kitpos_slots.ini por su nombre: antes de mostrar el kit se pide elegirlo (si no, el nombre y los números no quedan donde los pone KitPos)
let ksFloatResize = false;
const ksGateOn = () => !!(KPS.st && KPS.st.lua && KPS.st.slots === 'hidden' && !KS.gateSkip);
function kitStudioCard(t) {
  const k = KITS.map.get(t.id);
  if (!k || !k.path) {
    // el creador de fuentes también se puede usar sin kits: la fuente se descarga en un .zip
    const head = `<div class="row"><h3>Kit Studio Pro</h3>${ksModeSeg(null)}</div>`;
    if (KS.mode === 'fonts') return `<div class="card kscard">${head}${kpfCard(t, false)}</div>`;
    if (!KITS.from) return `<div class="card kscard">${head}<p class="note">Tocá "Conectar carpeta Sider" y elegí la carpeta de Sider de tu juego. Si este equipo no tiene carpeta en content\\kit-server, el juego usa los kits de la base y no se pueden editar desde acá.</p></div>`;
    // el equipo no está en map.txt: sus kits viven en los .cpk del juego (cifrados). Lo que sí se puede es cargarle uno por Sider.
    return `<div class="card kscard">${head}
      <div class="warnbox" id="ksCpk"><b>Este equipo no tiene carpeta en el kit-server de Sider.</b> Sus kits están dentro de los archivos .cpk del juego, que vienen cifrados: desde acá no se pueden ver ni editar. Lo que sí se puede es cargarle un kit por Sider: arrastrá abajo un .zip con las texturas y se crea la carpeta del equipo en content\\kit-server (con su línea en map.txt) para que el juego lo use.</div>
      ${ksDropHtml()}
      <p class="note">Después de cargarlo, abrí el juego de nuevo (o en kserv apretá [0] para recargar el mapa) y fijate en la pantalla de uniformes del partido.</p></div>`;
  }
  if (KS.team !== t.id && !KS.busy) { KS.team = t.id; KS.cfg = null; KS.sel = null; ksLoad(t).then(() => ksRerender()); }
  if (KS.busy || (!KS.cfg && !KS.err)) return '<div class="card"><div class="lmload"><span class="spin"></span> Leyendo los kits del juego…</div></div>';
  if (!KS.cfg) return `<div class="card"><h3>Kit Studio Pro</h3><div class="warnbox">${esc(KS.err)}</div></div>`;
  const chip = (n, i, gk) => { const m = KS.meta[n]; return `<div class="kschip ${KS.sel === n ? 'on' : ''}"><button type="button" class="ksk" data-kit="${esc(n)}" title="Editar ${esc(n)}">${shirtSvg(m || kitFor(t, gk), '2.1em')}<span><b>${esc(n)}</b><small>${KS_ROLE(n, i, gk)}${m && m.t ? ' · ajustada' : ''}</small></span></button></div>`; };
  const groups = []; for (const f of KS.cfg.fields) { let g = groups.find(x => x.s === f.section); if (!g) groups.push(g = { s: f.section, f: [] }); g.f.push(f); }
  const ctl = (f, name) => {
    const ty = fieldType(f), id = 'ks_' + f.key, v = f.value.trim(), lab = `<label for="${id}">${esc(name || KEY_ES[f.key] || f.key)}</label>`;
    if (ty.t === 'color') return `<div class="f ksf">${lab}<div class="swatch"><input type="color" id="${id}" data-ks="${f.key}" value="${esc(v.toLowerCase())}"><input type="text" data-ks="${f.key}" value="${esc(v)}" maxlength="7" style="width:90px;font-family:var(--mono)" aria-label="${esc(f.key)} en hexadecimal"></div></div>`;
    if (ty.t === 'enum') return `<div class="f ksf">${lab}<select id="${id}" data-ks="${f.key}">${ty.opts.some(o => o[0] === v) ? '' : `<option value="${esc(v)}" selected>${esc(v)}</option>`}${ty.opts.map(([val, l]) => `<option value="${val}" ${val === v ? 'selected' : ''}>${esc(l)}${l !== val ? ' (' + val + ')' : ''}</option>`).join('')}</select></div>`;
    if (ty.t === 'range') return `<div class="f ksf">${lab}<div class="srange"><input type="range" id="${id}" min="${ty.min}" max="${ty.max}" value="${esc(v)}" data-ks="${f.key}"><output>${esc(v)}</output></div>${ty.hint ? `<small class="note">${esc(ty.hint)}</small>` : ''}</div>`;
    if (ty.t === 'num') return `<div class="f ksf">${lab}<input type="number" id="${id}" data-ks="${f.key}" value="${esc(v)}"></div>`;
    return `<div class="f ksf">${lab}<input type="text" id="${id}" data-ks="${f.key}" value="${esc(v)}" style="font-family:var(--mono)"></div>`;
  };
  const slotCard = S => { const T = KS.T[S.k] || {}, file = ksSlotFile(S);
    const st = T.c ? (T.where === 'kit' ? 'En la carpeta del kit' : T.where === 'live' ? 'Suelta en livecpk' : 'Generada, sin guardar') : T.none ? (S.font ? 'No usa (campo vacío)' : 'Sin textura') : T.missing ? 'Dentro de los .cpk del juego' : T.err ? 'No se pudo leer' : 'Buscando…';
    return `<div class="ksslot ${T.c ? 'has' : ''}"><div class="kst">${T.c ? `<canvas data-slot="${S.k}" width="160" height="${S.font ? 50 : 160}"></canvas>` : `<span>${S.k === 'nrm' || S.k === 'srm' ? '◌' : '?'}</span>`}</div>
      <div class="ksi"><b>${S.n}</b><small class="mono">${esc(T.file || file || ksSlotDefault(S) + ' (nuevo)')}</small><small class="${T.c ? 'ok' : 'muted'}">${st}</small>${S.k === 'name' && T.c && T.c.__kp ? `<small class="ok">Fuente de KitPos: ${T.c.__kp.size} letras, con minúsculas</small>` : ''}<span class="note">${S.d}</span>
        <div class="row" style="gap:4px"><button class="btn small" type="button" data-upl="${S.k}" title="Elegí una imagen (.png, .jpg, .dds o .ftex): se convierte a .ftex y se guarda en la carpeta del kit">Subir…</button>
        ${S.font ? `<button class="btn small" type="button" data-fontgen title="Crear las letras y números con cualquier fuente de tu compu">Generar…</button>` : ''}${S.k === 'name' ? `<button class="btn small" type="button" data-kpfgo title="Fuente con minúsculas, acentos, cirílico y griego para KitPos">🔤 Con minúsculas…</button>` : ''}${S.k === 'nrm' ? `<button class="btn small" type="button" data-nrmsave title="Guardar el normal map de la tela elegida en el panel Tela">Guardar el de la tela</button>` : ''}${S.k === 'srm' ? `<button class="btn small" type="button" data-srmsave title="Guardar el brillo según la tela elegida">Guardar según la tela</button>` : ''}
        ${T.c ? `<button class="btn small ghost" type="button" data-see="${S.k}">Ver</button>` : ''}</div></div></div>`; };
  const cfgN = k => esc(cfgGet(KS.cfg, k) || '—');
  const dirty = KS.dirty || kpsDirty();
  return `<div class="card kscard">
    <div class="row" style="justify-content:space-between"><div class="row"><h3>Kit Studio Pro · ${esc(KS.path)}</h3>
      ${ksModeSeg(KS.kits.length + KS.gk.length)}</div>
      ${KS.mode !== 'edit' ? '' : `<div class="row">${dirty ? '<span class="chip warn">Cambios sin guardar en el kit</span>' : '<span class="chip">Guardado</span>'}
      <button class="btn" type="button" id="ksUndo" ${dirty ? '' : 'disabled'}>Descartar</button><button class="btn primary" type="button" id="ksSave" ${dirty ? '' : 'disabled'}>Guardar kit</button></div>`}</div>
    ${KS.err ? `<div class="warnbox">${esc(KS.err)}</div>` : ''}
    ${KS.mode === 'list' ? ksOverview(t) : KS.mode === 'fonts' ? kpfCard(t, true) : `
    <div class="kssel" aria-label="Kit que se edita">${KS.kits.map((n, i) => chip(n, i, false)).join('')}${KS.gk.map((n, i) => chip(n, i, true)).join('')}</div>
    ${ksEditHtml(t, ctl, slotCard)}
    <div class="ksmodel"><h4>Modelo</h4>
      <button type="button" class="kspick" data-pick="collar"><canvas id="kpCollar" width="72" height="72"></canvas><span><b>Cuello ${cfgN('Collar')}</b><small>Tocá para ver todos</small></span></button>
      <button type="button" class="kspick" data-pick="shorts"><canvas id="kpShorts" width="72" height="72"></canvas><span><b>Short ${cfgN('ShortsModel')}</b><small>Tocá para ver todos</small></span></button>
      <div class="f"><label for="ksTight">Corte</label><select id="ksTight" data-ks="TightKit"><option value="0" ${cfgGet(KS.cfg, 'TightKit') !== '1' ? 'selected' : ''}>Normal</option><option value="1" ${cfgGet(KS.cfg, 'TightKit') === '1' ? 'selected' : ''}>Ajustada</option></select></div>
      <div class="f"><label for="ksKappa">Manga</label><select id="ksKappa" data-ks="ShortSleevesModel"><option value="1" ${cfgGet(KS.cfg, 'ShortSleevesModel') !== '2' ? 'selected' : ''}>Normal</option><option value="2" ${cfgGet(KS.cfg, 'ShortSleevesModel') === '2' ? 'selected' : ''}>Kappa (ajustada)</option></select></div>
      <label class="chk"><input type="checkbox" id="ksSync" ${KS.sync ? 'checked' : ''}> Usar los colores principal y secundario también en el menú (UniColor)</label>
    </div>
    ${groups.map(g => `<details class="ksgroup" ${['kit colors', 'shirt - back side'].includes(g.s) ? 'open' : ''}><summary>${esc(SEC_ES[g.s] || g.s)}</summary><div class="grid wide">${g.f.map(f => ctl(f)).join('')}</div></details>`).join('')}
    <p class="note">"Guardar kit" escribe content\\kit-server\\${esc(KS.path)}\\${esc(KS.sel)}\\config.txt (la primera vez guarda una copia config.txt.bak-edit21). Los comentarios y el orden del archivo se respetan. Abrí el juego de nuevo para ver los cambios.</p>`}
  </div>`;
}
// ---- Editor: el kit en grande (3D, maqueta o texturas) y al costado los dorsales, la luz y la tela ----
// cada grupo con sus valores del config.txt y un nombre corto (el grupo ya dice de qué se trata); el primero de cada grupo se ve aunque el elemento esté apagado
const KS_DORS = [['name', [['Name', 'Mostrar'], ['NameY', 'Altura'], ['NameSize', 'Tamaño'], ['NameStretch', 'Ancho'], ['NameShape', 'Curva']]], ['num', [['BackNumberType', 'Dígitos'], ['BackNumberY', 'Altura'], ['BackNumberSize', 'Tamaño'], ['BackNumberSpacing', 'Separación de los dígitos']]],
  ['chest', [['ChestNumberSize', 'Tamaño'], ['ChestNumberX', 'Horizontal'], ['ChestNumberY', 'Vertical']]], ['leg', [['ShortsNumberSide', 'Pierna'], ['ShortsNumberX', 'Horizontal'], ['ShortsNumberY', 'Vertical'], ['ShortsNumberSize', 'Tamaño']]]];
const KS_HUD = () => K3.paint ? '🖌 Pintando brillo · Shift: mover cámara' : KS.tool ? `${KPL_EL[KS.tool].n}: flechas para moverlo, + y − tamaño · Esc: soltar` : K3.place ? 'Arrastrá el nombre o un número para moverlo · Rueda encima: tamaño' : 'Girar: arrastrar · Mover: clic der. · Zoom: rueda';
// atajos sobre el 3D: abajo, qué mover (y + para agregar el número del pecho o del short); al lado del recuadro del elegido,
// deslizadores que se arrastran con el mouse (altura, tamaño, ancho, curva); arriba del nombre, una manija para curvarlo.
// ksFloat los acomoda al girar la cámara.
const KS_SLIDE = { name: ['NameY', 'NameSize', 'NameStretch', 'NameShape'], num: ['BackNumberY', 'BackNumberSize', 'BackNumberSpacing'], chest: ['ChestNumberY', 'ChestNumberSize', 'ChestNumberX'], leg: ['ShortsNumberY', 'ShortsNumberSize', 'ShortsNumberX'] };
const KS_SLIDE_I = { NameY: ['▲', '▼', 'Altura'], BackNumberY: ['▲', '▼', 'Altura'], ChestNumberY: ['▲', '▼', 'Altura'], ShortsNumberY: ['▲', '▼', 'Altura'], NameSize: ['A', 'a', 'Tamaño'], BackNumberSize: ['A', 'a', 'Tamaño'], ChestNumberSize: ['A', 'a', 'Tamaño'], ShortsNumberSize: ['A', 'a', 'Tamaño'],
  NameStretch: ['↔', '→←', 'Ancho'], BackNumberSpacing: ['↔', '→←', 'Separación'], NameShape: ['◠', '▬', 'Curva'], ChestNumberX: ['◀', '▶', 'Costado'], ShortsNumberX: ['◀', '▶', 'Costado'] };
// rango del deslizador: el que acepta el juego (con KitPos, con decimales y la curva también hacia el otro lado);
// lo que va más allá queda en 📐 Posición libre
function ksSlideRange(k) {
  if (ksKpOn()) return kplF(k) === 'NameCurve' ? KPOS.range('NameCurve') : [0, KPOS.FIELDS[kplF(k)].max];
  const f = KS.cfg && KS.cfg.fields.find(x => x.key === k), ty = f && fieldType(f); return [ty && ty.t === 'range' ? ty.min : 0, Math.min(kplMax(k), ty && ty.t === 'range' ? ty.max : 99)];
}
function ksToolsHtml() {
  const els = Object.keys(KPL_EL), E = KS.tool && KPL_EL[KS.tool], canAdd = el => el === 'chest' || el === 'leg' || (el === 'name' && KS.sample.name);
  const sl = k => { const [t, b, n] = KS_SLIDE_I[k], h = /X$/.test(k); return `<div class="k3sl ${h ? 'h' : ''}" data-k="${k}" title="${n}: arrastrá con el mouse · rueda: de a un paso"><span class="k3si">${t}</span><div class="k3tr"><i class="k3kn"></i></div><span class="k3si">${b}</span><small>${n}</small></div>`; };
  return `<div id="k3Tools" style="${E ? '--dc:' + E.col : ''}">
    <div class="k3tools ${E ? 'on' : ''}" aria-label="Atajos para mover el nombre y los números">
      <div class="k3tsel">${els.map((el, i) => kplOn(el) ? `<button type="button" data-tool="${el}" aria-pressed="${KS.tool === el}" style="--dc:${KPL_EL[el].col}" title="${KS_DECAL_N[el]} (tecla ${i + 1})"><i></i>${KPL_EL[el].n}</button>`
        : canAdd(el) ? `<button type="button" class="add" data-addel="${el}" style="--dc:${KPL_EL[el].col}" title="Agregar: ${KS_DECAL_N[el]}">＋ ${KPL_EL[el].n}</button>` : `<button type="button" disabled style="--dc:${KPL_EL[el].col}"><i></i>${KPL_EL[el].n}</button>`).join('')}</div>
      <p class="k3thint" id="k3THint">${E ? '' : 'Elegí qué mover'}</p>
    </div>
    ${E ? `<div class="k3float" id="k3Float" hidden>
      <div class="k3sls">${KS_SLIDE[KS.tool].filter(k => !/X$/.test(k)).map(sl).join('')}</div>
      ${KS_SLIDE[KS.tool].filter(k => /X$/.test(k)).map(sl).join('')}
      ${KS.tool === 'num' ? `<div class="k3ty" id="k3Type" title="Tipo de número (BackNumberType del config.txt)">${[['0', '7', 'Normal: una cifra si el número es menor que 10'], ['1', '07', 'Siempre dos cifras']].map(([v, l, tt]) => `<button type="button" data-v="${v}" aria-pressed="${(cfgGet(KS.cfg, 'BackNumberType') || '0') === v}" title="${tt}">${l}</button>`).join('')}</div>` : ''}
      <p class="k3tval" id="k3TVal" aria-live="polite"></p>
      ${KS.tool !== 'num' ? `<button type="button" class="k3del" data-delel="${KS.tool}" title="Sacarlo del kit (en el config.txt y en KitPos)">✕ Quitar</button>` : ''}
    </div>
    ${E.arc ? `<button type="button" class="k3arc" id="k3Arc" hidden title="Arrastrá hacia arriba o abajo para curvar el nombre"><span>◠</span> Curva</button>` : ''}` : ''}
  </div>`;
}
// pone o saca el nombre, el número del pecho o el del short: en el config.txt (kserv) y, si está KitPos, también en kitpos_slots.ini
// (KitPos oculta con tamaño 0; kserv saca el del pecho sin ChestNumbersFile y el del short con 30 en Horizontal)
function ksShowEl(el, on, setVal) {
  const kp = KPS.cur && KPS.st && KPS.st.lua && KPS.st.slots !== 'hidden', size = { chest: 'ChestNumberSize', leg: 'ShortsNumberSize' }[el], prev = KS.prevEl || (KS.prevEl = {});
  if (el === 'name') { setVal('Name', on ? '0' : '1'); return; }
  if (el === 'chest') {
    if (on) { const f = prev.chestFile || cfgGet(KS.cfg, 'BackNumbersFile') || ''; if (!(cfgGet(KS.cfg, 'ChestNumbersFile') || '').trim()) setVal('ChestNumbersFile', f); }
    else { prev.chestFile = cfgGet(KS.cfg, 'ChestNumbersFile'); setVal('ChestNumbersFile', ''); }
  }
  if (el === 'leg') {
    if (on) { if (ksN('ShortsNumberX') >= 30) setVal('ShortsNumberX', prev.legX ?? 14); if (ksN('ShortsNumberY') >= 30) setVal('ShortsNumberY', prev.legY ?? 8); }
    else { prev.legX = ksN('ShortsNumberX'); prev.legY = ksN('ShortsNumberY'); setVal('ShortsNumberX', 30); }
  }
  if (kp && size) { if (!on) kpsSet({ [size]: 0 }); else if (kpsVals()[size] === 0) kpsSet({ [size]: null }); }
}
// Kit Studio a lo ancho: la lista de equipos se esconde (PREFS.ksWide) con un botón flotante a la izquierda, como el de la música
function ksEditShown() { return (S.tab === 'teams' || S.tab === 'nats') && S.ttab === 'kits' && KS.mode === 'edit'; }
function ksWideOn() { return !!PREFS.ksWide && ksEditShown(); }
function ksWideApply(m) { const sp = m && m.querySelector(':scope > .split'); if (sp && !sp.classList.contains('ksanim')) { sp.classList.toggle('kswide', ksWideOn()); sp.classList.toggle('kstall', ksWideOn()); } ksFab(m); }
function ksFab(m) {
  let b = $('ksTeamsFab'); if (!ksEditShown() || !S.f) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement('button'); b.type = 'button'; b.id = 'ksTeamsFab'; b.className = 'ksfab'; document.body.appendChild(b); }
  const w = !!PREFS.ksWide; b.onclick = () => ksWideToggle(m || $('main')); b.classList.toggle('on', w); b.setAttribute('aria-pressed', w);
  b.title = tr(w ? 'Volver a mostrar la lista de equipos' : 'Esconder la lista de equipos para que el visor ocupe todo el ancho');
  b.innerHTML = `<span class="ksfabi" aria-hidden="true">${w ? '☰' : '⇤'}</span><span class="ksfabt">${tr(w ? 'Mostrar equipos' : 'Ocultar equipos')}</span>`;
}
// la lista se desliza hacia la izquierda y el visor se agranda (o al revés); el 3D se redibuja en cada cuadro
function ksWideToggle(m) {
  const sp = m && m.querySelector(':scope > .split'), aside = sp && sp.querySelector(':scope > aside.list'), to = !PREFS.ksWide, ms = 420, ease = 'cubic-bezier(.2,.8,.2,1)';
  PREFS.ksWide = to; savePrefs(); ksFab(m);
  const done = () => { if (!sp) return; sp.classList.remove('ksanim'); sp.style.gridTemplateColumns = sp.style.columnGap = sp.style.transition = ''; if (aside) aside.style.cssText = ''; sp.classList.toggle('kswide', to); sp.classList.toggle('kstall', to); K3.viewer && K3.viewer.redraw(); KS.float && KS.float(); };
  if (!sp || !aside || ANIM.reduce.matches) { done(); return; }
  const t0 = performance.now(), tick = () => { K3.viewer && K3.viewer.redraw(); KS.float && KS.float(); if (performance.now() - t0 < ms + 120) requestAnimationFrame(tick); };
  sp.classList.add('ksanim'); sp.classList.toggle('kstall', to); requestAnimationFrame(tick);
  if (matchMedia('(max-width:860px)').matches) { // una columna: la lista sale o entra por la izquierda
    const out = [{ transform: 'none', opacity: 1 }, { transform: 'translateX(-105%)', opacity: 0 }];
    if (to) aside.animate(out, { duration: ms * .8, easing: ease }).finished.then(done, done); else { done(); aside.animate(out.slice().reverse(), { duration: ms, easing: ease }); }
    return;
  }
  const w = to ? aside.getBoundingClientRect().width : Math.min(410, sp.clientWidth - 16), cols = x => `${x}px minmax(0,1fr)`;
  if (!to) sp.classList.remove('kswide');
  sp.style.gridTemplateColumns = cols(to ? w : 0); sp.style.columnGap = to ? '16px' : '0px';
  Object.assign(aside.style, { overflow: 'hidden', minWidth: '0', transform: to ? 'none' : 'translateX(-40px)', opacity: to ? 1 : 0 });
  sp.getBoundingClientRect();
  sp.style.transition = `grid-template-columns ${ms}ms ${ease}, column-gap ${ms}ms ${ease}`; aside.style.transition = `transform ${ms}ms ${ease}, opacity ${ms * .7}ms`;
  sp.style.gridTemplateColumns = cols(to ? 0 : w); sp.style.columnGap = to ? '0px' : '16px';
  Object.assign(aside.style, { transform: to ? 'translateX(-40px)' : 'none', opacity: to ? 0 : 1 });
  setTimeout(done, ms + 30);
}
function ksEditHtml(t, ctl, slotCard) {
  const L = K3.light, gk = KS.gk.includes(KS.sel), role = KS_ROLE(KS.sel, (gk ? KS.gk : KS.kits).indexOf(KS.sel), gk), kp = ksKpOn(), v3 = KS.view === '3d', tex = KS.view === 'tex';
  if (ksGateOn() && !tex) return `<div class="ksgate" id="ksGate"><span class="ksgateic" aria-hidden="true">📐</span><div>
      <h4>Antes de ver el kit, elegí kitpos_slots.ini</h4>
      <p>KitPos guarda en <span class="mono">content\\kitpos\\kitpos_slots.ini</span> dónde va el nombre y cada número de este kit. El navegador no deja abrir ese archivo solo por su nombre: elegilo una vez y el editor lo recuerda. Así el kit se ve como en el juego.</p>
      <div class="row"><button class="btn primary" type="button" id="ksGatePick">📄 Elegir kitpos_slots.ini</button><button class="btn ghost" type="button" id="ksGateSkip" title="El nombre y los números se muestran con los pasos del config.txt">Ver sin KitPos</button></div></div></div>`;
  const seg = (id, opts, cur) => `<div class="seg k3seg" id="${id}">${opts.map(([v, n]) => `<button type="button" data-v="${v}" aria-pressed="${cur === v}">${n}</button>`).join('')}</div>`;
  const slider = (id, lab, v, min, max, step, fmt) => `<div class="f k3s"><label for="${id}">${lab} <output>${fmt(v)}</output></label><input type="range" class="k3r" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}" style="--p:${((v - min) / (max - min) * 100).toFixed(1)}%"></div>`;
  const dor = ([el, keys]) => { const E = KPL_EL[el], on = kplOn(el), fs = keys.map(([k, n]) => [KS.cfg.fields.find(f => f.key === k), n]).filter(([f]) => f), first = fs[0] && /^(Name|ChestNumberSize)$/.test(fs[0][0].key) ? fs[0] : null;
    const rest = on && !kp ? fs.filter(x => x !== first || el === 'chest') : []; // el pecho y el short se prenden y apagan con "Mostrar en el kit"
    return `<fieldset class="ksdor ${on ? '' : 'off'}" style="--dc:${E.col}"><legend><button type="button" data-dorgo="${el}" title="Llevar la cámara hasta acá y moverlo con los atajos"><i></i>${KS_DECAL_N[el]} <span aria-hidden="true">👁</span></button></legend>
      ${el === 'chest' || el === 'leg' ? `<label class="chk"><input type="checkbox" data-showel="${el}" ${on ? 'checked' : ''}> Mostrar en el kit</label>` : ''}${first && el !== 'chest' ? ctl(...first) : ''}${!on ? `<p class="note">${el === 'chest' ? 'Este kit no lleva número en el pecho.' : el === 'leg' ? 'Este kit no lleva número en el short.' : el === 'name' ? 'El nombre está apagado en este kit.' : 'Escribí un número de prueba arriba.'}</p>` : ''}${rest.map(([f, n]) => ctl(f, n)).join('')}</fieldset>`; };
  const view = `<div class="seg" id="ksView" aria-label="Cómo se muestra el kit">${[['3d', '🎥 3D'], ['mock', '✥ Maqueta plana'], ['tex', '🖼 Texturas']].map(([v, n]) => `<button type="button" data-v="${v}" aria-pressed="${KS.view === v}">${n}</button>`).join('')}</div>`;
  if (tex) return `<section class="ksstage"><div class="row">${view}</div>
    <div class="ksslots">${KS_SLOTS.map(slotCard).join('')}</div>${KS.see ? `<div class="kstex"><canvas id="ksTex"></canvas></div>` : ''}<p class="note">Todo lo que subís o generás se convierte a .ftex (DXT5) con todos sus tamaños internos y se guarda en content\\kit-server\\${esc(KS.path)}\\${esc(KS.sel)}. Si ya había un archivo con ese nombre, la primera vez se guarda una copia .bak-edit21.</p></section>`;
  const G = k3Grade();
  const stage = !v3 ? kplHtml() : `<div class="ks3dwrap ksshow3d" id="ks3dWrap"><div class="ks3d ${L.bg === 'none' ? 'clear' : L.bg === 'game' ? 'game' : ''} ${L.bgGrad !== false ? 'grad' : ''} ${L.floor === false ? 'nofloor' : ''}" style="--k3bg:${esc(L.bgCol || '#1d2633')};--vig:${G.vig}"><canvas id="ks3d" aria-label="Vista 3D del kit: arrastrá para girar, clic derecho o Shift para mover, rueda para acercar; arrastrá el nombre o un número para moverlo"></canvas><canvas class="k3fade" id="ks3dFade" aria-hidden="true"></canvas><span class="k3floor"></span>
      <div class="k3cap">${crest(t, 'k3crest')}<span><b>${esc(tget(t, 'name'))}</b><small>${esc(role)} · ${esc(KS.sel)}</small></span></div>
      ${ksToolsHtml()}
      <div class="k3hud"><span>${KS_HUD()}</span></div></div></div>
    <div class="ksshowbar">
      <div class="k3cam">${[['front', 'Frente'], ['back', 'Espalda'], ['left', 'Izq.'], ['right', 'Der.'], ['threeq', '3/4'], ['close', 'Pecho'], ['reset', '↺ Inicio']].map(([k, n]) => `<button class="btn small" type="button" data-cam="${k}">${n}</button>`).join('')}</div>
      <span class="kssep"></span>
      <button class="btn small primary" type="button" id="k3Game" title="Fondo azul, luz de estudio y la cámara de espalda como en la pantalla de Uniforme del juego">🎮 Vista del juego</button>
      <button class="btn small" type="button" id="ksPresent" title="Pantalla completa con giro automático para mostrar el kit (Esc para salir)">▶ Presentar</button>
      <label class="chk"><input type="checkbox" id="k3Auto"> Giro automático</label><button class="btn small" type="button" id="k3Spin">Vuelta 360°</button>
      <button class="btn small ghost" type="button" id="k3Shot" title="Descargar la imagen tal como se ve">📷 Foto PNG</button><button class="btn small ghost" type="button" id="k3Full" title="El visor ocupa toda la pantalla (Esc para salir)">⛶</button>
    </div>
    <div class="ksshowbar">
      <span class="ksgrp"><span class="lab">Fondo</span>${seg('k3Bg', [['env', 'Entorno'], ['game', 'Juego'], ['none', 'Liso']], L.bg || 'env')}</span>
      <span class="ksgrp"><span class="lab">Manga</span>${seg('k3Sleeve', [['short', 'Corta'], ['long', 'Larga']], K3.sleeve)}</span>
      <span class="ksgrp"><span class="lab">Medias</span>${seg('k3Socks', [['long', 'Largas'], ['middle', 'Medianas'], ['short', 'Cortas']], K3.socks)}</span>
      <span class="ksgrp"><span class="lab">Camiseta</span>${seg('k3Tuck', [['out', 'Afuera'], ['in', 'Adentro']], K3.tuck)}</span>
      <label class="chk"><input type="checkbox" id="k3Cap" ${K3.cap ? 'checked' : ''}> Cinta de capitán</label>
    </div>`;
  const side = v3 ? KS.pane || 'dor' : 'dor', pane = (k, html) => `<div class="kspane" data-pane="${k}" ${side === k ? '' : 'hidden'}>${html}</div>`;
  const nameOk = ksNameFontOk();
  const dorsales = `<div class="row ksample ${ksTexOf('name') && ksTexOf('name').__kp && !ksGenName() ? 'kp' : ''}"><label class="lab" for="ksName">Prueba</label><input type="text" id="ksName" value="${esc(KS.sample.name)}" maxlength="14" aria-label="Nombre de prueba"><input type="text" id="ksNum" value="${esc(KS.sample.num)}" maxlength="2" inputmode="numeric" aria-label="Número de prueba"></div>
    <div class="f"><span class="lab">Letra del nombre</span>${`<div class="seg k3seg" id="ksNameFont">${[['gen', 'Genérica'], ['kit', 'La del kit']].map(([v, n]) => `<button type="button" data-v="${v}" aria-pressed="${(ksGenName() ? 'gen' : 'kit') === v}" ${v === 'kit' && !nameOk ? 'disabled title="La textura del nombre de este kit no tiene letras que se puedan leer"' : ''}>${n}</button>`).join('')}</div>`}</div>
    ${v3 ? `<label class="chk"><input type="checkbox" id="k3Place" ${K3.place ? 'checked' : ''}> ✥ Mover con el mouse en el 3D</label><label class="chk"><input type="checkbox" id="k3Dec" ${L.decals !== false ? 'checked' : ''}> Mostrar nombre y números</label>` : ''}
    ${KS_DORS.map(dor).join('')}
    <p class="note">${kp ? 'KitPos está activo: los valores exactos (con decimales) están en 📐 Posición libre, abajo.' : 'Cada control es un paso del config.txt del kit, como en el juego.'} "Guardar kit" lo anota en el kit.</p>
    ${KPS.st && KPS.st.lua ? `<div class="row" style="gap:6px">${kpsPickBtn()}<button class="btn small" type="button" id="ksGoKpos" title="Bajar hasta el panel de Posición libre (KitPos)">📐 Posición libre</button></div>` : ''}`;
  const luz = `${slider('k3Fov', 'Lente', K3.view.fov || 48, 18, 80, 1, v => v + '°')}${slider('k3AutoS', 'Velocidad del giro', K3.autoSpeed || 1, .2, 3, .1, v => v.toFixed(1) + '×')}
    <div class="k3envs" id="k3Preset">${Object.entries(K3LIGHTS).filter(([k]) => k !== 'hdri' || K3.envUser).map(([k, p]) => `<button type="button" data-v="${k}" aria-pressed="${L.preset === k}"><canvas width="96" height="48" data-envthumb="${k}"></canvas><span>${k === 'hdri' ? esc(K3.envUser.name) : p.n}</span></button>`).join('')}</div>
    <div class="row" style="gap:4px"><button class="btn small" type="button" id="k3Hdri" title="Panorama 360° en .hdr (Radiance) o una imagen equirectangular .jpg/.png">Cargar HDRI…</button><span class="note">Un .hdr da luz y reflejos reales.</span></div>
    <div class="k3sun"><canvas id="k3Sphere" width="132" height="132" aria-label="Dirección de la luz principal: arrastrá el punto de luz"></canvas><div class="k3sunv">${slider('k3Int', 'Intensidad', L.int ?? 1, 0, 2, .05, v => Math.round(v * 100) + '%')}${slider('k3Amb', 'Luz ambiente', L.amb ?? 1, 0, 2, .05, v => Math.round(v * 100) + '%')}${slider('k3Exp', 'Exposición', L.exp ?? 1, .4, 2, .05, v => Math.round(v * 100) + '%')}</div></div>
    <p class="note k3sunt" id="k3SunT">Luz principal: ${Math.round(L.az || 0)}° de giro, ${Math.round(L.el || 0) > 0 ? '+' : ''}${Math.round(L.el || 0)}° de altura. Arrastrá el punto en la esfera.</p>
    ${slider('k3EnvI', 'Reflejos del entorno', L.envInt ?? 1, 0, 2, .05, v => Math.round(v * 100) + '%')}${slider('k3EnvY', 'Girar el entorno', L.envYaw || 0, -180, 180, 5, v => v + '°')}${slider('k3Blur', 'Desenfoque del fondo', L.bgBlur ?? 2, 0, 6, .25, v => v.toFixed(1))}`;
  const pct = v => Math.round(v * 100) + '%';
  const imagen = `<div class="f"><span class="lab">Estilo de la imagen</span><div class="k3looks" id="k3Look">${Object.entries(K3LOOKS).map(([k, p]) => `<button type="button" data-v="${k}" aria-pressed="${(L.look || 'natural') === k}"><span class="k3lk k3lk-${k}" aria-hidden="true"></span><span>${p.n}</span></button>`).join('')}</div></div>
    ${slider('k3GSat', 'Saturación', G.sat, 0, 2, .05, pct)}${slider('k3GCon', 'Contraste', G.con, .5, 1.6, .02, pct)}${slider('k3GWarm', 'Temperatura (frío · cálido)', G.warm, -1, 1, .05, v => (v > 0 ? '+' : '') + Math.round(v * 100))}
    ${slider('k3GVig', 'Viñeta (bordes oscuros)', G.vig, 0, 1, .05, pct)}${slider('k3GGrain', 'Grano de película', G.grain, 0, 1, .05, pct)}${slider('k3GRim', 'Contorno de luz', G.rim, 0, 3, .05, pct)}
    <div class="f"><span class="lab">Resolución</span>${seg('k3GRes', [['0.35', 'PS2'], ['0.6', 'Baja'], ['1', 'Normal'], ['1.5', 'Alta']], String(G.res))}</div>
    <div class="f"><span class="lab">Fondo liso</span><div class="row" style="gap:8px"><input type="color" id="k3BgCol" value="${esc(L.bgCol || '#1d2633')}" aria-label="Color del fondo liso"><label class="chk"><input type="checkbox" id="k3BgGrad" ${L.bgGrad !== false ? 'checked' : ''}> Degradado</label><label class="chk"><input type="checkbox" id="k3Floor" ${L.floor !== false ? 'checked' : ''}> Sombra en el piso</label></div></div>
    <button class="btn small" type="button" id="k3LookReset">↺ Volver a Natural</button>
    <p class="note">El estilo también sale en "📷 Foto PNG" (con fondo liso o de Juego, la foto sale con fondo transparente).</p>`;
  const tela = `<details class="k3pan" ${KS.T.kit && KS.T.kit.c ? 'open' : ''}><summary>Brillo (alfa del kit)</summary>
      ${KS.T.kit && KS.T.kit.c ? `<p class="note">En la textura del kit el alfa marca cuánto brilla cada parte en el juego: blanco brilla más, negro es mate. ${KS.T.kit.g ? 'Este kit trae su propio alfa.' : 'Este kit no trae alfa: se usa un brillo medio parejo.'}</p>
      ${slider('k3Gloss', 'Efecto en pantalla', L.gloss ?? 1, 0, 2, .05, v => Math.round(v * 100) + '%')}
      <div class="seg k3seg" id="k3Dbg">${[[0, 'Kit'], [1, 'Ver brillo'], [2, 'Ver relieve']].map(([v, n]) => `<button type="button" data-v="${v}" aria-pressed="${(K3.debug || 0) === v}">${n}</button>`).join('')}</div>
      ${slider('k3GLv', 'Nivel', ksGlossState().level, -.5, .5, .02, v => (v > 0 ? '+' : '') + Math.round(v * 100))}${slider('k3GCt', 'Contraste', ksGlossState().contrast, 0, 3, .05, v => Math.round(v * 100) + '%')}
      <label class="chk"><input type="checkbox" id="k3GInv" ${ksGlossState().invert ? 'checked' : ''}> Invertir (lo brillante pasa a mate)</label>
      <div class="row" style="gap:4px">${[['mate', 'Todo mate'], ['brillo', 'Todo brillante'], ['colores', 'Desde los colores'], ['original', 'Original']].map(([k, n]) => `<button class="btn small" type="button" data-gfill="${k}">${n}</button>`).join('')}</div>
      <div class="k3brush"><label class="chk"><input type="checkbox" id="k3Paint" ${K3.paint ? 'checked' : ''}> 🖌 Pintar brillo sobre el modelo</label>
        ${slider('k3BSz', 'Tamaño del pincel', (KS.brush || {}).size || 40, 4, 160, 2, v => v + ' px')}${slider('k3BVal', 'Valor (0 mate · 100 brillo)', (KS.brush || {}).value ?? 85, 0, 100, 1, v => v)}${slider('k3BSoft', 'Borde suave', (KS.brush || {}).soft ?? .6, 0, 1, .05, v => Math.round(v * 100) + '%')}
        <div class="row" style="gap:4px"><button class="btn small" type="button" id="k3GUndo">↶ Deshacer pincel</button></div></div>
      <button class="btn small primary" type="button" id="k3GSave" title="Escribe el brillo en el canal alfa de ${esc(ksSlotFile('kit') || '')}.ftex (con copia la primera vez)">Guardar brillo en la textura del kit</button>`
      : '<p class="note">Este kit no tiene la textura suelta (está dentro de los .cpk). Subila en "Texturas" para ver y editar su brillo.</p>'}</details>
    <details class="k3pan"><summary>Tela y relieve</summary>
      <div class="f"><label for="k3Fab">Tela</label><select id="k3Fab">${KMAT.LIST.map(x => `<option value="${x.k}" ${KS.mat.fabric === x.k ? 'selected' : ''} title="${esc(x.d)}">${x.n}</option>`).join('')}</select></div>
      ${slider('k3Rep', 'Tamaño de la trama', KS.mat.repeat, 16, 128, 4, v => v + '×')}${slider('k3Fs', 'Fuerza de la trama', KS.mat.fabricStrength, 0, 1.5, .05, v => Math.round(v * 100) + '%')}${slider('k3Emb', 'Relieve de los dibujos', KS.mat.emboss, 0, 1.5, .05, v => Math.round(v * 100) + '%')}
      <div class="f"><span class="lab">Relieve de los dibujos sacado de</span>${seg('k3ESrc', [['color', 'Los colores'], ['gloss', 'El brillo (alfa)']], KS.mat.src || 'color')}</div>
      ${slider('k3Bump', 'Relieve en pantalla', L.bump ?? 1, 0, 2.5, .05, v => Math.round(v * 100) + '%')}${slider('k3Spec', 'Brillo de la tela', L.spec ?? 1, 0, 2.5, .05, v => Math.round(v * 100) + '%')}
      <label class="chk"><input type="checkbox" id="k3Nrm" ${L.nrm !== false ? 'checked' : ''}> Usar normal map</label>
      <div class="seg k3seg" id="k3NSrc">${[['gen', 'De la tela elegida'], ['kit', 'El del kit']].map(([v, n]) => `<button type="button" data-v="${v}" aria-pressed="${(KS.nsrc || (ksTexOf('nrm') ? 'kit' : 'gen')) === v}" ${v === 'kit' && !ksTexOf('nrm') ? 'disabled title="Este kit no tiene normal map suelto"' : ''}>${n}</button>`).join('')}</div>
      <button class="btn small" type="button" id="k3NrmSave" title="Escribe ${esc(ksBase())}_nrm.ftex y _srm.ftex en la carpeta del kit">Guardar este relieve en el kit</button>
      <p class="note">El juego usa el normal map del kit (_nrm) para el relieve de la tela y de los dibujos que tengan relieve en él.</p></details>`;
  const info = `<p class="note" id="k3Info">${esc(KS.model ? `Modelo: camiseta${cfgGet(KS.cfg, 'TightKit') === '1' ? ' ajustada' : ''}, ${KS.model.collarName ? 'cuello ' + KS.model.collarName.split('_')[1] + (KS.model.collarExact ? '' : ' (el más parecido al ' + cfgGet(KS.cfg, 'Collar') + ')') : 'sin cuello'}, short ${ksN('ShortsModel')}.` : 'Cargando los modelos…')} ${ksTexOf('kit') ? '' : 'Sin textura del kit (está dentro de los .cpk): se pinta con los colores del config. Subí la textura en "Texturas" para verla.'}</p>`;
  return `<div class="ksshow">
      <section class="ksstage">
        <div class="row" style="justify-content:space-between">${view}
          <span class="note">${v3 ? 'Girá el kit con el mouse; el nombre y los números se agarran y se mueven, o con los atajos de abajo a la derecha.' : 'Espalda, frente y short a la vez: agarrá cada cosa y movela.'}</span></div>
        ${stage}
      </section>
      <aside class="ksdors">
        ${v3 ? `<div class="seg ksside" id="ksSide" role="tablist" aria-label="Panel">${[['dor', '🔢', 'Dorsales'], ['luz', '💡', 'Luz'], ['img', '🎨', 'Imagen'], ['tela', '✨', 'Tela']].map(([v, i, n]) => `<button type="button" role="tab" data-v="${v}" aria-pressed="${side === v}"><span aria-hidden="true">${i}</span><span>${n}</span></button>`).join('')}</div>` : '<h4>🔢 Dorsales</h4>'}
        ${pane('dor', dorsales)}${v3 ? pane('luz', luz) + pane('img', imagen) + pane('tela', tela) : ''}
        ${v3 ? info : ''}
      </aside>
    </div>
    ${kposHtml()}`;
}
function bindKitStudio(t, m) {
  ksRerender = () => later(() => { if (S.ttab === 'kits' && (S.tab === 'teams' || S.tab === 'nats')) renderTeams(m); });
  const sh = $('teamSheet'), dz = $('ksDrop');
  if (dz) ksBindDrop(dz, files => ksZipDrop(files, t, m, !(KITS.map.get(t.id) || {}).path)); // también en la tarjeta del equipo sin carpeta (.cpk)
  const mode = $('ksMode'); if (mode) mode.onclick = e => { const b = e.target.closest('[data-v]'); if (!b || KS.mode === b.dataset.v) return; if (b.dataset.v === 'fonts') KPFS.target = KS.team === t.id && KS.sel ? KS.sel : '*'; KS.mode = b.dataset.v; renderTeams(m); };
  sh.querySelectorAll('[data-kpfgo]').forEach(b => b.onclick = () => kpfGoto(t, m));
  if (KS.mode === 'fonts') { if (K3.viewer) { K3.viewer.dispose(); K3.viewer = null; } kpfBindIn(t, m, sh); return; }
  if (!KS.cfg) return;
  if (K3.viewer) { K3.viewer.dispose(); K3.viewer = null; }
  ksBindList(sh, m); if (KS.mode === 'list') return;
  const savePrefs3 = () => { PREFS.k3light = K3.light; savePrefs(); };
  // normal map de la tela elegida (se regenera al mover los controles)
  const genMaps = () => { if ((KS.nsrc || (ksTexOf('nrm') ? 'kit' : 'gen')) === 'kit') { KS.genNrm = null; KS.genSrm = null; return; } KS.genNrm = KMAT.normalMap({ kitCanvas: KS.mat.src === 'gloss' ? ksGloss() : ksTexOf('kit'), fabric: KS.mat.fabric, repeat: KS.mat.repeat, fabricStrength: KS.mat.fabricStrength, emboss: KS.mat.emboss, size: 1024 }); KS.genSrm = KMAT.srm(KS.mat.fabric, 64); };
  if (KS.view === '3d' && !KS.genNrm && (KS.nsrc || (ksTexOf('nrm') ? 'kit' : 'gen')) === 'gen') genMaps();
  const draw = () => {
    const tex = ksDisplayTex();
    if (K3.viewer) { K3.viewer.setCfg(KS.cfg); K3.viewer.setTex(tex); K3.viewer.setMaps(ksMaps()); }
    if (KS.view === 'mock') kplPaint(sh, KS.kplApi, KPL.drag ? KPL.drag.side : null);
    sh.querySelectorAll('canvas[data-slot]').forEach(c => { const T = ksTexOf(c.dataset.slot); if (!T) return; const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); const k = Math.min(c.width / T.width, c.height / T.height); if (KS_SLOTS.find(s => s.k === c.dataset.slot).font) { g.fillStyle = '#2a3038'; g.fillRect(0, 0, c.width, c.height); } g.drawImage(T, (c.width - T.width * k) / 2, (c.height - T.height * k) / 2, T.width * k, T.height * k); });
    const tx = $('ksTex'), T = KS.see && ksTexOf(KS.see); if (tx && T) { tx.width = T.width; tx.height = T.height; tx.getContext('2d').drawImage(T, 0, 0); }
    if (KS.float) KS.float(); // los atajos siguen al recuadro
  };
  KS.draw = draw;
  if (!ksFloatResize) { ksFloatResize = true; addEventListener('resize', () => KS.float && KS.float()); }
  const thumbs = async () => { const P = await k3Pack(), tex = ksDisplayTex(), maps = ksMaps(), M = KS.model; if (!M) return; const a = $('kpCollar'), b = $('kpShorts'), get = k => M.parts.find(p => p.k === k);
    if (a && get('collar')) { const th = k3Thumb([get('shirt'), get('collar')].filter(Boolean), tex, 'collar', 72, maps); a.getContext('2d').clearRect(0, 0, 72, 72); th && a.getContext('2d').drawImage(th, 0, 0); }
    if (b && get('shorts')) { const th = k3Thumb([get('shorts'), get('socks')].filter(Boolean), tex, 'shorts', 72, maps); b.getContext('2d').clearRect(0, 0, 72, 72); th && b.getContext('2d').drawImage(th, 0, 0); }
    if (K3.off) K3.off.model = null; };
  const startViewer = () => { const cv = $('ks3d'); if (!cv || !KS.model || K3.viewer) return; const place = () => K3.place && !K3.paint && K3.light.decals !== false;
    const hud = t => { const h = sh.querySelector('.k3hud span'); if (h) h.textContent = t; };
    const hudIdle = () => hud(KS_HUD());
    const setHot = k => { k = k || KS.tool || null; if (KS.hot === k) return; KS.hot = k; draw(); };
    let grab = null;
    K3.viewer = k3Viewer(cv, KS.model, KS.cfg, ksDisplayTex(), ksMaps(), { grade: true, onPaint: hit => { ksGlossPaint(hit.u, hit.v); K3.viewer.setMaps(ksMaps()); }, onPaintEnd: () => { },
      onHoverHit: hit => { if (!place()) { setHot(null); return false; } const k = hit && ksDecalAt(hit.u, hit.v); setHot(k); if (k) hud(KS_DECAL_N[k] + ': arrastrá para moverlo · rueda para el tamaño'); else hudIdle(); return !!k; },
      onGrab: hit => { if (!place()) return false; const k = ksDecalAt(hit.u, hit.v); if (!k) return false; const b = KS.decals[k]; grab = { k, ox: hit.u * 1024 - b.x, oy: hit.v * 1024 - b.y }; if (KS.tool !== k) KS.tools(k, false); setHot(k); return true; },
      onGrabMove: hit => { if (!grab) return; if (ksKpOn()) { const fv = ksDecalVals0(grab.k, hit.u * 1024 - grab.ox, hit.v * 1024 - grab.oy, true); for (const [key, v] of Object.entries(fv)) ksKpSetSteps(key, v); kpChanged(); hud(KS_DECAL_N[grab.k] + ' (KitPos): ' + Object.entries(fv).map(([key, v]) => key + ' ' + (+v.toFixed(2))).join(', ')); return; } const vals = ksDecalVals(grab.k, hit.u * 1024 - grab.ox, hit.v * 1024 - grab.oy); for (const [key, v] of Object.entries(vals)) if (String(v) !== cfgGet(KS.cfg, key)) setVal(key, v); hud(KS_DECAL_N[grab.k] + ': ' + Object.entries(vals).map(([key, v]) => key + ' = ' + v).join(', ')); },
      onGrabEnd: () => { grab = null; },
      onWheelHit: (hit, dir) => { if (!place()) return false; const k = ksDecalAt(hit.u, hit.v); if (!k) return false; if (ksKpOn()) { const key = KS_DECAL_SIZE[k][0]; ksKpSetSteps(key, ksP(key) + dir * .5); kpChanged(); setHot(k); hud(KS_DECAL_N[k] + ' (KitPos): ' + key + ' paso ' + (+ksP(key).toFixed(2))); return true; } const [key, max] = KS_DECAL_SIZE[k], v = ksClampKey(key, Math.max(0, Math.min(max, ksN(key) + dir))); setVal(key, v); setHot(k); hud(KS_DECAL_N[k] + ': ' + key + ' = ' + v); return true; }, onAuto: on => { const a = $('k3Auto'); if (a) a.checked = on; }, onCamera: () => KS.float && KS.float() });
    if (!K3.viewer) { const i = $('k3Info'); if (i) i.textContent = 'Este navegador no tiene WebGL activado: no se puede mostrar la vista 3D.'; }
    cv.addEventListener('pointerdown', e => { if (K3.paint && e.button === 0 && !e.shiftKey) ksGlossPush(); }, true); };
  const modelKey = () => ['TightKit', 'ShortsModel', 'Collar', 'ShortSleevesModel'].map(k => cfgGet(KS.cfg, k)).join('|') + '|' + K3.sleeve + K3.socks + K3.tuck + K3.cap + KS.sel;
  const ensureModel = () => {
    const key = modelKey(); if (KS.modelKey === key && KS.model) { startViewer(); draw(); thumbs(); return; }
    KS.modelKey = key; k3Load(KS.cfg).then(M => { if (KS.modelKey !== key) return; KS.model = M; KS.shortsModel = null;
      // con el visor abierto, el cambio de piezas se anima (se funde la imagen anterior); si no, se crea
      if (K3.viewer && $('ks3d')) K3.viewer.swap(M, $('ks3dFade')); else startViewer();
      draw(); thumbs(); const i = $('k3Info'); if (i && M.collarName) i.textContent = i.textContent.replace(/cuello [^,]*,/, `cuello ${M.collarName.split('_')[1]}${M.collarExact ? '' : ' (el más parecido al ' + cfgGet(KS.cfg, 'Collar') + ')'},`); }).catch(e => { const i = $('k3Info'); if (i) i.textContent = 'No se pudieron preparar los modelos: ' + e.message; });
  };
  ensureModel();
  const status = () => { const dirty = KS.dirty || kpsDirty(), c = sh.querySelector('.kscard .chip'); if (c) { c.className = 'chip ' + (dirty ? 'warn' : ''); c.textContent = dirty ? 'Cambios sin guardar en el kit' : 'Guardado'; } $('ksSave').disabled = !dirty; $('ksUndo').disabled = !dirty; };
  // posición libre de KitPos: no toca el config.txt, se guarda en kitpos_slots.ini con "Guardar kit"
  const kpChanged = () => { KS.dispKey = ''; if (KPS.sync) KPS.sync(); if (!setVal.raf) setVal.raf = requestAnimationFrame(() => { setVal.raf = 0; draw(); }); status(); };
  const setVal = (k, v) => {
    v = String(v); cfgSet(KS.cfg, k, v);
    if (KS.sync && (k === 'ShirtColor1' || k === 'ShirtColor2')) cfgSet(KS.cfg, k === 'ShirtColor1' ? 'UniColor_Color1' : 'UniColor_Color2', v);
    sh.querySelectorAll(`[data-ks="${k}"]`).forEach(el => { if (el.value !== v) el.value = v; const o = el.parentElement.querySelector('output'); if (o) o.textContent = v; });
    if (KS.sync) for (const [a, b] of [['ShirtColor1', 'UniColor_Color1'], ['ShirtColor2', 'UniColor_Color2']]) if (k === a) sh.querySelectorAll(`[data-ks="${b}"]`).forEach(el => el.value = v);
    if (k === 'Collar' || k === 'ShortsModel') { const b = sh.querySelector(`[data-pick="${k === 'Collar' ? 'collar' : 'shorts'}"] b`); if (b) b.textContent = (k === 'Collar' ? 'Cuello ' : 'Short ') + v; }
    if (['TightKit', 'ShortsModel', 'Collar', 'ShortSleevesModel'].includes(k)) ensureModel();
    if (k === 'Name') later(() => renderTeams(m)); // se muestran u ocultan los controles del nombre
    if (!setVal.raf) setVal.raf = requestAnimationFrame(() => { setVal.raf = 0; draw(); }); status();
  };
  KS.setVal = setVal;
  sh.querySelectorAll('[data-ks]').forEach(el => { const k = el.dataset.ks; el.oninput = el.onchange = () => { if (el.type === 'text' && /Color/.test(k) && !/^#[0-9a-f]{6}$/i.test(el.value)) return; setVal(k, el.type === 'color' ? el.value.toLowerCase() : el.value); }; });
  const on = (id, ev, fn) => { const el = $(id); if (el) el[ev] = fn; return el; };
  on('ksSync', 'onchange', e => { KS.sync = e.target.checked; });
  on('ksView', 'onclick', e => { const b = e.target.closest('[data-v]'); if (b && KS.view !== b.dataset.v) { KS.view = b.dataset.v; renderTeams(m); } });
  on('ksUndo', 'onclick', () => { KS.cfg = cfgParse(KS.orig); KS.dirty = false; if (KPS.cur) { KPS.curText = KPS.orig; KPS.cur = KPOS.parse(KPS.orig); } KS.dispKey = ''; renderTeams(m); });
  on('ksSave', 'onclick', async () => { try { if (KS.dirty) await ksSave(); const kp = await kpsSave(); RATE_GEN++; toast('Kit ' + KS.sel + ' guardado en el juego' + (kp ? ' (posición libre en content\\kitpos\\kitpos_slots.ini)' : '') + '.'); renderTeams(m); } catch (e) { toast('No se pudo guardar: ' + e.message, 7000); } });
  kposBind(sh, kpChanged, () => renderTeams(m));
  KS.kplApi = { cfg: true, set: (k, v) => setVal(k, v), changed: kpChanged };
  on('ksName', 'oninput', e => { const kp = ksTexOf('name') && ksTexOf('name').__kp; KS.sample.name = kp ? e.target.value : e.target.value.toUpperCase().replace(/[^A-Z. ]/g, ''); draw(); });
  on('ksNum', 'oninput', e => { KS.sample.num = e.target.value.replace(/\D/g, '').slice(0, 2); draw(); });
  // vista 3D
  const V3 = () => K3.viewer;
  sh.querySelectorAll('[data-cam]').forEach(b => b.onclick = () => V3() && V3()[b.dataset.cam]());
  on('k3Spin', 'onclick', () => V3() && V3().spin());
  on('k3Auto', 'onchange', e => V3() && V3().auto(e.target.checked));
  // como la pantalla de Uniforme del juego: fondo azul, luz de estudio y el jugador de espalda, de la cintura para arriba
  on('k3Game', 'onclick', () => { Object.assign(K3.light, { bg: 'game', preset: 'estudio' }); K3.view.fov = 30; savePrefs3(); renderTeams(m); requestAnimationFrame(() => { const v = V3(); if (v) { const f = v.fit(); v.go({ yaw: Math.PI, pitch: .04, dist: f.radius * 3.3, panX: 0, panY: f.radius * .28, fov: 30 }); } }); });
  on('k3Full', 'onclick', () => { const w = $('ks3dWrap'); if (!w) return; if (document.fullscreenElement) document.exitFullscreen(); else w.requestFullscreen && w.requestFullscreen().then(() => V3() && V3().redraw()).catch(e => toast('No se pudo poner en pantalla completa: ' + e.message, 5000)); });
  on('k3Shot', 'onclick', () => { if (!V3()) return; const a = document.createElement('a'); a.href = V3().shot(); a.download = (tget(t, 'name') + ' ' + KS.sel).replace(/[\\/:*?"<>|]/g, '') + '.png'; a.click(); });
  for (const [id, key] of [['k3Sleeve', 'sleeve'], ['k3Socks', 'socks'], ['k3Tuck', 'tuck']]) on(id, 'onclick', e => { const b = e.target.closest('[data-v]'); if (!b || K3[key] === b.dataset.v) return; K3[key] = b.dataset.v; $(id).querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); ensureModel(); });
  on('k3Cap', 'onchange', e => { K3.cap = e.target.checked; ensureModel(); });
  on('k3Dec', 'onchange', e => { K3.light.decals = e.target.checked; savePrefs3(); draw(); });
  on('k3Place', 'onchange', e => { K3.place = e.target.checked; if (!K3.place) { KS.hot = KS.tool || null; draw(); } const h = sh.querySelector('.k3hud span'); if (h) h.textContent = KS_HUD(); });
  // atajos del 3D (ksToolsHtml): elegir qué mover lleva la cámara hasta ahí; deslizadores al lado del recuadro y el teclado
  const look = k => { const v = V3(); if (!v) return; const f = v.fit(); v.go(k === 'chest' ? { yaw: 0, pitch: .05, dist: f.radius * 1.05, panX: 0, panY: f.radius * .5, fov: 48 } : k === 'leg' ? { yaw: 0, pitch: .05, dist: f.radius * 1.25, panX: 0, panY: -f.radius * .45, fov: 48 } : { yaw: Math.PI, pitch: .08, dist: f.radius * 2.1, panX: 0, panY: f.radius * .28, fov: 48 }); };
  const tVal = () => { const o = $('k3TVal'), E = KS.tool && KPL_EL[KS.tool]; if (o && E) o.textContent = [...E.move, E.size].map(kplVal).join(' · ');
    sh.querySelectorAll('.k3sl').forEach(w => { const [lo, hi] = ksSlideRange(w.dataset.k); let p = Math.max(0, Math.min(1, (ksP(w.dataset.k) - lo) / (hi - lo))); if (w.dataset.flip === '1') p = 1 - p; w.style.setProperty('--kp', p.toFixed(3)); }); }; // (--p ya está registrada en el CSS como porcentaje)
  const act = (a, fast) => { const el = KS.tool; if (!el) return; const n = fast ? 4 : 1, A = KS.kplApi;
    const r = { bigger: ['size', n], smaller: ['size', -n], wider: ['wide', n], narrower: ['wide', -n], arcp: ['arc', n], arcm: ['arc', -n] }[a], k = r ? kplNudge(el, r[0], r[1], A) : kplNudge(el, a, n, A);
    if (k) { kpChanged(); tVal(); } };
  const bindTools = () => {
    const box = $('k3Tools'); if (!box) return;
    box.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => KS.tools(KS.tool === b.dataset.tool ? null : b.dataset.tool));
    // deslizadores: la altura y el costado van hacia donde se mueve en pantalla; tamaño, ancho y curva, más arriba = más
    const E = KS.tool && KPL_EL[KS.tool];
    box.querySelectorAll('.k3sl').forEach(w => { const k = w.dataset.k, tk = w.querySelector('.k3tr'), h = w.classList.contains('h');
      if (E && E.move.includes(k) && kplCan(KS.tool, KS.kplApi)) { const g = kplGrad(KS.tool, k, kplMap(E.side), KS.kplApi); if (g) w.dataset.flip = h ? +(g.x < 0) : +(g.y > 0); }
      const flip = w.dataset.flip === '1', [lo, hi] = ksSlideRange(k), from = e => { const r = tk.getBoundingClientRect(), p = Math.max(0, Math.min(1, h ? (e.clientX - r.left) / r.width : (r.bottom - e.clientY) / r.height)); return flip ? hi - p * (hi - lo) : lo + p * (hi - lo); };
      const put = v => { if (!kplCan(KS.tool, KS.kplApi)) return; kplPut(k, v, KS.kplApi); kpChanged(); tVal(); };
      let on = false;
      tk.onpointerdown = e => { if (e.button) return; e.preventDefault(); on = true; tk.setPointerCapture(e.pointerId); w.classList.add('drag'); put(from(e)); };
      tk.onpointermove = e => { if (on) put(from(e)); };
      tk.onpointerup = tk.onpointercancel = () => { on = false; w.classList.remove('drag'); };
      w.onwheel = e => { e.preventDefault(); put(ksP(k) + kplStep() * (e.deltaY < 0 ? 1 : -1) * (flip ? -1 : 1)); };
      w.querySelectorAll('.k3si').forEach((ic, i) => ic.onclick = () => put(ksP(k) + kplStep() * ((i === 0) === !h ? 1 : -1) * (flip ? -1 : 1))); });
    // agregar o quitar el número del pecho, el del short o el nombre; tipo de número (7 o 07)
    box.querySelectorAll('[data-addel],[data-delel]').forEach(b => b.onclick = () => { const add = b.dataset.addel, el = add || b.dataset.delel; ksShowEl(el, !!add, setVal); KS.tool = add ? el : null; KS.lookAt = add ? el : null; kpChanged(); later(() => renderTeams(m)); });
    const ty = $('k3Type'); if (ty) ty.onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; setVal('BackNumberType', b.dataset.v); ty.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); };
    // manija de la curva, arriba del nombre: arrastrar hacia arriba curva más, hacia abajo menos (o al revés)
    const arc = $('k3Arc'); if (arc) { let D = null;
      arc.onpointerdown = e => { if (e.button || !KS.tool || !kplCan(KS.tool, KS.kplApi)) return; e.preventDefault(); const k = KPL_EL[KS.tool].arc; if (!k) return; D = { y: e.clientY, k, s: ksP(k) }; arc.setPointerCapture(e.pointerId); arc.classList.add('drag'); };
      arc.onpointermove = e => { if (!D) return; kplPut(D.k, D.s - (e.clientY - D.y) / 18, KS.kplApi); kpChanged(); tVal(); };
      arc.onpointerup = arc.onpointercancel = () => { D = null; arc.classList.remove('drag'); }; }
    tVal();
  };
  // los atajos van pegados al recuadro del elegido: se proyectan sus esquinas a la pantalla (si se ve de este lado)
  const ksFloat = () => { if (ksFloat.raf) return; ksFloat.raf = requestAnimationFrame(() => { ksFloat.raf = 0;
    const f = $('k3Float'), arc = $('k3Arc'), hint = $('k3THint'), st = sh.querySelector('.ks3d'), v = V3(), el = KS.tool, b = el && KS.decals && KS.decals[el]; if (!f || !st) return;
    const pts = v && b && v.project ? [[0, 0], [-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]].map(([a, c]) => v.project((b.x + a * b.w) / 1024, (b.y + c * b.h) / 1024)).filter(Boolean) : [];
    const show = pts.length >= 2; f.hidden = !show; if (arc) arc.hidden = !show; if (hint) hint.textContent = !el ? tr('Elegí qué mover') : show ? '' : tr('Girá el kit para ver {x}').replace('{x}', tr(KPL_EL[el].n).toLowerCase());
    if (!show) return; const xs = pts.map(p => p.x), ys = pts.map(p => p.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), W = st.clientWidth, H = st.clientHeight, fw = f.offsetWidth, fh = f.offsetHeight;
    let left = x1 + 16; if (left + fw > W - 8) left = x0 - 16 - fw; left = Math.max(8, Math.min(W - fw - 8, left));
    const cap = st.querySelector('.k3cap'), t0 = cap ? cap.offsetTop + cap.offsetHeight + 8 : 8; // sin tapar el nombre del equipo
    f.style.left = left + 'px'; f.style.top = Math.max(t0, Math.min(H - fh - 8, (y0 + y1) / 2 - fh / 2)) + 'px';
    if (arc) { arc.style.left = Math.max(8, Math.min(W - arc.offsetWidth - 8, (x0 + x1) / 2 - arc.offsetWidth / 2)) + 'px'; arc.style.top = Math.max(8, y0 - arc.offsetHeight - 10) + 'px'; }
  }); };
  KS.float = ksFloat;
  KS.tools = (k, cam = true) => {
    KS.tool = k && kplOn(k) ? k : null; KS.hot = KS.tool; if (KS.tool) KPL.sel = KS.tool;
    const box = $('k3Tools'); if (box) { box.outerHTML = ksToolsHtml(); bindTools(); }
    if (KS.tool && cam) { look(KS.tool); const cv = $('ks3d'); if (cv) cv.focus({ preventScroll: true }); }
    draw(); ksFloat(); const h = sh.querySelector('.k3hud span'); if (h) h.textContent = KS_HUD();
  };
  if (KS.tool && !kplOn(KS.tool)) KS.tool = null;
  bindTools(); ksFloat(); if (KS.lookAt && V3()) look(KS.lookAt); KS.lookAt = null;
  // teclado con el foco en el visor: 1 a 4 eligen, flechas mueven, + y − tamaño, [ ] curva, , . ancho; Esc suelta (las flechas vuelven a girar la cámara)
  const wrap = $('ks3dWrap');
  if (wrap) wrap.addEventListener('keydown', e => {
    if (e.target.matches('input,select,textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
    const stop = () => { e.preventDefault(); e.stopPropagation(); };
    if (/^[1-4]$/.test(e.key)) { const el = Object.keys(KPL_EL)[+e.key - 1]; if (kplOn(el)) { stop(); KS.tools(el); } return; }
    if (!KS.tool) return;
    if (e.key === 'Escape') { if (!document.fullscreenElement) { stop(); KS.tools(null); } return; }
    const a = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', '+': 'bigger', '=': 'bigger', '-': 'smaller', '_': 'smaller', ']': 'arcp', '[': 'arcm', '.': 'wider', ',': 'narrower' }[e.key];
    if (a) { stop(); act(a, e.shiftKey); }
  }, true);
  // 👁 en cada grupo de dorsales: lleva la cámara y lo deja listo para los atajos (en la maqueta, lo elige)
  sh.querySelectorAll('[data-dorgo]').forEach(b => b.onclick = () => { const k = b.dataset.dorgo; if (KS.view === 'mock') { KPL.sel = k; draw(); kplInfo(sh.querySelector('#kplBox'), KS.kplApi); return; } if (kplOn(k)) KS.tools(k); else look(k); });
  on('ksPresent', 'onclick', () => { const w = $('ks3dWrap'); if (!w || !w.requestFullscreen) return; w.requestFullscreen().then(() => { w.classList.add('present'); const v = V3(); if (!v) return; v.redraw(); v.threeq(); v.auto(true); const a = $('k3Auto'); if (a) a.checked = true; }).catch(e => toast('No se pudo poner en pantalla completa: ' + e.message, 5000)); });
  if (wrap) wrap.onfullscreenchange = () => { if (!document.fullscreenElement) wrap.classList.remove('present'); };
  sh.querySelectorAll('.ksdors [data-kppick]').forEach(b => b.onclick = () => kpsPickRun(() => renderTeams(m)));
  on('ksGoKpos', 'onclick', () => { const k = $('kposBox'); if (k) { k.scrollIntoView({ behavior: ANIM.reduce.matches ? 'auto' : 'smooth', block: 'start' }); k.classList.remove('flash'); k.getBoundingClientRect(); k.classList.add('flash'); } });
  sh.querySelectorAll('[data-showel]').forEach(c => c.onchange = () => { ksShowEl(c.dataset.showel, c.checked, setVal); KS.tool = c.checked ? c.dataset.showel : null; KS.lookAt = KS.tool; kpChanged(); later(() => renderTeams(m)); });
  // paneles del costado, letra del nombre y el aviso de kitpos_slots.ini
  on('ksSide', 'onclick', e => { const b = e.target.closest('[data-v]'); if (!b) return; KS.pane = b.dataset.v; $('ksSide').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); sh.querySelectorAll('.kspane').forEach(p => p.hidden = p.dataset.pane !== KS.pane); });
  on('ksNameFont', 'onclick', e => { const b = e.target.closest('[data-v]'); if (!b || b.disabled) return; PREFS.ksNameFont = b.dataset.v; savePrefs(); renderTeams(m); });
  on('ksGatePick', 'onclick', async () => { try { if (await kpsPick()) { toast('kitpos_slots.ini elegido: el editor lo recuerda.'); renderTeams(m); } } catch (e) { toast('No se pudo usar: ' + e.message, 7000); } });
  on('ksGateSkip', 'onclick', () => { KS.gateSkip = true; renderTeams(m); });
  // sliders con relleno de color hasta el valor
  const fillR = el => { el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min) * 100).toFixed(1) + '%'); };
  sh.querySelectorAll('input.k3r').forEach(el => el.addEventListener('input', () => fillR(el)));
  const relight = (ms = 140) => { K3TW.ms = ms; V3() && V3().redraw(); };
  on('k3Preset', 'onclick', e => { const b = e.target.closest('[data-v]'); if (!b) return; K3.light.preset = b.dataset.v; savePrefs3(); $('k3Preset').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); relight(700); });
  // miniaturas de cada entorno
  sh.querySelectorAll('canvas[data-envthumb]').forEach(c => { const k = c.dataset.envthumb, e = k === 'hdri' ? K3.envUser : K3ENV.scene(K3LIGHTS[k].env); if (e) c.getContext('2d').drawImage(e.canvas, 0, 0, c.width, c.height); });
  on('k3Hdri', 'onclick', () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.hdr,.jpg,.jpeg,.png,.webp'; inp.onchange = async () => { const f = inp.files[0]; if (!f) return; try { toast('Preparando ' + f.name + '…', 30000); K3.envUser = await K3ENV.fromFile(f); K3.light.preset = 'hdri'; K3.light.az = 0; K3.light.el = 0; savePrefs3(); toast('Entorno ' + f.name + ' cargado: la luz principal sigue al punto más brillante del panorama.', 6000); renderTeams(m); } catch (e) { toast('No se pudo usar ese HDRI: ' + e.message, 7000); } }; inp.click(); });
  const sl = (id, fn, fmt) => on(id, 'oninput', e => { const v = +e.target.value; fn(v); const o = e.target.parentElement.querySelector('output'); if (o) o.textContent = fmt(v); });
  sl('k3Fov', v => { K3.view.fov = v; V3() && V3().redraw(); }, v => v + '°');
  sl('k3AutoS', v => { K3.autoSpeed = v; }, v => v.toFixed(1) + '×');
  sl('k3Int', v => { K3.light.int = v; savePrefs3(); relight(); }, v => Math.round(v * 100) + '%');
  sl('k3Amb', v => { K3.light.amb = v; savePrefs3(); relight(); }, v => Math.round(v * 100) + '%');
  sl('k3Exp', v => { K3.light.exp = v; savePrefs3(); relight(); }, v => Math.round(v * 100) + '%');
  sl('k3EnvI', v => { K3.light.envInt = v; savePrefs3(); relight(); }, v => Math.round(v * 100) + '%');
  sl('k3EnvY', v => { K3.light.envYaw = v; savePrefs3(); relight(60); }, v => v + '°');
  sl('k3Blur', v => { K3.light.bgBlur = v; savePrefs3(); V3() && V3().redraw(); }, v => v.toFixed(1));
  on('k3Bg', 'onclick', e => { const b = e.target.closest('[data-v]'); if (!b) return; K3.light.bg = b.dataset.v; savePrefs3(); $('k3Bg').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); const d3 = sh.querySelector('.ks3d'); d3.classList.toggle('clear', b.dataset.v === 'none'); d3.classList.toggle('game', b.dataset.v === 'game'); V3() && V3().redraw(); });
  // imagen del visor: un estilo carga todos los ajustes; mover uno a mano deja el estilo sin marcar
  const gPct = v => Math.round(v * 100) + '%', GSL = [['k3GSat', 'sat', gPct], ['k3GCon', 'con', gPct], ['k3GWarm', 'warm', v => (v > 0 ? '+' : '') + Math.round(v * 100)], ['k3GVig', 'vig', gPct], ['k3GGrain', 'grain', gPct], ['k3GRim', 'rim', gPct]];
  const gShow = () => { const G = k3Grade(), d3 = sh.querySelector('.ks3d'); if (d3) d3.style.setProperty('--vig', G.vig);
    GSL.forEach(([id, k, f]) => { const el = $(id); if (!el) return; el.value = G[k]; fillR(el); const o = el.parentElement.querySelector('output'); if (o) o.textContent = f(G[k]); });
    const r = $('k3GRes'); if (r) r.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', +x.dataset.v === G.res));
    const lk = $('k3Look'); if (lk) lk.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === (K3.light.look || ''))); V3() && V3().redraw(); };
  const gLook = k => { const P = K3LOOKS[k]; if (!P) return; K3.light.look = k; for (const q of K3LOOK_KEYS) K3.light['g_' + q] = P[q]; savePrefs3(); gShow(); };
  on('k3Look', 'onclick', e => { const b = e.target.closest('[data-v]'); if (b) gLook(b.dataset.v); });
  on('k3LookReset', 'onclick', () => gLook('natural'));
  GSL.forEach(([id, k, f]) => sl(id, v => { K3.light['g_' + k] = v; K3.light.look = ''; savePrefs3(); gShow(); }, f));
  on('k3GRes', 'onclick', e => { const b = e.target.closest('[data-v]'); if (!b) return; K3.light.g_res = +b.dataset.v; K3.light.look = ''; savePrefs3(); gShow(); });
  // fondo liso: el color elegido pasa el fondo a "Liso"
  const bgSet = () => { const d3 = sh.querySelector('.ks3d'), L = K3.light; if (!d3) return; d3.style.setProperty('--k3bg', L.bgCol || '#1d2633'); d3.classList.toggle('grad', L.bgGrad !== false); d3.classList.toggle('nofloor', L.floor === false); d3.classList.toggle('clear', L.bg === 'none'); d3.classList.toggle('game', L.bg === 'game');
    const bg = $('k3Bg'); if (bg) bg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === (L.bg || 'env'))); V3() && V3().redraw(); };
  on('k3BgCol', 'oninput', e => { K3.light.bgCol = e.target.value; K3.light.bg = 'none'; savePrefs3(); bgSet(); });
  on('k3BgGrad', 'onchange', e => { K3.light.bgGrad = e.target.checked; savePrefs3(); bgSet(); });
  on('k3Floor', 'onchange', e => { K3.light.floor = e.target.checked; savePrefs3(); bgSet(); });
  sl('k3Bump', v => { K3.light.bump = v; savePrefs3(); V3() && V3().redraw(); }, v => Math.round(v * 100) + '%');
  sl('k3Spec', v => { K3.light.spec = v; savePrefs3(); relight(); }, v => Math.round(v * 100) + '%');
  // esfera de luz: arrastrar el punto mueve la luz principal
  const sph = $('k3Sphere');
  if (sph) {
    const paintS = () => { const g = sph.getContext('2d'), W = sph.width, R0 = W / 2 - 8, cx = W / 2, cy = W / 2, az = (K3.light.az || 0) * Math.PI / 180, el = (K3.light.el || 0) * Math.PI / 180;
      const P = K3LIGHTS[K3.light.preset] || K3LIGHTS.estudio, ka = (P.key[0] * Math.PI / 180) + az, ke = Math.max(-1.3, Math.min(1.5, P.key[1] * Math.PI / 180 + el)), lx = Math.sin(ka) * Math.cos(ke), ly = Math.sin(ke), lz = Math.cos(ka) * Math.cos(ke);
      g.clearRect(0, 0, W, W); const im = g.createImageData(W, W);
      for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const nx = (x - cx) / R0, ny = -(y - cy) / R0, r2 = nx * nx + ny * ny; if (r2 > 1) continue; const nz = Math.sqrt(1 - r2), d = Math.max(0, nx * lx + ny * ly + nz * lz), hz = Math.pow(Math.max(0, nx * lx * .5 + ny * ly * .5 + nz * (lz * .5 + .5)), 40), v = 30 + d * 190 + hz * 60, i = (y * W + x) * 4; im.data[i] = v * .92; im.data[i + 1] = v * .95; im.data[i + 2] = v; im.data[i + 3] = 255; }
      g.putImageData(im, 0, 0); g.strokeStyle = '#ffffff22'; g.beginPath(); g.arc(cx, cy, R0, 0, Math.PI * 2); g.stroke();
      if (lz > -0.05) { const px = cx + lx * R0, py = cy - ly * R0; g.fillStyle = '#ffd84a'; g.strokeStyle = '#0008'; g.lineWidth = 2; g.beginPath(); g.arc(px, py, 7, 0, Math.PI * 2); g.fill(); g.stroke(); }
      else { g.fillStyle = '#ffd84a99'; g.font = '11px sans-serif'; g.textAlign = 'center'; g.fillText('luz detrás', cx, cy + R0 + 6); }
      const tt = $('k3SunT'); if (tt) tt.textContent = `Luz principal: ${Math.round(K3.light.az || 0)}° de giro, ${Math.round(K3.light.el || 0) > 0 ? '+' : ''}${Math.round(K3.light.el || 0)}° de altura. Arrastrá el punto en la esfera.`; };
    paintS(); KS.paintSphere = paintS;
    let sd = false; const setFrom = e => { const r = sph.getBoundingClientRect(), W = r.width, R0 = W / 2 - 8 * W / sph.width, nx = (e.clientX - r.left - W / 2) / R0, ny = -(e.clientY - r.top - W / 2) / R0, r2 = Math.min(1, nx * nx + ny * ny), nz = Math.sqrt(1 - r2), l = Math.hypot(nx, ny, nz) || 1;
      const P = K3LIGHTS[K3.light.preset] || K3LIGHTS.estudio, a = Math.atan2(nx / l, nz / l) * 180 / Math.PI, e2 = Math.asin(Math.max(-1, Math.min(1, ny / l))) * 180 / Math.PI;
      K3.light.az = Math.round(((a - P.key[0] + 540) % 360) - 180); K3.light.el = Math.round(Math.max(-30, Math.min(60, e2 - P.key[1]))); paintS(); relight(60); };
    sph.onpointerdown = e => { sd = true; sph.setPointerCapture(e.pointerId); setFrom(e); }; sph.onpointermove = e => { if (sd) setFrom(e); }; sph.onpointerup = sph.onpointercancel = () => { if (sd) savePrefs3(); sd = false; };
    sph.ondblclick = () => { K3.light.az = 0; K3.light.el = 0; savePrefs3(); paintS(); relight(500); };
  }
  // brillo (alfa)
  const glossUpd = () => { V3() && V3().setMaps(ksMaps()); if (KS.view === 'mock') draw(); };
  sl('k3Gloss', v => { K3.light.gloss = v; savePrefs3(); V3() && V3().redraw(); }, v => Math.round(v * 100) + '%');
  on('k3Dbg', 'onclick', e => { const b = e.target.closest('[data-v]'); if (!b) return; K3.debug = +b.dataset.v; $('k3Dbg').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); V3() && V3().redraw(); });
  sl('k3GLv', v => { ksGlossState().level = v; ksGlossState().changed = true; glossUpd(); }, v => (v > 0 ? '+' : '') + Math.round(v * 100));
  sl('k3GCt', v => { ksGlossState().contrast = v; ksGlossState().changed = true; glossUpd(); }, v => Math.round(v * 100) + '%');
  on('k3GInv', 'onchange', e => { ksGlossState().invert = e.target.checked; ksGlossState().changed = true; glossUpd(); });
  sh.querySelectorAll('[data-gfill]').forEach(b => b.onclick = () => { ksGlossFill(b.dataset.gfill); if (b.dataset.gfill === 'original') renderTeams(m); else glossUpd(); });
  on('k3Paint', 'onchange', e => { K3.paint = e.target.checked; if (K3.paint && !K3.debug) { K3.debug = 1; } renderTeams(m); });
  sl('k3BSz', v => { (KS.brush || (KS.brush = { size: 40, value: 85, soft: .6 })).size = v; }, v => v + ' px');
  sl('k3BVal', v => { (KS.brush || (KS.brush = { size: 40, value: 85, soft: .6 })).value = v; }, v => v);
  sl('k3BSoft', v => { (KS.brush || (KS.brush = { size: 40, value: 85, soft: .6 })).soft = v; }, v => Math.round(v * 100) + '%');
  on('k3GUndo', 'onclick', () => { if (ksGlossUndo()) glossUpd(); else toast('No hay pinceladas para deshacer.'); });
  on('k3GSave', 'onclick', async e => { const b = e.target; b.disabled = true; try { const f = await ksGlossSave(p => { b.textContent = 'Guardando… ' + Math.round(p * 100) + '%'; }); toast('Brillo guardado en el alfa de ' + f + '.', 6000); renderTeams(m); } catch (er) { b.disabled = false; b.textContent = 'Guardar brillo en la textura del kit'; toast('No se pudo guardar el brillo: ' + er.message, 7000); } });
  const regen = () => { if (regen.t) clearTimeout(regen.t); regen.t = setTimeout(() => { genMaps(); V3() && V3().setMaps(ksMaps()); }, 60); };
  on('k3Fab', 'onchange', e => { KS.mat.fabric = e.target.value; KS.nsrc = 'gen'; $('k3NSrc') && $('k3NSrc').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === 'gen')); regen(); });
  on('k3ESrc', 'onclick', e => { const b = e.target.closest('[data-v]'); if (!b) return; KS.mat.src = b.dataset.v; KS.nsrc = 'gen'; $('k3ESrc').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); regen(); });
  sl('k3Rep', v => { KS.mat.repeat = v; regen(); }, v => v + '×'); sl('k3Fs', v => { KS.mat.fabricStrength = v; regen(); }, v => Math.round(v * 100) + '%'); sl('k3Emb', v => { KS.mat.emboss = v; regen(); }, v => Math.round(v * 100) + '%');
  on('k3Nrm', 'onchange', e => { K3.light.nrm = e.target.checked; savePrefs3(); V3() && V3().setMaps(ksMaps()); });
  on('k3NSrc', 'onclick', e => { const b = e.target.closest('[data-v]'); if (!b || b.disabled) return; KS.nsrc = b.dataset.v; $('k3NSrc').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); genMaps(); V3() && V3().setMaps(ksMaps()); });
  const saveRelief = async (which = ['nrm', 'srm']) => {
    try { toast('Armando el normal map a 2048 px…', 60000); await new Promise(r => setTimeout(r, 30));
      const out = [];
      if (which.includes('nrm')) { const big = KMAT.normalMap({ kitCanvas: KS.mat.src === 'gloss' ? ksGloss() : ksTexOf('kit'), fabric: KS.mat.fabric, repeat: KS.mat.repeat, fabricStrength: KS.mat.fabricStrength, emboss: KS.mat.emboss, size: 2048 }); out.push(await ksWriteTex(KS_SLOTS[1], big, { progress: p => { const tt = $('toast'); if (tt && tt.firstChild) tt.firstChild.textContent = 'Guardando el normal map… ' + Math.round(p * 100) + '%'; } })); KS.T.nrm.c = KS.genNrm || KMAT.normalMap({ kitCanvas: ksTexOf('kit'), fabric: KS.mat.fabric, repeat: KS.mat.repeat, fabricStrength: KS.mat.fabricStrength, emboss: KS.mat.emboss, size: 1024 }); }
      if (which.includes('srm')) { out.push(await ksWriteTex(KS_SLOTS[2], KMAT.srm(KS.mat.fabric, 512))); KS.T.srm.c = KMAT.srm(KS.mat.fabric, 64); }
      toast('Guardado en la carpeta del kit: ' + out.join(' y ') + '.' + (KS.dirty ? ' Tocá "Guardar kit" para anotar el nombre de la textura en el config.txt.' : ''), 8000); renderTeams(m);
    } catch (e) { toast('No se pudo guardar el relieve: ' + e.message, 7000); }
  };
  on('k3NrmSave', 'onclick', () => saveRelief());
  // modelo
  sh.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => ksPicker(b.dataset.pick, m));
  // texturas
  sh.querySelectorAll('[data-upl]').forEach(b => b.onclick = () => ksUpload(KS_SLOTS.find(s => s.k === b.dataset.upl), m));
  sh.querySelectorAll('[data-fontgen]').forEach(b => b.onclick = () => ksFontModal(m));
  sh.querySelectorAll('[data-see]').forEach(b => b.onclick = () => { KS.see = b.dataset.see; renderTeams(m); });
  sh.querySelectorAll('[data-nrmsave]').forEach(b => b.onclick = () => saveRelief(['nrm']));
  sh.querySelectorAll('[data-srmsave]').forEach(b => b.onclick = () => saveRelief(['srm']));
  // ubicar: mover nombre y números a mano sobre la maqueta (kitplace.js)
  if (KS.view === 'mock') kplBind(sh, KS.kplApi);
}
// Uniformes y la tira de kits del Editor: abrir, ordenar, copiar y borrar
function ksBindList(sh, m) {
  sh.querySelectorAll('[data-open]').forEach(b => b.onclick = async () => {
    const n = b.dataset.open;
    if (n !== KS.sel) { if (KS.dirty && !await confirmBox('Hay cambios sin guardar en ' + KS.sel + '. ¿Descartarlos?')) return; try { await ksOpenKit(n); KS.genNrm = null; KS.nsrc = null; } catch (e) { toast(e.message, 6000); return; } }
    KS.mode = 'edit'; renderTeams(m);
  });
  sh.querySelectorAll('canvas[data-kth]').forEach(c => { const [n, k] = c.dataset.kth.split(':'), T = KS.thumbs[n] && KS.thumbs[n][k] && KS.thumbs[n][k].c; if (!T) return; const g = c.getContext('2d'), z = Math.min(c.width / T.width, c.height / T.height); if (k !== 'kit') { g.fillStyle = '#2a3038'; g.fillRect(0, 0, c.width, c.height); } g.drawImage(T, (c.width - T.width * z) / 2, (c.height - T.height * z) / 2, T.width * z, T.height * z); });
  if (KS.mode === 'list') ksLoadThumbs();
  // lista de kits
  sh.querySelectorAll('[data-kit]').forEach(b => b.onclick = async () => {
    if (KS.dirty && !await confirmBox('Hay cambios sin guardar en ' + KS.sel + '. ¿Descartarlos?')) return;
    try { await ksOpenKit(b.dataset.kit); KS.genNrm = null; KS.nsrc = null; } catch (e) { toast(e.message, 6000); } renderTeams(m);
  });
  sh.querySelectorAll('[data-up]').forEach(b => b.onclick = async () => {
    const n = b.dataset.up, gk = KS.gk.includes(n), list = gk ? KS.gk : KS.kits, i = list.indexOf(n); if (i < 1) return;
    [list[i - 1], list[i]] = [list[i], list[i - 1]];
    try { await ksWriteOrder(gk ? 'gk_order.ini' : 'order.ini', list); ksRefreshKitsMap(); RATE_GEN++; toast('Orden de kits guardado.'); } catch (e) { [list[i - 1], list[i]] = [list[i], list[i - 1]]; toast('No se pudo guardar el orden: ' + e.message, 6000); }
    renderTeams(m);
  });
  sh.querySelectorAll('[data-dup], [data-dupgk]').forEach(b => b.onclick = async () => {
    if (KS.dirty && !await confirmBox('Hay cambios sin guardar en ' + KS.sel + '. ¿Descartarlos?')) return;
    const from = b.dataset.dup || b.dataset.dupgk, toGk = !!b.dataset.dupgk;
    try { const nn = await ksDuplicate(from, toGk ? true : undefined); await ksOpenKit(nn); RATE_GEN++; toast(toGk ? 'Kit de arquero ' + nn + ' creado como copia de ' + from + '. Cambiale los colores y guardalo.' : 'Kit ' + nn + ' creado como copia de ' + from + '.', 6000); } catch (e) { toast('No se pudo duplicar: ' + e.message, 6000); }
    renderTeams(m);
  });
  sh.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    const n = b.dataset.del;
    if (!await confirmBox('¿Borrar el kit ' + n + '? Deja de aparecer en el juego. Su carpeta se guarda en ' + KS.path + '\\_borrados por si lo querés recuperar.')) return;
    try { const tn = await ksDelete(n); delete KS.thumbs[n]; if (KS.sel === n) { KS.dirty = false; await ksOpenKit(KS.kits[0] || KS.gk[0]); } RATE_GEN++; toast('Kit ' + n + ' borrado. Copia en _borrados\\' + tn + '.', 6000); } catch (e) { toast('No se pudo borrar: ' + e.message, 6000); }
    renderTeams(m);
  });
}

// ---- cargar kits arrastrando un .zip (o texturas sueltas) a Uniformes; la lógica sin DOM está en kitzip.js (KZIP) ----
function ksDropHtml() {
  return `<div class="ksdrop" id="ksDrop" tabindex="0" role="button" aria-label="Cargar un kit desde un .zip o imágenes"><span class="ksdropi" aria-hidden="true">📦</span><div><b>Arrastrá acá un kit en .zip (o tocá para elegirlo)</b><small>Sirven las texturas del juego (.ftex, .dds) o imágenes (.png, .jpg). Si faltan el normal map, el brillo o las letras del nombre, se generan genéricos. Después elegís en qué puesto va: titular, suplente, tercera, cuarta o arquero.</small></div></div>`;
}
function ksBindDrop(dz, onFiles) {
  dz.ondragover = e => { e.preventDefault(); dz.classList.add('drag'); };
  dz.ondragleave = e => { if (!dz.contains(e.relatedTarget)) dz.classList.remove('drag'); };
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove('drag'); onFiles([...e.dataTransfer.files]); };
  dz.onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true; inp.accept = '.zip,.png,.jpg,.jpeg,.webp,.dds,.ftex,.txt'; inp.onchange = () => onFiles([...inp.files]); inp.click(); };
  dz.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dz.click(); } };
}
// lo que arrastró, con la forma que entiende KZIP: un .zip se abre; las texturas sueltas van tal cual
async function ksDropEntries(files) {
  const out = [];
  for (const f of files) {
    if (/\.zip$/i.test(f.name)) out.push(...await KZIP.read(await f.arrayBuffer()));
    else out.push({ name: f.webkitRelativePath || f.name, size: f.size, data: async () => new Uint8Array(await f.arrayBuffer()) });
  }
  return out;
}
// una textura del .zip decodificada (chica): para la vista previa, el normal map genérico y los colores del config
async function ksEntryImg(e, max = 1024) {
  const b = await e.data(), n = e.name.toLowerCase(), buf = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  if (n.endsWith('.ftex')) return ftexDecode(buf, max);
  if (n.endsWith('.dds')) return DDS.decodeSmall(buf, max);
  return ksShrink(await FTEXW.rawFromImage(new Blob([buf])), max);
}
// fresh: el equipo no tiene carpeta en el kit-server (sus kits están en los .cpk); se le crea una al confirmar
async function ksZipDrop(files, t, m, fresh) {
  if (!files || !files.length) return;
  let kits;
  try { kits = KZIP.detect(await ksDropEntries(files)); } catch (e) { toast('No se pudo leer: ' + e.message, 7000); return; }
  const ok = kits.filter(k => k.files.kit);
  if (!ok.length) { toast(kits.length ? 'Falta la textura principal del kit (la camiseta: u####p1.ftex, .dds o .png).' : 'Ahí no hay texturas de kit (.ftex, .dds o .png). Si es un .zip, fijate que las texturas estén adentro.', 8000); return; }
  ksZipModal(ok, fresh ? [] : KS.all, async (items, log) => { if (fresh) await ksNewTeamDir(t); return ksZipInstall(items, t, log); }, m);
}
// el cuadro: qué trae cada kit, en qué puesto va y, si el puesto ya tiene kit, reemplazar o agregar como nuevo
function ksZipModal(kits, all, run, m) {
  const opts = KZIP.slotOptions(all), KN = { kit: 'Kit', nrm: 'Normal map', srm: 'Brillo', back: 'Nº espalda', chest: 'Nº pecho', leg: 'Nº short', name: 'Nombre' };
  const guess = k => { // u2689p2.ftex o una carpeta "p2" dicen a qué puesto iba
    const f = k.files.kit.name.split('/').pop().toLowerCase(); let g = (f.match(/^u\d{4}([pg]\d+)/) || [])[1] || (k.label.toLowerCase().match(/^[pg]\d+$/) || [])[0];
    if (g && !opts.some(o => o.v === g)) g = /^g/.test(g) ? 'new-g' : 'new-p';
    return g || (opts.find(o => !o.gk && !o.used) || opts.find(o => o.v === 'new-p')).v;
  };
  const chip = (k, kind) => { const st = k.files[kind] ? 'ok' : KZIP.GEN[kind] ? 'gen' : 'none'; return `<span class="kzchip ${st}" title="${esc(KZIP.KIND_N[kind])}">${KN[kind]}<small>${st === 'ok' ? 'viene' : st === 'gen' ? 'se genera' : 'no viene'}</small></span>`; };
  const row = (k, i) => `<div class="kzkit"><canvas class="kzprev" data-kz="${i}" width="110" height="110" aria-label="Vista previa de la textura"></canvas><div class="kzinfo"><b>${esc(k.label)}</b><small class="mono">${esc(k.files.kit.name.split('/').pop())}${k.files.config ? ' · trae config.txt' : ' · sin config.txt: se arma uno con los colores de la textura'}</small>
      <div class="kzfiles">${KZIP.KINDS.map(kind => chip(k, kind)).join('')}</div>
      <div class="f"><label for="kzSlot${i}">Ponerlo como</label><select id="kzSlot${i}" data-slot="${i}">${opts.map(o => `<option value="${o.v}" ${o.v === guess(k) ? 'selected' : ''}>${esc(o.n)}${o.used ? ' · en uso' : ''}</option>`).join('')}</select></div>
      <div class="kzrep" data-rep="${i}" hidden><label class="chk"><input type="radio" name="kzr${i}" value="new" checked> <span>Agregarlo como kit nuevo (<b data-nn></b>)</span></label><label class="chk"><input type="radio" name="kzr${i}" value="replace"> <span>Reemplazar el <b data-sn></b> que está ahora (lo de antes se guarda en _borrados)</span></label></div>
    </div></div>`;
  const html = `<p class="note">${kits.length === 1 ? 'Se encontró un kit.' : 'Se encontraron ' + kits.length + ' kits.'} Elegí en qué puesto va cada uno; los puestos "en uso" ya tienen un kit en el juego.</p>
    <div class="kzlist">${kits.map(row).join('')}</div><p class="note" id="kzLog" aria-live="polite"></p>
    <div class="mdlbtns"><button class="btn" type="button" data-x>Cancelar</button><button class="btn primary" type="button" id="kzGo">Cargar al kit-server</button></div>`;
  ksModal('Cargar kit', html, (M, close) => {
    const upd = i => { const o = opts.find(x => x.v === M.querySelector(`[data-slot="${i}"]`).value), rep = M.querySelector(`[data-rep="${i}"]`); rep.hidden = !o.used; if (o.used) { rep.querySelector('[data-sn]').textContent = o.v + ' (' + KZIP.roleOf(o.v).toLowerCase() + ')'; rep.querySelector('[data-nn]').textContent = KZIP.nextFree(all, o.gk); } };
    kits.forEach((k, i) => { upd(i); M.querySelector(`[data-slot="${i}"]`).onchange = () => upd(i);
      ksEntryImg(k.files.kit, 256).then(img => { const c = M.querySelector(`[data-kz="${i}"]`); if (!c) return; const g = c.getContext('2d'), z = Math.min(c.width / img.w, c.height / img.h); g.drawImage(imgToCanvas(img), (c.width - img.w * z) / 2, (c.height - img.h * z) / 2, img.w * z, img.h * z); }).catch(() => { }); });
    M.querySelector('#kzGo').onclick = async () => {
      const taken = all.slice(), items = [];
      for (let i = 0; i < kits.length; i++) {
        const o = opts.find(x => x.v === M.querySelector(`[data-slot="${i}"]`).value), rep = o.used && M.querySelector(`input[name="kzr${i}"]:checked`).value === 'replace';
        const name = /^new/.test(o.v) || (o.used && !rep) ? KZIP.nextFree(taken, o.gk) : o.v;
        if (items.some(x => x.name.toLowerCase() === name.toLowerCase())) { toast('Dos kits van al mismo puesto (' + name + '): elegí otro para uno de ellos.', 6000); return; }
        items.push({ kit: kits[i], name, replace: rep }); taken.push(name);
      }
      const btns = M.querySelectorAll('.mdlbtns button'); btns.forEach(b => b.disabled = true); const logEl = M.querySelector('#kzLog'), log = s => { logEl.textContent = s; };
      try { const res = await run(items, log); close(); ksZipDone(res, m); }
      catch (e) { log('No se pudo cargar: ' + e.message); btns.forEach(b => b.disabled = false); }
    };
  });
}
// escribe el kit en la carpeta del equipo (convierte a .ftex, genera lo que falta, config.txt y order.ini) y refresca el estudio
async function ksZipInstall(items, t, log) {
  const { kit } = await ksRoot(true), dir = await subDir(kit, KS.path), imgs = new Map();
  const kitImg = async K => { if (!imgs.has(K)) imgs.set(K, await ksEntryImg(K.files.kit, 1024)); return imgs.get(K); };
  const prog = what => p => log(what + ' ' + Math.round(p * 100) + '%');
  const D = { dir, team: t.id, kits: KS.kits, gk: KS.gk, all: KS.all, log,
    toFtex: async (e, kind) => {
      const b = await e.data(), n = e.name.toLowerCase(); if (n.endsWith('.ftex')) return b;
      const buf = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), img = n.endsWith('.dds') ? DDS.decode(buf) : await FTEXW.rawFromImage(new Blob([buf]));
      const S = KS_SLOTS.find(s => s.k === kind), P2 = FTEXW.pow2Pixels(new Uint8Array(img.data.buffer, img.data.byteOffset, img.data.length), img.w, img.h, S ? S.max : 4096);
      return FTEXW.fromPixels(P2.px, P2.w, P2.h, { dxt5: kind !== 'srm', progress: prog('Convirtiendo ' + e.name.split('/').pop() + ' a .ftex…') });
    },
    gen: async (kind, ctx) => { // los genéricos: la tela elegida en el panel Tela y la fuente del generador
      if (kind === 'nrm') return FTEXW.fromCanvas(KMAT.normalMap({ kitCanvas: imgToCanvas(await kitImg(ctx.kit)), fabric: KS.mat.fabric, repeat: KS.mat.repeat, fabricStrength: KS.mat.fabricStrength, emboss: KS.mat.emboss, size: 1024 }), { progress: prog('Generando el normal map…') });
      if (kind === 'srm') return FTEXW.fromCanvas(KMAT.srm(KS.mat.fabric, 256), { dxt5: false });
      if (kind === 'name') return FTEXW.fromCanvas(KFONT.generate('name', KS.fontOpt || { font: 'Saira Condensed', weight: 800, fill: '#ffffff', stroke1: 0, stroke2: 0, shadow: 0 }), { progress: prog('Generando las letras del nombre…') });
      return null;
    },
    colors: async ctx => { const img = await kitImg(ctx.kit); return KZIP.colorsFrom(img.data, img.w, img.h); },
    baseCfg: async () => KS.cfgTxt && (KS.cfgTxt[KS.kits[0]] || KS.cfgTxt[KS.sel]) || null };
  const res = await KZIP.install(items, D);
  for (const r of res) {
    try { const c = await readText(await dir.getDirectoryHandle(r.name), 'config.txt'); if (c) { KS.meta[r.name] = parseKitCfg(c, r.name); KS.cfgTxt[r.name] = c; } } catch { }
    delete KS.thumbs[r.name]; for (const k of [...KS.tex.keys()]) if (k.startsWith(KS.path + '/' + r.name + ':')) KS.tex.delete(k);
  }
  ksRefreshKitsMap(); RATE_GEN++;
  if (!KS.cfg || res.some(r => r.name === KS.sel)) { KS.dirty = false; await ksOpenKit(KS.sel && KS.all.includes(KS.sel) ? KS.sel : (KS.kits[0] || KS.gk[0]), dir); }
  return res;
}
function ksZipDone(res, m) {
  const txt = res.map(r => r.name + (r.replaced ? ' (reemplazado)' : ' (nuevo)') + (r.generated.length ? ', genéricos: ' + r.generated.map(k => KZIP.KIND_N[k].toLowerCase()).join(', ') : '')).join(' · ');
  toast('Kit cargado en ' + KS.path + ': ' + txt + '. Abrí el juego de nuevo (o en kserv apretá [0] para recargar el mapa).', 12000);
  renderTeams(m);
}
// carpeta nueva para un equipo que no estaba en map.txt (sus kits venían de los .cpk): se anota en map.txt y queda vacía hasta que se instale el kit
async function ksNewTeamDir(t) {
  const { kit } = await ksRoot(true), safe = String(tget(t, 'name') || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'equipo';
  let name = safe; try { await kit.getDirectoryHandle(name); name = safe + ' ' + t.id; } catch { }
  await kit.getDirectoryHandle(name, { create: true });
  const map = (await readText(kit, 'map.txt')) || '', eol = /\n/.test(map) && !/\r\n/.test(map) ? '\n' : '\r\n';
  const fh = await kit.getFileHandle('map.txt', { create: true }), w = await fh.createWritable(); await w.write((map.trim() ? map.replace(/\s*$/, '') + eol : '') + t.id + ',"' + name + '"' + eol); await w.close();
  KITS.map.set(t.id, { k: [], g: [], path: name }); kitsSaveCache();
  Object.assign(KS, { team: t.id, path: name, kits: [], gk: [], all: [], meta: {}, cfgTxt: {}, thumbs: {}, sel: null, cfg: null, err: '', dirty: false, mode: 'list' });
  return name;
}
