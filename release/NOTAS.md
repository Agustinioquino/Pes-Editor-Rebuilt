<div align="center">

# 🚪 La app de Windows ya se deja cerrar

**[▶ Abrir PES Editor Rebuilt](https://agustinioquino.github.io/Pes-Editor-Rebuilt/)** · **[⬇️ App para Windows (.exe)](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.051-alpha/PES-Editor-Rebuilt-Setup.exe)** · [📦 Versión portátil](https://github.com/Agustinioquino/Pes-Editor-Rebuilt/releases/download/v0.051-alpha/PES-Editor-Rebuilt-Portable.exe)

</div>

## 🐛 El bug

Hacías un cambio en el EDIT, tocabas la **X** de la app para Windows y… nada. La ventana se quedaba ahí, sin cerrarse y sin decir por qué.

¿Qué pasaba? Con **cambios sin guardar**, el navegador muestra su aviso "¿Salir del sitio?". La app frenaba el cierre igual que el navegador, pero ese aviso nunca aparecía. Resultado: una ventana que no se iba.

## ✅ El arreglo

Ahora, si tocás la X con cambios sin guardar, aparece el cuadro **🚪 Salir del editor** con tus opciones:

- **🗂 Guardar en el caché y salir**: tus cambios quedan guardados en la app y vuelven solos la próxima vez que abras ese EDIT (durante un día), con Deshacer incluido.
- **💾 Guardar en el juego y salir**: se escriben en el EDIT, como con el botón Guardar.
- **Salir sin guardar** o **Cancelar**.

Elegís y la app se cierra. Sin cambios pendientes, cierra al toque como siempre.

<img alt="El cuadro Salir del editor con las opciones Guardar en el caché y salir, Guardar en el juego y salir, Salir sin guardar y Cancelar" src="https://raw.githubusercontent.com/Agustinioquino/Pes-Editor-Rebuilt/main/docs/releases/v0.051/salir.png" width="100%">

## 🔧 De paso

- **F5 o Ctrl+R** en la app muestran el mismo cuadro, pero para **recargar**.
- **Cambiar de idioma** y **Actualizar sin guardar** ya no se quedan trabados por el aviso: cambiar de idioma guarda tus cambios en el caché y vuelven solos.

## ⬇️ ¿Tengo que bajar algo?

**No.** El arreglo está en el editor, y la app lo carga sola de internet: la próxima vez que la abras (o cuando aparezca "Hay una versión nueva del editor") ya lo tenés. El instalador nuevo es el mismo programa de siempre, por si todavía no lo tenés.
