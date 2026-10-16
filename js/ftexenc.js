// ===================== Escritura de texturas .ftex (las que lee el juego / kitserver) =====================
// Formato igual al de los kits del juego: cabecera de 64 bytes, tabla de mips (16 bytes c/u),
// mips guardados del más chico al más grande, cada uno en pedazos de 16 KB comprimidos con zlib.
const FTEXW = (() => {
  // ---- compresión DXT por bloques de 4x4 (caja de colores con un poco de recorte) ----
  const c565 = (r, g, b) => ((r * 31 / 255 + .5) | 0) << 11 | ((g * 63 / 255 + .5) | 0) << 5 | ((b * 31 / 255 + .5) | 0);
  const un565 = c => [((c >> 11) & 31) * 255 / 31, ((c >> 5) & 63) * 255 / 63, (c & 31) * 255 / 31];
  const BLK = new Uint8Array(64);
  function colorBlock(out, o, blk, dxt1) {
    let r0 = 255, g0 = 255, b0 = 255, r1 = 0, g1 = 0, b1 = 0;
    for (let i = 0; i < 16; i++) { const r = blk[i * 4], g = blk[i * 4 + 1], b = blk[i * 4 + 2]; if (r < r0) r0 = r; if (g < g0) g0 = g; if (b < b0) b0 = b; if (r > r1) r1 = r; if (g > g1) g1 = g; if (b > b1) b1 = b; }
    const ir = (r1 - r0) >> 4, ig = (g1 - g0) >> 4, ib = (b1 - b0) >> 4; r0 += ir; g0 += ig; b0 += ib; r1 -= ir; g1 -= ig; b1 -= ib;
    let ca = c565(r1, g1, b1), cb = c565(r0, g0, b0);
    if (ca < cb) { const t = ca; ca = cb; cb = t; }
    if (ca === cb) { if (cb > 0) cb--; else ca++; }
    const A = un565(ca), B = un565(cb), P = [A, B, [(2 * A[0] + B[0]) / 3, (2 * A[1] + B[1]) / 3, (2 * A[2] + B[2]) / 3], [(A[0] + 2 * B[0]) / 3, (A[1] + 2 * B[1]) / 3, (A[2] + 2 * B[2]) / 3]];
    let bits = 0;
    for (let i = 15; i >= 0; i--) {
      const r = blk[i * 4], g = blk[i * 4 + 1], b = blk[i * 4 + 2]; let best = 0, bd = 1e9;
      for (let k = 0; k < 4; k++) { const dr = r - P[k][0], dg = g - P[k][1], db = b - P[k][2], d = dr * dr * 3 + dg * dg * 4 + db * db * 2; if (d < bd) { bd = d; best = k; } }
      bits = (bits << 2) | best;
    }
    out[o] = ca & 255; out[o + 1] = ca >> 8; out[o + 2] = cb & 255; out[o + 3] = cb >> 8;
    out[o + 4] = bits & 255; out[o + 5] = (bits >>> 8) & 255; out[o + 6] = (bits >>> 16) & 255; out[o + 7] = (bits >>> 24) & 255;
  }
  function alphaBlock(out, o, blk) {
    let a0 = 0, a1 = 255; for (let i = 0; i < 16; i++) { const a = blk[i * 4 + 3]; if (a > a0) a0 = a; if (a < a1) a1 = a; }
    out[o] = a0; out[o + 1] = a1; if (a0 === a1) { for (let k = 2; k < 8; k++) out[o + k] = 0; return; }
    const pal = [a0, a1]; for (let k = 1; k < 7; k++) pal.push(((7 - k) * a0 + k * a1) / 7);
    let lo = 0, hi = 0;
    for (let i = 0; i < 16; i++) { const a = blk[i * 4 + 3]; let best = 0, bd = 999; for (let k = 0; k < 8; k++) { const d = Math.abs(a - pal[k]); if (d < bd) { bd = d; best = k; } } if (i < 8) lo |= best << (3 * i); else hi |= best << (3 * (i - 8)); }
    out[o + 2] = lo & 255; out[o + 3] = (lo >> 8) & 255; out[o + 4] = (lo >> 16) & 255; out[o + 5] = hi & 255; out[o + 6] = (hi >> 8) & 255; out[o + 7] = (hi >> 16) & 255;
  }
  function encode(px, w, h, dxt5) {
    const bw = Math.max(1, (w + 3) >> 2), bh = Math.max(1, (h + 3) >> 2), bs = dxt5 ? 16 : 8, out = new Uint8Array(bw * bh * bs);
    let o = 0;
    for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++, o += bs) {
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const sx = Math.min(w - 1, bx * 4 + x), sy = Math.min(h - 1, by * 4 + y), s = (sy * w + sx) * 4, d = (y * 4 + x) * 4; BLK[d] = px[s]; BLK[d + 1] = px[s + 1]; BLK[d + 2] = px[s + 2]; BLK[d + 3] = px[s + 3]; }
      if (dxt5) { alphaBlock(out, o, BLK); colorBlock(out, o + 8, BLK, false); } else colorBlock(out, o, BLK, true);
    }
    return out;
  }
  // DXT3 (BC2): alfa de 4 bits por píxel + color de 4 tonos. Es el formato de las minifaces.
  // El alfa se lleva a 16 niveles con difusión de error (bordes suaves sin escalones) y los píxeles
  // transparentes toman el color de los visibles del bloque (así el borde no se oscurece).
  async function encodeDxt3(px, w, h, progress) {
    const bw = Math.max(1, (w + 3) >> 2), bh = Math.max(1, (h + 3) >> 2), out = new Uint8Array(bw * bh * 16), q = new Uint8Array(w * h);
    let err = new Float32Array(w + 2), nxt = new Float32Array(w + 2);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) { const v = Math.max(0, Math.min(255, px[(y * w + x) * 4 + 3] + err[x + 1])), k = Math.round(v * 15 / 255), e = v - k * 17; q[y * w + x] = k; err[x + 2] += e * 7 / 16; nxt[x] += e * 3 / 16; nxt[x + 1] += e * 5 / 16; nxt[x + 2] += e / 16; }
      const t = err; err = nxt; nxt = t; nxt.fill(0);
    }
    let o = 0;
    for (let by = 0; by < bh; by++) {
      for (let bx = 0; bx < bw; bx++, o += 16) {
        let sr = 0, sg = 0, sb = 0, sa = 0;
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const sx = Math.min(w - 1, bx * 4 + x), sy = Math.min(h - 1, by * 4 + y), s = (sy * w + sx) * 4, d = (y * 4 + x) * 4, a = px[s + 3]; BLK[d] = px[s]; BLK[d + 1] = px[s + 1]; BLK[d + 2] = px[s + 2]; BLK[d + 3] = q[sy * w + sx]; sr += px[s] * a; sg += px[s + 1] * a; sb += px[s + 2] * a; sa += a; }
        const ar = sa ? sr / sa : 0, ag = sa ? sg / sa : 0, ab = sa ? sb / sa : 0;
        for (let i = 0; i < 16; i++) { if (!BLK[i * 4 + 3]) { BLK[i * 4] = ar; BLK[i * 4 + 1] = ag; BLK[i * 4 + 2] = ab; } if (i & 1) out[o + (i >> 1)] |= BLK[i * 4 + 3] << 4; else out[o + (i >> 1)] = BLK[i * 4 + 3]; }
        colorBlock(out, o + 8, BLK, false);
      }
      if (progress && !(by & 31)) { progress(by / bh); await new Promise(r => setTimeout(r, 0)); }
    }
    return out;
  }
  // archivo .dds con un solo nivel (sin mips), con la misma cabecera que usan las minifaces del juego
  function ddsFile(blocks, w, h, four = 'DXT3') {
    const out = new Uint8Array(128 + blocks.length), dv = new DataView(out.buffer);
    dv.setUint32(0, 0x20534444, true); dv.setUint32(4, 124, true); dv.setUint32(8, 0xA1007, true); dv.setUint32(12, h, true); dv.setUint32(16, w, true);
    dv.setUint32(20, blocks.length, true); dv.setUint32(24, 1, true); dv.setUint32(28, 1, true);
    dv.setUint32(76, 32, true); dv.setUint32(80, 4, true); for (let i = 0; i < 4; i++) out[84 + i] = four.charCodeAt(i); dv.setUint32(108, 0x1000, true);
    out.set(blocks, 128); return out;
  }
  async function deflate(u8) { return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer()); }
  async function packMip(data) {
    const CH = 16384, n = Math.max(1, Math.ceil(data.length / CH)), parts = [];
    for (let i = 0; i < n; i += 32) parts.push(...await Promise.all(Array.from({ length: Math.min(32, n - i) }, (_, k) => { const raw = data.subarray((i + k) * CH, Math.min(data.length, (i + k + 1) * CH)); return deflate(raw).then(z => z.length < raw.length ? { z, raw, comp: true } : { z: raw, raw, comp: false }); })));
    const tbl = 8 * n, total = tbl + parts.reduce((a, p) => a + p.z.length, 0), out = new Uint8Array(total), dv = new DataView(out.buffer);
    let off = tbl; parts.forEach((p, i) => { dv.setUint16(i * 8, p.z.length, true); dv.setUint16(i * 8 + 2, p.raw.length & 0xffff, true); dv.setUint32(i * 8 + 4, off, true); out.set(p.z, off); off += p.z.length; });
    return { bytes: out, chunks: n, unc: data.length };
  }
  // píxeles crudos (sin pasar por un canvas: el canvas multiplica el color por el alfa y arruina los kits con brillo en el alfa)
  async function fromPixels(px, W, H, { dxt5 = true, progress } = {}) {
    return assemble(await mipLevels(px, W, H, { dxt5, progress }), W, H, dxt5, progress);
  }
  // todos los tamaños (mips) ya comprimidos en DXT, del más grande al más chico: sirven para el .ftex y para el .dds
  async function mipLevels(px, W, H, { dxt5 = true, progress } = {}) {
    const levels = []; let cur = px, w = W, h = H; const total = W * H * 4 / 3; let done = 0;
    while (true) {
      levels.push(encode(cur, w, h, dxt5)); done += w * h; if (progress) progress(Math.min(.95, done / total)); await new Promise(r => setTimeout(r, 0));
      if (w === 1 && h === 1) break;
      const nw = Math.max(1, w >> 1), nh = Math.max(1, h >> 1), nx = new Uint8Array(nw * nh * 4);
      for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) for (let c = 0; c < 4; c++) { const x0 = Math.min(w - 1, x * 2), x1 = Math.min(w - 1, x * 2 + 1), y0 = Math.min(h - 1, y * 2), y1 = Math.min(h - 1, y * 2 + 1); nx[(y * nw + x) * 4 + c] = (cur[(y0 * w + x0) * 4 + c] + cur[(y0 * w + x1) * 4 + c] + cur[(y1 * w + x0) * 4 + c] + cur[(y1 * w + x1) * 4 + c] + 2) >> 2; }
      cur = nx; w = nw; h = nh;
    }
    return levels;
  }
  // .dds DXT5 con todos sus mips (misma cabecera que las texturas de letras que arma KitPos)
  function ddsMips(levels, W, H) {
    const size = levels.reduce((a, l) => a + l.length, 0), out = new Uint8Array(128 + size), dv = new DataView(out.buffer);
    dv.setUint32(0, 0x20534444, true); dv.setUint32(4, 124, true); dv.setUint32(8, 0xA1007, true); dv.setUint32(12, H, true); dv.setUint32(16, W, true);
    dv.setUint32(20, levels[0].length, true); dv.setUint32(28, levels.length, true);
    dv.setUint32(76, 32, true); dv.setUint32(80, 4, true); for (let i = 0; i < 4; i++) out[84 + i] = 'DXT5'.charCodeAt(i); dv.setUint32(108, 0x401008, true);
    let o = 128; for (const l of levels) { out.set(l, o); o += l.length; }
    return out;
  }
  async function assemble(levels, W, H, dxt5, progress) {
    const packed = []; for (const l of levels) packed.push(await packMip(l));
    const n = levels.length, head = 0x40 + n * 16; let size = head; for (const p of packed) size += p.bytes.length;
    const out = new Uint8Array(size), dv = new DataView(out.buffer);
    out.set([0x46, 0x54, 0x45, 0x58]); dv.setFloat32(4, 2.03, true); dv.setUint16(8, dxt5 ? 4 : 2, true); dv.setUint16(10, W, true); dv.setUint16(12, H, true); dv.setUint16(14, 1, true);
    out[16] = n; out[17] = 2; dv.setUint16(18, 0x11, true); dv.setUint32(0x1C, 3, true);
    let off = head; for (let i = n - 1; i >= 0; i--) { const p = packed[i], e = 0x40 + i * 16; dv.setUint32(e, off, true); dv.setUint32(e + 4, p.unc, true); dv.setUint32(e + 8, p.bytes.length, true); out[e + 12] = i; out[e + 13] = 0; dv.setUint16(e + 14, p.chunks, true); out.set(p.bytes, off); off += p.bytes.length; }
    if (progress) progress(1);
    return out;
  }
  // canvas -> .ftex (fmt 4 = DXT5 con alfa, 2 = DXT1 sin alfa). progress(0..1) opcional
  async function fromCanvas(canvas, { dxt5 = true, minSize = 1, progress } = {}) {
    let W = canvas.width, H = canvas.height; const levels = []; let cur = canvas;
    const total = W * H * 4 / 3; let done = 0;
    while (true) {
      const g = cur.getContext('2d', { willReadFrequently: true }), px = g.getImageData(0, 0, cur.width, cur.height).data;
      levels.push(encode(px, cur.width, cur.height, dxt5)); done += cur.width * cur.height; if (progress) progress(Math.min(.95, done / total)); await new Promise(r => setTimeout(r, 0));
      if (cur.width <= minSize && cur.height <= minSize || (cur.width === 1 && cur.height === 1)) break;
      const nw = Math.max(1, cur.width >> 1), nh = Math.max(1, cur.height >> 1), c = document.createElement('canvas'); c.width = nw; c.height = nh;
      const cg = c.getContext('2d'); cg.imageSmoothingQuality = 'high'; cg.drawImage(cur, 0, 0, nw, nh); cur = c;
    }
    const packed = []; for (const l of levels) packed.push(await packMip(l));
    const n = levels.length, head = 0x40 + n * 16; let size = head; for (const p of packed) size += p.bytes.length;
    const out = new Uint8Array(size), dv = new DataView(out.buffer);
    out.set([0x46, 0x54, 0x45, 0x58]); dv.setFloat32(4, 2.03, true); dv.setUint16(8, dxt5 ? 4 : 2, true); dv.setUint16(10, W, true); dv.setUint16(12, H, true); dv.setUint16(14, 1, true);
    out[16] = n; out[17] = 2; dv.setUint16(18, 0x11, true); dv.setUint32(0x1C, 3, true);
    let off = head; for (let i = n - 1; i >= 0; i--) { const p = packed[i], e = 0x40 + i * 16; dv.setUint32(e, off, true); dv.setUint32(e + 4, p.unc, true); dv.setUint32(e + 8, p.bytes.length, true); out[e + 12] = i; out[e + 13] = 0; dv.setUint16(e + 14, p.chunks, true); out.set(p.bytes, off); off += p.bytes.length; }
    if (progress) progress(1);
    return out;
  }
  // lleva una imagen a potencia de 2 (lo que espera el juego), sin pasar de max
  function pow2Canvas(src, max = 4096, forceW, forceH) {
    const p2 = v => 2 ** Math.round(Math.log2(Math.max(4, v)));
    const W = forceW || Math.min(max, p2(src.width)), H = forceH || Math.min(max, p2(src.height));
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, W, H); return c;
  }
  // re-muestreo de píxeles crudos a potencia de 2 (vecino más cercano en reducción suave por promedio)
  function pow2Pixels(px, W, H, max = 4096) {
    const p2 = v => Math.min(max, 2 ** Math.round(Math.log2(Math.max(4, v)))), NW = p2(W), NH = p2(H); if (NW === W && NH === H) return { px, w: W, h: H };
    const out = new Uint8Array(NW * NH * 4); for (let y = 0; y < NH; y++) { const sy = Math.min(H - 1, Math.floor((y + .5) * H / NH)); for (let x = 0; x < NW; x++) { const sx = Math.min(W - 1, Math.floor((x + .5) * W / NW)), s = (sy * W + sx) * 4, d = (y * NW + x) * 4; out[d] = px[s]; out[d + 1] = px[s + 1]; out[d + 2] = px[s + 2]; out[d + 3] = px[s + 3]; } }
    return { px: out, w: NW, h: NH };
  }
  // imagen (png/jpg/webp) -> píxeles crudos sin premultiplicar, leyéndola por WebGL
  async function rawFromImage(file) {
    const bm = await createImageBitmap(file, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }), c = document.createElement('canvas'), gl = c.getContext('webgl', { premultipliedAlpha: false });
    if (!gl) { c.width = bm.width; c.height = bm.height; const g = c.getContext('2d'); g.drawImage(bm, 0, 0); return { w: bm.width, h: bm.height, data: g.getImageData(0, 0, bm.width, bm.height).data }; }
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bm); const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    const out = new Uint8Array(bm.width * bm.height * 4); gl.readPixels(0, 0, bm.width, bm.height, gl.RGBA, gl.UNSIGNED_BYTE, out); gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { w: bm.width, h: bm.height, data: out };
  }
  return { fromCanvas, fromPixels, mipLevels, assemble, ddsMips, encode, encodeDxt3, ddsFile, pow2Canvas, pow2Pixels, rawFromImage };
})();
