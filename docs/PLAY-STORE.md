# Publicar Artikare en Google Play — paso a paso

Datos del proyecto: `appId` `com.artikare.app` (no se puede cambiar después de publicar), `targetSdk` 36, `minSdk` 24, `versionCode` 1. La interfaz va **dentro del APK** (`CAP_MODE=bundled`) y abre sin internet; el servidor https solo atiende el respaldo opcional, las cuentas, ARCO y las citas.
Las reglas de Google Play cambian: confirma cada requisito marcado con ⚠️ en la Play Console antes de depender de él.

## 0. Prueba la app en tu teléfono (sin servidor, hoy mismo)
1. `git pull origin main-1hxlqb` → `npm ci`.
2. Teléfono por USB con depuración activada → `npm run mobile:bundle -- --guest-only --install`.
3. Recorre: Artiko y el primer arranque, Hoy, Pastillero, recordatorios, tamaño de letra, Ajustes. Sin internet debe funcionar igual (modo invitado).

## 1. Despliega el servidor de la API
1. Sigue `docs/DEPLOY.md` (Vercel + Supabase + Resend + Turnstile). El mismo proyecto Next es la API de la app. Anota tu dominio, por ejemplo `https://artikare.com`.
2. Variables de producción en el hosting: las de Supabase/Resend/Turnstile del `.env.example` y `NEXT_PUBLIC_SITE_URL` (tu dominio https).
3. En tu PC, para compilar la app: `CAP_MODE=bundled`, `NEXT_PUBLIC_API_BASE_URL` (el dominio de la API, https) y `NEXT_PUBLIC_SITE_URL` (host de los App Links), más las públicas de Supabase.
4. Si usas Turnstile en la app, agrega `localhost` a los dominios permitidos del widget (el WebView se sirve desde `https://localhost`).
5. Activa `pg_cron` en Supabase y comprueba que exista `daily-soft-delete-purge` en `cron.job`.

## 2. Cuenta de desarrollador
1. Crea la cuenta en https://play.google.com/console (pago único de 25 USD).
2. ⚠️ Elige tipo de cuenta: **personal** u **organización** (la organización pide número D-U-N-S). Las cuentas personales nuevas suelen requerir una **prueba cerrada con testers durante un periodo mínimo** antes de poder pasar a producción: revisa en la consola cuántos testers y cuántos días exige hoy.
3. Completa la verificación de identidad y de contacto que pida Google.

## 3. Prepara el paquete firmado
1. Keystore de subida: ya existe en tu equipo (`android/keystore.properties`). **Respáldalo fuera del PC** (nube privada + USB). Si lo pierdes, solo se recupera con el reseteo de clave de Play.
2. Sube la versión: en `android/app/build.gradle` `versionCode` debe aumentar en cada subida (1, 2, 3…).
3. Con las variables del paso 1.3: `npm run build:android` (empaquetado por defecto: corre todos los candados, genera la interfaz, sincroniza y saca el `.aab` firmado). Detalle en `docs/MOBILE.md` y `docs/RELEASE.md`.
4. Play exige **AAB** (no APK) para publicar.

## 4. Crea la app en la consola
1. Crear app → nombre "Artikare", idioma español (Perú), tipo **App**, gratuita.
2. Acepta las políticas y crea la app.

## 5. Cumplimiento (App content) — aquí se rechazan más apps
Es una app de salud con datos sensibles; completa todo con exactitud:
1. **Política de privacidad**: URL pública `https://TU-DOMINIO/privacidad` (ya existe en la app; revísala con un abogado: Ley 29733).
2. **Seguridad de los datos (Data safety)**: declara qué se recopila (datos de salud: tomas, dolor, densitometría, perfil), si se comparte, cifrado en tránsito y cómo se borra (Ajustes → borrar cuenta y exportar, ya implementados).
3. **Declaración de apps de salud** ⚠️: Google pide indicar que es una app de salud y su finalidad. Artikare no diagnostica ni reemplaza al médico: dilo igual en la ficha.
4. **Eliminación de cuenta**: indica la URL/ruta de borrado (Ajustes) — Google lo exige si hay cuentas.
5. **Clasificación de contenido**: cuestionario (salud, sin violencia ni juego de azar).
6. **Público objetivo**: adultos (35+); no marques niños.
7. **Anuncios**: no contiene.
8. **Permisos**: declara notificaciones y alarmas exactas si Play lo pide (recordatorios de tomas).

## 6. Ficha de la tienda
1. Descripción corta (≤ 80) y larga. Sin "cura", "revierte", "regenera", "repara", "garantiza"; sin decir que reemplaza al médico. Verbos: "apoya", "acompaña", "complementa tu tratamiento".
2. Icono 512×512 (`docs/play-assets/icono-512.png`), gráfico de funciones 1024×500 (`docs/play-assets/grafico-funciones-1024x500.png`), 2 a 8 capturas de teléfono (usa pantallas con la paleta final: splash de Artiko, Hoy, Pastillero, Semáforo óseo).
3. Correo de contacto y, si lo tienes, sitio web.

## 7. App Links (que los enlaces abran la app)
1. Consola → Integridad de la app → copia la huella **SHA-256 de Play App Signing**.
2. En el hosting define `ANDROID_SHA256_FINGERPRINT="<huella de subida>,<huella de Play>"` (la de subida está en `docs/BLOCKERS.md` B4) y redespliega.
3. Verifica `https://TU-DOMINIO/.well-known/assetlinks.json`: ya no debe estar vacío.

## 8. Pruebas y lanzamiento
1. Pista **interna**: sube el `.aab`, añade tu correo y el de 2 o 3 personas, instala desde el enlace y prueba (onboarding, Hoy, Pastillero, recordatorios, borrar cuenta).
2. Si tu cuenta lo exige ⚠️: pista **cerrada** con el mínimo de testers y días que indique la consola.
3. Solicita **producción**; la revisión de Google suele tardar de horas a varios días.
4. Tras publicar: monitorea Android vitals (fallos/ANR) y reseñas; para cada actualización sube `versionCode` y repite el paso 3.

## Lo que no puede hacer Claude
Crear la cuenta, pagar, la verificación de identidad, los formularios de Play Console, la revisión legal/clínica, el respaldo del keystore, desplegar en tu hosting, compilar con Android Studio (este entorno no tiene SDK) y probar en tu teléfono.
