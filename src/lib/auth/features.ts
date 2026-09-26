/**
 * ¿Los registros locales ya se respaldan en la cuenta? Hasta el sub-hito C3
 * (repositorios + migración de artikare_*_v1) la respuesta es no: la invitación
 * a crear cuenta promete "No pierdas tus registros si cambias de celular" y no
 * puede mostrarse antes de que esa promesa sea verdad.
 */
export function isAccountSyncAvailable(): boolean {
  return false;
}
