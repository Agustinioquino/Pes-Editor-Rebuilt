<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logo-oscuro.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/logo-claro.svg">
  <img alt="PES Editor" src="assets/logo-claro.svg" width="560">
</picture>

### Un PES Editor renovado

*Hecho por un fanático del PES para los que todavía arman su Liga Master a mano.* ⚽

Editor del archivo **EDIT00000000** de **eFootball PES 2021** (con Dream Patch y Sider), directo en el navegador.

![Versión](https://img.shields.io/badge/versi%C3%B3n-v0.012%20alpha-16d98a)
![Juego](https://img.shields.io/badge/eFootball-PES%202021-1d6e47)
![Navegador](https://img.shields.io/badge/Chrome%20%2F%20Edge-requerido-555)

**[▶ Abrir PES Editor](https://agustinioquino.github.io/pes-editor/)**

</div>

![Pantalla de inicio](docs/capturas/01-intro.png)

## 🧉 ¿Por qué existe?

Porque editar el PES siempre fue parte del juego: corregir planteles, cambiar el dorsal de tu ídolo, armar la camiseta del club del barrio. Las herramientas de siempre hacen el trabajo, pero se quedaron en el tiempo. **PES Editor** junta todo en un solo lugar, con una interfaz moderna, un estudio de kits en 3D y, para los nostálgicos, música de menú de fondo mientras editás.

> [!WARNING]
> **Versión alpha.** Funciona y guarda en el juego, pero todavía puede tener errores. El editor hace una copia de respaldo del EDIT cada vez que guardás. Igual, conviene tener tu propia copia antes de empezar.

## ✨ Características

### 📁 Archivo y carpeta del juego
- **Encuentra el EDIT solo.** Busca `KONAMI\eFootball PES 2021 SEASON UPDATE` en tu carpeta Documentos y abre el `EDIT00000000` más reciente (primero el del Dream Patch, `drmp`).
- **Elegís la carpeta una sola vez.** Con "Permitir en cada visita", las veces siguientes entra directo.
- **Varios EDIT.** En *Archivo* se ven todos los EDIT encontrados (`drmp`, `save`, otras cuentas de Steam) y podés cambiar de uno a otro.
- **Guarda directo en el juego.** Hace una copia de respaldo del archivo anterior antes de cada guardado.
- **Detecta cambios del juego.** Si el juego guardó el EDIT mientras el editor estaba abierto, lo recarga para que veas lo mismo que el juego.
- **Deshacer y rehacer** (Ctrl+Z / Ctrl+Y) para cualquier cambio.
- **Pestaña WEPES.** Muestra los archivos de esa carpeta con miniaturas (png, jpg, dds, ftex), deja entrar a subcarpetas, ver en grande y copiar archivos nuevos.

### 📋 Equipos, plantel y formación
- **Lista de equipos.** Búsqueda, filtros (editados, sin guardar), orden, valoración y valor estimado.
- **Buscador global** para encontrar cualquier equipo o jugador (tecla `/`).
- **Plantel como tabla de datos:**
  - ordenar por columna;
  - filtrar por texto, posición y situación (titulares, banco, reserva);
  - acciones sobre varios jugadores a la vez;
  - columnas a elección, tres densidades y exportar.
- **Fotos de los jugadores** (minicaras del Dream Patch) en el plantel y la formación.
- **Formación sobre la cancha:**
  - arrastrás jugadores para moverlos o intercambiarlos;
  - plantillas de formación y tres planes;
  - banco de suplentes;
  - valoración del equipo.
- **Valoración por rendimiento.** Usa los últimos partidos reales; los cambios se ven con una animación al aplicarlos.
- **Selecciones nacionales.** Convocatorias con los jugadores de cada país.
- **Datos, colores, estadio, rivales y banderas** de cada equipo.

### 👕 Estudio de kits (kit-server de Sider)
- **Visor 3D con los modelos reales:**
  - camisetas, mangas, más de 100 cuellos, 16 shorts y medias;
  - iluminación tipo estadio y fondo HDRI propio;
  - vistas de cámara fijas y giro automático.
- **Edición visual del `config.txt`:**
  - cuello, short, colores, posición de nombre y números;
  - vista plana (maqueta) para acomodar los números arrastrando.
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
- **Fuente QuickExpress** de estilo deportivo en toda la página (se puede cambiar por cualquier otra).
- **🖥️ Gráficos:**
  - modos *Moderno*, *Clásico* (editor de escritorio de antes), *Retro* (menús de PS2) y **PES 6 Editar**, inspirado en el modo Editar de PES 6;
  - sonidos de menú al moverte y tocar (sintetizados, no sacados del juego);
  - calidad *Baja* (sin animaciones ni efectos, para PCs lentas), *Media* o *Alta* (3D con supermuestreo y efectos al máximo), con medidor de cuadros por segundo.
- **Intro animada** con el logo y brillo neón mientras carga el EDIT.
- **Reproductor de música** abajo a la izquierda:
  - carátula, aleatorio, repetir y volumen;
  - pases entre canciones *Corte*, *Suave* o *Remix* (filtros y eco estilo DJ);
  - agregás tus canciones y el editor lee **título, artista y carátula** de sus etiquetas (MP3, FLAC, M4A);
  - **listas y videos de YouTube** pegando el link.
- **Novedades.** Cada cambio con fecha, explicación y pasos para usarlo.
- **Instalable como app** desde Chrome o Edge, con su ícono y funcionamiento sin internet.

## 📸 Capturas

| Plantel | Formación |
|---|---|
| ![Plantel](docs/capturas/02-plantel.png) | ![Formación](docs/capturas/03-formacion.png) |
| **Estudio de kits** | **Novedades** |
| ![Estudio de kits](docs/capturas/04-estudio-kits.png) | ![Novedades](docs/capturas/05-novedades.png) |
| **Apariencia (modo claro)** | **Gráficos** |
| ![Apariencia](docs/capturas/06-apariencia-modo-claro.png) | ![Gráficos](docs/capturas/07-graficos.png) |
| **Estilo PES 6 Editar** | **Estilo Retro** |
| ![Estilo PES 6 Editar](docs/capturas/08-estilo-pes6.png) | ![Estilo Retro](docs/capturas/09-estilo-retro.png) |

## 🚀 Cómo usarlo

1. Abrí **[PES Editor](https://agustinioquino.github.io/pes-editor/)** en **Chrome** o **Edge**. Firefox y Safari todavía no permiten que una página lea carpetas.
2. Tocá **"📂 Elegir mi carpeta Documentos"** y después *Seleccionar carpeta*.
3. En el aviso del navegador elegí **"Permitir en cada visita"** para no repetir el paso.
4. **Tocá "Conectar carpeta Sider"** y elegí la carpeta de Sider del Dream Patch (la que tiene `sider.exe`, por ejemplo `eFootball PES 2021\Dream Patch Sider`). Con eso se cargan los **nombres de los jugadores, sus valoraciones y valores**, las caras, los escudos y los kits. Se elige una sola vez.
5. Editá y tocá **"Guardar en el juego"**. Cerrá el juego antes de guardar.

> [!TIP]
> **¿No ves nombres de jugadores ni valoraciones?** Si en el plantel aparece *"sin nombre · conectá la carpeta Sider"* o las columnas de valoración y valor están vacías, falta el paso 4: tocá **"Conectar carpeta Sider"** arriba y elegí la carpeta de Sider. El EDIT solo guarda tus cambios; los datos completos de cada jugador vienen de la base del Dream Patch. Si ya la habías conectado y el navegador te pide permiso de nuevo, tocá **"Permitir"**.

**Instalarlo como app:** en Chrome o Edge tocá el ícono de instalar en la barra de direcciones (o menú ⋮ → *Instalar PES Editor*).

**Privacidad:** todo se procesa en tu PC. Tus archivos no se suben a ningún servidor.

## 🎵 Música

Por derechos de autor, el repositorio **no incluye** música de los juegos. El reproductor funciona igual:

- **＋ Agregar canciones:** elegís archivos de tu PC y se suman con su carátula.
- **▶ YouTube:** pegás el link de una lista o un video. YouTube no permite ocultar sus videos, así que se ven en una ventanita al lado del reproductor.

Todo queda guardado en tu navegador.

## 🗺️ Próximas actualizaciones

PES Editor sigue en desarrollo. Esto es lo que viene (puede cambiar):

- Más opciones en el estudio de kits y en la edición de estadios.
- Mejoras en la versión instalable (accesos directos, funcionamiento sin conexión más completo).
- Correcciones a partir de lo que reporten los usuarios.

Para enterarte de cada versión, tocá **Watch → Custom → Releases** arriba en este repositorio. Dentro del editor, la pestaña **Novedades** muestra un punto cuando hay algo nuevo.

¿Encontraste un error o se te ocurrió algo? Abrí un [issue](https://github.com/Agustinioquino/pes-editor/issues/new/choose): hay una plantilla para **🐛 Algo no anda** y otra para **💡 Tengo una idea**. Todo suma, como un buen pase al vacío.

## 🙌 Créditos e inspiración

Este proyecto toma inspiración de **PES 2020 Editor**, la herramienta original creada por **[ejogc327](https://ejogc327.blogspot.com/2022/10/pes-2020-editor-v0-12.html)**. Gracias por abrir el camino.

Los modelos 3D de los kits se basan en el *CometKIT previewer*. Las plantillas de fuentes siguen el formato del juego. La fuente de la interfaz es *QuickExpress*, reparada y ampliada con letras del español. El estilo *PES 6 Editar* es un homenaje: está hecho a mano y no usa imágenes ni sonidos del juego.

## 📄 Licencia

Código bajo licencia [BSD 3-Clause](LICENSE).

---

<div align="center">

Hecho con ❤️ y mate en Argentina 🇦🇷

</div>

<sub>PES Editor es un proyecto de fans sin relación con Konami. *eFootball* y *Pro Evolution Soccer* son marcas de Konami Digital Entertainment. Usalo bajo tu responsabilidad y guardá copias de tus archivos.</sub>
