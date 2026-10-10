-- Revierte 20261010120000_consent_purpose_account_backup.sql.
-- Postgres no elimina valores de un enum: se recrea el tipo sin 'respaldo-cuenta'.
-- Se niega a correr si ya hay consentimientos con esa finalidad: borrarlos
-- destruiría la prueba legal de que el paciente autorizó el respaldo.

do $$
begin
  if exists (select 1 from public.consents where purpose::text = 'respaldo-cuenta')
     or exists (select 1 from public.consent_proofs where purpose::text = 'respaldo-cuenta') then
    raise exception 'Hay consentimientos respaldo-cuenta: exportarlos y decidir antes de revertir';
  end if;
end;
$$;

alter type public.consent_purpose rename to consent_purpose_with_backup;
create type public.consent_purpose as enum ('perfil-clinico', 'cita', 'contacto-test');

alter table public.consents
  alter column purpose type public.consent_purpose using purpose::text::public.consent_purpose;
alter table public.consent_proofs
  alter column purpose type public.consent_purpose using purpose::text::public.consent_purpose;

drop type public.consent_purpose_with_backup;
