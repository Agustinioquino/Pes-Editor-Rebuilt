// ===================== Realistic pitch texture (canvas, cached per theme) =====================
const PITCH_CACHE = new Map();
const PITCH_THEMES = {
  clasico: { g1: '#2f8648', g2: '#2a7a41', line: 'rgba(255,255,255,.88)', light: .16, vig: .42, noise: 18 },
  noche: { g1: '#1d5233', g2: '#194a2d', line: 'rgba(235,248,255,.85)', light: .30, vig: .62, noise: 14, pools: true },
  atardecer: { g1: '#4f8a39', g2: '#477f34', line: 'rgba(255,246,225,.9)', light: .22, vig: .45, noise: 18, warm: true },
  pizarra: { g1: '#22414f', g2: '#22414f', line: 'rgba(235,242,245,.78)', light: .08, vig: .35, noise: 26, chalk: true },
  retro: { g1: '#7d8b4f', g2: '#748249', line: 'rgba(250,244,222,.85)', light: .1, vig: .5, noise: 30, sepia: true },
  equipo: { g1: null, g2: null, line: 'rgba(255,255,255,.85)', light: .16, vig: .5, noise: 16 },
};
function mix(hex, other, t) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const a = p(hex), b = p(other); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
function pitchTexture(theme, k1 = '#2f8648', k2 = '#2a7a41') {
  const key = theme + (theme === 'equipo' ? k1 + k2 : ''); if (PITCH_CACHE.has(key)) return PITCH_CACHE.get(key);
  const T = Object.assign({}, PITCH_THEMES[theme] || PITCH_THEMES.clasico);
  if (theme === 'equipo') { T.g1 = mix(k1, '#103a22', .55); T.g2 = mix(k1, '#0c2e1b', .62); }
  const W = 680, H = 960, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  // mowing stripes with soft edges
  const bands = 14, bh = H / bands;
  for (let i = 0; i < bands; i++) { g.fillStyle = i % 2 ? T.g2 : T.g1; g.fillRect(0, i * bh, W, bh + 1); }
  if (!T.chalk) for (let i = 1; i < bands; i++) { const gr = g.createLinearGradient(0, i * bh - 6, 0, i * bh + 6); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, 'rgba(0,0,0,.05)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, i * bh - 6, W, 12); }
  // grass grain: per-pixel noise + short blades
  const id = g.getImageData(0, 0, W, H), dd = id.data; let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < dd.length; i += 4) { const n = (rnd() - .5) * T.noise; dd[i] += n; dd[i + 1] += n * 1.1; dd[i + 2] += n * .8; }
  g.putImageData(id, 0, 0);
  if (!T.chalk) { g.lineWidth = 1; for (let i = 0; i < 9000; i++) { const x = rnd() * W, y = rnd() * H, l = 2 + rnd() * 4; g.strokeStyle = rnd() > .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.05)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - .5) * 2, y - l); g.stroke(); } }
  // wear in the goalmouths and center
  for (const [x, y, r] of [[W / 2, H * .955, 70], [W / 2, H * .045, 70], [W / 2, H / 2, 60]]) { const gr = g.createRadialGradient(x, y, 4, x, y, r); gr.addColorStop(0, T.chalk ? 'rgba(255,255,255,.04)' : 'rgba(120,100,60,.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  // markings (real proportions: 68 x 105 m)
  const sx = W / 68, sy = H / 105, m = 1.5 * sx;
  g.strokeStyle = T.line; g.lineWidth = 3; g.shadowColor = 'rgba(255,255,255,.35)'; g.shadowBlur = 2; g.lineCap = 'round';
  const L = (x1, y1, x2, y2) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
  g.strokeRect(m, m, W - 2 * m, H - 2 * m); L(m, H / 2, W - m, H / 2);
  g.beginPath(); g.arc(W / 2, H / 2, 9.15 * sx, 0, Math.PI * 2); g.stroke();
  g.fillStyle = T.line; g.beginPath(); g.arc(W / 2, H / 2, 4, 0, Math.PI * 2); g.fill();
  for (const top of [true, false]) {
    const y0 = top ? m : H - m, dir = top ? 1 : -1;
    const pw = 40.32 * sx, pd = 16.5 * sy, gw = 18.32 * sx, gd = 5.5 * sy;
    g.strokeRect(W / 2 - pw / 2, top ? y0 : y0 - pd, pw, pd); g.strokeRect(W / 2 - gw / 2, top ? y0 : y0 - gd, gw, gd);
    const spot = y0 + dir * 11 * sy; g.beginPath(); g.arc(W / 2, spot, 4, 0, Math.PI * 2); g.fill();
    const a = Math.acos((16.5 - 11) / 9.15); g.beginPath(); top ? g.arc(W / 2, spot, 9.15 * sx, a, Math.PI - a) : g.arc(W / 2, spot, 9.15 * sx, Math.PI + a, -a); g.stroke();
    for (const x of [m, W - m]) { g.beginPath(); g.arc(x, y0, 1.2 * sx, top ? (x === m ? 0 : Math.PI / 2) : (x === m ? -Math.PI / 2 : Math.PI), top ? (x === m ? Math.PI / 2 : Math.PI) : (x === m ? 0 : -Math.PI / 2)); g.stroke(); }
    // goal with net
    const gwid = 7.32 * sx, gdep = 2.2 * sy, gy = top ? y0 - gdep : y0;
    g.save(); g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(W / 2 - gwid / 2, gy, gwid, gdep);
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1; for (let x = W / 2 - gwid / 2; x <= W / 2 + gwid / 2; x += 6) L(x, gy, x, gy + gdep); for (let y = gy; y <= gy + gdep; y += 6) L(W / 2 - gwid / 2, y, W / 2 + gwid / 2, y);
    g.strokeStyle = '#fff'; g.lineWidth = 4; g.strokeRect(W / 2 - gwid / 2, gy, gwid, gdep); g.restore();
  }
  g.shadowBlur = 0;
  // stadium light + vignette
  const lt = g.createLinearGradient(0, 0, 0, H); lt.addColorStop(0, `rgba(255,255,255,${T.light})`); lt.addColorStop(.5, 'rgba(255,255,255,0)'); lt.addColorStop(1, `rgba(255,255,255,${T.light * .6})`); g.fillStyle = lt; g.fillRect(0, 0, W, H);
  if (T.pools) for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H]]) { const gr = g.createRadialGradient(x, y, 10, x, y, W * .8); gr.addColorStop(0, 'rgba(220,240,255,.16)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  if (T.warm) { const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(255,150,60,.20)'); gr.addColorStop(1, 'rgba(120,60,255,.12)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  if (T.sepia) { g.fillStyle = 'rgba(120,90,40,.12)'; g.fillRect(0, 0, W, H); }
  const vg = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${T.vig})`); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  const url = c.toDataURL('image/jpeg', .86); PITCH_CACHE.set(key, url); return url;
}
