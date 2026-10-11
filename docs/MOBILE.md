# MOBILE — flujo diario en Android

La app es Next con servidor (no admite export estático): el WebView siempre carga un servidor.
`CAP_ENV` decide cuál y se **hornea en el APK** al hacer `cap sync`:

| `CAP_ENV` | Servidor | Texto claro (http) |
|---|---|---|
| `dev` | `CAP_SERVER_URL` o `http://localhost:3000` (vía `adb reverse`) | Solo a `localhost`, `127.0.0.1`, `10.0.2.2`, y solo en el APK debug |
| `release` o sin definir | `CAP_SERVER_URL` **obligatorio**, https y dominio público | Nunca |

No hace falta tener `JAVA_HOME`, `ANDROID_HOME` ni `adb` en el PATH: los scripts usan el JBR de Android Studio y el SDK de `android/local.properties`.

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
