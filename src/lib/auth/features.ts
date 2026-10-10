/**
 * Interruptor del respaldo de Mi Panel en la cuenta (C3). Encendido en C5,
 * con la política que declara la transferencia internacional (Brasil,
 * sa-east-1), los derechos ARCO en Ajustes y las pruebas de cero pérdida
 * (src/lib/sync/zeroLoss.test.ts) en verde. Aun encendido, nada sube sin
 * Supabase configurado, sin cuenta y sin el consentimiento `respaldo-cuenta`.
 * Antes de producción: checklist 8b de docs/plans/fase-1-supabase.md y la
 * revisión legal de /privacidad (docs/ROADMAP.md).
 */
export function isAccountSyncAvailable(): boolean {
  return true;
}
