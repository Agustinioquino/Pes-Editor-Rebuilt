// ===================== Visor 3D de kits: modelos .fmdl del juego + textura del kit =====================
// Formato FMDL (Fox Engine) según FMDL Studio v2 (BobDoleOwndU, MIT). Se leen solo las piezas de la ropa
// (camiseta, mangas, short, medias, brazos y cuellos) de las carpetas sueltas del juego.
const FMDL = (() => {
  const h2f = h => { const s = h & 0x8000 ? -1 : 1, e = (h >> 10) & 31, f = h & 1023; return e === 0 ? s * 6.103515625e-5 * (f / 1024) : e === 31 ? (f ? NaN : s * Infinity) : s * 2 ** (e - 15) * (1 + f / 1024); };
  function parse(buf) {
    const b = new Uint8Array(buf), dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    if (dv.getUint32(0, true) !== 0x4C444D46) throw new Error('No es un modelo FMDL');
    const infoOff = Number(dv.getBigUint64(8, true)), n0 = dv.getUint32(32, true), n1 = dv.getUint32(36, true);
    const s0 = dv.getUint32(40, true), s1 = dv.getUint32(48, true);
    const S0 = new Map(), S1 = new Map(); let o = infoOff;
    for (let i = 0; i < n0; i++, o += 8) S0.set(dv.getUint16(o, true), { n: dv.getUint16(o + 2, true), off: s0 + dv.getUint32(o + 4, true) });
    for (let i = 0; i < n1; i++, o += 12) S1.set(dv.getUint32(o, true), { off: s1 + dv.getUint32(o + 4, true), len: dv.getUint32(o + 8, true) });
    const blk = (t, size, fn) => { const e = S0.get(t); if (!e) return []; const out = []; for (let i = 0; i < e.n; i++) out.push(fn(e.off + i * size)); return out; };
    const str = S1.get(3), strs = blk(12, 8, p => { if (!str) return ''; const at = str.off + dv.getUint32(p + 4, true), len = dv.getUint16(p + 2, true); let s = ''; for (let k = 0; k < len; k++) s += String.fromCharCode(b[at + k]); return s; });
    const meshInfo = blk(3, 0x30, p => ({ mi: dv.getUint16(p + 4, true), vc: dv.getUint16(p + 10, true), ff: dv.getUint32(p + 16, true), fc: dv.getUint32(p + 20, true) }));
    const matInst = blk(4, 0x10, p => ({ name: strs[dv.getUint16(p, true)] || '', tc: b[p + 6], ft: dv.getUint16(p + 8, true) }));
    const texs = blk(6, 4, p => strs[dv.getUint16(p, true)] || strs[dv.getUint16(p + 2, true)] || '');
    const mparams = blk(7, 4, p => ({ name: strs[dv.getUint16(p, true)] || '', ref: dv.getUint16(p + 2, true) }));
    const mfi = blk(9, 8, p => ({ mfc: b[p], vfc: b[p + 1], fmf: dv.getUint16(p + 4, true), fvf: dv.getUint16(p + 6, true) }));
    const mf = blk(10, 8, p => ({ bo: b[p], len: b[p + 2], off: dv.getUint32(p + 4, true) }));
    const vf = blk(11, 4, p => ({ type: b[p], dt: b[p + 1], off: dv.getUint16(p + 2, true) }));
    const bo = blk(14, 16, p => ({ len: dv.getUint32(p + 4, true), off: dv.getUint32(p + 8, true) }));
    const buf2 = S1.get(2); if (!buf2 || bo.length < 3) throw new Error('El modelo no trae geometría');
    const base = buf2.off, meshes = [];
    meshInfo.forEach((m, i) => {
      const fi = mfi[i]; if (!fi || !m.vc) return;
      const n = m.vc, pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), uv = new Float32Array(n * 2);
      const f0 = mf[fi.fmf], f1 = mf[fi.fmf + 1];
      let p = base + bo[0].off + f0.off; const ps = f0.len >= 12 ? f0.len : 12;
      for (let v = 0; v < n; v++, p += ps) { pos[v * 3] = dv.getFloat32(p, true); pos[v * 3 + 1] = dv.getFloat32(p + 4, true); pos[v * 3 + 2] = dv.getFloat32(p + 8, true); }
      let hasN = false, hasUV = false;
      if (f1) {
        const fmts = vf.slice(fi.fvf, fi.fvf + fi.vfc); let q = base + bo[1].off + f1.off;
        for (let v = 0; v < n; v++, q += f1.len) for (const f of fmts) {
          if (f.type === 2) { hasN = true; for (let k = 0; k < 3; k++) nrm[v * 3 + k] = h2f(dv.getUint16(q + f.off + k * 2, true)); }
          else if (f.type === 8) { hasUV = true; uv[v * 2] = h2f(dv.getUint16(q + f.off, true)); uv[v * 2 + 1] = h2f(dv.getUint16(q + f.off + 2, true)); }
        }
      }
      const idx = new Uint16Array(m.fc), fp = base + bo[2].off + m.ff * 2;
      for (let k = 0; k < m.fc; k++) { const v = dv.getUint16(fp + k * 2, true); idx[k] = v < n ? v : v % n; }
      const mi = matInst[m.mi] || { name: '', tc: 0, ft: 0 };
      const tex = []; for (let k = 0; k < mi.tc; k++) { const mp = mparams[mi.ft + k]; if (mp) tex.push({ slot: mp.name, file: texs[mp.ref] || '' }); }
      meshes.push({ pos, nrm, uv, idx, hasN, hasUV, mat: mi.name, tex });
    });
    return { meshes };
  }
  // normales por cara si el modelo no las trae (o vienen en cero)
  function fixNormals(m) {
    if (m.hasN && m.nrm.some(v => v)) return;
    const { pos, idx, nrm } = m; nrm.fill(0);
    for (let k = 0; k + 2 < idx.length; k += 3) {
      const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3;
      const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const i of [a, b, c]) { nrm[i] += nx; nrm[i + 1] += ny; nrm[i + 2] += nz; }
    }
    for (let i = 0; i < nrm.length; i += 3) { const l = Math.hypot(nrm[i], nrm[i + 1], nrm[i + 2]) || 1; nrm[i] /= l; nrm[i + 1] /= l; nrm[i + 2] /= l; }
  }
  return { parse, fixNormals };
})();

// ---- estado del visor ----
const K3 = { idx: null, collarDir: null, parts: new Map(), view: { yaw: 0, pitch: .1, dist: 0, panX: 0, panY: 0, fov: 48 }, debug: 0, paint: false, place: true, autoSpeed: 1, sleeve: 'short', socks: 'long', tuck: 'out', cap: false, skin: '#c8956d', err: '',
  light: Object.assign({ preset: 'estadio-noche', az: 0, el: 0, int: 1, amb: 1, spec: 1, bump: 1, nrm: true, decals: true, gloss: 1, envInt: 1, envYaw: 0, bg: 'env', bgBlur: 2, exp: 1 }, (typeof PREFS !== 'undefined' && PREFS.k3light) || {}) };
