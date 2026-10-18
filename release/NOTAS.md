<p align="center"><sub>🇬🇧 English · <b>🇪🇸 Versión en español más abajo ⬇️</b></sub></p>

<div align="center">

# 🔤 Fonts with lowercase the game actually reads

**[▶ Open PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · **[⬇️ Windows app (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.060-alpha/PES-Editor-Rebuilt-Setup.exe)** · [📦 Portable version](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.060-alpha/PES-Editor-Rebuilt-Portable.exe)

</div>

**Fernández, Müller, Łukasiewicz, Иванов.** The font creator in Kit Studio now saves the name font **exactly like a kit that already shows lowercase and accents in the game**. We took a kit that worked in-game, looked at every file it had, and made the editor build the same thing. ✍️

## 📐 Every letter in its place

**Teams → pick the club → Kit Studio Pro → 🔤 Fonts** now puts each letter where KitPos's general table says, `content\kitpos\minusculas.txt`:

- **371 letters**: uppercase, lowercase, numbers, accents, Ñ, Central Europe, Cyrillic and Greek.
- One **4096×4096** texture (DXT5, 13 mips), the same size and format as the kit that works.
- Before, each font made its own order of letters, and in the game they could come out **mixed up**. Not anymore.

<img alt="Top: a kit's font that works in the game. Bottom: a font made by the editor, with every letter in the same place" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.060/mismo-lugar.png" width="100%">

## 🏷 The file is named after the kit

**Save in the kit folder** creates the texture with the kit's own name, like `u2689p1_name.dds` and `.ftex`, and points `NameFontFile` in config.txt to it. It no longer overwrites a shared texture like `font white`.

- It turns on **NameLower = 1** for that kit in kitpos_slots.ini, so the game uses the lowercase.
- If the kit had an old `kitpos_letras.txt`, it keeps it as `.bak-edit21` and removes it, because it would scramble the letters.
- If your Sider doesn't have `minusculas.txt`, the editor copies it.

<img alt="The Fonts section in PES 6 mode with the name Fernández on a green shirt" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.060/fuentes-en.png" width="100%">

## 📦 One .zip per kit

**Download .zip** builds the folders just like in Sider: the chosen kit (or every kit with **All**) with its texture, plus `minusculas.txt`, the NameLower line for kitpos_slots.ini and a LEEME. **Unzip it straight into your Sider folder** and every file lands in its place.

<img alt="The letter texture: 371 letters in a 4096×4096 texture" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.060/textura-en.png" width="80%">

## ⬇️ Do I need to download anything?

**No.** All of this is in the editor, and the Windows app loads it from the internet on its own: the next time you open it (or when "A new version of the editor is available" shows up) you've got it. You need KitPos 6.4 or newer in Sider, and the Requirements box in Fonts tells you if anything is missing.

> This is an alpha version. If a name comes out wrong in the game, tell us in 💡 Ideas → Something's not working. ⚽

<br>

---

<!-- es -->
<div align="center">

### 🇪🇸 Versión en español

</div>

<div align="center">

# 🔤 Fuentes con minúsculas que el juego sí lee

**[▶ Abrir PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · **[⬇️ App para Windows (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.060-alpha/PES-Editor-Rebuilt-Setup.exe)** · [📦 Versión portátil](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.060-alpha/PES-Editor-Rebuilt-Portable.exe)

</div>

**Fernández, Müller, Łukasiewicz, Иванов.** El creador de fuentes de Kit Studio ahora guarda la fuente del nombre **igual que un kit que ya muestra minúsculas y tildes en el juego**. Tomamos un kit que funcionaba, miramos cada archivo que tenía e hicimos que el editor arme lo mismo. ✍️

## 📐 Cada letra en su lugar

**Equipos → elegí el club → Kit Studio Pro → 🔤 Fuentes** ahora pone cada letra donde dice la tabla general de KitPos, `content\kitpos\minusculas.txt`:

- **371 letras**: mayúsculas, minúsculas, números, tildes, Ñ, Europa central, cirílico y griego.
- Una textura de **4096×4096** (DXT5, 13 mips), del mismo tamaño y formato que el kit que funciona.
- Antes cada fuente armaba su propio orden de letras y en el juego podían salir **mezcladas**. Eso se terminó.

<img alt="Arriba: la fuente de un kit que funciona en el juego. Abajo: una fuente hecha con el editor, con cada letra en el mismo lugar" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.060/mismo-lugar.png" width="100%">

## 🏷 El archivo se llama como el kit

**Guardar en la carpeta del kit** crea la textura con el nombre del propio kit, por ejemplo `u2689p1_name.dds` y `.ftex`, y apunta `NameFontFile` del config.txt a ella. Ya no pisa una textura compartida como `font white`.

- Activa **NameLower = 1** para ese kit en kitpos_slots.ini, así el juego usa las minúsculas.
- Si el kit tenía un `kitpos_letras.txt` viejo, lo guarda como `.bak-edit21` y lo saca, porque desordenaría las letras.
- Si tu Sider no tiene `minusculas.txt`, el editor la copia.

<img alt="La sección Fuentes en modo PES 6 con el nombre Fernández sobre una camiseta verde" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.060/fuentes-es.png" width="100%">

## 📦 Un .zip por uniforme

**Descargar .zip** arma las carpetas igual que en Sider: la del kit elegido (o la de cada kit con **Todos**) con su textura, más `minusculas.txt`, la línea de NameLower para kitpos_slots.ini y un LEEME. **Lo descomprimís directo en la carpeta de Sider** y cada archivo cae en su lugar.

<img alt="La textura de letras: 371 letras en una textura de 4096×4096" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.060/textura-es.png" width="80%">

## ⬇️ ¿Tengo que descargar algo?

**No.** Todo esto está en el editor, y la app de Windows lo carga sola desde internet: la próxima vez que la abras (o cuando aparezca "Hay una versión nueva del editor") ya lo tenés. Hace falta KitPos 6.4 o más nuevo en Sider, y el cuadro de Requisitos de Fuentes te avisa si falta algo.

> Es una versión alfa. Si un nombre sale mal en el juego, avisanos en 💡 Ideas → Algo no anda. ⚽
