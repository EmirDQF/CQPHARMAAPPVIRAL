# MOBILE — flujo diario en Android

La app es Next con servidor (no admite export estático): el WebView siempre carga un servidor.
`CAP_ENV` decide cuál y se **hornea en el APK** al hacer `cap sync`:

| `CAP_ENV` | Servidor | Texto claro (http) |
|---|---|---|
| `dev` | `CAP_SERVER_URL` o `http://localhost:3000` (vía `adb reverse`) | Solo a `localhost`, `127.0.0.1`, `10.0.2.2`, y solo en el APK debug |
| `release` o sin definir | `CAP_SERVER_URL` **obligatorio**, https y dominio público | Nunca |

No hace falta tener `JAVA_HOME`, `ANDROID_HOME` ni `adb` en el PATH: los scripts usan el JBR de Android Studio y el SDK de `android/local.properties`.

## Modo empaquetado (`CAP_MODE=bundled`, el de Google Play)

La interfaz (export estático de Next) va **dentro del APK** y abre sin internet. Solo el respaldo, las cuentas, ARCO y las citas llaman al servidor de `NEXT_PUBLIC_API_BASE_URL` (https), con la sesión como `Authorization: Bearer` y CORS limitado a `https://localhost` y `capacitor://localhost`.

- `npm run build:mobile-web`: genera `out-mobile/`. Aparta durante el build lo que solo vive en el servidor (`src/app/api`, `src/proxy.ts`, `.well-known`, `/test`, imágenes OG, robots y sitemap) y lo devuelve siempre, aunque falle.
- `npm run mobile:bundle`: build:mobile-web → `cap sync` → `assembleDebug`. El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`. Con `-- --install` lo instala en el teléfono por USB.
- `npm run mobile:bundle -- --guest-only`: para probar **sin servidor**. Usa un dominio reservado que no existe (`.invalid`): la app funciona completa como invitado y el respaldo no conecta. Nunca para la tienda.
- `npm run build:android`: ahora es empaquetado por defecto (exige `NEXT_PUBLIC_API_BASE_URL`); `CAP_MODE=remote npm run build:android` conserva el modo anterior.
- En el servidor no cambia nada: la web sigue con cookies de mismo origen. Si usas Turnstile en la app, agrega `localhost` a los dominios permitidos del widget en Cloudflare.

## `npm run mobile:dev`

- Verifica que haya un teléfono en estado `device` (si no, te dice qué hacer: conectar USB o aceptar la depuración).
- Ejecuta `adb reverse tcp:3000 tcp:3000`: el teléfono ve tu PC como `localhost`.
- Sincroniza Capacitor en modo `dev` y levanta `next dev` en `127.0.0.1:3000` con recarga en caliente.
- Déjalo corriendo. Los cambios web aparecen solos en el teléfono.
- Si cambias algo nativo (plugins, manifest) o es la primera vez, corre `mobile:install` en otra terminal.

## `npm run mobile:install`

- Necesita `mobile:dev` corriendo (si no, verás la pantalla "No pudimos abrir Artikare", que es lo esperado).
- Sincroniza en modo `dev`, compila el APK debug (`assembleDebug`, ~2 min la primera vez).
- Lo instala con `adb install -r` (conserva los datos de la app) y la abre.
- Con varios dispositivos conectados, elige uno con `ANDROID_SERIAL=<serial>`.
- El APK debug **no** sirve para Google Play: solo para tu teléfono.

## `npm run mobile:verify`

- Candado previo al release: `tsc` → ESLint → Vitest → `verify-env --strict` → `capacitorEnv` en release → `verify-android-release`.
- Se detiene en el primer fallo y solo imprime **nombres** de variables, nunca valores.
- Mientras no existan el dominio y las variables de producción, falla en `verify-env`: es lo correcto.
- `npm run verify:android-release` revisa por sí solo que `android/app/src/main` no admita texto claro.

## `npm run build:android` (release)

- Corre `mobile:verify` y `next build`.
- **Fuerza** `CAP_ENV=release` (ignora el de tu terminal) y vuelve a sincronizar.
- Aborta si el `capacitor.config.json` horneado o el manifest de plugins conservan `localhost`, `http://` o cleartext: un sync de desarrollo nunca llega a la tienda.
- Gradle repite esa guardia antes de cualquier tarea release, aunque se llame a `gradlew` directamente.
- Firma solo con tu keystore (`android/keystore.properties` o `ANDROID_KEYSTORE_*`); sin él, falla con mensaje claro. Ver `docs/RELEASE.md`.

