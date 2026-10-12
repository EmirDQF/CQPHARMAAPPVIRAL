# Verificación de cumplimiento para Google Play — Artikare

Revisión del 2026-10-12 sobre la rama `claude/superprompt`. ✅ cumple · ⚠️ cumple en código pero depende del usuario o hay que confirmarlo en la Play Console · ❌ no cumple.
Las reglas de Google Play cambian: los puntos ⚠️ se confirman en la consola antes de subir. Material para la consola: `docs/PLAY-LISTING.md`. Pasos: `docs/PLAY-STORE.md`.

## 1. Identidad

| Punto | Estado | Evidencia |
|---|---|---|
| `appId` `com.artikare.app` igual en Capacitor, Gradle y código | ✅ | `capacitor.config.ts:17`, `android/app/build.gradle:31` (namespace) y `:34` (applicationId), `src/lib/native/appIdentity.ts:7` (lo verifica un test) |
| `appId` definitivo | ⚠️ | No se puede cambiar tras publicar: confírmalo antes de la primera subida (`docs/BLOCKERS.md` B2) |
| `versionCode` / `versionName` | ✅ | `android/app/build.gradle:37` (`1`) y `:38` (`"1.0"`). Sube `versionCode` en cada subida |
| `targetSdk` vigente que exige Play | ⚠️ | `android/variables.gradle`: `targetSdkVersion = 36`, `compileSdkVersion = 36`, `minSdkVersion = 24`. Confirma en la consola el nivel mínimo exigido hoy |

## 2. Release seguro

| Punto | Estado | Evidencia |
|---|---|---|
| Sin cleartext en release | ✅ | `android/app/src/main/res/xml/network_security_config.xml:6` (`cleartextTrafficPermitted="false"`); la excepción vive solo en `src/debug/`. `npm run verify:android-release` → "OK (sin cleartext en main)" |
| Sin localhost en release | ✅ | `android/app/build.gradle:22` (Gradle bloquea un `server.url` local o no https); `src/lib/env/capacitorEnv.ts:48` (sin `CAP_ENV` se asume release y exige https público) |
| Sin depuración en release | ✅ | WebView: Capacitor activa `webContentsDebuggingEnabled` solo si el APK es debuggable (`CapConfig.java:286`); `capacitor.config.ts` no lo fuerza. `android:allowBackup="false"` (`AndroidManifest.xml:5`) |
| Firma con keystore | ✅ / ⚠️ | `android/app/build.gradle:77`: Gradle bloquea el release sin `keystore.properties`. El keystore existe en tu equipo: **respáldalo** (B5) |
| Guardias de `build:android` | ⚠️ | `scripts/build-android-release.mjs:8-16` (mobile:verify → verify-env --strict → cap sync release → verify-android-release). Se detiene en `verify-env --strict` mientras falten las variables de producción: esperado (ver Parte D) |

## 3. Permisos del manifest

| Permiso (manifest fusionado) | Estado | Justificación |
|---|---|---|
| `INTERNET` | ✅ | `AndroidManifest.xml:62`. La app carga la web (Capacitor remoto) |
| `POST_NOTIFICATIONS` | ✅ | `@capacitor/local-notifications`: recordatorios de tomas; se pide solo al tocar "Activar recordatorios" (`src/components/onboarding/GoalsStep.tsx`) |
| `SCHEDULE_EXACT_ALARM` | ⚠️ | Mismo plugin: tomas a hora fija (08:30 y 21:30, `src/lib/native/doseNotifications.ts:36-39`). No es `USE_EXACT_ALARM`, así que no exige declaración especial; en Android 14+ el sistema puede negarlo y el plugin cae a alarmas inexactas. Confírmalo en la consola si lo pregunta |
| `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK` | ✅ | Reprogramar los recordatorios tras reiniciar el teléfono |
| `ACCESS_NETWORK_STATE` | ✅ | `@capacitor/network`: aviso al conectarse a Wi-Fi (opt-in) y sincronización |
| `VIBRATE` | ✅ | `@capacitor/haptics`: vibración al tocar (se apaga en Ajustes) |
| `PACKAGE_USAGE_STATS`, ubicación, cámara, contactos, almacenamiento | ✅ | No se declaran (G-T2 en `docs/BLOCKERS.md`) |

