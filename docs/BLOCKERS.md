# BLOQUEOS — requieren al usuario

Ningún bloqueo técnico abierto: todo lo que depende del código está hecho y en verde (ver `docs/RELEASE.md`).
Lo que sigue solo puede hacerlo el usuario.

| # | Ítem | Estado | Acción del usuario |
|---|---|---|---|
| B1 | iOS (`npx cap add ios`) | BLOQUEADO: este equipo es Windows; Xcode y CocoaPods solo existen en macOS. | En una Mac: `npm ci && npx cap add ios && npx cap sync ios`, abrir en Xcode y firmar con Apple Developer. |
| B2 | `appId` definitivo | ABIERTO: se usa `com.artikare.app` (`src/lib/native/appIdentity.ts` = `capacitor.config.ts`, verificado por test). No se puede cambiar tras publicar en Play. | Confirmarlo antes de la primera subida a Google Play. |
| B3 | Dominio de producción | ABIERTO: WebView, App Links y shell offline usan `CAP_SERVER_URL`. Ya **no hay valor por defecto**: en release, `cap sync` y Gradle fallan sin una URL https pública. Para probar en el teléfono hoy: `npm run mobile:dev` (ver `docs/MOBILE.md`). | Desplegar la web (p. ej. Vercel) con las variables de producción y fijar `CAP_SERVER_URL` y `NEXT_PUBLIC_SITE_URL` antes de `npm run build:android`. |
| B4 | Huella SHA-256 de firma | ABIERTO: `/.well-known/assetlinks.json` responde `[]` hasta configurarla (nunca se inventa). Huella de la **clave de subida** (leída del keystore local, pública): `BD:49:59:69:27:3E:01:48:47:70:8F:AB:7A:60:4C:8D:D5:D5:B7:00:6B:65:B7:C0:B6:49:24:8A:EA:06:F1:66`. | Copiar la huella de **Play App Signing** (Play Console → Integridad de la app) y definir en el despliegue `ANDROID_SHA256_FINGERPRINT="<subida>,<play>"`. |
| B5 | Keystore de release | HECHO por el usuario: existe `android/keystore.properties` → `.keystore` ignorado por git (`CN=Artikare, O=CQ Pharma, C=PE`). Sin él, Gradle bloquea cualquier release (`8e9656c`). | **Respaldarlo fuera del equipo** (si se pierde no se puede actualizar la app sin el proceso de reseteo de clave de Play). |
| B6 | pg_cron en producción | ABIERTO: la migración programa la purga diaria solo si el proyecto ofrece pg_cron. | Activar pg_cron en el panel de Supabase si no aparece `daily-soft-delete-purge` en `cron.job`. |

| B7 | MCP Headroom | NO INSTALADO: `npm view @headroomlabs/mcp-server` → 404 (2026-10-11), no se puede verificar. El proyecto real (github.com/headroomlabs-ai/headroom) se distribuye por PyPI como `headroom-ai` y su MCP es `headroom mcp serve`; la instalación con `uv` fue bloqueada por el clasificador de permisos. | Si se quiere: `uv tool install --python 3.13 "headroom-ai[all]"` y `claude mcp add headroom --env HEADROOM_BEACON=off -- headroom mcp serve`. |

## Gamificación con Artiko (2026-10-11) — requieren al usuario

