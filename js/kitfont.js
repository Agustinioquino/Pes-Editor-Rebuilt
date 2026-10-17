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
  // ---- curva del nombre como la arma el juego: cada letra sobre un arco de radio 1000 / curva, girada con él ----
  // Radio de la curva: 1000 / NameCurve (KitPos), en unidades del juego. Medido en el juego con el panel de KitPos
  // (Agustin, 17/10/2026, curva 1.39 y 5.19): un alto de mayúscula son ~130 unidades. Curva positiva: las puntas bajan.
  const ARC_H = 130;
  // items: [{ w: ancho que ocupa, draw(g) dibuja la letra centrada en (0, 0) }]; gap: espacio extra entre letras
  function arcText(g, items, cx, cy, h, curve, gap) {
    const total = items.reduce((a, q) => a + q.w, 0) + gap * Math.max(0, items.length - 1), R = Math.abs(curve) >= .05 ? 1000 / curve / ARC_H * h : 0;
    let x = -total / 2;
    for (const q of items) {
      const s = x + q.w / 2; x += q.w + gap; if (!q.draw) continue;
      g.save();
      if (R) { const t = s / R; g.translate(cx + R * Math.sin(t), cy + R * (1 - Math.cos(t))); g.rotate(t); } else g.translate(cx + s, cy);
      q.draw(g); g.restore();
    }
  }
  // texto común (sin la textura del kit): nombre genérico, o cuando la fuente no se puede leer
  function drawPlain(g, text, cx, cy, h, { stretch = 1, spacing = 0, curve = 0, font, color = '#ffffff', edge = '#000000aa' } = {}) {
    g.save(); g.font = `800 ${h * 1.36}px ${font || '"Saira Condensed", "Arial Narrow", sans-serif'}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    const items = [...String(text)].map(ch => ({ w: g.measureText(ch).width * stretch, draw: ch === ' ' ? null : gg => { gg.scale(stretch, 1); gg.lineWidth = h * .08; gg.strokeStyle = edge; gg.strokeText(ch, 0, 0); gg.fillStyle = color; gg.fillText(ch, 0, 0); } }));
    arcText(g, items, cx, cy, h, curve, spacing * h); g.restore();
  }
  // dibuja un texto con los caracteres de la textura; centrado en (cx, cy), alto h. Cada carácter avanza el ancho de
  // su casilla (como en el juego), no el de la letra recortada; curve: la del juego (1000 / radio)
  function drawText(g, tex, kind, text, cx, cy, h, { stretch = 1, spacing = 0, curve = 0, fallback, generic, color } = {}) {
    if (!generic && tex && tex.__kp && typeof KPF !== 'undefined') return KPF.drawText(g, tex, text, cx, cy, h, { stretch, spacing, curve }); // fuente de KitPos (con minúsculas)
    const up = String(text).toUpperCase(), gl = generic || !tex ? null : [...up].map(ch => ch === ' ' ? { sp: true } : glyph(tex, kind, ch));
    if (!gl || gl.some(x => x === null)) return drawPlain(g, kind === 'name' ? up : text, cx, cy, h, { stretch, spacing, curve, font: fallback, color });
    const ref = gl.find(x => x && !x.sp); if (!ref) return;
    const k = h / (kind === 'name' ? ref.cellH * .84 : ref.cellH * .74);
    const items = [...up].map((ch, i) => { const q = gl[i]; if (q.sp) return { w: h * .35 }; const [cx0, cy0, cw] = cell(kind, ch, tex.width, tex.height), w = cw * k * stretch, hh = q.sh * k;
      // la letra queda donde estaba dentro de su casilla
      const ox = (q.sx - cx0 - cw / 2) * k * stretch, oy = (q.sy - cy0 - q.cellH / 2) * k;
      return { w, draw: gg => gg.drawImage(q.c, q.sx, q.sy, q.sw, q.sh, ox, oy, q.sw * k * stretch, hh) }; });
    arcText(g, items, cx, cy, h, curve, spacing * h);
  }
  return { cell, generate, glyph, drawText, drawPlain, arcText, SIZE };
})();
