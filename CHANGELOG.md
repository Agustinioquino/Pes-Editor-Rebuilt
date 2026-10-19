# Novedades

Todos los cambios de PES Editor Rebuilt. La misma lista está en la pestaña **Novedades** del editor.

## v0.063 alpha · Fuentes para el Sider de otra persona

*19 de octubre de 2026, 16:35 (hora de Argentina)*

El .zip de una fuente sale con la carpeta del equipo y la textura de letras de quien la va a usar, aunque su patch tenga otra estructura.

- **Fuentes para el Sider de otra persona** (Kits). En Kit Studio Pro → 🔤 Fuentes, paso 4, 📨 Para el Sider de otra persona lee su sider.log, su map.txt o el config.txt de su kit. El .zip sale con su carpeta del equipo (por ejemplo Bundesliga (Germany)\Schalke en vez de la tuya) y con la textura de letras que ya usa cada kit (por ejemplo Font White), así no tiene que tocar su config.txt. Ya no va tu config.txt en un .zip para otra persona, y el LEEME dice para qué Sider se armó.

## v0.062 alpha · Tu estadio con fotos del juego y fuentes desde cualquier imagen

*19 de octubre de 2026, 15:45 (hora de Argentina)*

El estadio local se ve como el menú del juego, las fuentes se hacen en cuatro pasos y desde una foto, y la tabla del plantel se edita en la misma celda.

- **Estadio local, como en el juego** (Interfaz). El equipo tiene su propia pestaña Estadio local, con el mismo menú que "Opciones de estadio local" del juego y una foto de vista previa del estadio, el césped, la portería o la red. Están los 31 estadios del menú del juego en su orden, también los 14 con licencia, y las opciones detalladas: césped, color del campo, color de los asientos, estilo de la portería, diseño de la red y sus colores. La otra pestaña pasa a llamarse Rivales y banderas.
- **Fuentes en cuatro pasos** (Kits). Kit Studio Pro → 🔤 Fuentes es ahora un camino de cuatro pasos: Fuente, Estilo, Kit y Al juego, con animaciones. En Kit, Saltar este paso deja acomodar el nombre y el dorsal dentro del juego, y 🎯 Precisa muestra la espalda de la camiseta plana para ubicarlos píxel por píxel.
- **Letras de una foto** (Kits). 📷 Letras de una foto saca el abecedario de cualquier imagen, en cualquier orden: reconoce cada letra por su forma y marca con borde punteado las dudosas. Lee PNG, JPG, WEBP, GIF, BMP, AVIF, SVG, PSD y los .dds/.ftex del juego, y también se puede pegar con Ctrl+V. Sin caracteres especiales deja solo las letras simples (la á como a, la Ø como O). El .zip trae un tutorial paso a paso para meter la fuente en el juego.
- **Editar en la tabla del plantel** (Plantel). Un clic en el nombre, la posición, la edad, la altura, la nacionalidad o el pie de un jugador abre el campo en la misma celda. Enter guarda, Esc cancela y Tab pasa al siguiente dato; cada cambio se deshace con Ctrl+Z.
- **CSV para PES2020Editor** (Archivo). Jugadores, equipos y la lista equipo–jugadores se exportan con las mismas columnas y el mismo formato que PES2020Editor: desde Archivo, desde el menú Exportar del plantel o con ⬇ CSV para PES2020Editor en cada jugador.

## v0.061 alpha · Fuentes que se ven bien en el juego, y por qué a veces no

*18 de octubre de 2026, 16:30 (hora de Argentina)*

Fuentes revisa por qué el nombre de un kit sale mal en el juego, lo arregla con un clic y explica cómo inyectar la fuente a mano.

- **Revisar este kit en el juego** (Kits). En Kit Studio Pro → 🔤 Fuentes, 🩺 Revisar este kit en el juego lee sider.log y la carpeta del kit y dice qué falta: KitPos no cargó, el kit no le pide la fuente, las letras están en casillas de plantilla, el .dds y el .ftex no coinciden o el juego no se abrió desde que guardaste. Cada problema trae su botón para arreglarlo.
- **Las letras en su lugar** (Kits). Si la textura del kit tiene una letra por casilla de 256 px (como la plantilla de Photoshop), Reacomodar las letras la carga como plantilla y al guardar cada mayúscula y minúscula queda donde la busca KitPos. Así se arregla el nombre que salía en la espalda como una hoja de letras chiquitas y amontonadas.
- **Cada kit con su tabla** (Kits). Guardar deja junto a la textura un kitpos_letras.txt con la misma tabla de minusculas.txt, además de NameLower = 1. Así el kit muestra las minúsculas aunque el navegador no deje guardar kitpos_slots.ini o la carpeta se copie a mano a otro Sider.
- **Solo mayúsculas** (Kits). Nuevo formato Solo mayúsculas: una textura de 4096×1024 con el formato del juego, que se ve con cualquier Sider y sin KitPos, por ejemplo con otro ejecutable o en Football Life.
- **Guía para inyectar a mano** (Kits). Una guía dentro de Fuentes explica cómo llega la fuente al juego, cómo copiarla a mano paso a paso, por qué a veces funciona y a veces no, y con qué juegos y mods es compatible. Con un ejemplo del nombre bien y del nombre amontonado.
- **Escudos en todas las pantallas** (Kits). El escudo propio se guarda en sus 12 versiones, también la e_<id>_r_b.png que faltaba, y la versión HD queda en 1028×1044 como máximo. Antes algunos escudos se veían mal en ciertas pantallas del juego.

## v0.060 alpha · Fuentes con minúsculas que el juego sí lee

*18 de octubre de 2026, 02:15 (hora de Argentina)*

El creador de fuentes guarda la textura igual que un kit que ya muestra minúsculas y tildes en el juego, y la baja en un .zip por uniforme.

- **Fuentes con el formato que lee el juego** (Kits). Fuentes pone cada letra en el lugar y con el ancho de content\kitpos\minusculas.txt, la tabla general de KitPos: 371 letras con mayúsculas, minúsculas, tildes, Ñ, Europa central, cirílico y griego, en una textura de 4096×4096. Antes cada fuente armaba su propio orden y en el juego las letras podían salir mezcladas.
- **El archivo se llama como el kit** (Kits). Guardar en la carpeta del kit crea la textura con el nombre del kit (por ejemplo u2689p1_name.dds y .ftex) y apunta NameFontFile a ella, en vez de pisar una textura compartida como font white. También activa NameLower = 1 para ese kit en kitpos_slots.ini y, si el kit tenía un kitpos_letras.txt viejo, lo guarda como .bak-edit21 y lo saca.
- **Un .zip por uniforme** (Kits). Descargar .zip arma las carpetas como en Sider: la del kit elegido, o la de cada kit con Todos, con su textura, más minusculas.txt, la línea de NameLower para kitpos_slots.ini y un LEEME. Se descomprime directo en la carpeta de Sider.

## v0.059 alpha · Los kits en 3D, acomodados como en el juego

*17 de octubre de 2026, 20:50 (hora de Argentina)*

Kit Studio Pro junta el Editor y el visor 3D, y el nombre y los números se ven y se mueven donde los pone el juego.

- **Editor y visor 3D juntos** (Kits). Kit Studio Pro junta el Editor y el visor 3D en una sola sección: el kit en grande al medio y al costado las pestañas Dorsales, Luz, Imagen y Tela. Un botón a la izquierda esconde la lista de equipos para ver el kit a lo ancho.
- **Menú del nombre y los números en el 3D** (Kits). Click en el nombre o en un número del kit y al lado se abre un menú de vidrio con barras para altura, tamaño, ancho y curva. Se cierra con un click afuera o con Esc. El número del pecho y el del short se agregan o se quitan, y el dorsal cambia entre 7 y 07.
- **Nombre y números donde los pone el juego** (Kits). El nombre, el dorsal, el número del pecho y el del short se dibujan en el 3D en el mismo lugar y tamaño que en el juego, medidos con el panel de KitPos. Debajo del visor una etiqueta dice si las posiciones salen del config.txt o de KitPos. El nombre usa la letra del kit, también las fuentes de KitPos (kitpos_letras.txt o content\kitpos\minusculas.txt).
- **Jugadores de la base al EDIT, completos** (Plantel). Los jugadores que pasan de la base del juego a tu EDIT (con la media por rendimiento o con Agregar a mi EDIT) llegan con sus posiciones, pie hábil, físico, habilidades, jugadas COM y estilo, y los que habían pasado incompletos se arreglan solos. Nuevo: Pasar toda la base al EDIT, Volver a la base del juego y un aviso si la base del juego cambia.
- **Cambiar de juego desde Buscar EDIT** (Archivo). En la ventana 📂 Buscar EDIT, Cambiar de juego vuelve a cargar el EDIT y la base, o pasa de Football Life a PES 2021 y al revés. El editor recuerda la carpeta Sider de cada juego.

