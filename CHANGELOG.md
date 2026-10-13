# Novedades

Todos los cambios de PES Editor. La misma lista está en la pestaña **Novedades** del editor.

## v0.017 alpha · Módulo de Sider automático y más datos de la base

*13 de octubre de 2026, 05:30 (hora de Argentina)*

Al conectar la carpeta Sider, el editor instala solo el módulo que copia la base del juego, y ahora lee más datos de esa copia.

- **El módulo edit21_db.lua se instala solo** (Archivo). Al tocar "Conectar carpeta Sider", el editor revisa tu Sider: si falta el módulo lo copia a modules\, agrega la línea lua.module = "edit21_db.lua" en sider.ini (guardando una copia de seguridad como sider.ini.bak-pes-editor) y crea la carpeta content\edit21-db. Si ya está pero es una versión vieja, lo actualiza. Es un módulo de solo lectura: no cambia nada del juego.
  1. Tocá "Conectar carpeta Sider" y elegí la carpeta de Sider (la que tiene sider.exe).
  2. Si el editor te pide permiso para escribir en esa carpeta, aceptá: lo necesita para instalar el módulo.
- **Aviso cuando la base no está cargada** (Archivo). Si es la primera vez, si el módulo se acaba de instalar o si en content\edit21-db faltan archivos, el editor muestra qué hacer: abrir PES 2021 con Sider hasta el menú principal, entrar en Partido › Amistoso hasta la elección de equipos y cerrar el juego. Después, "Ya lo hice" vuelve a leer la base. También avisa al arrancar si la copia está incompleta.
- **Módulo v1.3: copia toda la base y avisa si algo falla** (Archivo). Si Windows no le deja escribir en content\edit21-db, el módulo prueba en content\pes-editor-db, anota el error exacto en sider.log y deja un estado.txt; el editor lee ese registro y te dice qué pasó y cómo arreglarlo (por ejemplo, el "Acceso controlado a carpetas" de Windows). Además copia todos los archivos de pesdb que el juego carga (Player, Team, PlayerAssignment, Coach, Stadium, Country, Competition, Tactics…), no solo una lista fija, y escribe index.txt con el nombre, tamaño y hora de cada uno. Los archivos de la elección de equipos (como PlayerAssignment.bin) recién se copian al entrar en el amistoso: por eso ese paso.
- **Planteles de la base para equipos vacíos** (Plantel). Con PlayerAssignment.bin y Team.bin copiados, el editor sabe qué jugadores tiene cada equipo en el Dream Patch y el nombre y la sigla de los 750 equipos. Si un equipo está vacío en tu EDIT, la pestaña Plantel muestra el plantel que trae el parche, con dorsales, fotos y valoraciones.
  1. Abrí un equipo sin plantel (activá "Incluir sin plantel" en la lista).
  2. Tocá un jugador para abrirlo; si no estaba en tu EDIT, el editor ofrece agregarlo con sus habilidades.
  3. Con "Copiar este plantel a mi EDIT" se agregan todos de una vez (hasta 40). Se puede deshacer con Ctrl+Z.
- **Datos más precisos de los jugadores** (Plantel). Los jugadores que están en la base pero no en tu EDIT se leen con todas sus habilidades, altura, edad, nacionalidad y posiciones desde la copia de Player.bin, así que las valoraciones y los valores se calculan igual que para los editados.

## v0.016 alpha · Código ordenado en archivos

*13 de octubre de 2026, 05:00 (hora de Argentina)*

Limpieza interna: el editor pasó de un solo archivo gigante a archivos separados, sin cambiar ninguna función.

- **HTML corto, CSS y JavaScript aparte** (Archivo). La página principal pasó de 17 MB a unos 6 KB: los estilos están en css/editor.css y el código en la carpeta js, un archivo por cada parte (plantel, formación, kits, 3D, reproductor, gráficos, etc.). En tu PC queda "Editor EDIT 21.html" junto a la carpeta "pes-editor-files", que tiene que estar al lado para que funcione.
- **Código revisado** (Archivo). Se revisó que no haya funciones repetidas ni sin uso, y se quitó la que abría carpetas con los botones viejos. El ícono de la pestaña también pasó a ser un archivo.
- **Carga más liviana** (Velocidad). Al estar separado, el navegador guarda cada archivo y en las próximas visitas solo baja lo que cambió. La app instalable guarda todos los archivos para funcionar sin internet.

