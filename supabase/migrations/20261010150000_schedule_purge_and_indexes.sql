-- Minimización de datos (Ley 29733): lo borrado en suave hace más de 30 días
-- se elimina de verdad cada día con public.purge_expired_soft_deletes()
-- (20260926100000, SECURITY DEFINER). Sin esta tarea, esas filas quedarían
-- fuera de la papelera y de la exportación ARCO.

-- Índices parciales: solo la minoría de filas borradas. (user_id, deleted_at)
-- sirve a la papelera (por paciente) y a la purga (rango de deleted_at).
create index if not exists dexa_scans_deleted_at_idx
  on public.dexa_scans (user_id, deleted_at) where deleted_at is not null;
create index if not exists pain_logs_deleted_at_idx
  on public.pain_logs (user_id, deleted_at) where deleted_at is not null;
create index if not exists dose_events_deleted_at_idx
  on public.dose_events (user_id, deleted_at) where deleted_at is not null;

-- Purga diaria a las 08:00 UTC = 03:00 en Lima (sin horario de verano).
-- pg_cron va en pg_catalog (patrón documentado por Supabase) y crea su propio
-- esquema `cron`. El job lo programa el rol de la migración (postgres) y corre
-- con ese rol; el grant a service_role es para invocarla a mano.
-- Condicional: sin pg_cron la migración no falla y la purga queda pendiente
-- de programar en el panel (docs/RELEASE.md). cron.schedule con el mismo
-- nombre reemplaza el job (pg_cron >= 1.4): reaplicar es idempotente.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
  end if;
  if exists (select 1 from pg_extension where extname = 'pg_cron')
     and exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.schedule(
      'daily-soft-delete-purge',
      '0 8 * * *',
      'select public.purge_expired_soft_deletes()'
    );
  end if;
end;
$$;
