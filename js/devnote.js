// ===================== En desarrollo: lo que se está probando y lo que viene =====================
// Un cartel abajo a la derecha, una vez por versión, cuando termina la pantalla de carga. También queda arriba de
// todo en Novedades. "Beta" = ya está en el editor pero en prueba; "Próximamente" = en camino, puede cambiar.
const DEV_ITEMS = [
  ['beta', '⚽', 'Football Life 2026', 'La base leída directo de los archivos del juego, las valoraciones con su tope de 104 y su EDIT en 2026\\save. Está en prueba: si algo no carga o una media no coincide, avisá.'],
  ['beta', '👕', 'Kit Studio Pro: cargar kits desde un .zip', 'Versión preliminar: arrastrar un .zip a Uniformes, elegir el puesto, reemplazar o agregar, y los kits que viven en los .cpk. Se probó poco con juegos reales y es probable que tenga fallos: hacé una copia de content\\kit-server antes y avisá si algo sale mal.'],
  ['beta', '🧩', "Pestaña Sider", "Qué carga tu juego y edición de sider.ini con interruptores. Está en prueba: si una carpeta o un módulo sale mal clasificado, o algo no se guarda, avisá."],
  ['beta', '💻', 'PES Editor Rebuilt para Windows', 'La app que conecta tu carpeta Sider aunque esté en Archivos de programa. Está en prueba: si algo no se guarda en el juego, avisá.'],
  ['beta', '⬡', 'Ficha hexagonal y media rápida', 'Cambiar la media y cada área de un jugador arrastrando el hexágono o desde el plantel. Está en prueba: si una media no queda como esperabas, avisá.'],
  ['beta', '🗂', 'Tu trabajo en el caché', 'Al actualizar el editor, tus cambios sin guardar quedan en el navegador y vuelven solos. Está en prueba: guardá en el juego igual cuando termines.'],
  ['beta', '📈', 'Valoración dinámica con datos reales', 'La forma de cada jugador ahora usa toda la temporada, los goleadores, las lesiones y el historial de ESPN. Está en prueba: si ves un dato raro, avisá.'],
  ['soon', '📥', 'Instalar mods arrastrándolos', 'Soltar un mod en la pestaña Sider y que se copie solo a livecpk, modules o content, con su readme a la vista y cada paso para deshacer.'],
  ['soon', '🎮', 'Más estilos gráficos', 'Modos inspirados en los menús de otras ediciones de PES, como el de PES 5.'],
  ['soon', '🛠️', 'Habilidades desde la ficha', 'Editar las habilidades de cada jugador desde su ficha, con los nombres del juego.'],
  ['soon', '📋', 'Formaciones como plantillas', 'Guardar y compartir tus formaciones favoritas.'],
  ['soon', '🔁', 'Comparar planteles', 'Ver dos planteles lado a lado antes de un traspaso.'],
];
const DEV_LS = 'pes-editor-dev-seen';
const devList = () => `<ul class="devlist">${DEV_ITEMS.map(([k, ic, h, p]) => `<li><span class="devic" aria-hidden="true">${ic}</span><div><b>${h}</b> <span class="chip ${k === 'beta' ? 'warn' : ''} devst">${k === 'beta' ? 'Beta' : 'Próximamente'}</span><p>${p}</p></div></li>`).join('')}</ul>`;
const devCard = () => `<section class="card devcard"><h3>🚧 En desarrollo</h3>${devList()}<p class="note">Son cosas en camino: el orden y los detalles pueden cambiar.</p></section>`;
function devPop(force) {
  if (document.querySelector('.devpop')) return;
  let seen = 0; try { seen = +localStorage.getItem(DEV_LS) || 0; } catch { }
  if (!force && seen >= NEWS_VER) return;
  const d = document.createElement('aside'); d.className = 'devpop'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'En desarrollo');
  d.innerHTML = `<div class="row" style="justify-content:space-between"><h3>🚧 En desarrollo</h3><span class="row devtop"><button class="btn ghost small" type="button" data-dmin aria-label="Minimizar" title="Minimizar">▁</button><button class="btn ghost small" type="button" data-dx aria-label="Cerrar" title="Cerrar">✕</button></span></div><div class="devbody">${devList()}
    <div class="row devbtns"><button class="btn small" type="button" data-dnews>Ver novedades</button><button class="btn small primary" type="button" data-dok>Entendido</button></div></div>`;
  const close = () => { try { localStorage.setItem(DEV_LS, NEWS_VER); } catch { } d.classList.remove('on'); setTimeout(() => d.remove(), 300); };
  // minimizado queda como una pestañita abajo a la derecha (y así sigue la próxima vez); tocándola se abre de nuevo
  const mini = on => { d.classList.toggle('min', on); const m = d.querySelector('[data-dmin]'); m.textContent = on ? '▢' : '▁'; m.title = on ? 'Mostrar' : 'Minimizar'; m.setAttribute('aria-label', m.title); try { localStorage.setItem(DEV_LS + '-min', on ? '1' : ''); } catch { } };
  d.querySelector('[data-dmin]').onclick = e => { e.stopPropagation(); mini(!d.classList.contains('min')); };
  d.querySelector('h3').onclick = () => { if (d.classList.contains('min')) mini(false); };
  try { if (localStorage.getItem(DEV_LS + '-min')) mini(true); } catch { }
  d.querySelector('[data-dx]').onclick = close; d.querySelector('[data-dok]').onclick = close;
  d.querySelector('[data-dnews]').onclick = () => { close(); if (typeof setTab === 'function') setTab('news'); };
  document.body.appendChild(d); requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('on')));
}
// se muestra cuando ya no está la pantalla de carga
(function devWait(n) { if (n > 240) return; if (document.querySelector('.intro') || document.documentElement.classList.contains('introing')) return setTimeout(() => devWait(n + 1), 500); setTimeout(() => devPop(), 1500); })(0);
