// ===================== Reproductor: buscador de música =====================
// Un solo cuadro para todo: si pegás un link (de YouTube o de Spotify) se agrega directo; si escribís un nombre,
// se busca en la fuente elegida (YouTube o Spotify) y tocás el resultado para sumarlo a la lista.
//  · YouTube en la app para Windows: busca sin nada más (la app lee la página de resultados de YouTube).
//  · YouTube en la web: el navegador no deja leer YouTube desde otra página, así que hace falta una clave gratuita
//    de la API de YouTube (se pega una vez en "Claves"). Sin clave, el botón abre la búsqueda en YouTube.
//  · Spotify: hace falta conectar tu cuenta (ver js/mpsp.js).
const MF = { src: 'yt', res: [], busy: 0 };
try { const s = localStorage.getItem('edit21-msrc'); if (s === 'yt' || s === 'sp') MF.src = s; } catch { }
const mfYtKey = () => { try { return (localStorage.getItem('edit21-ytkey') || '').trim(); } catch { return ''; } };
const mfCanYt = () => !!(window.pesNative && pesNative.ytSearch) || !!mfYtKey();
const mfIsLink = s => /^(https?:\/\/|spotify:|www\.|m\.youtube|youtu\.?be|open\.spotify)/i.test(s.trim());

// ---- YouTube ----
const mfIso = s => { const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(s || ''); return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0; };
const mfHtml = s => { const d = document.createElement('textarea'); d.innerHTML = s || ''; return d.value; };
async function mfYtSearch(q) {
  if (window.pesNative && pesNative.ytSearch) {
    const r = await pesNative.ytSearch(q); if (!r || !r.ok) throw new Error((r && r.msg) || 'YouTube no respondió');
    return r.v.map(v => ({ kind: 'yt', id: v.id, t: v.t, g: v.g, dur: v.dur, img: `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg` }));
  }
  const key = mfYtKey(); if (!key) throw Object.assign(new Error('Para buscar en YouTube desde la web hace falta una clave gratuita de YouTube (en "Claves para buscar"). En la app para Windows busca sin clave.'), { code: 'KEY' });
  const r = await fetch('https://www.googleapis.com/youtube/v3/search?' + new URLSearchParams({ part: 'snippet', type: 'video', maxResults: '15', videoEmbeddable: 'true', q, key }));
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const why = (j.error && j.error.errors && j.error.errors[0] && j.error.errors[0].reason) || ''; throw new Error(why === 'quotaExceeded' ? 'Se terminaron las búsquedas de YouTube de hoy con esa clave (son unas 100 por día). Mañana vuelven.' : /keyInvalid|badRequest/.test(why) || r.status === 400 ? 'La clave de YouTube no es válida. Revisala en "Claves para buscar".' : 'YouTube respondió ' + r.status + (why ? ' (' + why + ')' : '')); }
  const out = (j.items || []).filter(x => x.id && x.id.videoId).map(x => ({ kind: 'yt', id: x.id.videoId, t: mfHtml(x.snippet.title), g: mfHtml(x.snippet.channelTitle), img: (x.snippet.thumbnails.medium || x.snippet.thumbnails.default || {}).url }));
  // la duración viene aparte (1 punto de cuota contra los 100 de la búsqueda)
  try { const d = await (await fetch('https://www.googleapis.com/youtube/v3/videos?' + new URLSearchParams({ part: 'contentDetails', id: out.map(v => v.id).join(','), key }))).json(); const m = new Map((d.items || []).map(v => [v.id, mfIso(v.contentDetails.duration)])); out.forEach(v => { v.dur = m.get(v.id) || 0; }); } catch { }
  return out;
}

