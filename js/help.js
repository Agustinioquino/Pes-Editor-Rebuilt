// ===================== Ayuda: "Cómo funciona" plegable en cada sección =====================
// Cada bloque explica qué hace la sección, paso a paso, y qué cambia en el juego. Se recuerda si lo dejaste abierto.
const HELP = {
  roster: { t: 'el plantel', intro: 'Es la lista de jugadores del equipo tal como la usa el juego: quién está, con qué dorsal, quién es titular y quién lleva la cinta.', groups: [
    ['Ver y ordenar', [
      ['Filtrar', 'escribí parte del nombre, el ID, el dorsal o el país. Los botones ARQ / DEF / MED / DEL y Titulares / Banco / Reserva / Sin proteger se suman al texto.'],
      ['Ordenar', 'tocá el título de cualquier columna; si lo tocás otra vez se invierte. Los botones de "Orden" son atajos.'],
      ['Columnas', 'elegí cuáles ver (Altura, Nacionalidad y Pie vienen ocultas). Queda guardado para la próxima vez.'],
      ['Densidad', 'los tres íconos cambian el alto de las filas: compacta para ver todo el plantel sin bajar, cómoda para leer mejor.'],
      ['Resumen', 'debajo de la tabla ves la media, la edad, la altura y el valor de lo que está filtrado.']]],
    ['Cambiar el plantel', [
      ['Dorsal', 'escribilo en la casilla. Si dos jugadores quedan con el mismo número aparece un aviso y el botón "Arreglar dorsales repetidos".'],
      ['Capitán', 'marcá el círculo de la columna Cap.'],
      ['Titular / pasar…', 'en un suplente, elegí por qué titular entra. En cualquier jugador, elegí otro equipo para transferirlo: se suma con un dorsal libre.'],
      ['Quitar (✕)', 'lo saca del plantel. Si era titular entra el primer suplente; si era capitán, la cinta pasa a otro titular.'],
      ['Varios a la vez', 'marcá las casillas de la izquierda y usá la barra que aparece: Proteger, Equipación…, Pasar a… o Quitar del plantel.'],
      ['Equipación…', 'cambia mangas, medias, calzas, camiseta interior, guantes o botines de todos los seleccionados de una vez. Lo que dejes en "Sin cambiar" queda como estaba.'],
      ['Valor', 'es una estimación por valoración, edad, potencial y liga. Tocalo para poner el valor real (por ejemplo el de Transfermarkt).']]],
    ['Para tener en cuenta', [
      ['🔒 Protección', 'el candadito al lado del nombre avisa que ese jugador no está protegido: el Parche puede pisar sus datos. "Proteger" lo marca como editado.'],
      ['Exportar', 'descarga un CSV para Excel o copia la tabla para pegar en Google Sheets. Sale exactamente lo que estás viendo.'],
      ['Deshacer', 'todo se puede deshacer con Ctrl+Z hasta que guardes.']]]] },
  tactics: { t: 'la formación', intro: 'Acá armás cómo se para el equipo en la cancha y quién juega. Es lo mismo que ves en "Plan de juego" dentro del juego.', groups: [
    ['En la cancha', [
      ['Mover', 'arrastrá a un jugador a otro lugar. Si lo soltás encima de otro titular, intercambian posiciones.'],
      ['Elegir', 'tocalo para ver su ficha a la derecha, cambiar su rol (DC, MC, EI…) o poner a otro en su lugar.'],
      ['Cambios', 'arrastrá un suplente del banco sobre un titular, o tocá el suplente y después al titular.'],
      ['⚠ Fuera de puesto', 'el triángulo indica que juega en un rol que no domina: la media que ves ahí es la que tendría en ese puesto.']]],
    ['Valoraciones', [
      ['Del juego', 'la media actual del jugador en su rol.'],
      ['Por rendimiento', 'la media con la forma de los últimos partidos reales sumada (flechas verdes o rojas).'],
      ['Comparar', 'muestra las dos lado a lado.']]],
    ['Últimos partidos reales', [
      ['Buscar', 'trae la formación, el 11 y los puntajes de los últimos partidos de verdad (ESPN no necesita clave).'],
      ['Ver en cancha', 'muestra ese partido sobre tu cancha y marca qué cambiaría.'],
      ['Usar esta formación', 'pregunta antes de tocar nada: podés poner solo el 11 y la formación, o también aplicar los cambios de valoración al juego.']]],
    ['Capitán y balón parado', [
      ['Capitán', 'elegilo de la lista: titulares arriba, suplentes abajo.'],
      ['Lanzadores', 'tiro libre largo, tiro libre corto y su segundo tirador, córner izquierdo y derecho, y penales. Es lo mismo que "Opciones del jugador" en el Plan de juego.'],
      ['Jugadores ofensivos', 'los 3 que suben al área en tiros libres y córners.'],
      ['Elegir automáticamente', 'elige un titular para cada jugada según sus habilidades: tiro libre y potencia, efecto, definición, cabezazo. Los lugares que estaban en "Ninguno" quedan así.']]],
    ['Estrategia', [
      ['Ataque y defensa', 'las mismas opciones que "Estrategia de equipo" en el juego. Tocá la opción que querés: cada una explica qué hace.'],
      ['Instrucciones avanzadas', 'tocá hasta 2 de ataque y 2 de defensa, como en el juego. Tocá una marcada para quitarla.'],
      ['Opciones tácticas rápidas', 'cambian varias opciones de una vez, con los mismos nombres que en el juego.'],
      ['Config. marcaje', 'si algún jugador quedó marcando a un rival fijo, "Volver a automático" lo deja como viene.']]]] },
  data: { t: 'los datos del equipo', intro: 'Nombre, abreviatura, colores, país y entrenador. Son los datos que el juego muestra en menús, marcadores y radar.', groups: [
    ['Qué hace cada cosa', [
      ['Nombre y abreviatura', 'se ven en menús y en el marcador. Al cambiarlos se activa "Proteger nombre" para que el Parche no los vuelva a pisar.'],
      ['Colores', 'principal y secundario del equipo: los usa el juego en menús y el editor para escudos, cancha y la apariencia.'],
      ['Usar los colores del kit', 'copia los colores del kit titular del Parche.'],
      ['País y entrenador', 'el país sirve para ligas y selecciones; el entrenador es el DT que aparece en los partidos.']]]] },
  kits: { t: 'el estudio de kits', intro: 'Edita los kits del Parche (content\\kit-server): el config.txt y todas sus texturas. Lo que ves está armado con los modelos reales del juego (camisetas, mangas, 116 cuellos, 16 shorts y medias, sacados del CometKITpreviewer).', groups: [
    ['Vistas', [
      ['3D', 'el uniforme completo. Arrastrá para girar, clic derecho (o Shift) para mover la cámara, rueda para acercar, flechas del teclado para girar de a poco y doble clic para volver al frente.'],
      ['Cámara', 'encuadres rápidos (frente, espalda, costados, 3/4, desde arriba, primer plano del pecho), lente más abierta o más cerrada y giro automático con velocidad.'],
      ['Prendas', 'manga corta o larga, largo de medias, camiseta adentro o afuera y cinta de capitán. Cada cambio se ve con una transición.'],
      ['Iluminación', 'escenas con su entorno 360° (estudio, estadio de día y de noche, atardecer, vestuario) o un HDRI tuyo (.hdr, .jpg o .png). La esfera fija desde dónde viene la luz principal; también hay intensidad, luz ambiente, exposición, reflejos, giro del entorno y fondo.'],
      ['Maqueta', 'frente, espalda y short. Arrastrá el número o el nombre para moverlos y usá la rueda encima para cambiarles el tamaño: el config.txt se actualiza solo.']]],
    ['Brillo (alfa del kit)', [
      ['Qué es', 'en la textura del kit, el canal alfa le dice al juego cuánto brilla cada parte: blanco brilla más, negro es mate. El visor lo usa igual.'],
      ['Ver brillo', 'muestra ese mapa en gris sobre el modelo; "Ver relieve" muestra el normal map.'],
      ['Ajustar', 'nivel, contraste e invertir; o rellenar todo mate, todo brillante o según los colores.'],
      ['Pincel', 'marcá "Pintar brillo" y pintá directo sobre el modelo (Shift para mover la cámara mientras pintás). Se puede deshacer.'],
      ['Guardar', 'escribe el brillo en el alfa de la textura del kit a resolución completa, sin tocar los colores.']]],
    ['Texturas', [
      ['Subir…', 'elegí una imagen (.png, .jpg, .dds o .ftex). Se convierte a .ftex (DXT5 con todos sus tamaños) y se guarda en la carpeta del kit con el nombre que espera el config.txt. La primera vez se guarda una copia .bak-edit21 de la anterior.'],
      ['Generador de fuentes', 'crea las letras del nombre y los números de espalda, pecho y short con cualquier fuente de tu compu (o un archivo .ttf/.otf), con relleno, dos bordes y sombra. Respeta las casillas de las plantillas de Photoshop.'],
      ['Tela y relieve', 'elegí la tela (malla, piqué, panal, acanalado…) y cuánto relieve tienen los dibujos. Se ve al instante en el 3D; "Guardar este relieve en el kit" escribe el normal map (_nrm) y el brillo (_srm).'],
      ['Dentro de los .cpk', 'si la textura del kit está dentro de los .cpk del Parche no se puede leer (están cifrados). El 3D usa los colores del config hasta que subas la textura.']]],
    ['Modelo y guardado', [
      ['Cuello y short', 'tocá la miniatura para ver todos los modelos del juego con tu textura y elegir uno.'],
      ['Guardar kit', 'escribe el config.txt (con copia la primera vez). Las texturas se guardan apenas las subís o generás. Hay que volver a abrir el juego para verlo.'],
      ['Orden y copias', '↑ sube el kit en order.ini (el primero es el titular). ⧉ duplica el kit como p5, g4… para empezar uno nuevo.']]]] },
  stadium: { t: 'estadio, rivales y banderas', intro: 'Datos del ambiente de los partidos de local.', groups: [
    ['Qué hace cada cosa', [
      ['Estadio', 'el estadio que usa de local. "Nombre propio" reemplaza el nombre que muestra el juego.'],
      ['Rivales clásicos', 'el juego los usa para los clásicos: cambia el ambiente y los cánticos.'],
      ['Banderas', 'los textos de las banderas de la hinchada (hasta 15 letras cada una).']]]] },
  call: { t: 'la convocatoria', intro: 'La lista de la selección. Los convocados siguen en sus clubes: convocar no los saca de ningún plantel.', groups: [
    ['Cómo se arma', [
      ['Automática', 'elige a los mejores de la nacionalidad respetando cuántos arqueros, defensores, medios y delanteros lleva una lista real.'],
      ['Lista de 23 o 26', 'el tamaño máximo de la convocatoria.'],
      ['Mejor 11', 'arma el 11 con los convocados según la formación del plan actual.'],
      ['Valoración', 'usa la media actual o la de rendimiento, según lo que elijas en Formación.']]]] },
  player: { t: 'la ficha del jugador', intro: 'Todo lo que se guarda del jugador en tu EDIT. Solo aparecen acá los jugadores que ya están en tu archivo.', groups: [
    ['Pestañas', [
      ['Perfil', 'nombre, nombre en la camiseta, nacionalidad, edad, altura, peso, pie hábil y estilo de juego.'],
      ['Posiciones', 'tocá cada posición en la cancha para pasar de — (no juega) a B (puede jugar) y A (domina). La registrada queda en amarillo.'],
      ['Habilidades', 'los valores de 40 a 99 que forman la media.'],
      ['Especiales', 'habilidades especiales y estilos de la IA.'],
      ['Apariencia y Movimientos', 'cuerpo, botines, accesorios y las animaciones (los números son los mismos del modo Editar del juego).']]],
    ['Proteger mis cambios', [
      ['Para qué sirve', 'marca al jugador como editado: el juego usa tus valores aunque el Parche cargue otra base de datos. Se activa solo cuando cambiás algo.']]]] },
  wepes: { t: 'la carpeta WEPES', intro: 'WEPES es la carpeta que el juego usa para intercambiar archivos con el modo Editar: está en Documentos\\KONAMI\\eFootball PES 2021 SEASON UPDATE\\WEPES.', groups: [
    ['Qué va acá', [
      ['Importar imágenes', 'las imágenes (PNG, JPG) que pongas acá aparecen en el modo Editar del juego, en "Importar imágenes", para escudos, uniformes, carteles y fotos.'],
      ['Exportaciones', 'lo que exportás desde el juego (por ejemplo datos de edición) también se guarda acá.']]],
    ['Desde el editor', [
      ['Ver', 'cada archivo muestra una miniatura (también .dds y .ftex). Tocalo para verlo grande, con su tamaño en píxeles, y descargar una copia.'],
      ['Agregar archivos', 'copia los archivos que elijas a WEPES (o a la subcarpeta abierta). El juego los ve la próxima vez que entres a importar.'],
      ['Subcarpetas', 'tocá una carpeta para entrar; usá los nombres de arriba para volver.']]]] },
  file: { t: 'el archivo', intro: 'El EDIT00000000 es el archivo donde el juego guarda todas tus ediciones. El editor lo busca solo en Documentos\\KONAMI\\eFootball PES 2021 SEASON UPDATE: primero el del Parche (drmp) y si no, el de save.', groups: [
    ['Dónde lo busca', [
      ['La primera vez', 'el navegador pide que elijas tu carpeta Documentos una sola vez (la ventana ya se abre ahí). Después lo recuerda; si te vuelve a pedir permiso, elegí "Permitir en cada visita".'],
      ['Varios EDIT', 'si hay más de uno (drmp y save, u otra cuenta de Steam) se abre el más reciente, y en "Carpeta del juego" podés cambiar al otro.']]],
    ['La carpeta Sider y la base del juego', [
      ['Conectar carpeta Sider', 'elegí la carpeta de Sider del Parche (la que tiene sider.exe). De ahí salen los kits, las caras, los escudos y la base del juego: nombres, valoraciones y planteles de todos los jugadores.'],
      ['El módulo edit21_db.lua', 'el editor lo instala solo en modules\\ y agrega su línea en sider.ini (con copia de seguridad). Es de solo lectura: cuando el juego carga su base, la copia en content\\edit21-db.'],
      ['Si avisa que la base no está cargada', 'abrí PES 2021 con Sider hasta el menú principal, entrá en Partido › Amistoso hasta la elección de equipos y cerrá el juego. Después tocá "Ya lo hice". Ese paso hace falta una vez por versión del módulo.']]],
    ['Guardar sin perder nada', [
      ['Guardar', 'escribe directo en la carpeta del juego. El primer guardado de cada sesión crea un respaldo con la fecha.'],
      ['Si el juego está abierto', 'el juego lee el EDIT solo al arrancar y lo reescribe al salir del modo Editar. Si editaste en el juego, tocá "🔄 Recargar" (arriba) antes de seguir acá.'],
      ['Historial', 'cada cambio queda en la lista: lo tachado está deshecho y Ctrl+Y lo vuelve a aplicar.']]],
    ['Otras PC', [
      ['SID', 'cada EDIT lleva el usuario de Windows de la PC donde se creó. Para usarlo en otra computadora poné el SID de esa PC.']]]] },
};
const HELP_LS = 'edit21-help-open';
const helpOpen = (() => { try { return new Set(JSON.parse(localStorage.getItem(HELP_LS) || '[]')); } catch { return new Set(); } })();
function helpBox(id) {
  const h = HELP[id]; if (!h) return '';
  return `<details class="help" data-help="${id}" ${helpOpen.has(id) ? 'open' : ''}><summary><span class="hq" aria-hidden="true">?</span>Cómo funciona ${esc(h.t)}</summary>
    <div class="hb"><p class="hintro">${esc(h.intro)}</p>${h.groups.map(([g, items]) => `<section><h4>${esc(g)}</h4><dl>${items.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>`).join('')}</div></details>`;
}
const helpCard = id => HELP[id] ? `<div class="card helpcard">${helpBox(id)}</div>` : '';
document.addEventListener('toggle', e => { const d = e.target; if (!d.matches || !d.matches('details.help')) return; d.open ? helpOpen.add(d.dataset.help) : helpOpen.delete(d.dataset.help); try { localStorage.setItem(HELP_LS, JSON.stringify([...helpOpen])); } catch { } }, true);
