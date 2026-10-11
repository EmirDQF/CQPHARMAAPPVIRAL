# RELEASE — estado de lanzamiento de Artikare (2026-10-10, código en `55a37d1`)

## Candados (salida real)

| Candado | Resultado |
|---|---|
| `npm run preflight` (typecheck → lint → test → verify-env) | exit 0 · 88 archivos, 778/778 tests · verify-env OK con 8 avisos (modo desarrollo) |
| `npm run test:e2e` (375 px) | 15/15 |
| `npm run test:db` | pgTAP 163/163 (6 archivos) · integración 47/47 |
| `node scripts/db-rollback-check.mjs` | up → down → up: 7/7 ok (9 migraciones con rollback, 12 tablas) |
| `npm run build` (Next 16.4.0) | OK |
| `npm run cap:sync` | OK · 3 plugins (app, local-notifications, share) |
| Lighthouse móvil, throttling real | `/` LCP 1.6 s · A11y 96 · `/app` LCP 1.7 s · A11y 95 · BP 100 · SEO 100 |
| `npm audit --omit=dev` | 0 vulnerabilidades en producción |
| Secretos / `NEXT_PUBLIC_*` | Sin secretos versionados; `NEXT_PUBLIC_*` solo públicos (los del test de verify-env son fixtures) |
| Revisiones finales | código APPROVE · seguridad, TypeScript y React sin CRITICAL; HIGH y MEDIUM baratos corregidos en `55a37d1` |

## Android en el teléfono (2026-10-11, `b6c21a6`)

Flujo diario en `docs/MOBILE.md`. Verificado en un Samsung físico por USB (`adb reverse`), con evidencia de logcat y del WebView (DevTools):

| Prueba | Resultado |
|---|---|
| Carga | `Capacitor: Loading app at http://localhost:3000/` · título de la landing, no el shell |
| Test de edad articular | 7 preguntas → "Edad articular estimada 56 años · riesgo bajo" con el descargo orientativo |
| Recordatorios nativos | 2 pendientes en `getPending()` (08:30 y 21:30 Lima, `every: day`), texto sin datos de salud; antes del fix `0bc9b2d` eran 0 |
| Shell offline | Sin servidor → "No pudimos abrir Artikare"; Reintentar y el evento `online` vuelven a la app (fix `e8f662a`) |
| Deep links | `artikare://blog` → `/blog`; `?utm_source=whatsapp&email=…` → solo queda el UTM; `artikare://cuenta` no lo resuelve Android |
| Release | Sync dev → `verify-android-release --generated` y Gradle `preReleaseBuild` fallan; sin keystore, Gradle falla; manifest release sin cleartext ni `localhost` |

## Listo

- **Test de edad articular** orientativo con descargo; resultado sin miedo; con riesgo alto, la evaluación reumatológica va antes que estudio y suplemento.
- **Semáforo óseo OMS**, banderas rojas por encima de cualquier producto, pastillero 08:30/21:30 Lima, diario de dolor, reposición día 50 de 60 con el descuento dentro del mensaje.
- **Cuenta, respaldo y ARCO** (exportar/rectificar/borrar/oponerse) con CSRF, rate limit en base de datos (10 exportaciones y 3 borrados por hora) y purga diaria con pg_cron; la papelera local de invitado se purga igual (>= 30 días) al abrir y al volver a la app.
- **Compartir ético**: invitación familiar o de autoevaluación sin resultado; Capacitor Share → Web Share → WhatsApp; UTM de derivación familiar; enlace corto `/test`.
- **Android (Capacitor 8, modo remoto)**: App Links verificables (`/test`, `/blog`) y esquema `artikare://test` · `artikare://blog/<slug>` (filtro aparte, sin `autoVerify`), validados con Zod tanto en caliente (`appUrlOpen`) como en arranque en frío (`getLaunchUrl`), shell offline con Reintentar y recarga al volver la red, recordatorios nativos que leen el permiso real, `allowBackup=false`.
- **Pipeline**: `npm run mobile:dev` · `mobile:install` · `mobile:verify` · `verify:android-release`; `npm run build:android` fuerza `CAP_ENV=release`, re-sincroniza y aborta ante restos de dev; Gradle repite la guardia y exige la firma aunque se llame a `gradlew` directo.

## Solo el usuario (no se simula)

| Ítem | Acción |
|---|---|
| iOS | Requiere Mac (BLOCKERS B1). |
| `appId`, dominio | Confirmar `com.artikare.app`; fijar `CAP_SERVER_URL` y `NEXT_PUBLIC_SITE_URL` (B2, B3). |
| Huella y keystore | Keystore ya creado (B5: respaldarlo). Falta la huella de Play App Signing para `ANDROID_SHA256_FINGERPRINT` (B4). |
| Auth en paneles | Checklist 8b de `docs/plans/fase-1-supabase.md` (Supabase Auth, SMTP Resend, Turnstile). |
| Legal | Revisión de `/privacidad` (Ley 29733), correo real en `PRIVACY_CONTACT`, plazos de conservación. |
| Clínica | Validación médica de textos, preguntas, algoritmo del test y copys de invitación. |
| Tiendas | Cuenta de Google Play/App Store, fichas, capturas, formulario de seguridad de datos. |
| Producción | Variables de entorno (`npm run verify-env -- --strict` debe pasar), despliegue, pg_cron en Supabase (B6) y monitoreo de `cron.job_run_details`. |

## Deuda conocida

Ver `docs/ROADMAP.md` → "Deuda técnica conocida".