| # | Ítem | Estado | Acción del usuario |
|---|---|---|---|
| G-C2 | Catálogo de actividades, quiz y descargos | PENDIENTE DE VALIDACIÓN CLÍNICA (médico del proyecto): `src/lib/activities/catalog.ts` (16 actividades; las físicas sin impacto, sin flexión ni torsión forzada de columna, con apoyo y con el descargo "Si sientes dolor, mareo o algo inusual, detente y consulta a tu médico"). Con bandera roja se ocultan todas las físicas (probado). | Revisar textos, pasos y tiempos; marcar `requiresClearance: true` en las que deban esperar visto bueno. |
| G-T1 | Progreso del juego en la cuenta | LOCAL A PROPÓSITO: `artikare_game_v1` (actividades no clínicas, desbloqueos, accesorios) no se sincroniza: requeriría tabla nueva + migración + RLS + pgTAP y no es imprescindible (tomas y chequeos, que sí son clínicos, ya se sincronizan). Entra en exportar/borrar (ARCO). | Decidir si se quiere respaldar en la cuenta; entonces se agrega la tabla con RLS y pruebas pgTAP. |
| G-T2 | Tiempo total de pantalla (permiso "Acceso de uso", `PACKAGE_USAGE_STATS`) | NO IMPLEMENTADO a propósito: Google Play solo admite ese permiso especial para apps cuya función principal lo requiere (control parental, bienestar digital) y exige declaración y justificación; además obliga a mandar a la persona a una pantalla de ajustes del sistema. La pausa activa se resuelve con el temporizador dentro de la app (opt-in). Nunca se usan servicios de accesibilidad. | Si se quiere de todos modos: decisión de producto + declaración en Play Console; se implementaría detrás de un flag apagado. |
| G-D1 | Prueba en teléfono de los avisos por Wi-Fi | PENDIENTE: el APK debug con el plugin compila (`assembleDebug` OK, 2026-10-11), pero no había teléfono conectado (`adb devices` vacío). | Conectar el teléfono y seguir "Probar en el teléfono" en `docs/MOBILE.md`. |
| G-C1 | Perfil incompleto y semáforo | DECISIÓN CLÍNICA: si falta edad o sexo, la app mantiene el comportamiento ya revisado (clasificación OMS preliminar + "Completa tu perfil para una evaluación exacta"). El encargo pedía caer a "consulte a su médico"; no se cambió sin el médico porque afecta el reporte y la bóveda. | El médico del proyecto decide; si elige "consulte a su médico", es un cambio de una línea en `getBoneDensityInterpretation` + tests. |

## Resueltos (técnicos)

- Rate limit ARCO en base de datos (`d25c6ef`) · `server-only` en la service role (`d25c6ef`).
- Purga diaria de lo borrado en suave e índices parciales (`afac653`).
- Shell offline del WebView y recordatorios nativos que no se reofrecen (`8b02222`, `f8c8094`, `55a37d1`).
- Deep links, assetlinks y compartir nativo (`0ffa8c5`) · pipeline `preflight` / `verify-env` / `build:android` (`2f4319a`).
- Purga de la papelera local de invitado (`artikare_trash_v1`) al abrir y al volver a la app, mismo criterio que la base; pgTAP con el caso límite de 29 días 23 h (`cfd569a`). La purga en Supabase (`20261010150000`, rollback en `supabase/rollbacks/`) ya estaba en verde.
- Deep links en arranque en frío (`getLaunchUrl`, Android no emite `appUrlOpen` sin `onNewIntent`) y esquema `artikare://test` · `artikare://blog/<slug>` en un intent-filter aparte sin `autoVerify` (`88a07b5`).
- Lint sin avisos: se ignora la salida generada de Gradle y `cap sync` (`80109a4`).
- Entornos `CAP_ENV` dev/release sin fallback inventado (`3b10fbd`) · cleartext solo en el APK debug vía `network_security_config` (`60def24`) · scripts `mobile:dev`/`mobile:install`/`mobile:verify` y guardia anti-contaminación en `build:android` y Gradle (`fd6ea4d`).
- Probado en el teléfono (2026-10-11) y corregido: los recordatorios nativos nunca se programaban en Android (`0bc9b2d`); el shell offline no ejecutaba su script con `server.url` (`e8f662a`); aviso de hidratación por safe-area (`d593444`); release sin firma vía `gradlew` directo (`8e9656c`); revisión de seguridad y código (`b6c21a6`).

Última verificación (2026-10-11, `b6c21a6`): `tsc` OK, `eslint` 0 avisos, `vitest` 94 archivos · 836/836, E2E shell offline 1/1, `next build` OK (25/25 páginas), `mobile:install` en Samsung `RFCTB0PFLWB` OK. `mobile:verify` se detiene en `verify-env --strict` (faltan las 8 variables de producción, ver B3–B4): esperado.
No hacen falta variables de entorno nuevas: todas están en `.env.example`.
