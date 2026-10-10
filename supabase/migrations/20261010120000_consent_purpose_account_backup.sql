-- C3: finalidad de consentimiento para respaldar los registros de Mi Panel en la cuenta.
-- La política vigente dice que el panel solo se guarda en el celular: sin una fila
-- 'respaldo-cuenta' sin revocar, /api/sync no escribe nada (Ley 29733).
alter type public.consent_purpose add value if not exists 'respaldo-cuenta';
