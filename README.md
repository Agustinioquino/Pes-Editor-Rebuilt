<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logo-oscuro.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/logo-claro.svg">
  <img alt="PES Editor Rebuilt" src="assets/logo-claro.svg" width="560">
</picture>

**🇬🇧 English** · **[🇪🇸 Leer en español](#-español)**

### A renewed PES Editor

*Made by a PES fan for everyone who still builds their Master League by hand.* ⚽

Editor for the **EDIT00000000** file of **eFootball PES 2021** with Sider, right in your browser.

![Version](https://img.shields.io/badge/version-v0.045%20alpha-16d98a)
![Game](https://img.shields.io/badge/eFootball-PES%202021-1d6e47)
![Browser](https://img.shields.io/badge/Chrome%20%2F%20Edge-or%20Windows%20app-555)

**[▶ Open PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · **[⬇️ Download for Windows (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.045-alpha/PES-Editor-Rebuilt-Setup.exe)** · [📦 Portable](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.045-alpha/PES-Editor-Rebuilt-Portable.exe)

<sub>The Windows app is the same editor in its own window: it updates itself and connects the Sider folder even when it's inside Program Files. <a href="#-with-the-windows-app">How to install it</a></sub>

</div>

![Home screen](docs/capturas/01-intro.png)

## 🧉 Why does it exist?

Because editing PES has always been part of the game: fixing squads, changing your idol's shirt number, making the kit of your local club. The usual tools get the job done, but they got stuck in time. **PES Editor Rebuilt** brings everything together in one place, with a modern interface, the 3D Kit Studio Pro and, for the nostalgic, menu music playing in the background while you edit.

> [!WARNING]
> **Alpha version.** It works and saves to the game, but it can still have bugs. The editor makes a backup of the EDIT every time you save. Still, it's a good idea to keep your own copy before you start.

## ✨ Features

### 📁 Game file and folder
- **Finds the EDIT on its own.** It looks for `KONAMI\eFootball PES 2021 SEASON UPDATE` in your Documents folder and opens the most recent `EDIT00000000` (the one in the `drmp` folder first).
- **Also as a Windows program.** [PES Editor Rebuilt for Windows](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.045-alpha/PES-Editor-Rebuilt-Setup.exe) is the same editor in its own window, and it connects the Sider folder even when it's inside `C:\Program Files (x86)`, where Chrome and Edge can't write. It updates itself, just like the web page.
- **You pick the folder only once.** With "Allow on every visit", next time it goes straight in.
- **Several EDITs.** *File* shows every EDIT found (`drmp`, `save`, other Steam accounts) and you can switch between them.
- **Saves straight to the game.** It makes a backup of the previous file before every save.
- **Detects changes from the game.** If the game saved the EDIT while the editor was open, it reloads it so you see the same thing the game does.
- **Undo and redo** (Ctrl+Z / Ctrl+Y) for any change.
- **Installs the Sider module on its own.** When you click *Connect Sider folder*, the editor copies `edit21_db.lua` into `modules\` and adds it to `sider.ini` if it's missing (with a backup of the ini). That module is read-only: when you open the game, it saves a copy of the game database so the editor has full names, teams and squads.
- **Reads the database straight from the game files, without opening it.** If you pick the game folder when connecting Sider (the one with `PES2021.exe`, or `FL_2026.exe` in Football Life 2026) or a folder above it, the editor reads `common\etc\pesdb` from the `.cpk` files in `Data` and `download` (in Football Life, `data_s2526.cpk`, `data_s2526a.cpk`…: the newest one overrides the previous one) and adds what the Sider folders bring. The module's copy is still used when it's complete and newer.
- **Warns you if the database isn't loaded** and explains what to do: open the game to the main menu, go to *Match › Friendly* up to team selection, then close it. If Windows didn't let it write the copy, it shows the error left in `sider.log` and how to fix it.
- **WEPES tab.** Shows the files in that folder with thumbnails (png, jpg, dds, ftex), lets you open subfolders, view them large and copy new files in.

### 📋 Teams, squad and formation
- **Team list.** Search, filters (edited, unsaved), sorting, rating and estimated value.
- **Global search** to find any team or player (`/` key).
- **Squad as a data table:**
  - sort by column;
  - filter by text, position and status (starters, bench, reserves);
  - actions on several players at once (including **gear**: sleeves, socks, gloves, boots…), and the **captain** is picked from each player's *Actions* menu (marked with a **C**);
  - columns of your choice, three densities and export.
- **Player photos** (the game's minifaces) in the squad and the formation.
- **Formation on the pitch:**
  - drag players to move or swap them;
  - formation templates and three plans;
  - substitutes' bench;
  - team rating.
- **Strategy like the Game Plan.** The same options and names as the game, each with its explanation; the 4 advanced instructions (2 attacking and 2 defensive); the quick tactical options and Marking settings.
- **Captain and set pieces.** Free kicks, corners, penalties and the 3 attacking players, by hand or automatic based on abilities.
- **Rating by performance.** Uses the latest real matches; changes are shown with an animation when you apply them.
- **Squad from the game database.** If a team is empty in your EDIT, you see the squad the game ships with and you can copy it to the EDIT with one click (undo with Ctrl+Z).
- **Every player in the game in *Players*.** With the database copied, the tab shows the game's 27,000+ players as well as the ones in your EDIT: search by name, ID or team, a profile with face, teams, shirt number and every ability, and a button to add them to your EDIT and edit them.
- **National teams.** Call-ups with each country's players.
- **Data, colours, stadium, rivals and flags** for each team.

### 👕 Kit Studio Pro (Sider kit-server)
- **3D viewer with the real models:**
  - shirts, sleeves, 100+ collars, 16 shorts and socks;
  - stadium-style lighting and its own HDRI background;
  - fixed camera views and auto-rotate.
- **Visual editing of `config.txt`:**
  - collar, shorts, colours, name and number position;
  - flat view (mock-up) to place the numbers by dragging.
- **Two parts:** Uniforms (all the team's kits with their textures, order, copies and deleting) and Editor (one kit in wide screen).
- **Load a kit from a .zip.** Drag it into Uniforms, pick the slot (home, away, third, fourth or goalkeeper), it warns you if the slot already has a kit (replace or add as new), converts everything to FTEX, generates a generic normal map, shine and any missing lettering, and writes the config.txt and order.ini. If the team has no folder in the kit-server (its kits are in the .cpk files), it creates one and adds it to map.txt.
- **Upload textures to the kit-server.** Kit, normal map and fonts (name, back, chest, shorts). They're converted to the game format (FTEX) with a backup.
- **Kit shine.** The texture's alpha channel sets how much each area shines: you see it in 3D and you can paint it.
- **Fabric and relief.** Eight fabric types and a normal map generator that the game applies.
- **Font generator** for names and numbers, with outlines and shadow, following the game's templates.

### 🎨 Interface
- **Appearance:**
  - light or dark mode;
  - palettes, with colour blending with the open team's colours;
  - corners and font size;
  - your own font for the whole page.
- **A font for each style:** *Outfit* and *Big Shoulders* in Modern (modern and readable), *QuickExpress* in PES 6 Edit, *Pixelify Sans* and *Silkscreen* pixel letters in Retro (in the spirit of the PS1 Winning Elevens) and *Tahoma* in Classic. You can change it for each style in Appearance, and they work offline.
- **🖥️ Graphics:**
  - *Modern*, *Classic* (the old desktop editor), *Retro* (PS2 menus) and **PES 6 Edit** modes, the last one inspired by the PES 6 Edit menu: silver bars, golden yellow selection and a blurred amber background;
  - the PES 6 menu's *confirm* and *undo* sounds when you click options and go back;
  - with Classic, Retro or PES 6, Appearance only lets you adjust font size, font and effects;
  - *Low* quality (no animations or effects, for slow PCs), *Medium* or *High* (3D with supersampling and maxed-out effects).
- **Animated intro** with the logo and a neon glow while the EDIT loads.
- **Music player** at the bottom left:
  - cover art, shuffle, repeat and volume;
  - *Cut*, *Smooth* or *Remix* transitions between songs (DJ-style filters and echo);
  - add your own songs and the editor reads **title, artist and cover art** from their tags (MP3, FLAC, M4A);
  - **YouTube playlists and videos** by pasting the link (with the player minimized, the video sits above the bar if there's free space on the left; otherwise, to the side).
- **What's new.** Every change with its date, an explanation and steps to use it.
- **Installable as an app** from Chrome or Edge, with its own icon and offline support.

## 📸 Screenshots

| Squad | Formation |
|---|---|
| ![Squad](docs/capturas/02-plantel.png) | ![Formation](docs/capturas/03-formacion.png) |
| **Kit Studio Pro** | **What's new** |
| ![Kit Studio Pro](docs/capturas/04-estudio-kits.png) | ![What's new](docs/capturas/05-novedades.png) |
| **Appearance (light mode)** | **Graphics** |
| ![Appearance](docs/capturas/06-apariencia-modo-claro.png) | ![Graphics](docs/capturas/07-graficos.png) |
| **PES 6 Edit style** | **Retro style** |
| ![PES 6 Edit style](docs/capturas/08-estilo-pes6.png) | ![Retro style](docs/capturas/09-estilo-retro.png) |

## 🚀 How to use it

There are two ways to use the same editor: in the browser or with the Windows app. If your Sider folder is inside `C:\Program Files (x86)` (where Steam installs PES 2021), use the app, because the browser can't save there.

### 🌐 In the browser

1. Open **[PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** in **Chrome** or **Edge**. Firefox and Safari don't let a web page read folders yet.
2. Click **"📂 Pick my Documents folder"** and then *Select folder*.
3. In the browser prompt, choose **"Allow on every visit"** so you don't have to repeat this step.
4. **Click "Connect Sider folder"** and pick the game's Sider folder (the one with `sider.exe`, inside the game folder). That loads the **player names, ratings and values**, faces, crests and kits. You only pick it once.
5. **The first time, prepare the game database** (not needed if you picked the game folder in step 4). The editor installs the `edit21_db.lua` module in Sider and lets you know. Open the game with Sider to the **main menu**, go to **Match › Friendly** up to **team selection** and close the game. Go back to the editor and click **"Done"**.
6. Edit and click **"Save to the game"**. Close the game before saving.

> [!TIP]
> **No player names or ratings?** If the squad shows *"no name · connect the Sider folder"* or the rating and value columns are empty, step 4 is missing: click **"Connect Sider folder"** at the top and pick the Sider folder. The EDIT only stores your changes; each player's full data comes from the game database. If you had already connected it and the browser asks for permission again, click **"Allow"**.
>
> **The database warning won't go away?** Check `sider.log` in the Sider folder and look for the `[edit21_db]` lines. If it says `copiado ...`, the copy worked: click **"Done"**. If it says `ERROR no puedo escribir ... -> nil`, it's Sider's `io`, which doesn't let it save files on some installs: since v1.5 the module works around it by writing with the Windows functions, as long as `sider.ini` has `luajit.ext.enabled = 1` (the game already has it). If the error says *Permission denied*, check **Windows Security › Virus & threat protection › Ransomware protection › Controlled folder access** and allow `PES2021.exe`.

**Install it from the browser:** in Chrome or Edge, click the install icon in the address bar (or menu ⋮ → *Install PES Editor Rebuilt*). To connect a Sider folder inside Program Files you need the Windows app.

### 💻 With the Windows app

1. Download the **[installer (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.045-alpha/PES-Editor-Rebuilt-Setup.exe)** or the **[portable version](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.045-alpha/PES-Editor-Rebuilt-Portable.exe)**, which runs without installing anything.
2. If Windows shows **"Windows protected your PC"**, click **More info › Run anyway**.
3. Open **PES Editor Rebuilt**, click **"📂 Pick my Documents folder"** and then **"Connect Sider folder"**. The Sider folder is connected where it is, even inside Program Files, with permission to save.
4. Then follow steps 5 and 6 above: the game database and **"Save to the game"**.

> [!NOTE]
> **It updates itself.** The app opens the editor from its web page every time it starts, so everything new (the editor, the rating, the interface, the cache) reaches it just like the web, without reinstalling. You only need a new .exe when the app itself changes: the logo, the name or how it reaches your folders. That happens very rarely, and then you install the new one over the old one.
>
> **Why does "Windows protected your PC" show up?** The app doesn't have a digital signature yet, which is a certificate that tells Windows who made the program. Without it Windows warns you the first time, but the app works the same. The code and the .exe build are open in this repository ([`desktop/`](desktop/)).
>
> **Can't save?** If Windows doesn't let it write to a folder, the app tells you: close it and open it with right click › *Run as administrator*. If the game has a file open, it asks you to close it.

**Privacy:** in the browser and in the app, everything is processed on your PC. Your files are never uploaded to any server.

## 🎵 Music

Because of copyright, the repository **doesn't include** music from the games. The player works anyway:

- **＋ Add songs:** pick files from your PC and they're added with their cover art.
- **▶ YouTube:** paste the link to a playlist or a video. YouTube doesn't allow hiding its videos, so they show up small above the player (or in place of the cover art, with the panel open).

Everything is saved in your browser.

## 🗺️ Coming next

PES Editor is still in development. This is what's coming (it may change):

- More options in Kit Studio Pro and in stadium editing.
- Improvements to the installable version (shortcuts, more complete offline support).
- Fixes based on what users report.

To hear about every version, click **Watch → Custom → Releases** at the top of this repository. Inside the editor, the **What's new** tab shows a dot when there's something new.

Found a bug or had an idea? Open an [issue](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/issues/new/choose): there's a template for **🐛 Algo no anda** (something's not working) and another for **💡 Tengo una idea** (I have an idea). Everything helps, like a good through ball.

## 🧩 How the code is built

It's all HTML, CSS and JavaScript, with no frameworks and nothing to install. `index.html` is short: it loads `css/editor.css` and the files in the `js/` folder, one for each part of the editor, in this order:

| File | What it does |
|---|---|
| `pescrypt.js`, `pesdata.js` | Decrypts EDIT00000000 and reads/writes teams, players and tactics |
| `tables.js`, `dds.js`, `faces.js`, `pitch.js` | Game tables, DDS images, minifaces and crests, pitch drawing |
| `extras.js`, `matches.js`, `natcall.js` | Formation, rating by performance, national team call-ups |
| `ftexenc.js`, `kitfont.js`, `kitmat.js`, `kitstudio.js`, `kitpack.js`, `kit3d.js` | Kit Studio Pro: FTEX textures, fonts, fabrics, models and 3D viewer |
| `luadata.js`, `siderdb.js`, `gamedb.js` | The `edit21_db.lua` Sider module (installs itself) and reading the game database (from the module's copy or straight from the `.cpk` files) |
| `intro.js`, `news.js`, `help.js` | Loading screen, What's new and help |
| `app.js`, `motion.js`, `ui.js`, `gfx.js` | The page itself, animations, Appearance and Graphics |
| `fonts.js`, `logos.js`, `sfxdata.js` | Bundled fonts, logos and sounds |
| `mptags.js`, `music.js`, `mpyt.js` | Player: song tags, audio and YouTube |

To try a change, just edit the file and reload the page.

## 🙌 Credits and inspiration

This project is inspired by **PES 2020 Editor**, the original tool created by **[ejogc327](https://ejogc327.blogspot.com/2022/10/pes-2020-editor-v0-12.html)**. Thanks for paving the way.

The 3D kit models are based on the *CometKIT previewer*. The font templates follow the game's format. Fonts: *QuickExpress* (repaired and extended with Spanish letters) and, under the free SIL OFL license, *Outfit*, *Big Shoulders*, *Pixelify Sans* and *Silkscreen*. The *PES 6 Edit* style is a tribute: the design is handmade, with no images from the game, and it uses two short sounds from its menu (confirm and undo).

## 📄 License

Code under the [BSD 3-Clause](LICENSE) license.

<div align="center">

Made with ❤️ and mate in Argentina 🇦🇷

</div>

<sub>PES Editor is a fan project with no connection to Konami. *eFootball* and *Pro Evolution Soccer* are trademarks of Konami Digital Entertainment. Use it at your own risk and keep copies of your files.</sub>

<br>

---

## 🇪🇸 Español

<div align="center">

### Un PES Editor renovado

*Hecho por un fanático del PES para los que todavía arman su Liga Master a mano.* ⚽

Editor del archivo **EDIT00000000** de **eFootball PES 2021** con Sider, directo en el navegador.

![Versión](https://img.shields.io/badge/versi%C3%B3n-v0.045%20alpha-16d98a)
![Juego](https://img.shields.io/badge/eFootball-PES%202021-1d6e47)
![Navegador](https://img.shields.io/badge/Chrome%20%2F%20Edge-o%20app%20para%20Windows-555)

**[▶ Abrir PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · **[⬇️ Descargar para Windows (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.045-alpha/PES-Editor-Rebuilt-Setup.exe)** · [📦 Portátil](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.045-alpha/PES-Editor-Rebuilt-Portable.exe)

<sub>La app para Windows es el mismo editor en su propia ventana: se actualiza sola y conecta la carpeta Sider aunque esté en Archivos de programa. <a href="#-con-la-app-para-windows">Cómo instalarla</a></sub>

</div>

## 🧉 ¿Por qué existe?

Porque editar el PES siempre fue parte del juego: corregir planteles, cambiar el dorsal de tu ídolo, armar la camiseta del club del barrio. Las herramientas de siempre hacen el trabajo, pero se quedaron en el tiempo. **PES Editor Rebuilt** junta todo en un solo lugar, con una interfaz moderna, el Kit Studio Pro en 3D y, para los nostálgicos, música de menú de fondo mientras editás.

> [!WARNING]
> **Versión alpha.** Funciona y guarda en el juego, pero todavía puede tener errores. El editor hace una copia de respaldo del EDIT cada vez que guardás. Igual, conviene tener tu propia copia antes de empezar.

## ✨ Características

### 📁 Archivo y carpeta del juego
- **Encuentra el EDIT solo.** Busca `KONAMI\eFootball PES 2021 SEASON UPDATE` en tu carpeta Documentos y abre el `EDIT00000000` más reciente (primero el de la carpeta `drmp`).
- **También como programa para Windows.** [PES Editor Rebuilt para Windows](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.045-alpha/PES-Editor-Rebuilt-Setup.exe) es el mismo editor en su propia ventana, y conecta la carpeta Sider aunque esté dentro de `C:\Program Files (x86)`, donde Chrome y Edge no dejan escribir. Se actualiza solo, igual que la página.
- **Elegís la carpeta una sola vez.** Con "Permitir en cada visita", las veces siguientes entra directo.
- **Varios EDIT.** En *Archivo* se ven todos los EDIT encontrados (`drmp`, `save`, otras cuentas de Steam) y podés cambiar de uno a otro.
- **Guarda directo en el juego.** Hace una copia de respaldo del archivo anterior antes de cada guardado.
- **Detecta cambios del juego.** Si el juego guardó el EDIT mientras el editor estaba abierto, lo recarga para que veas lo mismo que el juego.
- **Deshacer y rehacer** (Ctrl+Z / Ctrl+Y) para cualquier cambio.
- **Instala solo el módulo de Sider.** Al tocar *Conectar carpeta Sider*, el editor copia `edit21_db.lua` en `modules\` y lo suma a `sider.ini` si falta (con copia de respaldo del ini). Ese módulo es de solo lectura: cuando abrís el juego, guarda una copia de la base del juego para que el editor tenga nombres, equipos y planteles completos.
- **Lee la base directo de los archivos del juego, sin abrirlo.** Si al conectar Sider elegís la carpeta del juego (la que tiene `PES2021.exe`, o `FL_2026.exe` en Football Life 2026) o una de más arriba, el editor lee `common\etc\pesdb` de los `.cpk` de `Data` y `download` (en Football Life, `data_s2526.cpk`, `data_s2526a.cpk`…: el más nuevo pisa al anterior) y le suma lo que agregan las carpetas de Sider. La copia del módulo se sigue usando cuando está completa y es más nueva.
- **Avisa si la base no está cargada** y explica qué hacer: abrir el juego hasta el menú principal, entrar en *Partido › Amistoso* hasta la elección de equipos y cerrar. Si Windows no dejó escribir la copia, muestra el error que quedó en `sider.log` y cómo resolverlo.
- **Pestaña WEPES.** Muestra los archivos de esa carpeta con miniaturas (png, jpg, dds, ftex), deja entrar a subcarpetas, ver en grande y copiar archivos nuevos.

### 📋 Equipos, plantel y formación
- **Lista de equipos.** Búsqueda, filtros (editados, sin guardar), orden, valoración y valor estimado.
- **Buscador global** para encontrar cualquier equipo o jugador (tecla `/`).
- **Plantel como tabla de datos:**
  - ordenar por columna;
  - filtrar por texto, posición y situación (titulares, banco, reserva);
  - acciones sobre varios jugadores a la vez (incluida la **equipación**: mangas, medias, guantes, botines…), y el **capitán** se elige desde el menú *Acciones* de cada jugador (queda marcado con una **C**);
  - columnas a elección, tres densidades y exportar.
- **Fotos de los jugadores** (minicaras del juego) en el plantel y la formación.
- **Formación sobre la cancha:**
  - arrastrás jugadores para moverlos o intercambiarlos;
  - plantillas de formación y tres planes;
  - banco de suplentes;
  - valoración del equipo.
- **Estrategia como en el Plan de juego.** Las mismas opciones y nombres que el juego, cada una con su explicación; las 4 instrucciones avanzadas (2 de ataque y 2 de defensa); las opciones tácticas rápidas y la Config. marcaje.
- **Capitán y balón parado.** Tiros libres, córners, penales y los 3 jugadores ofensivos, a mano o automático según las habilidades.
- **Valoración por rendimiento.** Usa los últimos partidos reales; los cambios se ven con una animación al aplicarlos.
- **Plantel según la base del juego.** Si un equipo está vacío en tu EDIT, se ve el plantel que trae el juego y se puede copiar al EDIT con un toque (se deshace con Ctrl+Z).
- **Todos los jugadores del juego en *Jugadores*.** Con la base copiada, la pestaña muestra los más de 27.000 jugadores del juego además de los de tu EDIT: búsqueda por nombre, ID o equipo, ficha con cara, equipos, dorsal y todas las habilidades, y un botón para agregarlo a tu EDIT y editarlo.
- **Selecciones nacionales.** Convocatorias con los jugadores de cada país.
- **Datos, colores, estadio, rivales y banderas** de cada equipo.

### 👕 Kit Studio Pro (kit-server de Sider)
- **Visor 3D con los modelos reales:**
  - camisetas, mangas, más de 100 cuellos, 16 shorts y medias;
  - iluminación tipo estadio y fondo HDRI propio;
  - vistas de cámara fijas y giro automático.
- **Edición visual del `config.txt`:**
  - cuello, short, colores, posición de nombre y números;
  - vista plana (maqueta) para acomodar los números arrastrando.
- **Dos partes:** Uniformes (todos los kits del equipo con sus texturas, orden, copias y borrado) y Editor (un kit a pantalla ancha).
- **Cargar un kit desde un .zip.** Se arrastra a Uniformes, se elige el puesto (titular, suplente, tercera, cuarta o arquero), se avisa si el puesto ya tiene kit (reemplazar o agregar como nuevo), se convierte todo a FTEX, se generan genéricos el normal map, el brillo y las letras que falten, y se escriben el config.txt y el order.ini. Si el equipo no tiene carpeta en el kit-server (sus kits están en los .cpk), se le crea una y se anota en map.txt.
- **Subir texturas al kit-server.** Kit, normal map y fuentes (nombre, espalda, pecho, short). Se convierten al formato del juego (FTEX) con copia de respaldo.
- **Brillo del kit.** El canal alfa de la textura marca cuánto brilla cada zona: se ve en el 3D y se puede pintar.
- **Tela y relieve.** Ocho tipos de tela y un generador de normal map que el juego aplica.
- **Generador de fuentes** para nombres y números, con bordes y sombra, respetando las plantillas del juego.

### 🎨 Interfaz
- **Apariencia:**
  - modo claro u oscuro;
  - paletas, con mezcla de colores con los del equipo abierto;
  - esquinas y tamaño de letra;
  - fuente propia para toda la página.
- **Una fuente para cada estilo:** *Outfit* y *Big Shoulders* en Moderno (modernas y legibles), *QuickExpress* en PES 6 Editar, letras de píxeles *Pixelify Sans* y *Silkscreen* en Retro (en la onda de los Winning Eleven de PS1) y *Tahoma* en Clásico. Se puede cambiar en cada estilo desde Apariencia y funcionan sin internet.
- **🖥️ Gráficos:**
  - modos *Moderno*, *Clásico* (editor de escritorio de antes), *Retro* (menús de PS2) y **PES 6 Editar**, inspirado en el menú Editar de PES 6: barras plateadas, selección amarilla dorada y fondo ámbar desenfocado;
  - sonidos de *confirmar* y *deshacer* del menú de PES 6 al tocar opciones y al volver;
  - con Clásico, Retro o PES 6, Apariencia deja ajustar solo tamaño de letra, fuente y efectos;
  - calidad *Baja* (sin animaciones ni efectos, para PCs lentas), *Media* o *Alta* (3D con supermuestreo y efectos al máximo).
- **Intro animada** con el logo y brillo neón mientras carga el EDIT.
- **Reproductor de música** abajo a la izquierda:
  - carátula, aleatorio, repetir y volumen;
  - pases entre canciones *Corte*, *Suave* o *Remix* (filtros y eco estilo DJ);
  - agregás tus canciones y el editor lee **título, artista y carátula** de sus etiquetas (MP3, FLAC, M4A);
  - **listas y videos de YouTube** pegando el link (con el reproductor minimizado, el video va arriba de la barra si hay espacio libre a la izquierda; si no, al costado).
- **Novedades.** Cada cambio con fecha, explicación y pasos para usarlo.
- **Instalable como app** desde Chrome o Edge, con su ícono y funcionamiento sin internet.

## 📸 Capturas

| Plantel | Formación |
|---|---|
| ![Plantel](docs/capturas/02-plantel.png) | ![Formación](docs/capturas/03-formacion.png) |
| **Kit Studio Pro** | **Novedades** |
| ![Kit Studio Pro](docs/capturas/04-estudio-kits.png) | ![Novedades](docs/capturas/05-novedades.png) |
| **Apariencia (modo claro)** | **Gráficos** |
| ![Apariencia](docs/capturas/06-apariencia-modo-claro.png) | ![Gráficos](docs/capturas/07-graficos.png) |
| **Estilo PES 6 Editar** | **Estilo Retro** |
| ![Estilo PES 6 Editar](docs/capturas/08-estilo-pes6.png) | ![Estilo Retro](docs/capturas/09-estilo-retro.png) |

## 🚀 Cómo usarlo

Hay dos formas de usar el mismo editor: en el navegador o con la app para Windows. Si tu carpeta Sider está dentro de `C:\Program Files (x86)` (donde Steam instala PES 2021), usá la app, porque el navegador no deja guardar ahí.

### 🌐 En el navegador

1. Abrí **[PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** en **Chrome** o **Edge**. Firefox y Safari todavía no permiten que una página lea carpetas.
2. Tocá **"📂 Elegir mi carpeta Documentos"** y después *Seleccionar carpeta*.
3. En el aviso del navegador elegí **"Permitir en cada visita"** para no repetir el paso.
4. **Tocá "Conectar carpeta Sider"** y elegí la carpeta de Sider del juego (la que tiene `sider.exe`, dentro de la carpeta del juego). Con eso se cargan los **nombres de los jugadores, sus valoraciones y valores**, las caras, los escudos y los kits. Se elige una sola vez.
5. **La primera vez, prepará la base del juego** (no hace falta si en el paso 4 elegiste la carpeta del juego). El editor instala el módulo `edit21_db.lua` en Sider y te avisa. Abrí el juego con Sider hasta el **menú principal**, entrá en **Partido › Amistoso** hasta la **elección de equipos** y cerrá el juego. Volvé al editor y tocá **"Ya lo hice"**.
6. Editá y tocá **"Guardar en el juego"**. Cerrá el juego antes de guardar.

> [!TIP]
> **¿No ves nombres de jugadores ni valoraciones?** Si en el plantel aparece *"sin nombre · conectá la carpeta Sider"* o las columnas de valoración y valor están vacías, falta el paso 4: tocá **"Conectar carpeta Sider"** arriba y elegí la carpeta de Sider. El EDIT solo guarda tus cambios; los datos completos de cada jugador vienen de la base del juego. Si ya la habías conectado y el navegador te pide permiso de nuevo, tocá **"Permitir"**.
>
> **¿El aviso de la base no se va?** Mirá el `sider.log` en la carpeta de Sider y buscá las líneas `[edit21_db]`. Si dice `copiado ...`, la copia se hizo: tocá **"Ya lo hice"**. Si dice `ERROR no puedo escribir ... -> nil`, es el `io` de Sider, que en algunas instalaciones no deja guardar archivos: desde la v1.5 el módulo lo resuelve solo escribiendo con las funciones de Windows, siempre que `sider.ini` tenga `luajit.ext.enabled = 1` (el juego ya lo trae). Si el error dice *Permission denied*, revisá **Seguridad de Windows › Protección contra ransomware › Acceso controlado a carpetas** y permití `PES2021.exe`.

**Instalarlo desde el navegador:** en Chrome o Edge tocá el ícono de instalar en la barra de direcciones (o menú ⋮ → *Instalar PES Editor Rebuilt*). Para conectar una carpeta Sider que está en Archivos de programa hace falta la app para Windows.

### 💻 Con la app para Windows

1. Descargá el **[instalador (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.045-alpha/PES-Editor-Rebuilt-Setup.exe)** o la **[versión portátil](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.045-alpha/PES-Editor-Rebuilt-Portable.exe)**, que se abre sin instalar nada.
2. Si Windows muestra **"Windows protegió su PC"**, tocá **Más información › Ejecutar de todas formas**.
3. Abrí **PES Editor Rebuilt**, tocá **"📂 Elegir mi carpeta Documentos"** y después **"Conectar carpeta Sider"**. La carpeta Sider se conecta donde está, aunque sea dentro de Archivos de programa, con permiso para guardar.
4. Seguí con los pasos 5 y 6 de arriba: la base del juego y **"Guardar en el juego"**.

> [!NOTE]
> **Se actualiza sola.** La app abre el editor desde su página web cada vez que arranca, así que todo lo nuevo (el editor, la valoración, la interfaz, el caché) le llega igual que a la web, sin reinstalar. Solo hace falta bajar un .exe nuevo cuando cambia la app en sí: el logo, el nombre o cómo accede a tus carpetas. Pasa muy de vez en cuando, y ahí instalás el nuevo encima.
>
> **¿Por qué aparece "Windows protegió su PC"?** La app todavía no tiene firma digital, que es un certificado que le dice a Windows quién hizo el programa. Sin ella Windows avisa la primera vez, pero la app funciona igual. El código y el armado del .exe están a la vista en este repositorio ([`desktop/`](desktop/)).
>
> **¿No deja guardar?** Si Windows no deja escribir en una carpeta, la app te avisa: cerrala y abrila con clic derecho › *Ejecutar como administrador*. Si el juego tiene un archivo abierto, te pide que lo cierres.


**Privacidad:** en el navegador y en la app, todo se procesa en tu PC. Tus archivos no se suben a ningún servidor.

## 🎵 Música

Por derechos de autor, el repositorio **no incluye** música de los juegos. El reproductor funciona igual:

- **＋ Agregar canciones:** elegís archivos de tu PC y se suman con su carátula.
- **▶ YouTube:** pegás el link de una lista o un video. YouTube no permite ocultar sus videos, así que se ven chiquitos arriba del reproductor (o en lugar de la carátula, con el panel abierto).

Todo queda guardado en tu navegador.

## 🗺️ Próximas actualizaciones

PES Editor sigue en desarrollo. Esto es lo que viene (puede cambiar):

- Más opciones en el Kit Studio Pro y en la edición de estadios.
- Mejoras en la versión instalable (accesos directos, funcionamiento sin conexión más completo).
- Correcciones a partir de lo que reporten los usuarios.

Para enterarte de cada versión, tocá **Watch → Custom → Releases** arriba en este repositorio. Dentro del editor, la pestaña **Novedades** muestra un punto cuando hay algo nuevo.

¿Encontraste un error o se te ocurrió algo? Abrí un [issue](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/issues/new/choose): hay una plantilla para **🐛 Algo no anda** y otra para **💡 Tengo una idea**. Todo suma, como un buen pase al vacío.

## 🧩 Cómo está armado el código

Todo es HTML, CSS y JavaScript sin frameworks ni instalación. `index.html` es corto: carga `css/editor.css` y los archivos de la carpeta `js/`, uno por cada parte del editor, en este orden:

| Archivo | Qué hace |
|---|---|
| `pescrypt.js`, `pesdata.js` | Descifra el EDIT00000000 y lee/escribe equipos, jugadores y tácticas |
| `tables.js`, `dds.js`, `faces.js`, `pitch.js` | Tablas del juego, imágenes DDS, minicaras y escudos, dibujo de la cancha |
| `extras.js`, `matches.js`, `natcall.js` | Formación, valoración por rendimiento, convocatorias de selecciones |
| `ftexenc.js`, `kitfont.js`, `kitmat.js`, `kitstudio.js`, `kitpack.js`, `kit3d.js` | Kit Studio Pro: texturas FTEX, fuentes, telas, modelos y visor 3D |
| `luadata.js`, `siderdb.js`, `gamedb.js` | Módulo de Sider `edit21_db.lua` (se instala solo) y lectura de la base del juego (de la copia del módulo o directo de los `.cpk`) |
| `intro.js`, `news.js`, `help.js` | Pantalla de carga, Novedades y ayudas |
| `app.js`, `motion.js`, `ui.js`, `gfx.js` | La página en sí, animaciones, Apariencia y Gráficos |
| `fonts.js`, `logos.js`, `sfxdata.js` | Fuentes, logos y sonidos incluidos |
| `mptags.js`, `music.js`, `mpyt.js` | Reproductor: etiquetas de canciones, audio y YouTube |

Para probar un cambio alcanza con editar el archivo y recargar la página.

## 🙌 Créditos e inspiración

Este proyecto toma inspiración de **PES 2020 Editor**, la herramienta original creada por **[ejogc327](https://ejogc327.blogspot.com/2022/10/pes-2020-editor-v0-12.html)**. Gracias por abrir el camino.

Los modelos 3D de los kits se basan en el *CometKIT previewer*. Las plantillas de fuentes siguen el formato del juego. Fuentes: *QuickExpress* (reparada y ampliada con letras del español) y, con licencia libre SIL OFL, *Outfit*, *Big Shoulders*, *Pixelify Sans* y *Silkscreen*. El estilo *PES 6 Editar* es un homenaje: el diseño está hecho a mano, sin imágenes del juego, y usa dos sonidos cortos de su menú (confirmar y deshacer).

## 📄 Licencia

Código bajo licencia [BSD 3-Clause](LICENSE).

---

<div align="center">

Hecho con ❤️ y mate en Argentina 🇦🇷

</div>

<sub>PES Editor es un proyecto de fans sin relación con Konami. *eFootball* y *Pro Evolution Soccer* son marcas de Konami Digital Entertainment. Usalo bajo tu responsabilidad y guardá copias de tus archivos.</sub>
