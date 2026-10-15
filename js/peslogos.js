// ===================== Escudos de PES Logos (peslogos.blogspot.com) =====================
// PES Logos es un blog de Blogger con miles de escudos en PNG (512, 256 y 128 px). Blogger publica cada blog como un
// feed JSON público con búsqueda (?q=), así que el editor busca ahí sin claves ni cuentas, muestra los resultados y,
// al elegir uno, baja el PNG más grande y lo pasa al creador de escudos como si lo hubieras soltado vos.
// Siempre se muestra de dónde sale cada escudo, con el enlace a su página en PES Logos.
const PL_BLOG = 'https://peslogos.blogspot.com', PL_MAX = 24;
const PL = { team: null, open: false, q: '', busy: false, err: '', res: null, total: 0, got: null };

// los nombres del juego vienen como "C.A. ROSARIO CENTRAL": la búsqueda funciona mejor sin siglas sueltas
function plQuery(t) {
  const n = String(tget(t, 'name') || '').replace(/[._]/g, ' ').split(/\s+/).filter(w => w.length > 2 || /\d/.test(w));
  return (n.join(' ') || String(tget(t, 'name') || '')).trim().toLowerCase().replace(/(^|\s)\S/g, s => s.toUpperCase());
}
// las imágenes de Blogger llevan el tamaño en la dirección (/s512/, /w1600-h900/ o =s512): s0 es el archivo original
const plSize = (u, s) => u.replace(/\/(s\d+(-c)?|w\d+(-h\d+)?(-[a-z]+)*|d)\/(?=[^/]*$)/, `/${s}/`).replace(/=(s|w)\d+[^/]*$/, '=' + s);
const plImgHost = u => /^https:\/\/([\w-]+\.)?(googleusercontent\.com|bp\.blogspot\.com|blogspot\.com|ibb\.co)\//.test(u);
function plEntry(e) {
  const alt = (e.link || []).find(l => l.rel === 'alternate'), html = (e.content || e.summary || {}).$t || '';
  const urls = [...html.matchAll(/(?:href|src)="(https:[^"]+?\.(?:png|webp|jpe?g)[^"]*)"/gi)].map(m => m[1].replace(/&amp;/g, '&')).filter(plImgHost);
  // el primero de cada post es el escudo en su tamaño más grande; los que terminan en 256x/128x son copias chicas
  const main = urls.find(u => !/(256|128)x\.(png|webp|jpe?g)/i.test(decodeURIComponent(u))) || urls[0];
  const th = (e.media$thumbnail || {}).url;
  return main && {
    title: (e.title || {}).$t || 'Escudo', link: alt ? alt.href : PL_BLOG, img: main,
    thumb: th ? plSize(th, 's160') : plSize(main, 's160'), tags: (e.category || []).map(c => c.term),
    year: ((e.published || {}).$t || '').slice(0, 4)
  };
}
// el feed se pide directo; si el navegador no lo deja leer desde otro sitio, se usa la variante "json-in-script" de Blogger
function plJsonp(url) {
  return new Promise((res, rej) => {
    const cb = 'plcb' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), s = document.createElement('script');
    const end = () => { clearTimeout(to); delete window[cb]; s.remove(); }, to = setTimeout(() => { end(); rej(new Error('PES Logos no respondió')); }, 15000);
    window[cb] = d => { end(); res(d); };
    s.onerror = () => { end(); rej(new Error('No se pudo conectar con PES Logos')); };
    s.src = url.replace('alt=json', 'alt=json-in-script') + '&callback=' + cb; document.head.appendChild(s);
  });
}
async function plFeed(q, start = 1) {
  const url = `${PL_BLOG}/feeds/posts/default?alt=json&max-results=${PL_MAX}&start-index=${start}&q=${encodeURIComponent(q)}`;
  let d; try { const r = await fetch(url, { credentials: 'omit' }); if (!r.ok) throw new Error(r.status); d = await r.json(); } catch { d = await plJsonp(url); }
  const f = d && d.feed || {};
  return { list: (f.entry || []).map(plEntry).filter(Boolean), total: +((f.openSearch$totalResults || {}).$t || 0) };
}
// el PNG original; si el navegador no deja leerlo desde otro sitio, se pide a través de images.weserv.nl (que solo lo reenvía)
async function plDownload(u) {
  const tries = [plSize(u, 's0'), u, 'https://images.weserv.nl/?url=' + encodeURIComponent(plSize(u, 's0').replace(/^https:\/\//, '')) + '&output=png'];
  for (const x of tries) {
    try { const r = await fetch(x, { mode: 'cors', credentials: 'omit' }); if (!r.ok) continue; const b = await r.blob(); if (b.size && /^image\//.test(b.type || 'image/png')) return b; } catch { }
  }
  throw new Error('No se pudo bajar la imagen. Abrila en PES Logos, guardala y soltala en el recuadro "Nuevo".');
}
async function plSearch(t, more) {
  const q = PL.q.trim(); if (!q || PL.busy) return;
  PL.busy = true; PL.err = ''; if (!more) PL.res = null; crestPaint(t);
  try { const r = await plFeed(q, more ? PL.res.length + 1 : 1); PL.res = (more ? PL.res : []).concat(r.list); PL.total = r.total; }
  catch (e) { PL.err = e.message; }
  PL.busy = false; crestPaint(t);
}
async function plUse(t, i) {
  const it = PL.res && PL.res[i]; if (!it || PL.busy) return;
  PL.busy = true; PL.err = ''; crestPaint(t);
  try {
    const b = await plDownload(it.img), name = it.title.replace(/[\\/:*?"<>|]+/g, ' ').trim() + '.png';
    await crestFiles(t, [new File([b], name, { type: b.type || 'image/png' })]);
    PL.got = it; if (!CR.err) { PL.open = false; toast('Escudo de PES Logos cargado. Revisalo y tocá Guardar.'); }
  } catch (e) { PL.err = e.message; }
  PL.busy = false; crestPaint(t);
}
function plHtml(t) {
  if (PL.team !== t.id) Object.assign(PL, { team: t.id, open: false, q: plQuery(t), busy: false, err: '', res: null, total: 0, got: null });
  const credit = PL.got ? `<p class="note">Escudo nuevo: <a href="${esc(PL.got.link)}" target="_blank" rel="noopener">${esc(PL.got.title)}</a>, de <a href="${PL_BLOG}" target="_blank" rel="noopener">PES Logos</a>.</p>` : '';
  if (!PL.open) return credit;
  const res = PL.res ? (PL.res.length ? `<div class="plgrid">${PL.res.map((x, i) => `<button type="button" class="plitem" data-pl="${i}" ${PL.busy ? 'disabled' : ''} title="Usar este escudo">
      <span class="plimg"><img src="${esc(x.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer"></span><b>${esc(x.title)}</b>
      <small>${x.tags.filter(g => /^(Retro|Especiales|Disuelto|x\d\d)$/.test(g)).map(g => g[0] === 'x' ? '20' + g.slice(1) : g).join(' · ') || x.year}</small></button>`).join('')}</div>
      ${PL.res.length < PL.total ? `<button class="btn small ghost" type="button" id="plMore" ${PL.busy ? 'disabled' : ''}>Ver más (${PL.total - PL.res.length})</button>` : ''}`
    : `<p class="note">No encontré escudos con «${esc(PL.q)}». Probá con otro nombre (por ejemplo el nombre real del club, sin siglas).</p>`) : '';
  return `${credit}<div class="plbox" id="plBox">
    <div class="row"><input type="search" id="plQ" value="${esc(PL.q)}" placeholder="Nombre del club o selección" aria-label="Buscar en PES Logos" ${PL.busy ? 'disabled' : ''}>
      <button class="btn small primary" type="button" id="plGo" ${PL.busy ? 'disabled' : ''}>${PL.busy ? 'Buscando…' : 'Buscar'}</button></div>
    ${PL.err ? `<p class="note bad" role="alert">${esc(PL.err)}</p>` : ''}${res}
    <p class="note plsrc">Los escudos son de <a href="${PL_BLOG}" target="_blank" rel="noopener">PES Logos</a>. El editor los busca y los baja de ahí cuando elegís uno; no guarda copias propias.</p>
  </div>`;
}
function plBind(t) {
  const b = $('plOpen'); if (b) b.onclick = () => { PL.open = !PL.open; crestPaint(t); if (PL.open && !PL.res) plSearch(t); };
  const q = $('plQ'); if (!q) return;
  q.oninput = () => { PL.q = q.value; };
  q.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); plSearch(t); } };
  $('plGo').onclick = () => plSearch(t);
  const m = $('plMore'); if (m) m.onclick = () => plSearch(t, true);
  document.querySelectorAll('#plBox [data-pl]').forEach(x => x.onclick = () => plUse(t, +x.dataset.pl));
}
