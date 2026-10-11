// Pantalla de respaldo del WebView nativo (server.errorPath de Capacitor 8):
// se muestra cuando no hay red o el servidor no responde. Es HTML estático sin
// acceso a plugins ni datos de salud. "Reintentar" y el evento `online` vuelven
// a la app remota (shell-config.js, generado desde CAP_ENV + CAP_SERVER_URL);
// sin una URL válida solo recarga. http solo a loopback (desarrollo por USB con
// adb reverse); el release nunca genera http y su manifest no admite cleartext. Se evalúa también en src/lib/native/offlineShell.test.ts.
(function (module) {
  "use strict";

  var OFFLINE_MESSAGE =
    "Parece que estás sin conexión a internet. Si activaste los recordatorios, seguirán llegando a este celular.";
  var SERVER_MESSAGE = "Artikare no responde en este momento. Suele ser algo temporal; inténtalo en unos minutos.";

  var DEV_CLEARTEXT_HOSTS = ["localhost", "127.0.0.1", "10.0.2.2"];

  function isAllowedProtocol(url) {
    if (url.protocol === "https:") return true;
    return url.protocol === "http:" && DEV_CLEARTEXT_HOSTS.indexOf(url.hostname) !== -1;
  }

  function resolveAppUrl(config) {
    if (!config || typeof config.appUrl !== "string") return null;
    try {
      var url = new URL(config.appUrl);
      if (!isAllowedProtocol(url) || url.username || url.password) return null;
      return url.href;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `catch {}` exige WebView 66+; Capacitor admite 60+.
    } catch (error) {
      return null;
    }
  }

  function describeFailure(isOnline) {
    return isOnline ? SERVER_MESSAGE : OFFLINE_MESSAGE;
  }

  function start(win, doc) {
    var appUrl = resolveAppUrl(win.ARTIKARE_SHELL_CONFIG);
    var status = doc.getElementById("estado");
    var retryButton = doc.getElementById("reintentar");
    var isRetrying = false;

    if (status) status.textContent = describeFailure(win.navigator.onLine);

    function retry() {
      if (isRetrying) return;
      isRetrying = true;
      if (appUrl) win.location.replace(appUrl);
      else win.location.reload();
    }

    if (retryButton) retryButton.addEventListener("click", retry);
    win.addEventListener("online", retry);
  }

  var api = { resolveAppUrl: resolveAppUrl, describeFailure: describeFailure, start: start };
  if (module) {
    module.exports = api;
  } else {
    start(window, document);
  }
})(typeof module === "undefined" ? null : module);