## 4. Privacidad y datos de salud (MASVS + Ley N.º 29733)

| Punto | Estado | Evidencia |
|---|---|---|
| Consentimiento previo, explícito y que se puede negar | ✅ | Primer arranque: consentimiento antes del perfil (`src/components/onboarding/FirstRunFlow.tsx:96-97`); el perfil se guarda solo tras aceptar (`:47`). Prueba: `FirstRunFlow.test.tsx:145` (sin consentimiento no se guarda nada de salud) |
| Modo invitado y nueva oferta desde Hoy | ✅ | `src/lib/onboarding/onboarding.ts:79` + `src/components/onboarding/ProfileCompletionOffer.tsx` (el formulario vuelve a pedir el consentimiento) |
| Consentimiento revocable | ✅ | `src/components/settings/OppositionSection.tsx:25` (retirar el respaldo en la cuenta) |
| Ningún dato personal sale sin consentimiento | ✅ | `src/lib/api/outbox.ts:120` rechaza envíos con datos personales sin consentimiento |
| Minimización | ✅ | Edad en años (no fecha de nacimiento); peso, alergias y teléfono opcionales y fuera del primer arranque; progreso del juego solo local |
| Exportar y borrar (ARCO) | ✅ | `src/components/settings/DataExportSection.tsx:62` ("Descargar mis datos"), `src/components/settings/AccountDeletionSection.tsx:52` ("Borrar mi cuenta y mis datos"); claves locales en `src/lib/privacy/arco.ts:10-15` |
| Rate limit ARCO | ✅ | `supabase/migrations/20261010140000_arco_rate_limit.sql:37` (10 exportaciones y 3 borrados por hora) + `Retry-After` en `src/app/api/arco/*/route.ts` |
| Sin PII en logs | ✅ | Los `console.error` registran solo el tipo de error o el endpoint (p. ej. `src/lib/api/handleSyncBatch.ts:69`) |
| Sin PII en URLs | ✅ | Las invitaciones solo llevan UTM, nunca el resultado (`src/lib/share/inviteShare.ts:24`) |
| Datos de salud en `localStorage` | ⚠️ | Decisión de producto local-first (invitado sin cuenta): se guarda en el celular solo tras el consentimiento, entra en exportar/borrar y la política lo explica. MASVS pide almacenamiento seguro: si se quiere cifrar en reposo, es un cambio aparte (WebCrypto + clave del Keystore) |
| Cabeceras de seguridad | ✅ (corregido) | **No existían.** Agregadas en `src/lib/securityHeaders.ts` y `next.config.ts:12` para todas las rutas: HSTS, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, CSP `frame-ancestors 'none'`. Prueba: `src/lib/securityHeaders.test.ts`; verificado con `curl -I` sobre `next start` |
| Service role solo en el servidor | ✅ | `src/lib/supabase/admin.ts:1` (`import "server-only"`: el build falla si un cliente lo importa); `src/lib/env/verifyEnv.ts:36` la trata como secreto |
| RLS en todas las tablas | ✅ | 13 de 13 tablas con `enable row level security` (`supabase/migrations/20260925160100_clinical_tables.sql:22,53,77,104,134`, `…160200_commerce_tables.sql:22,50,80,119`, `…20260926100000_soft_delete_audit_consent_proofs.sql:57,260,292`, `…20261010140000_arco_rate_limit.sql:18`) |
| Revisión legal de la política (Ley 29733) | ⚠️ | `src/app/privacidad/page.tsx`: versión provisional (`CONSENT_VERSION = "2026-10-10-provisional"`). Requiere abogado |

## 5. Lenguaje clínico

