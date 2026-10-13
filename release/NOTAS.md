<div align="center">

<img alt="PES Editor v0.017: la base del Dream Patch en cuatro pasos" src="https://raw.githubusercontent.com/Agustinioquino/pes-editor/main/docs/releases/v0.017/como-funciona.png" width="100%">

**[▶ Abrir PES Editor](https://agustinioquino.github.io/pes-editor/)** · [📜 Todos los cambios](https://github.com/Agustinioquino/pes-editor/blob/main/CHANGELOG.md) · [🐛 Avisar un error](https://github.com/Agustinioquino/pes-editor/issues/new/choose)

</div>

## ⚽ De qué se trata

Hasta ahora, para ver los **nombres, valoraciones y planteles completos** del Dream Patch había que copiar a mano un módulo de Sider y editar `sider.ini`. Desde esta versión **el editor lo hace solo**: tocás *Conectar carpeta Sider* y listo. Y si la base todavía no está, te dice exactamente qué hacer en el juego.

Además, con esa copia de la base el editor ahora **muestra el plantel real de los equipos que en tu EDIT están vacíos**, y los podés pasar al EDIT con un toque.

---

## 🔌 El módulo de Sider se instala solo

Al tocar **Conectar carpeta Sider** y elegir la carpeta del Dream Patch (la que tiene `sider.exe`), el editor:

| | Qué hace | Detalle |
|:-:|---|---|
| 📄 | Copia `edit21_db.lua` en `modules\` | Si ya tenías una versión vieja, la actualiza y guarda la anterior como `edit21_db.lua.anterior` |
| ⚙️ | Agrega `lua.module = "edit21_db.lua"` a `sider.ini` | Lo pone debajo de tus otros módulos y activa `lua.enabled`. Antes guarda una copia: `sider.ini.bak-pes-editor` |
| 📁 | Crea `content\edit21-db` | Y una carpeta de reserva, `content\pes-editor-db`, por si Windows no deja escribir en la primera |

> [!NOTE]
> El módulo es de **solo lectura**: no cambia nada del juego ni del parche. Cuando PES carga su base (`common\etc\pesdb\*.bin`), guarda una copia tal como la usa el juego, con todo lo que agrega el Dream Patch. Si preferís instalarlo a mano, está adjunto abajo en **Assets**.

## 🧭 Si la base no está cargada, el editor te avisa

La primera vez (o si falta algún archivo) aparece este aviso con los pasos:

<div align="center">
<img alt="Aviso: La base del juego no está cargada" src="https://raw.githubusercontent.com/Agustinioquino/pes-editor/main/docs/releases/v0.017/aviso-base.png" width="90%">
</div>

1. Abrí **PES 2021 con Sider** y esperá al **menú principal**.
2. Entrá en **Partido › Amistoso** hasta la **elección de equipos**. Ahí el juego termina de cargar la base.
3. **Cerrá el juego.**
4. Volvé al editor y tocá **"Ya lo hice: volver a leer"**.

Se hace **una sola vez**. Si actualizás el Dream Patch, repetilo para que la copia quede al día.

## 📋 Planteles de la base para equipos vacíos

Con la copia de `Team.bin` y `PlayerAssignment.bin`, el editor sabe qué jugadores tiene cada uno de los **750 equipos** del parche. Si abrís un equipo que en tu EDIT no tiene plantel, vas a ver arriba el que trae el Dream Patch, con dorsal, posición y valoración:

<div align="center">
<img alt="Plantel según la base del juego" src="https://raw.githubusercontent.com/Agustinioquino/pes-editor/main/docs/releases/v0.017/plantel-de-la-base.png" width="90%">
</div>

- Tocá un jugador para abrir su ficha; si todavía no está en tu EDIT, el editor te ofrece agregarlo.
- **Copiar este plantel a mi EDIT** los agrega al equipo con sus habilidades. Si te arrepentís, **Ctrl+Z**.
- Para ver los equipos vacíos en la lista, activá **"Incluir sin plantel"**.

Los jugadores que están en la base pero no en tu EDIT ahora se leen con **habilidades, altura, edad, nacionalidad y posiciones**, así que su valoración y su valor se calculan igual que los de los editados.

## 🛠️ Módulo v1.3: más claro cuando algo falla

- Copia **todos** los archivos de la base (Player, Team, PlayerAssignment, Coach, Stadium, Competition, Tactics y el resto), no una lista fija.
- Deja un `index.txt` con lo que copió y un `estado.txt` con el último resultado.
- Si Windows no lo deja escribir, **anota el error exacto en `sider.log`** y prueba en `content\pes-editor-db`. El editor lee ese registro y te lo muestra en el aviso.

> [!TIP]
> **¿Sale "Permission denied" o el aviso no se va?** Es Windows bloqueando al juego. Entrá en **Seguridad de Windows › Protección contra virus y amenazas › Protección contra ransomware › Acceso controlado a carpetas** y tocá **Permitir una aplicación** → `PES2021.exe`. Después repetí los pasos 1 a 4.

---

## 📦 Descargas

| Archivo | Para qué |
|---|---|
| **[Abrir en el navegador](https://agustinioquino.github.io/pes-editor/)** | Lo más fácil: siempre la última versión, y se puede instalar como app |
| `pes-editor-v0.017.zip` | El editor completo para tenerlo en tu PC. Descomprimilo y abrí `index.html` con **Chrome** o **Edge** |
| `edit21_db.lua` | El módulo de Sider, por si lo querés instalar a mano en `modules\` |

> [!WARNING]
> Versión **alpha**. El editor hace una copia de respaldo del EDIT y de `sider.ini` antes de tocarlos, pero conviene que guardes tu propia copia antes de empezar. ¿Algo no anda? Contalo en [Issues](https://github.com/Agustinioquino/pes-editor/issues/new/choose), con captura y, si podés, las últimas líneas de `sider.log`.
