// PES 2020/2021 save crypto — JS port of libpesXcrypter (public domain, the4chancup)
const PesCrypt = (() => {
  const hex = h => Uint8Array.from(h.match(/../g).map(x => parseInt(x, 16)));
  const KEYS = {
    '2021': hex('9061d866437724f892bab87121c76063f0919a7ded4780de51f5ddd108fe3284f5099200b23e889feb244305587600229bfeecf6500029d3427550b9ecd2f675'),
    '2020': hex('e2bf510754e621782c5e8d33137ac9159977d9a01bc295d9bb9bb100841cb362e540d956455b7c7c4ff1da26b45a0c5c4d6b9e9875a939074c4b55bd8e01a931'),
  };
  const ENC = 320, HDR = 208;

  function MT(keyBytes) {
    const mt = new Uint32Array(624); let mti;
    const dv = new DataView(keyBytes.buffer, keyBytes.byteOffset, 64);
    const key = []; for (let i = 0; i < 16; i++) key.push(dv.getUint32(i * 4, true));
    mt[0] = 19650218;
    for (mti = 1; mti < 624; mti++) {
      const s = mt[mti - 1] ^ (mt[mti - 1] >>> 30);
      mt[mti] = (Math.imul(1812433253, s) + mti) >>> 0;
    }
    let i = 1, j = 0;
    for (let k = 624; k; k--) {
      const s = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(s, 1664525)) + key[j] + j) >>> 0;
      i++; j++; if (i >= 624) { mt[0] = mt[623]; i = 1; } if (j >= 16) j = 0;
    }
    for (let k = 623; k; k--) {
      const s = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(s, 1566083941)) - i) >>> 0;
      i++; if (i >= 624) { mt[0] = mt[623]; i = 1; }
    }
    mt[0] = 0x80000000; mti = 624;
    return function next() {
      if (mti >= 624) {
        let kk = 0, y;
        for (; kk < 227; kk++) { y = (mt[kk] & 0x80000000) | (mt[kk + 1] & 0x7fffffff); mt[kk] = mt[kk + 397] ^ (y >>> 1) ^ ((y & 1) ? 0x9908b0df : 0); }
        for (; kk < 623; kk++) { y = (mt[kk] & 0x80000000) | (mt[kk + 1] & 0x7fffffff); mt[kk] = mt[kk - 227] ^ (y >>> 1) ^ ((y & 1) ? 0x9908b0df : 0); }
        y = (mt[623] & 0x80000000) | (mt[0] & 0x7fffffff); mt[623] = mt[396] ^ (y >>> 1) ^ ((y & 1) ? 0x9908b0df : 0);
        mti = 0;
      }
      let y = mt[mti++];
      y ^= y >>> 11; y ^= (y << 7) & 0x9d2c5680; y ^= (y << 15) & 0xefc60000; y ^= y >>> 18;
      return y >>> 0;
    };
  }
  const rol = (a, s) => ((a << s) | (a >>> (32 - s))) >>> 0;
  const ror = (a, s) => ((a >>> s) | (a << (32 - s))) >>> 0;

  function cryptStream(key, input) {
    const len = input.length, out = new Uint8Array(len);
    const next = MT(key);
    let c0 = next(), c1 = next(), c2 = next(), c3 = next();
    const n4 = len >>> 2;
    const iv = new DataView(input.buffer, input.byteOffset, len), ov = new DataView(out.buffer);
    for (let i = 0; i < n4; i++) {
      const c4 = next();
      ov.setUint32(i * 4, (c4 ^ c3 ^ c2 ^ c1 ^ c0 ^ iv.getUint32(i * 4, true)) >>> 0, true);
      c0 = ror(c1, 15); c1 = rol(c2, 11); c2 = rol(c3, 7); c3 = ror(c4, 13);
    }
    const rem = len & 3;
    if (rem) {
      const ks = (next() ^ c3 ^ c2 ^ c1 ^ c0) >>> 0;
      for (let b = 0; b < rem; b++) out[n4 * 4 + b] = input[n4 * 4 + b] ^ ((ks >>> (8 * b)) & 255);
    }
    return out;
  }
  function cryptHeader(input, master) {
    const hk = input.slice(256, 320);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) hk[i * 8 + j] ^= master[i * 8 + 7 - j];
    const out = cryptStream(hk, input.subarray(0, ENC));
    out.set(input.subarray(256, 320), 256);
    return out;
  }
  function keys(encHeader) {
    const rk = encHeader.slice(0, 64);
    for (let i = 0; i < 256; i++) rk[i & 63] ^= encHeader[64 + i];
    return p => { const k = rk.slice(); for (let i = 0; i < 8; i++) k[i * 8] ^= p; return k; }; // param < 256, little-endian
  }
  const td = new TextDecoder();
  const cstr = b => td.decode(b.subarray(0, (b.indexOf(0) + 1 || b.length + 1) - 1));

  function decryptWith(bytes, master) {
    const enc = cryptHeader(bytes, master);
    const k = keys(enc);
    let p = ENC;
    const hdr = cryptStream(k(HDR), bytes.subarray(p, p + HDR)); p += HDR;
    const hv = new DataView(hdr.buffer);
    const dataSize = hv.getUint32(64, true), logoSize = hv.getUint32(68, true), descSize = hv.getUint32(72, true), serialLength = hv.getUint32(76, true);
    const total = ENC + HDR + dataSize + logoSize + descSize + serialLength * 2;
    if (total !== bytes.length) return null;
    const desc = cryptStream(k(0), bytes.subarray(p, p + descSize)); p += descSize;
    const logo = cryptStream(k(1), bytes.subarray(p, p + logoSize)); p += logoSize;
    const data = cryptStream(k(2), bytes.subarray(p, p + dataSize)); p += dataSize;
    const serial = cryptStream(k(3), bytes.subarray(p, p + serialLength * 2));
    return { enc, hdr, desc, logo, data, serial };
  }
  function decrypt(bytes) {
    for (const game of ['2021', '2020']) {
      const r = decryptWith(bytes, KEYS[game]);
      if (r) { r.game = game; return r; }
    }
    throw new Error('No es un archivo de guardado de PES 2020/2021 válido, o está dañado.');
  }
  function encrypt(f) {
    const master = KEYS[f.game];
    const hdr = f.hdr.slice(), hv = new DataView(hdr.buffer);
    hv.setUint32(64, f.data.length, true); hv.setUint32(68, f.logo.length, true);
    hv.setUint32(72, f.desc.length, true); hv.setUint32(76, f.serial.length / 2, true);
    const k = keys(f.enc);
    const parts = [cryptHeader(f.enc, master), cryptStream(k(HDR), hdr), cryptStream(k(0), f.desc),
      cryptStream(k(1), f.logo), cryptStream(k(2), f.data), cryptStream(k(3), f.serial)];
    const out = new Uint8Array(parts.reduce((a, b) => a + b.length, 0));
    let p = 0; for (const x of parts) { out.set(x, p); p += x.length; }
    return out;
  }
  const info = f => ({
    game: f.game,
    type: cstr(f.hdr.subarray(144, 176)),
    version: cstr(f.hdr.subarray(176, 208)),
    sid: Array.from({ length: f.serial.length / 2 }, (_, i) => String.fromCharCode(f.serial[i * 2] | (f.serial[i * 2 + 1] << 8))).join(''),
    description: td.decode(f.desc.subarray(0, (f.desc.indexOf(0) + 1 || f.desc.length + 1) - 1)),
    dataSize: f.data.length, logoSize: f.logo.length,
  });
  function setSid(f, sid) {
    const s = new Uint8Array(sid.length * 2);
    for (let i = 0; i < sid.length; i++) { const c = sid.charCodeAt(i); s[i * 2] = c & 255; s[i * 2 + 1] = c >> 8; }
    f.serial = s;
  }
  function setDescription(f, text) {
    const d = new Uint8Array(f.desc.length);
    const b = new TextEncoder().encode(text).subarray(0, d.length - 1);
    d.set(b); f.desc = d;
  }
  return { decrypt, encrypt, info, setSid, setDescription };
})();
