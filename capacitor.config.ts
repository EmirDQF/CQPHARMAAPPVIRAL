import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Modo remoto: la app usa rutas API y sesión en servidor (Supabase, ARCO,
 * citas), así que no admite `output: "export"`. El WebView carga el sitio
 * desplegado (CAP_SERVER_URL) y `capacitor-shell/` solo es el respaldo sin
 * conexión. Solo HTTPS: nada de cleartext.
 * Pendiente del usuario: confirmar el appId definitivo antes de publicar.
 */
const serverUrl = process.env.CAP_SERVER_URL ?? "https://artikare.com";

const config: CapacitorConfig = {
  appId: "com.artikare.app",
  appName: "Artikare",
  webDir: "capacitor-shell",
  server: {
    url: serverUrl,
    cleartext: false,
    errorPath: "index.html",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      iconColor: "#0f766e",
    },
  },
};

export default config;
