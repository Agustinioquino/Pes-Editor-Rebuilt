// ===================== Datos de las canciones que agregás: título, artista, álbum y carátula =====================
// Lee las etiquetas que traen los archivos: ID3 (MP3), FLAC y MP4/M4A. Si no hay carátula, se arma una con colores.
async function mpReadTags(file) {
  const out = {}, buf = new Uint8Array(await file.arrayBuffer()), dv = new DataView(buf.buffer);
  const latin = (a, b) => { let s = ''; for (let i = a; i < b; i++) s += String.fromCharCode(buf[i]); return s; };
  const dec = (enc, a, b) => { const u = buf.subarray(a, b); try { return (enc === 1 ? new TextDecoder('utf-16') : enc === 2 ? new TextDecoder('utf-16be') : enc === 3 ? new TextDecoder('utf-8') : new TextDecoder('latin1')).decode(u).replace(/\0+$/, '').replace(/^﻿/, '').trim(); } catch { return ''; } };
  const zero = (enc, p, end) => { if (enc === 1 || enc === 2) { while (p + 1 < end && (buf[p] || buf[p + 1])) p += 2; return [p, p + 2]; } while (p < end && buf[p]) p++; return [p, p + 1]; };
  try {
    if (latin(0, 3) === 'ID3') { // ---- ID3v2 ----
      const v = buf[3], fl = buf[5], size = (buf[6] & 127) << 21 | (buf[7] & 127) << 14 | (buf[8] & 127) << 7 | (buf[9] & 127);
      let p = 10, end = Math.min(buf.length, 10 + size);
      if (fl & 0x40) p += v === 4 ? ((buf[p] & 127) << 21 | (buf[p + 1] & 127) << 14 | (buf[p + 2] & 127) << 7 | (buf[p + 3] & 127)) : dv.getUint32(p) + 4;
      while (p + (v === 2 ? 6 : 10) < end) {
        const id = latin(p, p + (v === 2 ? 3 : 4)); if (!/^[A-Z0-9]{3,4}$/.test(id)) break;
        const sz = v === 2 ? buf[p + 3] << 16 | buf[p + 4] << 8 | buf[p + 5] : v === 4 ? ((buf[p + 4] & 127) << 21 | (buf[p + 5] & 127) << 14 | (buf[p + 6] & 127) << 7 | (buf[p + 7] & 127)) : dv.getUint32(p + 4);
        const a = p + (v === 2 ? 6 : 10), b = Math.min(end, a + sz); if (sz <= 0) break;
        const enc = buf[a];
        if (/^(TIT2|TT2)$/.test(id)) out.title = dec(enc, a + 1, b);
        else if (/^(TPE1|TP1)$/.test(id)) out.artist = dec(enc, a + 1, b);
        else if (/^(TALB|TAL)$/.test(id)) out.album = dec(enc, a + 1, b);
        else if (/^(TYER|TDRC|TYE)$/.test(id)) out.year = dec(enc, a + 1, b).slice(0, 4);
        else if ((id === 'APIC' || id === 'PIC') && !out.pic) {
          let q = a + 1, mime;
          if (id === 'PIC') { mime = 'image/' + latin(q, q + 3).toLowerCase().replace('jpg', 'jpeg'); q += 3; } else { const [z, n] = zero(0, q, b); mime = latin(q, z) || 'image/jpeg'; q = n; }
          q++; const [, n2] = zero(enc, q, b); out.pic = new Blob([buf.slice(n2, b)], { type: mime.includes('/') ? mime : 'image/' + mime });
        }
        p = b;
      }
    } else if (latin(0, 4) === 'fLaC') { // ---- FLAC ----
      let p = 4, last = 0;
      while (!last && p + 4 < buf.length) {
        const h = buf[p]; last = h & 128; const type = h & 127, len = buf[p + 1] << 16 | buf[p + 2] << 8 | buf[p + 3], a = p + 4;
        if (type === 4) { let q = a; const vl = dv.getUint32(q, true); q += 4 + vl; const n = dv.getUint32(q, true); q += 4; for (let i = 0; i < n && q < a + len; i++) { const l = dv.getUint32(q, true); q += 4; const s = new TextDecoder().decode(buf.subarray(q, q + l)); q += l; const [k, ...r] = s.split('='), val = r.join('='); const K = k.toUpperCase(); if (K === 'TITLE') out.title = val; else if (K === 'ARTIST') out.artist = val; else if (K === 'ALBUM') out.album = val; else if (K === 'DATE') out.year = val.slice(0, 4); } }
        if (type === 6 && !out.pic) { let q = a + 4; const ml = dv.getUint32(q); q += 4; const mime = latin(q, q + ml); q += ml; const dl = dv.getUint32(q); q += 4 + dl + 16; const pl = dv.getUint32(q); q += 4; out.pic = new Blob([buf.slice(q, q + pl)], { type: mime || 'image/jpeg' }); }
        p = a + len;
      }
    } else if (latin(4, 8) === 'ftyp') { // ---- MP4 / M4A ----
      const walk = (a, b, path) => {
        let p = a;
        while (p + 8 <= b) {
          let sz = dv.getUint32(p); const t = latin(p + 4, p + 8); let h = 8; if (sz === 1) { sz = Number(dv.getBigUint64(p + 8)); h = 16; } if (sz < h) break;
          const s = p + h, e = Math.min(b, p + sz);
          if (t === 'moov' || t === 'udta' || t === 'ilst' || t === 'trak' && false) walk(s, e, path + '/' + t);
          else if (t === 'meta') walk(s + 4, e, path + '/meta');
          else if (path.endsWith('/ilst')) {
            const d = s + 16; // átomo "data": tamaño, "data", tipo (4), idioma (4)
            if (latin(s + 4, s + 8) === 'data') {
              const type = dv.getUint32(s + 8) & 0xffffff;
              if (t === 'covr' && !out.pic) out.pic = new Blob([buf.slice(d, e)], { type: type === 14 ? 'image/png' : 'image/jpeg' });
              else { const val = new TextDecoder().decode(buf.subarray(d, e)); if (t === '\xa9nam') out.title = val; else if (t === '\xa9ART') out.artist = val; else if (t === '\xa9alb') out.album = val; else if (t === '\xa9day') out.year = val.slice(0, 4); }
            }
          }
          p = p + sz;
        }
      };
      walk(0, buf.length, '');
    }
  } catch { }
  if (out.pic) { try { out.cover = await mpSquare(out.pic); } catch { } }
  delete out.pic; return out;
}
// carátula a 320×320 (recorte centrado), en JPEG para que ocupe poco
async function mpSquare(blob) {
  const bmp = await createImageBitmap(blob), S = 320, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), r = Math.max(S / bmp.width, S / bmp.height), w = bmp.width * r, h = bmp.height * r; g.drawImage(bmp, (S - w) / 2, (S - h) / 2, w, h);
  return c.toDataURL('image/jpeg', .86);
}
// carátula armada cuando la canción no trae una: degradé con un color propio de cada tema y una nota musical
function mpPlaceholder(tr) {
  let h = 0; for (const ch of (tr.t || '') + (tr.g || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const a = h % 360, b = (a + 40 + (h >> 9) % 80) % 360, ini = (tr.t || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase().replace(/[<&>"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${a},65%,42%)"/><stop offset="1" stop-color="hsl(${b},70%,18%)"/></linearGradient></defs><rect width="320" height="320" fill="url(#g)"/><circle cx="250" cy="70" r="120" fill="#fff" opacity=".07"/><path d="M200 70v118a34 30 0 1 1-18-26V98l-70 16v100a34 30 0 1 1-18-26V96z" fill="#fff" opacity=".9"/><text x="24" y="296" font-family="Arial Black,Arial" font-weight="900" font-size="44" fill="#fff" opacity=".85">${ini}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
