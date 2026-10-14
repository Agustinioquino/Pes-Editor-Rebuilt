// ===================== Cargar kits desde un .zip (Kit Studio Pro › Uniformes) =====================
// Lee el .zip sin librerías, reconoce qué textura es cada archivo por su nombre (u2689p1.ftex, _back, _nrm…),
// arma el config.txt y escribe la carpeta del kit en content\kit-server con su lugar en order.ini / gk_order.ini.
// No toca el DOM: se prueba en Node (test/kitzip.test.js). Lo visual está en kitstudio.js (ksZipDrop).
const KZIP = (() => {
  const TD = new TextDecoder();
  // ---- lector de .zip: directorio central al final del archivo; cada entrada se descomprime recién al pedirla ----
  async function read(buf) {
    const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf), dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    let eocd = -1; for (let i = b.length - 22; i >= Math.max(0, b.length - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('No parece un archivo .zip (no tiene directorio central).');
    const count = dv.getUint16(eocd + 10, true), cdOff = dv.getUint32(eocd + 16, true), out = [];
    let p = cdOff;
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('El .zip está dañado (entrada ' + i + ').');
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), size = dv.getUint32(p + 24, true);
      const nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lho = dv.getUint32(p + 42, true);
      const name = TD.decode(b.subarray(p + 46, p + 46 + nl)).replace(/\\/g, '/');
      p += 46 + nl + el + cl;
      if (name.endsWith('/')) continue; // carpetas
      const entry = { name, size, csize, method, data: async () => {
        const hn = dv.getUint16(lho + 26, true), he = dv.getUint16(lho + 28, true), start = lho + 30 + hn + he, comp = b.subarray(start, start + csize);
        if (method === 0) return comp.slice();
        if (method !== 8) throw new Error(name + ': compresión no soportada (' + method + '). Guardá el .zip con compresión normal (deflate).');
        return new Uint8Array(await new Response(new Blob([comp]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
      } };
      out.push(entry);
    }
    return out;
  }

  // ---- qué es cada archivo ----
  const SUFFIX = { nrm: /_nrm$/i, srm: /_srm$/i, back: /_back$/i, chest: /_chest$/i, leg: /_leg$/i, name: /_name$/i };
  const IMG = /\.(ftex|dds|png|jpe?g|webp)$/i, EXT_RANK = { ftex: 3, dds: 2, png: 1, jpg: 0, jpeg: 0, webp: 0 };
  const JUNK = /(preview|previa|render|captura|screenshot|template|plantilla|thumb|logo|readme|leeme|wireframe|psd)/i;
  const SKIP = /(^|\/)(__MACOSX|\.DS_Store|Thumbs\.db|desktop\.ini)|\.bak/i;
  const KITNAME = /^(u\d{4}[pg]\d+[a-z]?)/i;
  const KINDS = ['kit', 'nrm', 'srm', 'back', 'chest', 'leg', 'name'];
  const KIND_N = { kit: 'Textura del kit', nrm: 'Normal map', srm: 'Brillo (SRM)', back: 'Números de la espalda', chest: 'Números del pecho', leg: 'Números del short', name: 'Letras del nombre' };
  const GEN = { nrm: true, srm: true, name: true }; // lo que se genera genérico cuando no viene

  // entries: [{ name, size }]. Devuelve un "kit" por carpeta (o por prefijo u2689p1 si hay varios juntos en la misma).
  function detect(entries) {
    const dirs = new Map(); // carpeta -> { pre: Map(prefijo u####p# -> grupo), loose: lo que no lleva prefijo }
    const mk = (dir, label) => ({ dir, label, files: {}, cands: [], extra: [] });
    for (const e of entries) {
      const full = e.name.replace(/^\.?\//, ''); if (!full || SKIP.test(full)) continue;
      const i = full.lastIndexOf('/'), dir = i < 0 ? '' : full.slice(0, i), file = i < 0 ? full : full.slice(i + 1), lower = file.toLowerCase();
      const ext = (lower.match(/\.([a-z0-9]+)$/) || [])[1] || '', base = lower.replace(/\.[a-z0-9]+$/, '');
      let d = dirs.get(dir); if (!d) dirs.set(dir, d = { pre: new Map(), loose: mk(dir, dir || 'raíz del .zip') });
      const pre = base.match(KITNAME); let g = d.loose;
      if (pre) { g = d.pre.get(pre[1]); if (!g) d.pre.set(pre[1], g = mk(dir, pre[1])); }
      if (lower === 'config.txt') { g.files.config = e; continue; }
      if (!IMG.test(lower)) { g.extra.push(e); continue; }
      const kind = Object.keys(SUFFIX).find(k => SUFFIX[k].test(base));
      if (kind) { if (!g.files[kind] || EXT_RANK[ext] > rank(g.files[kind])) g.files[kind] = e; continue; }
      g.cands.push({ e, ext, strong: !!pre, junk: JUNK.test(base) });
    }
    const groups = [];
    for (const d of dirs.values()) {
      const L = d.loose;
      if (d.pre.size === 1) { // un solo kit en la carpeta: el config.txt, las vistas previas y el leeme sueltos son de él
        const g = d.pre.values().next().value; if (g.dir) g.label = g.dir;
        if (!g.files.config) g.files.config = L.files.config;
        g.extra.push(...L.extra); g.cands.push(...L.cands); groups.push(g);
      } else { groups.push(...d.pre.values()); if (!d.pre.size || L.files.config || L.cands.some(x => !x.junk)) groups.push(L); }
    }
    const kits = [];
    for (const g of groups) {
      const c = g.cands.filter(x => !x.junk).sort((a, b) => (b.strong - a.strong) || (EXT_RANK[b.ext] - EXT_RANK[a.ext]) || ((b.e.size || 0) - (a.e.size || 0)));
      if (c[0]) g.files.kit = c[0].e; g.extra.push(...g.cands.filter(x => x !== c[0]).map(x => x.e));
      if (!g.files.kit && !g.files.config && !KINDS.some(k => g.files[k])) continue;
      kits.push({ dir: g.dir, label: g.label, files: g.files, extra: g.extra, have: KINDS.filter(k => g.files[k]), missing: KINDS.filter(k => !g.files[k]), generated: KINDS.filter(k => !g.files[k] && GEN[k]) });
    }
    return kits;
  }
  const rank = e => EXT_RANK[(e.name.toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1]] || 0;

  // ---- puestos ----
  const ROLE = { p1: 'Titular', p2: 'Suplente', p3: 'Tercera', p4: 'Cuarta', g1: 'Arquero', g2: 'Arquero alternativo' };
  const roleOf = n => ROLE[n] || (/^g/i.test(n) ? 'Arquero alternativo' : 'Kit') + ' ' + n;
  function nextFree(all, gk) { let n = 1, nn; do nn = (gk ? 'g' : 'p') + n++; while (all.some(x => x.toLowerCase() === nn)); return nn; }
  // opciones para el cuadro "Ponerlo como": los puestos fijos (marcando los que ya tienen kit) y "kit nuevo"
  function slotOptions(all) {
    const used = n => all.some(x => x.toLowerCase() === n);
    const o = ['p1', 'p2', 'p3', 'p4'].map(n => ({ v: n, n: n + ' · ' + ROLE[n], used: used(n), gk: false }));
    o.push({ v: 'new-p', n: 'Kit nuevo de jugador (' + nextFree(all, false) + ')', used: false, gk: false, name: nextFree(all, false) });
    o.push(...['g1', 'g2'].map(n => ({ v: n, n: n + ' · ' + ROLE[n], used: used(n), gk: true })));
    o.push({ v: 'new-g', n: 'Kit nuevo de arquero (' + nextFree(all, true) + ')', used: false, gk: true, name: nextFree(all, true) });
    return o;
  }
  // dónde va en order.ini: p3 entra tercero aunque haya más kits después; lo que no es pN va al final
  function orderInsert(list, name) {
    const out = list.slice(); if (out.some(x => x.toLowerCase() === name.toLowerCase())) return out;
    const m = name.match(/^[pg](\d+)$/i), i = m ? Math.min(+m[1] - 1, out.length) : out.length;
    out.splice(i, 0, name); return out;
  }

  // ---- config.txt ----
  const DEFAULT_CFG = ['; shirt parameters', 'ShortSleevesModel=1                               ; 1=Normal', 'ShirtModel=144                                    ; 144, 151=Semi-long short sleeves, 160, 176=Legacy', 'Collar=1                                          ; 1 to 126', 'TightKit=0                                        ; 0=Off, 1=On', 'ShirtPattern=0                                    ; 0 to 6', 'WinterCollar=1                                    ; 1 to 127', 'LongSleevesType=187                               ; 62=Normal & Undershirt, 187=Only Undershirt', '',
    '; shirt - back side', 'Name=0                                            ; 0=On, 1=Off', 'NameShape=1                                       ; 0=Straight, 1=Light curve, 2=Medium curve, 3=Extreme curve', 'NameY=28                                          ; 0 to 39', 'NameSize=14                                       ; 0 to 20', 'NameStretch=1                                     ; 0 to 3', 'BackNumberY=18                                    ; 0 to 29', 'BackNumberSize=24                                 ; 0 to 28', 'BackNumberSpacing=7                               ; 0 to 14', 'BackNumberType=0                                  ; 0=Normal, 1=Forced two-digit', '',
    '; shirt - front side', 'ChestNumberX=29                                   ; 0 to 29', 'ChestNumberY=11                                   ; 0 to 29', 'ChestNumberSize=0                                 ; 0 to 28', '',
    '; shorts parameters', 'ShortsModel=1                                     ; 0 to 17', 'ShortsNumberSide=0                                ; 0=Left, 1=Right', 'ShortsNumberX=15                                  ; 0 to 31 (number invisible if using 30 or 31)', 'ShortsNumberY=14                                  ; 0 to 31 (number invisible if using 30 or 31)', 'ShortsNumberSize=12                               ; 0 to 28', '',
    '; texture files', 'KitFile=', 'BackNumbersFile=', 'ChestNumbersFile=', 'LegNumbersFile=', 'NameFontFile=', '',
    '; kit colors', 'ShirtColor1=#ffffff', 'ShirtColor2=#000000', 'UndershirtColor=#ffffff', 'ShortsColor=#ffffff', 'SocksColor=#ffffff', '',
    '; sleeve badge positions', 'RightShortX=14                                    ; 0 to 31', 'RightShortY=12                                    ; 0 to 31', 'RightLongX=14                                     ; 0 to 31', 'RightLongY=12                                     ; 0 to 31', 'LeftShortX=14                                    ; 0 to 31', 'LeftShortY=12                                     ; 0 to 31', 'LeftLongX=14                                     ; 0 to 31', 'LeftLongY=12                                     ; 0 to 31', '',
    '; kit colors from UniColor.bin', 'UniColor_Color1=#ffffff', 'UniColor_Color2=#000000', ''].join('\r\n');
  // cambia (o agrega) un valor sin tocar los comentarios ni el resto del archivo
  function cfgSet(txt, key, value) {
    const re = new RegExp('^([ \\t]*' + key + '[ \\t]*=[ \\t]*)([^;\\r\\n]*?)([ \\t]*)(;.*)?$', 'mi'); // ojo: \s comería el \r del final
    if (re.test(txt)) return txt.replace(re, (m, a, v, gap, c) => a + value + (c ? (gap.length ? gap : ' ') + c : ''));
    const eol = /\r\n/.test(txt) ? '\r\n' : '\n'; return txt.replace(/\s*$/, '') + eol + key + '=' + value + eol;
  }
  const cfgGet = (txt, key) => { const m = txt.match(new RegExp('^[ \\t]*' + key + '[ \\t]*=[ \\t]*([^;\\r\\n]*)', 'mi')); return m ? m[1].trim() : null; };
  // el config del kit nuevo: el que vino en el .zip (o el de otro kit del equipo, o uno base) con los nombres de archivo puestos
  function configFor({ base, team, slot, have, colors }) {
    const file = 'u' + String(team).padStart(4, '0') + slot.toLowerCase(); let t = (base || DEFAULT_CFG).replace(/^﻿/, '');
    t = cfgSet(t, 'KitFile', file);
    t = cfgSet(t, 'BackNumbersFile', have.includes('back') ? file + '_back' : '');
    t = cfgSet(t, 'ChestNumbersFile', have.includes('chest') ? file + '_chest' : '');
    t = cfgSet(t, 'LegNumbersFile', have.includes('leg') ? file + '_leg' : '');
    t = cfgSet(t, 'NameFontFile', have.includes('name') ? file + '_name' : '');
    if (colors) { for (const [k, v] of Object.entries({ ShirtColor1: colors.c1, ShirtColor2: colors.c2, UndershirtColor: colors.c1, ShortsColor: colors.sh, SocksColor: colors.so, UniColor_Color1: colors.c1, UniColor_Color2: colors.c2 })) if (v) t = cfgSet(t, k, v); }
    return { text: t, file };
  }
  // colores aproximados leídos de la textura del kit (RGBA, w×h): pecho, manga, short y media
  function colorsFrom(px, w, h) {
    const avg = (u, v, r = .03) => { let R = 0, G = 0, B = 0, n = 0; for (let y = Math.floor((v - r) * h); y < (v + r) * h; y++) for (let x = Math.floor((u - r) * w); x < (u + r) * w; x++) { if (x < 0 || y < 0 || x >= w || y >= h) continue; const i = (y * w + x) * 4; R += px[i]; G += px[i + 1]; B += px[i + 2]; n++; } return n ? [R / n, G / n, B / n] : [128, 128, 128]; };
    const hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
    const c1 = avg(.5, .72), sleeve = avg(.16, .2), shorts = avg(.17, .78), socks = avg(.17, .43), back = avg(.5, .3);
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const c2 = [sleeve, back, shorts].sort((a, b) => dist(b, c1) - dist(a, c1))[0];
    return { c1: hex(c1), c2: hex(dist(c2, c1) > 40 ? c2 : c1.map(v => 255 - v)), sh: hex(shorts), so: hex(socks) };
  }

  // ---- instalar: escribe la carpeta del kit, el config y el orden ----
  // items: [{ kit (de detect), name: 'p2', replace: true|false }]
  // D: { dir (carpeta del equipo), team (id), kits, gk, all, toFtex(entry, kind) -> bytes, gen(kind, ctx) -> bytes|null, colors(ctx) -> {c1..}|null, baseCfg -> texto, log(msg) }
  async function install(items, D) {
    const log = D.log || (() => { }), done = [];
    const write = async (dir, n, data) => { const w = await (await dir.getFileHandle(n, { create: true })).createWritable(); await w.write(data); await w.close(); };
    // un archivo que el navegador no deja tocar (Chrome rechaza nombres como desktop.ini) no frena la copia
    const copyDir = async (src, dst) => { for await (const [fn, h] of src.entries()) { if (h.kind !== 'file') continue; try { await write(dst, fn, await (await h.getFile()).arrayBuffer()); } catch (e) { log('No se pudo copiar ' + fn + ': ' + e.message); } } };
    for (const it of items) {
      const name = it.name, gk = /^g/i.test(name), K = it.kit, exists = D.all.some(x => x.toLowerCase() === name.toLowerCase());
      if (!K.files.kit) throw new Error('El kit "' + K.label + '" no trae la textura del kit (u####' + name + '.ftex, .dds o .png).');
      if (exists) {
        if (!it.replace) throw new Error(name + ' ya tiene un kit. Elegí reemplazarlo o cargarlo como kit nuevo.');
        log('Guardando el ' + name + ' de ahora en _borrados…');
        const trash = await D.dir.getDirectoryHandle('_borrados', { create: true }); let tn = name, i = 2;
        for (;;) { try { await trash.getDirectoryHandle(tn); tn = name + '-' + i++; } catch { break; } }
        await copyDir(await D.dir.getDirectoryHandle(name), await trash.getDirectoryHandle(tn, { create: true }));
        await D.dir.removeEntry(name, { recursive: true });
      }
      const kd = await D.dir.getDirectoryHandle(name, { create: true }), ctx = { kit: K, name, team: D.team };
      const have = [], generated = [], file = 'u' + String(D.team).padStart(4, '0') + name.toLowerCase();
      for (const kind of KINDS) {
        const e = K.files[kind]; if (!e) continue;
        log('Convirtiendo ' + e.name.split('/').pop() + '…');
        const bytes = await D.toFtex(e, kind, ctx); if (!bytes) continue;
        await write(kd, file + (kind === 'kit' ? '' : '_' + kind) + '.ftex', bytes); have.push(kind);
      }
      for (const kind of KINDS) {
        if (K.files[kind] || !GEN[kind] || !D.gen) continue;
        log('Generando ' + KIND_N[kind].toLowerCase() + '…');
        try { const bytes = await D.gen(kind, ctx); if (bytes) { await write(kd, file + '_' + kind + '.ftex', bytes); have.push(kind); generated.push(kind); } } catch (e) { log('No se pudo generar ' + kind + ': ' + e.message); }
      }
      const base = K.files.config ? TD.decode(await K.files.config.data()) : (D.baseCfg ? await D.baseCfg() : null);
      const colors = !K.files.config && D.colors ? await D.colors(ctx) : null;
      const cfg = configFor({ base, team: D.team, slot: name, have, colors });
      await write(kd, 'config.txt', cfg.text);
      const list = gk ? D.gk : D.kits, nl = orderInsert(list, name); list.length = 0; list.push(...nl);
      await write(D.dir, gk ? 'gk_order.ini' : 'order.ini', list.join('\r\n') + '\r\n');
      if (!exists) D.all.push(name);
      done.push({ name, file, have, generated, missing: KINDS.filter(k => !have.includes(k)), replaced: exists, config: !!K.files.config, colors });
    }
    return done;
  }
  return { read, detect, slotOptions, nextFree, orderInsert, roleOf, ROLE, configFor, cfgSet, cfgGet, colorsFrom, install, KINDS, KIND_N, GEN, DEFAULT_CFG };
})();
