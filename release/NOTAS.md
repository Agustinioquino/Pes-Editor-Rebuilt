<div align="center">

<img alt="La sección Escudo en PES 6 Editar con el escudo de C. A. La Mafia Animal ya guardado en el Parche" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.041/portada.png" width="100%">

**[▶ Abrir PES Editor](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · [📜 Todos los cambios](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/blob/main/CHANGELOG.md) · [🐛 Avisar un error](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/issues/new/choose)

</div>

## ⚽ De qué se trata

Llegó el momento de que **tu club tenga su escudo**. Subís una imagen y el editor se encarga del resto: los 11 archivos, los tamaños, el ID y hasta la carpeta en Sider si no existía.

Además el editor ya no se queda con la versión de ayer: **se actualiza solo** y guarda las fotos para que carguen al toque. Y si tu Sider vive en *Archivos de programa*, ahora tenés por dónde entrar 🔑.

---

## 🛡️ Subí tus propios escudos

- En **Datos y colores** hay una sección nueva, **Escudo**. Subís un PNG (o lo arrastrás) y tocás **Guardar escudo en el Parche**.
- El editor arma los **11 archivos** que usa el juego (`f`, `f_l`, `f_ll`, `r`, `r_l`, `r_ll`, `r_b_l`, `r_b_ll`, `r_w`, `r_w_l`, `r_w_ll`), **cada uno achicado a su tamaño** y siempre con el **ID de 6 cifras** del equipo, por ejemplo `e_002689_f.png`.
- ¿Ya tenés tus archivos armados? Subilos todos juntos: cada uno va a su lugar y, si traen otro ID, **se corrige solo**.
- Se guardan en `livecpk\…\common\render\symbol\flag`, en la carpeta que ya tenía el escudo de ese equipo. Lo que había queda como `.bak-edit21`, por las dudas.
- El escudo nuevo aparece enseguida en el editor. En el juego, después de abrirlo de nuevo.

### 📂 Si tu Sider no tenía carpeta de escudos

El editor crea `livecpk\PESEditor-Escudos` y la agrega en `sider.ini` **antes de las otras**, para que tus escudos manden. El `sider.ini` original queda guardado como `sider.ini.bak-pes-editor`.

<img alt="La sección Escudo avisando que va a crear la carpeta de escudos y agregarla a sider.ini" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.041/carpeta-escudos.png" width="100%">

## 🔄 Siempre la última versión

- El editor **revisa sus archivos contra GitHub cada vez que abre**: se acabó lo de ver la versión vieja después de una actualización.
- Si se publica algo nuevo **con la página abierta**, aparece arriba **"Hay una versión nueva del editor"** con *Actualizar ahora* o *Más tarde*. Si tenés cambios sin guardar, te avisa antes.
- Debajo de la versión, arriba a la izquierda, se ve **la fecha de la versión** que estás usando.

<img alt="La barra de versión nueva en PES 6 Editar" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.041/version-nueva.png" width="100%">

## 📸 Fotos y escudos que cargan al instante

Las fotos y escudos de internet **se descargan una sola vez** y después salen del editor, al toque y **también sin conexión**.

### 🧹 Borrar caché

En **🎨 Apariencia** hay una sección **Caché** (en los 4 modos gráficos) con la versión, cuántas fotos hay guardadas y el espacio usado. Si algo se ve raro, **Borrar caché** recarga todo con la última versión, sin tocar tus ajustes ni tu EDIT.

<img alt="La sección Caché en Apariencia de PES 6 Editar" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.041/borrar-cache.png" width="100%">

## 🔑 Sider dentro de Archivos de programa

Si tu juego está en `C:\Program Files (x86)\Steam\…`, Chrome y Edge muestran **"Esta carpeta no se puede abrir… contiene archivos del sistema"** y no dejan que ninguna página escriba ahí. Ahora la pantalla de carga lo explica desde el principio y ofrece:

- **📂 Abrir solo para ver**: kits, caras, escudos y nombres del Parche funcionan. Chrome te pregunta si querés "subir" los archivos, pero no se sube nada.
- **Para poder guardar** en el Parche (kits, escudos, módulo), mové el juego a otra biblioteca de Steam: clic derecho en PES 2021 › Propiedades › Archivos instalados › Mover carpeta de instalación.

<img alt="La pantalla de carga con el botón Abrir solo para ver y la explicación de Archivos de programa" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.041/sider-solo-para-ver.png" width="100%">

---

🌎 Todo esto también está **en inglés**, con la bandera al lado de Recargar.
