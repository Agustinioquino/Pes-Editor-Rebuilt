// ===================== Reproductor de música (abajo a la izquierda) =====================
// Dos "bandejas" de audio como en una consola de DJ: mientras una termina, la otra entra.
// Transiciones: Corte (directo), Suave (fundido cruzado) o Remix (filtros que barren + eco, estilo DJ).
// Los navegadores no dejan sonar una página hasta que tocás algo: si la bloquean, arranca con el primer clic o tecla.
const MP = {
  kind: 'audio', ctx: null, master: null, dly: null, decks: [], cur: 0, list: [], i: 0, playing: false, armed: false, trans: null, el: null, simple: false,
  st: { on: true, vol: .45, mute: false, mode: 'remix', fade: 6, shuffle: false, repeat: 'all', open: false, min: false, last: 'pes5' },
  urls: new Map(), covers: {}, custom: [], col: new Map()
};
// ---- preferencias ----
(() => {
  try { const p = JSON.parse(localStorage.getItem('edit21-player') || 'null'); if (p) Object.assign(MP.st, p); else { const o = JSON.parse(localStorage.getItem('edit21-music') || '{}'); if (o.on === false) MP.st.on = false; if (typeof o.vol === 'number') MP.st.vol = o.vol; } } catch { }
  MP.st.open = false;
})();
const mpSave = () => { try { localStorage.setItem('edit21-player', JSON.stringify(MP.st)); } catch { } };
// ---- lista: las del editor + las que agregues ----
MP.base = null;
// versión web (GitHub Pages): las canciones vienen de la carpeta music/; si no está, se usan solo las que agregues vos
async function mpProbe() {
  const all = typeof MUSIC_TRACKS !== 'undefined' ? MUSIC_TRACKS : [];
  if (typeof MUSIC_EMB !== 'undefined') return all.filter(t => MUSIC_EMB[t.k]);
  if (location.protocol === 'file:') return [];
  const ok = await Promise.all(all.map(t => fetch(t.file, { method: 'HEAD' }).then(r => r.ok).catch(() => false)));
  return all.filter((t, i) => ok[i]);
}
function mpBuildList() { MP.list = [...(MP.base || []), ...MP.custom]; }
const mpCover = tr => !tr ? '' : MP.covers[tr.k] || tr.cover || (typeof MUSIC_COVERS !== 'undefined' && MUSIC_COVERS[tr.k]) || mpPlaceholder(tr);
async function mpSrc(tr) {
  if (MP.urls.has(tr.k)) return MP.urls.get(tr.k);
  let url;
  if (tr.blob) url = URL.createObjectURL(tr.blob);
  else if (typeof MUSIC_EMB !== 'undefined' && MUSIC_EMB[tr.k]) { const bin = atob(MUSIC_EMB[tr.k]), b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); url = URL.createObjectURL(new Blob([b], { type: 'audio/webm' })); }
  else url = tr.file;
  MP.urls.set(tr.k, url); return url;
}
// ---- audio ----
function mpDeck() {
  const a = new Audio(); a.preload = 'auto';
  const d = { a, src: null, f: null, g: null, send: null, lvl: 0 };
  a.addEventListener('timeupdate', () => mpTick(d)); a.addEventListener('ended', () => { if (d === MP.decks[MP.cur] && MP.kind !== 'yt') mpNext('auto'); });
  a.addEventListener('loadedmetadata', () => { if (d === MP.decks[MP.cur]) mpUiTime(); });
  return d;
}
function mpGraph() {
  if (MP.ctx || MP.simple) return;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) { MP.simple = true; return; }
  try {
    const c = MP.ctx = new AC(); MP.master = c.createGain(); MP.master.gain.value = 0; MP.master.connect(c.destination);
    // eco compartido para el modo Remix
    MP.dly = c.createDelay(2); MP.dly.delayTime.value = .36; const fb = c.createGain(); fb.gain.value = .42; const wet = c.createGain(); wet.gain.value = .55;
    MP.dly.connect(fb).connect(MP.dly); MP.dly.connect(wet).connect(MP.master);
    for (const d of MP.decks) { d.src = c.createMediaElementSource(d.a); d.f = c.createBiquadFilter(); d.f.type = 'allpass'; d.g = c.createGain(); d.g.gain.value = d.lvl; d.send = c.createGain(); d.send.gain.value = 0; d.src.connect(d.f); d.f.connect(d.g).connect(MP.master); d.f.connect(d.send).connect(MP.dly); }
  } catch { MP.simple = true; MP.ctx = null; }
}
// el navegador deja arrancar el audio solo después de un clic o tecla: si no, resume() queda esperando
async function mpWake() {
  mpGraph(); if (!MP.ctx || MP.ctx.state === 'running') return true;
  try { await Promise.race([MP.ctx.resume(), new Promise(r => setTimeout(r, 350))]); } catch { }
  return MP.ctx.state === 'running';
}
const mpVolTarget = () => MP.st.mute ? 0 : MP.st.vol;
function mpMaster(to, dur = .4) {
  if (MP.ctx) { const g = MP.master.gain, t = MP.ctx.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(to, t + dur); }
  else MP.decks.forEach(d => mpSimpleVol(d));
}
function mpSimpleVol(d) { d.a.volume = Math.max(0, Math.min(1, d.lvl * mpVolTarget() * (MP.playing ? 1 : 0))); }
// cambia el nivel de una bandeja con curva de potencia constante (no hay bajón en el medio del fundido)
function mpLevel(d, to, dur, ease = 'in') {
  const from = d.lvl; d.lvl = to;
  if (MP.ctx) {
    const g = d.g.gain, t = MP.ctx.currentTime; g.cancelScheduledValues(t);
    if (dur <= .02) { g.setValueAtTime(to, t); return; }
    const N = 64, c = new Float32Array(N);
    for (let i = 0; i < N; i++) { const k = i / (N - 1); c[i] = from + (to - from) * (to > from ? Math.sin(k * Math.PI / 2) : 1 - Math.cos(k * Math.PI / 2)); }
    g.setValueAtTime(from, t); g.setValueCurveAtTime(c, t + .005, dur);
  } else {
    const t0 = performance.now(); clearInterval(d.iv);
    d.iv = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / (dur * 1000)); const v = from + (to - from) * (to > from ? Math.sin(k * Math.PI / 2) : 1 - Math.cos(k * Math.PI / 2)); d.a.volume = Math.max(0, Math.min(1, v * mpVolTarget())); if (k >= 1) clearInterval(d.iv); }, 40);
  }
}
function mpFilter(d, type, f0, f1, dur) {
  if (!MP.ctx) return; const f = d.f, t = MP.ctx.currentTime;
  f.frequency.cancelScheduledValues(t); f.type = type; f.Q.value = type === 'allpass' ? .7 : 4.5; f.frequency.setValueAtTime(f0, t);
  if (dur > 0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
}
function mpSend(d, to, dur) { if (!MP.ctx) return; const g = d.send.gain, t = MP.ctx.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(to, t + Math.max(.02, dur)); }
// ---- reproducir / pasar de canción ----
async function mpGo(i, why = 'user') {
  if (!MP.list.length) { MP.playing = false; mpUi(); return; }
  if (MP.going) return; MP.going = true;
  try { await mpGo2(i, why); } finally { MP.going = false; }
}
async function mpGo2(i, why) { i = (i + MP.list.length) % MP.list.length;
  const tr = MP.list[i], outD = MP.decks[MP.cur], inD = MP.decks[1 - MP.cur];
  if (tr.sp) return mpGoSp(i, tr);
  if (MP.kind === 'sp') { spHalt(); MP.kind = 'audio'; MP.playing = false; }
  if (tr.yt || MP.kind === 'yt') return mpGoYt(i, tr, why);
  const first = !MP.playing || !outD.a.src || outD.a.paused;
  let src; try { src = await mpSrc(tr); } catch { return; }
  mpFinish();
  inD.a.loop = false; inD.a.src = src; inD.a.currentTime = 0;
  if (!await mpWake()) { mpArm(); MP.i = i; MP.st.last = tr.k; mpSave(); mpUi(); return; }
  try { await inD.a.play(); } catch (er) { MP.err = er.name + ': ' + er.message; mpArm(); MP.i = i; MP.st.last = tr.k; mpSave(); mpUi(); return; }
  const was = MP.playing; MP.playing = true; MP.i = i; MP.st.last = tr.k; mpSave();
  if (!was || first) { // primera vez o venía en pausa: entra sola con fundido
    outD.a.pause(); outD.lvl = 0; if (MP.ctx) { outD.g.gain.value = 0; mpFilter(outD, 'allpass', 1000, 1000, 0); }
    MP.cur = 1 - MP.cur; mpFilter(inD, 'allpass', 1000, 1000, 0); mpLevel(inD, 1, .05); mpMaster(mpVolTarget(), 1.6); mpUi(); return;
  }
  const mode = MP.st.mode, D = mode === 'corte' ? .25 : why === 'auto' ? MP.st.fade : Math.min(MP.st.fade, 3.5);
  MP.cur = 1 - MP.cur; MP.trans = 1; mpMaster(mpVolTarget(), .2);
  if (mode === 'remix' && MP.ctx) {
    // la que sale: se le cierran los graves y agudos (filtro que baja) y queda el eco; la que entra: arranca sin graves y se abre
    mpFilter(outD, 'lowpass', 16000, 260, D); mpSend(outD, .55, D * .5); mpLevel(outD, 0, D);
    mpFilter(inD, 'highpass', 1400, 25, D * .85); mpSend(inD, 0, .02); mpLevel(inD, 1, D * .7);
    setTimeout(() => mpSend(outD, 0, 1.2), D * 1000);
  } else { mpFilter(inD, 'allpass', 1000, 1000, 0); mpLevel(outD, 0, D); mpLevel(inD, 1, D); }
  MP.trans = setTimeout(() => { outD.a.pause(); mpFilter(outD, 'allpass', 1000, 1000, 0); mpFilter(inD, 'allpass', 1000, 1000, 0); MP.trans = null; }, D * 1000 + 120);
  mpUi();
}
function mpNextIndex(auto) {
  const n = MP.list.length; if (n < 2) return MP.i;
  if (MP.st.shuffle) { let j; do j = Math.floor(Math.random() * n); while (j === MP.i); return j; }
  if (auto && MP.st.repeat === 'off' && MP.i === n - 1) return -1;
  return MP.i + 1;
}
function mpNext(why = 'user') { const j = mpNextIndex(why === 'auto'); if (j < 0) { mpPause(); return; } mpGo(j, why); }
function mpPrev() { if (MP.kind === 'sp' && SP_ST.pos > 4) { spSeek(0); return; } const d = MP.decks[MP.cur]; if (MP.kind === 'audio' && d.a.currentTime > 4) { d.a.currentTime = 0; return; } mpGo(MP.i - 1); }
function mpTick(d) {
  if (d !== MP.decks[MP.cur] || MP.kind !== 'audio') return; mpUiTime();
  const a = d.a; if (!MP.playing || MP.trans || MP.going || !a.duration || MP.st.repeat === 'one') return;
  const D = MP.st.mode === 'corte' ? .3 : MP.st.fade;
  if (a.duration - a.currentTime <= D + .15 && MP.list.length > 1) mpNext('auto');
}
async function mpPlay() {
  if (!MP.st.on) MP.st.on = true;
  if (MP.kind === 'sp' && SP_ST.ctl) { spPlay(); MP.playing = true; mpSave(); mpUi(); return; }
  if (MP.kind === 'yt' && YT_ST.p[YT_ST.cur]) { const p = YT_ST.p[YT_ST.cur]; try { p.setVolume(0); p.playVideo(); } catch { } MP.playing = true; ytRamp(p, ytVol(), .6); ytTick(); mpSave(); mpUi(); return; }
  const d = MP.decks[MP.cur];
  if (d.a.src && d.a.currentTime > 0) { if (!await mpWake()) { mpArm(); mpUi(); return; } try { await d.a.play(); MP.playing = true; mpMaster(mpVolTarget(), .6); if (MP.simple) mpSimpleVol(d); } catch { mpArm(); } mpSave(); mpUi(); return; }
  const k = MP.list.findIndex(t => t.k === MP.st.last); await mpGo(k < 0 ? 0 : k, 'start'); mpSave();
}
// termina al instante un pase que estaba a mitad de camino
function mpFinish() {
  if (!MP.trans) return; clearTimeout(MP.trans); MP.trans = null;
  const inD = MP.decks[MP.cur], outD = MP.decks[1 - MP.cur]; outD.a.pause();
  for (const d of [inD, outD]) { mpFilter(d, 'allpass', 1000, 1000, 0); if (MP.ctx) { const t = MP.ctx.currentTime; d.g.gain.cancelScheduledValues(t); d.send.gain.cancelScheduledValues(t); d.send.gain.setValueAtTime(0, t); } }
  mpLevel(outD, 0, .02); mpLevel(inD, 1, .02);
}
function mpPause() {
  MP.playing = false; MP.st.on = false; mpSave(); mpMaster(0, .4); mpFinish();
  if (MP.kind === 'sp') spPause();
  if (MP.kind === 'yt') { const p = YT_ST.p[YT_ST.cur]; if (p) { ytRamp(p, 0, .35); setTimeout(() => { if (!MP.playing) try { p.pauseVideo(); } catch { } }, 400); } }
  setTimeout(() => { if (!MP.playing) MP.decks.forEach(d => d.a.pause()); }, 420); mpUi();
}
function mpToggle() { if (!MP.list.length) { if (MP.el && !MP.st.open) MP.el.querySelector('#mpOpen').click(); return; } (MP.playing ? mpPause : mpPlay)(); }
function mpArm() {
  if (MP.armed) return; MP.armed = true; mpUi();
  const go = e => { if (e.target && e.target.closest && e.target.closest('.musbtn,#mpPlay')) { done(); return; } done(); if (MP.st.on && !MP.playing) mpPlay(); };
  const done = () => { MP.armed = false; for (const k of ['pointerdown', 'keydown']) removeEventListener(k, go, true); };
  for (const k of ['pointerdown', 'keydown']) addEventListener(k, go, true);
}
function mpSetVol(v) { MP.st.vol = v; MP.st.mute = false; mpSave(); if (MP.kind === 'yt' && YT_ST.p[YT_ST.cur]) { ytRamp(YT_ST.p[YT_ST.cur], ytVol(), 0); } if (MP.ctx) { const g = MP.master.gain, t = MP.ctx.currentTime; g.cancelScheduledValues(t); g.setTargetAtTime(MP.playing ? v : 0, t, .03); } else MP.decks.forEach(mpSimpleVol); mpUiVol(); }
function mpMute() { MP.st.mute = !MP.st.mute; mpSave(); if (MP.kind === 'yt' && YT_ST.p[YT_ST.cur]) ytRamp(YT_ST.p[YT_ST.cur], ytVol(), .25); if (MP.playing) mpMaster(mpVolTarget(), .25); mpUiVol(); }
// ---- color de la carátula: el reproductor toma su tono ----
function mpColor(tr, cb) {
  const src = mpCover(tr); if (!src) return cb(null); if (MP.col.has(src)) return cb(MP.col.get(src));
  const im = new Image(); im.onload = () => { try { const c = document.createElement('canvas'); c.width = c.height = 24; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, 24, 24); const p = g.getImageData(0, 0, 24, 24).data; let r = 0, gg = 0, b = 0, w = 0; for (let i = 0; i < p.length; i += 4) { const mx = Math.max(p[i], p[i + 1], p[i + 2]), mn = Math.min(p[i], p[i + 1], p[i + 2]), s = mx ? (mx - mn) / mx : 0, k = s * s * (mx / 255) + .02; r += p[i] * k; gg += p[i + 1] * k; b += p[i + 2] * k; w += k; } const col = `rgb(${Math.round(r / w)},${Math.round(gg / w)},${Math.round(b / w)})`; MP.col.set(src, col); cb(col); } catch { cb(null); } }; im.src = src;
}
// ---- interfaz ----
const MPI = {
  play: '<path d="M8 5v14l11-7z"/>', pause: '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>', next: '<path d="M6 6l8.5 6L6 18zM16 6h2v12h-2z"/>', prev: '<path d="M18 6l-8.5 6L18 18zM6 6h2v12H6z"/>',
  shuf: '<path d="M16 4h4v4M20 4l-6 6M4 20l6-6M16 20h4v-4M20 20L4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  rep: '<path d="M17 2l3 3-3 3M4 11V9a4 4 0 014-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 01-4 4H4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  vol: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  up: '<path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  min: '<path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'
};
const mpIco = (k, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="currentColor" aria-hidden="true">${MPI[k]}</svg>`;
const mpTime = s => !isFinite(s) ? '0:00' : Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
function mpMount() {
  if (MP.el) return; const el = MP.el = document.createElement('aside'); el.className = 'mp'; el.id = 'mPlayer'; el.setAttribute('aria-label', 'Reproductor de música');
  el.innerHTML = `<div class="mpfull" id="mpFull" aria-hidden="true">
      <div class="mphead"><span>Música del menú</span><button type="button" class="mpb" id="mpMinB" title="Achicar a un círculo">${mpIco('min', 16)}</button><button type="button" class="mpb" id="mpClose" title="Cerrar el panel">${mpIco('up', 16)}</button></div>
      <div class="mpart"><span class="mpglow"></span><img id="mpArt" alt=""><span class="mpbars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></div>
      <div class="mpinfo"><b id="mpT2"></b><span id="mpG2"></span></div>
      <div class="mpseek"><span id="mpCur">0:00</span><input type="range" id="mpSeek" min="0" max="1000" value="0" aria-label="Posición de la canción"><span id="mpDur">0:00</span></div>
      <div class="mpctl"><button type="button" class="mpb" id="mpShuf" title="Aleatorio">${mpIco('shuf')}</button><button type="button" class="mpb" id="mpPrev" title="Anterior">${mpIco('prev', 22)}</button>
        <button type="button" class="mpb mpmain" id="mpPlay2" title="Reproducir o pausar">${mpIco('play', 26)}</button><button type="button" class="mpb" id="mpNext2" title="Siguiente">${mpIco('next', 22)}</button><button type="button" class="mpb" id="mpRep" title="Repetir">${mpIco('rep')}<small id="mpRepK"></small></button></div>
      <div class="mpvol"><button type="button" class="mpb" id="mpMute" title="Silenciar">${mpIco('vol')}</button><input type="range" id="mpVol" min="0" max="100" step="1" aria-label="Volumen"><b id="mpVolV"></b></div>
      <div class="mpmix"><span class="lab">Pase entre canciones</span><div class="seg" id="mpMode">${[['corte', 'Corte'], ['suave', 'Suave'], ['remix', 'Remix']].map(([k, n]) => `<button type="button" data-v="${k}">${n}</button>`).join('')}</div>
        <label class="mpfade"><span>Duración <b id="mpFadeV"></b></span><input type="range" id="mpFade" min="2" max="14" step="1" aria-label="Duración del pase"></label><p class="mpnote" id="mpNote"></p></div>
      <ol class="mplist" id="mpList"></ol>
      <div class="mpfoot"><button type="button" class="btn small" id="mpAdd">＋ Agregar canciones</button><button type="button" class="btn small" id="mpYtB" aria-expanded="false">🔗 Agregar por link</button><button type="button" class="btn small ghost" id="mpCoverB">🖼 Carátula</button></div>
      ${mfHtmlPanel()}
    </div>
    <div class="mptv" id="mpTv" aria-label="Video de YouTube"><button type="button" class="mptvcov" id="mpTvCov" title="Ver el video otra vez"><img alt=""><span>▶ Ver video</span></button><div class="mptvbar" id="mpTvBar" title="Arrastrá para moverlo · doble clic: volver a su lugar">⠿ mover</div><span class="mptvrs" id="mpTvRs" title="Arrastrá para cambiar el tamaño"></span><button type="button" class="mptvx" id="mpTvX" title="Sacar el video (sigue sonando la música)" aria-label="Sacar el video">✕</button><div class="mptvp" data-n="0"><div id="mpYt0"></div></div><div class="mptvp" data-n="1"><div id="mpYt1"></div></div><div class="mptvp" data-n="sp"><div id="mpSp"></div></div></div>
    <div class="mpbar"><button type="button" class="mpcov" id="mpCov" title="Abrir el reproductor"><img id="mpArtS" alt=""><span class="mpring"></span></button>
      <button type="button" class="mpmeta" id="mpMeta" title="Abrir el reproductor"><b class="mpt"><span id="mpT"></span></b><small id="mpG"></small></button>
      <button type="button" class="mpb mpmain sm" id="mpPlay" title="Reproducir o pausar">${mpIco('play', 20)}</button><button type="button" class="mpb" id="mpNext" title="Siguiente">${mpIco('next', 18)}</button>
      <button type="button" class="mpb mpup" id="mpOpen" title="Abrir el reproductor">${mpIco('up', 16)}</button><i class="mpprog"><b id="mpProg"></b></i></div>`;
  document.body.appendChild(el);
  const $m = id => el.querySelector('#' + id);
  const open = v => { MP.st.open = v == null ? !MP.st.open : v; if (MP.st.open) MP.st.min = false; mpSave(); mpUiState(); if (MP.st.open) { mpRenderList(); } };
  $m('mpCov').onclick = () => { if (el.classList.contains('ytmin') && typeof ytMinOff === 'function') ytMinOff(); else if (MP.st.min) { MP.st.min = false; mpSave(); mpUiState(); } else open(); };
  $m('mpMeta').onclick = () => open(); $m('mpOpen').onclick = () => open(); $m('mpClose').onclick = () => open(false);
  $m('mpMinB').onclick = () => { MP.st.min = true; MP.st.open = false; mpSave(); mpUiState(); };
  $m('mpPlay').onclick = $m('mpPlay2').onclick = () => mpToggle();
  $m('mpNext').onclick = $m('mpNext2').onclick = () => mpNext(); $m('mpPrev').onclick = () => mpPrev();
  $m('mpShuf').onclick = () => { MP.st.shuffle = !MP.st.shuffle; mpSave(); mpUi(); };
  $m('mpRep').onclick = () => { MP.st.repeat = { all: 'one', one: 'off', off: 'all' }[MP.st.repeat]; MP.decks[MP.cur].a.loop = MP.st.repeat === 'one'; mpSave(); mpUi(); };
  $m('mpMute').onclick = () => mpMute();
  $m('mpVol').oninput = e => mpSetVol(e.target.value / 100);
  $m('mpSeek').oninput = e => { if (MP.kind === 'sp') { if (SP_ST.dur) spSeek(e.target.value / 1000 * SP_ST.dur); return; } if (MP.kind === 'yt') { const p = YT_ST.p[YT_ST.cur]; try { p.seekTo(e.target.value / 1000 * p.getDuration(), true); } catch { } return; } const a = MP.decks[MP.cur].a; if (a.duration) { a.currentTime = e.target.value / 1000 * a.duration; } };
  $m('mpMode').onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; MP.st.mode = b.dataset.v; mpSave(); mpUi(); };
  $m('mpFade').oninput = e => { MP.st.fade = +e.target.value; mpSave(); mpUi(); };
  $m('mpList').onclick = e => { const x = e.target.closest('[data-del]'); if (x) { e.stopPropagation(); mpRemoveCustom(x.dataset.del); return; } const b = e.target.closest('[data-i]'); if (b) { MP.st.on = true; mpGo(+b.dataset.i); } };
  $m('mpAdd').onclick = () => mpAddFiles();
  $m('mpCoverB').onclick = () => mpPickCover();
  $m('mpYtB').onclick = () => { const f = $m('mpYtF'), on = f.hidden; f.hidden = !on; $m('mpYtB').setAttribute('aria-expanded', String(on)); if (on) setTimeout(() => $m('mpYtU').focus(), 50); };
  mfBind(el);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && MP.st.open) open(false); });
  $m('mpFull').addEventListener('scroll', () => { if (MP.kind === 'yt') mpTvPlace(); }, { passive: true }); addEventListener('resize', () => mpTvPlace());
  document.addEventListener('pointerdown', e => { if (MP.st.open && !el.contains(e.target)) open(false); });
  mpTvDrag(el);
  mpUiState(); mpUi();
}
// la ventanita del video (YouTube o Spotify): con el reproductor cerrado se puede mover arrastrando la barra de arriba
// y cambiar de tamaño desde la esquina de abajo a la derecha; queda guardada (doble clic en la barra la devuelve)
function mpTvDrag(el) {
  const tv = el.querySelector('#mpTv');
  const start = (e, kind) => {
    if (MP.st.open || e.button) return; e.preventDefault(); e.stopPropagation();
    const r = el.getBoundingClientRect(), t = tv.getBoundingClientRect(), x0 = e.clientX, y0 = e.clientY;
    const b0 = { x: t.left - r.left, y: t.top - r.top, w: t.width, h: t.height };
    tv.classList.add('drag');
    const move = ev => { const dx = ev.clientX - x0, dy = ev.clientY - y0; MP.st.tvBox = kind === 'move' ? { ...b0, x: b0.x + dx, y: b0.y + dy } : { ...b0, w: b0.w + dx, h: b0.h + dy }; mpTvPlace(); };
    const up = () => { tv.classList.remove('drag'); removeEventListener('pointermove', move); removeEventListener('pointerup', up); mpSave(); };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  };
  el.querySelector('#mpTvBar').onpointerdown = e => start(e, 'move');
  el.querySelector('#mpTvRs').onpointerdown = e => start(e, 'size');
  el.querySelector('#mpTvBar').ondblclick = () => { delete MP.st.tvBox; mpSave(); mpTvPlace(); };
}
function mpRenderList() {
  const ol = MP.el && MP.el.querySelector('#mpList'); if (!ol) return;
  if (!ol.__err) { ol.__err = 1; ol.addEventListener('error', e => { const im = e.target; if (im.tagName === 'IMG' && im.dataset.ph != null && !im.dataset.fb) { im.dataset.fb = 1; im.src = mpPlaceholder(MP.list[+im.dataset.ph] || {}); } }, true); }
  ol.innerHTML = MP.list.map((t, i) => `<li><button type="button" data-i="${i}" class="${i === MP.i ? 'on' : ''}"><img src="${mpCover(t)}" alt="" data-ph="${i}"><span><b>${esc(t.t)}</b><small>${esc(t.g)}${t.y ? ' · ' + t.y : ''}</small></span>${i === MP.i ? '<span class="mpeq" aria-label="sonando"><i></i><i></i><i></i></span>' : ''}</button>${t.blob || t.yt || t.sp ? `<button type="button" class="mpdel" data-del="${esc(t.k)}" title="Quitar de la lista">✕</button>` : ''}</li>`).join('');
}
function mpUiState() {
  const el = MP.el; if (!el) return;
  el.classList.toggle('open', !!MP.st.open); el.classList.toggle('min', !!MP.st.min);
  el.querySelector('#mpFull').setAttribute('aria-hidden', String(!MP.st.open));
  mpTvPlace(); clearTimeout(MP.tvT); MP.tvT = setTimeout(mpTvPlace, 380);
  mpYtMobile();
}
// en el celular el video de YouTube no se muestra encima de la página: se ve solo con el panel abierto.
// YouTube no permite que su audio siga sonando con el video oculto, así que al cerrar el panel ese tema se pausa
// (tus canciones propias siguen sonando normal) y vuelve a sonar al abrirlo.
const mpIsPhone = () => matchMedia('(max-width: 640px)').matches;
function mpYtMobile() {
  if (MP.kind !== 'yt') { MP.ytHid = false; return; }
  const p = YT_ST.p[YT_ST.cur]; if (!p) return;
  if (mpIsPhone() && !MP.st.open && MP.playing) { MP.ytHid = true; try { p.pauseVideo(); } catch { } MP.el && MP.el.classList.add('ythold'); if (!MP.ytHidTold) { MP.ytHidTold = 1; toast('En el celular, los temas de YouTube suenan con el reproductor abierto (YouTube no deja ocultar el video). Tus canciones propias suenan siempre.', 7000); } }
  else if (MP.ytHid && (MP.st.open || !mpIsPhone())) { MP.ytHid = false; MP.el && MP.el.classList.remove('ythold'); if (MP.playing) try { p.playVideo(); } catch { } }
}
// video de YouTube: chiquito arriba del reproductor; con el panel abierto ocupa el lugar de la carátula
function mpTvPlace() {
  const el = MP.el, tv = el && el.querySelector('#mpTv'); if (!tv) return;
  if (!MP.st.open && MP.st.tvBox) {
    // donde lo dejó el usuario, siempre adentro de la ventana
    const r = el.getBoundingClientRect(), B = MP.st.tvBox;
    const w = Math.round(Math.min(Math.max(B.w, 200), innerWidth - 16)), h = Math.round(Math.min(Math.max(B.h, 120), innerHeight - 16));
    const vx = Math.min(Math.max(r.left + B.x, 8), innerWidth - w - 8), vy = Math.min(Math.max(r.top + B.y, 8), innerHeight - h - 8);
    tv.style.left = Math.round(vx - r.left) + 'px'; tv.style.top = Math.round(vy - r.top) + 'px'; tv.style.bottom = 'auto'; tv.style.width = w + 'px'; tv.style.height = h + 'px';
    return;
  }
  if (!MP.st.open) {
    // minimizado: arriba del reproductor si a la izquierda de la página queda un hueco libre;
    // si no hay lugar (pantallas más angostas), al costado como antes
    const r = el.getBoundingClientRect(), mc = document.getElementById('main'), first = mc && mc.firstElementChild;
    const contentLeft = first ? first.getBoundingClientRect().left : mc ? mc.getBoundingClientRect().left + 16 : 0;
    const free = Math.round(Math.min(r.width, contentLeft - r.left - 12));
    if (free >= 200) { tv.style.left = '0px'; tv.style.top = 'auto'; tv.style.bottom = 'calc(100% + 10px)'; tv.style.width = free + 'px'; tv.style.height = Math.max(200, Math.round(free * 9 / 16)) + 'px'; }
    else { tv.style.left = (r.width + 10) + 'px'; tv.style.top = 'auto'; tv.style.bottom = '0px'; tv.style.width = tv.style.height = '200px'; }
    return;
  }
  tv.style.bottom = '';
  const art = el.querySelector('.mpart'), a = art.getBoundingClientRect(), r = el.getBoundingClientRect(), full = el.querySelector('#mpFull'), fr = full.getBoundingClientRect();
  const top = Math.max(fr.top, a.top), bot = Math.min(fr.bottom, a.bottom);
  tv.style.left = (a.left - r.left) + 'px'; tv.style.top = (top - r.top) + 'px'; tv.style.width = Math.max(200, a.width) + 'px'; tv.style.height = Math.max(200, bot - top) + 'px';
}
function mpUiVol() {
  const el = MP.el; if (!el) return; const v = Math.round(MP.st.vol * 100);
  el.querySelector('#mpVol').value = v; el.querySelector('#mpVol').style.setProperty('--p', (MP.st.mute ? 0 : v) + '%'); el.querySelector('#mpVolV').textContent = MP.st.mute ? 'Mudo' : v + '%';
  el.querySelector('#mpMute').innerHTML = mpIco(MP.st.mute || !v ? 'mute' : 'vol'); el.querySelector('#mpMute').classList.toggle('on', MP.st.mute);
}
function mpUiTime() {
  const el = MP.el; if (!el) return; let a = MP.decks[MP.cur].a;
  if (MP.kind === 'yt') { const p = YT_ST.p[YT_ST.cur]; let t = 0, d = 0; try { t = p.getCurrentTime() || 0; d = p.getDuration() || 0; } catch { } a = { currentTime: t, duration: d }; }
  else if (MP.kind === 'sp') a = { currentTime: SP_ST.pos, duration: SP_ST.dur };
  const k = a.duration ? a.currentTime / a.duration : 0;
  el.querySelector('#mpProg').style.width = (k * 100).toFixed(2) + '%';
  if (MP.st.open) { const s = el.querySelector('#mpSeek'); if (document.activeElement !== s) { s.value = Math.round(k * 1000); } s.style.setProperty('--p', (k * 100).toFixed(2) + '%'); el.querySelector('#mpCur').textContent = mpTime(a.currentTime); el.querySelector('#mpDur').textContent = mpTime(a.duration); }
}
function mpUi() {
  document.querySelectorAll('.musbtn').forEach(b => { b.classList.toggle('on', MP.playing); b.classList.toggle('wait', MP.st.on && !MP.playing); b.setAttribute('aria-pressed', String(MP.st.on)); b.title = MP.playing ? 'Música sonando: tocá para pausar' : MP.st.on ? 'La música arranca cuando toques algo en la página' : 'Música en pausa: tocá para seguir'; });
  const el = MP.el; if (!el) return; const tr = MP.list[MP.i] || MP.list[0]; el.hidden = false; el.classList.toggle('empty', !tr);
  if (!tr) { el.querySelector('#mpT').textContent = el.querySelector('#mpT2').textContent = 'Tu música'; el.querySelector('#mpG').textContent = 'Tocá para agregar'; el.querySelector('#mpG2').textContent = 'Tocá ＋ Agregar canciones para sumar tus temas'; mpUiVol(); mpRenderList(); return; }
  const cov = mpCover(tr);
  for (const id of ['mpArt', 'mpArtS']) { const im = el.querySelector('#' + id); im.onerror = () => { im.onerror = null; im.src = mpPlaceholder(tr); }; if (im.getAttribute('src') !== cov) { im.src = cov; if (!ANIM.reduce.matches) im.animate([{ opacity: 0, transform: 'scale(.9) rotate(-4deg)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.9,.3,1.2)' }); } }
  const meta = `${tr.g}${tr.y ? ' · ' + tr.y : ''}`;
  el.querySelector('#mpT').textContent = tr.t; el.querySelector('#mpG').textContent = meta; el.querySelector('#mpT2').textContent = tr.t; el.querySelector('#mpG2').textContent = meta;
  const t = el.querySelector('.mpt'); t.classList.toggle('long', el.querySelector('#mpT').scrollWidth > t.clientWidth + 2);
  el.classList.toggle('playing', MP.playing); el.classList.toggle('waiting', MP.st.on && !MP.playing && MP.armed);
  for (const id of ['mpPlay', 'mpPlay2']) el.querySelector('#' + id).innerHTML = mpIco(MP.playing ? 'pause' : 'play', id === 'mpPlay' ? 20 : 26);
  el.querySelector('#mpShuf').classList.toggle('on', MP.st.shuffle);
  el.querySelector('#mpRep').classList.toggle('on', MP.st.repeat !== 'off'); el.querySelector('#mpRepK').textContent = MP.st.repeat === 'one' ? '1' : '';
  el.querySelector('#mpRep').title = { all: 'Repetir la lista', one: 'Repetir esta canción', off: 'Sin repetir' }[MP.st.repeat];
  el.querySelectorAll('#mpMode [data-v]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === MP.st.mode)));
  const fd = el.querySelector('#mpFade'); fd.value = MP.st.fade; fd.disabled = MP.st.mode === 'corte'; fd.style.setProperty('--p', ((MP.st.fade - 2) / 12 * 100) + '%'); el.querySelector('#mpFadeV').textContent = MP.st.fade + ' s';
  el.querySelector('#mpNote').textContent = { corte: 'Pasa directo a la siguiente canción.', suave: 'Una canción baja mientras la otra sube, sin silencio en el medio.', remix: 'Como un DJ: a la que termina se le cierran los sonidos con un filtro y queda un eco; la nueva entra sin graves y se abre de a poco.' }[MP.st.mode];
  mpUiVol(); mpUiTime(); if (MP.st.open) mpRenderList();
  mpColor(tr, c => { if (c) el.style.setProperty('--mpc', c); });
  if ('mediaSession' in navigator) { try { navigator.mediaSession.metadata = new MediaMetadata({ title: tr.t, artist: tr.g, album: 'PES Editor Rebuilt', artwork: cov ? [{ src: cov, sizes: '320x320', type: cov.startsWith('data:image/png') ? 'image/png' : 'image/jpeg' }] : [] }); navigator.mediaSession.playbackState = MP.playing ? 'playing' : 'paused'; } catch { } }
}
// ---- canciones y carátulas propias (quedan guardadas en este navegador) ----
async function mpLoadCustom() {
  try { MP.custom = (await idbGet('musicCustom')) || []; } catch { MP.custom = []; }
  try { MP.covers = (await idbGet('musicCovers')) || {}; } catch { MP.covers = {}; }
}
const mpPick = (accept, multiple) => new Promise(res => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept; inp.multiple = !!multiple; inp.onchange = () => res([...inp.files]); inp.click(); });
async function mpAddFiles() {
  const fs = await mpPick('audio/*', true); if (!fs.length) return;
  toast(fs.length === 1 ? 'Leyendo la canción…' : `Leyendo ${fs.length} canciones…`, 2000);
  for (const f of fs) {
    const tg = await mpReadTags(f), name = f.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').replace(/\s+-\s+/g, ' - ').trim();
    MP.custom.push({ k: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t: tg.title || name, g: tg.artist || tg.album || 'Tu música', y: tg.year || '', alb: tg.album || '', cover: tg.cover || '', blob: f });
  }
  try { await idbSet('musicCustom', MP.custom); } catch (e) { toast('No se pudieron guardar: ' + e.message, 6000); }
  const was = MP.list.length; mpBuildList(); if (!was) { MP.i = 0; MP.st.on = true; mpGo(0); } mpRenderList(); toast(fs.length === 1 ? 'Canción agregada a la lista.' : fs.length + ' canciones agregadas a la lista.');
}
async function mpRemoveCustom(k) {
  const i = MP.list.findIndex(t => t.k === k); if (i === MP.i && MP.playing) mpNext();
  MP.custom = MP.custom.filter(t => t.k !== k); try { await idbSet('musicCustom', MP.custom); } catch { }
  const cur = MP.list[MP.i]; mpBuildList(); MP.i = Math.max(0, MP.list.indexOf(cur)); mpRenderList();
}
async function mpPickCover() {
  const tr = MP.list[MP.i]; if (!tr) return;
  if (MP.covers[tr.k] && await confirmBox(`¿Volver a la carátula original de "${tr.t}"?`)) { delete MP.covers[tr.k]; try { await idbSet('musicCovers', MP.covers); } catch { } mpUi(); return; }
  const [f] = await mpPick('image/*'); if (!f) return;
  const im = new Image(); im.onload = async () => {
    const S = 320, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); const r = Math.max(S / im.width, S / im.height), w = im.width * r, h = im.height * r; g.drawImage(im, (S - w) / 2, (S - h) / 2, w, h);
    MP.covers[tr.k] = c.toDataURL('image/jpeg', .85); try { await idbSet('musicCovers', MP.covers); } catch { } mpUi(); toast('Carátula cambiada. Tocá 🖼 otra vez para volver a la original.');
  }; im.src = URL.createObjectURL(f);
}
// ---- arranque ----
async function mpInit() {
  MP.decks = [mpDeck(), mpDeck()];
  MP.base = await mpProbe(); await mpLoadCustom(); mpBuildList();
  const k = MP.list.findIndex(t => t.k === MP.st.last); MP.i = k < 0 ? 0 : k;
  mpMount(); if (!MP.list.length) return;
  if ('mediaSession' in navigator) { try { navigator.mediaSession.setActionHandler('play', mpPlay); navigator.mediaSession.setActionHandler('pause', mpPause); navigator.mediaSession.setActionHandler('nexttrack', () => mpNext()); navigator.mediaSession.setActionHandler('previoustrack', mpPrev); } catch { } }
  if (MP.st.on) mpPlay();
}
// botón chico de música (en la intro)
const musBtn = (extra = '') => `<button type="button" class="musbtn ${extra}" aria-label="Música del menú" aria-pressed="${MP.st.on}"><span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="mlab">Música</span></button>`;
const musUi = () => mpUi();
document.addEventListener('click', e => { const b = e.target.closest('.musbtn'); if (b) { e.preventDefault(); mpToggle(); } });