## v0.015 alpha · YouTube: volumen fijo y video más chico

*13 de octubre de 2026, 04:45 (hora de Argentina)*

Arreglos en los temas de YouTube del reproductor.

- **El volumen se mantiene al cambiar de tema** (Música). Al pasar de un video de YouTube a otro, el nuevo podía arrancar silenciado o con otro volumen: el navegador silenciaba el segundo reproductor porque no lo habías tocado. Ahora todos los videos suenan en un solo reproductor, con el volumen que elegiste. Entre dos videos el pase es: baja, cambia y sube.
- **Video más chico y al costado** (Música). El video ahora mide 200 × 200 (lo mínimo que permite YouTube) y está al lado del reproductor, no arriba, así no tapa la lista de equipos. Con el panel abierto sigue ocupando el lugar de la carátula.
- **En el celular, sin video encima de la página** (Música). En pantallas chicas el video de YouTube no aparece sobre la página: se ve solo con el reproductor abierto. Como YouTube no permite que su audio siga con el video oculto, al cerrar el panel ese tema se pausa y vuelve a sonar al abrirlo. Las canciones propias suenan siempre.

## v0.014 alpha · Una fuente para cada estilo e ícono nuevo

*13 de octubre de 2026, 04:25 (hora de Argentina)*

Cada estilo gráfico trae su propia fuente, y la pestaña del navegador estrena ícono.

- **Fuente según el estilo** (Interfaz). Moderno usa Outfit para el texto y Big Shoulders para los títulos: modernas y fáciles de leer. PES 6 Editar usa QuickExpress, la del estilo PES. Retro usa Pixelify Sans y Silkscreen, letras de píxeles inspiradas en los Winning Eleven de PlayStation 1 pero legibles. Clásico usa Tahoma, como los programas de escritorio de antes. Las fuentes nuevas vienen dentro de la página (licencia libre OFL), así que funcionan sin internet.
- **Cambiar la fuente en cualquier estilo** (Interfaz). La fuente se elige por estilo: lo que cambies en Retro queda para Retro, y lo de Moderno para Moderno. QuickExpress sigue disponible en todos.
  1. Elegí el estilo en "🖥️ Gráficos".
  2. Tocá "🎨 Apariencia" y en "Fuente de la página" elegí otra, o "La del estilo" para volver a la de siempre.
- **Ícono nuevo en la pestaña del navegador** (Interfaz). La pestaña del navegador muestra el logo PES con un borde oscuro, para que se vea tanto con el navegador en modo claro como en oscuro.

## v0.013 alpha · PES 6 más fiel, capitán en Acciones y pestañas sin desplazarse

*13 de octubre de 2026, 04:10 (hora de Argentina)*

El estilo PES 6 Editar se rehízo con la referencia del menú original, y se ordenaron varias partes de la interfaz.

- **Estilo PES 6 Editar rehecho** (Interfaz). Ahora se parece al menú Editar de PES 6: barra de título gris carbón, botones y listas como barras plateadas con bordes redondeados, la opción elegida en amarillo dorado y un fondo ámbar desenfocado con luces, estelas y líneas de puntos. Está hecho a mano, sin imágenes del juego.
- **Sonidos de PES 6** (Interfaz). En el estilo PES 6 suenan los sonidos del menú: "confirmar" al tocar opciones, pestañas y acciones, y "deshacer" al volver, cerrar, apretar Esc o deshacer un cambio (Ctrl+Z).
  1. En "🖥️ Gráficos", "Sonidos de menú" elige si suenan solo en PES 6, siempre o nunca.
  2. Ajustá el volumen ahí mismo.
- **Pestañas sin desplazarse** (Interfaz). La barra de Equipos, Selecciones, Jugadores, etc. es más ancha y usa letra un poco más chica, así entra completa sin tener que desplazarla. En pantallas más angostas se ocultan los avisos de estado para dejar lugar.
- **Apariencia según el estilo** (Interfaz). Con los estilos Clásico, Retro o PES 6 Editar, los colores los pone el estilo: Apariencia solo deja cambiar el tamaño de la letra y la cantidad de efectos, y tiene un botón para volver al estilo Moderno.
- **Sin medidor de fluidez** (Interfaz). Se sacó "Fluidez ahora" del panel de Gráficos.
- **Capitán desde Acciones** (Plantel). La columna "Cap." se reemplazó: el capitán se elige en el menú de la columna Acciones de cada jugador, y se marca con una "C" al lado de su nombre.
  1. En la tabla del plantel, abrí el menú de Acciones del jugador.
  2. Elegí "© Hacer capitán".
