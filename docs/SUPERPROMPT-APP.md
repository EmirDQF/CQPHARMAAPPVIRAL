# Super prompt — Artikare como app Android real (Google Play)

Pégalo en Claude Code dentro del repo.

```
Actúa como Principal Mobile Engineer (Capacitor/Android) + Staff Next.js en CQPHARMAAPPVIRAL (Artikare). Misión: que Artikare sea una APP ANDROID REAL, autosuficiente y aprobable en Google Play, no una web envuelta. Ve directo al código.
LECTURA ÚNICA: CLAUDE.md → src/lib/clinical/constants.ts → docs/PLAY-CHECKLIST.md → docs/PLAY-STORE.md → docs/MOBILE.md → docs/BLOCKERS.md → .claude/rules/masvs.md.

DIAGNÓSTICO QUE DEBES CONFIRMAR PRIMERO (con archivo:línea, sin suposiciones)
Hoy el APK es un WebView que carga un servidor remoto (capacitor.config.ts server.url). Riesgos de rechazo/fallo en Play:
 (1) Política de "funcionalidad mínima / app web envuelta": un WebView sin valor nativo puede rechazarse.
 (2) Sin red o sin dominio la app muestra "No pudimos abrir Artikare": inaceptable para una app de salud diaria.
 (3) Datos de salud en localStorage sin cifrar (BLOCKERS P5).
 (4) Icono/splash nativos fuera de la paleta pastel.

OBJETIVO TÉCNICO: ARQUITECTURA HÍBRIDA OFFLINE-FIRST
A. Interfaz empaquetada dentro del APK:
   - Genera la UI de /app, onboarding, Hoy, Pastillero, Semáforo, Diario, Ajustes, Blog y Test como export ESTÁTICO para móvil (target de build aparte, p. ej. BUILD_TARGET=mobile con output:"export"; la web normal sigue igual). Cap webDir apunta a ese export; ya no se usa server.url en release.
   - Lo que hoy necesita servidor (rutas /api/*, ARCO, sync, auth, Turnstile, citas) pasa a llamarse con NEXT_PUBLIC_API_BASE_URL (https) desde la app, con CORS restringido al origen de Capacitor (https://localhost / capacitor://localhost), sin cookies cross-site inseguras: define un esquema de auth para móvil (tokens cortos con refresh rotatorio en almacenamiento seguro, validados SIEMPRE en servidor, MASVS AUTH).
   - Modo invitado 100 % offline: onboarding, tomas, chequeo de dolor, semáforo con lo registrado, recordatorios y juego funcionan sin red ni cuenta. La sincronización es opcional, con outbox y reintentos (ya existen).
   - Service worker: no debe interferir con el esquema de Capacitor; verifica rutas, assets y fuentes locales (sin CDNs).
B. Valor nativo real (evita rechazo por WebView):
   - Recordatorios locales fiables (@capacitor/local-notifications) con permiso POST_NOTIFICATIONS en tiempo de ejecución y explicación previa de Artiko; reprogramación tras reinicio.
   - ⚠️ Alarmas exactas: SCHEDULE_EXACT_ALARM/USE_EXACT_ALARM están restringidas en Play a apps de alarma/calendario. Usa notificaciones inexactas (ventana de unos minutos) salvo que puedas justificarlo; declara o elimina el permiso según corresponda.
   - Haptics, Share, Network, App (botón atrás, deep links, arranque en frío) ya integrados: verifica el botón atrás de Android (no cierra el onboarding a mitad, sale en Hoy), barra de estado/navegación con colores pastel, teclado que no tape campos (adjustResize), orientación vertical.
C. Seguridad de datos de salud en el dispositivo (cierra BLOCKERS P5):
   - Cifra en reposo los datos de salud locales (perfil, tomas, dolor, densitometría, papelera) con WebCrypto AES-GCM; la clave en Android Keystore vía plugin seguro (p. ej. capacitor-secure-storage / biometric-bound si es viable) NUNCA en localStorage ni en el bundle. Migración desde el formato actual sin perder datos, con tests.
   - android:allowBackup="false" (o reglas de exclusión) para que los datos de salud no salgan en copias de seguridad; FLAG_SECURE opcional en pantallas clínicas; sin datos sensibles en logs, URLs ni portapapeles. Borrar cuenta/datos limpia también la clave.
   - Sin cleartext, sin localhost, sin debug en release (ya hay guardias; mantenlas). Ofuscación R8/ProGuard activa en release sin romper Capacitor.
D. Identidad nativa pastel:
   - Icono adaptativo (foreground/background/monochrome, 512 px para la ficha) y splash nativo (Android 12+ SplashScreen API) con Artiko y la paleta pastel crema/menta; actualiza scripts/generate-icons.mjs. Gráfico de funciones 1024×500.
   - Color de barra de estado/navegación acorde al tema claro/oscuro.
E. Requisitos de Google Play (verifica cada ⚠️ contra la documentación vigente):
   - targetSdk/compileSdk al nivel exigido hoy; 64 bits; AAB; versionCode que sube; Play App Signing; appId com.artikare.app.
   - Permisos mínimos (solo notificaciones; nada de PACKAGE_USAGE_STATS ni accesibilidad); manifest sin componentes exportados innecesarios; intent-filters de App Links verificados con assetlinks.
   - Inicio: Artiko guía el primer arranque; consentimiento ANTES de pedir datos de salud, revocable; modo invitado si se niega.
   - Eliminación de cuenta DENTRO de la app y URL web de borrado (exigido por Play); exportar datos (ARCO).
   - Política de privacidad abierta desde la app y en la ficha; declaración de apps de salud; Data safety coherente con lo que el código realmente envía (audita las llamadas de red y lista cada dato, finalidad, cifrado, si se comparte).
   - Textos de la ficha y de la app sin frases prohibidas ni afirmar que reemplaza al médico; bandera roja antes que cualquier producto; sin datos demo.
   - Rendimiento: arranque en frío < 2 s en gama media, sin ANR, tamaño del AAB razonable; prueba en dispositivo real con npm run mobile:install.
F. Calidad y pruebas:
   - TDD por bloque; tests unitarios del cifrado/migración, del modo offline y del cliente API con base URL; E2E Playwright del flujo offline completo (sin red: onboarding → tomar → chequeo → semáforo); verifica que el build web normal sigue pasando.
   - Candados al final: tsc · eslint · vitest · playwright · next build (web) · build móvil estático · npm audit --omit=dev · npm run mobile:verify · assembleRelease/bundleRelease firmado (si hay keystore).
   - Actualiza docs/PLAY-CHECKLIST.md con ✅/⚠️/❌ y evidencia, docs/MOBILE.md, docs/BLOCKERS.md y docs/ROADMAP.md.

REGLAS CLÍNICAS (prevalecen): prohibido cura/revierte/regenera/repara/elimina el dolor/garantiza; un suplemento nunca reemplaza al médico; bandera roja → CTA reumatológica primero; nunca mostrar un T-score no registrado; fechas en America/Lima.
PROCESO: primero un plan corto con los riesgos del paso A (export estático vs. API remota, auth móvil) y SIGUE sin preguntar salvo una decisión que cambie el producto; un bloque a la vez; commits atómicos en español; git push -u origin main-1hxlqb al final (4 reintentos si falla la red). No abras PR salvo que yo lo pida.
NO TE TOCA (solo lo reportas): cuenta de Play, formularios de la consola, dominio/API en producción, huella de Play, revisión legal/clínica, iOS. Nunca imprimas secretos.
Entrega: qué cambió, resultado de cada candado, riesgos que quedan y qué me falta hacer a mí.
```
