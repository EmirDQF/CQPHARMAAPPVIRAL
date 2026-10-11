-- Revierte 20261010150000_schedule_purge_and_indexes.sql. La extensión pg_cron
-- se conserva: otros jobs del proyecto podrían usarla. Los índices van primero
-- para que se reviertan aunque pg_cron esté en un estado inesperado.
drop index if exists public.dose_events_deleted_at_idx;
drop index if exists public.pain_logs_deleted_at_idx;
drop index if exists public.dexa_scans_deleted_at_idx;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron')
     and exists (select 1 from pg_namespace where nspname = 'cron') then
    if exists (select 1 from cron.job where jobname = 'daily-soft-delete-purge') then
      perform cron.unschedule('daily-soft-delete-purge');
    end if;
  end if;
end;
$$;