- **Video de YouTube arriba del reproductor** (Música). Cuando suena un video de YouTube, se ve chiquito justo arriba del reproductor. Si abrís el panel grande, el video toma el lugar de la carátula.

## v0.012 alpha · Estilo PES 6 Editar y sonidos de menú

*13 de octubre de 2026, 03:30 (hora de Argentina)*

Un modo gráfico nuevo inspirado en el modo Editar de PES 6, con sonidos al moverte por los menús.

- **Modo gráfico "PES 6 Editar"** (Interfaz). Inspirado en el modo Editar de PES 6: fondo azul acero con brillos diagonales, barras y botones plateados, línea naranja arriba de cada panel, y la selección (pestaña, equipo o jugador elegido) resaltada con una barra naranja y dorada inclinada. Los títulos van en cursiva.
  1. Tocá "🖥️ Gráficos".
  2. En "Modo gráfico" elegí "PES 6 Editar".
- **Sonidos de menú** (Interfaz). Pitidos cortos como los de los juegos de esa época: uno suave al pasar el mouse por pestañas, equipos y opciones, otro al tocar, uno de confirmación al guardar y otro para volver o cerrar (también con Esc). Se generan en la página, no son sonidos sacados del juego.
  1. En "🖥️ Gráficos", "Sonidos de menú": "Solo en PES 6" (lo normal), "Siempre" o "Nunca".
  2. Ajustá "Volumen de los sonidos" a tu gusto.

## v0.011 alpha · Fuente nueva, gráficos y YouTube

*13 de octubre de 2026, 03:05 (hora de Argentina)*

La página estrena fuente, se pueden elegir modos y calidad gráfica, y el reproductor suma carátulas automáticas y listas de YouTube.

- **Fuente QuickExpress en toda la página** (Interfaz). La fuente de estilo PES pasó a ser la de toda la página. Se reparó (Chrome la rechazaba por un error interno del archivo), se le agregaron las letras que faltaban para el español y para nombres de jugadores (á, é, í, ó, ú, ñ, ü, ö, à, ã, ç, ¿, ¡, comillas, coma) y se angostó al 80 % para que entre bien en botones y pestañas. Se puede seguir cambiando.
  1. Tocá "🎨 Apariencia".
  2. En "Fuente de la página" elegí "QuickExpress (PES Editor)", "QuickExpress con estela en títulos" (la versión original, con la línea de velocidad en las minúsculas), "Saira (la anterior)", otra fuente de tu PC o "Cargar…" para usar un archivo.
  3. Con Títulos, Texto y Números y datos elegís dónde se aplica.
- **Botón Gráficos** (Interfaz). Al lado de Apariencia hay un botón 🖥️ Gráficos con el modo gráfico y la calidad. También muestra cuántos cuadros por segundo está dibujando la página y sugiere qué calidad usar.
  1. Tocá "🖥️ Gráficos".
  2. Elegí un modo: Moderno, Clásico o Retro.
  3. Elegí la calidad: Baja, Media o Alta.
- **Modos Clásico y Retro** (Interfaz). Clásico imita a los editores de escritorio de antes: grises, botones en relieve, sin brillos ni transparencias (tiene versión clara y oscura). Retro está inspirado en los menús de PES de PS2: azul profundo, amarillo, pestañas inclinadas y líneas de TV vieja. Los dos se combinan con la fuente elegida.
- **Calidad gráfica Baja, Media y Alta** (Velocidad). Baja saca animaciones, desenfoques, sombras y efectos, simplifica la intro y dibuja el 3D a resolución normal: la página anda más liviana en PCs lentas. Media es lo de siempre. Alta sube todo al máximo: el 3D se dibuja con más resolución que la pantalla (supermuestreo), desenfoques y brillos más intensos y más chispas en la intro.
- **Guardar a la altura del logo** (Interfaz). El botón "Guardar en el juego" quedó centrado con el logo, a la derecha de la barra de arriba.
- **Canciones con su carátula** (Música). Al agregar canciones, el editor lee las etiquetas del archivo (MP3, FLAC y M4A): título, artista, año y la carátula que traen adentro. Si una canción no tiene carátula, se arma una con colores propios, una nota musical y sus iniciales.
- **Arreglo del diseño del reproductor** (Música). Los nombres largos ya no desarman la lista y las canciones sin carátula ya no muestran una imagen rota.
- **Listas de YouTube** (Música). Se puede pegar el link de una lista o de un video de YouTube y se suman al reproductor con sus títulos y miniaturas. YouTube no permite ocultar sus videos ni sacarles el audio, así que se ven en una ventanita al lado del reproductor. Funcionan los controles, el volumen y los pases suaves entre temas (el Remix con filtros solo funciona con canciones propias). Hace falta internet y funciona en la versión web; abierto como archivo en la PC, YouTube suele bloquear la reproducción.
  1. Abrí el reproductor y tocá "▶ YouTube".
  2. Pegá el link (por ejemplo youtube.com/playlist?list=…) y tocá "Cargar".
  3. Para quitar un video, tocá la ✕ al lado en la lista.