## v0.058 alpha · Las fuentes pasan a Kit Studio, con sus requisitos

*16 de octubre de 2026, 12:30 (hora de Argentina)*

El creador de fuentes de la camiseta ahora es una sección de Kit Studio Pro, y te dice qué necesita el juego para mostrarla.

- **Fuentes dentro de Kit Studio Pro** (Kits). Kit Studio Pro ahora tiene tres secciones: Uniformes, Editor y 🔤 Fuentes. Fuentes trabaja con el equipo que estás viendo y 👁 Ver en el Editor salta al kit en 3D con la fuente puesta. Los equipos sin carpeta de kits también pueden crearla y bajarla en un .zip. La pestaña Fuentes de arriba ya no está.
- **Requisitos para ver la fuente en el juego** (Sider). Arriba de Fuentes, un cuadro con lo que necesita el juego: Sider con kserv, KitPos 6.4 o más nuevo (instalarlo o descargar kitpos.lua), sus líneas en sider.ini (para copiar o arreglar con un clic) y las minúsculas activadas en kitpos_slots.ini. Con la carpeta Sider conectada, cada uno dice si está listo o falta.
- **Los módulos de Sider vuelven solos** (Sider). Si sider.ini carga edit21_db.lua y el archivo no está en modules (o es viejo), el editor lo vuelve a poner al abrirse. En la pestaña Sider, "Falta el archivo en modules" trae el botón Instalar el archivo para edit21_db.lua y kitpos.lua. Si el archivo desaparece al guardarlo, avisa que suele ser el antivirus.

## v0.057 alpha · Tu fuente en la camiseta, ubicada a mano

*15 de octubre de 2026, 21:30 (hora de Argentina)*

Los nombres de las camisetas ahora pueden llevar minúsculas, tildes y cualquier tipografía, y el nombre y los números se acomodan arrastrándolos sobre el kit en 3D.

- **Pestaña Fuentes** (Kits). Un creador de fuentes para el nombre de la camiseta: elegís una tipografía o subís un .ttf, .otf o .woff, le das estilo (colores, degradado, bordes, sombra) y elegís los idiomas (acentos, Europa central, cirílico, griego). Se ve en vivo sobre la camiseta y en la espalda del kit. Un botón la guarda en la carpeta del kit (textura .dds y .ftex y kitpos_letras.txt), otro la baja en .zip y otro la deshace. Hace falta KitPos 6.4 o más nuevo en Sider.
- **Plantilla de Photoshop** (Kits). Las letras se pueden dibujar a mano en una plantilla de Photoshop, una por casilla de 256 px, y cargarla como PNG transparente o .psd: cada letra pasa tal cual a la textura del juego, con sus colores, y las casillas vacías salen de la tipografía elegida. También se pueden bajar las letras de una tipografía ya puestas en la plantilla, para retocarlas, y las guías.
- **Mover el nombre y los números con el mouse** (Kits). En Kit Studio Pro → Editor, la vista ✥ Ubicar muestra la espalda, el frente y el short en 3D. Agarrás el nombre, el dorsal, el número del pecho o el del short y lo movés; las esquinas cambian el tamaño, los costados el ancho y la manija de arriba el arco del nombre. También con la rueda y el teclado. Sin KitPos se mueve con los pasos del config.txt; con KitPos queda el valor exacto.
- **Posición libre con KitPos** (Sider). El panel 📐 Posición libre ajusta sin pasos la altura, el tamaño, el ancho, la separación y el arco del nombre, y los números de la espalda, el pecho y el short, para un kit o para todo el equipo. Se guarda en content\kitpos\kitpos_slots.ini, el mismo archivo que usa el panel de KitPos en el juego. Si KitPos no está en Sider, un botón lo instala y lo agrega a sider.ini (con copia).
- **Mayúsculas y minúsculas en PES 6** (Interfaz). En el modo gráfico PES 6, los campos donde se escribe usan una letra con minúsculas reales, así se ve cómo queda el nombre. Si Bloq Mayús está activado aparece un aviso, y si un nombre quedó todo en mayúsculas, el perfil del jugador ofrece pasarlo a mayúsculas y minúsculas.
- **Camiseta del club y de la selección, y el peso** (Plantel). En Jugadores → Perfil, el nombre en la camiseta del club y el de la selección van por separado, cada uno con Usar apellido: el EDIT guarda los dos (por ejemplo, GAKU en el club y SHIBASAKI en Japón). Al pasar un jugador de la base del juego al EDIT se copian las dos camisetas y el peso, que antes quedaba en 0; los que ya habían quedado en 0 muestran un botón para usar el peso de la base. La ficha Del juego también muestra el peso.

## v0.056 alpha · ¡Abrí el sobre! Jugadores renovados

*15 de octubre de 2026, 05:40 (hora de Argentina)*

La pestaña Jugadores se renovó: un perfil más claro, la foto grande con los colores de sus posiciones, Habilidades y skills en una sola pestaña, y una vista FIFA con su carta y un sobre para abrir.

- **Perfil más claro** (Plantel). Nombre y apellido van por separado (el juego los guarda juntos, el editor los une solo), el nombre en camiseta tiene el botón Usar apellido, el equipo y la selección se ven con su escudo y dorsal, y las estrellas y la actitud se eligen con colores.
- **Foto grande con el color de sus posiciones** (Interfaz). La foto del jugador es más grande, con su posición arriba a la izquierda y las otras posiciones donde puede jugar al costado. El marco toma los colores de sus posiciones (amarillo portero, azul defensa, verde medio, rojo delantera): cuanto mejor juega en cada una, más lugar ocupa su color.
- **Habilidades y skills** (Plantel). Habilidades y Especiales ahora son una sola pestaña. Cada habilidad tiene su barra con color, − y +, el promedio de su grupo y un ⓘ que explica qué hace. Cada habilidad especial y cada estilo de la IA tiene su ícono y su explicación al pasar el mouse.
- **Ver como FIFA** (Interfaz). Un botón muestra al jugador como una carta de FIFA: oro, plata o bronce según su media, especial desde 80 y carta ícono para las leyendas. En PES 6 y Clásico la carta es como la de FIFA 15; en Moderno y Retro, como las de ahora. Es solo para mirar: las medias salen de sus habilidades de PES.
- **Abrí el sobre** (Interfaz). La primera vez que ves a un jugador en la vista FIFA aparece un sobre: pasá el mouse por arriba para rasgarlo. Salen la bandera, la posición y el escudo, y después la carta, con confeti, sonido y la tribuna: ovación para las medias altas, silbidos para las bajas. Se puede saltar, repetir o apagar, y el sonido también.
- **Nombres más claros** (Interfaz). Posición registrada ahora se llama Posición natural. En inglés las posiciones usan las siglas de PES (CF, AMF, CB…); en español quedan como siempre (CD, MO, DEC…).
- **Fichas de Del juego** (Plantel). Arreglado: en Jugadores → Del juego, la ficha dejaba de verse desde el segundo jugador que tocabas.

## v0.055 alpha · Tus ideas, en el editor

*15 de octubre de 2026, 04:30 (hora de Argentina)*

Al lado de Novedades hay una pestaña nueva, Ideas: todo lo que viene y lo que piden los usuarios, con cuánto avanzó cada cosa. Y desde ahí podés mandar tu idea o avisar de un fallo.