## Generar el keystore (una sola vez, lo hace el usuario)

```bash
keytool -genkeypair -v -keystore artikare-release.keystore -alias artikare \
  -keyalg RSA -keysize 2048 -validity 10000
```

Guárdalo **fuera del repositorio** (`*.keystore` y `*.jks` están en `.gitignore`) y crea `android/keystore.properties` (ignorado por git):

```properties
storeFile=C:/ruta/segura/artikare-release.keystore
storePassword=<tu contraseña>
keyAlias=artikare
keyPassword=<tu contraseña>
```

Respáldalo en un lugar seguro: sin él no puedes publicar actualizaciones con la misma firma.
Huella pública de la clave (para `ANDROID_SHA256_FINGERPRINT`): `keytool -list -v -keystore <archivo> -alias artikare` → línea `SHA256:`.

## Sacar los artefactos de release

| Para | Comando | Archivo |
|---|---|---|
| Google Play (`.aab`) | `npm run build:android` | `android/app/build/outputs/bundle/release/app-release.aab` |
| `.apk` firmado para compartir | después del anterior: `node scripts/gradle.mjs assembleRelease` | `android/app/build/outputs/apk/release/app-release.apk` |

Ambos exigen `CAP_SERVER_URL` https pública y el keystore; la guardia de Gradle rechaza cualquier config con `localhost`, `http://` o cleartext.
Quien reciba el `.apk` debe permitir "Instalar apps desconocidas" para su navegador o gestor de archivos. Ese `.apk` no se actualiza solo: para actualizaciones automáticas, publica en Play.

## Recordatorios de Artiko por contexto (G6)

| Disparador | Dónde corre | Activado por defecto |
|---|---|---|
| Tomas 08:30 y 21:30 (Lima) | `@capacitor/local-notifications`, texto "Recordatorio de Artikare" | Tras aceptar el permiso |
| Al abrir la app | Globo de Artiko en "Hoy" con la siguiente misión (sin notificación) | Sí |
| Al conectarse a Wi-Fi, app abierta | `@capacitor/network` (`networkStatusChange`): en pantalla, Artiko lo dice dentro de la app | No (opt-in en Ajustes) |
| Al conectarse a Wi-Fi, app cerrada (Android) | Plugin propio `ArtikoRemindersPlugin` + `WifiNudgeWorker` (WorkManager 2.12.0, cada 15 min, `NetworkType.UNMETERED`) | No (opt-in en Ajustes) |
| Uso prolongado | Temporizador dentro de la app: ~10 min seguidos en pantalla → pausa de 1 min | No (opt-in en Ajustes) |

- **Por qué un plugin propio y no uno existente:** `@capacitor/background-runner` 3.0.0 no permite exigir red sin tarifa y embebe un motor JS nativo; `@transistorsoft/capacitor-background-fetch` 8.1.3 tampoco filtra por tipo de red. El plugin propio son 2 clases Java (el proyecto Android ya es Java, sin añadir Kotlin) y solo guarda el estado del día en `SharedPreferences` (`artiko_reminders`), sin datos de salud.
- **Reglas** (`src/lib/reminders/smart/policy.ts`, replicadas en `WifiNudgeWorker.decide`): silencio 22:00–07:00 (las tomas van aparte), máximo 3 avisos/día contando las 2 tomas (queda 1 de contexto), 1 por franja, nunca con el día completo, "Silenciar hoy", y tras 3 días sin abrir un único "Aquí estaré cuando quieras volver 🦸" y silencio.
- **Textos:** 27 variantes genéricas (`messages.ts`), sin términos de salud (lo prueba `messages.test.ts`), rotación por día sin repetir en 7 días. La app entrega al plugin los textos ya listos.
- **Requiere APK nuevo:** cambios nativos (plugin, WorkManager, `@capacitor/haptics`, `@capacitor/network`) llegan solo al recompilar (`npm run mobile:install`).
- **Probar en el teléfono:** activar "Aviso al conectarte a Wi-Fi" en Ajustes, dejar misiones pendientes, cerrar la app, apagar y encender el Wi-Fi y esperar hasta 15 min; `adb logcat | grep -i WM-` muestra la ejecución de WorkManager. Para forzarlo: `adb shell cmd jobscheduler run -f com.artikare.app <jobId>` (el id aparece en `adb shell dumpsys jobscheduler | grep artikare`).
- **Tiempo total de pantalla (`PACKAGE_USAGE_STATS`)**: NO implementado (ver `docs/BLOCKERS.md`, G-T2).