## v0.010 alpha · Primera versión pública (alpha)

*13 de octubre de 2026, 02:40 (hora de Argentina)*

PES Editor se publica en GitHub como versión alpha: se puede usar desde cualquier PC con Chrome o Edge, sin instalar nada.

- **Disponible en internet** (Archivo). El editor se publica en GitHub Pages. Se abre desde el link, elige tu carpeta Documentos una vez y trabaja con tus archivos sin subirlos a ningún lado: todo se procesa en tu PC.
- **Se puede instalar como app** (Interfaz). Desde Chrome o Edge se instala con su ícono en el escritorio y el menú Inicio, se abre en su propia ventana y funciona sin internet. Las actualizaciones llegan solas al abrirlo con conexión.
  1. Abrí la página en Chrome o Edge.
  2. Tocá el ícono de instalar en la barra de direcciones (o el menú ⋮ → "Instalar PES Editor").
  3. Desde ahí se abre como cualquier programa.
- **Reproductor sin canciones incluidas** (Música). La versión pública no trae los temas de los menús de PES por derechos de autor. El reproductor funciona igual: cada uno agrega sus canciones y carátulas, que quedan guardadas en su navegador.
  1. Tocá el reproductor abajo a la izquierda.
  2. Tocá "＋ Agregar canciones" y elegí tus archivos de música.
- **Novedades con fecha y más detalle** (Interfaz). Las versiones se numeran v0.0NN y cada una muestra fecha y hora. Cada cambio tiene explicación y, cuando hace falta, los pasos para usarlo. Hay buscador, filtros por tema y "Abrir todo / Cerrar todo".
  1. Usá los botones de arriba para ver solo un tema (Kits, Plantel, Música…).
  2. Escribí en el buscador para encontrar un cambio por palabra, por ejemplo "brillo" o "WEPES".

## v0.009 alpha · Reproductor de música

*13 de octubre de 2026, 02:07 (hora de Argentina)*

La música pasó a tener su propio reproductor fijo abajo a la izquierda, con cinco temas de menú de PES de la época de PS2.

- **Reproductor abajo a la izquierda** (Música). Muestra la carátula, el nombre del tema, el juego y el año. Tiene play/pausa, siguiente y una línea de progreso. Tocando la carátula o el título se abre el panel grande; con el botón − queda achicado a un círculo con la carátula, que gira mientras suena.
  1. Tocá la carátula para abrir el panel.
  2. Tocá − arriba del panel para dejarlo como círculo.
  3. Tocá el círculo para volver a la barra.
- **Cinco temas de menú** (Música). PES 3 (Main Menu), PES 4 (Main Menu), PES 5 (Spiral), PES 6 (Existence) y PES 2008 (Go for the Goal). Se guardaron en formato Opus para que el archivo pese menos sin perder calidad notable.
- **Controles completos** (Música). En el panel grande: barra para adelantar o volver, anterior (si el tema ya avanzó más de 4 segundos, vuelve al principio), siguiente, aleatorio, repetir (toda la lista → solo este tema → sin repetir), volumen y silencio. El editor recuerda el volumen, el modo y el último tema que sonó.
- **Pase entre canciones: Corte, Suave o Remix** (Música). Corte pasa directo. Suave baja una canción mientras sube la otra, sin silencio en el medio. Remix funciona como un DJ: a la canción que termina se le cierra el sonido con un filtro y le queda un eco, y la nueva entra sin graves y se va abriendo. La duración del pase se ajusta entre 2 y 14 segundos (cuando tocás "siguiente" a mano, el pase dura como máximo 3,5 segundos).
  1. Abrí el panel grande.
  2. En "Pase entre canciones" elegí Corte, Suave o Remix.
  3. Mové "Duración" para que el pase sea más corto o más largo.