- **La pestaña Ideas** (Interfaz). Cada idea tiene su barra de avance con el porcentaje, su estado (ya está, en prueba, en camino o pensada), su prioridad, su dificultad y si la pidieron usuarios. Se filtra por pedidos de usuarios, en prueba, en camino o ya están, y se ordena por prioridad, las más fáciles primero o las más avanzadas.
- **Mandá tu idea o avisá de un fallo** (Interfaz). Los botones Tengo una idea y Algo no anda abren un cuadro para escribirlo. Enviar por GitHub abre la página con tu texto listo (en los fallos se suman la versión, el navegador y el modo gráfico), y si no tenés cuenta, Copiar para Discord o WhatsApp lo deja listo para pegar en el grupo.
- **Lo que pidieron los usuarios** (Interfaz). Editar jugadores en la Liga Master y pasar el EDIT a la base del juego (y al revés) ya están en la lista con su avance. Cambiar el escudo del equipo y elegir botines, guantes y ropa térmica ya existen: su tarjeta dice dónde encontrarlos.
- **En desarrollo, con los mismos datos** (Interfaz). El cartel En desarrollo usa la misma lista que la pestaña Ideas, así los porcentajes son iguales en los dos lugares, y tiene un botón 💡 Ideas para ver todo.

## v0.054 alpha · El editor, ahora todo en inglés

*15 de octubre de 2026, 01:45 (hora de Argentina)*

Con el editor en inglés ya no quedan textos en español: la pestaña Sider, las minifaces, los escudos, el Kit Studio Pro y los avisos salen en inglés.

- **Inglés completo** (Interfaz). Se tradujeron unas 220 frases que seguían en español en la versión en inglés: las descripciones de los módulos y carpetas de la pestaña Sider, los mensajes de minifaces, escudos 2K, Kit Studio Pro y kits en .zip, el detalle de la forma de cada jugador, el aviso de cambios sin guardar, la convocatoria y algunos países.
- **Los estadios conservan su nombre** (Interfaz). En inglés, los estadios del juego como el Estadio del Tauro ya no se traducen a medias: quedan con su nombre original.

## v0.053 alpha · Miles de escudos de PES Logos, a un clic

*14 de octubre de 2026, 23:45 (hora de Argentina)*

El creador de escudos ahora busca en PES Logos, con miles de escudos hechos para el juego: elegís uno y queda listo para guardar. Y los equipos que se veían sin escudo lo buscan solos ahí.

- **Buscar escudos en PES Logos** (Plantel). En Datos y colores, el creador de escudos tiene el botón 🔎 Buscar en PES Logos. Busca con el nombre del equipo (lo podés cambiar) y muestra los escudos con su año, o si son Retro o Especiales. Al tocar uno, el editor lo baja en su tamaño original y lo carga como escudo nuevo, con un enlace a su página en PES Logos.
- **Los escudos que no cargaban, desde PES Logos** (Interfaz). Si un equipo no tiene escudo en la carpeta Sider y tampoco aparece en TheSportsDB ni en Wikipedia, el editor lo busca en PES Logos. Solo usa uno si el nombre coincide de verdad (si hay dos clubes posibles, no adivina) y prefiere el escudo actual a los Retro o Especiales. Los equipos que antes quedaron sin escudo se buscan una vez más.

## v0.052 alpha · Minifaces al juego y escudos mejorados

*14 de octubre de 2026, 23:30 (hora de Argentina)*

Ahora podés poner la cara de cualquier jugador en el juego: subís una foto, la IA le saca el fondo y el editor la guarda como miniface. Y el creador de escudos suma 2K, vista previa y versiones para fondos oscuros y claros.

- **Minifaces al juego** (Plantel). En la ficha de cada jugador hay una pestaña 🙂 Miniface: subís una foto PNG o JPG y el editor arma la miniface del juego (.dds DXT3 con transparencia y el ID del jugador). El fondo se quita con IA en un clic (la primera vez baja el modelo de internet), por color o tocando con la varita. La guía de la cabeza ayuda a encuadrar y el tamaño recomendado es 2048×2048.
- **La miniface va donde Sider la lee** (Sider). Se guarda en livecpk\PESEditor-Minifaces y esa carpeta se agrega primera en sider.ini (con copia sider.ini.bak-pes-editor). Si el navegador no deja tocar sider.ini, la guarda en una carpeta que Sider ya lee. Borrar devuelve la miniface que había antes.
- **Escudos en HD normal o 2K (experimental)** (Plantel). El creador de escudos tiene Calidad: HD normal copia la medida de los escudos que ya hay en la carpeta, y 2K usa 512×520, 1028×1044 (_l) y 2056×2088 (_ll). 2K es experimental: en las pruebas el juego bajó 3 o 4 FPS y tuvo lag en algunos menús.
- **Vista previa y versiones para fondos oscuros y claros** (Plantel). Al cargar la imagen se ven los 11 archivos con su medida. Si el escudo tiene mucho negro, pregunta si r_b (fondos oscuros) aclara los negros con un fileteado claro; si tiene mucho blanco, si r_w (fondos claros) baja los blancos con un borde oscuro suave. En Dónde y cómo se guarda se explica qué significa cada letra.
- **El escudo va a la carpeta correcta** (Plantel). El escudo se guarda en la carpeta que Sider ya lee con escudos, y la carpeta PESEditor-Escudos ya no queda vacía cuando el navegador no deja tocar sider.ini.
- **Las copias .bak-edit21 se borran solas** (Archivo). Las copias de escudos, minifaces y kits sirven para deshacer mientras el editor está abierto. La próxima vez que lo abrís, con la carpeta Sider conectada, se borran. sider.ini.bak-pes-editor no se toca.
- **Fotos de jugadores: más rápidas y pegando links** (Plantel). La búsqueda usa el nombre completo de ESPN y Wikipedia en el idioma del jugador, así encuentra más jugadores. En Formación (vista Fotos) se puede pegar un link de SoFIFA, Sortitoutsi, PES Master, SoccerWiki o de cualquier imagen.
- **En desarrollo con barras de avance** (Interfaz). El cartel En desarrollo muestra cuánto falta de cada cosa con una barra de color y su porcentaje, marca las de prioridad alta y tiene un botón para ocultarlo.
- **Texto metálico en el modo PES 6** (Interfaz). En el modo gráfico PES 6 los textos de las tarjetas tienen un brillo metálico más marcado y se siguen leyendo bien.

## v0.051 alpha · La app de Windows ya se deja cerrar

*14 de octubre de 2026, 19:35 (hora de Argentina)*

Con cambios sin guardar, la X de la app para Windows no cerraba la ventana ni avisaba por qué. Ahora muestra un cuadro con tus opciones y después cierra.

- **Salir del editor** (Interfaz). Si tocás la X de la app con cambios sin guardar, aparece el cuadro "Salir del editor": guardar en el caché (vuelven solos la próxima vez que abras ese EDIT), guardar en el juego, salir sin guardar o cancelar. Antes la ventana se quedaba abierta sin decir nada.
- **Recargar, actualizar y cambiar de idioma** (Archivo). En la app, F5 o Ctrl+R muestran el mismo cuadro para recargar. Cambiar de idioma guarda tus cambios en el caché y vuelven solos, y Actualizar sin guardar ya no se queda trabado.

## v0.050 alpha · ¡Football Life 2026 es compatible!

*14 de octubre de 2026, 16:45 (hora de Argentina)*

El editor reconoce Football Life 2026: lee su base directo de los archivos del juego, muestra las valoraciones con su tope (104) y encuentra su EDIT. Además, un botón para buscar el EDIT a mano.

- **La base del juego, sin abrir el juego** (Archivo). Al conectar la carpeta del juego, el editor lee la base directo de los data_s2526*.cpk de download, en el orden de spFileList.bin (gana la actualización más nueva), con las carpetas de Sider encima. 29.413 jugadores y 749 equipos, clásicos incluidos. Sirve también para PES 2021 (Data y download).
- **Valoraciones como las muestra cada juego** (Plantel). PES 2021 llega a 109 y Football Life a 104: el editor se fija qué juego es por la carpeta del EDIT (…\2026\save en Football Life) o por el .exe conectado con Sider, y usa ese tope.
- **Buscar EDIT** (Archivo). Un botón al lado de Recargar lista los EDIT encontrados para pasar de uno a otro, busca de nuevo, deja elegir la carpeta del EDIT o abrir el archivo a mano.
- **Football Life en la pestaña Sider** (Sider). El chip ⚽ Football Life 2026 aparece con el Sider de SiderAddons; el módulo edit21_db funciona igual en ese juego.
- **Ventanita de música que se mueve** (Música). La ventanita de Spotify y YouTube se arrastra desde "⠿ mover" y se agranda desde la esquina; queda guardada.
- **En desarrollo se minimiza** (Interfaz). El cartel En desarrollo tiene un botón para dejarlo como pestañita.