// ---- panel ----
function mfHtmlPanel() {
  return `<div class="mpfind" id="mpYtF" hidden>
    <div class="seg mpsrc" id="mpSrc" role="group" aria-label="Dónde buscar"><button type="button" data-v="yt"><span class="mfdot yt" aria-hidden="true"></span>YouTube</button><button type="button" data-v="sp"><span class="mfdot sp" aria-hidden="true"></span>Spotify</button></div>
    <div class="mfq"><input type="search" id="mpYtU" autocomplete="off" enterkeyhint="search" aria-label="Buscar música o pegar un link"><button type="button" class="btn small primary" id="mpYtGo">Buscar</button></div>
    <p class="mpnote" id="mpYtNote"></p>
    <ol class="mpres" id="mpRes" aria-live="polite"></ol>
    <details class="mfkeys" id="mfKeys"><summary>Claves para buscar</summary><div class="mfkbody" id="mfKBody"></div></details>
  </div>`;
}
function mfBind(el) {
  const $m = id => el.querySelector('#' + id);
  $m('mpSrc').onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; MF.src = b.dataset.v; try { localStorage.setItem('edit21-msrc', MF.src); } catch { } MF.res = []; mfUi(); mfRes(); $m('mpYtU').focus(); };
  $m('mpYtGo').onclick = () => mfGo($m('mpYtU').value);
  $m('mpYtU').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); mfGo(e.target.value); } };
  $m('mpYtU').addEventListener('paste', () => setTimeout(() => { const v = $m('mpYtU').value; if (mfIsLink(v)) mfGo(v); }, 0));
  $m('mpRes').onclick = e => { const b = e.target.closest('[data-r]'); if (b) mfPick(+b.dataset.r, b); };
  $m('mfKeys').addEventListener('toggle', () => { if ($m('mfKeys').open) mfKeys(); });
  mfUi();
}
function mfUi() {
  const el = MP.el; if (!el) return;
  el.querySelectorAll('#mpSrc [data-v]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === MF.src)));
  const inp = el.querySelector('#mpYtU'); inp.placeholder = MF.src === 'yt' ? 'Buscá en YouTube o pegá un link' : 'Buscá en Spotify o pegá un link';
  const n = el.querySelector('#mpYtNote');
  if (MF.busy) return;
  n.textContent = MF.src === 'yt'
    ? (mfCanYt() ? 'Los videos se ven chiquitos arriba del reproductor (YouTube no permite ocultarlos ni sacarles el audio).' : 'Pegá el link de un video o una lista de YouTube. Para buscar por nombre desde la web, agregá tu clave de YouTube en "Claves para buscar" (en la app para Windows no hace falta).')
    : (spToken() ? 'Con Spotify Premium iniciado en este navegador los temas suenan completos; si no, Spotify da 30 segundos de cada uno.' : 'Pegá el link de un tema, disco o lista de Spotify. Para buscar por nombre, conectá tu cuenta en "Claves para buscar".');
}
async function mfGo(q) {
  q = (q || '').trim(); const el = MP.el; if (!q || !el) return;
  const note = el.querySelector('#mpYtNote'), say = t => { note.textContent = t; };
  if (mfIsLink(q)) {
    MF.busy++; try { if (spParse(q) || /spotify/i.test(q)) await mpSpAdd(q, note); else await mpYtAdd(q); } finally { MF.busy--; }
    el.querySelector('#mpYtU').value = ''; return;
  }
  MF.busy++; say(MF.src === 'yt' ? 'Buscando en YouTube…' : 'Buscando en Spotify…'); MF.res = []; mfRes(true);
  try { MF.res = MF.src === 'yt' ? await mfYtSearch(q) : await spSearch(q); say(MF.res.length ? 'Tocá un resultado para sumarlo a la lista.' : 'No encontré nada con ese nombre.'); }
  catch (e) {
    say(e.message);
    if (e.code === 'KEY') MF.res = [{ kind: 'open', t: 'Buscar "' + q + '" en YouTube', g: 'Se abre en otra pestaña: copiá el link del video y pegalo acá', url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q) }];
    if (e.code === 'LOGIN') { const k = el.querySelector('#mfKeys'); k.open = true; mfKeys(); }
  }
  finally { MF.busy--; mfRes(); }
}
function mfRes(loading) {
  const ol = MP.el && MP.el.querySelector('#mpRes'); if (!ol) return;
  if (loading) { ol.innerHTML = '<li class="mfload"><i></i><i></i><i></i></li>'; return; }
  const have = new Set(MP.custom.map(t => t.k));
  const kk = r => r.kind === 'yt' ? 'yt:' + r.id : 'sp:' + r.kind + ':' + r.id;
  const tag = r => ({ album: 'Disco', playlist: 'Lista' })[r.kind] || '';
  ol.innerHTML = MF.res.map((r, i) => r.kind === 'open'
    ? `<li><a class="mfr" href="${esc(r.url)}" target="_blank" rel="noopener"><span class="mfimg yt" aria-hidden="true">▶</span><span><b>${esc(r.t)}</b><small>${esc(r.g)}</small></span><span class="mfadd" aria-hidden="true">↗</span></a></li>`
    : `<li><button type="button" class="mfr${have.has(kk(r)) ? ' in' : ''}" data-r="${i}">${r.img ? `<img src="${esc(r.img)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'mfimg ${r.kind === 'yt' ? 'yt' : 'sp'}',textContent:'♪'}))">` : `<span class="mfimg ${r.kind === 'yt' ? 'yt' : 'sp'}" aria-hidden="true">♪</span>`}<span><b>${esc(r.t)}</b><small>${tag(r) ? `<em>${tag(r)}</em> ` : ''}${esc(r.g || '')}${r.y ? ' · ' + r.y : ''}${r.dur ? ' · ' + mpTime(r.dur) : ''}${r.n ? ' · ' + r.n + ' temas' : ''}</small></span><span class="mfadd" aria-hidden="true">${have.has(kk(r)) ? '✓' : '＋'}</span></button></li>`).join('');
}
async function mfPick(i, btn) {
  const r = MF.res[i]; if (!r) return; const note = MP.el.querySelector('#mpYtNote'), say = t => { note.textContent = t; };
  if (btn) btn.classList.add('in');
  if (r.kind === 'yt') { mpAddItems([{ k: 'yt:' + r.id, yt: r.id, t: r.t, g: r.g || 'YouTube', y: '', cover: `https://i.ytimg.com/vi/${r.id}/hqdefault.jpg` }], say); }
  else {
    const ref = { type: r.kind, id: r.id, uri: `spotify:${r.kind}:${r.id}` };
    let items = r.kind === 'track' ? null : await spExpand(ref).catch(() => null);
    if (!items) items = [spItem(ref, { t: r.t, g: r.kind === 'track' ? r.g : (r.kind === 'album' ? 'Disco' : 'Lista') + ' · ' + (r.g || 'Spotify'), y: r.y, cover: r.img })];
    mpAddItems(items, say);
  }
  mfRes();
}
// ---- claves ----
function mfKeys() {
  const b = MP.el && MP.el.querySelector('#mfKBody'); if (!b) return;
  const c = spCfg(), native = !!(window.pesNative && pesNative.ytSearch);
  b.innerHTML = `<div class="mfk"><b><span class="mfdot yt" aria-hidden="true"></span>YouTube</b>
      ${native ? '<p class="mpnote">En la app para Windows se busca sin clave.</p>' : ''}
      <label for="mfYtKey">Clave de la API de YouTube ${native ? '(opcional)' : ''}</label><input type="text" id="mfYtKey" autocomplete="off" spellcheck="false" value="${esc(mfYtKey())}" placeholder="AIza…">
      <p class="mpnote">Es gratis: en <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noopener">Google Cloud</a> activá "YouTube Data API v3" y creá una clave en Credenciales. Alcanza para unas 100 búsquedas por día. Queda guardada solo en este navegador.</p></div>
    <div class="mfk"><b><span class="mfdot sp" aria-hidden="true"></span>Spotify</b>
      ${spToken() ? `<p class="mpnote">Cuenta conectada.</p><button type="button" class="btn small ghost" id="mfSpOut">Desconectar</button>` : `
      <label for="mfSpId">Client ID de tu app de Spotify</label><input type="text" id="mfSpId" autocomplete="off" spellcheck="false" value="${esc(c.client || '')}" placeholder="32 letras y números">
      <p class="mpnote">En <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener">developer.spotify.com</a> creá una app (marcá "Web API") y en "Redirect URIs" agregá esta dirección:</p>
      <div class="mfcopy"><code id="mfRedir">${esc(spRedirect())}</code><button type="button" class="btn small ghost" id="mfCopy">Copiar</button></div>
      <button type="button" class="btn small primary" id="mfSpIn">Conectar con Spotify</button>`}</div>`;
  const $k = id => b.querySelector('#' + id);
  $k('mfYtKey').onchange = e => { try { localStorage.setItem('edit21-ytkey', e.target.value.trim()); } catch { } mfUi(); toast(e.target.value.trim() ? 'Clave de YouTube guardada.' : 'Clave de YouTube borrada.'); };
  if ($k('mfSpId')) $k('mfSpId').onchange = e => spCfgSet({ client: e.target.value.trim() });
  if ($k('mfCopy')) $k('mfCopy').onclick = () => { navigator.clipboard.writeText(spRedirect()).then(() => toast('Dirección copiada.'), () => { }); };
  if ($k('mfSpIn')) $k('mfSpIn').onclick = async () => { spCfgSet({ client: $k('mfSpId').value.trim() }); if (await spConnect()) { mfKeys(); mfUi(); } };
  if ($k('mfSpOut')) $k('mfSpOut').onclick = () => { spDisconnect(); mfKeys(); mfUi(); };
}
