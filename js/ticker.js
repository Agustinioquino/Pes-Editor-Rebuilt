// ===================== Barra de abajo con texto que corre (estilo PES 6 Editar) =====================
// Va mostrando novedades del editor, ideas a futuro y datos de la saga. Al pasar el mouse por una pestaña o un botón,
// se queda quieta y explica qué hace esa parte del menú. Solo se ve con el modo gráfico PES 6.
const TICKER_IDEAS = [
  'Idea a futuro: editar las habilidades de cada jugador desde la ficha, con los nombres del juego.',
  'Idea a futuro: comparar dos planteles lado a lado antes de un traspaso.',
  'Idea a futuro: más estilos gráficos inspirados en los menús de otras ediciones de PES.',
  'Idea a futuro: guardar y compartir tus formaciones favoritas como plantillas.',
  '¿Tenés una idea para el editor? Escribila en GitHub, en "Ideas", y puede aparecer en una próxima versión.'
];
// lo nuevo de la última versión, contado para la barra
const TICKER_NEW = [
  'Novedad v0.030: este modo PES 6 Editar estrena fondo de estadio con efecto de tele vieja, como jugar en la PS2 del living.',
  'Novedad v0.030: la tabla del plantel ahora es dorada, como la selección del modo Editar de PES 6.',
  'Novedad v0.030: el logo de arriba respira despacio con una segunda capa, al estilo de los menús de PES.',
  'Novedad v0.030: cada jugador muestra la bandera real de su país, y el borde de su foto dice si es arquero, defensa, medio o delantero.',
  'Novedad v0.030: en la cabecera del equipo ves el nombre real del estadio y, entre paréntesis, el que usa tu EDIT.',
  'Novedad v0.030: al cargar elegís fotos recortadas de TheSportsDB o una mezcla con Wikipedia para las que falten.',
  'Novedad v0.030: el video de YouTube se guarda a los 15 segundos y queda la carátula; tocala y vuelve.'
];
const TICKER_SAGA = [
  'PES nació en 2001 en PlayStation 2. En Japón la saga se llamaba Winning Eleven.',
  'PES 6 salió en 2006 y para muchos sigue siendo el mejor de la saga: por eso este estilo.',
  'Sin licencias, PES inventaba nombres: Man Red, Merseyside Red y London FC son clásicos de la saga.',
  'El modo Editar de PES permitía arreglar nombres, camisetas y escudos: el origen de los parches que usamos hoy.',
  'eFootball PES 2021 Season Update fue la última edición con el nombre PES; después la saga pasó a llamarse eFootball.',
  'Shingo "Seabass" Takatsuka fue durante años el productor de la saga.',
  'La Liga Master es uno de los modos más queridos de PES: armar un equipo desde abajo y llevarlo a la cima.'
];
// descripción de cada parte del menú (lo que no tiene, usa su title)
const TICKER_HELP = {
  tTeams: 'Equipos: elegí un club para editar su plantel, formación, colores, kits y estadio.',
  tNats: 'Selecciones: lo mismo que Equipos, para las selecciones nacionales y su convocatoria.',
  tPlayers: 'Jugadores: los jugadores que guardó tu EDIT, con su ficha completa para editar.',
  tWepes: 'WEPES: los archivos de la carpeta WEPES del juego.',
  tFile: 'Archivo: datos del EDIT abierto, historial de cambios, nombre en el juego y pasar a otra PC.',
  tNews: 'Novedades: lo que cambió en cada versión del editor y cómo se usa.',
  bNames: 'Conectar Player.bin: elegí el Player.bin del juego para ver los nombres reales de los jugadores.',
  bSave: 'Guardar: escribe tus cambios en el EDIT (Ctrl+S). Cerrá el juego antes de guardar.',
  bUndo: 'Deshacer el último cambio (Ctrl+Z).', bRedo: 'Rehacer lo que deshiciste (Ctrl+Y).',
  bGfx: 'Gráficos: elegí el estilo (Moderno, Clásico, Retro, PES 6 Editar) y la calidad.',
  bUi: 'Apariencia: tamaño y fuente de la letra y cantidad de efectos.',
  bHome: 'Volver al inicio: la pestaña Equipos, arriba de todo.',
  gq: 'Buscador: escribí un equipo o un jugador. Atajo: tecla /.'
};
const TK = { el: null, help: null };
const tickerKind = t => /^(Novedad|v0\.)/.test(t) ? 'novedad' : /^(Idea|¿Tenés)/.test(t) ? 'idea' : 'pes';
function tickerItems() {
  const news = [...TICKER_NEW, ...(typeof NEWS !== 'undefined' ? NEWS.slice(1, 3) : []).map(n => `Novedad ${newsVer(n.v)}: ${n.t}.`)];
  const mix = (a, b, c) => { const out = [], m = Math.max(a.length, b.length, c.length); for (let k = 0; k < m; k++) [a[k], b[k], c[k]].forEach(x => x && out.push(x)); return out; };
  const sh = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
  return mix(news, sh(TICKER_SAGA), sh(TICKER_IDEAS));
}
const tickerOn = () => document.documentElement.dataset.gfx === 'pes6';
function tickerMount() {
  if (TK.el) return;
  const el = TK.el = document.createElement('div'); el.className = 'tk'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'off');
  // una cinta continua: todos los textos seguidos (dos veces, para que el final empalme con el principio) que corre despacio sin cortes
  const strip = tickerItems().map(t => { const k = tickerKind(t); return `<span class="tki" data-k="${k}"><b>${{ novedad: 'NOVEDAD', idea: 'IDEA', pes: 'PES' }[k]}</b>${esc(t)}</span>`; }).join('');
  el.innerHTML = `<span class="tktag" id="tkTag">INFO</span><div class="tkwin"><div class="tkrun" id="tkRun"><span class="tkseg">${strip}</span><span class="tkseg" aria-hidden="true">${strip}</span></div><span class="tkhelp" id="tkHelp"></span></div>`;
  document.body.appendChild(el);
  // velocidad fija y lenta (unos 45 px por segundo), sea cual sea el largo del texto
  requestAnimationFrame(() => { const w = el.querySelector('.tkseg').scrollWidth; el.querySelector('#tkRun').style.animationDuration = (w / 45).toFixed(0) + 's'; });
  // descripción del menú al pasar el mouse
  document.addEventListener('mouseover', e => {
    if (!tickerOn()) return;
    const t = e.target.closest && e.target.closest('[id],[title]'); let txt = null;
    for (let n = t; n && n !== document.body && !txt; n = n.parentElement) txt = TICKER_HELP[n.id] || (n.matches('button,.tab,a,select,input,label,[data-help]') && (n.dataset.help || n.title)) || null;
    tickerHelp(txt);
  });
  document.addEventListener('mouseleave', () => tickerHelp(null));
}
function tickerHelp(txt) {
  if (!TK.el || TK.help === txt) return; TK.help = txt;
  TK.el.classList.toggle('helping', !!txt);
  if (txt) TK.el.querySelector('#tkHelp').textContent = txt;
  TK.el.querySelector('#tkTag').textContent = txt ? 'AYUDA' : 'INFO';
}
function tickerSync() { if (tickerOn()) tickerMount(); document.documentElement.classList.toggle('tking', tickerOn()); }