## v0.047 alpha · Kit Studio Pro: cargá kits desde un .zip (versión preliminar)

*14 de octubre de 2026, 16:00 (hora de Argentina)*

⚠️ Versión preliminar: todo esto es nuevo y se probó poco con juegos reales, así que es probable que tenga fallos; hacé una copia de content\kit-server antes de cargar o reemplazar kits. El Estudio de kits ahora es el Kit Studio Pro, en dos partes (Uniformes y Editor), y un kit bajado de internet se carga arrastrando su .zip.

- **Arrastrá el .zip y elegí el puesto** (Kits). Soltá el .zip del kit (o sus texturas sueltas: .ftex, .dds, .png) en Uniformes. Un cuadro muestra qué trae (kit, normal map, brillo, números, letras del nombre) y elegís el puesto: titular (p1), suplente (p2), tercera, cuarta o arquero. Lo que falte se genera genérico, todo se convierte a FTEX y se escriben solos el config.txt (con los colores leídos de la textura si no trae uno) y el order.ini.
  1. Abrí el equipo, la pestaña Kit Studio Pro y quedate en Uniformes.
  2. Arrastrá el .zip a la zona punteada (o tocala para elegirlo).
  3. Elegí el puesto y tocá "Cargar al kit-server".
  4. Abrí el juego de nuevo (o en kserv apretá [0] para recargar el mapa).
- **Si el puesto ya tiene kit: reemplazar o agregar** (Kits). Si elegís un puesto en uso, el cuadro pregunta si reemplazar el kit de ahora (lo de antes se guarda en _borrados) o agregarlo como kit nuevo (p3, p4, g2…), y el orden se acomoda solo.
- **Los kits que viven en los .cpk** (Kits). Si el equipo no tiene carpeta en el kit-server, sus kits están cifrados dentro de los .cpk del juego y no se pueden abrir desde el editor. El Kit Studio Pro lo dice y deja cargarle un kit por Sider igual: crea la carpeta del equipo y su línea en map.txt.
- **Uniformes y Editor** (Kits). Uniformes muestra todos los kits del equipo con sus texturas en miniatura y el orden del juego; desde ahí se edita, se sube en el orden, se duplica (⧉), se copia un kit de jugador como arquero (🧤) y se borra (🗑, la carpeta queda en _borrados). Editor es un kit a pantalla ancha, con Ampliar, pantalla completa y Vista del juego.
- **Mové el nombre y los números sobre el modelo** (Kits). En el visor 3D, el nombre y los números de espalda, pecho y short se arrastran directo sobre la camiseta y la rueda encima les cambia el tamaño; los valores van al config.txt respetando el rango de cada kit. Las posiciones salen de una cuenta aproximada, todavía sin calibrar contra el juego: puede haber diferencias.
- **Texturas completas, color del short y textura que no se pierde** (Kits). Las texturas se cargan a su resolución completa (hasta 4096). El generador de fuentes tiene "Número del short con otro color". La textura subida a un kit ya no desaparece al cambiar de kit y volver.

## v0.046 alpha · La pestaña Sider entiende tu juego

*14 de octubre de 2026, 12:45 (hora de Argentina)*

La pestaña Sider ahora dice qué hace cada carpeta y cada módulo, se actualiza al instante al agregar o quitar, encuentra los módulos en subcarpetas y sugiere el nombre correcto si uno está mal escrito.

- **Agregar, quitar y mover se ve al instante** (Sider). Al tocar "＋" en una carpeta de livecpk o en un módulo, aparece al final de su lista, resaltado, con un aviso, y el botón desaparece. Quitar, mover con las flechas, deshacer y aplicar el texto también se ven en el momento. Antes los cambios estaban, pero la lista no se actualizaba hasta volver a leer el archivo.
- **Qué hace cada carpeta y cada módulo** (Sider). Cada carpeta de contenido, cada módulo y cada carpeta de content tiene una línea que dice qué cambia en el juego. Hay más de 40 categorías (animaciones, banners de hinchadas, escenas, público, logos de manga, Liga Master, jugabilidad, cámaras…) y más de 60 módulos conocidos. Las cámaras se describen por el nombre: penaltyCam es la cámara de penales. Si un módulo no está en la lista, se usa lo que dice su propio archivo.
- **Mira adentro de cada carpeta** (Sider). Además de las rutas conocidas de PES 2021, busca nombres de carpeta que delatan el contenido hasta 7 niveles adentro: anime (poses del modo Editar y la previa), common_ad (banners de hinchadas), demo (escenas), scoreboard, turf y más. Funciona igual con PES 2021 base, con mods o con Football Life.
- **Módulos en subcarpetas y mods que viven en content** (Sider). Los módulos guardados en subcarpetas de modules (como modules\GRAND\Crowd-Server.lua) ya no aparecen como faltantes. Las carpetas de content se unen al módulo que las nombra en su código, y si ningún módulo las usa, lo dice.
- **¿Es FreeHeartEngine.lua? Corregir** (Sider). Si un lua.module está mal escrito (le falta una letra, tiene un guion en vez de un guion bajo…), la fila sugiere el archivo que sí está en modules y un botón lo corrige. Las comillas de más o de menos en una ruta ya no hacen que una carpeta aparezca como que no existe.
- **Carpetas repetidas, con sus filas** (Sider). El aviso de carpetas repetidas dice qué ruta se repite y en qué filas, y cada fila repetida lleva "Repetida (fila N)". Sider usa la primera; las otras se pueden apagar o quitar.

## v0.045 alpha · Pestaña Sider, música por link y cualquier Sider

*14 de octubre de 2026, 06:30 (hora de Argentina)*

La pestaña Sider muestra qué carga tu juego y deja ordenar sider.ini sin tocar el texto. La carga espera los escudos y revisa sider.ini, se puede conectar cualquier Sider y el EDIT sin Steam, y la música se suma pegando un link de YouTube o Spotify.

- **Pestaña Sider: qué carga tu juego** (Sider). Al lado de WEPES hay una pestaña nueva, Sider. Lee tu sider.ini y muestra cada carpeta de contenido (cpk.root) con lo que trae adentro (escudos, fotos de jugadores, caras, kits, estadios, balones…) y qué herramienta del editor la usa, los módulos Lua que corre (kit server, caras, cantos, marcadores…) y las carpetas de content. También la versión de Sider, el ejecutable del juego y las carpetas de livecpk que no están en sider.ini.
  1. Conectá tu carpeta Sider (si ya estaba conectada, no hace falta nada).
  2. Abrí la pestaña Sider.
- **Prender, apagar, ordenar y agregar sin tocar el texto** (Sider). Cada carpeta y cada módulo tiene un interruptor (comenta la línea en sider.ini, no la borra, así se puede volver a prender), flechas para subir o bajar (el orden importa: si dos carpetas tienen el mismo archivo, manda la de más arriba) y una cruz para quitar la línea. Las carpetas de livecpk y los módulos que no están en sider.ini se agregan con un botón.
- **Ajustes de Sider explicados** (Sider). Los ajustes de sider.ini (livecpk, módulos Lua, cerrar Sider al salir, lado libre, barras negras, cámara, overlay, detalle del registro…) están como interruptores y listas, con una línea que dice para qué sirve cada uno. Si livecpk o los módulos están apagados, o una carpeta de cpk.root no existe, o falta un módulo en modules, aparece un aviso arriba.
- **Guardar con copia de seguridad** (Sider). Nada se escribe hasta tocar "Guardar sider.ini": antes, "Cambios sin guardar" y "Deshacer los cambios". La primera vez queda una copia en sider.ini.bak-pes-editor. Solo se reescriben las líneas que tocaste; los comentarios y el resto quedan igual, y el archivo se guarda con la misma codificación con la que estaba (UTF-8, UTF-16 o la del Bloc de notas con acentos). También podés ver y editar el texto completo.
- **La pantalla de carga revisa sider.ini** (Sider). Al entrar, después de "Sider listo", el editor lee sider.ini y dice cuántas carpetas de contenido y módulos tiene y de qué tipo. Si una carpeta no existe, falta un módulo o livecpk o los módulos están apagados, aparece un paso ⚠ con el detalle y, al terminar, un aviso con un botón a la pestaña Sider.
- **Cualquier Sider: Football Life, la carpeta del juego o Steam** (Archivo). Conectar Sider ya no exige un kit server en particular. Vale la carpeta de Sider (aunque todavía no tenga sider.ini, como Football Life, que lleva livecpk y modules en la carpeta del juego), la carpeta del juego o una de más arriba (Steam, steamapps): el editor busca unos niveles hacia abajo sin confundir el common de Steam con el de un cpk. Las caras y los escudos salen de las carpetas de sider.ini y del resto de livecpk.
- **Si elegiste la carpeta equivocada, te dice cuál es** (Archivo). Si la carpeta no sirve, el aviso dice qué parece ser (una carpeta de contenido, livecpk, content, el juego sin Sider, una carpeta vacía o una con tus cosas) y cuál tenés que elegir.
- **El EDIT de la versión sin Steam** (Archivo). El editor también encuentra el EDIT en <temporada>\save, en cualquier subcarpeta de guardado y en carpetas tipo Football Life. Si no aparece, sigue unos niveles más abajo.
- **Si el navegador oculta sider.ini, elegilo a mano** (Sider). Chrome, Edge, Opera y Brave no dejan que las páginas vean los archivos .ini, .exe ni .dll, ni siquiera listándolos. Si al conectar tu carpeta Sider el editor dice que no encuentra sider.ini aunque esté, la pestaña Sider muestra qué ve en la carpeta y el botón "📄 Elegir sider.ini a mano": lo elegís una vez con el selector de archivos y el editor lo recuerda para leer y guardar. En la app para Windows esto no hace falta. Está en prueba: avisá si con tu juego no funciona.
  1. Abrí la pestaña Sider y tocá "📄 Elegir sider.ini a mano".
  2. Elegí el sider.ini que está dentro de tu carpeta Sider.
