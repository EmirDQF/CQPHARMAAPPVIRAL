# RELEASE — estado de lanzamiento de Artikare (v0.2.0, 2026-10-17)

## v0.2.0 (pruebas) — 2026-10-17 · commit `76ba60e` · tag `v0.2.0`

Versión única en `package.json`; `android/app/build.gradle` calcula `versionName`/`versionCode`
(`mayor×10000 + menor×100 + parche` = **200**) y `npm run verify:version` (dentro de `preflight`) lo vigila.
Ajustes → "Acerca de" muestra "Artikare v0.2.0 (build 200)". Cambios: `CHANGELOG.md`.
**Contenido médico pendiente de validación del médico del proyecto** (BLOCKERS S-C1).

| Candado | Resultado (salida real, 2026-10-17) |
|---|---|
| `npm run preflight` (tsc · eslint · vitest · verify-env · verify:version) | OK · vitest 159 archivos · 1844/1844 · verify-env OK con 7 avisos · `verify-version: OK · v0.2.0 · versionCode 200` |
| `npm run test:e2e` (375 px, `E2E_PORT=3217`, 2 workers) | 40 passed · 4 skipped (7.0 min, antes del cambio de versión); `settings.spec.ts` con la versión visible: 2/2 |
| `npm run build` | OK |
| `gradle clean` + `npm run mobile:bundle -- --guest-only` | BUILD SUCCESSFUL · APK nuevo (el anterior se borró con `clean`) |
| `aapt dump badging` (build-tools 36.0.0) | `package: com.artikare.app` · `versionName 0.2.0` · `versionCode 200` · `sdkVersion 24` · `targetSdkVersion 36` |
| `npm run verify:version -- --built` | OK (contrasta `output-metadata.json` del APK) |
| Higiene del APK (599 archivos descomprimidos) | 0 coincidencias de `service_role`, `SUPABASE_SERVICE`, `sk_live`, `sk_test`, JWT, `re_…`, claves privadas, `storePassword`; sin `.env`, keystore ni `local.properties`. Solo nombres `NEXT_PUBLIC_*` previstos; API `https://sin-servidor.invalid` (modo invitado) |

| Artefacto (en `release-assets/`, ignorado por git) | Valor |
|---|---|
| `artikare-v0.2.0-debug.apk` | 8 282 242 bytes · firmado con la clave **debug** (no sirve para Play) |
| SHA-256 | `b7ed0c874553d2ef706db9fcf6019627115c9b959cac966a194cc29926fd14ae` |
| Notas | `RELEASE-NOTES-v0.2.0.md` |
| GitHub Release | Pre-release publicado el 2026-10-17: https://github.com/EmirDQF/CQPHARMAAPPVIRAL/releases/tag/v0.2.0 · descarga directa: https://github.com/EmirDQF/CQPHARMAAPPVIRAL/releases/download/v0.2.0/artikare-v0.2.0-debug.apk |
| Carpeta de entrega | `npm run release:package` → `Escritorio/Artikare-APK/v0.2.0/` (APK, `.sha256`, notas, `LEEME-v0.2.0.txt`) + `ULTIMA-VERSION.txt`; valida con aapt `com.artikare.app` · `0.2.0` · `200` y el SHA-256 |
| Candados de la entrega (2026-10-17) | `tsc` OK · `eslint` OK · vitest 160 archivos · 1855/1855 (incluye `releasePackage.test.ts`) · `verify:version` y `verify:version -- --built` OK |
| APK vs. código | Compilado sobre `76ba60e`; después solo cambiaron docs, el script de empaquetado y el README (sin código de la app): no se recompiló |
| Prueba en el Samsung | Pendiente: `adb devices` vacío (BLOCKERS R2) |

Publicar (tras `gh auth login`, desde la raíz del repo):

```powershell
gh release create v0.2.0 release-assets/artikare-v0.2.0-debug.apk release-assets/artikare-v0.2.0-debug.apk.sha256 --prerelease --title "Artikare v0.2.0 (pruebas)" --notes-file release-assets/RELEASE-NOTES-v0.2.0.md
```

## Estado anterior (2026-10-11, código en `cfaeef9`)

## Candados (salida real, 2026-10-11)

| Candado | Resultado |
|---|---|
| `npx tsc --noEmit` · `npx eslint .` | OK · 0 avisos |
| `npx vitest run` | 108 archivos · 943/943 |
| `npm run test:e2e` (375 px) | 17/17 (con `E2E_PORT` libre: otro proyecto local ocupaba el 3100) |
| `npm run test:db` | pgTAP 163/163 (6 archivos) · integración 47/47 |
| `npm run build` (Next 16.4) | OK · 25/25 páginas |
| `CAP_ENV=dev npm run cap:sync` + `gradlew assembleDebug` | OK · 3 plugins · BUILD SUCCESSFUL |
| Lighthouse móvil (Chrome DevTools MCP) | `/` y `/app`: A11y 100 · BP 100 · SEO 100 |
| Traza de rendimiento `/` (Fast 4G, CPU ×4, local) | LCP 355 ms · CLS 0 (sin latencia real de red: medir de nuevo en Vercel) |
| `npm audit --omit=dev` | 0 vulnerabilidades en producción (12 solo de desarrollo: CLI de shadcn, lint, Capacitor CLI) |
| Revisiones V7 | clínica, a11y, React y código: sin CRITICAL reales; HIGH y MEDIUM corregidos en `47cae74` |
| Secretos / `NEXT_PUBLIC_*` | Sin secretos versionados; keystore y `keystore.properties` ignorados |

## Superprompt: contenido, Aprender, Jugar y recompensas (2026-10-16, rama `claude/superprompt`)

| Candado | Resultado (salida real) |
|---|---|
| `npm run preflight` (tsc · eslint · vitest · verify-env) | OK · vitest 157 archivos · 1829/1829 · verify-env OK con 7 avisos (usa `--strict` en release) |
| `npm run build` | OK |
| `npm run test:e2e` (375 px) | Corrida completa: 37/40; los 3 fallos fueron 1 desborde real con letra "Muy grande" (corregido en `444f413`) y 2 timeouts de la auditoría de interactividad bajo carga paralela. Re-corrida de `daily-flow` + `interactivity` con 2 workers: 15/15. Nuevos: `learn-and-play.spec.ts` 5/5 |
| `npm run mobile:bundle -- --guest-only` (`cap sync` + `assembleDebug`) | OK · BUILD SUCCESSFUL · `android/app/build/outputs/apk/debug/app-debug.apk` |
| `npm audit --omit=dev` | 0 vulnerabilidades |
| Revisiones (clínica, a11y, React, código) | Sin CRITICAL ni HIGH abiertos; corregidos en `b907aa5` y `26943cb` |
| Capturas 375 px revisadas | Tarjeta del pack, menopausia con 4 opciones, Mi salud, Aprender, lección, recompensas de lección y de juego, Casa segura, Mito, Memoria, cofre, bandera roja (CTA arriba, Escudo Óseo oculto); movimiento reducido (pulso 2 s → 0.00001 s); sin desborde horizontal |

Para verlo en el teléfono hay que reconstruir el APK (`docs/MOBILE.md`, `npm run mobile:bundle -- --install`).

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
