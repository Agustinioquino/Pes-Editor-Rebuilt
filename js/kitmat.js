// ===================== Materiales de tela: normal map (relieve) y SRM (brillo/aspereza) =====================
// El normal map del juego guarda la inclinación de la tela en rojo (X) y verde (Y); azul sin usar.
// Se arma con dos cosas: el tejido (se repite por toda la camiseta) y el relieve de los dibujos del kit
// (escudo, sponsor, rayas), sacado del brillo de la textura como hace PES Master.
const KMAT = (() => {
  const LIST = [
    { k: 'liso', n: 'Liso', d: 'Tela lisa, sin trama', spec: 70, rough: 150 },
    { k: 'malla', n: 'Malla deportiva', d: 'Agujeritos chicos en filas, como las camisetas actuales', spec: 85, rough: 120 },
    { k: 'pique', n: 'Piqué', d: 'Puntitos en relieve, tela de chomba', spec: 65, rough: 165 },
    { k: 'panal', n: 'Panal', d: 'Hexágonos, tela técnica', spec: 90, rough: 115 },
    { k: 'rayas', n: 'Acanalado', d: 'Rayitas verticales finas', spec: 75, rough: 140 },
    { k: 'diagonal', n: 'Sarga diagonal', d: 'Trama en diagonal', spec: 80, rough: 130 },
    { k: 'jacquard', n: 'Jacquard', d: 'Ondas tejidas en la tela', spec: 95, rough: 110 },
    { k: 'retro', n: 'Algodón retro', d: 'Tela gruesa y opaca de camiseta antigua', spec: 45, rough: 200 },
  ];
  // altura de la trama en una baldosa de N x N (0..1), repetible sin cortes
  function tile(kind, N = 64) {
    const h = new Float32Array(N * N), T = Math.PI * 2;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = x / N, v = y / N; let z = .5;
      if (kind === 'malla') { const cx = (u * 8) % 1 - .5, cy = (v * 8 + (Math.floor(u * 8) % 2) * .5) % 1 - .5; z = Math.min(1, Math.hypot(cx, cy) * 3.2); }
      else if (kind === 'pique') { const cx = (u * 12) % 1 - .5, cy = (v * 12) % 1 - .5; z = 1 - Math.min(1, Math.hypot(cx, cy) * 2.6); }
      else if (kind === 'panal') { const a = u * 6 * T / Math.sqrt(3), b = v * 6 * T; z = .5 + (Math.cos(a + b / 2) + Math.cos(a - b / 2) + Math.cos(b)) / 6; z = Math.abs(z - .5) * 2; }
      else if (kind === 'rayas') z = .5 + .5 * Math.sin(u * T * 16);
      else if (kind === 'diagonal') z = .5 + .5 * Math.sin((u + v) * T * 12);
      else if (kind === 'jacquard') z = .5 + .25 * Math.sin(u * T * 4 + Math.sin(v * T * 3) * 2) + .25 * Math.sin(v * T * 8);
      else if (kind === 'retro') z = .5 + .2 * Math.sin(u * T * 24) * Math.sin(v * T * 24) + .1 * Math.sin((u * 7 + v * 13) * T);
      h[y * N + x] = z;
    }
    return h;
  }
  // normal map completo. kitCanvas puede faltar (solo tejido). size: lado de la textura resultante
  function normalMap({ kitCanvas, fabric = 'malla', repeat = 48, fabricStrength = .5, emboss = .6, size = 2048 }) {
    const W = size, H = size, out = document.createElement('canvas'); out.width = W; out.height = H;
    const g = out.getContext('2d'), img = g.createImageData(W, H), d = img.data;
    const N = 64, tl = fabric === 'liso' ? null : tile(fabric, N);
    let lum = null;
    if (kitCanvas && emboss > 0) {
      const S = Math.min(W, 1024), c = document.createElement('canvas'); c.width = S; c.height = S; const cg = c.getContext('2d', { willReadFrequently: true }); cg.drawImage(kitCanvas, 0, 0, S, S);
      const p = cg.getImageData(0, 0, S, S).data; lum = { S, a: new Float32Array(S * S) };
      for (let i = 0; i < S * S; i++) lum.a[i] = (p[i * 4] * .3 + p[i * 4 + 1] * .59 + p[i * 4 + 2] * .11) / 255;
    }
    const L = (x, y) => { const S = lum.S; x = Math.min(S - 1, Math.max(0, x)); y = Math.min(S - 1, Math.max(0, y)); return lum.a[y * S + x]; };
    const Hf = (x, y) => tl[(((y % N) + N) % N) * N + (((x % N) + N) % N)];
    const fk = repeat * N / W; // muestras de la baldosa por píxel
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let nx = 0, ny = 0;
      if (tl) { const fx = Math.floor(x * fk), fy = Math.floor(y * fk); nx += (Hf(fx - 1, fy) - Hf(fx + 1, fy)) * fabricStrength; ny += (Hf(fx, fy - 1) - Hf(fx, fy + 1)) * fabricStrength; }
      if (lum) { const lx = Math.floor(x * lum.S / W), ly = Math.floor(y * lum.S / H); nx += (L(lx - 1, ly) - L(lx + 1, ly)) * emboss * 6; ny += (L(lx, ly - 1) - L(lx, ly + 1)) * emboss * 6; }
      const i = (y * W + x) * 4, l = Math.hypot(nx, ny, 1);
      d[i] = 128 + 127 * nx / l; d[i + 1] = 128 + 127 * ny / l; d[i + 2] = 0; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0); return out;
  }
  // SRM: rojo = brillo especular, verde = aspereza (lo que más se nota con luz de estadio)
  function srm(mat, size = 1024) {
    const m = LIST.find(x => x.k === mat) || LIST[0], c = document.createElement('canvas'); c.width = size; c.height = size; const g = c.getContext('2d');
    g.fillStyle = `rgb(${m.spec},${m.rough},0)`; g.fillRect(0, 0, size, size); return c;
  }
  return { LIST, tile, normalMap, srm };
})();