- **Agregar por link: YouTube y Spotify, sin cuentas** (Música). En el reproductor, "🔗 Agregar por link" abre un solo cuadro: pegás el link de un video o una lista de YouTube, o de un tema, un disco o una lista de Spotify, y se suma a tu lista. Sin claves ni cuentas. Si escribís un nombre en vez de un link, se abre la búsqueda de YouTube o de Spotify en otra pestaña para que copies el link. Spotify completo necesita tu cuenta Premium iniciada; si no, suena un adelanto de 30 segundos.
  1. Abrí el reproductor (abajo a la izquierda) y tocá "🔗 Agregar por link".
  2. Pegá el link: se agrega solo.
- **Buscar en YouTube desde la app** (Música). En PES Editor Rebuilt para Windows, si escribís un nombre en ese cuadro, la app busca en YouTube ahí mismo y tocás el resultado para sumarlo. Necesita el .exe nuevo de esta versión.
- **La carga espera los escudos y las fotos** (Interfaz). La pantalla de carga ahora espera a que estén los escudos conocidos, las caras del equipo abierto y las imágenes que se ven, así el editor aparece completo y no de a pedazos. La primera vez, si tarda, a los 6 segundos aparece "Entrar ya" (tope de 45 segundos).
- **Fotos de internet: segunda oportunidad** (Plantel). Un pedido de foto o escudo rechazado por el sitio ya no queda guardado como "sin foto" para siempre: se vuelve a intentar.

## v0.044 alpha · PES Editor Rebuilt llega a Windows como .exe

*13 de octubre de 2026, 20:15 (hora de Argentina)*

¡El editor ahora también es un programa para Windows! Descargás un .exe, lo abrís y conecta tu carpeta Sider aunque esté dentro de Archivos de programa, con permiso para guardar en el juego. Y estrenamos nombre: PES Editor Rebuilt.

- **PES Editor Rebuilt para Windows** (Archivo). El editor ahora también se descarga como programa para Windows (.exe). Es exactamente el mismo editor de la página, en su propia ventana, con su logo y su acceso directo en el escritorio y en el menú Inicio. Hay un instalador y una versión portátil, que no se instala.
  1. Abrí la release v0.044 en GitHub y descargá PES-Editor-Rebuilt-Setup.exe (o PES-Editor-Rebuilt-Portable.exe).
  2. Si aparece "Windows protegió tu PC", tocá Más información › Ejecutar de todas formas.
  3. Abrí PES Editor Rebuilt desde el escritorio o el menú Inicio.
- **Sider en Archivos de programa, con permiso para guardar** (Archivo). Chrome y Edge no dejan que una página escriba en C:\Program Files (x86), que es donde Steam instala PES 2021 y donde muchos tienen su carpeta Sider. La app sí puede: conecta tu carpeta Sider donde está, sin moverla, y guarda kits, escudos y el módulo edit21_db como siempre.
  1. Abrí la app y elegí tu carpeta Documentos.
  2. Tocá Conectar carpeta Sider.
  3. Elegí tu carpeta Sider en el selector de Windows: queda conectada para la próxima.
- **Siempre la última versión** (Velocidad). La app carga el editor desde GitHub cada vez que la abrís, así que cada versión nueva llega sola, sin reinstalar nada. Tiene su propio caché: guarda fotos, escudos, tus ajustes y el trabajo sin guardar, y después de la primera vez abre también sin internet.
- **Solo las carpetas que elegís** (Archivo). La app solo puede leer y escribir dentro de las carpetas que elegís con el selector de Windows (Documentos y tu carpeta Sider), y las recuerda para la próxima. Si Windows no deja escribir en alguna, te avisa que la abras como administrador; si el juego tiene un archivo abierto, te pide que lo cierres.
- **Nuevo nombre: PES Editor Rebuilt** (Interfaz). El editor pasa a llamarse PES Editor Rebuilt: en la pestaña del navegador, al instalarlo desde Chrome y en la app. La app estrena su propio logo.
- **Qué hacer si Chrome no abre tu carpeta Sider** (Archivo). Si Chrome dice "Esta carpeta no se puede abrir… contiene archivos del sistema", la pantalla de carga y la ayuda explican por qué pasa y te ofrecen descargar la app para Windows. También están los pasos para sacar solo la carpeta Sider de Archivos de programa (dentro del mismo disco tarda un segundo, aunque pese muchos GB) y la opción de abrirla solo para ver.
- **sider.ini se arregla solo** (Archivo). Si movés la carpeta Sider y tu sider.ini tenía rutas completas a la carpeta vieja (cpk.root = "C:\Program Files…\livecpk\…"), al conectarla el editor las cambia por rutas relativas (.\livecpk\…) para que Sider las siga encontrando. Antes guarda una copia en sider.ini.bak-pes-editor.

## v0.043 alpha · Ficha hexagonal, media desde el plantel y tu trabajo a salvo

*13 de octubre de 2026, 18:30 (hora de Argentina)*

Cambiar la media de un jugador ahora es visual: un hexágono que se arrastra y una ventana que se abre desde el plantel. Y al actualizar el editor ya no perdés nada: te pregunta si guardar y tu trabajo queda en el caché.

- **Ficha hexagonal del jugador** (Plantel). Arriba de la pestaña Habilidades hay un hexágono con seis áreas: Ataque, Técnica, Pase, Velocidad, Físico y Defensa. Cada punta es el promedio de las habilidades de esa área y se colorea según el valor. Los arqueros tienen su propio hexágono: Portero, Atajar, Despejar, Reflejos, Alcance y Físico.
  1. Abrí un jugador de tu EDIT en la pestaña Jugadores.
  2. Entrá en Habilidades.
  3. Arrastrá una punta hacia afuera para subir esa área o hacia adentro para bajarla.
- **Mover un área sin desarmar al jugador** (Plantel). Al mover una punta, todas las habilidades de esa área suben o bajan lo mismo, así se mantienen las diferencias entre ellas (un buen cabeceador sigue cabeceando mejor de lo que patea). Mientras arrastrás, la valoración aproximada se actualiza en vivo con el +/− que suma o resta. Cada movimiento es un solo paso de Deshacer.
- **Cómo estaba antes** (Plantel). Una línea punteada dentro del hexágono muestra cómo estaba el jugador al abrir el archivo, y al lado de cada área aparece cuánto cambió (+5, −3). Así ves de un vistazo qué tocaste.
- **Hexágono también con el teclado** (Plantel). Tocá una punta (o llegá con Tab) y usá las flechas: arriba o derecha suben 1, abajo o izquierda bajan 1, y RePág o AvPág mueven 5 de una.
- **Hexágono de los jugadores del juego** (Plantel). La ficha de un jugador que está en la base del juego pero no en tu EDIT también muestra su hexágono, solo para ver.
- **Editar la media desde el plantel** (Plantel). En la tabla del plantel, la valoración (columna Val.) de cada jugador ahora es un botón con un lápiz ✎. Al tocarlo se abre una ventana encima de la página con la media en grande, botones −5, −1, +1 y +5, una barra para elegirla entre 40 y 99 y el hexágono del jugador para ajustar cada área.
  1. Abrí un equipo: aparece en Plantel.
  2. Tocá el número de la columna Val. de un jugador.
  3. Usá los botones, la barra o el hexágono.
  4. Tocá Listo (o Esc) y el plantel se actualiza.
