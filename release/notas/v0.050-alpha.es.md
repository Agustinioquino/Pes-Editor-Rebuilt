<div align="center">

<img alt="El editor con estilo PES 6 Editar mostrando los equipos de Football Life 2026, leídos directo de los archivos del juego" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.050/football-life.png" width="100%">

# 🥁🎺 ¡Football Life 2026 es compatible! 🎉⚽

**[▶ Abrir PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · **[⬇️ App para Windows (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.050-alpha/PES-Editor-Rebuilt-Setup.exe)** · [📦 Versión portátil](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.050-alpha/PES-Editor-Rebuilt-Portable.exe)

</div>

## 📣 Atención, atención: llegó el día

¿Jugás **Football Life 2026**? Entonces esta versión es tuya. **PES Editor Rebuilt ahora es compatible con Football Life 2026**: lee su base de datos completa, encuentra su EDIT, entiende su Sider y muestra las medias como las muestra el juego. Sin trucos, sin pasos raros, sin abrir el juego antes.

Lo probamos con una instalación real de Football Life 2026 (versión 2.2.0) y el resultado habla solo:

> ### ⚽ 29.413 jugadores · 749 equipos · en medio segundo
> Leídos directo de los archivos del juego, **clásicos incluidos**: Čech, Beckenbauer y toda la banda de leyendas que trae Football Life.

| | Antes | Ahora |
|---|---|---|
| Base de jugadores y equipos | Había que abrir el juego con el módulo `edit21_db` | **Se lee sola de los archivos del juego** |
| Medias | Hasta 109, como en PES 2021 | **Tope de 104, como en Football Life** |
| El EDIT (`2026\save`) | Buscarlo a mano | **Lo encuentra solo** (y hay botón 📂 Buscar EDIT) |
| La pestaña Sider | Un Sider más | **Chip ⚽ Football Life 2026** |

### 🚀 Empezá en tres pasos

1. Tocá **Conectar carpeta Sider**.
2. Elegí la **carpeta del juego** (la que tiene `FL_2026.exe`) o una de más arriba.
3. Listo: los nombres, los equipos y las medias salen de Football Life. Tu EDIT está en `Documentos\KONAMI\eFootball PES 2021 SEASON UPDATE\2026\save` y el editor lo busca solo.

Y todo sigue funcionando igual con **PES 2021**, con mods o sin ellos: el editor se fija qué juego tenés y se adapta.

## 📚 La base del juego, sin abrir el juego

Conectá la carpeta del juego (por ejemplo `B:\footballlife`, o la de más arriba) y el editor **lee la base directo de sus archivos**: los `data_s2526*.cpk` de `download`, en el mismo orden en que los carga el juego (sale de `spFileList.bin`), así siempre gana la actualización más nueva. Encima van las carpetas de Sider, como en el juego.

- **29.413 jugadores y 749 equipos** en medio segundo, con los clásicos incluidos (Čech, Beckenbauer y compañía).
- No hace falta abrir el juego con el módulo `edit21_db` primero. Si el módulo ya dejó su copia, se usa la más nueva de las dos.
- El módulo `edit21_db.lua` funciona igual en Football Life: Sider le pasa la base como en PES 2021.
- La pestaña Sider muestra el chip **⚽ Football Life 2026** cuando el Sider es el de `SiderAddons`.

## 🎯 Valoraciones como las muestra cada juego

En PES 2021 una media puede llegar a **109**; en Football Life el tope es **104**. El editor se fija qué juego es (por la carpeta del EDIT, que en Football Life es `…\2026\save`, o por el `.exe` del juego conectado con Sider) y muestra las medias con el tope que corresponde, también en la media rápida y el hexágono.

## 📂 Buscar EDIT

Al lado de **Recargar** hay un botón nuevo, **📂 Buscar EDIT**. Muestra todos los EDIT que encontró (con su fecha y tamaño) para pasar de uno a otro, vuelve a buscar en Documentos, deja elegir la carpeta del EDIT o abrir el archivo a mano. Ideal si tenés PES 2021 y Football Life en la misma PC.

<img alt="La ventana Buscar el EDIT con dos EDIT encontrados, uno abierto, y los botones para buscar de nuevo, elegir la carpeta o abrir el archivo a mano" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.050/buscar-edit.png" width="100%">

## 🎵 Y además

- La **ventanita de Spotify y YouTube** se mueve arrastrando **⠿ mover** y se agranda desde la esquina; queda donde la dejes (doble clic en "mover" la devuelve a su lugar).
- El cartel **En desarrollo** se puede **minimizar** a una pestañita.

<img alt="La ventanita de Spotify movida al centro y agrandada, y el cartel En desarrollo minimizado abajo a la derecha" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.050/ventana-musica.png" width="100%">

## 🔜 Lo que viene

**Instalar mods arrastrándolos** en la pestaña Sider, y seguir afinando todo lo de Football Life con lo que nos cuentes. Si algo no carga, [avisá](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/issues/new/choose).
