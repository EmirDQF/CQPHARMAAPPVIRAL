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