- **Qué toca la media rápida** (Plantel). En los jugadores de campo, cambiar la media sube o baja por igual todas las habilidades de juego; las de arquero no se tocan. En los arqueros se mueven las habilidades de arquero y el salto. El editor busca el cambio que deja la media lo más cerca posible de la que elegiste y, si las habilidades ya están en el tope (99) o en el piso (40), te avisa.
- **Volver atrás sin miedo** (Plantel). La ventana muestra cuánto cambió la media desde que la abriste. "Volver a como estaba" deshace todo lo de esa ventana (queda en Rehacer), Ctrl+Z y Ctrl+Y funcionan adentro y "Abrir ficha completa" te lleva a la pestaña Habilidades del jugador. Si el jugador es del juego y no está en tu EDIT, la ventana ofrece agregarlo para poder editarlo.
- **El aviso de versión nueva, más rápido y seguro** (Velocidad). Con la pestaña a la vista, el editor revisa cada 3 minutos si hay una versión nueva (antes cada 10), y también apenas volvés a la pestaña. Además mira el último cambio publicado en GitHub: cuando aparece uno, revisa cada 30 segundos hasta que la página nueva está lista. Las revisiones piden los archivos con una marca única, así ni el navegador ni GitHub pueden contestar con una copia vieja. El aviso muestra el título del cambio.
- **Actualizar trae todo de nuevo** (Velocidad). "Actualizar ahora" recarga la página pidiendo cada archivo otra vez a GitHub, así no queda ninguna parte de la versión anterior.
- **Antes de recargar, te pregunta** (Archivo). Si tocás "Actualizar ahora" o "Borrar caché" con cambios sin guardar, aparece un cuadro con tus opciones: Guardar en el caché y recargar, Guardar en el juego y recargar (o Guardar copia, si abriste el archivo a mano), Actualizar sin guardar o Cancelar. Si al guardar en el juego algo falla, no recarga.
- **Tu trabajo, guardado en el caché** (Archivo). Al recargar, el EDIT con tus cambios queda guardado en este navegador junto con el historial de Deshacer y la pantalla donde estabas. Cuando el editor vuelve a abrir ese mismo EDIT, todo vuelve solo y te avisa cuántos cambios recuperó. Funciona con la carpeta del juego y con un archivo abierto a mano, y lo guardado dura un día.
  1. Hacé cambios en un jugador o un equipo.
  2. Cuando aparezca "Hay una versión nueva del editor", tocá Actualizar ahora.
  3. Elegí "Guardar en el caché y recargar".
  4. Al volver a cargar, seguís donde estabas, con Deshacer.
- **Si el juego guardó mientras tanto** (Archivo). Si el juego modificó el EDIT entre que guardaste en el caché y volviste, el editor lo nota: sin cambios pendientes abre el del juego; con cambios pendientes los recupera y te ofrece recargar el del juego, y al guardar te vuelve a avisar antes de pisarlo.
- **Arreglo: "cambios sin guardar" a la vista** (Interfaz). En pantallas de 1366 px de ancho o menos, con la carpeta del juego abierta, el aviso "N cambios sin guardar" de la barra de pestañas quedaba escondido. Ahora siempre se ve; solo se esconde la etiqueta "Modo copia".

## v0.042 alpha · Valoración dinámica con datos reales

*13 de octubre de 2026, 15:45 (hora de Argentina)*

La valoración por rendimiento ahora mira toda la temporada, los goleadores, las lesiones y el historial de cada jugador, y te muestra de dónde sale cada punto.

- **Búsqueda que encuentra a tu equipo** (Plantel). "Como 1907" ahora encuentra a "Como": el editor prueba el nombre sin el año, sin siglas como FC, Club o Calcio y con la palabra más importante, y usa el país del equipo en tu EDIT para elegir bien.
- **Toda la temporada, no solo 6 partidos** (Plantel). Con ESPN, el editor analiza en segundo plano todos los partidos de la temporada: goleadores, asistencias, minutos y puntaje de cada jugador. También trae la campaña de la temporada anterior.
  1. Abrí un equipo y entrá en Formación.
  2. Tocá "⚽ Últimos partidos reales" con la fuente ESPN.
  3. Dejá marcado "Analizar toda la temporada" y esperá a que termine.
- **Lesionados y ausentes** (Plantel). El plantel de ESPN dice quién está lesionado o en duda. El lesionado baja su forma (más si lleva más de dos meses afuera), y también el habitual que faltó a las últimas 3 citaciones.
- **Historial de cada jugador** (Plantel). Las temporadas anteriores de cada jugador moderan la forma: una racha corta no lo vuelve crack, un mal mes no lo hunde y el titular de siempre suma.
- **Cómo se calcula, jugador por jugador** (Plantel). En Forma del plantel cada jugador tiene un botón ⓘ con el detalle: cada parte de la forma con sus números, la edad y los topes. La ayuda "Cómo se calcula la forma" explica la fórmula completa.
  1. Abrí "📊 Forma del plantel".
  2. Tocá ⓘ al lado de un jugador.
- **En desarrollo** (Interfaz). Un cartel muestra lo que está en prueba y lo que viene. También queda arriba de todo en Novedades.

## v0.041 alpha · Escudos propios y siempre la última versión

*13 de octubre de 2026, 14:45 (hora de Argentina)*

Escudos propios en un par de clics, el editor que se actualiza solo y una salida para quienes tienen Sider dentro de Archivos de programa.

- **Subí tus propios escudos** (Plantel). En Datos y colores hay una sección Escudo. Subís un PNG (o tus archivos e_XXXXXX_*.png) y el editor arma los 11 archivos que usa el juego, cada uno con su tamaño y con el ID de 6 cifras del equipo, y los guarda en livecpk\…\common\render\symbol\flag. Lo que había queda como .bak-edit21.
  1. Conectá la carpeta Sider.
  2. Abrí un equipo y entrá en Datos y colores.
  3. En Escudo tocá "Elegir imagen o archivos" (o arrastrá el PNG).
  4. Tocá "Guardar escudo en el juego" y abrí el juego de nuevo.
- **Carpeta de escudos automática** (Plantel). Si tu Sider no tiene ninguna carpeta con escudos, el editor crea livecpk\PESEditor-Escudos y la agrega a sider.ini, antes de las otras, para que tus escudos manden. Guarda una copia del sider.ini como sider.ini.bak-pes-editor.
- **Sider dentro de Archivos de programa** (Archivo). Chrome y Edge no dejan abrir para escribir carpetas dentro de C:\Program Files, donde Steam instala el juego. Ahora la pantalla de carga lo explica y ofrece "Abrir solo para ver": se ven kits, caras, escudos y nombres. Para poder guardar en el juego, mové el juego a otra biblioteca de Steam.
- **Siempre la última versión** (Velocidad). El editor revisa sus archivos contra GitHub cada vez que abre, así ya no queda una copia vieja después de una actualización. Si se publica algo nuevo con la página abierta, aparece arriba "Hay una versión nueva del editor" con Actualizar ahora o Más tarde.
- **Fotos y escudos guardados** (Velocidad). Las fotos y escudos de internet se descargan una sola vez y después cargan al instante, también sin conexión.
- **Versión a la vista y Borrar caché** (Interfaz). Debajo de la versión, arriba, se ve la fecha de la versión que estás usando. En Apariencia hay una sección Caché con la versión, cuántas fotos hay guardadas, el espacio usado y el botón Borrar caché, en los 4 modos gráficos.

## v0.040 alpha · Ahora en inglés, y una Formación más cómoda

*13 de octubre de 2026, 11:15 (hora de Argentina)*

El editor aprende inglés, la Formación deja mover varios jugadores a la vez y muestra el valor de Transfermarkt, y cada modo gráfico gana animaciones propias.

