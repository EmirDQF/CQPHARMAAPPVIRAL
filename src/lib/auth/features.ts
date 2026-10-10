/**
 * Interruptor del respaldo de Mi Panel en la cuenta. C3 ya lo implementa
 * (repositorios, /api/sync, consentimiento `respaldo-cuenta`), pero sigue
 * apagado: la política vigente dice que Mi Panel solo se guarda en el
 * celular. Se enciende recién con C5 (texto de transferencia internacional
 * y revisión legal) y el checklist 8b de docs/plans/fase-1-supabase.md.
 * Apagado, no se muestra la invitación ni la oferta y no se sube nada.
 */
export function isAccountSyncAvailable(): boolean {
  return false;
}
