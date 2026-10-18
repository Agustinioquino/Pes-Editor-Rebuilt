<p align="center"><sub>🇬🇧 English · <b>🇪🇸 Versión en español más abajo ⬇️</b></sub></p>

<div align="center">

# 🩺 Shirt fonts that show right in the game

**[▶ Open PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · **[⬇️ Windows app (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.061-alpha/PES-Editor-Rebuilt-Setup.exe)** · [📦 Portable version](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.061-alpha/PES-Editor-Rebuilt-Portable.exe)

</div>

You save a beautiful font, open the game, turn the player around and… **the whole letter sheet is on his back, tiny and crammed together.** 😵 We chased that one down. Now the editor tells you **why a name shows wrong, fixes it in one click** and explains how the font really gets into the game.

<img alt="Left: the crammed letter sheet the game draws when it ignores the table. Right: the same font with KitPos reading the table, the name Fernández" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.061/antes-despues.png" width="100%">

## 🔎 Why the name came out crammed

The game builds the name by copying each letter from fixed boxes in a 4:1 texture (two rows of capitals). KitPos changes that lookup **only for the kits that ask for it**. If a kit has a big KitPos texture but doesn't ask for the table, the game uses its own boxes on it and each letter grabs a whole column of tiny letters. On top of that, a texture with **one letter per 256 px box** (the Photoshop template, injected as is) puts capitals and lowercase in the wrong place even when KitPos is working.

## 🩺 Check this kit in the game

**Teams → pick the club → Kit Studio Pro → 🔤 Fonts → 🩺 Check this kit in the game** reads `sider.log` and the kit folder and tells you, in plain words, what's going on:

- KitPos didn't load, couldn't hook into the executable, or is too old.
- The kit doesn't ask KitPos for its font (no `kitpos_letras.txt`, no `NameLower`).
- The letters are in **template boxes**: 🔁 **Rearrange the letters** loads the texture as a template and, when you save, every letter lands where KitPos looks for it.
- The `.dds` and the `.ftex` don't match (kserv reads the `.ftex` first).
- You haven't opened the game since saving.

Every problem comes with **its own button** to fix it.

<img alt="Check this kit in the game: letters in template boxes, and the kit does not ask KitPos for the font" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.061/diagnostico-en.png" width="60%">

## 📄 Every kit carries its table

Saving now leaves a `kitpos_letras.txt` next to the texture, with **the same table** as `minusculas.txt`, besides `NameLower = 1`. So the kit shows lowercase even when the browser can't save `kitpos_slots.ini`, or when you copy the folder by hand to another Sider.

## 🔠 Capitals only, anywhere

New format next to **With lowercase**: **Capitals only** saves a 4096×1024 texture in the game's own format. No KitPos needed, so it works with any Sider and with other executables (Football Life included).

## 📘 A guide for manual injection

Inside Fonts there's a guide that explains **how the font reaches the game**, the **manual injection step by step**, a table of **why it sometimes works and sometimes doesn't** (with what to do in each case), and **compatibility** with other games and mods.

<img alt="The guide inside Fonts: how it works, manual injection, why it sometimes fails and compatibility" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.061/guia-en.png" width="60%">

## 🛡 Crests on every screen

Your own crest is now saved in **all 12 versions**, including the `e_<id>_r_b.png` that was missing, and the HD one is capped at **1028×1044**. Some crests looked wrong on certain game screens; not anymore.

## ⬇️ Do I need to download anything?

**No.** It's all in the editor, and the Windows app loads it on its own the next time you open it (or when "A new version of the editor is available" shows up).

> This is an alpha version. If a name still shows wrong, press 🩺 Check this kit and tell us what it says in 💡 Ideas → Something's not working. ⚽

<br>

---

<!-- es -->
<div align="center">

### 🇪🇸 Versión en español

</div>

<div align="center">

# 🩺 Fuentes que se ven bien en el juego

**[▶ Abrir PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · **[⬇️ App para Windows (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.061-alpha/PES-Editor-Rebuilt-Setup.exe)** · [📦 Versión portátil](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.061-alpha/PES-Editor-Rebuilt-Portable.exe)

</div>

Guardás una fuente hermosa, abrís el juego, das vuelta al jugador y… **en la espalda aparece toda la hoja de letras, chiquita y amontonada.** 😵 Fuimos a buscar ese problema. Ahora el editor te dice **por qué un nombre sale mal, lo arregla con un clic** y explica cómo llega de verdad la fuente al juego.

<img alt="Izquierda: la hoja de letras amontonada que dibuja el juego cuando no usa la tabla. Derecha: la misma fuente con KitPos leyendo la tabla, el nombre Fernández" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.061/antes-despues.png" width="100%">

## 🔎 Por qué el nombre salía amontonado

El juego arma el nombre copiando cada letra de casillas fijas en una textura 4:1 (dos filas de mayúsculas). KitPos cambia esa búsqueda **solo en los kits que se lo piden**. Si un kit tiene una textura grande de KitPos pero no pide la tabla, el juego usa sus casillas sobre ella y cada letra agarra una columna entera de letras chiquitas. Además, una textura con **una letra por casilla de 256 px** (la plantilla de Photoshop inyectada tal cual) pone mayúsculas y minúsculas en el lugar equivocado aunque KitPos funcione.

## 🩺 Revisar este kit en el juego

**Equipos → elegí el club → Kit Studio Pro → 🔤 Fuentes → 🩺 Revisar este kit en el juego** lee `sider.log` y la carpeta del kit y te dice, en palabras simples, qué pasa:

- KitPos no cargó, no pudo engancharse al ejecutable o es viejo.
- El kit no le pide la fuente a KitPos (no tiene `kitpos_letras.txt` ni `NameLower`).
- Las letras están en **casillas de plantilla**: 🔁 **Reacomodar las letras** carga la textura como plantilla y, al guardar, cada letra queda donde la busca KitPos.
- El `.dds` y el `.ftex` no coinciden (kserv lee primero el `.ftex`).
- No abriste el juego desde que guardaste.

Cada problema trae **su botón** para arreglarlo.

<img alt="Revisar este kit en el juego: letras en casillas de plantilla y el kit no le pide la fuente a KitPos" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.061/diagnostico-es.png" width="60%">

## 📄 Cada kit lleva su tabla

Guardar ahora deja un `kitpos_letras.txt` junto a la textura, con **la misma tabla** que `minusculas.txt`, además de `NameLower = 1`. Así el kit muestra las minúsculas aunque el navegador no deje guardar `kitpos_slots.ini`, o aunque copies la carpeta a mano a otro Sider.

## 🔠 Solo mayúsculas, en cualquier lado

Formato nuevo al lado de **Con minúsculas**: **Solo mayúsculas** guarda una textura de 4096×1024 con el formato del propio juego. No necesita KitPos, así que anda con cualquier Sider y con otros ejecutables (Football Life incluido).

## 📘 Una guía para inyectar a mano

Dentro de Fuentes hay una guía que explica **cómo llega la fuente al juego**, la **inyección manual paso a paso**, una tabla de **por qué a veces funciona y a veces no** (con qué hacer en cada caso) y la **compatibilidad** con otros juegos y mods.

<img alt="La guía dentro de Fuentes: cómo funciona, inyección manual, por qué a veces falla y compatibilidad" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.061/guia-es.png" width="60%">

## 🛡 Escudos en todas las pantallas

El escudo propio ahora se guarda en **sus 12 versiones**, también la `e_<id>_r_b.png` que faltaba, y la HD queda en **1028×1044** como máximo. Algunos escudos se veían mal en ciertas pantallas del juego; ya no.

## ⬇️ ¿Tengo que descargar algo?

**No.** Todo está en el editor, y la app de Windows lo carga sola la próxima vez que la abras (o cuando aparezca "Hay una versión nueva del editor").

> Es una versión alfa. Si un nombre sigue saliendo mal, tocá 🩺 Revisar este kit y contanos qué dice en 💡 Ideas → Algo no anda. ⚽
