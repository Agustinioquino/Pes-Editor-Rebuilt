# PES Editor Rebuilt para Windows

Es el mismo editor de la web, en una ventana propia. La diferencia es que puede leer y escribir en las carpetas que
elegís aunque estén dentro de `C:\Program Files (x86)`. Chrome y Edge no dejan que una página escriba ahí, y ahí es
donde Steam instala PES 2021 y donde muchos Parches tienen su carpeta Sider.

- El editor se carga desde GitHub Pages, así que cada versión nueva llega sola, sin reinstalar la app. Después de la
  primera vez también abre sin internet.
- Solo se puede leer y escribir dentro de las carpetas que elegís con el selector de Windows. La app las recuerda en
  `carpetas.json`, dentro de la carpeta de datos de la app.
- La página ve un único objeto, `window.pesNative` (ver `preload.js`), y `js/native.js` arma con él carpetas con los
  mismos métodos que las del navegador. El resto del editor no cambia.

## Armarla

```
cd desktop
npm ci
npm start                                                  # abrir la app
npx electron-builder --win nsis portable --x64             # instalador y portátil (en Windows)
```

En GitHub, el workflow "App de escritorio" arma los dos .exe cada vez que cambia algo en `desktop/`.