- **El editor en inglés** (Interfaz). Al lado de Recargar hay un selector con la bandera del idioma: Español o English. En inglés se traduce todo lo que se ve: pestañas, botones, ayudas, Novedades, la barra de PES 6, países y posiciones. También se elige en la pantalla de carga, junto a Música.
  1. Tocá la bandera al lado de Recargar.
  2. Elegí English: la página se recarga en inglés y queda guardado.
- **Mover varios jugadores juntos** (Formación). Tocá jugadores con Ctrl apretado o usá "Elegir varios": quedan marcados y, al arrastrar uno, se mueven todos juntos. El arquero queda fijo y Deshacer vuelve todo atrás.
- **Banco de suplentes más largo** (Formación). Sin un jugador elegido, la lista de suplentes se alarga y se ven muchos más de una vez.
- **Valor de Transfermarkt** (Formación). La cabecera muestra el valor estimado y el de Transfermarkt, que cargás tocándolo. La ↗ abre la búsqueda del equipo en Transfermarkt y abajo dice cuánto difiere. En Retro es una caja de PS2 y en PES 6 una placa plateada con el número dorado.
- **Panel de equipos más ancho** (Interfaz). Ordenar está al lado de Todos, Editados y Sin guardar, hay un selector de Liga o país que dice cuántos clubes tiene cada uno, y se puede ordenar por País.
- **Escudos de Wikipedia** (Plantel). Si TheSportsDB no tiene el escudo de un club, se busca en su página de Wikipedia. Los clubes que habían quedado sin escudo se buscan otra vez.
- **Pestañas con personalidad** (Interfaz). La pestaña elegida tiene una animación propia en cada modo gráfico: brillo en Moderno, franja naranja en Clásico, flechita que titila en Retro y un trazado rojo que da vueltas en PES 6.
- **Estática de tele en PES 6** (Interfaz). Al cambiar de pestaña, equipo o sección aparece un golpe de estática, como al cambiar de canal. El eco del logo ahora sale de adentro hacia afuera.
- **El video se va de verdad** (Música). A los 15 segundos el cuadro de YouTube desaparece y queda la carátula chica del reproductor con un ▶. La ✕ del video lo saca para todos los temas que vengan, y la música sigue sonando.
- **Arreglo: el video no se escondía** (Música). El video de YouTube a veces no se escondía a los 15 segundos porque dependía de avisos de YouTube. Ahora se mide con el tiempo real del video, y cuando se esconde ya no queda el cuadro ocupando lugar.
- **Arreglo: clubes sin escudo** (Plantel). Los clubes que TheSportsDB no encontraba quedaban sin escudo para siempre. Ahora se vuelven a buscar una vez, con Wikipedia como respaldo.

## v0.030 alpha · Lavada de cara: PES 6 Editar, plantel y carga

*13 de octubre de 2026, 09:55 (hora de Argentina)*

Una versión dedicada a cómo se ve: el modo PES 6 Editar se pone nostálgico, el plantel muestra más cosas de un vistazo y la pantalla de carga te acompaña a conectar todo.

- **PES 6 Editar, como en la PS2** (Interfaz). Fondo de estadio con un leve desenfoque y efecto de tele vieja (CRT), tabla del plantel en dorado suave, bordes rectos y el logo que respira con una segunda capa que lo acompaña.
- **La barra de texto de abajo** (Interfaz). En PES 6 Editar corre despacio una cinta con novedades, ideas a futuro y datos de la saga, en letra blanca de PES. Al pasar el mouse por un botón o una pestaña, explica qué hace.
- **Toda la pantalla, en una fila** (Interfaz). En la PC el editor ocupa todo el ancho, la cabecera entra en una sola fila y Apariencia tiene íconos y vistas previas de cada paleta. Las acciones de cada jugador están en el botón ⋯.
- **Banderas reales y fotos más grandes** (Plantel). La columna Nación muestra la bandera de verdad del país. Las fotos son más grandes y su borde y fondo cambian según la posición: arquero, defensa, medio o delantero.
  1. Abrí un equipo y entrá en Plantel.
  2. Con "Fotos / Camisetas" elegís ver las caras o solo la camiseta del equipo.
- **Promedios explicados** (Plantel). Debajo del plantel se aclara que media, edad y altura son promedios del plantel y que el valor es la suma de todos.
- **El estadio real en la cabecera** (Plantel). Arriba de todo se ve el nombre real del estadio y, entre paréntesis, el que tiene elegido el EDIT.
- **Fotos de dos lugares** (Plantel). Al cargar elegís: fotos recortadas de TheSportsDB, una mezcla que completa con fotos de Wikipedia las que falten, o ninguna. Se cambia después en Formación, con la vista Fotos.
- **La carga te pide Sider** (Archivo). Después de abrir el EDIT, la pantalla de carga pide conectar la carpeta Sider (o el permiso para volver a leerla) y espera a que carguen caras, escudos y fuentes antes de entrar. El botón de nombres ahora se llama "Conectar Player.bin".
- **Carátula en lugar del video** (Música). El reproductor quieto queda como un círculo, y a los 15 segundos de empezar un video de YouTube queda solo la carátula. Tocándola vuelve el video.
- **Windows en modo oscuro** (Interfaz). En PES 6 Editar y Clásico, con Windows en modo oscuro, el dorsal repetido y las casillas ya no quedan en negro.

## v0.020 alpha · El Plan de juego, como en el juego

*13 de octubre de 2026, 08:25 (hora de Argentina)*

La pestaña Formación usa las mismas opciones y nombres que el Plan de juego de PES 2021, con su explicación, y suma el capitán y los lanzadores de balón parado. Todo verificado en el juego.

- **Estrategia con los nombres del juego** (Formación). Ataque en rosa y defensa en celeste; cada opción es una tarjeta con lo que hace. Las líneas defensiva, de apoyo y la distancia al jugador con balón traen la explicación del juego.
- **Las 4 instrucciones avanzadas** (Formación). 2 de ataque y 2 de defensa por plan, como en el juego, sin repetir la misma. 13 de 14 confirmadas en el juego; Delantero liberado figura como "probable" porque el juego la muestra como "No" si no tiene un delantero asignado.
  1. Abrí un equipo y entrá en Formación.
  2. En "Instrucciones avanzadas", tocá hasta 2 por lado. Tocá una marcada para quitarla.
- **Opciones tácticas rápidas** (Formación). Las del juego (Balones largos a la contra, Contraataques rápidos, Juego de posesión, Defensa total, Todos adelante, Por las bandas y Por el centro) cambian varias opciones de una vez. Los valores son aproximados porque el juego no los guarda en el EDIT.
- **Config. marcaje** (Formación). Avisa si algún jugador marca a un rival fijo y lo devuelve a automático con un toque.
- **Capitán y balón parado** (Formación). Capitán, tiro libre largo y corto, tirador 2, córner izquierdo y derecho, penales y los 3 jugadores ofensivos, igual que "Opciones del jugador" del juego. "Elegir automáticamente" elige un titular por jugada según sus habilidades.
- **Equipación para varios jugadores** (Plantel). Con varios seleccionados, "Equipación…" cambia mangas, camiseta interior, medias, calzas, camiseta afuera, guantes, color de guantes y botines a todos a la vez.
- **Revisión antes de guardar** (Archivo). El editor vuelve a abrir el EDIT generado y revisa cantidades e IDs de jugadores, equipos y planteles; si aparece un problema nuevo, no guarda y muestra la lista.
- **Comparar con otro EDIT más claro** (Archivo). Nombra cada lanzador, cada instrucción avanzada y la Config. marcaje.
- **Adaptado a cada modo gráfico** (Interfaz). La Estrategia cambia de look en Moderno, Clásico, Retro y PES 6 Editar.

## v0.019 alpha · Todos los jugadores del juego en Jugadores

*13 de octubre de 2026, 06:55 (hora de Argentina)*

La pestaña Jugadores ya no muestra solo los que están en tu EDIT: con la base del juego copiada, se ven los más de 27.000 jugadores del juego.

- **Mi EDIT o la base del juego** (Plantel). Arriba de la lista hay dos botones: "Mi EDIT" (los jugadores que el EDIT guarda y se editan como siempre) y "Del juego" (todos los de la base del juego). Si tu EDIT no tiene jugadores, arranca directo en la base. La pestaña muestra el total de la base, y al pasar el mouse dice cuántos hay en cada lado.
  1. Conectá la carpeta Sider y dejá que el juego copie la base (si todavía no lo hiciste, el editor te avisa cómo).
  2. Entrá en Jugadores y tocá "Del juego".
  3. Buscá por nombre, ID o equipo, o filtrá por posición o por "Solo los que no están en mi EDIT".