- **Colores que se adaptan** (Música). El reproductor toma el color de la carátula de cada tema (botones, barra y brillo). En pantallas chicas se acomoda como una barra a lo ancho y el panel se abre hacia arriba. También responde a las teclas multimedia del teclado (play, siguiente, anterior).
- **Tus canciones y carátulas** (Música). Podés sumar canciones propias y cambiar la carátula de cualquier tema. Quedan guardadas en tu navegador (no se suben a ningún lado).
  1. Abrí el panel y tocá "＋ Agregar canciones"; podés elegir varios archivos a la vez.
  2. Para quitar una canción tuya, tocá la ✕ al lado en la lista.
  3. Para cambiar una carátula, poné ese tema y tocá "🖼 Carátula". Tocándolo otra vez podés volver a la original.
- **Versión web para GitHub Pages** (Archivo). Además del archivo único, hay una versión separada (index.html + carpeta music) pensada para publicarse en internet. Si la carpeta music no está, el reproductor funciona igual y cada uno agrega sus canciones.

## v0.008 alpha · Música, logo vectorial y fotos en el plantel

*13 de octubre de 2026, 00:07 (hora de Argentina)*

Primera versión con música, el logo nítido a cualquier tamaño y las fotos de los jugadores en la tabla del plantel.

- **Música al abrir la página** (Música). Suena el tema del menú de PES 5. Los navegadores no dejan que una página suene sola hasta que hacés algo, así que si la bloquean empieza con tu primer clic o tecla (por ejemplo al tocar "Elegir mi carpeta Documentos").
- **Logo de la barra en vector (SVG)** (Interfaz). El logo de arriba usa los archivos vectoriales: plateado en modo oscuro y negro en modo claro. Se ve nítido con cualquier zoom y al cambiar de modo pasa de uno al otro con un fundido.
- **Paso suave de la carga a la página** (Interfaz). Cuando termina de cargar el EDIT, el fondo de la introducción se agranda y se desenfoca mientras se desvanece, la página aparece de a poco y el logo vuela hasta su lugar en la barra.
- **Fotos en la tabla del plantel** (Plantel). Cada jugador muestra su foto (la misma minicara que usa la Formación) dentro de un círculo con los colores del equipo. Antes solo aparecían si la Formación estaba en modo Fotos y eran muy chicas. Si un jugador no tiene foto, queda la camiseta. Al pasar el mouse por la fila, la foto se agranda un poco.
  1. Tocá "Conectar carpeta Sider" para que el editor encuentre las minicaras del Dream Patch.
  2. Abrí un equipo: las fotos aparecen solas en la pestaña Plantel.

## v0.007 alpha · Intro con neón y sección Novedades

*12 de octubre de 2026, 23:50 (hora de Argentina)*

La pantalla de carga se volvió más llamativa y se agregó esta sección.

- **Intro con efectos** (Interfaz). El logo entra con un zoom, un destello de luz, rayos que giran detrás, chispas que suben, un piso con grilla tipo estadio de noche y un reflejo debajo.
- **Brillo neón que se prende y se apaga** (Interfaz). El contorno de las letras, las barras y las estrellas se iluminan como un tubo de neón: se enciende con parpadeos, queda prendido, se apaga despacio y vuelve a prenderse. Mientras carga el EDIT late más rápido y al terminar queda fijo. Usa el color de acento de la página (cambia con los colores del equipo). Si Windows tiene activado "reducir animaciones", se muestra fijo y sin efectos.
- **Pestaña Novedades** (Interfaz). Al lado de Archivo. Cuando hay una versión que todavía no viste aparece un punto que titila en la pestaña; se apaga cuando entrás.
- **Botón "Conectar carpeta Sider"** (Kits). El botón que antes decía "Conectar Dream Patch" ahora se llama "Conectar carpeta Sider" y tiene el ícono del martillo y la llave. Hace lo mismo: elegís la carpeta de Sider del Dream Patch y el editor lee kits, caras, escudos y nombres de jugadores.

## v0.006 alpha · El EDIT se encuentra solo

*12 de octubre de 2026, 22:52 (hora de Argentina)*

