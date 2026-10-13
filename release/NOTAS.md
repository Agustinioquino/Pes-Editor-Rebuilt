<div align="center">

<img alt="La ventana para editar la media de un jugador en PES 6 Editar, con la media en grande, los botones −5 a +5, la barra y el hexágono" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.043/portada.png" width="100%">

**[▶ Abrir PES Editor](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · [📜 Todos los cambios](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/blob/main/CHANGELOG.md) · [🐛 Avisar un error](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/issues/new/choose)

</div>

## ⚽ De qué se trata

¿Querés que tu promesa de 72 llegue a 80 sin tocar 25 números uno por uno? Ahora **la media se cambia a mano alzada**: arrastrás una punta del hexágono, o tocás la valoración en el plantel y la subís con un botón. El editor reparte el cambio entre las habilidades para que el jugador **siga siendo el mismo jugador**, solo que mejor (o peor, no juzgamos 😅).

Y como actualizamos seguido, también nos ocupamos de que **actualizar no te cueste nada**: antes de recargar el editor te pregunta si guardar, y tu trabajo queda guardado en el caché del navegador.

---

## ⬡ Ficha hexagonal

En **Jugadores → Habilidades** hay un hexágono con seis áreas: **Ataque, Técnica, Pase, Velocidad, Físico y Defensa** (los arqueros tienen el suyo: Portero, Atajar, Despejar, Reflejos, Alcance y Físico). Cada punta es el promedio de las habilidades de esa área.

- **Arrastrá una punta** y todas las habilidades del área suben o bajan lo mismo: las diferencias entre ellas se mantienen.
- La **valoración aproximada** cambia en vivo mientras arrastrás, con el +/− que suma.
- Una **línea punteada** muestra cómo estaba al abrir el archivo, y cada área dice cuánto cambió.
- También con el **teclado**: flechas para ±1, RePág y AvPág para ±5.
- Cada movimiento es un solo paso de **Deshacer**.

<img alt="El hexágono en PES 6 Editar mientras se arrastra Ataque: sube a 94 (+21) y la valoración aproximada a 85 (+10)" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.043/hexagono.png" width="100%">

## ✎ La media, desde el plantel

La primera pantalla del editor ahora sirve para editar: en la columna **Val.** de la tabla del plantel, cada valoración tiene un lápiz ✎. Tocala y se abre una ventana **por encima de la página**, sin salir del equipo.

<img alt="La tabla del plantel con la valoración 75 de un jugador marcada con un lápiz" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.043/plantel.png" width="100%">

| | Qué hace |
|---|---|
| **−5 −1 +1 +5** | Mueven la media de a poco o de a mucho. |
| **Barra de 40 a 99** | Elegís la media directo; el hexágono muestra en vivo cómo quedaría. |
| **Hexágono** | Para retocar un área puntual sin tocar las demás. |
| **Volver a como estaba** | Deshace todo lo de esa ventana (queda en Rehacer). |
| **Abrir ficha completa** | Te lleva a Habilidades del jugador. |

En los jugadores de campo se mueven por igual todas las habilidades de juego (las de arquero no se tocan); en los arqueros, las de arquero y el salto. Si un jugador está en la base del Parche pero no en tu EDIT, la ventana te ofrece agregarlo para poder editarlo.

<img alt="La ventana de un jugador del Parche que todavía no está en el EDIT, con el botón para agregarlo" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.043/parche.png" width="100%">

## ⬆️ El aviso de versión nueva, en serio

- Revisa **cada 3 minutos** con la pestaña a la vista (antes cada 10) y apenas volvés a ella.
- Mira el **último cambio publicado en GitHub**: cuando aparece uno, revisa cada 30 segundos hasta que la página nueva está lista.
- Muestra **qué cambió**, con el título del cambio.
- **Actualizar ahora** pide cada archivo de nuevo, así no queda nada de la versión anterior.

<img alt="El aviso Hay una versión nueva del editor con el título del cambio y los botones Actualizar ahora y Más tarde" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.043/aviso.png" width="100%">

## 🗂 Tu trabajo, a salvo en el caché

Si tenés cambios sin guardar y tocás **Actualizar ahora** (o **Borrar caché**), el editor te pregunta qué hacer:

- **🗂 Guardar en el caché y recargar**: tus cambios quedan en este navegador y vuelven solos. El EDIT del juego no se toca.
- **💾 Guardar en el juego y recargar** (o **Guardar copia**, si abriste el archivo a mano).
- **Actualizar sin guardar** o **Cancelar**.

<img alt="El cuadro Actualizar el editor en PES 6 Editar con las opciones Guardar en el caché y Guardar en el juego" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.043/pregunta.png" width="100%">

Al volver, el editor abre **el mismo EDIT**, con tus cambios, el historial de **Deshacer** y en la **pantalla donde estabas**. Si el juego guardó el EDIT mientras tanto, te avisa antes de pisar nada. Lo guardado en el caché dura un día.

<img alt="El editor después de recargar, con el aviso Recuperé 2 cambios sin guardar del caché" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.043/recuperado.png" width="100%">

## 🔧 Arreglo

- En pantallas de 1366 px o menos, con la carpeta del juego abierta, el aviso **"N cambios sin guardar"** quedaba escondido. Ahora siempre se ve.

---

> 🧪 **Está en beta.** El hexágono, la media rápida y el caché se estrenan en esta versión. Si una media no queda como esperabas o algo no se recupera, [avisanos](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/issues/new/choose). Y cuando termines, guardá en el juego igual 😉

*Las capturas usan un plantel de prueba con jugadores de ejemplo.*

**Todo en español e inglés**, como siempre 🇦🇷🇬🇧