- **Ficha de solo lectura con todo lo del juego** (Plantel). Cada jugador de la base muestra su cara, posición, nacionalidad, edad, altura, valoración, sus equipos con el dorsal (tocá uno para ir al plantel) y todas las habilidades en barras, más pierna mala, estado de forma y resistencia a lesiones. Es lo que usa el juego.
- **Agregar a mi EDIT para editarlo** (Plantel). El botón "Agregar a mi EDIT para editarlo" copia al jugador con todas sus habilidades y abre su ficha editable; la cara y el nombre siguen saliendo del juego. Ctrl+Z lo deshace.
- **El buscador de arriba también encuentra jugadores de la base** (Plantel). Con / o el buscador de arriba aparecen los jugadores del juego que no están en ningún plantel de tu EDIT, marcados como "Base del juego"; al elegir uno se abre su ficha.

## v0.018 alpha · La copia de la base ya se guarda y el video va arriba del reproductor

*13 de octubre de 2026, 06:30 (hora de Argentina)*

Arreglo del módulo edit21_db.lua (en algunas instalaciones Sider no deja que los módulos guarden archivos), planteles de la base verificados con los archivos reales del juego y un lugar mejor para el video de YouTube.

- **Escritura con las funciones de Windows** (Archivo). En algunas instalaciones, el io de Sider no deja crear ni sobrescribir archivos: abrir un archivo para escribir devuelve vacío y sin error (en el sider.log se ve como "-> nil", y le pasa también a otros módulos, como PostProcessingEditor y UIColors). La v1.5 lo detecta y en ese caso escribe la copia con las funciones de Windows, por medio del ffi de LuaJIT que el juego ya deja activado (luajit.ext.enabled = 1 en sider.ini). En sider.log queda anotado qué método usó.
  1. Tocá "Conectar carpeta Sider": el editor reemplaza el módulo viejo por la v1.5 (guarda el anterior como edit21_db.lua.anterior).
  2. Abrí el juego hasta el menú principal, entrá en Partido › Amistoso hasta la elección de equipos y cerralo.
  3. Volvé al editor y tocá "Ya lo hice: volver a leer".
- **Nada de archivos al arrancar** (Archivo). El módulo ya no toca ningún archivo mientras Sider arranca: elige la carpeta recién cuando el juego carga el primer archivo de la base, la crea si no existe y, si algo falla, vuelve a probar con el siguiente.
- **Planteles de la base verificados** (Plantel). Con la copia real de PlayerAssignment.bin se confirmó cómo guarda el juego cada fila (registro de 16 bytes: número de fila, jugador, equipo, dorsal y orden). El editor ahora lo reconoce directo, y el dorsal se calibra comparando con los planteles de tu EDIT: el juego lo guarda empezando desde 0, así que el 1 figura como 0. En la prueba con el juego coincidieron los 20.174 jugadores de los 748 equipos.
- **Video de YouTube arriba del reproductor** (Música). Con el reproductor minimizado, el video ahora va arriba de la barra, en el espacio libre de la izquierda, y toma el ancho que haya (mínimo 200 × 200, lo que exige YouTube). Si la pantalla es angosta y no hay hueco, sigue al costado del reproductor para no tapar la lista de equipos.
- **Aviso más preciso** (Archivo). Si el sider.log muestra el error de una versión anterior del módulo, el aviso ya no manda a revisar la protección contra ransomware de Windows: explica qué pasó y que alcanza con repetir los pasos. Las líneas de ayuda que el módulo deja en el registro ya no se confunden con un error de permisos.

## v0.017 alpha · Módulo de Sider automático y más datos de la base

*13 de octubre de 2026, 05:30 (hora de Argentina)*

Al conectar la carpeta Sider, el editor instala solo el módulo que copia la base del juego, y ahora lee más datos de esa copia.

- **El módulo edit21_db.lua se instala solo** (Archivo). Al tocar "Conectar carpeta Sider", el editor revisa tu Sider: si falta el módulo lo copia a modules\, agrega la línea lua.module = "edit21_db.lua" en sider.ini (guardando una copia de seguridad como sider.ini.bak-pes-editor) y crea la carpeta content\edit21-db. Si ya está pero es una versión vieja, lo actualiza. Es un módulo de solo lectura: no cambia nada del juego.
  1. Tocá "Conectar carpeta Sider" y elegí la carpeta de Sider (la que tiene sider.exe).
  2. Si el editor te pide permiso para escribir en esa carpeta, aceptá: lo necesita para instalar el módulo.
- **Aviso cuando la base no está cargada** (Archivo). Si es la primera vez, si el módulo se acaba de instalar o si en content\edit21-db faltan archivos, el editor muestra qué hacer: abrir PES 2021 con Sider hasta el menú principal, entrar en Partido › Amistoso hasta la elección de equipos y cerrar el juego. Después, "Ya lo hice" vuelve a leer la base. También avisa al arrancar si la copia está incompleta.
- **Módulo v1.3: copia toda la base y avisa si algo falla** (Archivo). Si Windows no le deja escribir en content\edit21-db, el módulo prueba en content\pes-editor-db, anota el error exacto en sider.log y deja un estado.txt; el editor lee ese registro y te dice qué pasó y cómo arreglarlo (por ejemplo, el "Acceso controlado a carpetas" de Windows). Además copia todos los archivos de pesdb que el juego carga (Player, Team, PlayerAssignment, Coach, Stadium, Country, Competition, Tactics…), no solo una lista fija, y escribe index.txt con el nombre, tamaño y hora de cada uno. Los archivos de la elección de equipos (como PlayerAssignment.bin) recién se copian al entrar en el amistoso: por eso ese paso.
- **Planteles de la base para equipos vacíos** (Plantel). Con PlayerAssignment.bin y Team.bin copiados, el editor sabe qué jugadores tiene cada equipo en el juego y el nombre y la sigla de los 750 equipos. Si un equipo está vacío en tu EDIT, la pestaña Plantel muestra el plantel que trae el juego, con dorsales, fotos y valoraciones.
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
  1. Tocá "Conectar carpeta Sider" para que el editor encuentre las minicaras del juego.
  2. Abrí un equipo: las fotos aparecen solas en la pestaña Plantel.

## v0.007 alpha · Intro con neón y sección Novedades

*12 de octubre de 2026, 23:50 (hora de Argentina)*

La pantalla de carga se volvió más llamativa y se agregó esta sección.

- **Intro con efectos** (Interfaz). El logo entra con un zoom, un destello de luz, rayos que giran detrás, chispas que suben, un piso con grilla tipo estadio de noche y un reflejo debajo.
- **Brillo neón que se prende y se apaga** (Interfaz). El contorno de las letras, las barras y las estrellas se iluminan como un tubo de neón: se enciende con parpadeos, queda prendido, se apaga despacio y vuelve a prenderse. Mientras carga el EDIT late más rápido y al terminar queda fijo. Usa el color de acento de la página (cambia con los colores del equipo). Si Windows tiene activado "reducir animaciones", se muestra fijo y sin efectos.
- **Pestaña Novedades** (Interfaz). Al lado de Archivo. Cuando hay una versión que todavía no viste aparece un punto que titila en la pestaña; se apaga cuando entrás.
- **Botón "Conectar carpeta Sider"** (Kits). El botón que antes decía "Conectar Parche" ahora se llama "Conectar carpeta Sider" y tiene el ícono del martillo y la llave. Hace lo mismo: elegís la carpeta de Sider del juego y el editor lee kits, caras, escudos y nombres de jugadores.

## v0.006 alpha · El EDIT se encuentra solo

*12 de octubre de 2026, 22:52 (hora de Argentina)*

Ya no hace falta buscar el archivo a mano: el editor lo encuentra en tu carpeta Documentos.

- **Búsqueda automática del EDIT** (Archivo). El editor busca KONAMI\eFootball PES 2021 SEASON UPDATE dentro de Documentos (aunque esté en otra subcarpeta) y abre el EDIT00000000 más reciente. Si hay dos con la misma fecha, prefiere el de la carpeta drmp antes que el de la carpeta save.
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

Se armó un estudio para ver y editar los kits del kit-server del juego.

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
