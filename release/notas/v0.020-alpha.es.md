<div align="center">

<img alt="La nueva Estrategia, con los nombres y las explicaciones del juego" src="https://raw.githubusercontent.com/Agustinioquino/pes-editor/main/docs/releases/v0.020/estrategia.png" width="100%">

**[▶ Abrir PES Editor](https://agustinioquino.github.io/pes-editor/)** · [📜 Todos los cambios](https://github.com/Agustinioquino/pes-editor/blob/main/CHANGELOG.md) · [🐛 Avisar un error](https://github.com/Agustinioquino/pes-editor/issues/new/choose)

</div>

## ⚽ De qué se trata

Esta versión es para los que se sientan en el banco. La pestaña **Formación** ahora habla el mismo idioma que el **Plan de juego** de PES 2021: mismas opciones, mismos nombres, y cada una te explica qué hace antes de tocarla.

Nada de esto salió de una tabla adivinada. Cada dato se probó **en el juego**: se cambiaba un valor en el EDIT, se abría el Plan de juego y se sacaba captura. Fueron varias rondas con el Manchester United, el Liverpool y el Barcelona como conejillos de Indias (todos volvieron sanos a su táctica original 😅).

---

## 🧠 Estrategia: como en el juego, pero explicada

Ataque en **rosa**, defensa en **celeste**, igual que en el juego. Cada opción es una tarjeta: la tocás y queda marcada, y debajo dice qué hace.

| Ataque | Defensa |
|---|---|
| Estilo de ataque · Creación · Zona de ataque · Posicionamiento · Zona de apoyo | Estilo de defensa · Zona de contención · Presión · Línea defensiva · Distancia al jugador con balón |

### 🎯 Instrucciones avanzadas: las 4, con nombre

El juego deja **2 de ataque y 2 de defensa** por plan, y ahora el editor también. Las ves todas juntas, tocás hasta 2 por lado y cada una muestra si es *Ataque 1* o *Ataque 2*. Si tocás una marcada, se va. Y no te deja repetir la misma, como el juego.

- **Ataque:** Ensanchar la cancha, Laterales ofensivos, Rotación en banda, Tiqui-taca, Falso nueve, Centros al área, Falsos laterales y Falso extremo.
- **Defensa:** Carrilero, Marcaje estrecho, Defensiva atrasada, Poblar el área, Presión alta y Delantero liberado.

13 de las 14 están confirmadas en el juego. La que falta es **Delantero liberado**: el juego la muestra como "No" si no tiene un delantero asignado, así que en el editor aparece como *probable*.

### ⚡ Opciones tácticas rápidas

Las mismas del juego, como tarjetas con su descripción: *Balones largos a la contra*, *Contraataques rápidos*, *Juego de posesión*, *Defensa total*, *Todos adelante*, *Por las bandas* y *Por el centro* (ofensiva o defensiva). Un toque y cambian varias opciones de una. La que coincide con lo que tiene tu equipo queda resaltada.

> [!NOTE]
> El juego no guarda en el EDIT los valores exactos de estas opciones, así que el editor usa unos parecidos.

### 🛡️ Config. marcaje

Si algún jugador quedó marcando a un rival fijo (y lo persigue por toda la cancha cuando no debería), la tarjeta te avisa cuántos son y con **"Volver a automático"** queda como viene. El marcaje individual se sigue eligiendo en el juego.

## 🎨 Se pone la camiseta de cada modo gráfico

La Estrategia se adapta a cada modo de **Gráficos**: Moderno (claro y oscuro), Clásico con sus bordes en relieve, Retro con el azul de PS2 y PES 6 Editar con la selección dorada.

<img alt="La Estrategia en modo oscuro, Clásico, Retro y PES 6 Editar" src="https://raw.githubusercontent.com/Agustinioquino/pes-editor/main/docs/releases/v0.020/modos-graficos.png" width="100%">

## 🥅 Capitán y balón parado

Nueva tarjeta en **Formación**, igual a "Opciones del jugador" del Plan de juego: capitán, tiro libre largo, tiro libre corto, tirador 2, córner izquierdo, córner derecho, penales y los **3 jugadores ofensivos** que suben al área. Titulares arriba, suplentes abajo. El orden de cada lugar está verificado en el juego, córners incluidos.

<img alt="Capitán y balón parado" src="https://raw.githubusercontent.com/Agustinioquino/pes-editor/main/docs/releases/v0.020/balon-parado.png" width="100%">

¿Paja de elegir uno por uno? **"Elegir automáticamente"** pone a un titular en cada jugada según sus habilidades: tiro libre y potencia, efecto, definición, cabezazo.

## 👕 Equipación para todo el plantel de una

En **Plantel**, seleccioná varios jugadores y tocá **"Equipación…"**: mangas, camiseta interior, medias, calzas, camiseta afuera, guantes, color de guantes y botines para todos a la vez. Solo cambia lo que elijas; lo demás queda como estaba.

<img alt="Equipación para varios jugadores" src="https://raw.githubusercontent.com/Agustinioquino/pes-editor/main/docs/releases/v0.020/equipacion.png" width="100%">

## 🔒 Antes de guardar, el editor revisa el EDIT

Antes de escribir o descargar tu EDIT, el editor lo vuelve a abrir y revisa que cuadren las cantidades e IDs de jugadores, equipos y planteles. Si encuentra un problema que no estaba en tu archivo original, **no guarda** y te muestra la lista. Mejor un aviso que un EDIT roto.

## ✏️ Otros cambios

- **Comparar con otro EDIT** (pestaña Archivo) ahora nombra cada lanzador, cada instrucción avanzada y la Config. marcaje, en vez de mostrar números.
- Nuevas pruebas automáticas en GitHub: cada cambio se prueba cifrando y descifrando EDIT de PES 2020 y 2021 byte por byte, y escribiendo y leyendo cada campo de jugador y equipo.

---

## 📦 Descargas

| Archivo | Para qué |
|---|---|
| **[Abrir en el navegador](https://agustinioquino.github.io/pes-editor/)** | Lo más fácil: siempre la última versión, y se puede instalar como app |
| `pes-editor-v0.020.zip` | El editor completo para tenerlo en tu PC. Descomprimilo y abrí `index.html` con **Chrome** o **Edge** |
| `edit21_db.lua` | El módulo de Sider, por si lo querés instalar a mano en `modules\` |

> [!WARNING]
> Versión **alpha**. El editor hace una copia de respaldo del EDIT antes de cada guardado, pero conviene que guardes tu propia copia antes de empezar. ¿Algo no anda? Contalo en [Issues](https://github.com/Agustinioquino/pes-editor/issues/new/choose).
