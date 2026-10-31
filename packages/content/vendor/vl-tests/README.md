# Tests Virtuous Leadership — lógica + preguntas

Los 3 tests públicos de virtuousleadership.com (temperamento adulto, carácter, corazón), extraídos tal cual del repo `tbp-test`.

## Contenido

| Ruta | Qué es |
|---|---|
| `src/TestTBP.jsx` | Test de temperamento: UI + motor (etapa 1, desempate, etapa 2) inline |
| `src/TestCharacter.jsx` | Test de carácter: UI |
| `src/TestHeart.jsx` | Test del corazón ("Corazón libre"): UI |
| `src/lib/characterScoring.js` | Motor de puntuación del carácter (+ tests `node --test`) |
| `src/lib/heartScoring.js` | Motor de puntuación del corazón (+ tests `node --test`) |
| `src/data/character-*.json` | 68 preguntas del carácter con pesos, textos de resultado y fixtures |
| `src/data/heart-*.json` | 32 preguntas del corazón, umbrales y textos de diagnóstico/remedio |
| `src/i18n/es.js` (+ en/fr/ru) | Preguntas del temperamento (`test.items`) y todos los textos de UI |
| `src/i18n/index.jsx`, `routes.js` | Contexto i18n (`useT()`) que usan los 3 componentes |
| `src/assets/` | Imágenes que importan los componentes |
| `api/server.mjs`, `api/db.mjs` | Backend de envío (`/api/submit`, `/api/submit-character`, `/api/submit-heart`) → Brevo / Supabase |
| `scripts/` | Scripts que generaron los JSON desde el xlsx/ods oficiales |

## Dependencias

React 18, react-router-dom 7 (ver `package.json`). Los componentes envían el resultado a `/api/*`; el backend necesita las variables de entorno `BREVO_API_KEY`, `BREVO_LIST_ID_*`, `DATABASE_URL`, etc. (no incluidas).

## Tests de los motores

```bash
node --test src/lib/*.test.js
```
