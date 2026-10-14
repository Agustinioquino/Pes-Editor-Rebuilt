<div align="center">

<img alt="La pestaña Uniformes del Kit Studio Pro: la zona punteada para arrastrar un kit en .zip y las tarjetas de cada kit del equipo con sus texturas" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.047/uniformes.png" width="100%">

# 👕 Kit Studio Pro: cargá kits desde un .zip

**[▶ Abrir PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · **[⬇️ App para Windows (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.047-alpha/PES-Editor-Rebuilt-Setup.exe)** · [📦 Versión portátil](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.047-alpha/PES-Editor-Rebuilt-Portable.exe)

</div>

> ⚠️ **Versión preliminar.** Todo lo de esta versión es nuevo y se probó poco con juegos reales: es muy probable que tenga fallos. Antes de cargar o reemplazar kits, hacé una copia de tu carpeta `content\kit-server`. Si algo sale mal, [contanos](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/issues/new/choose) qué pasó y con qué kit.

El Estudio de kits pasa a llamarse **Kit Studio Pro** y crece en dos partes. Y lo más pedido: **bajaste un kit y querés verlo en el juego sin tocar un solo archivo a mano**. Ahora se arrastra y listo.

## 📦 Arrastrá el .zip y elegí el puesto

Soltá el .zip del kit (o sus texturas sueltas: `.ftex`, `.dds`, `.png`) en la pestaña **Uniformes**. Un cuadro muestra **qué trae**: kit, normal map, brillo, números de espalda, pecho y short, letras del nombre. Elegís en qué puesto va: **titular (p1), suplente (p2), tercera, cuarta o arquero**.

- Si el puesto **ya tiene un kit**, decidís: **reemplazarlo** (lo de antes se guarda en `_borrados`) o **agregarlo como kit nuevo**.
- Lo que **falte** (normal map, brillo, letras del nombre) se **genera genérico** con la tela y la fuente del estudio.
- Todo se convierte al formato del juego (**FTEX**) y se escriben solos el `config.txt` (con los colores leídos de la textura si no trae uno) y el `order.ini` / `gk_order.ini`.

<img alt="El cuadro Cargar kit: la vista previa de la textura, qué viene y qué se genera, y el puesto elegido (p2, suplente)" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.047/cargar-kit.png" width="100%">

<img alt="El mismo cuadro con p2 en uso: elegir entre agregarlo como kit nuevo (p3) o reemplazar el p2 que está ahora" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.047/reemplazar.png" width="100%">

## 🔒 Los kits que viven en los .cpk

Si el equipo **no tiene carpeta en el kit-server**, sus kits están cifrados dentro de los archivos `.cpk` del juego y no se pueden abrir desde el editor. El Kit Studio Pro ahora lo dice claro, y **deja cargarle un kit por Sider igual**: se crea la carpeta del equipo y su línea en `map.txt`.

<img alt="La tarjeta de un equipo sin carpeta en el kit-server: el aviso de los .cpk y la zona para arrastrar un kit" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.047/equipo-cpk.png" width="100%">

## 🗂 Uniformes y Editor

- **Uniformes**: todos los kits del equipo con sus texturas en miniatura, en el orden del juego. Desde ahí se **edita**, se **sube en el orden**, se **duplica** (⧉), se **copia un kit de jugador como arquero** (🧤) y se **borra** (🗑, la carpeta queda en `_borrados`).
- **Editor**: un kit a pantalla ancha, con **Ampliar**, **pantalla completa** y **Vista del juego**, que imita el encuadre del juego.

<img alt="El Editor del Kit Studio Pro con la tira de kits, el visor 3D y los paneles de cámara y prendas" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.047/editor.png" width="100%">

## ✥ Mové el nombre y los números sobre el modelo

En el visor 3D, el **nombre**, el **número de la espalda**, el **del pecho** y el **del short** se arrastran directo sobre la camiseta; la **rueda** encima les cambia el tamaño. Los valores van al `config.txt` (`NameY`, `BackNumberY`, `ChestNumberX/Y`, `ShortsNumberX/Y` y los tamaños) respetando el rango de cada kit. Las posiciones salen de una cuenta aproximada: **todavía no están calibradas contra el juego**, así que puede haber diferencias.

<img alt="El número de la espalda resaltado mientras se arrastra sobre el modelo 3D" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.047/numero-movido.png" width="100%">

## 🧵 Y además

- Las texturas se cargan a su **resolución completa** (hasta 4096), ya no achicadas a 1024.
- El generador de fuentes tiene **"Número del short con otro color"**.
- La textura subida a un kit **ya no desaparece** al cambiar de kit y volver.

<img alt="La Vista del juego: el modelo con el encuadre y el fondo que imitan la pantalla de uniformes" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.047/vista-del-juego.png" width="100%">

## 🔜 Lo que viene

**Crear un kit desde cero** dentro del Kit Studio Pro, calibrar las posiciones del nombre y los números contra el juego, e **instalar mods arrastrándolos** en la pestaña Sider.
