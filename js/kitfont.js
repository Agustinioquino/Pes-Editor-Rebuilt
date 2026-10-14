// ===================== Fuentes del kit: nombre, números de espalda, pecho y short =====================
// Las casillas de cada letra y número salen de las máscaras de "Letters Template.psd" y "Numbers Template.psd"
// (medidas en 2048 px de ancho; se escalan al tamaño real de la textura).
const KFONT = (() => {
  const LET = { A: [18, 160], B: [188, 306], C: [336, 464], D: [496, 620], E: [648, 766], F: [776, 896], G: [912, 1040], H: [1064, 1188], I: [1200, 1282], J: [1296, 1402], K: [1420, 1548], L: [1568, 1680], M: [1698, 1868], N: [1880, 2022],
    O: [18, 160], P: [190, 306], Q: [336, 480], R: [512, 642], S: [670, 786], T: [818, 944], U: [968, 1096], V: [1120, 1264], W: [1282, 1472], X: [1488, 1618], Y: [1648, 1776], Z: [1808, 1936], '.': [1960, 2014], ' ': [2022, 2048] };
  const ROW2 = new Set('OPQRSTUVWXYZ. ');
  const NUM = [[0, 160], [200, 300], [340, 500], [540, 700], [740, 900], [940, 1100], [1140, 1300], [1340, 1500], [1540, 1700], [1740, 1900]];
  // tamaño de cada textura (el que usa el juego)
  const SIZE = { name: [4096, 1024], back: [4096, 512], chest: [2048, 256], leg: [2048, 256] };
  // rectángulo de un carácter dentro de la textura (x, y, w, h en píxeles)
  function cell(kind, ch, W, H) {
    const k = W / 2048;
    if (kind === 'name') { const c = LET[ch]; if (!c) return null; const r2 = ROW2.has(ch), yh = H / 2; return [c[0] * k, (r2 ? 260 / 512 : 4 / 512) * H, (c[1] - c[0]) * k, yh * (248 / 256)]; }
    const c = NUM[+ch]; if (!c) return null; return [c[0] * k, 0, (c[1] - c[0]) * k, H];
  }
  // ---- generador: dibuja cada carácter dentro de su casilla con la fuente y los bordes elegidos ----
  function generate(kind, o) {
    const [W, H] = SIZE[kind], c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const chars = kind === 'name' ? Object.keys(LET).filter(x => x !== ' ') : '0123456789'.split('');
    const fam = `"${o.font}", ${o.fallback || 'sans-serif'}`;
    // todas las letras con la misma altura (como una fuente de verdad); las anchas se angostan para entrar en su casilla
    g.font = `${o.italic ? 'italic ' : ''}${o.weight || 700} 100px ${fam}`;
    const ref = g.measureText(kind === 'name' ? 'H' : '0'), capRef = (ref.actualBoundingBoxAscent + ref.actualBoundingBoxDescent) || 72;
    for (const ch of chars) {
      const [x, y, w, h] = cell(kind, ch, W, H); if (!w) continue;
      const pad = Math.max(o.stroke1 || 0, 0) + Math.max(o.stroke2 || 0, 0);
      const target = h * (kind === 'name' ? .84 : .74) - pad * 2 * (h / 256);
      g.save(); g.font = `${o.italic ? 'italic ' : ''}${o.weight || 700} 100px ${fam}`;
      const m = g.measureText(ch), gw = (m.actualBoundingBoxRight + m.actualBoundingBoxLeft) || m.width, capH = capRef;
      const s = target / capRef, sx0 = (o.width || 1), sx = Math.min(sx0, (w * .92 - pad * 2 * (h / 256)) / (gw * s));
      g.translate(x + w / 2, y + h / 2); g.scale(s * sx, s);
      const by = (kind === 'name' && ch === '.') ? capH / 2 : (ref.actualBoundingBoxAscent - ref.actualBoundingBoxDescent) / 2;
      const dx = -(m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
      g.lineJoin = 'round'; g.miterLimit = 2;
      const k = 1 / s * (h / 256); // grosor en píxeles de la textura de 256 de alto
      if (o.shadow) { g.save(); g.translate(o.shadow * k, o.shadow * k); g.fillStyle = o.shadowColor || '#000000'; if (o.stroke2) { g.lineWidth = (o.stroke1 + o.stroke2) * 2 * k; g.strokeStyle = g.fillStyle; g.strokeText(ch, dx, by); } else if (o.stroke1) { g.lineWidth = o.stroke1 * 2 * k; g.strokeStyle = g.fillStyle; g.strokeText(ch, dx, by); } g.fillText(ch, dx, by); g.restore(); }
      if (o.stroke2) { g.lineWidth = (o.stroke1 + o.stroke2) * 2 * k; g.strokeStyle = o.color2; g.strokeText(ch, dx, by); }
      if (o.stroke1) { g.lineWidth = o.stroke1 * 2 * k; g.strokeStyle = o.color1; g.strokeText(ch, dx, by); }
      g.fillStyle = o.fill; g.fillText(ch, dx, by);
      g.restore();
    }
    return c;
  }
  // ---- recorta el carácter de una textura de fuente (para dibujar "JUGADOR 10" con la fuente real del kit) ----
  const CROP = new WeakMap();
  function glyph(tex, kind, ch) {
    if (!tex) return null; let m = CROP.get(tex); if (!m) CROP.set(tex, m = new Map());
    const key = kind + ch; if (m.has(key)) return m.get(key);
    const r = cell(kind, ch, tex.width, tex.height); if (!r) { m.set(key, null); return null; }
    const [x, y, w, h] = r.map(Math.round), src = tex.getContext('2d', { willReadFrequently: true }).getImageData(x, y, Math.max(1, w), Math.max(1, h)).data;
    let x0 = w, x1 = -1, y0 = h, y1 = -1;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (src[(j * w + i) * 4 + 3] > 24) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    const out = x1 < 0 ? null : { c: tex, sx: x + x0, sy: y + y0, sw: x1 - x0 + 1, sh: y1 - y0 + 1, cellH: h };
    m.set(key, out); return out;
  }
  // dibuja un texto con los caracteres de la textura; centrado en (cx, cy), alto h, curva opcional
  function drawText(g, tex, kind, text, cx, cy, h, { stretch = 1, spacing = 0, curve = 0, fallback } = {}) {
    const gl = [...String(text).toUpperCase()].map(ch => ch === ' ' ? { sp: true } : glyph(tex, kind, ch));
    if (!tex || gl.some(x => x === null)) { // sin textura de fuente: texto común
      g.save(); g.font = `800 ${h}px ${fallback || '"Saira Condensed", sans-serif'}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.strokeStyle = '#000000aa'; g.lineWidth = h * .06; g.translate(cx, cy); g.scale(stretch, 1); g.strokeText(text, 0, 0); g.fillText(text, 0, 0); g.restore(); return;
    }
    const ref = gl.find(x => x && !x.sp); if (!ref) return;
    const k = h / (kind === 'name' ? ref.cellH * .84 : ref.cellH * .74), ws = gl.map(x => x.sp ? h * .35 : x.sw * k * stretch), gap = spacing * h;
    const total = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1); let x = cx - total / 2;
    gl.forEach((q, i) => {
      if (!q.sp) { const w = ws[i], hh = q.sh * k, off = curve ? curve * h * ((x + w / 2 - cx) / (total / 2 || 1)) ** 2 : 0; g.drawImage(q.c, q.sx, q.sy, q.sw, q.sh, x, cy - hh / 2 + off, w, hh); }
      x += ws[i] + gap;
    });
  }
  return { cell, generate, glyph, drawText, SIZE };
})();
