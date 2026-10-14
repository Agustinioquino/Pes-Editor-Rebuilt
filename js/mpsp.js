// ===================== Reproductor: temas de Spotify =====================
// Spotify no deja sacar su audio: los temas suenan en su propia ventanita (la de "embed", como en cualquier página)
// en el mismo lugar que los videos de YouTube. Con tu cuenta Premium iniciada en el navegador suenan completos;
// sin cuenta o con cuenta gratis, Spotify da 30 segundos de cada tema.
// Spotify no permite cambiarle el volumen desde afuera ni mezclar: el pase con un tema de Spotify es siempre un corte.
const SP_ST = { api: null, ctl: null, made: null, pos: 0, dur: 0, paused: true, played: false, nearEnd: false, err: 0 };
// open.spotify.com/intl-es/track/ID?si=…, spotify:track:ID, o spotify.link (este último hay que abrirlo en el navegador primero)
function spParse(s) {
  s = (s || '').trim(); if (!s) return null;
  const m = s.match(/open\.spotify\.com\/(?:intl-[\w-]+\/)?(?:embed\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]{22})/) || s.match(/^spotify:(track|album|playlist|episode|show|artist):([A-Za-z0-9]{22})$/);
  return m ? { type: m[1], id: m[2], uri: `spotify:${m[1]}:${m[2]}`, url: `https://open.spotify.com/${m[1]}/${m[2]}` } : null;
}
function spApi() {
  if (SP_ST.api) return SP_ST.api;
  return (SP_ST.api = new Promise((res, rej) => {
    if (window.__spIframe) return res(window.__spIframe);
    const prev = window.onSpotifyIframeApiReady; window.onSpotifyIframeApiReady = api => { prev && prev(api); window.__spIframe = api; res(api); };
    const s = document.createElement('script'); s.src = 'https://open.spotify.com/embed/iframe-api/v1'; s.async = true;
    s.onerror = () => { SP_ST.api = null; rej(new Error('No se pudo cargar Spotify (¿sin internet?)')); }; document.head.appendChild(s);
    setTimeout(() => { if (!window.__spIframe) { SP_ST.api = null; rej(new Error('Spotify no respondió')); } }, 15000);
  }));
}
function spController(uri) {
  if (SP_ST.made) return SP_ST.made;
  return (SP_ST.made = spApi().then(api => new Promise(res => {
    const host = MP.el && MP.el.querySelector('#mpSp'); if (!host) throw new Error('Falta el reproductor');
    host.innerHTML = '<div></div>';
    api.createController(host.firstChild, { uri, width: '100%', height: '100%', theme: 'dark' }, ctl => {
      SP_ST.ctl = ctl;
      ctl.addListener('playback_update', e => spUpdate(e.data || {}));
      res(ctl);
    });
  })).catch(e => { SP_ST.made = null; throw e; }));
}
function spUpdate(d) {
  if (MP.kind !== 'sp') return;
  SP_ST.pos = (d.position || 0) / 1000; SP_ST.dur = (d.duration || 0) / 1000; SP_ST.paused = !!d.isPaused;
  if (!d.isPaused && SP_ST.pos > 0) SP_ST.played = true;
  mpUiTime();
  const tr = MP.list[MP.i]; if (!tr || !tr.sp || !MP.playing || MP.going || !SP_ST.played) return;
  const left = SP_ST.dur - SP_ST.pos;
  if (SP_ST.dur > 5 && left <= 1.2) SP_ST.nearEnd = true;
  // un tema suelto terminó; una lista o un disco sigue sola dentro de Spotify y termina cuando vuelve al principio parada
  const one = tr.spType === 'track' || tr.spType === 'episode';
  const ended = one ? SP_ST.nearEnd && (d.isPaused || left <= .4) : SP_ST.nearEnd && d.isPaused && SP_ST.pos === 0;
  if (!ended) return;
  SP_ST.nearEnd = false; SP_ST.played = false;
  if (MP.st.repeat === 'one') { try { SP_ST.ctl.seek(0); SP_ST.ctl.resume(); } catch { } return; }
  if (MP.list.length > 1) mpNext('auto'); else { MP.playing = false; mpUi(); }
}
// ¿la ventanita de Spotify está a la vista? (comparte el lugar con el video de YouTube)
function spShow(on) {
  const el = MP.el; if (!el) return;
  el.classList.toggle('sp', !!on); el.classList.toggle('yt', !!on || MP.kind === 'yt'); mpTvPlace();
  if (on) {
    YT_ST.shownAt = 0; if (!MP.st.ytHide) el.classList.remove('ytmin'); else ytMinOn();
    const c = el.querySelector('#mpTvCov'); if (c && !c.__on) { c.__on = 1; c.onclick = ytMinOff; }
    const x = el.querySelector('#mpTvX'); if (x && !x.__on) { x.__on = 1; x.onclick = ytHideAll; }
    el.querySelectorAll('.mptvp').forEach(w => w.classList.toggle('on', w.dataset.n === 'sp'));
  } else { const w = el.querySelector('.mptvp[data-n="sp"]'); if (w) w.classList.remove('on'); }
}
// deja de sonar Spotify (al pasar a una canción propia o a YouTube)
function spHalt() { try { SP_ST.ctl && SP_ST.ctl.pause(); } catch { } SP_ST.played = false; SP_ST.nearEnd = false; spShow(false); }
async function mpGoSp(i, tr) {
  let ctl; try { ctl = await spController(tr.sp); } catch (e) { toast(e.message, 6000); return; }
  mpFinish();
  // lo que sonaba baja rápido y se pausa (Spotify no deja fundir su volumen)
  if (MP.kind === 'yt') { const p = YT_ST.p[YT_ST.cur]; if (p) { ytRamp(p, 0, .4); setTimeout(() => { if (MP.kind !== 'yt') try { p.pauseVideo(); } catch { } }, 450); } ytStopTick(); }
  else if (MP.kind === 'audio') { const od = MP.decks[MP.cur]; mpLevel(od, 0, .4); setTimeout(() => { if (MP.kind !== 'audio' || MP.decks[MP.cur] !== od) od.a.pause(); }, 450); }
  MP.kind = 'sp'; SP_ST.pos = SP_ST.dur = 0; SP_ST.played = false; SP_ST.nearEnd = false;
  spShow(true);
  try { ctl.loadUri(tr.sp); ctl.play(); } catch { }
  MP.playing = true; MP.st.on = true; MP.i = i; MP.st.last = tr.k; mpSave(); mpUi();
}
function ytStopTick() { clearInterval(YT_ST.poll); }
const spPlay = () => { try { SP_ST.ctl.resume(); } catch { } };
const spPause = () => { try { SP_ST.ctl.pause(); } catch { } };
const spSeek = s => { try { SP_ST.ctl.seek(s); } catch { } };

