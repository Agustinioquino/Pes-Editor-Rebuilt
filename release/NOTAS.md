<div align="center">

<img alt="La pestaña Sider en el modo Moderno: Sider PES2021 7.1.4, 8 carpetas de contenido y 8 módulos, con los avisos de una carpeta que no existe y un módulo que falta" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.045/sider-carpetas.png" width="100%">

# 🧩 Tu Parche, a la vista: llega la pestaña Sider

**[▶ Abrir PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · **[⬇️ App para Windows (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.045-alpha/PES-Editor-Rebuilt-Setup.exe)** · [📦 Versión portátil](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.045-alpha/PES-Editor-Rebuilt-Portable.exe)

</div>

## ⚽ ¿Qué carga tu Parche? Ahora lo ves

Hasta hoy, para saber qué mods cargaba Sider, en qué orden, o si alguna carpeta de `sider.ini` ya no existía, había una sola forma: **abrir sider.ini en el Bloc de notas** y leer línea por línea. 📜

Se acabó. Al lado de WEPES hay una pestaña nueva, **Sider**, que lee tu `sider.ini` y te lo muestra como lo que es: una lista de mods.

- **Carpetas de contenido (`cpk.root`)**, cada una con una etiqueta de lo que trae adentro (🛡 escudos, 🪪 fotos de jugadores, 🙂 caras 3D, 👕 kits, 🏟 estadios, ⚽ balones, 📦 datapack…) y qué herramienta del editor la usa. El editor mira adentro de la carpeta para saberlo; si solo lo adivina por el nombre, la etiqueta lo aclara.
- **Módulos Lua (`lua.module`)**: kit server, caras, cantos, marcadores, balones, estadios, `edit21_db`… con una línea que dice qué hace cada uno.
- **Carpetas de `content`**, unidas al módulo que las usa (el kit server con sus equipos en `map.txt`, la copia de la base del juego…).
- Y arriba de todo: la versión de Sider, el ejecutable del juego y las carpetas de `livecpk` que todavía no están en `sider.ini`.

<img alt="La sección de módulos Lua en el modo Retro: kserv, faceserver, chants, ballserver y StadiumServer, cada uno con su interruptor, su descripción y sus flechas" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.045/sider-modulos.png" width="100%">

## 🎛 Prender, apagar, ordenar y agregar, sin tocar el texto

Cada carpeta y cada módulo tiene su **interruptor**: apagarlo comenta la línea en `sider.ini` (no la borra, así la volvés a prender cuando quieras). Las **flechas** suben y bajan, porque en Sider el orden importa: si dos carpetas traen el mismo archivo, **manda la de más arriba**. La **cruz** quita la línea. Y lo que está en `livecpk` o en `modules` pero no en `sider.ini` se agrega con un botón.

Los **ajustes** de Sider (livecpk, módulos Lua, cerrar Sider al salir, elegir cualquier lado, barras negras, cámara, overlay, detalle del registro…) están como interruptores y listas, cada uno con una línea que explica para qué sirve. Y si `livecpk` o los módulos están apagados, si una carpeta de `cpk.root` no existe o si falta un módulo en `modules`, te lo **avisa arriba** en vez de dejar que lo descubras en el partido.

<img alt="Los ajustes de Sider en el modo Clásico, como interruptores con su explicación, y el detalle del registro como lista" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.045/sider-ajustes.png" width="100%">

**Nada se escribe hasta que tocás "Guardar sider.ini".** Mientras tanto ves "Cambios sin guardar" y podés deshacerlos. La primera vez queda una copia en `sider.ini.bak-pes-editor`. Solo se reescriben las líneas que tocaste: los comentarios y el resto quedan tal cual, y el archivo se guarda **con la misma codificación con la que estaba** (UTF-8, UTF-16 o la del Bloc de notas con acentos), para que Sider lo siga leyendo como siempre. Si sos de los que prefieren el texto, también está completo para mirar y editar.

## 🚦 La carga ahora revisa sider.ini (y espera los escudos)

La pantalla de carga aprendió dos cosas:

1. **Espera a que estén los escudos y las fotos** de lo que se ve, así el editor aparece completo y no de a pedazos. La primera vez, si tarda, a los 6 segundos aparece "Entrar ya".
2. Después de "Sider listo", **lee sider.ini** y te dice cuántas carpetas de contenido y módulos tiene y de qué tipo. Si algo está mal (una carpeta que no existe, un módulo que falta, `livecpk` apagado), aparece un paso ⚠ con el detalle y, al terminar, un aviso con un botón directo a la pestaña Sider.

<img alt="La pantalla de carga en PES 6 Editar: sider.ini leído con 8 carpetas de contenido y 8 módulos, y un paso de revisión por una carpeta que no existe y un módulo que falta" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.045/carga.png" width="100%">

## 📂 Cualquier Sider y cualquier EDIT

Conectar Sider **ya no exige el kit server de un Parche en particular**. Vale:

- la **carpeta de Sider** de cualquier Parche, aunque todavía no tenga `sider.ini` (como **Football Life**, que lleva `livecpk` y `modules` directo en la carpeta del juego);
- la **carpeta del juego**, o una de más arriba (Steam, steamapps): el editor busca unos niveles hacia abajo, y no confunde el `common` de Steam con el `common` de un cpk.

Las caras y los escudos salen de las carpetas que están en `sider.ini` y del resto de `livecpk`. Y si elegiste una carpeta que no sirve, el aviso **te dice qué parece ser** (una carpeta de contenido, `livecpk`, `content`, el juego sin Sider, una carpeta vacía o una con tus cosas) y cuál tenés que elegir:

<img alt="El aviso al elegir una carpeta equivocada, en el modo Clásico: En esa carpeta no está Sider ni en sus subcarpetas, adentro hay 7 carpetas como Videos, Trabajo, Musica…" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.045/carpeta-equivocada.png" width="100%">

El **EDIT** también se encuentra en la versión sin Steam (`<temporada>\save`), en cualquier subcarpeta de guardado y en carpetas tipo Football Life.

## 🙈 ¿El editor dice que no hay sider.ini, pero está? Elegilo a mano

Esto lo descubrimos gracias a un reporte de esta misma semana: **Chrome, Edge, Opera y Brave no dejan que las páginas vean los archivos `.ini`, `.exe` ni `.dll`**, ni siquiera listando la carpeta. Para el navegador, `sider.ini` directamente no existe. 🤯

Por eso ahora, si al conectar la carpeta el editor no encuentra `sider.ini`, la pestaña Sider te muestra **qué ve adentro de la carpeta** y te da el botón **"📄 Elegir sider.ini a mano"**: lo elegís una vez con el selector de archivos y el editor lo recuerda, para leer y para guardar. En la **app para Windows** esto no hace falta, porque no pasa por el navegador.

<img alt="La pestaña Sider cuando el navegador oculta sider.ini: explica por qué, lista lo que ve en la carpeta y ofrece el botón Elegir sider.ini a mano" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.045/sider-ini-a-mano.png" width="100%">

> 🧪 **En prueba.** Lo probamos a fondo con un Sider de prueba y simulando lo que hace el navegador, pero todavía no en una PC con un Parche real. Si con el tuyo el botón no alcanza, [avisanos](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/issues/new/choose).

## 🎵 Música por link, sin claves ni cuentas

En el reproductor, **"🔗 Agregar por link"** abre un solo cuadro. Pegás el link de un **video o una lista de YouTube**, o de un **tema, un disco o una lista de Spotify**, y se suma a tu lista. Nada de claves de API ni de conectar cuentas. Si escribís un nombre en vez de un link, se abre la búsqueda de YouTube o de Spotify en otra pestaña para que copies el link que te guste.

<img alt="El reproductor en PES 6 Editar con el cuadro Agregar por link: al escribir himno champions ofrece Buscar en YouTube y Buscar en Spotify" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.045/musica-link.png" width="100%">

En **PES Editor Rebuilt para Windows** es todavía más directo: escribís el nombre y **la app busca en YouTube ahí mismo**; tocás el resultado y listo.

<img alt="El reproductor en el modo Retro dentro de la app: la búsqueda himno champions muestra cuatro resultados de YouTube para sumar con un toque" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.045/musica-app.png" width="100%">

Un detalle: Spotify completo necesita tu cuenta Premium iniciada en la ventanita de Spotify; si no, suena un adelanto de 30 segundos.

## 🔧 También

- **Fotos de internet, segunda oportunidad**: un pedido de foto o escudo rechazado por el sitio ya no queda guardado como "sin foto" para siempre.
- **La app** se presenta como Chrome ante los sitios de fotos (algunos la rechazaban) y acepta `--url=` para abrir otra versión del editor, por ejemplo la rama de un PR para probarla antes de que salga.

> ⬇️ **¿Tenés la app?** El editor se actualiza solo, pero la búsqueda de YouTube dentro de la app y `--url=` viven en el .exe: para tenerlas, descargá el **[instalador nuevo](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.045-alpha/PES-Editor-Rebuilt-Setup.exe)** (o la [versión portátil](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.045-alpha/PES-Editor-Rebuilt-Portable.exe)). Lo demás te llega igual sin reinstalar.

**Todo en español e inglés**, como siempre 🇦🇷🇬🇧

<details><summary>🇬🇧 The Sider tab in English</summary>

<img alt="The content folders section of the Sider tab in English: kit-server with 712 teams in map.txt, edit21-db with the game database copy, faces, chants and more, each linked to its module" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.045/sider-en.png" width="100%">

</details>
