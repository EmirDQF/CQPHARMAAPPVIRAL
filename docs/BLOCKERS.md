# BLOQUEOS — requieren al usuario

| # | Ítem | Qué pasó | Qué se probó | Decisión / acción del usuario |
|---|---|---|---|---|
| B1 | iOS (`npx cap add ios`) | Este equipo es Windows (MINGW64); Xcode y CocoaPods solo existen en macOS. | Nada: no hay forma soportada de generar ni compilar el proyecto iOS en Windows. | En una Mac: `npm ci && npx cap add ios && npx cap sync ios`, abrir en Xcode, firmar con la cuenta de Apple Developer. |
| B2 | `appId` definitivo | Se usó `com.artikare.app` en `capacitor.config.ts`. Cambiarlo después de publicar en Play es imposible. | — | Confirmar el identificador (p. ej. dominio propio invertido) antes de la primera subida a Google Play. |
| B3 | Dominio de producción | El WebView carga `CAP_SERVER_URL` (por defecto `https://artikare.com`). | — | Desplegar la web y fijar `CAP_SERVER_URL` antes de `npx cap sync`. |