Ya no hace falta buscar el archivo a mano: el editor lo encuentra en tu carpeta Documentos.

- **Búsqueda automática del EDIT** (Archivo). El editor busca KONAMI\eFootball PES 2021 SEASON UPDATE dentro de Documentos (aunque esté en otra subcarpeta) y abre el EDIT00000000 más reciente. Si hay dos con la misma fecha, prefiere el del Dream Patch (carpeta drmp) antes que el del juego sin parche (save).
  1. La primera vez tocá "📂 Elegir mi carpeta Documentos". La ventana ya se abre en Documentos: solo tocá "Seleccionar carpeta".
  2. En el aviso del navegador elegí "Permitir en cada visita" para que la próxima vez entre directo.
- **Cambiar entre EDITs** (Archivo). En la pestaña Archivo, la tarjeta "Carpeta del juego" lista todos los EDIT encontrados (drmp, save u otras cuentas de Steam) con fecha y tamaño. "Abrir este" cambia al otro; si tenés cambios sin guardar, primero te pregunta.
- **Pantalla de carga** (Interfaz). Mientras busca y lee el EDIT se muestra el logo con los pasos: buscando la carpeta, encontrada, leyendo el archivo (con el tamaño), armando equipos y jugadores, listo.
- **Pestaña WEPES** (Archivo). Muestra los archivos de la carpeta WEPES del juego con miniaturas (png, jpg, dds y ftex). Podés entrar a subcarpetas, ver cada imagen en grande con sus medidas, descargarla y copiar archivos nuevos adentro. Si la carpeta no existe, aparece un botón para crearla.
  1. Abrí la pestaña WEPES.
  2. Tocá "Agregar archivos…" para copiar imágenes o texturas adentro.
  3. Tocá un archivo para verlo en grande.
- **Botones quitados** (Archivo). Se sacaron "Abrir carpeta" y "Abrir archivo" de la barra. Si el navegador no permite leer carpetas (Firefox o Safari), la pantalla de carga ofrece elegir el EDIT a mano.

## v0.005 alpha · Logo, cabecera nueva y fuente propia

*12 de octubre de 2026, 22:26 (hora de Argentina)*

El editor estrena logo, se ordenó la barra de arriba y se puede usar cualquier fuente para toda la página.

- **Logo PES Editor** (Interfaz). El logo de PES Editor reemplaza el título de texto "Editor EDIT 21" en la parte de arriba.
- **Logo para modo claro y oscuro** (Interfaz). Cada modo tiene su versión del logo, sin transparencia ni bordes redondeados, pintada sobre el color real de la barra.
- **El logo vuelve al inicio** (Interfaz). Tocar el logo te lleva a la lista de equipos y sube al principio de la página.
- **Fuente propia para toda la página** (Interfaz). Podés elegir una fuente instalada en tu PC o cargar un archivo de fuente, y decidir si se aplica a títulos, texto y/o números. La fuente cargada queda guardada en el navegador.
  1. Tocá "🎨 Apariencia".
  2. En "Fuente de la página" elegí una de la lista o tocá "Cargar…" y elegí un archivo .ttf, .otf, .woff o .woff2.
  3. Con los botones Títulos, Texto y Números y datos elegís dónde se usa. Abajo ves una vista previa.
- **Barra de arriba ordenada** (Interfaz). El buscador quedó al lado del logo, con "Editor EDIT 21 · eFootball PES 2021" a su derecha; los botones quedaron debajo y "Guardar en el juego" a la derecha.

## v0.004 alpha · Brillo, cámara, tela y fondo HDRI

*12 de octubre de 2026, 22:11 (hora de Argentina)*

El estudio de kits se acercó a cómo se ve la camiseta en el juego.

- **Brillo desde el alfa de la textura** (Kits). En la textura del kit (por ejemplo u0100p1), el canal alfa marca cuánto brilla cada parte: blanco brilla más, negro menos. El visor 3D lo aplica como el juego y se puede ver y modificar.
  1. En Estudio de kits abrí la vista del brillo.
  2. Ajustá nivel y contraste, o invertilo.
  3. Pintá con el pincel sobre las zonas que querés más o menos brillantes; "Deshacer" vuelve atrás.
  4. Al guardar se reconstruye el alfa en la resolución original y se hace una copia de respaldo del archivo anterior.
