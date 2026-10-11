import type { CapacitorConfig } from "@capacitor/cli";
import { resolveCapacitorServer } from "./src/lib/env/capacitorEnv.ts";

/**
 * Modo remoto: la app usa rutas API y sesión en servidor (Supabase, ARCO,
 * citas), así que no admite `output: "export"`. El WebView carga el servidor
 * que fija CAP_ENV (ver src/lib/env/capacitorEnv.ts) y `capacitor-shell/` solo
 * es el respaldo sin conexión. Release: solo HTTPS y sin fallback; si falta
 * CAP_SERVER_URL, `cap sync` falla. En Capacitor 8 `server.cleartext` solo
 * añade usesCleartextTraffic al manifest generado de plugins; el control real
 * es el network_security_config de la variante debug.
 * Pendiente del usuario: confirmar el appId definitivo antes de publicar.
 */
const server = resolveCapacitorServer(process.env);

const config: CapacitorConfig = {
  appId: "com.artikare.app",
  appName: "Artikare",
  webDir: "capacitor-shell",
  server: {
    url: server.url,
    cleartext: server.cleartext,
    errorPath: "index.html",
  },
  android: {
    allowMixedContent: server.allowMixedContent,
  },
  plugins: {
    LocalNotifications: {
      iconColor: "#0f766e",
    },
  },
};

export default config;