// ---- modelos incluidos (CometKITpreviewer): se descomprimen la primera vez que se usan ----
let K3PACK = null;
async function k3Pack() {
  if (K3PACK) return K3PACK;
  K3PACK = (async () => {
    const bin = Uint8Array.from(atob(KIT_PACK_B64), c => c.charCodeAt(0));
    const raw = new Uint8Array(await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
    const dv = new DataView(raw.buffer), hl = dv.getUint32(0, true), hdr = JSON.parse(new TextDecoder().decode(raw.subarray(4, 4 + hl))), base = 4 + hl;
    const map = new Map(hdr.parts.map(p => [p.n, p])), cache = new Map();
    const get = name => {
      if (cache.has(name)) return cache.get(name); const p = map.get(name); if (!p) return null;
      const o = base + p.o, n = p.v, q = new Int16Array(raw.buffer.slice(o, o + n * 6)), uq = new Uint16Array(raw.buffer.slice(o + n * 6, o + n * 10)), idx = new Uint16Array(raw.buffer.slice(o + n * 10, o + n * 10 + p.i * 2));
      const pos = new Float32Array(n * 3), uv = new Float32Array(n * 2); for (let i = 0; i < n * 3; i++) pos[i] = q[i] * hdr.scale; for (let i = 0; i < n * 2; i++) uv[i] = uq[i] / 65535;
      // normales suaves: se suman por posición para que las costuras de la textura no se vean como cortes
      const nrm = new Float32Array(n * 3), key = i => q[i * 3] + ',' + q[i * 3 + 1] + ',' + q[i * 3 + 2], acc = new Map();
      for (let k = 0; k + 2 < idx.length; k += 3) {
        const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3, ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        for (const i of [idx[k], idx[k + 1], idx[k + 2]]) { const kk = key(i); let v = acc.get(kk); if (!v) acc.set(kk, v = [0, 0, 0]); v[0] += nx; v[1] += ny; v[2] += nz; }
      }
      for (let i = 0; i < n; i++) { const v = acc.get(key(i)) || [0, 1, 0], l = Math.hypot(v[0], v[1], v[2]) || 1; nrm[i * 3] = v[0] / l; nrm[i * 3 + 1] = v[1] / l; nrm[i * 3 + 2] = v[2] / l; }
      const m = { meshes: [{ pos, nrm, uv, idx, hasN: true, hasUV: true, mat: name, tex: [] }] }; cache.set(name, m); return m;
    };
    return { get, has: n => map.has(n), names: () => [...map.keys()] };
  })();
  return K3PACK;
}
const k3CollarName = (P, n) => { n = +n || 0; for (const c of [n, n - 1, n + 1]) { const k = 'collar_' + String(c).padStart(3, '0'); if (c > 0 && P.has(k)) return { k, exact: c === n }; } return null; };
// piezas según el config.txt del kit
async function k3Load(cfg) {
  const P = await k3Pack(), g = k => (cfgGet(cfg, k) || '').trim(), tight = g('TightKit') === '1', kappa = g('ShortSleevesModel') === '2', gk = /^g/i.test(KS.sel || '');
  const long = K3.sleeve === 'long' || gk, sl = gk ? 'sleeve_gk' + (tight ? '_tight' : '') : 'sleeve_' + (long ? 'long' : 'short') + (tight ? '_tight' : '') + (kappa ? '_kappa' : '');
  const shorts = 'pants_' + String(+g('ShortsModel') || 1).padStart(3, '0'), col = k3CollarName(P, g('Collar'));
  const want = [['shirt', 'shirt_' + K3.tuck + (tight ? '_tight' : '')], ['sleeve', sl + (K3.cap ? '_cap' : '')], ['shorts', P.has(shorts) ? shorts : 'pants_001'], ['socks', 'socks_' + K3.socks], ['collar', col && col.k]];
  const parts = []; for (const [k, n] of want) { const m = n && (P.get(n) || (k === 'sleeve' ? P.get(sl) : null)); if (m) parts.push({ k, m }); }
  // la parte de arriba del short que queda debajo de la camiseta (sin esto se ve un hueco entre camiseta y short)
  const sub = P.get(K3.tuck === 'in' ? 'pants_sub_in' : tight ? 'pants_sub_tight' : 'pants_sub_out'), sp = parts.find(p => p.k === 'shorts');
  if (sub && sp) sp.m = { meshes: [...sp.m.meshes, ...sub.meshes] };
  return { parts: K3GL.weld(parts), missing: [], collar: !!col, collarExact: col ? col.exact : false, collarName: col && col.k, src: 'pack' };
}

// ---- iluminación: escenas armadas (luces + entorno) y ajustes finos ----
const K3LIGHTS = {
  'estudio': { n: 'Estudio', key: [-35, 32, 1.4, '#fff6ea'], fill: [55, 8, .5, '#cfe0ff'], rim: [175, 28, .9, '#ffffff'], amb: .55, exp: 1.05, env: 'estudio' },
  'estadio-dia': { n: 'Estadio de día', key: [28, 55, 1.9, '#fff1d6'], fill: [-70, 12, .4, '#bcd6ff'], rim: [190, 22, .5, '#ffffff'], amb: .6, exp: 1, env: 'dia' },
  'estadio-noche': { n: 'Estadio de noche', key: [-25, 42, 1.6, '#eef4ff'], fill: [62, 40, 1.05, '#dfe9ff'], rim: [180, 35, 1.15, '#bcd2ff'], amb: .45, exp: 1.1, env: 'noche' },
  'atardecer': { n: 'Atardecer', key: [-65, 12, 1.8, '#ffb36b'], fill: [75, 20, .45, '#9a83ff'], rim: [175, 18, .85, '#ff7aa8'], amb: .5, exp: 1, env: 'atardecer' },
  'vestuario': { n: 'Vestuario', key: [0, 62, 1.35, '#ffe2b8'], fill: [-90, 20, .4, '#ffd9a8'], rim: [180, 40, .45, '#ffffff'], amb: .65, exp: 1, env: 'vestuario' },
  'hdri': { n: 'HDRI propio', key: [0, 45, 1.2, '#ffffff'], fill: [90, 10, .25, '#ffffff'], rim: [180, 30, .5, '#ffffff'], amb: 1, exp: 1, env: 'user' },
};
// ---- entornos 360° (equirectangulares): se pintan por código para las escenas, o se cargan de un .hdr / imagen ----
const K3ENV = (() => {
  const W = 512, H = 256, cache = new Map();
  const dirOf = (u, v) => { const ph = (u - .5) * 2 * Math.PI, th = v * Math.PI; return [Math.sin(th) * Math.sin(ph), Math.cos(th), -Math.sin(th) * Math.cos(ph)]; };
  const sdir = (az, el) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e) * -1]; };
  const blob = (d, c, size, pow = 1) => { const k = Math.max(0, d[0] * c[0] + d[1] * c[1] + d[2] * c[2]); return Math.pow(Math.max(0, (k - (1 - size)) / size), pow); };
  const mix = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const SCENES = {
    estudio: (d, u, v) => { let c = mix([.10, .11, .13], [.32, .34, .37], Math.max(0, d[1]) * .8 + .2); if (d[1] < -.05) c = [.05, .05, .06];
      for (const [az, el, s, k] of [[-40, 30, .06, 9], [55, 15, .08, 4], [180, 35, .05, 6]]) { const b = blob(d, sdir(az, el), s, 2) * k; c = c.map(x => x + b); } return c; },
    dia: (d, u, v) => { const y = d[1]; let c;
      if (y > .12) c = mix([.62, .76, .95], [.22, .45, .85], Math.min(1, (y - .12) * 1.6)); else if (y > -.02) { const st = hash(Math.floor(u * 400), Math.floor(v * 120)); c = mix([.28, .30, .33], [.55, .56, .58], st * .5 + (y + .02) * 2); } else c = mix([.22, .48, .2], [.12, .32, .12], Math.min(1, -y * 2));
      c = c.map(x => x + blob(d, sdir(28, 55), .004, 1) * 40 + blob(d, sdir(28, 55), .08, 2) * .8); return c; },
    noche: (d, u, v) => { const y = d[1]; let c;
      if (y > .1) c = mix([.05, .07, .13], [.01, .015, .035], Math.min(1, (y - .1) * 1.5)); else if (y > -.03) { const st = hash(Math.floor(u * 500), Math.floor(v * 150)); c = [.04, .045, .06].map(x => x + (st > .992 ? .35 : 0)); } else c = mix([.12, .32, .14], [.06, .18, .08], Math.min(1, -y * 2));
      for (const az of [-45, 45, 135, -135]) { const b = blob(d, sdir(az, 38), .006, 1) * 30 + blob(d, sdir(az, 38), .07, 3) * 1.1; c = c.map(x => x + b); } return c; },
    atardecer: (d, u, v) => { const y = d[1]; let c = y > 0 ? mix([.95, .55, .3], [.18, .12, .32], Math.min(1, y * 1.8)) : mix([.2, .12, .16], [.07, .05, .08], Math.min(1, -y * 3));
      c = c.map((x, i) => x + blob(d, sdir(-65, 8), .003, 1) * [30, 18, 8][i] + blob(d, sdir(-65, 8), .1, 2) * [1.2, .6, .3][i]); return c; },
    vestuario: (d, u, v) => { const y = d[1]; let c = y > .55 ? [.55, .5, .45] : y > -.25 ? mix([.36, .28, .22], [.5, .42, .34], (y + .25)) : [.2, .13, .08];
      for (const az of [0, 90, 180, -90]) { const b = blob(d, sdir(az, 70), .01, 1) * 14; c = c.map((x, i) => x + b * [1, .9, .75][i]); } return c; },
  };
  // armónicos esféricos (9 coeficientes): la luz difusa que llega de todo el entorno
  function sh9(f, w, h) {
    const C = Array.from({ length: 9 }, () => [0, 0, 0]); let tot = 0;
    for (let y = 0; y < h; y++) { const v = (y + .5) / h, wgt = Math.sin(v * Math.PI); for (let x = 0; x < w; x++) {
      const d = dirOf((x + .5) / w, v), c = f(x, y), [X, Y, Z] = d;
      const b = [.282095, .488603 * Y, .488603 * Z, .488603 * X, 1.092548 * X * Y, 1.092548 * Y * Z, .315392 * (3 * Z * Z - 1), 1.092548 * X * Z, .546274 * (X * X - Y * Y)];
      for (let i = 0; i < 9; i++) for (let k = 0; k < 3; k++) C[i][k] += c[k] * b[i] * wgt; tot += wgt; } }
    const norm = 4 * Math.PI / tot; return C.map(c => c.map(x => x * norm));
  }
  const tone = x => Math.round(255 * Math.pow(Math.min(1, x / (1 + x * .35)), 1 / 2.2));
  function scene(key) {
    if (cache.has(key)) return cache.get(key); const fn = SCENES[key] || SCENES.estudio, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d'), im = g.createImageData(W, H), F = new Float32Array(W * H * 3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const u = (x + .5) / W, v = (y + .5) / H, c = fn(dirOf(u, v), u, v), i = (y * W + x); F[i * 3] = c[0]; F[i * 3 + 1] = c[1]; F[i * 3 + 2] = c[2]; im.data[i * 4] = tone(c[0]); im.data[i * 4 + 1] = tone(c[1]); im.data[i * 4 + 2] = tone(c[2]); im.data[i * 4 + 3] = 255; }
    g.putImageData(im, 0, 0);
    const sw = 64, sh = 32, sh_ = sh9((x, y) => { const sx = Math.floor((x + .5) * W / sw), sy = Math.floor((y + .5) * H / sh), i = sy * W + sx; return [F[i * 3], F[i * 3 + 1], F[i * 3 + 2]]; }, sw, sh);
    const e = { canvas: cv, sh: sh_, name: key }; cache.set(key, e); return e;
  }
  // ---- .hdr (Radiance RGBE) ----
  function parseHDR(buf) {
    const b = new Uint8Array(buf); let p = 0; const line = () => { let s = ''; while (p < b.length && b[p] !== 10) s += String.fromCharCode(b[p++]); p++; return s; };
    if (!/^#\?/.test(line())) throw new Error('No es un archivo .hdr'); let l; while ((l = line()) !== '') if (p >= b.length) throw new Error('Cabecera .hdr incompleta');
    const m = line().match(/-Y\s+(\d+)\s+\+X\s+(\d+)/); if (!m) throw new Error('Orientación .hdr no soportada'); const h = +m[1], w = +m[2];
    const out = new Float32Array(w * h * 3), sl = new Uint8Array(w * 4);
    for (let y = 0; y < h; y++) {
      if (b[p] === 2 && b[p + 1] === 2 && ((b[p + 2] << 8) | b[p + 3]) === w) { p += 4; for (let c = 0; c < 4; c++) { let x = 0; while (x < w) { let n = b[p++]; if (n > 128) { n -= 128; const v = b[p++]; for (let k = 0; k < n; k++) sl[(x++) * 4 + c] = v; } else for (let k = 0; k < n; k++) sl[(x++) * 4 + c] = b[p++]; } } }
      else for (let x = 0; x < w; x++) { for (let c = 0; c < 4; c++) sl[x * 4 + c] = b[p++]; }
      for (let x = 0; x < w; x++) { const e = sl[x * 4 + 3], f = e ? Math.pow(2, e - 136) : 0, i = (y * w + x) * 3; out[i] = sl[x * 4] * f; out[i + 1] = sl[x * 4 + 1] * f; out[i + 2] = sl[x * 4 + 2] * f; }
    }
    return { w, h, data: out };
  }
  async function fromFile(file) {
    let w, h, get;
    if (/\.hdr$/i.test(file.name)) { const r = parseHDR(await file.arrayBuffer()); w = r.w; h = r.h; get = (x, y) => { const i = (y * w + x) * 3; return [r.data[i], r.data[i + 1], r.data[i + 2]]; }; }
    else { const bm = await createImageBitmap(file), c = document.createElement('canvas'); c.width = Math.min(2048, bm.width); c.height = Math.round(c.width * bm.height / bm.width); const g = c.getContext('2d'); g.drawImage(bm, 0, 0, c.width, c.height); const d = g.getImageData(0, 0, c.width, c.height).data; w = c.width; h = c.height; const lin = x => Math.pow(x / 255, 2.2); get = (x, y) => { const i = (y * w + x) * 4; return [lin(d[i]), lin(d[i + 1]), lin(d[i + 2])]; }; }
    // promedio para la exposición automática
    let avg = 0, n = 0; for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) { const c = get(x, y); avg += (c[0] + c[1] + c[2]) / 3; n++; } avg /= n; const k = .35 / Math.max(1e-4, avg);
    const OW = 1024, OH = 512, cv = document.createElement('canvas'); cv.width = OW; cv.height = OH; const g = cv.getContext('2d'), im = g.createImageData(OW, OH);
    for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) { const c = get(Math.floor(x * w / OW), Math.floor(y * h / OH)), i = (y * OW + x) * 4; im.data[i] = tone(c[0] * k); im.data[i + 1] = tone(c[1] * k); im.data[i + 2] = tone(c[2] * k); im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0);
    const sw = 64, shh = 32, cell = (x, y) => { let s = [0, 0, 0], m = 0; const x0 = Math.floor(x * w / sw), x1 = Math.floor((x + 1) * w / sw), y0 = Math.floor(y * h / shh), y1 = Math.floor((y + 1) * h / shh); for (let yy = y0; yy < y1; yy += Math.max(1, (y1 - y0) >> 2)) for (let xx = x0; xx < x1; xx += Math.max(1, (x1 - x0) >> 2)) { const c = get(xx, yy); s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; m++; } return s.map(v => v / Math.max(1, m) * k); };
    const grid = []; for (let y = 0; y < shh; y++) for (let x = 0; x < sw; x++) grid.push(cell(x, y));
    const sh = sh9((x, y) => grid[y * sw + x], sw, shh);
    // sol: la zona más brillante pasa a ser la luz principal
    let best = 0, bx = 0, by = 0; grid.forEach((c, i) => { const l = c[0] + c[1] + c[2]; if (l > best) { best = l; bx = i % sw; by = Math.floor(i / sw); } });
    const d = dirOf((bx + .5) / sw, (by + .5) / shh), el = Math.asin(d[1]) * 180 / Math.PI, az = Math.atan2(d[0], -d[2]) * 180 / Math.PI, c = grid[by * sw + bx], mx = Math.max(...c, 1e-4);
    const strong = best / 3 > 4 * .35;
    return { canvas: cv, sh, name: file.name, sun: { az, el, int: strong ? 1.6 : .5, color: '#' + c.map(v => Math.round(255 * Math.min(1, v / mx))).map(v => v.toString(16).padStart(2, '0')).join('') } };
  }
  return { scene, fromFile, SCENES: Object.keys(SCENES) };
})();

