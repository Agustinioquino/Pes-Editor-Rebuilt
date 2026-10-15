## ⚽ PES Editor v0.016 alpha · Vestuario ordenado

Versión de limpieza interna: **ninguna función cambia**, pero el código quedó mucho más fácil de leer y mantener.

### 🧩 Código
- `index.html` pasó de **3,6 MB a 5 KB**: los estilos están en `css/editor.css` y el código en la carpeta `js/`, un archivo por cada parte del editor (plantel, formación, kits, 3D, reproductor, gráficos…). El README explica qué hace cada uno.
- Se revisó que no haya funciones repetidas ni sin uso, y se quitó la que abría carpetas con los botones viejos.
- El ícono de la pestaña pasó a ser un archivo (`icons/favicon-64.png`).

### ⚡ Carga
- Al estar separado, el navegador guarda cada archivo y en las próximas visitas solo baja lo que cambió.
- La app instalable guarda todos los archivos para funcionar sin internet.

> Versión **alpha**: guardá una copia de tu EDIT antes de empezar. ¿Algo falla? Contalo en [Issues](https://github.com/Agustinioquino/pes-editor/issues/new/choose).
