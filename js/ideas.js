// ===================== Ideas: lo que piden los usuarios y lo que viene, con su avance =====================
// Una sola lista para la pestaña Ideas y para el cartel En desarrollo (devnote.js toma las que tienen dev: true).
// Con el orden por prioridad, dentro de cada prioridad van primero las que pidieron usuarios.
// k: 'listo' (ya está en el editor), 'beta' (está, en prueba), 'soon' (en camino), 'idea' (pensada, sin empezar).
// pct: cuánto avanzó (aproximado). pri: 'alta', 'media' o 'baja'. dif: 1 fácil, 2 media, 3 difícil.
// user: lo pidieron usuarios (Discord, WhatsApp, X). how: dónde está, para las que ya existen.
const IDEAS = [
  { k: 'soon', ic: '🏆', t: 'Editar jugadores en la Liga Master', p: 'Cambiar habilidades, edad, contrato o valor de los jugadores de una partida de Liga Master, como una tabla de trucos pero sin abrir otro programa. El editor ya abre y descifra el guardado de Liga Master (ML00000000); falta ubicar dónde guarda cada jugador y probarlo en el juego.', pct: 10, pri: 'alta', dif: 3, user: true },
  { k: 'soon', ic: '🔄', t: 'Pasar el EDIT a la base del juego y al revés', p: 'Convertir un option file (EDIT) en base de datos del juego (Player.bin, Team.bin…) para cargarla con Sider, y al revés. El editor ya lee la base del juego desde los .cpk y las carpetas de Sider; falta escribirla y armar el EDIT desde la base.', pct: 25, pri: 'alta', dif: 3, user: true },
  { k: 'listo', ic: '🛡️', t: 'Cambiar el escudo del equipo', p: 'Subir una imagen, buscar entre miles de escudos de PES Logos o retocarlo, y guardarlo en HD o 2K donde lo lee Sider.', how: 'Equipos → elegí el club → Datos y colores → Escudo.', pct: 100, pri: 'alta', dif: 2, user: true },
  { k: 'listo', ic: '🧤', t: 'Botines, guantes y ropa térmica', p: 'Elegir los botines y los guantes de cada jugador, la camiseta interior (térmica), las mangas, las calzas y el resto de la equipación.', how: 'Jugadores (o el plantel de un equipo) → tocá un jugador → Botines y guantes, y Equipación y accesorios.', pct: 100, pri: 'media', dif: 1, user: true },
  { k: 'beta', ic: '⚽', t: 'Football Life 2026', p: 'La base leída directo de los archivos del juego, las valoraciones con su tope de 104 y su EDIT en 2026\\save. Está en prueba: si algo no carga o una media no coincide, avisá.', pct: 85, pri: 'alta', dif: 2, dev: true },
  { k: 'beta', ic: '👕', t: 'Kit Studio Pro: cargar kits desde un .zip', p: 'Versión preliminar: arrastrar un .zip a Uniformes, elegir el puesto, reemplazar o agregar, y los kits que viven en los .cpk. Se probó poco con juegos reales y es probable que tenga fallos: hacé una copia de content\\kit-server antes y avisá si algo sale mal.', pct: 70, pri: 'media', dif: 2, dev: true },
  { k: 'beta', ic: '🧩', t: 'Pestaña Sider', p: "Qué carga tu juego y edición de sider.ini con interruptores. Está en prueba: si una carpeta o un módulo sale mal clasificado, o algo no se guarda, avisá.", pct: 85, pri: 'media', dif: 2, dev: true },
  { k: 'beta', ic: '💻', t: 'PES Editor Rebuilt para Windows', p: 'La app que conecta tu carpeta Sider aunque esté en Archivos de programa. Está en prueba: si algo no se guarda en el juego, avisá.', pct: 80, pri: 'alta', dif: 2, dev: true },
  { k: 'beta', ic: '⬡', t: 'Ficha hexagonal y media rápida', p: 'Cambiar la media y cada área de un jugador arrastrando el hexágono o desde el plantel. Está en prueba: si una media no queda como esperabas, avisá.', pct: 90, pri: 'media', dif: 1, dev: true },
  { k: 'beta', ic: '🗂', t: 'Tu trabajo en el caché', p: 'Al actualizar el editor, tus cambios sin guardar quedan en el navegador y vuelven solos. Está en prueba: guardá en el juego igual cuando termines.', pct: 90, pri: 'media', dif: 1, dev: true },
  { k: 'beta', ic: '📈', t: 'Valoración dinámica con datos reales', p: 'La forma de cada jugador ahora usa toda la temporada, los goleadores, las lesiones y el historial de ESPN. Está en prueba: si ves un dato raro, avisá.', pct: 85, pri: 'media', dif: 2, dev: true },
  { k: 'listo', ic: '🙋', t: 'Ficha de jugadores renovada', p: 'Nombre y apellido separados, equipo y selección con su escudo y dorsal, estrellas y actitud con color, las habilidades con barras, − y + y la explicación de cada una, y la vista FIFA con su carta y el sobre para abrir.', how: 'Jugadores → tocá un jugador.', pct: 100, pri: 'media', dif: 2 },
  { k: 'beta', ic: '🔤', t: 'Fuentes con minúsculas para KitPos', p: 'Crear la fuente del nombre de la camiseta con cualquier tipografía o con letras dibujadas en la plantilla de Photoshop, con minúsculas, tildes, Ñ, cirílico y griego, verla en el 3D e instalarla en el kit con un botón (textura .dds y .ftex y la tabla de letras de KitPos). Está en prueba: si una letra sale corrida o cortada en el juego, avisá.', how: 'Equipos → elegí el club → Kit Studio Pro → 🔤 Fuentes.', pct: 90, pri: 'media', dif: 2, dev: true },
  { k: 'listo', ic: '📏', t: 'Nombre y número de la camiseta como en el juego', p: 'En el Kit Studio Pro, agarrar el nombre y los números sobre el kit en 3D y moverlos con el mouse, con los mismos pasos que usa el juego o, con KitPos, al valor exacto.', how: 'Equipos → elegí el club → Kit Studio Pro → Editor → ✥ Ubicar.', pct: 100, pri: 'media', dif: 2 },
  { k: 'soon', ic: '📊', t: 'Importar y exportar en CSV', p: 'Pasar jugadores, planteles y equipos a una planilla (Excel, Google Sheets), editarlos ahí y volver a cargarlos en el editor. Hoy ya se puede exportar el plantel de un equipo.', pct: 20, pri: 'alta', dif: 2, dev: true },
  { k: 'soon', ic: '✨', t: 'Mejoras visuales para mayor comodidad', p: 'Pantallas más claras y cómodas: textos más fáciles de leer, botones más grandes donde se usan seguido y menos pasos para lo de todos los días.', pct: 15, pri: 'alta', dif: 1, dev: true },
  { k: 'soon', ic: '📥', t: 'Instalar mods arrastrándolos', p: 'Soltar un mod en la pestaña Sider y que se copie solo a livecpk, modules o content, con su readme a la vista y cada paso para deshacer.', pct: 15, pri: 'media', dif: 3, dev: true },
  { k: 'soon', ic: '🎮', t: 'Más estilos gráficos', p: 'Modos inspirados en los menús de otras ediciones de PES, como el de PES 5.', pct: 30, pri: 'media', dif: 2, dev: true },
  { k: 'listo', ic: '🛠️', t: 'Habilidades desde la ficha', p: 'Editar las habilidades de cada jugador desde su ficha, con los nombres del juego.', how: 'Jugadores → tocá un jugador → Habilidades y skills.', pct: 100, pri: 'media', dif: 1 },
  { k: 'idea', ic: '🎨', t: 'Crear kits desde cero', p: 'Un modo del Kit Studio Pro para diseñar una camiseta nueva: colores, franjas, cuello, sponsor y escudo, sin partir de un kit hecho.', pct: 5, pri: 'media', dif: 3 },
  { k: 'soon', ic: '📋', t: 'Formaciones como plantillas', p: 'Guardar y compartir tus formaciones favoritas.', pct: 5, pri: 'baja', dif: 1, dev: true },
  { k: 'soon', ic: '🔁', t: 'Comparar planteles', p: 'Ver dos planteles lado a lado antes de un traspaso.', pct: 5, pri: 'baja', dif: 1, dev: true },
  { k: 'idea', ic: '🧍', t: 'Editor de cuerpos', p: 'Cambiar las proporciones del cuerpo de cada jugador, o de todos, usando los modelos del juego.', pct: 0, pri: 'baja', dif: 3 },
];
const IDEA_ST = { listo: ['✅', 'Ya está'], beta: ['🧪', 'En prueba'], soon: ['🚧', 'En camino'], idea: ['💭', 'Pensada'] };
const IDEA_PRI = { alta: ['⭐', 'Prioridad alta'], media: ['', 'Prioridad media'], baja: ['', 'Prioridad baja'] };
const IDEA_DIF = ['', 'Fácil', 'Media', 'Difícil'];
const IDEA_REPO = 'https://github.com/Agustinioquino/Pes-Editor-Rebuilt';
let IDEA_F = 'todo', IDEA_SORT = 'pri', IDEA_KIND = null;
const ideaColor = n => n >= 100 ? 'done' : n >= 80 ? 'hi' : n >= 50 ? 'mid' : n >= 25 ? 'lo' : 'start';
const ideaRank = { alta: 0, media: 1, baja: 2 };
function ideaSorted(list) {
  const done = x => x.k === 'listo' ? 1 : 0;
  const by = {
    pri: (a, b) => ideaRank[a.pri] - ideaRank[b.pri] || (b.user ? 1 : 0) - (a.user ? 1 : 0) || a.dif - b.dif || b.pct - a.pct,
    dif: (a, b) => a.dif - b.dif || ideaRank[a.pri] - ideaRank[b.pri] || b.pct - a.pct,
    pct: (a, b) => b.pct - a.pct || ideaRank[a.pri] - ideaRank[b.pri],
  }[IDEA_SORT];
  return list.slice().sort((a, b) => done(a) - done(b) || by(a, b));
}
// "Media" ya se traduce como "Overall" (la media de un jugador): la dificultad se traduce acá
const ideaDif = d => (typeof LANG !== 'undefined' && LANG === 'en' ? ['', 'Easy', 'Medium', 'Hard'] : IDEA_DIF)[d];
const ideaDots = d => `<span class="ideadif" data-d="${d}" title="Dificultad: ${IDEA_DIF[d]}"><i></i><i></i><i></i><span data-noi18n>${ideaDif(d)}</span></span>`;
function ideaCardHtml(x, i) {
  const [si, sn] = IDEA_ST[x.k], [pi, pn] = IDEA_PRI[x.pri];
  return `<li class="ideai pri-${x.pri} st-${x.k}" style="--i:${i}">
    <span class="ideaic" aria-hidden="true">${x.ic}</span>
    <div class="ideamain">
      <div class="ideatop"><b class="ideah">${esc(x.t)}</b>
        <span class="chip ideast st-${x.k}">${si} ${sn}</span>${x.user ? '<span class="chip ideauser" title="Lo pidieron usuarios del editor">👥 Pedido por usuarios</span>' : ''}</div>
      <div class="devprog ${ideaColor(x.pct)}" role="progressbar" aria-valuenow="${x.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(x.t)}: ${x.pct} %"><i><b style="width:${Math.max(x.pct, 1)}%"></b></i><span>${x.pct} %</span></div>
      <p>${esc(x.p)}</p>
      ${x.how ? `<p class="ideahow"><span>Dónde está</span> ${esc(x.how)}</p>` : ''}
      <div class="ideameta"><span class="chip ideapri pri-${x.pri}">${pi ? pi + ' ' : ''}${pn}</span>${ideaDots(x.dif)}</div>
    </div></li>`;
}
// datos del editor que ayudan a entender un fallo (nada personal: ni nombres de archivos ni carpetas)
function ideaEnv() {
  const ua = navigator.userAgent, b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Brave/.test(ua) || navigator.brave ? 'Brave' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Otro';
  const v = (ua.match(/(?:Edg|OPR|Chrome|Firefox|Version)\/(\d+)/) || [])[1];
  const gfx = { pes6: 'PES 6 Editar', retro: 'Retro', clasico: 'Clásico' }[document.documentElement.dataset.gfx] || 'Moderno';
  const app = window.pesNative ? 'app para Windows' : 'web';
  const ver = typeof NEWS_VER !== 'undefined' ? newsVer(NEWS_VER) + ' alpha' : '';
  return { ver, text: `${ver} · ${app} · ${b}${v ? ' ' + v : ''} · modo ${gfx} · ${typeof LANG !== 'undefined' && LANG === 'en' ? 'English' : 'Español'}` };
}
function ideaForm() {
  const bug = IDEA_KIND === 'bug';
  return `<div class="ideaform" data-kind="${IDEA_KIND}">
    <label class="f"><span>${bug ? '¿Qué pasó? Qué hiciste, qué esperabas y qué pasó en realidad.' : '¿Qué te gustaría que haga el editor? Contá también para qué te serviría.'}</span>
      <textarea id="ideaTxt" rows="5" placeholder="${esc(tr(bug ? '1. Abrí un equipo\n2. Toqué Guardar en el juego\n3. Apareció un error que dice…' : 'Por ejemplo: poder cambiar el balón de cada torneo.'))}"></textarea></label>
    ${bug ? `<label class="ideaenv"><input type="checkbox" id="ideaEnv" checked> Sumar datos del editor: <code data-noi18n>${esc(ideaEnv().text)}</code></label>` : ''}
    <div class="row ideasend">
      <button class="btn primary" type="button" id="ideaGh">Enviar por GitHub</button>
      <button class="btn" type="button" id="ideaCopy">📋 Copiar para Discord o WhatsApp</button>
      <button class="btn ghost small" type="button" id="ideaCancel">Cancelar</button>
    </div>
    <p class="note">GitHub abre la página con tu texto listo: necesitás una cuenta (es gratis) y tocar Submit. Si no tenés, copiá el texto y pegalo en el grupo de Discord o de WhatsApp del editor. ${bug ? 'No subas tu EDIT00000000 si no querés que sea público.' : ''}</p>
  </div>`;
}
function ideaText(withEnv) {
  const t = (document.getElementById('ideaTxt') || {}).value || '', bug = IDEA_KIND === 'bug';
  const env = bug && withEnv ? '\n\n' + tr('Datos del editor:') + ' ' + ideaEnv().text : '';
  return { t: t.trim(), title: (bug ? '[Error] ' : '[Idea] ') + t.trim().split('\n')[0].slice(0, 70), full: (bug ? tr('🐛 Algo no anda en PES Editor Rebuilt:') : tr('💡 Idea para PES Editor Rebuilt:')) + '\n' + t.trim() + env, env };
}
function renderIdeas(m) {
  const all = IDEAS, list = ideaSorted(all.filter(x => IDEA_F === 'todo' || (IDEA_F === 'user' ? x.user : x.k === IDEA_F)));
  const n = k => all.filter(x => x.k === k).length, open = all.filter(x => x.k !== 'listo');
  const avg = Math.round(open.reduce((a, x) => a + x.pct, 0) / open.length);
  const filters = [['todo', 'Todas', all.length], ['user', '👥 Pedidos de usuarios', all.filter(x => x.user).length], ['beta', '🧪 En prueba', n('beta')], ['soon', '🚧 En camino', n('soon')], ['idea', '💭 Pensadas', n('idea')], ['listo', '✅ Ya están', n('listo')]];
  m.innerHTML = `<section class="card ideasc">
    <div class="newshead"><div><h2>Ideas</h2><p class="note">Lo que piden los usuarios y lo que viene en PES Editor Rebuilt, con cuánto avanzó cada cosa, su prioridad y su dificultad. ¿Se te ocurrió algo o encontraste un fallo? Contalo acá.</p></div></div>
    <div class="ideasend2">
      <button type="button" class="ideabig" data-ik="idea" aria-pressed="${IDEA_KIND === 'idea'}"><span aria-hidden="true">💡</span><b>Tengo una idea</b><small>Una función nueva o una mejora</small></button>
      <button type="button" class="ideabig bug" data-ik="bug" aria-pressed="${IDEA_KIND === 'bug'}"><span aria-hidden="true">🐛</span><b>Algo no anda</b><small>Un error, algo que no se guarda o se ve mal</small></button>
    </div>
    ${IDEA_KIND ? ideaForm() : ''}
    <div class="ideastats">
      <div><b>${all.length}</b><span>ideas en la lista</span></div>
      <div><b>${all.filter(x => x.user).length}</b><span>pedidas por usuarios</span></div>
      <div><b>${n('beta')}</b><span>en prueba</span></div>
      <div><b>${avg} %</b><span>avance promedio de lo pendiente</span></div>
    </div>
    <div class="row ideatools">
      <div class="seg ideaf">${filters.map(([k, t, c]) => `<button type="button" aria-pressed="${IDEA_F === k}" data-if="${k}">${t} <small>${c}</small></button>`).join('')}</div>
      <label class="ideasort">Ordenar por <select id="ideaSort">${[['pri', 'Prioridad'], ['dif', 'Más fáciles primero'], ['pct', 'Más avanzadas']].map(([k, t]) => `<option value="${k}" ${IDEA_SORT === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    </div>
    <span class="devleg idealeg"><i class="start"></i>empezando <i class="lo"></i>en camino <i class="mid"></i>avanzado <i class="hi"></i>casi listo <i class="done"></i>listo</span>
    <ul class="idealist">${list.map(ideaCardHtml).join('')}</ul>
    <p class="note">Los porcentajes son aproximados y el orden puede cambiar según lo que más pidan.</p>
  </section>`;
  m.querySelectorAll('[data-if]').forEach(b => b.onclick = () => { IDEA_F = b.dataset.if; renderIdeas(m); });
  m.querySelector('#ideaSort').onchange = e => { IDEA_SORT = e.target.value; renderIdeas(m); };
  m.querySelectorAll('[data-ik]').forEach(b => b.onclick = () => { IDEA_KIND = IDEA_KIND === b.dataset.ik ? null : b.dataset.ik; renderIdeas(m); const t = m.querySelector('#ideaTxt'); if (t) t.focus(); });
  if (!IDEA_KIND) return;
  const need = () => { const r = ideaText(!!(m.querySelector('#ideaEnv') || {}).checked); if (!r.t) { toast(tr('Escribí tu idea o qué pasó antes de enviar.')); m.querySelector('#ideaTxt').focus(); return null; } return r; };
  m.querySelector('#ideaCancel').onclick = () => { IDEA_KIND = null; renderIdeas(m); };
  m.querySelector('#ideaGh').onclick = () => {
    const r = need(); if (!r) return;
    const q = new URLSearchParams(IDEA_KIND === 'bug'
      ? { template: 'error.yml', title: r.title, version: ideaEnv().ver, 'que-paso': r.t + r.env }
      : { template: 'idea.yml', title: r.title, idea: r.t });
    window.open(`${IDEA_REPO}/issues/new?${q}`, '_blank', 'noopener');
  };
  m.querySelector('#ideaCopy').onclick = async () => {
    const r = need(); if (!r) return;
    try { await navigator.clipboard.writeText(r.full); toast(tr('Copiado: pegalo en Discord o WhatsApp.')); }
    catch { const t = m.querySelector('#ideaTxt'); t.value = r.full; t.select(); toast(tr('Seleccioné el texto: copialo con Ctrl+C.')); }
  };
}
