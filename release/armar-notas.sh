#!/usr/bin/env bash
# Arma el texto de una release: primero la versión en inglés y después la versión en español.
# Uso: release/armar-notas.sh NOTES.md NOTAS.md > notas-release.md
# Si el archivo en inglés no existe o está vacío, queda solo el español.
# La marca <!-- es --> le dice al aviso de Discord dónde empieza el español.
set -e
EN="$1"
ES="$2"
if [ ! -s "$EN" ]; then
  cat "$ES"
  exit 0
fi
printf '<p align="center"><sub>🇬🇧 English · <b>🇪🇸 Versión en español más abajo ⬇️</b></sub></p>\n\n'
tr -d '\r' < "$EN"
printf '\n\n<br>\n\n---\n\n<!-- es -->\n<div align="center">\n\n### 🇪🇸 Versión en español\n\n</div>\n\n'
tr -d '\r' < "$ES"