const K3GL = (() => {
  // imagen del visor (K3LOOKS): saturación, contraste, temperatura, viñeta y grano, sobre el color final (ya en sRGB)
  const GRADE = `uniform float gSat;uniform float gCon;uniform float gWarm;uniform float gVig;uniform float gGrain;uniform vec2 gRes;
    vec3 grade(vec3 c){float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,gSat);c=(c-.5)*gCon+.5;c*=vec3(1.+gWarm*.14,1.+gWarm*.02,1.-gWarm*.16);
      vec2 q=gl_FragCoord.xy/gRes-.5;c*=1.-gVig*dot(q,q)*1.9;c+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)*gGrain*.16;return clamp(c,0.,1.);}`;
  const VS = `attribute vec3 p;attribute vec3 n;attribute vec2 t;uniform mat4 mvp;uniform mat4 mv;uniform float grow;varying vec3 vn;varying vec2 vt;varying vec3 vp;
    void main(){vec3 q=p*grow;vn=mat3(mv)*n;vt=t;vp=(mv*vec4(q,1.)).xyz;gl_Position=mvp*vec4(q,1.);}`;
  const FS = `#extension GL_OES_standard_derivatives : enable
    precision highp float;varying vec3 vn;varying vec2 vt;varying vec3 vp;
    uniform sampler2D tex;uniform sampler2D nrm;uniform sampler2D srm;uniform sampler2D gls;uniform sampler2D env;uniform sampler2D env2;
    uniform float useTex;uniform float useN;uniform float useS;uniform float useG;uniform float bump;uniform vec3 col;uniform float glossK;uniform float debug;
    uniform vec3 L1;uniform vec3 C1;uniform vec3 L2;uniform vec3 C2;uniform vec3 L3;uniform vec3 C3;uniform float amb;uniform float specK;uniform float expo;uniform float defSpec;uniform float defRough;
    uniform vec3 sh[9];uniform float envInt;uniform float envYaw;uniform float envMix;uniform float useEnv;uniform float gRim;${GRADE}
    const float PI=3.14159265;
    vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
    vec3 rotY(vec3 d,float a){float c=cos(a),s=sin(a);return vec3(c*d.x+s*d.z,d.y,-s*d.x+c*d.z);}
    vec2 eq(vec3 d){return vec2(.5+atan(d.x,-d.z)/(2.*PI),acos(clamp(d.y,-1.,1.))/PI);}
    vec3 envS(vec3 d,float b){vec2 u=eq(rotY(d,envYaw));vec3 a=pow(texture2D(env,u,b).rgb,vec3(2.2));vec3 c=pow(texture2D(env2,u,b).rgb,vec3(2.2));return mix(c,a,envMix);}
    vec3 irr(vec3 n){vec3 d=rotY(n,envYaw);float x=d.x,y=d.y,z=d.z;return max(vec3(0.),.886227*sh[0]+1.023328*(sh[1]*y+sh[2]*z+sh[3]*x)+.858086*(sh[4]*x*y+sh[5]*y*z+sh[7]*x*z)+.247708*sh[6]*(3.*z*z-1.)+.429043*sh[8]*(x*x-y*y));}
    vec3 light(vec3 N,vec3 V,vec3 L,vec3 C,vec3 alb,float sp,float sh_){float d=max(dot(N,L),0.);vec3 H=normalize(L+V);float s=pow(max(dot(N,H),0.),sh_)*sp*(sh_+8.)/40.;float w=.25;float dw=max((dot(N,L)+w)/(1.+w),0.);return C*(alb*mix(d,dw,.35)+s*d);}
    void main(){vec3 N=normalize(vn);vec3 V=normalize(-vp);if(dot(N,V)<0.)N=-N;
      if(useN>.5){vec3 dp1=dFdx(vp),dp2=dFdy(vp);vec2 du1=dFdx(vt),du2=dFdy(vt);vec3 p2=cross(dp2,N),p1=cross(N,dp1);vec3 T=p2*du1.x+p1*du2.x;vec3 B=p2*du1.y+p1*du2.y;float iv=inversesqrt(max(max(dot(T,T),dot(B,B)),1e-12));
        vec2 nn=(texture2D(nrm,vt).rg*2.-1.)*bump;vec3 tn=vec3(nn.x,-nn.y,sqrt(max(0.,1.-dot(nn,nn))));N=normalize(T*iv*tn.x+B*iv*tn.y+N*tn.z);}
      float g=useG>.5?texture2D(gls,vt).r:.5;
      if(debug>.5&&debug<1.5){gl_FragColor=vec4(vec3(g),1.);return;}
      if(debug>1.5){gl_FragColor=vec4(N*.5+.5,1.);return;}
      vec3 alb=useTex>.5?texture2D(tex,vt).rgb:col;alb=pow(alb,vec3(2.2));
      vec2 sr=useS>.5?texture2D(srm,vt).rg:vec2(defSpec,defRough);
      float gm=mix(1.,.15+g*1.85,glossK);float sp=sr.x*.55*specK*gm;float rough=clamp(sr.y-(g-.5)*.5*glossK,.04,1.);float sh_=mix(48.,5.,rough);
      vec3 c=alb*amb*(useEnv>.5?irr(N)*envInt:vec3(.35))+light(N,V,L1,C1,alb,sp,sh_)+light(N,V,L2,C2,alb,sp*.5,sh_)+light(N,V,L3,C3,alb,sp*.8,sh_);
      if(useEnv>.5){vec3 R=reflect(-V,N);float fr=.04+.96*pow(1.-max(dot(N,V),0.),5.);c+=envS(R,rough*7.)*fr*sp*1.4*envInt;}
      c+=pow(1.-max(dot(N,V),0.),3.)*C3*.15*gRim;
      gl_FragColor=vec4(grade(pow(aces(c*expo),vec3(1./2.2))),1.);}`;
  // fondo: el entorno visto por la cámara
  const BVS = `attribute vec2 q;varying vec2 vq;void main(){vq=q;gl_Position=vec4(q,.999,1.);}`;
  const BFS = `precision highp float;varying vec2 vq;uniform sampler2D env;uniform sampler2D env2;uniform float envYaw;uniform float envMix;uniform vec2 tanH;uniform float blur;uniform float expo;uniform float pitch;${GRADE}
    const float PI=3.14159265;vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
    void main(){vec3 d=normalize(vec3(vq.x*tanH.x,vq.y*tanH.y,-1.));float c=cos(pitch),s=sin(pitch);d=vec3(d.x,c*d.y-s*d.z,s*d.y+c*d.z);
      float cy=cos(envYaw),sy=sin(envYaw);d=vec3(cy*d.x+sy*d.z,d.y,-sy*d.x+cy*d.z);vec2 u=vec2(.5+atan(d.x,-d.z)/(2.*PI),acos(clamp(d.y,-1.,1.))/PI);
      vec3 a=pow(texture2D(env,u,blur).rgb,vec3(2.2)),b=pow(texture2D(env2,u,blur).rgb,vec3(2.2));gl_FragColor=vec4(grade(pow(aces(mix(b,a,envMix)*expo),vec3(1./2.2))),1.);}`;
  // selección: guarda la coordenada de textura (12 bits por eje) para pintar sobre el modelo
  const PFS = `precision highp float;varying vec2 vt;void main(){vec2 u=clamp(vt,0.,1.)*4095.;float uh=floor(u.x/16.),ul=mod(floor(u.x),16.),vh=floor(u.y/256.),vl=mod(floor(u.y),256.);gl_FragColor=vec4(uh/255.,(ul*16.+vh)/255.,vl/255.,1.);}`;
  const PVS = `attribute vec3 p;attribute vec2 t;uniform mat4 mvp;uniform float grow;varying vec2 vt;void main(){vt=t;gl_Position=mvp*vec4(p*grow,1.);}`;
  function make(canvas) {
    const gl = canvas.getContext('webgl', { antialias: true, preserveDrawingBuffer: true, premultipliedAlpha: false, alpha: true }); if (!gl) return null;
    gl.getExtension('OES_standard_derivatives');
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const prog = (v, f) => { const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, v)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, f)); gl.linkProgram(pr); return pr; };
    const pr = prog(VS, FS), bp = prog(BVS, BFS), pp = prog(PVS, PFS); gl.useProgram(pr);
    const U = (p, n) => gl.getUniformLocation(p, n), loc = { p: gl.getAttribLocation(pr, 'p'), n: gl.getAttribLocation(pr, 'n'), t: gl.getAttribLocation(pr, 't') };
    for (const n of ['mvp', 'mv', 'grow', 'tex', 'nrm', 'srm', 'gls', 'env', 'env2', 'useTex', 'useN', 'useS', 'useG', 'bump', 'col', 'glossK', 'debug', 'L1', 'C1', 'L2', 'C2', 'L3', 'C3', 'amb', 'specK', 'expo', 'defSpec', 'defRough', 'envInt', 'envYaw', 'envMix', 'useEnv', 'gRim', 'gSat', 'gCon', 'gWarm', 'gVig', 'gGrain', 'gRes']) loc[n] = U(pr, n);
    loc.sh = U(pr, 'sh');
    [['tex', 0], ['nrm', 1], ['srm', 2], ['gls', 3], ['env', 4], ['env2', 5]].forEach(([n, i]) => gl.uniform1i(loc[n], i));
    const bl = { q: gl.getAttribLocation(bp, 'q') }; for (const n of ['env', 'env2', 'envYaw', 'envMix', 'tanH', 'blur', 'expo', 'pitch', 'gSat', 'gCon', 'gWarm', 'gVig', 'gGrain', 'gRes']) bl[n] = U(bp, n);
    gl.useProgram(bp); gl.uniform1i(bl.env, 4); gl.uniform1i(bl.env2, 5); gl.useProgram(pr);
    const pl = { p: gl.getAttribLocation(pp, 'p'), t: gl.getAttribLocation(pp, 't'), mvp: U(pp, 'mvp'), grow: U(pp, 'grow') };
    const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enable(gl.DEPTH_TEST);
    return { gl, pr, bp, pp, loc, bl, pl, quad, bufs: [], tx: {}, src: {} };
  }
  // une las normales de todas las piezas que se tocan (camiseta, mangas, cuello, short): sin esto se ven "escalones" de luz en las costuras
  function weld(parts, tol = .003) {
    const acc = new Map(), key = (x, y, z) => Math.round(x / tol) + ',' + Math.round(y / tol) + ',' + Math.round(z / tol);
    for (const { m } of parts) for (const me of m.meshes) for (let i = 0; i < me.pos.length / 3; i++) { const k = key(me.pos[i * 3], me.pos[i * 3 + 1], me.pos[i * 3 + 2]); let v = acc.get(k); if (!v) acc.set(k, v = [0, 0, 0]); v[0] += me.nrm[i * 3]; v[1] += me.nrm[i * 3 + 1]; v[2] += me.nrm[i * 3 + 2]; }
    return parts.map(({ k, m }) => ({ k, m: { meshes: m.meshes.map(me => { const n = new Float32Array(me.nrm.length); for (let i = 0; i < me.pos.length / 3; i++) { const v = acc.get(key(me.pos[i * 3], me.pos[i * 3 + 1], me.pos[i * 3 + 2])), l = Math.hypot(v[0], v[1], v[2]) || 1, o = me.nrm; const d = (o[i * 3] * v[0] + o[i * 3 + 1] * v[1] + o[i * 3 + 2] * v[2]) / l; if (d > .5) { n[i * 3] = v[0] / l; n[i * 3 + 1] = v[1] / l; n[i * 3 + 2] = v[2] / l; } else { n[i * 3] = o[i * 3]; n[i * 3 + 1] = o[i * 3 + 1]; n[i * 3 + 2] = o[i * 3 + 2]; } } return Object.assign({}, me, { nrm: n }); }) } }));
  }
  const ORDER = { shirt: 0, shorts: 1, socks: 2, sleeve: 3, collar: 4 };
  function upload(R, parts) {
    const { gl } = R; for (const b of R.bufs) for (const x of [b.p, b.n, b.t, b.i]) gl.deleteBuffer(x); R.bufs = [];
    for (const { k, m } of [...parts].sort((a, b) => (ORDER[a.k] ?? 9) - (ORDER[b.k] ?? 9))) for (const me of m.meshes) {
      const mk = (data, tgt = gl.ARRAY_BUFFER) => { const o = gl.createBuffer(); gl.bindBuffer(tgt, o); gl.bufferData(tgt, data, gl.STATIC_DRAW); return o; };
      R.bufs.push({ k, p: mk(me.pos), n: mk(me.nrm), t: mk(me.uv), i: mk(me.idx, gl.ELEMENT_ARRAY_BUFFER), c: me.idx.length, uv: me.hasUV });
    }
  }
  // slot: 0 kit, 1 normal, 2 srm, 3 brillo (alfa del kit), 4 y 5 entorno
  function setTex(R, slot, src, wrap) {
    const { gl } = R; R.rev = R.rev || {}; if (R.src[slot] === src && (!src || R.rev[slot] === (src.__rev || 0))) return; R.src[slot] = src; R.rev[slot] = src ? src.__rev || 0 : 0;
    if (R.tx[slot]) { gl.deleteTexture(R.tx[slot]); R.tx[slot] = null; } if (!src) return;
    const t = R.tx[slot] = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + slot); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    const pot = v => !(v & (v - 1));
    if (pot(src.width) && pot(src.height)) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); const an = gl.getExtension('EXT_texture_filter_anisotropic'); if (an && slot < 4) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, 8); if (slot >= 4) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); }
    else { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); }
  }
  const setTexture = (R, src) => setTex(R, 0, src);
  const mul = (a, b) => { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; };
  const rgb = h => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const dir = (az, el) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)]; };
  function matrices(R, sc) {
    const c = R.gl.canvas, W = c.width, H = c.height, { center: ce, radius: r, mirror } = sc.fit, cy = Math.cos(sc.yaw), sy = Math.sin(sc.yaw), cp = Math.cos(sc.pitch), sp = Math.sin(sc.pitch), a = W / H;
    const T = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -ce[0], -ce[1], -ce[2], 1]), Mi = new Float32Array([mirror, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    const Ry = new Float32Array([cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, 0, 0, 0, 1]), Rx = new Float32Array([1, 0, 0, 0, 0, cp, sp, 0, 0, -sp, cp, 0, 0, 0, 0, 1]);
    let MV = mul(Rx, mul(Ry, mul(Mi, T))), P; const d = sc.dist || r * 2.7, fov = (sc.fov || 48) * Math.PI / 360, px = sc.panX || 0, py = sc.panY || 0;
    if (sc.ortho) { const s = r * 1.04, sx = a >= 1 ? s * a : s, syy = a >= 1 ? s : s / a; P = new Float32Array([1 / sx, 0, 0, 0, 0, 1 / syy, 0, 0, 0, 0, -1 / (r * 4), 0, 0, 0, 0, 1]); MV = mul(new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -r * 2, 1]), MV); P = mul(P, new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, r * 2, 1])); }
    else { const f = 1 / Math.tan(fov), n = d * .05, fr = d * 4; P = new Float32Array([f / a, 0, 0, 0, 0, f, 0, 0, 0, 0, (fr + n) / (n - fr), -1, 0, 0, 2 * fr * n / (n - fr), 0]); MV = mul(new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -px, -py, -d, 1]), MV); }
    return { MV, P, MVP: mul(P, MV), tanH: [Math.tan(fov) * a, Math.tan(fov)] };
  }
  const bindMesh = (gl, attrs, b) => { for (const [at, bf, n] of attrs) { if (at < 0) continue; gl.bindBuffer(gl.ARRAY_BUFFER, bf); gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, n, gl.FLOAT, false, 0, 0); } gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.i); };
  function draw(R, sc) {
    const { gl, loc } = R, c = gl.canvas, W = c.width, H = c.height; gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const M = matrices(R, sc), Lt = sc.L || k3LightState(), hasEnv = !!R.tx[4], G = sc.grade || K3LOOKS.natural;
    const grade = u => { gl.uniform1f(u.gSat, G.sat); gl.uniform1f(u.gCon, G.con); gl.uniform1f(u.gWarm, G.warm); gl.uniform1f(u.gVig, G.vig); gl.uniform1f(u.gGrain, G.grain); gl.uniform2f(u.gRes, W, H); };
    // fondo
    if (hasEnv && sc.bg && !sc.ortho) {
      gl.useProgram(R.bp); gl.disable(gl.DEPTH_TEST); gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, R.tx[4]); gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, R.tx[5] || R.tx[4]);
      gl.uniform1f(R.bl.envYaw, Lt.envYaw); gl.uniform1f(R.bl.envMix, R.tx[5] ? Lt.envMix : 1); gl.uniform2f(R.bl.tanH, M.tanH[0], M.tanH[1]); gl.uniform1f(R.bl.blur, sc.bgBlur ?? 2); gl.uniform1f(R.bl.expo, Lt.exp * (sc.bgExp ?? 1)); gl.uniform1f(R.bl.pitch, 0); grade(R.bl);
      gl.bindBuffer(gl.ARRAY_BUFFER, R.quad); gl.enableVertexAttribArray(R.bl.q); gl.vertexAttribPointer(R.bl.q, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.disableVertexAttribArray(R.bl.q); gl.enable(gl.DEPTH_TEST);
    }
    gl.useProgram(R.pr);
    gl.uniformMatrix4fv(loc.mvp, false, M.MVP); gl.uniformMatrix4fv(loc.mv, false, M.MV); gl.uniform1f(loc.grow, sc.grow || 1);
    const setL = (u, cu, l) => { const v = dir(l[0], Math.max(-10, Math.min(89, l[1]))), cc = rgb(l[3]).map(x => x * l[2]); gl.uniform3f(loc[u], v[0], v[1], v[2]); gl.uniform3f(loc[cu], cc[0], cc[1], cc[2]); };
    setL('L1', 'C1', Lt.key); setL('L2', 'C2', Lt.fill); setL('L3', 'C3', Lt.rim);
    gl.uniform1f(loc.amb, Lt.amb); gl.uniform1f(loc.specK, Lt.spec); gl.uniform1f(loc.expo, Lt.exp); gl.uniform1f(loc.envInt, Lt.envInt); gl.uniform1f(loc.envYaw, Lt.envYaw); gl.uniform1f(loc.envMix, R.tx[5] ? Lt.envMix : 1); gl.uniform1f(loc.useEnv, hasEnv ? 1 : 0); gl.uniform1f(loc.gRim, G.rim ?? 1); grade(loc);
    if (Lt.sh) gl.uniform3fv(loc.sh, new Float32Array(Lt.sh.flat()));
    gl.uniform1f(loc.defSpec, sc.defSpec == null ? .3 : sc.defSpec); gl.uniform1f(loc.defRough, sc.defRough == null ? .6 : sc.defRough); gl.uniform1f(loc.glossK, sc.glossK ?? 1); gl.uniform1f(loc.debug, sc.debug || 0);
    gl.disable(gl.CULL_FACE);
    for (let s = 0; s < 6; s++) { gl.activeTexture(gl.TEXTURE0 + s); gl.bindTexture(gl.TEXTURE_2D, R.tx[s] || (s === 5 ? R.tx[4] : null) || null); }
    for (const b of R.bufs) {
      const useTex = R.tx[0] && b.uv && sc.textured.has(b.k), col = sc.colors[b.k] || [.6, .6, .6], useN = useTex && R.tx[1] && sc.nrm !== false;
      gl.uniform1f(loc.useTex, useTex ? 1 : 0); gl.uniform3f(loc.col, col[0], col[1], col[2]); gl.uniform1f(loc.useN, useN ? 1 : 0); gl.uniform1f(loc.useS, useTex && R.tx[2] ? 1 : 0); gl.uniform1f(loc.useG, useTex && R.tx[3] ? 1 : 0); gl.uniform1f(loc.bump, sc.bump ?? 1);
      // las piezas que van encima (cuello, mangas) se adelantan un poquito para que no "peleen" con la camiseta en las uniones
      const off = b.k === 'collar' ? 3 : b.k === 'sleeve' ? 1.5 : 0; if (off) { gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-off, -off); } else gl.disable(gl.POLYGON_OFFSET_FILL);
      bindMesh(gl, [[loc.p, b.p, 3], [loc.n, b.n, 3], [loc.t, b.t, 2]], b); gl.drawElements(gl.TRIANGLES, b.c, gl.UNSIGNED_SHORT, 0);
    }
    gl.disable(gl.POLYGON_OFFSET_FILL);
    return M;
  }
  // coordenada de textura bajo el puntero (para pintar el brillo); pickAll devuelve la de cada píxel (RGBA, de abajo hacia arriba)
  function pick(R, sc, x, y) { const px = pickPass(R, sc, [Math.round(x), Math.round(R.gl.canvas.height - 1 - y), 1, 1]); if (!px[3]) return null; return uvOf(px, 0); }
  const uvOf = (px, i) => ({ u: (px[i] * 16 + (px[i + 1] >> 4)) / 4095, v: ((px[i + 1] & 15) * 256 + px[i + 2]) / 4095 });
  const pickAll = (R, sc) => pickPass(R, sc, [0, 0, R.gl.canvas.width, R.gl.canvas.height]);
  function pickPass(R, sc, [rx, ry, rw, rh]) {
    const { gl } = R, W = gl.canvas.width, H = gl.canvas.height;
    if (!R.fb || R.fbW !== W || R.fbH !== H) { if (R.fb) { gl.deleteFramebuffer(R.fb); gl.deleteTexture(R.fbt); gl.deleteRenderbuffer(R.fbd); }
      R.fb = gl.createFramebuffer(); R.fbt = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, R.fbt); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      R.fbd = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, R.fbd); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, W, H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, R.fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, R.fbt, 0); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, R.fbd); R.fbW = W; R.fbH = H; }
    gl.bindFramebuffer(gl.FRAMEBUFFER, R.fb); gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const M = matrices(R, sc); gl.useProgram(R.pp); gl.uniformMatrix4fv(R.pl.mvp, false, M.MVP); gl.uniform1f(R.pl.grow, 1);
    for (const b of R.bufs) { if (!b.uv || !sc.textured.has(b.k)) continue; const off = b.k === 'collar' ? 3 : b.k === 'sleeve' ? 1.5 : 0; if (off) { gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-off, -off); } else gl.disable(gl.POLYGON_OFFSET_FILL); bindMesh(gl, [[R.pl.p, b.p, 3], [R.pl.t, b.t, 2]], b); gl.drawElements(gl.TRIANGLES, b.c, gl.UNSIGNED_SHORT, 0); }
    gl.disable(gl.POLYGON_OFFSET_FILL);
    const px = new Uint8Array(rw * rh * 4); gl.readPixels(rx, ry, rw, rh, gl.RGBA, gl.UNSIGNED_BYTE, px); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.useProgram(R.pr);
    for (const at of [R.pl.p, R.pl.t]) if (at >= 0) gl.disableVertexAttribArray(at);
    return px;
  }
  return { make, upload, setTex, setTexture, draw, pick, pickAll, uvOf, weld, matrices };
})();
// estado de luz: escena + ajustes del usuario; se interpola para que los cambios se vean como una transición
function k3LightTarget() {
  const L = K3.light, PR = K3LIGHTS[L.preset] || K3LIGHTS.estudio, i = L.int ?? 1, sun = L.preset === 'hdri' && K3.envUser && K3.envUser.sun;
  const key = sun ? [sun.az, sun.el, sun.int, sun.color] : PR.key;
  const env = L.preset === 'hdri' && K3.envUser ? K3.envUser : K3ENV.scene(PR.env === 'user' ? 'estudio' : PR.env);
  return { key: [key[0] + (L.az || 0), key[1] + (L.el || 0), key[2] * i, key[3]], fill: [PR.fill[0] + (L.az || 0), PR.fill[1], PR.fill[2] * i, PR.fill[3]], rim: [PR.rim[0], PR.rim[1], PR.rim[2] * i, PR.rim[3]],
    amb: PR.amb * (L.amb ?? 1), exp: PR.exp * (L.exp ?? 1), spec: L.spec ?? 1, envInt: L.envInt ?? 1, envYaw: (L.envYaw || 0) * Math.PI / 180, sh: env ? env.sh : null, env };
}
const K3TW = { cur: null, from: null, t0: 0, ms: 650 };
function k3LightState(now = performance.now()) {
  const tg = k3LightTarget(); if (!K3TW.cur) { K3TW.cur = tg; K3TW.envPrev = null; return Object.assign({}, tg, { envMix: 1 }); }
  if (K3TW.target !== JSON.stringify([tg.key, tg.fill, tg.rim, tg.amb, tg.exp, tg.spec, tg.envInt, tg.envYaw, tg.env && tg.env.name])) {
    const k = K3TW.anim ? Math.min(1, (now - K3TW.t0) / K3TW.ms) : 1; K3TW.from = K3TW.anim ? k3Lerp(K3TW.from, K3TW.cur, k) : K3TW.cur;
    if (K3TW.cur.env !== tg.env) K3TW.envPrev = K3TW.cur.env;
    K3TW.cur = tg; K3TW.target = JSON.stringify([tg.key, tg.fill, tg.rim, tg.amb, tg.exp, tg.spec, tg.envInt, tg.envYaw, tg.env && tg.env.name]); K3TW.t0 = now; K3TW.anim = true;
  }
  if (!K3TW.anim) return Object.assign({}, tg, { envMix: 1 });
  const k = Math.min(1, (now - K3TW.t0) / K3TW.ms), e = 1 - (1 - k) ** 3; if (k >= 1) { K3TW.anim = false; K3TW.envPrev = null; }
  return Object.assign(k3Lerp(K3TW.from, tg, e), { envMix: e, env: tg.env });
}
const k3Lerp = (a, b, t) => { if (!a) return b; const L = (x, y) => x + (y - x) * t, C = (x, y) => { const p = parseInt(x.slice(1), 16), q = parseInt(y.slice(1), 16); return '#' + [16, 8, 0].map(s => Math.round(L(p >> s & 255, q >> s & 255)).toString(16).padStart(2, '0')).join(''); }, Li = (x, y) => [L(x[0], y[0]), L(x[1], y[1]), L(x[2], y[2]), C(x[3], y[3])];
  return { key: Li(a.key, b.key), fill: Li(a.fill, b.fill), rim: Li(a.rim, b.rim), amb: L(a.amb, b.amb), exp: L(a.exp, b.exp), spec: L(a.spec, b.spec), envInt: L(a.envInt, b.envInt), envYaw: L(a.envYaw, b.envYaw), sh: a.sh && b.sh ? a.sh.map((c, i) => c.map((v, j) => L(v, b.sh[i][j]))) : b.sh, env: b.env }; };
