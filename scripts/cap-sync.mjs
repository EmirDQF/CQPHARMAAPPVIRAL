// npm run cap:sync — shell offline + cap sync con el CAP_ENV de la terminal
// (sin definir = release, que exige CAP_SERVER_URL https).
import { fail, syncCapacitor } from "./lib/mobile.mjs";

try {
  syncCapacitor(process.env);
} catch (error) {
  fail(error);
}
