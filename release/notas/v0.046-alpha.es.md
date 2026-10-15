<div align="center">

<img alt="Los módulos Lua en el modo Moderno: cada uno dice qué hace. FreeHeartEngine.lu ofrece corregirse a FreeHeartEngine.lua, penaltyCam es la cámara de penales y Crowd-Server elige cuánta hinchada hay" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.046/sider-modulos.png" width="100%">

# 🧩 La pestaña Sider entiende tu juego

**[▶ Abrir PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · **[⬇️ App para Windows (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.046-alpha/PES-Editor-Rebuilt-Setup.exe)** · [📦 Versión portátil](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.046-alpha/PES-Editor-Rebuilt-Portable.exe)

</div>

La pestaña Sider llegó en la v0.045 mostrando qué carga tu juego. Con un juego lleno de mods, con decenas de carpetas y módulos, aparecieron las preguntas: **¿qué hace esta carpeta?**, **¿por qué dice que falta este módulo si está ahí?**, **¿por qué no pasa nada cuando toco agregar?** 🤔

Esta versión responde todo eso.

## 📖 Qué hace cada cosa, en una línea

Cada carpeta de contenido, cada módulo y cada carpeta de content ahora tiene **una línea que dice qué cambia en el juego**. Hay más de **40 categorías** y más de **60 módulos conocidos**:

- 🕺 **Animaciones y poses**: las poses del modo Editar y la previa del partido (carpeta `anime`).
- 🚩 **Banners de hinchadas**: banderas en las tribunas por equipo y competición (carpeta `common_ad`).
- 🎬 **Escenas y cinemáticas**: faltas, goles, entradas, jugador del partido (FoulScenes, CutScenes…).
- 👥 **Público**: cuánta hinchada hay del local y del visitante, coreografías, alcanzapelotas.
- 🎽 **Logos de manga**, 📋 **Liga Master**, 🎮 **jugabilidad**, 🎥 **cámaras** y mucho más.

Las **cámaras se describen por el nombre**: `penaltyCam` es la cámara de penales y `ReplayCamera` la de las repeticiones. Y si un módulo no está en la lista, el editor **lee el propio archivo** y usa lo que dice al principio.

<img alt="Las carpetas de content en el modo Clásico, cada una con el módulo que la usa y qué hace: foul-scenes con FoulScenes.lua, master league selector con masterleague.lua, referee_kit-server con RefKitServer.lua" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.046/sider-content.png" width="100%">

## 🔍 Mira adentro de cada carpeta

Además de las rutas de PES 2021, el editor busca **nombres de carpeta que delatan el contenido**, hasta 7 niveles adentro: `anime`, `common_ad`, `demo`, `scoreboard`, `turf`… Así un mod que se llama "edit mod" queda bien clasificado aunque el nombre no diga nada.

**Funciona igual con PES 2021 base, con mods o con Football Life.** Nada está atado a una instalación en particular.

<img alt="Las carpetas de contenido en el modo Retro: edit mod como Animaciones y poses, Banner como Banners de hinchadas y una carpeta marcada como Repetida (fila 2)" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.046/sider-carpetas.png" width="100%">

## ⚡ Agregar, quitar y mover se ve al instante

Tocabas "＋" en una carpeta de livecpk o en un módulo y… nada. El cambio estaba, pero **la lista no se actualizaba** hasta volver a leer el archivo. Ahora lo nuevo aparece al final de su lista, **resaltado**, con un aviso, y el botón desaparece. Lo mismo al quitar, mover, deshacer o aplicar el texto.

<img alt="En PES 6 Editar, la carpeta Botines-2026 recién agregada aparece resaltada al final de la lista y su botón ya no está entre las carpetas que faltan en sider.ini" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.046/sider-agregada.png" width="100%">

## 🩹 Los módulos "faltantes" que sí estaban

- Los módulos en **subcarpetas** de modules (como `modules\GRAND\Crowd-Server.lua`) ya no salen como faltantes.
- Si un `lua.module` está **mal escrito** (le falta una letra, un guion en vez de un guion bajo…), la fila pregunta **"¿Es FreeHeartEngine.lua? Corregir"** y el botón arregla la línea.
- Las carpetas de content se **unen al módulo que las nombra en su código**, y si ninguno las usa, lo dice.
- Una comilla de más o de menos en una ruta ya no hace que una carpeta parezca que no existe.
- Las **carpetas repetidas** dicen qué ruta se repite y en qué filas. Sider usa la primera.

<img alt="En PES 6 Editar, la fila de FreeHeartEngine.lu con el botón ¿Es FreeHeartEngine.lua? Corregir" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.046/sider-corregir.png" width="100%">

> 🙌 Muchas de las descripciones salieron de las correcciones de un usuario con su propio juego. Si ves un módulo o una carpeta mal descrita, [avisanos](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/issues/new/choose) y la sumamos.

## 🔜 Lo que viene

**Instalar mods arrastrándolos**: soltar un mod en la pestaña Sider y que se copie solo a livecpk, modules o content, con su readme a la vista y cada paso para deshacer.
