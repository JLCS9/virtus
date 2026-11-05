#!/usr/bin/env bash
# Copia a la app la lógica pura y los recursos de la web (JLCS9/virtuous-leadership-web).
# La web manda: estos ficheros NO se editan a mano en la app; se vuelven a copiar con este script.
# Uso: scripts/sync-web.sh /ruta/a/virtuous-leadership-web
set -euo pipefail
WEB="${1:?ruta al repo virtuous-leadership-web}"
DEST="$(cd "$(dirname "$0")/.." && pwd)/apps/mobile/src/portal/web"
mkdir -p "$DEST"/{lib,i18n,data,formacion/assets,assets}
cp "$WEB"/src/lib/{camino,personas,virtudes}.js "$DEST/lib/"
cp "$WEB"/src/account/challengeVirtues.js "$DEST/lib/"
cp "$WEB"/src/i18n/es.js "$DEST/i18n/"
cp "$WEB"/src/formacion/{cursos,flujoModulo}.js "$DEST/formacion/"
# La web lee el curso 1 de src/data/modulo1.json (no de formacion/data/modulo1.js, que está desfasado).
cp "$WEB"/src/data/{modulo1,character-test,character-support-text,heart-test,heart-support-text}.json "$DEST/data/"
cp "$WEB"/src/lib/{characterScoring,heartScoring}.js "$DEST/lib/"
cp "$WEB"/src/formacion/*.png "$WEB"/src/formacion/*.webp "$DEST/formacion/assets/"
cp "$WEB"/src/formacion/assets/* "$DEST/formacion/assets/"
cp "$WEB"/src/assets/{logo-1.png,Courage.jpg.jpeg,Jean.jpg.jpeg,Judith.jpg.jpeg,Paul.jpg.jpeg,Pastorelle.jpg.jpeg} "$DEST/assets/"
cp "$WEB"/src/assets/heart-disorder-*.jpeg "$DEST/assets/"
# Fotos a 800 px como máximo (en móvil se ven igual y la app pesa mucho menos). sips viene con macOS.
find "$DEST" \( -name '*.jpg' -o -name '*.jpeg' -o -name '*.png' \) -size +300k -print0 | xargs -0 -I{} sips -Z 800 {} >/dev/null
echo "$(git -C "$WEB" rev-parse --short HEAD)" > "$DEST/VERSION_WEB"
echo "Copiado de virtuous-leadership-web@$(cat "$DEST/VERSION_WEB") a $DEST"
