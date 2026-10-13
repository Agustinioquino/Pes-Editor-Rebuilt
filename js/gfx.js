// ===================== Gráficos: modo (moderno, clásico, retro) y calidad (baja, media, alta) =====================
const GFX_MODES = [
  { k: 'moderno', n: 'Moderno', d: 'El aspecto normal del editor: colores del equipo, brillos y transiciones suaves.' },
  { k: 'clasico', n: 'Clásico', d: 'Como los editores de escritorio de antes: grises, bordes en relieve, sin brillos ni transparencias.' },
  { k: 'retro', n: 'Retro', d: 'Inspirado en los menús de PES de PS2: azul profundo, amarillo, líneas de TV vieja y esquinas rectas.' },
  { k: 'pes6', n: 'PES 6 Editar', d: 'Inspirado en el menú Editar de PES 6: barras plateadas, selección amarilla dorada, barra de título gris carbón, fondo ámbar desenfocado y sus sonidos de confirmar y deshacer.' }
];
const GFX_QS = [
  { k: 'low', n: 'Baja', d: 'Sin animaciones, desenfoques, sombras ni efectos. El 3D se dibuja a resolución normal. Ideal para PCs lentas o notebooks.' },
  { k: 'mid', n: 'Media', d: 'El equilibrio de siempre: animaciones y efectos normales, 3D nítido.' },
  { k: 'high', n: 'Alta', d: 'Todos los efectos al máximo: 3D con supermuestreo (más resolución que la pantalla), desenfoques y brillos más intensos, más partículas en la intro.' }
];
const GFX = () => (PREFS.gfx = Object.assign({ mode: 'moderno', q: 'mid', sfx: 'auto', sfxVol: .5 }, PREFS.gfx || {}));
// resolución del visor 3D según la calidad
function gfxDpr() { const d = devicePixelRatio || 1, q = GFX().q; return q === 'low' ? 1 : q === 'high' ? Math.min(3, Math.max(2, d * 1.5)) : Math.min(2, d); }
function gfxApply(anim) {
  const g = GFX(), r = document.documentElement;
  const go = () => { if (g.mode === 'moderno') delete r.dataset.gfx; else r.dataset.gfx = g.mode; r.dataset.q = g.q; if (typeof uiFontApply === 'function') uiFontApply(); if (typeof uiLogo === 'function') { const i = $('brandLogo'); if (i) delete i.dataset.k; uiLogo(); } };
  if (anim && !ANIM.reduce.matches && document.startViewTransition) document.startViewTransition(go); else go();
  if (typeof K3 !== 'undefined' && K3.viewer && K3.viewer.paint) try { K3.viewer.paint(); } catch { }
}
function gfxPanelHtml() {
  const g = GFX(), card = (grp, it, on) => `<button type="button" class="gfxcard" data-grp="${grp}" data-v="${it.k}" aria-pressed="${on}"><span class="gfxprev gp-${it.k}" aria-hidden="true"><i></i><i></i><i></i></span><b>${it.n}</b><span>${it.d}</span></button>`;
  return `<div class="uihead"><h3>Gráficos</h3><button class="btn ghost small" type="button" id="gfxClose" aria-label="Cerrar">✕</button></div>
    <div class="uisec"><span class="lab">Modo gráfico</span><div class="gfxgrid">${GFX_MODES.map(m => card('mode', m, g.mode === m.k)).join('')}</div></div>
    <div class="uisec"><span class="lab">Calidad gráfica</span><div class="gfxgrid">${GFX_QS.map(m => card('q', m, g.q === m.k)).join('')}</div></div>
    <div class="uisec"><span class="lab">Sonidos de menú</span><div class="seg" id="gfxSfx">${[['auto', 'Solo en PES 6'], ['on', 'Siempre'], ['off', 'Nunca']].map(([k, n]) => `<button type="button" data-sfx="${k}" aria-pressed="${g.sfx === k}">${n}</button>`).join('')}</div>
      <label class="lab" for="gfxVol">Volumen de los sonidos <b id="gfxVolV">${Math.round((g.sfxVol ?? .5) * 100)}%</b></label><input type="range" id="gfxVol" min="0" max="100" step="5" value="${Math.round((g.sfxVol ?? .5) * 100)}"></div>
    <p class="note">El modo y la calidad se combinan con los colores y la fuente de Apariencia. Se guardan en este navegador.</p>`;
}
function gfxPanelToggle(open) {
  let pn = $('gfxPanel');
  if (!pn) {
    pn = document.createElement('aside'); pn.id = 'gfxPanel'; pn.className = 'uipanel'; pn.hidden = true; pn.setAttribute('aria-label', 'Gráficos'); document.body.appendChild(pn);
    pn.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.id === 'gfxClose') return gfxPanelToggle(false);
      if (b.dataset.sfx) { GFX().sfx = b.dataset.sfx; savePrefs(); pn.querySelectorAll('[data-sfx]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); sfx('confirm'); return; }
      if (b.dataset.grp) { GFX()[b.dataset.grp] = b.dataset.v; savePrefs(); gfxApply(true); pn.querySelectorAll(`[data-grp="${b.dataset.grp}"]`).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }
    });
    pn.addEventListener('input', e => { if (e.target.id === 'gfxVol') { GFX().sfxVol = e.target.value / 100; $('gfxVolV').textContent = e.target.value + '%'; savePrefs(); } });
    pn.addEventListener('change', e => { if (e.target.id === 'gfxVol') sfx('confirm'); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pn.hidden) gfxPanelToggle(false); });
    document.addEventListener('pointerdown', e => { if (!pn.hidden && !pn.contains(e.target) && !e.target.closest('#bGfx')) gfxPanelToggle(false); });
  }
  open = open == null ? pn.hidden : open;
  if (open) { if (typeof uiPanelToggle === 'function' && $('uiPanel') && !$('uiPanel').hidden) uiPanelToggle(false); pn.innerHTML = gfxPanelHtml(); pn.hidden = false; requestAnimationFrame(() => pn.classList.add('on')); }
  else { pn.classList.remove('on'); setTimeout(() => { if (!pn.classList.contains('on')) pn.hidden = true; }, 220); }
  const b = $('bGfx'); if (b) b.setAttribute('aria-expanded', open);
}
// ---- sonidos de menú: "confirmar" al tocar opciones y acciones, "deshacer" al volver, cerrar o deshacer ----
// Usa los sonidos que pasaste (SFX_SAMPLES); si no están (versión pública), unos sintetizados parecidos.
const SFX = { ctx: null, buf: {}, loading: null };
const sfxOn = () => { const g = GFX(); return g.sfx === 'on' || (g.sfx !== 'off' && g.mode === 'pes6'); };
function sfxCtx() { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; const c = SFX.ctx || (SFX.ctx = new AC()); if (c.state === 'suspended') c.resume().catch(() => { }); return c; }
function sfxLoad(c) {
  if (SFX.loading || typeof SFX_SAMPLES === 'undefined') return SFX.loading;
  return (SFX.loading = Promise.all(Object.entries(SFX_SAMPLES).map(async ([k, u]) => { try { const r = await fetch(u); SFX.buf[k] = await c.decodeAudioData(await r.arrayBuffer()); } catch { } })));
}
function sfx(kind) {
  if (!sfxOn()) return;
  try {
    const c = sfxCtx(); if (!c) return; sfxLoad(c);
    const out = c.createGain(); out.gain.value = (GFX().sfxVol ?? .5) * 1.4; out.connect(c.destination);
    const b = SFX.buf[kind];
    if (b) { const s = c.createBufferSource(); s.buffer = b; s.connect(out); s.start(); return; }
    // sintetizados (mientras cargan los originales o en la versión sin ellos)
    const t = c.currentTime; out.gain.value *= .16;
    const tone = (type, f0, f1, at, dur, g = 1) => { const o = c.createOscillator(), e = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t + at); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + at + dur); e.gain.setValueAtTime(0, t + at); e.gain.linearRampToValueAtTime(g, t + at + .006); e.gain.exponentialRampToValueAtTime(.001, t + at + dur); o.connect(e).connect(out); o.start(t + at); o.stop(t + at + dur + .02); };
    if (kind === 'confirm') { tone('square', 988, 988, 0, .06, .35); tone('triangle', 1480, 1480, .05, .1, .5); }
    else { tone('square', 784, 784, 0, .06, .3); tone('triangle', 523, 440, .06, .14, .5); }
  } catch { }
}
// qué sonido corresponde a cada cosa que tocás
(() => {
  const sel = '.tab,[data-ttab],.item,.seg button,.btn,.mplist button,.gfxcard,.newsbody>summary,.wepi,.pp,select';
  const isBack = b => /^(uiClose|gfxClose|mpClose|bUndo|mUndo|bRedo)$/.test(b.id) || b.dataset.del != null || /^(✕|×)$/.test((b.textContent || '').trim()) || /descartar|cancelar|cerrar/i.test(b.textContent || '');
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest(sel); if (!b || b.disabled || b.tagName === 'SELECT') return; sfx(isBack(b) ? 'back' : 'confirm'); }, true);
  document.addEventListener('change', e => { if (e.target.tagName === 'SELECT' && e.target.value !== '') sfx('confirm'); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' || ((e.ctrlKey || e.metaKey) && /^[zZyY]$/.test(e.key) && !/INPUT|TEXTAREA/.test(document.activeElement.tagName))) sfx('back'); }, true);
})();
