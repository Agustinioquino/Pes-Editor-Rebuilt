<div align="center">

# 🙂 Minifaces al juego y escudos mejorados

**[▶ Abrir PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · **[⬇️ App para Windows (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.052-alpha/PES-Editor-Rebuilt-Setup.exe)** · [📦 Versión portátil](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.052-alpha/PES-Editor-Rebuilt-Portable.exe)

</div>

## 🙂 Tu jugador, con su cara

¿Ese pibe de la reserva que en el juego tiene una cara genérica? ¿El fichaje nuevo que todavía no tiene miniface? Ahora lo arreglás vos, desde el editor y sin programas aparte.

En la ficha de cada jugador hay una pestaña nueva, **🙂 Miniface**:

1. **Subís una foto** PNG o JPG (o la soltás encima).
2. **✨ Quitar con IA** le saca el fondo en un clic. La primera vez baja el modelo de internet (unos 7 MB) y después es al toque. Si preferís, también está **Por color** o la **🪄 varita**: tocás el fondo y se borra, con Deshacer.
3. **Encuadrás** con el zoom y la guía de la cabeza, o tocás **🎯 Encuadrar solo**.
4. **💾 Guardar en el juego**: el editor arma el `.dds` con transparencia y el ID del jugador, en el formato de las minifaces del juego (DXT3, 2048×2048 recomendado).

Se guarda en `livecpk\PESEditor-Minifaces`, una carpeta propia que el editor pone **primera en sider.ini** (con copia de seguridad), así tu miniface manda y las que ya tenías en otras carpetas no se tocan. Si el navegador no deja tocar sider.ini, la guarda en una carpeta que Sider ya lee. ¿Te arrepentiste? **🗑 Borrarla** devuelve la que había.

<img alt="La pestaña Miniface con una foto ya recortada, la guía de la cabeza, el zoom, quitar el fondo con IA, el tamaño y Guardar en el juego" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.052/miniface.png" width="100%">

## 🛡️ Escudos: más grandes, con vista previa y para cada fondo

El creador de escudos (en **Datos y colores**) se puso las pilas:

- **👀 Vista previa de los 11 archivos.** Apenas cargás la imagen ves cómo queda cada uno, con su medida. Los `r_b` se muestran sobre negro y los `r_w` sobre blanco, como en el juego.
- **🌗 Versiones para fondos oscuros y claros.** Si tu escudo tiene mucho negro, el editor te pregunta si querés que el `r_b` aclare los negros y lleve un fileteado claro, para que no se pierda en los zócalos oscuros. Si tiene mucho blanco, lo mismo con el `r_w`: baja los blancos y le pone un borde oscuro suave. Vos decidís, y tus propios archivos nunca se retocan.
- **🔍 Calidad HD normal o 2K (experimental).** HD normal copia la medida de los escudos que ya tenés. 2K los arma en 512×520, 1028×1044 (`_l`) y 2056×2088 (`_ll`). ⚠️ **Es experimental:** en las pruebas el juego bajó 3 o 4 FPS y tuvo lag en algunos menús. Si te pasa, volvés a HD normal y guardás de nuevo.
- **🔤 Qué significa cada letra.** En "Dónde y cómo se guarda" está explicado: `f` plano, `r` render, `r_b` para fondos oscuros, `r_w` para fondos claros; sin letra es el tamaño normal, `_l` el grande y `_ll` el más grande.
- **📂 Va a la carpeta correcta.** El escudo se guarda donde Sider ya lee tus escudos, y la carpeta `PESEditor-Escudos` ya no queda vacía cuando el navegador no deja tocar sider.ini.

<img alt="El creador de escudos con Calidad, los retoques de r_b y r_w y la vista previa de los 11 archivos" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.052/escudo.png" width="100%">

## 🔧 Y además

- **🧹 Las copias `.bak-edit21` se borran solas.** Las copias de escudos, minifaces y kits te sirven para deshacer mientras el editor está abierto. La próxima vez que lo abrís, con la carpeta Sider conectada, se limpian. `sider.ini.bak-pes-editor` no se toca.
- **📸 Fotos de jugadores más rápidas y que encuentran más.** La búsqueda usa el nombre completo (ESPN) y Wikipedia en el idioma del jugador. Y si no aparece, en Formación (vista Fotos) pegás el link de **SoFIFA, Sortitoutsi, PES Master, SoccerWiki** o de cualquier foto.
- **📊 En desarrollo, con barras.** El cartel muestra cuánto falta de cada cosa con una barra de color y su porcentaje, marca lo que tiene prioridad alta (Football Life, la app de Windows, importar y exportar en CSV y mejoras visuales) y se puede ocultar.
- **✨ Texto metálico en el modo PES 6**, más marcado y igual de legible.

<img alt="El cartel En desarrollo con barras de avance de colores, porcentajes y prioridad alta, en el modo PES 6" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.052/en-desarrollo.png" width="100%">

## ⬇️ ¿Tengo que bajar algo?

**No.** Todo esto está en el editor, y la app para Windows lo carga sola de internet: la próxima vez que la abras (o cuando aparezca "Hay una versión nueva del editor") ya lo tenés.

> Es una versión alpha: la miniface se probó con carpetas de prueba. Si algo no se ve bien en el juego, contanos.
