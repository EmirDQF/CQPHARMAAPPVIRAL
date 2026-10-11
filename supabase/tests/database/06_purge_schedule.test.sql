-- Purga diaria de lo borrado en suave (Ley 29733) e índices parciales.
begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

-- ─── Índices parciales ──────────────────────────────────────────────────────
select is(
  (select count(*)::int from pg_indexes
   where schemaname = 'public'
     and indexname in ('dexa_scans_deleted_at_idx', 'pain_logs_deleted_at_idx', 'dose_events_deleted_at_idx')
     and indexdef like '%WHERE (deleted_at IS NOT NULL)%'),
  3,
  'dexa_scans, pain_logs y dose_events tienen índice parcial sobre deleted_at'
);

-- ─── Programación con pg_cron (disponible en el Supabase local) ─────────────
select ok(
  exists (select 1 from pg_extension where extname = 'pg_cron'),
  'pg_cron está instalado'
);
select is(
  (select schedule from cron.job where jobname = 'daily-soft-delete-purge'),
  '0 8 * * *',
  'la purga corre a diario a las 08:00 UTC (03:00 en Lima)'
);
select is(
  (select command from cron.job where jobname = 'daily-soft-delete-purge'),
  'select public.purge_expired_soft_deletes()',
  'el job ejecuta la purga existente'
);
select is(
  (select count(*)::int from cron.job where jobname = 'daily-soft-delete-purge'),
  1,
  'hay un solo job de purga'
);

-- ─── Alcance de la purga: 31 días sí, 5 días no, filas vivas no ─────────────
insert into auth.users (id, email, aud, role)
values
  ('77777777-7777-4777-8777-777777777777', 'purga-a@test.local', 'authenticated', 'authenticated'),
  ('88888888-8888-4888-8888-888888888888', 'purga-b@test.local', 'authenticated', 'authenticated');

insert into public.pain_logs (id, user_id, log_date, pain_level, stiffness, deleted_at)
values
  ('bbbbbbbb-0000-4000-8000-000000000031', '77777777-7777-4777-8777-777777777777', '2026-01-01', 4, '0-15', now() - interval '31 days'),
  ('bbbbbbbb-0000-4000-8000-000000000005', '77777777-7777-4777-8777-777777777777', '2026-01-02', 5, '0-15', now() - interval '5 days'),
  ('bbbbbbbb-0000-4000-8000-000000000000', '77777777-7777-4777-8777-777777777777', '2026-01-03', 6, '0-15', null),
  ('bbbbbbbb-0000-4000-8000-000000000b31', '88888888-8888-4888-8888-888888888888', '2026-01-01', 3, '0-15', now() - interval '31 days');

-- ">= 2": la base local puede tener restos vencidos de otras suites; el alcance exacto lo fijan las dos pruebas siguientes.
select ok(public.purge_expired_soft_deletes() >= 2, 'la purga elimina lo borrado hace más de 30 días, de cualquier paciente');
select is(
  (select array_agg(id::text order by id) from public.pain_logs
   where user_id in ('77777777-7777-4777-8777-777777777777', '88888888-8888-4888-8888-888888888888')),
  array['bbbbbbbb-0000-4000-8000-000000000000', 'bbbbbbbb-0000-4000-8000-000000000005'],
  'quedan la fila viva y la borrada hace 5 días (aún restaurable)'
);
select is(
  (select count(*)::int from public.audit_log
   where event_type = 'purge'
     and record_id in ('bbbbbbbb-0000-4000-8000-000000000031', 'bbbbbbbb-0000-4000-8000-000000000b31')),
  2,
  'cada fila purgada queda auditada, sin valores clínicos'
);

set local role authenticated;
set local request.jwt.claims to '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}';
select throws_ok($$select public.purge_expired_soft_deletes()$$, '42501', null, 'un paciente no puede disparar la purga');
reset role;

select * from finish();
rollback;
