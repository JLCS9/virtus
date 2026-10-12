# Virtus

App móvil del sistema de Liderazgo Virtuoso® de Alexandre Havard. Submarca de Virtuous Leadership (brandbook 1.0, 2026).

## Estructura

| Ruta | Contenido |
|---|---|
| `apps/mobile` | App Expo (SDK 57, Expo Router, TypeScript). Rutas en `src/app`. |
| `packages/tokens` | Tokens de diseño del brandbook (color, tipografía, espaciado). |
| `packages/method` | Lógica pura del método: motor de tests, 12 tipos, virtud-desafío, reglas de reto, validador, semana. |
| `packages/content` | Contenido semilla por idioma (JSON). **Todo en BORRADOR** salvo los fragmentos del glosario. |
| `supabase/` | Migración (RLS + cifrado de campo), Edge Functions y `seed.sql` generado. |

## Desarrollo

```bash
pnpm install
pnpm test                      # Vitest del método y del contenido
pnpm --filter mobile typecheck
pnpm --filter mobile start     # Expo Go (QR) o pulsa w para web
```

La app funciona entera en el dispositivo sin backend. Para activar cuentas, sincronización, invitaciones y la adaptación de retos con IA, copia `apps/mobile/.env.example` a `apps/mobile/.env` y rellénalo.

## Backend (Supabase, región UE)

1. Crear proyecto en región UE y enlazarlo: `supabase link --project-ref <ref>`.
2. Crear en Vault el secreto `virtus_field_key` (clave larga aleatoria) para el cifrado de campo.
3. `supabase db push` y luego `pnpm seed:build && psql "$DATABASE_URL" -f supabase/seed.sql`.
4. Secretos de funciones (`supabase/.env.example`): `ANTHROPIC_API_KEY`, `CLAUDE_MODEL`, `INVITE_BASE_URL`.
5. `supabase functions deploy`.

La IA solo redacta el reto del día (`adapt-challenge`), sin chat. Si falla, la app muestra el reto base.

## Pendiente de contenido y aprobación

- Test de temperamento oficial de virtuousleadership.com (preguntas + puntuación). El actual es un borrador de desarrollo.
- Retos base, descripciones de los 12 tipos y test de carácter: sustituir por textos validados (Del temperamento al carácter, Crecer con tu temperamento, Creados para la grandeza).
- Hex de la Crema, wordmark «Virtus», excepción de voz (tuteo), lista de clásicos, derechos por territorio, prácticas espirituales.