function k3Fit(parts) {
  let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  const F = [0, 0, 0, 0], B = [0, 0, 0, 0], reg = [];
  for (const { k, m } of parts) for (const me of m.meshes) for (let v = 0; v < me.pos.length / 3; v++) {
    const x = me.pos[v * 3], y = me.pos[v * 3 + 1], z = me.pos[v * 3 + 2];
    if (x < mn[0]) mn[0] = x; if (y < mn[1]) mn[1] = y; if (z < mn[2]) mn[2] = z; if (x > mx[0]) mx[0] = x; if (y > mx[1]) mx[1] = y; if (z > mx[2]) mx[2] = z;
    if (k !== 'shirt' || !me.hasUV) continue; const u = me.uv[v * 2], w = me.uv[v * 2 + 1];
    if (u > .36 && u < .64 && w > .52 && w < .9) { F[0] += x; F[1] += y; F[2] += z; F[3]++; reg.push([x, z, u]); }
    else if (u > .36 && u < .64 && w > .04 && w < .44) { B[0] += x; B[1] += y; B[2] += z; B[3]++; }
  }
  const center = mn.map((v, i) => (v + mx[i]) / 2), radius = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) / 2 || 1;
  let fx = 0, fz = 1; if (F[3] && B[3]) { fx = F[0] / F[3] - B[0] / B[3]; fz = F[2] / F[3] - B[2] / B[3]; const l = Math.hypot(fx, fz) || 1; fx /= l; fz /= l; }
  const a = Math.atan2(fx, fz), yaw0 = -a;
  let mirror = 1;
  if (reg.length > 20) { const c = Math.cos(yaw0), s = Math.sin(yaw0); let su = 0, sx = 0, sxu = 0; for (const [x, z, u] of reg) { const X = c * (x - center[0]) + s * (z - center[2]); sx += X; su += u; sxu += X * u; } const n = reg.length; if (sxu / n - (sx / n) * (su / n) < 0) mirror = -1; }
  return { center, radius, yaw0: mirror < 0 ? a : yaw0, mirror, mn, mx };
}
const hex3 = h => { const n = parseInt((h || '#888888').replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
function k3Scene(cfg, fit, extra = {}) {
  const g = k => cfgGet(cfg, k) || '#888888', M = KMAT.LIST.find(x => x.k === (KS.mat || {}).fabric) || null, V = K3.view, L = K3.light;
  return Object.assign({ fit, yaw: fit.yaw0 + V.yaw, pitch: V.pitch, dist: V.dist, panX: V.panX || 0, panY: V.panY || 0, fov: V.fov || 48, ortho: false, bg: !L.bg || L.bg === 'env', bgBlur: L.bgBlur ?? 2, bump: L.bump ?? 1, nrm: L.nrm !== false, glossK: L.gloss ?? 1, debug: K3.debug || 0,
    defSpec: M ? M.spec / 255 : .3, defRough: M ? M.rough / 255 : .6,
    textured: new Set(['shirt', 'sleeve', 'shorts', 'collar', 'socks']),
    colors: { shirt: hex3(g('ShirtColor1')), sleeve: hex3(g('ShirtColor1')), collar: hex3(g('ShirtColor2')), shorts: hex3(g('ShortsColor')), socks: hex3(g('SocksColor')), arm: hex3(K3.skin) } }, extra);
}
const k3SetEnv = (R, L) => { if (!L.env) { K3GL.setTex(R, 4, null); return; } K3GL.setTex(R, 4, L.env.canvas); K3GL.setTex(R, 5, K3TW.envPrev ? K3TW.envPrev.canvas : null); };
// renderizador fuera de pantalla reutilizable (maqueta y miniaturas)
// lienzo fuera de pantalla; el mapa de coordenadas (k3UvMap) usa uno propio: después de las miniaturas el compartido devolvía el mapa vacío
function k3Off(key = 'off') { if (K3[key]) return K3[key]; const c = document.createElement('canvas'); c.width = 480; c.height = 560; const R = K3GL.make(c); return (K3[key] = R ? { c, R, model: null } : null); }
const K3STUDIO = () => { const e = K3ENV.scene('estudio'), P = K3LIGHTS.estudio; return { key: P.key, fill: P.fill, rim: P.rim, amb: P.amb, exp: P.exp, spec: K3.light.spec ?? 1, envInt: .8, envYaw: 0, sh: e.sh, env: e, envMix: 1 }; };
function k3Snapshot(model, cfg, tex, side, w = 240, h = 280, maps) {
  const O = k3Off(); if (!O || !model || !model.parts.length) return null;
  const shirt = model.raw ? model.parts : model.parts.filter(p => p.k === 'shirt' || p.k === 'sleeve' || p.k === 'collar'); if (!shirt.length) return null;
  if (O.c.width !== w * 2 || O.c.height !== h * 2) { O.c.width = w * 2; O.c.height = h * 2; }
  if (O.model !== model) { K3GL.upload(O.R, shirt); O.fit = k3Fit(shirt); O.model = model; }
  K3GL.setTex(O.R, 0, tex); K3GL.setTex(O.R, 1, maps && maps.nrm); K3GL.setTex(O.R, 2, maps && maps.srm); K3GL.setTex(O.R, 3, maps && maps.gloss);
  const L = K3STUDIO(); k3SetEnv(O.R, L); K3GL.setTex(O.R, 5, null);
  K3GL.draw(O.R, k3Scene(cfg, O.fit, { yaw: O.fit.yaw0 + (side === 'back' ? Math.PI : 0), pitch: 0, ortho: true, dist: 0, panX: 0, panY: 0, L, bg: false, debug: 0 }));
  const out = document.createElement('canvas'); out.width = w; out.height = h; out.getContext('2d').drawImage(O.c, 0, 0, w, h); return out;
}
// coordenada de textura de cada píxel de la maqueta (misma cámara que k3Snapshot): sirve para saber dónde quedó el
// nombre o un número sobre la imagen y para arrastrarlos. Devuelve { w, h, uv } con uv[i*2] = u, uv[i*2+1] = v (-1 = vacío)
function k3UvMap(model, cfg, side, w = 240, h = 280) {
  const O = k3Off('offUv'); if (!O || !model || !model.parts.length) return null;
  const shirt = model.raw ? model.parts : model.parts.filter(p => p.k === 'shirt' || p.k === 'sleeve' || p.k === 'collar'); if (!shirt.length) return null;
  if (O.c.width !== w * 2 || O.c.height !== h * 2) { O.c.width = w * 2; O.c.height = h * 2; }
  if (O.model !== model) { K3GL.upload(O.R, shirt); O.fit = k3Fit(shirt); O.model = model; }
  const px = K3GL.pickAll(O.R, k3Scene(cfg, O.fit, { yaw: O.fit.yaw0 + (side === 'back' ? Math.PI : 0), pitch: 0, ortho: true, dist: 0, panX: 0, panY: 0, bg: false, debug: 0 }));
  const W = w * 2, H = h * 2, uv = new Float32Array(w * h * 2).fill(-1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((H - 1 - (y * 2 + 1)) * W + x * 2 + 1) * 4; if (!px[i + 3]) continue; const q = K3GL.uvOf(px, i), o = (y * w + x) * 2; uv[o] = q.u; uv[o + 1] = q.v; }
  return { w, h, uv };
}
// miniatura (cuello sobre el torso, o short con medias) para elegir modelo
function k3Thumb(parts, tex, kind, size = 112, maps) {
  const O = k3Off(); if (!O) return null; O.c.width = size * 2; O.c.height = size * 2; O.model = null;
  K3GL.upload(O.R, parts); K3GL.setTex(O.R, 0, tex); K3GL.setTex(O.R, 1, maps && maps.nrm); K3GL.setTex(O.R, 2, maps && maps.srm); K3GL.setTex(O.R, 3, maps && maps.gloss);
  const L = K3STUDIO(); k3SetEnv(O.R, L); K3GL.setTex(O.R, 5, null);
  const fit = k3Fit(parts), focus = kind === 'collar' ? parts.find(p => p.k === 'collar') : null; let f2 = fit;
  if (focus) { const ff = k3Fit([focus]); f2 = Object.assign({}, fit, { center: [ff.center[0], ff.center[1] - .045, ff.center[2]], radius: ff.radius * 1.5 }); }
  K3GL.draw(O.R, k3Scene(KS.cfg, f2, { yaw: fit.yaw0 + (kind === 'collar' ? .4 : .3), pitch: kind === 'collar' ? .38 : .12, ortho: false, dist: f2.radius * 3, panX: 0, panY: 0, fov: 40, L, bg: false, debug: 0 }));
  const out = document.createElement('canvas'); out.width = size; out.height = size; out.getContext('2d').drawImage(O.c, 0, 0, size, size); return out;
}
// ---- imagen del visor: estilos de color y resolución (PS2 dibuja a baja resolución, con píxeles a la vista) ----
const K3LOOKS = {
  natural: { n: 'Natural', sat: 1, con: 1, warm: 0, vig: 0, grain: 0, rim: 1, res: 1 },
  tv: { n: 'Transmisión de TV', sat: 1.15, con: 1.12, warm: .1, vig: .15, grain: 0, rim: 1.4, res: 1 },
  cine: { n: 'Cine', sat: .88, con: 1.18, warm: .5, vig: .6, grain: .3, rim: 1.8, res: 1 },
  vivo: { n: 'Colores vivos', sat: 1.5, con: 1.08, warm: 0, vig: .1, grain: 0, rim: 1.2, res: 1 },
  byn: { n: 'Blanco y negro', sat: 0, con: 1.3, warm: 0, vig: .45, grain: .35, rim: 1.6, res: 1 },
  ps2: { n: 'Retro PS2', sat: 1.2, con: 1.05, warm: .15, vig: .2, grain: 0, rim: .6, res: .35 },
};
const K3LOOK_KEYS = ['sat', 'con', 'warm', 'vig', 'grain', 'rim', 'res'];
function k3Grade() { const L = K3.light, d = K3LOOKS.natural, o = {}; for (const k of K3LOOK_KEYS) o[k] = L['g_' + k] ?? d[k]; return o; }
// ---- visor interactivo ----
function k3Viewer(canvas, model, cfg, tex, maps, opts = {}) {
  const R = K3GL.make(canvas); if (!R) return null; K3GL.upload(R, model.parts); K3GL.setTex(R, 0, tex); K3GL.setTex(R, 1, maps && maps.nrm); K3GL.setTex(R, 2, maps && maps.srm); K3GL.setTex(R, 3, maps && maps.gloss);
  let fit = k3Fit(model.parts); const V = opts.view || K3.view; let raf = 0, anim = null, grow = 1, lastL = null, auto = false;
  const scene = () => k3Scene(cfg, fit, Object.assign({ grade: opts.grade ? k3Grade() : null, grow, yaw: fit.yaw0 + V.yaw, pitch: V.pitch, dist: V.dist, panX: V.panX || 0, panY: V.panY || 0, fov: V.fov || 48 }, opts.scene || {}));
  const paint = () => {
    raf = 0; const res = opts.grade ? k3Grade().res : 1, dpr = Math.min(3, (typeof gfxDpr === 'function' ? gfxDpr() : Math.min(2, devicePixelRatio || 1)) * res), W = Math.round(canvas.clientWidth * dpr), H = Math.round(canvas.clientHeight * dpr); if (W && (canvas.width !== W || canvas.height !== H)) { canvas.width = W; canvas.height = H; } canvas.classList.toggle('pix', res < .9);
    const L = k3LightState(); k3SetEnv(R, L); const sc = scene(); sc.L = L; K3GL.draw(R, sc);
    if (K3TW.anim || anim || auto) req();
  };
  const req = () => { if (!raf) raf = requestAnimationFrame(t => { if (anim) anim(t); if (auto) { V.yaw += .006 * (K3.autoSpeed || 1); opts.onCamera && opts.onCamera(); } paint(); }); };
  // cámara: arrastrar = girar, clic derecho o Shift = mover, rueda = acercar, doble clic = frente
  let drag = null; const dist0 = () => V.dist || fit.radius * 2.7;
  canvas.oncontextmenu = e => e.preventDefault();
  canvas.onpointerdown = e => {
    canvas.focus({ preventScroll: true });
    if (opts.onPaint && K3.paint && e.button === 0 && !e.shiftKey) { drag = { paint: true }; canvas.setPointerCapture(e.pointerId); paintAt(e); return; }
    // nombre y números: si el toque cae sobre uno, se arrastra ese en vez de girar la cámara
    if (opts.onGrab && e.button === 0 && !e.shiftKey) { const hit = hitAt(e); if (hit && opts.onGrab(hit)) { drag = { grab: true }; canvas.setPointerCapture(e.pointerId); anim = null; auto = false; opts.onAuto && opts.onAuto(false); canvas.classList.add('grab'); return; } }
    drag = { x: e.clientX, y: e.clientY, yaw: V.yaw, pitch: V.pitch, px: V.panX || 0, py: V.panY || 0, pan: e.button === 2 || e.shiftKey || e.button === 1 }; canvas.setPointerCapture(e.pointerId); anim = null; auto = false; opts.onAuto && opts.onAuto(false); canvas.classList.add('grab');
  };
  const hitAt = e => { const r = canvas.getBoundingClientRect(), dpr = canvas.width / r.width; return K3GL.pick(R, scene(), (e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr); };
  let hovRaf = 0, hovE = null;
  const paintAt = e => { const r = canvas.getBoundingClientRect(), dpr = canvas.width / r.width, sc = scene(); const hit = K3GL.pick(R, sc, (e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr); if (hit) opts.onPaint(hit); paint(); };
  canvas.onpointermove = e => {
    if (opts.onHover && !drag) opts.onHover(e);
    if (opts.onHoverHit && !drag) { hovE = e; if (!hovRaf) hovRaf = requestAnimationFrame(() => { hovRaf = 0; const on = opts.onHoverHit(hitAt(hovE)); canvas.style.cursor = on ? 'move' : ''; }); }
    if (!drag) return; if (drag.paint) { paintAt(e); return; }
    if (drag.grab) { const hit = hitAt(e); if (hit) opts.onGrabMove(hit); return; }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (drag.pan) { const k = dist0() * Math.tan((V.fov || 48) * Math.PI / 360) * 2 / canvas.clientHeight; V.panX = drag.px - dx * k; V.panY = drag.py + dy * k; }
    else { V.yaw = drag.yaw + dx * .011; V.pitch = Math.max(-1.2, Math.min(1.2, drag.pitch + dy * .008)); }
    req(); opts.onCamera && opts.onCamera();
  };
  canvas.onpointerup = canvas.onpointercancel = () => { if (drag && drag.grab && opts.onGrabEnd) opts.onGrabEnd(); drag = null; canvas.classList.remove('grab'); if (opts.onPaintEnd) opts.onPaintEnd(); };
  canvas.onwheel = e => { e.preventDefault(); if (opts.onWheelHit) { const hit = hitAt(e); if (hit && opts.onWheelHit(hit, e.deltaY < 0 ? 1 : -1)) return; } V.dist = Math.max(fit.radius * .35, Math.min(fit.radius * 7, dist0() * (1 + Math.sign(e.deltaY) * .09))); req(); opts.onCamera && opts.onCamera(); };
  canvas.ondblclick = () => go({ yaw: 0, pitch: .1, dist: 0, panX: 0, panY: 0 });
  canvas.tabIndex = 0;
  canvas.onkeydown = e => { const s = e.shiftKey ? .3 : .12, m = { ArrowLeft: () => V.yaw -= s, ArrowRight: () => V.yaw += s, ArrowUp: () => V.pitch = Math.min(1.2, V.pitch + s * .6), ArrowDown: () => V.pitch = Math.max(-1.2, V.pitch - s * .6), '+': () => V.dist = dist0() * .9, '=': () => V.dist = dist0() * .9, '-': () => V.dist = dist0() * 1.1, '0': () => go({ yaw: 0, pitch: .1, dist: 0, panX: 0, panY: 0 }) }[e.key]; if (m) { e.preventDefault(); m(); req(); opts.onCamera && opts.onCamera(); } };
  // animación de cámara hacia un encuadre
  function go(to, ms = 700) {
    const from = { yaw: V.yaw, pitch: V.pitch, dist: dist0(), panX: V.panX || 0, panY: V.panY || 0, fov: V.fov || 48 }, t0 = performance.now();
    const T = Object.assign({}, from, to); if (to.dist === 0) T.dist = fit.radius * 2.7; if (to.yaw != null) T.yaw = to.yaw + Math.round((from.yaw - to.yaw) / (2 * Math.PI)) * 2 * Math.PI;
    auto = false; opts.onAuto && opts.onAuto(false);
    anim = t => { const k = Math.min(1, (t - t0) / ms), e = 1 - (1 - k) ** 3; for (const key of Object.keys(T)) V[key] = from[key] + (T[key] - from[key]) * e; if (k >= 1) { anim = null; if (to.dist === 0) V.dist = 0; } opts.onCamera && opts.onCamera(); };
    req();
  }
  const spin360 = () => { const from = V.yaw, t0 = performance.now(); auto = false; anim = t => { const k = Math.min(1, (t - t0) / 2600), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2; V.yaw = from + e * 2 * Math.PI; if (k >= 1) anim = null; }; req(); };
  // cambio de piezas: la imagen anterior se funde mientras el modelo nuevo "se acomoda"
  function swap(m2, overlay) {
    if (overlay) { const g = overlay.getContext('2d'); overlay.width = canvas.width; overlay.height = canvas.height; g.drawImage(canvas, 0, 0); overlay.style.transition = 'none'; overlay.style.opacity = 1; overlay.getBoundingClientRect(); overlay.style.transition = 'opacity .45s ease'; requestAnimationFrame(() => { overlay.style.opacity = 0; }); }
    model = m2; triOf.clear(); K3GL.upload(R, m2.parts); fit = k3Fit(m2.parts); const t0 = performance.now();
    if (!ANIM.reduce.matches) { const cam = anim; anim = t => { if (cam) cam(t); const k = Math.min(1, (t - t0) / 450); grow = .965 + .035 * (1 - (1 - k) ** 3) + Math.sin(k * Math.PI) * .006; if (k >= 1) { grow = 1; anim = null; } }; }
    req();
  }
  // dónde cae en pantalla (px del lienzo, sin dpr) un punto de la textura del kit; null si no está o queda tapado / de espaldas
  const triOf = new Map();
  function project(u, v) {
    const key = (u * 1024 | 0) + ',' + (v * 1024 | 0); let hit = triOf.get(key);
    if (hit === undefined) { hit = null;
      for (const p of model.parts) { if (!/^(shirt|sleeve|shorts|socks)$/.test(p.k)) continue; for (const me of p.m.meshes) { if (!me.hasUV) continue; const T = me.uv, I = me.idx;
        for (let i = 0; i < I.length && !hit; i += 3) { const a = I[i], b = I[i + 1], c = I[i + 2], x0 = T[a * 2], y0 = T[a * 2 + 1], x1 = T[b * 2] - x0, y1 = T[b * 2 + 1] - y0, x2 = T[c * 2] - x0, y2 = T[c * 2 + 1] - y0, d = x1 * y2 - x2 * y1; if (Math.abs(d) < 1e-12) continue;
          const px = u - x0, py = v - y0, l1 = (px * y2 - x2 * py) / d, l2 = (x1 * py - px * y1) / d; if (l1 < -1e-4 || l2 < -1e-4 || l1 + l2 > 1 + 1e-4) continue;
          const P = me.pos, q = k => P[a * 3 + k] + l1 * (P[b * 3 + k] - P[a * 3 + k]) + l2 * (P[c * 3 + k] - P[a * 3 + k]); hit = [q(0), q(1), q(2)]; } if (hit) break; } if (hit) break; }
      if (triOf.size > 64) triOf.clear(); triOf.set(key, hit); }
    if (!hit) return null; const sc = scene(), M = K3GL.matrices(R, sc).MVP, g = sc.grow || 1, X = hit[0] * g, Y = hit[1] * g, Z = hit[2] * g;
    const cx = M[0] * X + M[4] * Y + M[8] * Z + M[12], cy = M[1] * X + M[5] * Y + M[9] * Z + M[13], cw = M[3] * X + M[7] * Y + M[11] * Z + M[15]; if (cw <= 0) return null;
    const x = (cx / cw + 1) / 2 * canvas.width, y = (1 - cy / cw) / 2 * canvas.height, k = canvas.clientWidth / (canvas.width || 1), seen = K3GL.pick(R, sc, x, y);
    if (!seen || Math.abs(seen.u - u) > .03 || Math.abs(seen.v - v) > .03) return null; // tapado o de espaldas
    return { x: x * k, y: y * k };
  }
  paint();
  return { redraw: req, go, swap, spin: spin360, fit: () => fit, project,
    front: () => go({ yaw: 0, pitch: .1 }), back: () => go({ yaw: Math.PI, pitch: .1 }), left: () => go({ yaw: Math.PI / 2, pitch: .1 }), right: () => go({ yaw: -Math.PI / 2, pitch: .1 }), threeq: () => go({ yaw: -.65, pitch: .22 }), top: () => go({ yaw: V.yaw, pitch: 1.05 }),
    close: () => go({ yaw: 0, pitch: .05, dist: fit.radius * 1.05, panX: 0, panY: fit.radius * .5 }), reset: () => go({ yaw: 0, pitch: .1, dist: 0, panX: 0, panY: 0, fov: 48 }),
    auto: on => { auto = on; req(); },
    setTex: t => { K3GL.setTex(R, 0, t); req(); }, setMaps: m => { K3GL.setTex(R, 1, m && m.nrm); K3GL.setTex(R, 2, m && m.srm); K3GL.setTex(R, 3, m && m.gloss); req(); }, setCfg: c => { cfg = c; req(); },
    shot: () => { paint(); return canvas.toDataURL('image/png'); }, dispose: () => { cancelAnimationFrame(raf); R.gl.getExtension('WEBGL_lose_context')?.loseContext(); } };
}
