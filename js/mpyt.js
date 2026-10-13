// ===================== Reproductor: listas y videos de YouTube =====================
// YouTube no deja sacar el audio de sus videos ni ocultarlos: se reproducen en una ventanita de video (mínimo 200×200,
// como piden sus reglas) al lado del reproductor. El volumen y los pases suaves funcionan; el "Remix" con filtros
// solo se puede con canciones propias, así que con YouTube el pase es un fundido.
const YT_ST = { api: null, p: [], cur: 0, poll: 0, made: null, err: 0 };
function mpYtParse(s) {
  s = (s || '').trim(); if (!s) return null;
  const list = (s.match(/[?&]list=([\w-]{10,})/) || [])[1];
  const v = (s.match(/[?&]v=([\w-]{11})/) || s.match(/youtu\.be\/([\w-]{11})/) || s.match(/\/(?:embed|shorts|live)\/([\w-]{11})/) || [])[1] || (/^[\w-]{11}$/.test(s) ? s : null);
  if (!list && !v && /^(PL|OL|UU|LL|RD)[\w-]{10,}$/.test(s)) return { list: s };
  return list || v ? { list, v } : null;
}
function ytApi() {
  if (YT_ST.api) return YT_ST.api;
  return (YT_ST.api = new Promise((res, rej) => {
    if (window.YT && YT.Player) return res(YT);
    const prev = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { prev && prev(); res(YT); };
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.onerror = () => { YT_ST.api = null; rej(new Error('No se pudo cargar YouTube (¿sin internet?)')); }; document.head.appendChild(s);
    setTimeout(() => { if (!(window.YT && YT.Player)) { YT_ST.api = null; rej(new Error('YouTube no respondió')); } }, 15000);
  }));
}
// las dos "bandejas" de video, una para el tema que suena y otra para el que entra
function ytPlayers() {
  if (YT_ST.made) return YT_ST.made;
  return (YT_ST.made = ytApi().then(YT => Promise.all([0, 1].map(n => new Promise(res => {
    const p = new YT.Player('mpYt' + n, { width: '100%', height: '100%', playerVars: { playsinline: 1, rel: 0, modestbranding: 1, fs: 0, origin: location.protocol.startsWith('http') ? location.origin : undefined },
      events: { onReady: () => res(p), onStateChange: e => ytState(n, e.data), onError: e => ytError(n, e.data) } });
  })))).then(ps => { YT_ST.p = ps; return ps; }).catch(e => { YT_ST.made = null; throw e; }));
}
// a los 15 segundos de sonar, el video se esconde y queda la carátula; tocándola vuelve el video
function ytMinArm() {
  clearTimeout(YT_ST.minT); const el = MP.el; if (!el) return; el.classList.remove('ytmin');
  const c = el.querySelector('#mpTvCov'); if (c && !c.__on) { c.__on = 1; c.onclick = ytMinArm; }
  YT_ST.minT = setTimeout(() => { if (MP.kind !== 'yt' || !MP.playing) { YT_ST.minT = 0; return; } const img = el.querySelector('#mpTvCov img'); if (img) img.src = mpCover(MP.list[MP.i]); el.classList.add('ytmin'); }, 15000);
}
function ytState(n, s) {
  if (n !== YT_ST.cur || MP.kind !== 'yt') return;
  if (s === 1 && !YT_ST.minT) ytMinArm();
  if (s === 1) { // sonando: sin silencio, con el volumen del reproductor, y completa el título si faltaba
    const p = YT_ST.p[n]; try { if (p.isMuted && p.isMuted()) p.unMute(); if (!p.__iv) p.setVolume(ytVol()); } catch { }
    if (typeof mpYtMobile === 'function' && mpIsPhone() && !MP.st.open) mpYtMobile();
    const tr = MP.list[MP.i], d = p.getVideoData && p.getVideoData();
    if (tr && tr.yt && d && d.title && tr.t !== d.title) { tr.t = d.title; if (d.author) tr.g = d.author; mpSaveCustom(); mpUi(); }
  }
  if (s === 0 && MP.playing && !MP.going) mpNext('auto');
}
function ytError(n, code) {
  if (n !== YT_ST.cur) return;
  const msg = { 2: 'el link no es válido', 5: 'el video no se puede reproducir acá', 100: 'el video no existe o es privado', 101: 'el dueño no permite verlo fuera de YouTube', 150: 'el dueño no permite verlo fuera de YouTube', 152: 'YouTube no permite reproducir desde un archivo abierto en la PC', 153: 'YouTube no permite reproducir desde un archivo abierto en la PC' }[code] || 'error ' + code;
  toast('YouTube: ' + msg + (code >= 152 && location.protocol === 'file:' ? '. Abrí la versión web del editor para usar YouTube.' : '. Paso al siguiente.'), 7000);
  if (++YT_ST.err < 4 && !(code >= 152 && location.protocol === 'file:')) setTimeout(() => mpNext('auto'), 800); else { MP.playing = false; mpUi(); }
}
// sube o baja el volumen de un video de a poco (0 a 100)
function ytRamp(p, to, dur) {
  clearInterval(p.__iv); let from; try { from = p.getVolume(); } catch { from = 0; }
  if (dur <= .05) { try { p.setVolume(to); } catch { } return; }
  const t0 = performance.now();
  p.__iv = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / (dur * 1000)), v = from + (to - from) * (to > from ? Math.sin(k * Math.PI / 2) : 1 - Math.cos(k * Math.PI / 2)); try { p.setVolume(Math.round(v)); } catch { } if (k >= 1) { clearInterval(p.__iv); p.__iv = 0; } }, 50);
}
const ytVol = () => Math.round((MP.st.mute ? 0 : MP.st.vol) * 100);
function ytShow(n) {
  const el = MP.el; if (!el) return; el.classList.toggle('yt', MP.kind === 'yt'); mpTvPlace();
  clearTimeout(YT_ST.minT); YT_ST.minT = 0; el.classList.remove('ytmin'); // cada video nuevo se ve de nuevo 15 segundos
  el.querySelectorAll('.mptvp').forEach(w => w.classList.toggle('on', +w.dataset.n === n));
}
function ytTick() {
  clearInterval(YT_ST.poll);
  YT_ST.poll = setInterval(() => {
    if (MP.kind !== 'yt') { clearInterval(YT_ST.poll); return; }
    mpUiTime();
    const p = YT_ST.p[YT_ST.cur]; if (!p || !MP.playing || MP.trans || MP.going) return;
    let t = 0, d = 0; try { t = p.getCurrentTime(); d = p.getDuration(); } catch { }
    if (MP.st.repeat === 'one') { if (d && d - t < .6) p.seekTo(0, true); return; }
    const D = MP.st.mode === 'corte' ? .3 : MP.st.fade;
    if (d > 5 && d - t <= D + .4 && MP.list.length > 1) mpNext('auto');
  }, 400);
}
// pase entre dos temas cuando alguno es de YouTube (fundido de volumen; con canciones propias del otro lado, el audio se funde igual)
async function mpGoYt(i, tr, why) {
  const outYt = MP.kind === 'yt', inYt = !!tr.yt, wasPlaying = MP.playing;
  const D = !wasPlaying ? .6 : MP.st.mode === 'corte' ? .3 : why === 'auto' ? MP.st.fade : Math.min(MP.st.fade, 3.5);
  let ps = null;
  if (inYt) { try { ps = await ytPlayers(); } catch (e) { toast(e.message, 6000); return; } }
  mpFinish();
  // Todo YouTube suena en UN solo reproductor (el que activaste con tu clic): así el navegador no lo silencia
  // y el volumen se mantiene entre temas. Entre dos videos el pase es: baja → cambia → sube.
  const p0 = ps ? ps[0] : YT_ST.p[0];
  if (wasPlaying && !(outYt && inYt)) {
    if (outYt) { ytRamp(p0, 0, D); setTimeout(() => { if (MP.kind !== 'yt') try { p0.pauseVideo(); } catch { } }, D * 1000 + 100); }
    else { const od = MP.decks[MP.cur]; mpLevel(od, 0, D); setTimeout(() => { if (MP.kind === 'yt' || MP.decks[MP.cur] !== od) od.a.pause(); }, D * 1000 + 100); }
  }
  if (inYt) {
    const half = outYt && wasPlaying ? D / 2 : 0;
    const start = () => { try { p0.unMute(); p0.setVolume(0); p0.loadVideoById({ videoId: tr.yt }); p0.unMute(); } catch { } ytRamp(p0, ytVol(), outYt && wasPlaying ? D / 2 : D); };
    YT_ST.cur = 0; YT_ST.err = 0; MP.kind = 'yt'; ytShow(0); ytTick();
    if (half) { ytRamp(p0, 0, half); setTimeout(start, half * 1000); } else start();
    if (MP.ctx) mpMaster(mpVolTarget(), .2);
  } else {
    const inD = MP.decks[1 - MP.cur]; let src; try { src = await mpSrc(tr); } catch { return; }
    inD.a.loop = false; inD.a.src = src; inD.a.currentTime = 0;
    if (!await mpWake()) { mpArm(); return; }
    try { await inD.a.play(); } catch { mpArm(); return; }
    MP.cur = 1 - MP.cur; MP.kind = 'audio'; mpFilter(inD, 'allpass', 1000, 1000, 0); mpLevel(inD, 1, D); mpMaster(mpVolTarget(), .3); ytShow(-1);
  }
  MP.playing = true; MP.st.on = true; MP.i = i; MP.st.last = tr.k; mpSave();
  MP.trans = setTimeout(() => { MP.trans = null; }, D * 1000 + 150);
  mpUi();
}
// agregar una lista o un video
async function mpYtAdd(url) {
  const r = mpYtParse(url); if (!r) { toast('No reconozco ese link de YouTube. Pegá el de una lista (con "list=") o el de un video.', 6000); return; }
  const note = MP.el && MP.el.querySelector('#mpYtNote'); const say = t => { if (note) note.textContent = t; };
  say('Conectando con YouTube…');
  let ps; try { ps = await ytPlayers(); } catch (e) { say(e.message); return; }
  let ids = r.v ? [r.v] : [];
  if (r.list) {
    say('Leyendo la lista…');
    const p = ps[1];
    ids = await new Promise(res => {
      let done = false; const fin = v => { if (!done) { done = true; res(v); } };
      const chk = setInterval(() => { try { const l = p.getPlaylist(); if (l && l.length) { clearInterval(chk); fin(l); } } catch { } }, 300);
      try { p.cuePlaylist({ listType: 'playlist', list: r.list, index: 0 }); } catch { }
      setTimeout(() => { clearInterval(chk); fin(ids); }, 12000);
    });
  }
  if (!ids.length) { say('No pude leer esa lista. Revisá que sea pública o no listada.'); return; }
  const have = new Set(MP.custom.filter(t => t.yt).map(t => t.yt)); let n = 0;
  for (const id of ids) { if (have.has(id)) continue; MP.custom.push({ k: 'yt:' + id, yt: id, t: 'Video de YouTube', g: 'YouTube', y: '', cover: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, pl: r.list || '' }); n++; }
  say(n ? `Agregué ${n} ${n === 1 ? 'video' : 'videos'}. Buscando los títulos…` : 'Esos videos ya estaban en la lista.');
  mpBuildList(); mpSaveCustom(); mpRenderList();
  { const k = MP.list.findIndex(t => t.yt === ids[0]); if (k >= 0) { MP.st.on = true; mpGo(k); } }
  // títulos (YouTube los da por oEmbed; si no responde, se completan al sonar cada video)
  let got = 0; for (const t of MP.custom.filter(t => t.yt && t.t === 'Video de YouTube').slice(0, 60)) {
    try { const j = await (await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + t.yt))).json(); if (j.title) { t.t = j.title; t.g = j.author_name || 'YouTube'; got++; } } catch { break; }
  }
  if (got) { mpSaveCustom(); mpRenderList(); mpUi(); } say(n ? `Listo: ${n} ${n === 1 ? 'video agregado' : 'videos agregados'}.` : '');
}
async function mpSaveCustom() { try { await idbSet('musicCustom', MP.custom); } catch { } }
