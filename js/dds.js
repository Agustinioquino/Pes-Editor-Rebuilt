// ===================== DDS (DXT1/DXT3/DXT5/RGBA) → RGBA =====================
const DDS = (() => {
  function c565(c) { return [((c >> 11) & 31) * 255 / 31 | 0, ((c >> 5) & 63) * 255 / 63 | 0, (c & 31) * 255 / 31 | 0]; }
  function colorBlock(src, o, out, w, x, y, dxt1, alphaFn) {
    const c0 = src[o] | src[o + 1] << 8, c1 = src[o + 2] | src[o + 3] << 8;
    const a = c565(c0), b = c565(c1), pal = [a, b];
    if (!dxt1 || c0 > c1) { pal.push([(2 * a[0] + b[0]) / 3 | 0, (2 * a[1] + b[1]) / 3 | 0, (2 * a[2] + b[2]) / 3 | 0]); pal.push([(a[0] + 2 * b[0]) / 3 | 0, (a[1] + 2 * b[1]) / 3 | 0, (a[2] + 2 * b[2]) / 3 | 0]); }
    else { pal.push([(a[0] + b[0]) / 2 | 0, (a[1] + b[1]) / 2 | 0, (a[2] + b[2]) / 2 | 0]); pal.push(null); }
    const bits = src[o + 4] | src[o + 5] << 8 | src[o + 6] << 16 | src[o + 7] << 24;
    for (let py = 0; py < 4; py++) for (let px = 0; px < 4; px++) {
      const i = py * 4 + px, idx = (bits >>> (2 * i)) & 3, col = pal[idx];
      const X = x + px, Y = y + py; if (X >= w) continue;
      const p = (Y * w + X) * 4;
      if (!col) { out[p + 3] = 0; continue; }
      out[p] = col[0]; out[p + 1] = col[1]; out[p + 2] = col[2]; out[p + 3] = alphaFn ? alphaFn(i) : 255;
    }
  }
  function decode(buf) {
    const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    if (dv.getUint32(0, true) !== 0x20534444) throw new Error('No es un DDS');
    const h = dv.getUint32(12, true), w = dv.getUint32(16, true);
    const pfFlags = dv.getUint32(80, true), four = String.fromCharCode(b[84], b[85], b[86], b[87]);
    const bitCount = dv.getUint32(88, true);
    let off = 128;
    const out = new Uint8ClampedArray(w * h * 4);
    if (pfFlags & 4) {
      const kind = four === 'DXT1' ? 1 : four === 'DXT3' ? 3 : four === 'DXT5' ? 5 : 0;
      if (!kind) throw new Error('Formato DDS no soportado: ' + four);
      const bs = kind === 1 ? 8 : 16;
      for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4, off += bs) {
        if (y >= h) break;
        if (kind === 1) colorBlock(b, off, out, w, x, y, true, null);
        else if (kind === 3) { const ao = off; colorBlock(b, off + 8, out, w, x, y, false, i => ((b[ao + (i >> 1)] >> ((i & 1) * 4)) & 15) * 17); }
        else {
          const a0 = b[off], a1 = b[off + 1], al = [a0, a1];
          if (a0 > a1) for (let k = 1; k < 7; k++) al.push(((7 - k) * a0 + k * a1) / 7 | 0);
          else { for (let k = 1; k < 5; k++) al.push(((5 - k) * a0 + k * a1) / 5 | 0); al.push(0, 255); }
          let bits = 0n; for (let k = 0; k < 6; k++) bits |= BigInt(b[off + 2 + k]) << BigInt(8 * k);
          const idx = []; for (let i = 0; i < 16; i++) idx.push(Number((bits >> BigInt(3 * i)) & 7n));
          colorBlock(b, off + 8, out, w, x, y, false, i => al[idx[i]]);
        }
      }
    } else if (bitCount === 32) {
      const rm = dv.getUint32(92, true), sh = m => { let s = 0; while (m && !(m & 1)) { m >>>= 1; s++; } return s; };
      const ms = [rm, dv.getUint32(96, true), dv.getUint32(100, true), dv.getUint32(104, true)];
      for (let i = 0; i < w * h; i++) { const v = dv.getUint32(off + i * 4, true); for (let c = 0; c < 4; c++) out[i * 4 + c] = ms[c] ? (v & ms[c]) >>> sh(ms[c]) : 255; }
    } else throw new Error('Formato DDS no soportado');
    return { w, h, data: out };
  }
  // Remove a flat/gradient background by flood-filling from the borders (only when the image has no alpha of its own)
  function cutBackground(img) {
    const { w, h, data } = img;
    let transparentEdge = 0, edge = 0;
    for (let x = 0; x < w; x++) for (const y of [0, h - 1]) { edge++; if (data[(y * w + x) * 4 + 3] < 200) transparentEdge++; }
    for (let y = 0; y < h; y++) for (const x of [0, w - 1]) { edge++; if (data[(y * w + x) * 4 + 3] < 200) transparentEdge++; }
    if (transparentEdge / edge > 0.3) return; // already has transparency
    const seen = new Uint8Array(w * h), stack = [];
    const px = i => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
    const near = (a, b, t) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) <= t;
    // seeds: border pixels; each seed keeps its own reference color (handles gradients and two-tone backdrops)
    for (let x = 0; x < w; x++) { stack.push([x, 0, px(x)]); stack.push([x, h - 1, px((h - 1) * w + x)]); }
    for (let y = 0; y < h; y++) { stack.push([0, y, px(y * w)]); stack.push([w - 1, y, px(y * w + w - 1)]); }
    while (stack.length) {
      const [x, y, ref] = stack.pop(); if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const i = y * w + x; if (seen[i]) continue;
      const c = px(i); if (!near(c, ref, 54)) continue;
      seen[i] = 1; data[i * 4 + 3] = 0;
      stack.push([x + 1, y, c], [x - 1, y, c], [x, y + 1, c], [x, y - 1, c]);
    }
    // soften the cut edge
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (seen[i]) continue; if (seen[i - 1] || seen[i + 1] || seen[i - w] || seen[i + w]) data[i * 4 + 3] = 150; }
  }
  // downscale to a small square data URL (keeps memory low for hundreds of faces)
  function toDataURL(buf, size = 96, cut = true) {
    const img = decode(buf);
    if (cut) cutBackground(img);
    const c = document.createElement('canvas'); c.width = img.w; c.height = img.h;
    c.getContext('2d').putImageData(new ImageData(img.data, img.w, img.h), 0, 0);
    const t = document.createElement('canvas'); t.width = size; t.height = size;
    const g = t.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, size, size);
    return t.toDataURL('image/webp', 0.85);
  }
  // raw block data (no DDS header): kind 1=DXT1 3=DXT3 5=DXT5 7=BC7 0=RGBA8
  // versión rápida: trabaja con números sueltos y arreglos tipados (sin crear arreglos ni funciones por bloque)
  const PAL = new Int32Array(16), AL = new Int32Array(8);
  function dxtColor(b, o, out, w, h, x, y, dxt1, alpha) {
    const c0 = b[o] | b[o + 1] << 8, c1 = b[o + 2] | b[o + 3] << 8;
    const r0 = ((c0 >> 11) & 31) * 255 / 31 | 0, g0 = ((c0 >> 5) & 63) * 255 / 63 | 0, b0 = (c0 & 31) * 255 / 31 | 0;
    const r1 = ((c1 >> 11) & 31) * 255 / 31 | 0, g1 = ((c1 >> 5) & 63) * 255 / 63 | 0, b1 = (c1 & 31) * 255 / 31 | 0;
    PAL[0] = r0; PAL[1] = g0; PAL[2] = b0; PAL[3] = 255; PAL[4] = r1; PAL[5] = g1; PAL[6] = b1; PAL[7] = 255;
    if (!dxt1 || c0 > c1) { PAL[8] = (2 * r0 + r1) / 3 | 0; PAL[9] = (2 * g0 + g1) / 3 | 0; PAL[10] = (2 * b0 + b1) / 3 | 0; PAL[11] = 255; PAL[12] = (r0 + 2 * r1) / 3 | 0; PAL[13] = (g0 + 2 * g1) / 3 | 0; PAL[14] = (b0 + 2 * b1) / 3 | 0; PAL[15] = 255; }
    else { PAL[8] = (r0 + r1) >> 1; PAL[9] = (g0 + g1) >> 1; PAL[10] = (b0 + b1) >> 1; PAL[11] = 255; PAL[12] = PAL[13] = PAL[14] = PAL[15] = 0; }
    const bits = (b[o + 4] | b[o + 5] << 8 | b[o + 6] << 16 | b[o + 7] << 24) >>> 0;
    for (let py = 0; py < 4; py++) { const Y = y + py; if (Y >= h) break; for (let px = 0; px < 4; px++) {
      const X = x + px; if (X >= w) continue; const i = py * 4 + px, k = ((bits >>> (2 * i)) & 3) * 4, p = (Y * w + X) * 4;
      out[p] = PAL[k]; out[p + 1] = PAL[k + 1]; out[p + 2] = PAL[k + 2]; out[p + 3] = alpha ? (PAL[k + 3] ? alpha[i] : 0) : PAL[k + 3];
    } }
  }
  const A16 = new Uint8Array(16);
  // ---- BC7 (texturas HD de kits): adaptado de bcdec de Sergii Kudlai (licencia MIT / dominio público) ----
  const BC7_PART = '40110011001100154001000100010005411101110111011540010011001101154000000100010015401101110111111540010011011111154000000100110115400000000001001540110111111111154000000101111115400000000001011540010111111111154000000011111115400011111111111540000000000011154000100011101115415100010000000040000000500011104151001100010000405100010000000040001000510011104000000050001100411100110011000540510001000100004000100050001100415001100110011040510110011011004001011151101000400011115111000041510001100011104051100110011100410101010101010540001111000011154101105001011010401100115100110040511100001111004101010150101010411010010110100541011010101001054151001111001110400100115100100040510010010011004051101111011100415010011001011040111100110000154110011010011005400001500110000041001150010000004050011100100000400000500111001040000100511001004110110010010015401101101100100541500011100111004051100111000110411011001100100541100011001110054111111010000005400110001110011540001111001100154051001111110000405000101110111041000100011101154015001102212226400500116211222140002001621122154226002200110115400000005122112640150011002200264026002211111115401100116211221540000000511122264000111151112226400011512222222640120052001200164112015201120116412205220122012640150112112212264015200162002220400500110112112641150011600122004000112251221126402600220022111541150111022202264005000162212221400000510122012640001100625022104126052200110000401200125122222641101261522101104000015012611221402211025102002641100510200222264011012201620015400020006211222540000002512212264226002200120015401500120022022641200520016001204000115122620000412012016052012041202012560101204011220011620015401111622200001541050101222222264000000061212125402215220022112640260011002200154220126102201225410122622222010540002121612121254105010101012226422601110222011540021512000211164000251221122116422205110111022640021112511200064110051001102226400000002152211641100510222222264022001100510026402211225122002640000000000025164006000100020005422212220222522641052222222222264115201162012220';
  const BC7_BITS = [4, 6, 5, 7, 5, 7, 7, 5], BC7_ABITS = [0, 0, 0, 0, 6, 8, 7, 5];
  const W2 = [0, 21, 43, 64], W3 = [0, 9, 18, 27, 37, 46, 55, 64], W4 = [0, 4, 9, 13, 17, 21, 26, 30, 34, 38, 43, 47, 51, 55, 60, 64];
  const EP = new Int32Array(24), IDX = new Uint8Array(16);
  function bc7Block(b, o, out, w, h, x, y) {
    let pos = 0; const rd = n => { let v = 0; for (let k = 0; k < n; k++, pos++) v |= ((b[o + (pos >> 3)] >> (pos & 7)) & 1) << k; return v; };
    let mode = 0; while (mode < 8 && !rd(1)) mode++;
    if (mode >= 8) { for (let py = 0; py < 4; py++) for (let px = 0; px < 4; px++) { const X = x + px, Y = y + py; if (X < w && Y < h) out.fill(0, (Y * w + X) * 4, (Y * w + X) * 4 + 4); } return; }
    let partition = 0, np = 1, rotation = 0, isb = 0;
    if (mode === 0 || mode === 1 || mode === 2 || mode === 3 || mode === 7) { np = (mode === 0 || mode === 2) ? 3 : 2; partition = rd(mode === 0 ? 4 : 6); }
    const ne = np * 2;
    if (mode === 4 || mode === 5) { rotation = rd(2); if (mode === 4) isb = rd(1); }
    const cb = BC7_BITS[mode], ab = BC7_ABITS[mode];
    for (let c = 0; c < 3; c++) for (let e = 0; e < ne; e++) EP[e * 4 + c] = rd(cb);
    if (ab) for (let e = 0; e < ne; e++) EP[e * 4 + 3] = rd(ab);
    const hasP = (0b11001011 >> mode) & 1;
    if (mode === 0 || mode === 1 || mode === 3 || mode === 6 || mode === 7) {
      for (let e = 0; e < ne; e++) for (let c = 0; c < 4; c++) EP[e * 4 + c] <<= 1;
      if (mode === 1) { const i = rd(1), j = rd(1); for (let c = 0; c < 3; c++) { EP[c] |= i; EP[4 + c] |= i; EP[8 + c] |= j; EP[12 + c] |= j; } }
      else if (hasP) for (let e = 0; e < ne; e++) { const j = rd(1); for (let c = 0; c < 4; c++) EP[e * 4 + c] |= j; }
    }
    for (let e = 0; e < ne; e++) {
      let j = cb + hasP; for (let c = 0; c < 3; c++) { let v = EP[e * 4 + c] << (8 - j); EP[e * 4 + c] = (v | (v >> j)) & 255; }
      j = ab + hasP; let v = EP[e * 4 + 3] << (8 - j); EP[e * 4 + 3] = ab ? (v | (v >> j)) & 255 : 255;
    }
    const ib = (mode === 0 || mode === 1) ? 3 : mode === 6 ? 4 : 2, ib2 = mode === 4 ? 3 : mode === 5 ? 2 : 0;
    const wt = ib === 2 ? W2 : ib === 3 ? W3 : W4, wt2 = ib2 === 2 ? W2 : W3, base = (np - 2) * 1024 + partition * 16;
    const ps = i => np === 1 ? (i ? 0 : 4) : BC7_PART.charCodeAt(base + i) - 48;
    for (let i = 0; i < 16; i++) IDX[i] = rd((ps(i) & 4) ? ib - 1 : ib);
    for (let i = 0; i < 16; i++) {
      const s = (ps(i) & 3) * 8, idx = IDX[i]; let r, g, bb, a;
      const it = (c, W, k) => ((64 - W[k]) * EP[s + c] + W[k] * EP[s + 4 + c] + 32) >> 6;
      if (!ib2) { r = it(0, wt, idx); g = it(1, wt, idx); bb = it(2, wt, idx); a = it(3, wt, idx); }
      else { const i2 = rd(i ? ib2 : ib2 - 1); if (!isb) { r = it(0, wt, idx); g = it(1, wt, idx); bb = it(2, wt, idx); a = it(3, wt2, i2); } else { r = it(0, wt2, i2); g = it(1, wt2, i2); bb = it(2, wt2, i2); a = it(3, wt, idx); } }
      if (rotation === 1) { const t = a; a = r; r = t; } else if (rotation === 2) { const t = a; a = g; g = t; } else if (rotation === 3) { const t = a; a = bb; bb = t; }
      const X = x + (i & 3), Y = y + (i >> 2); if (X >= w || Y >= h) continue; const p = (Y * w + X) * 4;
      out[p] = r; out[p + 1] = g; out[p + 2] = bb; out[p + 3] = a;
    }
  }
  function raw(b, off, w, h, kind) {
    const out = new Uint8ClampedArray(w * h * 4);
    if (!kind) { out.set(b.subarray(off, off + w * h * 4)); return { w, h, data: out }; }
    const bs = kind === 1 ? 8 : 16;
    for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4, off += bs) {
      if (kind === 7) bc7Block(b, off, out, w, h, x, y);
      else if (kind === 1) dxtColor(b, off, out, w, h, x, y, true, null);
      else if (kind === 3) { for (let i = 0; i < 16; i++) A16[i] = ((b[off + (i >> 1)] >> ((i & 1) * 4)) & 15) * 17; dxtColor(b, off + 8, out, w, h, x, y, false, A16); }
      else {
        const a0 = b[off], a1 = b[off + 1]; AL[0] = a0; AL[1] = a1;
        if (a0 > a1) for (let k = 1; k < 7; k++) AL[k + 1] = ((7 - k) * a0 + k * a1) / 7 | 0; else { for (let k = 1; k < 5; k++) AL[k + 1] = ((5 - k) * a0 + k * a1) / 5 | 0; AL[6] = 0; AL[7] = 255; }
        const lo = b[off + 2] | b[off + 3] << 8 | b[off + 4] << 16, hi = b[off + 5] | b[off + 6] << 8 | b[off + 7] << 16;
        for (let i = 0; i < 16; i++) A16[i] = AL[i < 8 ? (lo >> (3 * i)) & 7 : (hi >> (3 * (i - 8))) & 7];
        dxtColor(b, off + 8, out, w, h, x, y, false, A16);
      }
    }
    return { w, h, data: out };
  }
  // pick a mip of a DDS no bigger than max (kit textures are 4096 px: decoding all of it is too heavy)
  function decodeSmall(buf, max = 1024) {
    const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf), dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    if (dv.getUint32(0, true) !== 0x20534444) throw new Error('No es un DDS');
    let h = dv.getUint32(12, true), w = dv.getUint32(16, true); const mips = Math.max(1, dv.getUint32(28, true));
    const four = String.fromCharCode(b[84], b[85], b[86], b[87]), pf = dv.getUint32(80, true);
    let off = 128 + (four === 'DX10' ? 20 : 0), kind;
    if (four === 'DX10') { const dx = dv.getUint32(128, true); kind = dx === 71 || dx === 72 ? 1 : dx === 74 || dx === 75 ? 3 : dx === 77 || dx === 78 ? 5 : dx === 98 || dx === 99 ? 7 : dx === 28 || dx === 87 ? 0 : -1; }
    else kind = (pf & 4) ? (four === 'DXT1' ? 1 : four === 'DXT3' ? 3 : four === 'DXT5' ? 5 : -1) : dv.getUint32(88, true) === 32 ? 0 : -1;
    if (kind < 0) throw new Error('Formato de textura no soportado para la vista previa (' + (four === 'DX10' ? 'BC7/DX10' : four) + ').');
    const size = (W, H) => kind ? Math.max(1, (W + 3) >> 2) * Math.max(1, (H + 3) >> 2) * (kind === 1 ? 8 : 16) : W * H * 4;
    let lvl = 0; while (w > max && lvl < mips - 1) { off += size(w, h); w >>= 1; h >>= 1; lvl++; }
    return raw(b, off, w, h, kind);
  }
  return { decode, toDataURL, cutBackground, raw, decodeSmall };
})();
