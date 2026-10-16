<p align="center"><sub>🇬🇧 English · <b>🇪🇸 Versión en español más abajo ⬇️</b></sub></p>

<div align="center">

# 🔤 Fonts move into Kit Studio, with their requirements

**[▶ Open PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · **[⬇️ Windows app (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.058-alpha/PES-Editor-Rebuilt-Setup.exe)** · [📦 Portable version](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.058-alpha/PES-Editor-Rebuilt-Portable.exe)

</div>

A small one, but it puts things where they belong. The shirt font creator now lives **inside Kit Studio Pro**, next to the kits it's made for. And before you start, it tells you **exactly what the game needs** to show it, and fixes it for you. 👕

## 🔤 Fonts, now a Kit Studio Pro section

**Teams → pick the club → Kit Studio Pro** now has three sections: **👕 Uniforms · 🛠 Editor · 🔤 Fonts**.

- Fonts works on the team you're looking at, so there's no team list to pick from anymore.
- **👁 View in the Editor** jumps to the 3D kit with the new font on, without saving it.
- Teams without a kit folder can use it too: the font downloads as a .zip to copy by hand.
- The separate Fonts tab at the top is gone.

<img alt="Kit Studio Pro with its three sections, Uniforms, Editor and Fonts, and the font creator open with its requirements box" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.058/fuentes-en.png" width="100%">

## ✅ Requirements to see it in the game

At the top of Fonts there's a box with the four things the game needs. If your Sider folder is connected, each one says whether it's **Done** or **Missing**, and brings a button to fix it:

1. **Sider with kserv**: kserv.lua and the content\kit-server folder, where the kits live.
2. **Download KitPos 6.4 or newer**: the Sider module that draws the name with your font, in Sider\modules\kitpos.lua. **Install KitPos** copies it for you, and **Download kitpos.lua** gives you the file to copy by hand.
3. **Set it up in sider.ini**: it shows the exact lines (kitpos.lua below kserv.lua, with luajit.ext.enabled = 1), with **Copy lines** and **Fix sider.ini** (a backup is kept).
4. **Lowercase enabled**: minusculas_juego = 1 in content\kitpos\kitpos_slots.ini, with an **Enable lowercase** button.

<img alt="The requirements box with the four steps marked Done" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.058/requisitos-en.png" width="70%">

## 🧩 Sider modules come back by themselves

- If sider.ini loads **edit21_db.lua** but the file isn't in modules (or it's an old one), the editor **puts it back when it opens**.
- In the **Sider** tab, a module marked "File missing in modules" now has an **⬇ Install the file** button for the ones the editor comes with (edit21_db.lua and kitpos.lua).
- If the file disappears right after being saved, the editor tells you: it's almost always the **antivirus**, and it explains how to restore it.

## ⬇️ Do I need to download anything?

**No.** All of this is in the editor, and the Windows app loads it from the internet on its own: the next time you open it (or when "A new version of the editor is available" shows up) you've got it.

> This is an alpha version and the fonts are still being tested in the game. If a letter shows up shifted or cut off, tell us in 💡 Ideas → Something's not working. ⚽

<br>

---

<!-- es -->
<div align="center">

### 🇪🇸 Versión en español

</div>

<div align="center">

# 🔤 Las fuentes pasan a Kit Studio, con sus requisitos

**[▶ Abrir PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · **[⬇️ App para Windows (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.058-alpha/PES-Editor-Rebuilt-Setup.exe)** · [📦 Versión portátil](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.058-alpha/PES-Editor-Rebuilt-Portable.exe)

</div>

Una versión chica, pero que pone las cosas en su lugar. El creador de fuentes de la camiseta ahora vive **dentro de Kit Studio Pro**, al lado de los kits para los que se hace. Y antes de empezar te dice **exactamente qué necesita el juego** para mostrarla, y te lo arregla. 👕

## 🔤 Fuentes, ahora una sección de Kit Studio Pro

**Equipos → elegí el club → Kit Studio Pro** ahora tiene tres secciones: **👕 Uniformes · 🛠 Editor · 🔤 Fuentes**.

- Fuentes trabaja con el equipo que estás viendo, así que ya no hay que elegirlo de una lista.
- **👁 Ver en el Editor** salta al kit en 3D con la fuente nueva puesta, sin guardarla.
- Los equipos sin carpeta de kits también pueden usarla: la fuente se baja en un .zip para copiarla a mano.
- La pestaña Fuentes de arriba ya no está.

<img alt="Kit Studio Pro con sus tres secciones, Uniformes, Editor y Fuentes, y el creador de fuentes abierto con su cuadro de requisitos" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.058/fuentes-es.png" width="100%">

## ✅ Requisitos para verla en el juego

Arriba de Fuentes hay un cuadro con las cuatro cosas que necesita el juego. Si tu carpeta Sider está conectada, cada una dice si está **Listo** o **Falta**, y trae un botón para arreglarlo:

1. **Sider con kserv**: kserv.lua y la carpeta content\kit-server, donde viven los kits.
2. **Descargar KitPos 6.4 o más nuevo**: el módulo de Sider que dibuja el nombre con tu fuente, en Sider\modules\kitpos.lua. **Instalar KitPos** lo copia solo, y **Descargar kitpos.lua** te da el archivo para copiarlo a mano.
3. **Configurarlo en sider.ini**: muestra las líneas exactas (kitpos.lua debajo de kserv.lua, con luajit.ext.enabled = 1), con **Copiar líneas** y **Arreglar sider.ini** (se guarda una copia).
4. **Minúsculas activadas**: minusculas_juego = 1 en content\kitpos\kitpos_slots.ini, con un botón **Activar minúsculas**.

<img alt="El cuadro de requisitos con los cuatro pasos en Listo" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.058/requisitos-es.png" width="70%">

## 🧩 Los módulos de Sider vuelven solos

- Si sider.ini carga **edit21_db.lua** pero el archivo no está en modules (o es uno viejo), el editor **lo vuelve a poner al abrirse**.
- En la pestaña **Sider**, un módulo con "Falta el archivo en modules" ahora trae el botón **⬇ Instalar el archivo** para los que trae el editor (edit21_db.lua y kitpos.lua).
- Si el archivo desaparece justo después de guardarlo, el editor te avisa: casi siempre es el **antivirus**, y te explica cómo recuperarlo.

## ⬇️ ¿Tengo que descargar algo?

**No.** Todo esto está en el editor, y la app de Windows lo carga sola desde internet: la próxima vez que la abras (o cuando aparezca "Hay una versión nueva del editor") ya lo tenés.

> Es una versión alfa y las fuentes todavía se están probando en el juego. Si una letra sale corrida o cortada, avisanos en 💡 Ideas → Algo no anda. ⚽
