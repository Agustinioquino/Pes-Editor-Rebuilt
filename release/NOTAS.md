<p align="center"><sub>🇬🇧 English · <b>🇪🇸 Versión en español más abajo ⬇️</b></sub></p>

<div align="center">

# 🔤 Your font on the shirt, placed by hand

**[▶ Open PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · **[⬇️ Windows app (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.057-alpha/PES-Editor-Rebuilt-Setup.exe)** · [📦 Portable version](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.057-alpha/PES-Editor-Rebuilt-Portable.exe)

</div>

Shirt names don't have to be ALL CAPS anymore. With the new **Fonts** tab you build the name font from any typeface (or from letters you draw in Photoshop), with **lowercase, accents, Ñ, Cyrillic and Greek**, and it goes straight into the kit folder. And in **Kit Studio Pro** you can now **grab the name and the numbers on the 3D kit and drag them** where you want them. 👕

<img alt="Dragging the name on the back of the 3D shirt: it moves up and down and its arch changes, with the value shown next to the mouse" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.057/arrastrar-en.gif" width="60%">

## ✥ Move the name and numbers with the mouse

In **Kit Studio Pro → Editor**, the new **✥ Place** view shows the back, the front and the shorts in 3D:

- **Grab** the name, the back number, the chest number or the shorts number and **move it**.
- **Corners** change the size, **sides** the width (on the back number, the spacing) and the **handle above the name** its arch.
- The **mouse wheel** and the **keyboard** work too: arrows to move, + and − for size, [ and ] for the arch.
- Without KitPos it moves in the game's own steps (the ones in config.txt). **With KitPos the value is exact**, no steps.

<img alt="The Place view: the back, the front and the shorts in 3D, with the name, back number, chest number and shorts number boxed in colors" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.057/ubicar-en.png" width="100%">

## 🔤 The Fonts tab

A font creator for the shirt name, in its own tab:

- **Pick a typeface** or upload a **.ttf, .otf or .woff**, and give it a style: colors, gradient, two outlines and shadow.
- **Choose the languages**: accents, Central Europe and Turkey, Cyrillic, Greek.
- See it **live on the shirt** and on the **back of the kit**, where you can also drag the name and number.
- **One button saves it in the kit folder**: the letter texture as **.dds and .ftex** (DXT5 with all its sizes) and **kitpos_letras.txt**, the table KitPos reads. Another downloads it as a .zip, and another undoes it (a .bak-edit21 copy is kept).

It needs **KitPos 6.4 or newer** in Sider. If you don't have it, the editor installs it for you and adds it to sider.ini (with a backup).

<img alt="The Fonts tab: the font, the Photoshop template with its letters loaded, the name on a green shirt and the back of the kit with the name and number boxed" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.057/fuentes-en.png" width="100%">

## 🎨 Letters drawn in Photoshop

Draw the letters yourself in the **KitPos Photoshop template** (one 256 px cell per letter, sitting on the red line) and load it as a **transparent PNG or straight as .psd**:

- Every letter you drew goes into the game texture **as it is, with its colors**.
- Empty cells (space, underscore, Cyrillic…) come from the chosen typeface.
- **⬇ Letters of this font** gives you a typeface already laid out in the template, to touch it up in Photoshop. **⬇ Guides** gives you the cells alone.

<img alt="The Photoshop template section with the template loaded: 214 of 214 letters drawn" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.057/plantilla-en.png" width="50%">

## 📐 Free position with KitPos

The **📐 Free position** panel sets, without steps, the height, size, width, spacing and arch of the name and the back, chest and shorts numbers, **for one kit or for the whole team**. It's saved in content\kitpos\kitpos_slots.ini, the same file the KitPos panel reads in the game.

<img alt="The Fonts tab in PES 6 mode" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.057/fuentes-pes6-en.png" width="100%">

## 🔠 Upper and lower case in PES 6

- In the **PES 6** graphics mode, every text field now uses a font with **real lowercase**, so you see exactly how a name looks.
- If **Caps Lock** is on, a warning shows up under the field.
- If a player's name ended up all in capitals, his profile offers **Aa Change to** upper and lower case in one click.

## ⬇️ Do I need to download anything?

**No.** All of this is in the editor, and the Windows app loads it from the internet on its own: the next time you open it (or when "A new version of the editor is available" shows up) you've got it.

> This is an alpha version and the fonts haven't been tested much in the game yet. If a letter shows up shifted or cut off, or the name doesn't move where you put it, tell us in 💡 Ideas → Something's not working. ⚽

<br>

---

<!-- es -->
<div align="center">

### 🇪🇸 Versión en español

</div>

<div align="center">

# 🔤 Tu fuente en la camiseta, ubicada a mano

**[▶ Abrir PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · **[⬇️ App para Windows (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.057-alpha/PES-Editor-Rebuilt-Setup.exe)** · [📦 Versión portátil](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.057-alpha/PES-Editor-Rebuilt-Portable.exe)

</div>

Los nombres de las camisetas ya no tienen que ir TODO EN MAYÚSCULAS. Con la nueva pestaña **Fuentes** armás la fuente del nombre con cualquier tipografía (o con letras que dibujás en Photoshop), con **minúsculas, tildes, Ñ, cirílico y griego**, y va directo a la carpeta del kit. Y en **Kit Studio Pro** ahora podés **agarrar el nombre y los números sobre el kit en 3D y arrastrarlos** adonde quieras. 👕

<img alt="Arrastrar el nombre en la espalda de la camiseta en 3D: sube y baja y cambia su arco, con el valor al lado del mouse" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.057/arrastrar-es.gif" width="60%">

## ✥ Mové el nombre y los números con el mouse

En **Kit Studio Pro → Editor**, la nueva vista **✥ Ubicar** muestra la espalda, el frente y el short en 3D:

- **Agarrá** el nombre, el dorsal, el número del pecho o el del short y **movelo**.
- **Las esquinas** cambian el tamaño, **los costados** el ancho (en el dorsal, la separación) y **la manija de arriba del nombre** su arco.
- También andan **la rueda del mouse** y **el teclado**: flechas para mover, + y − para el tamaño, [ y ] para el arco.
- Sin KitPos se mueve con los pasos del juego (los del config.txt). **Con KitPos queda el valor exacto**, sin pasos.

<img alt="La vista Ubicar: la espalda, el frente y el short en 3D, con el nombre, el dorsal, el número del pecho y el del short marcados en colores" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.057/ubicar-es.png" width="100%">

## 🔤 La pestaña Fuentes

Un creador de fuentes para el nombre de la camiseta, en su propia pestaña:

- **Elegí una tipografía** o subí un **.ttf, .otf o .woff**, y dale estilo: colores, degradado, dos bordes y sombra.
- **Elegí los idiomas**: acentos, Europa central y Turquía, cirílico, griego.
- Mirala **en vivo sobre la camiseta** y en **la espalda del kit**, donde también podés arrastrar el nombre y el dorsal.
- **Un botón la guarda en la carpeta del kit**: la textura de letras en **.dds y .ftex** (DXT5 con todos sus tamaños) y **kitpos_letras.txt**, la tabla que lee KitPos. Otro la baja en .zip y otro la deshace (queda una copia .bak-edit21).

Hace falta **KitPos 6.4 o más nuevo** en Sider. Si no lo tenés, el editor lo instala y lo agrega a sider.ini (con copia).

<img alt="La pestaña Fuentes: la fuente, la plantilla de Photoshop con sus letras cargadas, el nombre sobre una camiseta verde y la espalda del kit con el nombre y el dorsal marcados" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.057/fuentes-es.png" width="100%">

## 🎨 Letras dibujadas en Photoshop

Dibujá las letras vos en la **plantilla de Photoshop de KitPos** (una casilla de 256 px por letra, apoyada en la línea roja) y cargala como **PNG transparente o directo el .psd**:

- Cada letra que dibujaste pasa a la textura del juego **tal cual, con sus colores**.
- Las casillas vacías (espacio, guion bajo, cirílico…) salen de la tipografía elegida.
- **⬇ Letras de esta fuente** te da una tipografía ya acomodada en la plantilla, para retocarla en Photoshop. **⬇ Guías** te da las casillas solas.

<img alt="La sección Plantilla de Photoshop con la plantilla cargada: 214 de 214 letras dibujadas" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.057/plantilla-es.png" width="50%">

## 📐 Posición libre con KitPos

El panel **📐 Posición libre** ajusta sin pasos la altura, el tamaño, el ancho, la separación y el arco del nombre y de los números de la espalda, el pecho y el short, **para un kit o para todo el equipo**. Se guarda en content\kitpos\kitpos_slots.ini, el mismo archivo que lee el panel de KitPos en el juego.

<img alt="La pestaña Fuentes en modo PES 6" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.057/fuentes-pes6-es.png" width="100%">

## 🔠 Mayúsculas y minúsculas en PES 6

- En el modo gráfico **PES 6**, todos los campos donde se escribe usan ahora una letra con **minúsculas de verdad**, así ves exactamente cómo queda un nombre.
- Si **Bloq Mayús** está activado, aparece un aviso debajo del campo.
- Si el nombre de un jugador quedó todo en mayúsculas, su perfil ofrece **Aa Pasar a** mayúsculas y minúsculas con un clic.

## ⬇️ ¿Tengo que descargar algo?

**No.** Todo esto está en el editor, y la app de Windows lo carga sola desde internet: la próxima vez que la abras (o cuando aparezca "Hay una versión nueva del editor") ya lo tenés.

> Es una versión alfa y las fuentes todavía se probaron poco en el juego. Si una letra sale corrida o cortada, o el nombre no queda donde lo pusiste, avisanos en 💡 Ideas → Algo no anda. ⚽
