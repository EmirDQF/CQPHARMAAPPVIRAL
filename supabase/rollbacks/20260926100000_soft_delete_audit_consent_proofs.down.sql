-- Revierte 20260926100000_soft_delete_audit_consent_proofs.sql.
-- ATENCIÓN en producción:
-- - Exportar antes consent_proofs y el salt (private.server_secrets): sin el salt
--   las pruebas existentes ya no se pueden verificar.
-- - Los registros borrados suave vuelven a verse al quitar deleted_at; si deben
--   seguir ocultos, purgarlos antes con public.purge_expired_soft_deletes().

drop trigger if exists consents_preserve_proof on public.consents;
drop table if exists public.consent_proofs;

drop function if exists public.purge_expired_soft_deletes();
drop function if exists public.list_deleted_records();
drop function if exists public.restore_record(text, uuid);
drop function if exists public.soft_delete_record(text, uuid);

drop trigger if exists dexa_scans_purge_soft_deleted_duplicate on public.dexa_scans;
drop trigger if exists pain_logs_purge_soft_deleted_duplicate on public.pain_logs;
drop trigger if exists dose_events_purge_soft_deleted_duplicate on public.dose_events;
drop trigger if exists dexa_scans_audit_soft_delete on public.dexa_scans;
drop trigger if exists pain_logs_audit_soft_delete on public.pain_logs;
drop trigger if exists dose_events_audit_soft_delete on public.dose_events;
drop table if exists public.audit_log;

-- Políticas y permisos de C1.
alter policy dexa_scans_select_own on public.dexa_scans using ((select auth.uid()) = user_id);
alter policy dexa_scans_insert_own on public.dexa_scans with check ((select auth.uid()) = user_id);
alter policy dexa_scans_update_own on public.dexa_scans
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy pain_logs_select_own on public.pain_logs using ((select auth.uid()) = user_id);
alter policy pain_logs_insert_own on public.pain_logs with check ((select auth.uid()) = user_id);
alter policy pain_logs_update_own on public.pain_logs
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy dose_events_select_own on public.dose_events using ((select auth.uid()) = user_id);
alter policy dose_events_insert_own on public.dose_events with check ((select auth.uid()) = user_id);
alter policy dose_events_update_own on public.dose_events
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant delete on table public.dexa_scans, public.pain_logs, public.dose_events to authenticated;
create policy dexa_scans_delete_own on public.dexa_scans
  for delete to authenticated using ((select auth.uid()) = user_id);
create policy pain_logs_delete_own on public.pain_logs
  for delete to authenticated using ((select auth.uid()) = user_id);
create policy dose_events_delete_own on public.dose_events
  for delete to authenticated using ((select auth.uid()) = user_id);

alter table public.dexa_scans drop column if exists deleted_at;
alter table public.pain_logs drop column if exists deleted_at;
alter table public.dose_events drop column if exists deleted_at;

drop schema if exists private cascade;