// ---- agregar por link ----
async function spOembed(url) {
  try { const j = await (await fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(url))).json(); return j && j.title ? j : null; } catch { return null; }
}
const SP_KIND = { track: 'Tema', album: 'Disco', playlist: 'Lista', episode: 'Episodio', show: 'Podcast', artist: 'Artista' };
function spItem(r, o = {}) {
  return { k: 'sp:' + r.type + ':' + r.id, sp: r.uri, spType: r.type, t: o.t || (SP_KIND[r.type] || 'Tema') + ' de Spotify', g: o.g || 'Spotify', y: o.y || '', cover: o.cover || '' };
}
async function mpSpAdd(s, note) {
  const r = spParse(s), say = t => { if (note) note.textContent = t; };
  if (!r) { if (/spotify\.link|spoti\.fi/.test(s)) say('Ese es un link corto de Spotify: abrilo en el navegador y copiá el link largo (open.spotify.com/…).'); else say('No reconozco ese link de Spotify.'); return 0; }
  say('Buscando el nombre en Spotify…');
  const j = await spOembed(r.url); // listas y discos van enteros en la ventanita de Spotify (no hace falta cuenta)
  return mpAddItems([spItem(r, j ? { t: j.title, cover: j.thumbnail_url, g: r.type === 'track' ? 'Spotify' : SP_KIND[r.type] + ' · Spotify' } : {})], say);
}
// suma temas a la lista (sin repetir) y arranca el primero
function mpAddItems(items, say = () => { }) {
  const have = new Set(MP.custom.map(t => t.k)); let n = 0;
  for (const it of items) { if (have.has(it.k)) continue; MP.custom.push(it); have.add(it.k); n++; }
  say(n ? `Agregué ${n} ${n === 1 ? 'tema' : 'temas'} a la lista.` : 'Eso ya estaba en la lista.');
  mpBuildList(); mpSaveCustom(); mpRenderList();
  const k = MP.list.findIndex(t => t.k === items[0].k); if (k >= 0) { MP.st.on = true; mpGo(k); }
  return n;
}
