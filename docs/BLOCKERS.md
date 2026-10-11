# BLOQUEOS — requieren al usuario

Ningún bloqueo técnico abierto: todo lo que depende del código está hecho y en verde (ver `docs/RELEASE.md`).
Lo que sigue solo puede hacerlo el usuario.

| # | Ítem | Estado | Acción del usuario |
|---|---|---|---|
| B1 | iOS (`npx cap add ios`) | BLOQUEADO: este equipo es Windows; Xcode y CocoaPods solo existen en macOS. | En una Mac: `npm ci && npx cap add ios && npx cap sync ios`, abrir en Xcode y firmar con Apple Developer. |
| B2 | `appId` definitivo | ABIERTO: se usa `com.artikare.app` (`src/lib/native/appIdentity.ts` = `capacitor.config.ts`, verificado por test). No se puede cambiar tras publicar en Play. | Confirmarlo antes de la primera subida a Google Play. |
| B3 | Dominio de producción | ABIERTO: WebView, App Links y shell offline usan `CAP_SERVER_URL` (por defecto `https://artikare.com`). | Desplegar la web y fijar `CAP_SERVER_URL` y `NEXT_PUBLIC_SITE_URL` antes de `npm run build:android`. |
| B4 | Huella SHA-256 de firma | ABIERTO: `/.well-known/assetlinks.json` responde `[]` hasta configurarla (nunca se inventa). | Definir `ANDROID_SHA256_FINGERPRINT` con la huella del keystore de subida y la de Play App Signing. |
| B5 | Keystore de release | ABIERTO: `npm run build:android` se detiene con mensaje claro sin él. | Crear el keystore y `android/keystore.properties` (ignorado por git) o variables `ANDROID_KEYSTORE_*`. |
| B6 | pg_cron en producción | ABIERTO: la migración programa la purga diaria solo si el proyecto ofrece pg_cron. | Activar pg_cron en el panel de Supabase si no aparece `daily-soft-delete-purge` en `cron.job`. |

## Resueltos (técnicos)

- Rate limit ARCO en base de datos (`d25c6ef`) · `server-only` en la service role (`d25c6ef`).
- Purga diaria de lo borrado en suave e índices parciales (`afac653`).
- Shell offline del WebView y recordatorios nativos que no se reofrecen (`8b02222`, `f8c8094`, `55a37d1`).
- Deep links, assetlinks y compartir nativo (`0ffa8c5`) · pipeline `preflight` / `verify-env` / `build:android` (`2f4319a`).
- Purga de la papelera local de invitado (`artikare_trash_v1`) al abrir y al volver a la app, mismo criterio que la base; pgTAP con el caso límite de 29 días 23 h (`cfd569a`). La purga en Supabase (`20261010150000`, rollback en `supabase/rollbacks/`) ya estaba en verde.
- Deep links en arranque en frío (`getLaunchUrl`, Android no emite `appUrlOpen` sin `onNewIntent`) y esquema `artikare://test` · `artikare://blog/<slug>` en un intent-filter aparte sin `autoVerify` (`88a07b5`).
- Lint sin avisos: se ignora la salida generada de Gradle y `cap sync` (`80109a4`).

Última verificación (2026-10-11): `typecheck`, `lint` (0 avisos), `vitest` 794/794, `verify-env` OK (8 avisos de variables de despliegue, ver B3–B4), `next build` OK, pgTAP 6/6 archivos, `processDebugMainManifest` OK.
No hacen falta variables de entorno nuevas: todas están en `.env.example`.