- **Cambios con animación y más control de cámara** (Kits). Al cambiar opciones de la vista, el 3D se refresca con una transición. Hay vistas fijas (frente, espalda, costados, tres cuartos, arriba, cerca), se puede acercar, mover la cámara y usar el teclado.
- **Uniones del modelo arregladas** (Kits). Las partes del modelo (cuerpo, mangas, cuello y short) comparten las normales en los bordes, así no se ven cortes ni cambios de luz en las uniones.
- **Tela y relieve (normal map)** (Kits). Se puede elegir un tipo de tela (lisa, malla, piqué, panal, acanalada, sarga, jacquard o algodón retro) y el relieve de los dibujos del kit. El editor genera el normal map que el juego aplica sobre la camiseta. El escudo con relieve depende de que el juego lo cargue.
- **Elegir cuello y short** (Kits). Los selectores muestran cada modelo en una vista previa que gira; "Usar este cuello" cambia el config.txt del kit.
- **Luz y fondo HDRI** (Kits). Los controles de luz se rediseñaron, hay una esfera para mover la dirección del sol y se puede cargar un fondo HDRI propio que también ilumina la camiseta.

## v0.003 alpha · Estudio de kits estilo PES Master

*12 de octubre de 2026, 21:28 (hora de Argentina)*

Se armó un estudio para ver y editar los kits del kit-server del Dream Patch.

- **Visor 3D con los modelos reales** (Kits). La camiseta, las mangas, más de 100 cuellos, los 16 shorts y las medias salen del CometKIT previewer, con iluminación tipo estadio.
- **Editar el config.txt sin escribir** (Kits). Los valores del config del kit (cuello, short, colores y demás) se cambian con controles y el 3D se actualiza al instante.
- **Subir texturas al kit-server** (Kits). Podés cargar la textura del kit, el normal map y las fuentes (nombre, número de espalda, de pecho y de short). El editor las convierte al formato del juego (FTEX) y guarda una copia del archivo anterior.
  1. Conectá la carpeta Sider.
  2. Abrí el equipo y entrá a "Estudio de kits".
  3. En cada casillero de textura tocá cargar y elegí una imagen.
- **Generador de fuentes** (Kits). Arma la textura de letras o números con la fuente, los colores, los bordes y la sombra que elijas, respetando las casillas de las plantillas del juego.

## v0.002 alpha · Más rápido y visor 3D

*12 de octubre de 2026, 20:51 (hora de Argentina)*

Optimización general sin quitar animaciones.

- **Abrir equipos es casi instantáneo** (Velocidad). Abrir un equipo pasó de unos 3 segundos a 0,3. Las listas largas dibujan solo lo que está en pantalla y los menús de cada fila se completan recién cuando los abrís.
- **Maqueta del kit y visor 3D** (Kits). La maqueta plana del kit se corrigió y se sumó el visor 3D.
- **Ayudas más claras** (Interfaz). Cada sección tiene un recuadro de ayuda que se abre y se cierra, con explicaciones más largas. El editor recuerda cuáles dejaste abiertos.

## v0.001 alpha · Plantel como tabla, Apariencia y valoración animada

*12 de octubre de 2026, 19:11 (hora de Argentina)*

El plantel se convirtió en una tabla de datos, se puede personalizar el aspecto del editor y los cambios de valoración se ven mejor.

- **Valoración nueva revelada** (Plantel). Al aplicar cambios de valoración, la nueva cifra aparece con una animación de revelado en lugar de flechas +N, así se ve directamente cómo quedó cada jugador.
- **Tabla del plantel** (Plantel). Se ordena tocando el título de cada columna, se filtra por texto, por posición (ARQ, DEF, MED, DEL) y por situación (titulares, banco, reserva, sin proteger). Hay tres densidades de filas, elección de columnas y exportación.
  1. Tocá el título de una columna para ordenar; tocalo otra vez para invertir.
  2. Marcá varias filas con la casilla para aplicar una acción a todas juntas.
  3. "Columnas" muestra u oculta datos; "Exportar" descarga la lista.
- **Panel de Apariencia** (Interfaz). Mezcla la paleta del editor con los colores del equipo que abrís: modo claro u oscuro, paleta base, qué color del equipo manda, cuánto se mezcla, fondos teñidos, esquinas y tamaño de letra.
  1. Tocá "🎨 Apariencia".
  2. Mové "Mezcla con el equipo" para que el editor tome los colores del club.
  3. "Volver a lo original" deshace todo.
