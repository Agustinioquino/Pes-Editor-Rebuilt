// ===================== Reproductor: agregar música por link =====================
// Un solo cuadro, sin claves ni cuentas: pegás el link de un video o una lista de YouTube, o de un tema, disco o lista
// de Spotify, y se suma a la lista. Si escribís un nombre en vez de un link:
//  · en la app para Windows se busca en YouTube ahí mismo (la app lee la página de resultados) y tocás el resultado;
//  · en la web el navegador no deja leer YouTube ni Spotify desde otra página, así que se ofrecen las búsquedas de
//    YouTube y de Spotify en otra pestaña: copiás el link del que te guste y lo pegás acá.
const MF = { res: [], busy: 0 };
try { for (const k of ['edit21-msrc', 'edit21-ytkey', 'edit21-spotify', 'edit21-spotify-pkce', 'edit21-spotify-code']) localStorage.removeItem(k); } catch { } // restos de la versión con claves
const mfIsLink = s => /^(https?:\/\/|spotify:|www\.|m\.youtube|youtu\.?be|open\.spotify)/i.test((s || '').trim());
const mfNative = () => !!(window.pesNative && pesNative.ytSearch);

// ---- YouTube en la app (sin clave) ----
async function mfYtSearch(q) {
  const r = await pesNative.ytSearch(q); if (!r || !r.ok) throw new Error((r && r.msg) || 'YouTube no respondió');
  return r.v.map(v => ({ kind: 'yt', id: v.id, t: v.t, g: v.g, dur: v.dur, img: `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg` }));
}

// ---- panel ----
function mfHtmlPanel() {
  return `<div class="mpfind" id="mpYtF" hidden>
    <div class="mfq"><input type="search" id="mpYtU" autocomplete="off" enterkeyhint="go" aria-label="Link de YouTube o Spotify"><button type="button" class="btn small primary" id="mpYtGo">Agregar</button></div>
    <p class="mpnote" id="mpYtNote"></p>
    <ol class="mpres" id="mpRes" aria-live="polite"></ol>
  </div>`;
}
function mfBind(el) {
  const $m = id => el.querySelector('#' + id);
  $m('mpYtGo').onclick = () => mfGo($m('mpYtU').value);
  $m('mpYtU').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); mfGo(e.target.value); } };
  $m('mpYtU').oninput = () => mfUi(true);
  $m('mpYtU').addEventListener('paste', () => setTimeout(() => { const v = $m('mpYtU').value; if (mfIsLink(v)) mfGo(v); }, 0));
  $m('mpRes').onclick = e => { const b = e.target.closest('[data-r]'); if (b) mfPick(+b.dataset.r, b); };
  mfUi();
}
function mfUi(keepNote) {
  const el = MP.el; if (!el) return;
  const T = typeof tr === 'function' ? tr : x => x, inp = el.querySelector('#mpYtU'), go = el.querySelector('#mpYtGo'), n = el.querySelector('#mpYtNote');
  inp.placeholder = T(mfNative() ? 'Pegá un link de YouTube o Spotify, o escribí qué buscar' : 'Pegá un link de YouTube o Spotify');
  go.textContent = T(inp.value.trim() && !mfIsLink(inp.value) ? 'Buscar' : 'Agregar');
  if (MF.busy || keepNote) return;
  n.textContent = T(mfNative()
    ? 'Sirve el link de un video o una lista de YouTube, y el de un tema, disco o lista de Spotify. Si escribís un nombre, se busca en YouTube.'
    : 'Sirve el link de un video o una lista de YouTube, y el de un tema, disco o lista de Spotify. Si escribís un nombre, te abro la búsqueda para que copies el link.');
}
async function mfGo(q) {
  q = (q || '').trim(); const el = MP.el; if (!q || !el) return;
  const T = typeof tr === 'function' ? tr : x => x, note = el.querySelector('#mpYtNote'), say = t => { note.textContent = t; };
  if (mfIsLink(q)) {
    MF.busy++; try { if (spParse(q) || /spotify/i.test(q)) await mpSpAdd(q, note); else await mpYtAdd(q); } finally { MF.busy--; }
    el.querySelector('#mpYtU').value = ''; mfUi(true); return;
  }
  if (!mfNative()) { // web: la búsqueda se abre en otra pestaña
    const e = encodeURIComponent(q);
    MF.res = [{ kind: 'open', src: 'yt', t: T('Buscar en YouTube'), g: q, url: 'https://www.youtube.com/results?search_query=' + e },
      { kind: 'open', src: 'sp', t: T('Buscar en Spotify'), g: q, url: 'https://open.spotify.com/search/' + e }];
    say(T('Se abre en otra pestaña: copiá el link del que te guste (en Spotify: Compartir › Copiar link) y pegalo acá.')); mfRes(); return;
  }
  MF.busy++; say(T('Buscando en YouTube…')); MF.res = []; mfRes(true);
  try { MF.res = await mfYtSearch(q); say(T(MF.res.length ? 'Tocá un resultado para sumarlo a la lista.' : 'No encontré nada con ese nombre.')); }
  catch (e) { say(e.message); }
  finally { MF.busy--; mfRes(); }
}
function mfRes(loading) {
  const ol = MP.el && MP.el.querySelector('#mpRes'); if (!ol) return;
  if (loading) { ol.innerHTML = '<li class="mfload"><i></i><i></i><i></i></li>'; return; }
  const have = new Set(MP.custom.map(t => t.k));
  ol.innerHTML = MF.res.map((r, i) => r.kind === 'open'
    ? `<li><a class="mfr" href="${esc(r.url)}" target="_blank" rel="noopener"><span class="mfimg ${r.src === 'sp' ? 'sp' : 'yt'}" aria-hidden="true">${r.src === 'sp' ? '♪' : '▶'}</span><span><b>${esc(r.t)}</b><small>${esc(r.g)}</small></span><span class="mfadd" aria-hidden="true">↗</span></a></li>`
    : `<li><button type="button" class="mfr${have.has('yt:' + r.id) ? ' in' : ''}" data-r="${i}">${r.img ? `<img src="${esc(r.img)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'mfimg yt',textContent:'♪'}))">` : '<span class="mfimg yt" aria-hidden="true">♪</span>'}<span><b>${esc(r.t)}</b><small>${esc(r.g || '')}${r.dur ? ' · ' + mpTime(r.dur) : ''}</small></span><span class="mfadd" aria-hidden="true">${have.has('yt:' + r.id) ? '✓' : '＋'}</span></button></li>`).join('');
}
function mfPick(i, btn) {
  const r = MF.res[i]; if (!r || r.kind !== 'yt') return; const note = MP.el.querySelector('#mpYtNote'), say = t => { note.textContent = t; };
  if (btn) btn.classList.add('in');
  mpAddItems([{ k: 'yt:' + r.id, yt: r.id, t: r.t, g: r.g || 'YouTube', y: '', cover: `https://i.ytimg.com/vi/${r.id}/hqdefault.jpg` }], say);
  mfRes();
}