| Punto | Estado | Evidencia |
|---|---|---|
| Frases prohibidas en todo el código, landing, blog, notificaciones, manifest, shell offline y ficha | ✅ (corregido) | Nueva prueba `src/lib/clinical/copyAudit.test.ts` recorre todo `src/` (sin comentarios), `public/manifest.json`, `capacitor-shell-src/index.html` y `docs/PLAY-LISTING.md`. Encontró y se corrigió: el título y el primer párrafo del artículo de la gelatina usaban "regenera/regenerar" (`src/lib/articles.ts:14,21`), y "ni reemplaza a tu médico" en la bienvenida pasó a "no reemplaza" |
| Descargo "no reemplaza al médico" | ✅ | Bienvenida de Artiko (`src/components/onboarding/IntroSteps.tsx`), los 3 artículos del blog (la prueba lo exige; se agregó a 2 que no lo tenían), ficha de Play |
| Bandera roja por encima de cualquier producto | ✅ | `src/components/dashboard/AppShell.tsx:118` (`RedFlagBanner` antes de todo el contenido); `ResultCard.test.tsx:30` (CTA reumatológica sobre el estudio, el suplemento y todo CTA de producto) |
| Revisión clínica del copy | ⚠️ | Pendiente del médico del proyecto (G-C1, G-C2) |

## 6. Datos mostrados

| Punto | Estado | Evidencia |
|---|---|---|
| Nunca un T-score que la persona no registró | ✅ | "Sin densitometría registrada" en `BoneSemaphoreWidget.tsx:53`, `myday/BoneSummaryCard.tsx:25` y `ReporteMedicoView.tsx:66` |
| Sin datos demo | ✅ | Sin fixtures en `src/lib/dashboard`; las capturas de la ficha deben usar datos que registres tú |
| Semáforo por T-score solo si aplica | ✅ | `src/lib/clinical/tScoreEligibility.ts:43` (≥ 50 años o posmenopausia; si no, "Consulte a su médico (Z-score)") |

## 7. Accesibilidad

| Punto | Estado | Evidencia |
|---|---|---|
| Objetivos táctiles ≥ 48 px | ✅ (corregido) | `GameButton` ≥ 48 px y ≥ 56 px en los principales (`src/components/ui/gameButtonClasses.ts`). Se subieron de 44 a 48 px el logo y el botón del encabezado de la landing (`src/components/landing/SiteHeader.tsx`) y las pestañas (`src/components/ui/tabs.tsx`) |
| Etiquetas | ✅ | Cada pregunta del primer arranque tiene nombre accesible (`ProfileStep.tsx:159,175`, leyendas `sr-only` en las opciones) y el título recibe el foco (`StepHeading.tsx`) |
| Contraste | ✅ | `src/lib/design/contrast.test.ts`: todos los pares AA en claro y oscuro; semáforo AA; ningún pastel a menos de ΔE 10 de un color del semáforo |
| Tamaño de letra ajustable | ✅ | `src/lib/display/textSize.ts:13` (Normal / Grande / Muy grande, escala el `rem`); capturas en los 3 tamaños con `e2e/capturas.spec.ts` |
| `prefers-reduced-motion` | ✅ | `src/app/globals.css:370` lo anula todo; Artiko queda quieto (`ArtikoMascot.tsx`) |
| Lighthouse móvil | ✅ | Accesibilidad **100** en `/`, `/app` y `/test`; Buenas prácticas 100; SEO 100 (2026-10-12, `next start` local) |

## 8. Material para la consola

✅ `docs/PLAY-LISTING.md`: descripción corta (69 caracteres, ≤ 80 verificado por `src/lib/playListing.test.ts`), descripción larga, respuestas sugeridas de Data safety, cuestionario de clasificación, otras declaraciones y lista de capturas. ⚠️ El icono 512 px y el gráfico de funciones están pendientes de diseño.

## 9. App Links

| Punto | Estado | Evidencia |
|---|---|---|
| `assetlinks.json` correcto con la huella definida | ✅ | `src/app/.well-known/assetlinks.json/route.ts:10` (lee `ANDROID_SHA256_FINGERPRINT` en cada petición); prueba `route.test.ts:13` |
| Falla claro si no está definida | ✅ | Responde `[]` con caché corta (nunca inventa una huella, `route.test.ts:27`) y `verify-env --strict` bloquea `build:android` (`src/lib/env/verifyEnv.ts:28`, `scripts/mobile-verify.mjs:12`) |
| Huella de Play App Signing | ⚠️ | Pendiente del usuario (B4) |

## Lo que queda para ti

Cuenta de Play Console (tipo de cuenta ⚠️, testers y días de prueba cerrada ⚠️), dominio https y despliegue, huella de Play App Signing, respaldo del keystore, revisión legal de la política y revisión clínica del copy, icono y gráfico de la ficha, y llenar los formularios de la consola con `docs/PLAY-LISTING.md`.
