-- Borrado suave (30 días para deshacer), auditoría sin valores clínicos y
-- borrado de cuenta (Ley 29733) como HARD DELETE que el borrado suave no impide.
begin;
create extension if not exists pgtap with schema extensions;

select plan(33);

insert into auth.users (id, email, aud, role)
values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local', 'authenticated', 'authenticated'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local', 'authenticated', 'authenticated');

insert into public.dexa_scans (id, user_id, scan_date, lumbar_t, femoral_t)
values ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '2026-01-10', -2.6, -1.9);
insert into public.pain_logs (id, user_id, log_date, pain_level, stiffness)
values
  ('aaaaaaaa-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '2026-01-10', 9, '30+'),
  ('aaaaaaaa-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', '2026-01-11', 4, '0-15');
insert into public.dose_events (id, user_id, dose_id, product_id, taken_on)
values ('aaaaaaaa-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'morning-collagen', 'colageno-vitamina-c', '2026-01-10');

-- ─── Estructura ─────────────────────────────────────────────────────────────
select has_column('public', 'dexa_scans', 'deleted_at', 'dexa_scans tiene deleted_at');
select has_column('public', 'pain_logs', 'deleted_at', 'pain_logs tiene deleted_at');
select has_column('public', 'dose_events', 'deleted_at', 'dose_events tiene deleted_at');
select columns_are(
  'public', 'audit_log',
  array['id', 'event_type', 'table_name', 'record_id', 'occurred_at'],
  'audit_log guarda solo tipo de evento, tabla, id y fecha (ningún valor clínico ni user_id)'
);

-- ─── Paciente A ─────────────────────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select throws_ok($$delete from public.dexa_scans$$, '42501', null, 'el paciente no hace DELETE directo de densitometrías');
select throws_ok($$delete from public.pain_logs$$, '42501', null, 'el paciente no hace DELETE directo de dolor');
select throws_ok($$delete from public.dose_events$$, '42501', null, 'el paciente no hace DELETE directo de tomas');
select throws_ok(
  $$update public.dexa_scans set deleted_at = now()$$,
  '42501', null, 'deleted_at no se escribe por UPDATE directo (solo por la RPC)'
);
select throws_ok($$select * from public.audit_log$$, '42501', null, 'el paciente no lee audit_log');

select lives_ok(
  $$select public.soft_delete_record('dexa_scans', 'aaaaaaaa-0000-4000-8000-000000000001')$$,
  'A borra (suave) su densitometría'
);
select is_empty('select 1 from public.dexa_scans', 'la densitometría borrada ya no se ve');
select is(
  (select count(*)::int from public.list_deleted_records()),
  1,
  'A ve su densitometría en la papelera'
);
select throws_ok(
  $$select public.soft_delete_record('dexa_scans', 'aaaaaaaa-0000-4000-8000-000000000001')$$,
  'P0002', null, 'no se borra dos veces'
);
select throws_ok(
  $$select public.soft_delete_record('profiles', 'aaaaaaaa-0000-4000-8000-000000000001')$$,
  '22023', null, 'solo tablas clínicas admiten borrado suave'
);

select lives_ok(
  $$select public.restore_record('dexa_scans', 'aaaaaaaa-0000-4000-8000-000000000001')$$,
  'A deshace el borrado'
);
select is((select count(*)::int from public.dexa_scans), 1, 'la densitometría vuelve a verse');

-- Un registro nuevo en la misma fecha reemplaza al borrado (no choca con UNIQUE)
select lives_ok(
  $$select public.soft_delete_record('pain_logs', 'aaaaaaaa-0000-4000-8000-000000000003')$$,
  'A borra el dolor del día 11'
);
select lives_ok(
  $$insert into public.pain_logs (log_date, pain_level, stiffness) values ('2026-01-11', 2, '0-15')
    on conflict (user_id, log_date) do update set pain_level = excluded.pain_level$$,
  'A vuelve a registrar el día 11 (upsert)'
);
select is(
  (select pain_level from public.pain_logs where log_date = '2026-01-11'),
  2,
  'el nuevo registro del día 11 queda visible'
);

-- ─── Paciente B no toca lo de A ─────────────────────────────────────────────
set local request.jwt.claims to '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select throws_ok(
  $$select public.soft_delete_record('pain_logs', 'aaaaaaaa-0000-4000-8000-000000000002')$$,
  'P0002', null, 'B no borra el dolor de A'
);
select throws_ok(
  $$select public.restore_record('dexa_scans', 'aaaaaaaa-0000-4000-8000-000000000001')$$,
  'P0002', null, 'B no restaura registros de A'
);
select is((select count(*)::int from public.list_deleted_records()), 0, 'B no ve la papelera de A');

-- ─── anon no ejecuta las RPC ────────────────────────────────────────────────
reset role;
set local role anon;
select throws_ok(
  $$select public.soft_delete_record('pain_logs', 'aaaaaaaa-0000-4000-8000-000000000002')$$,
  '42501', null, 'anon no ejecuta soft_delete_record'
);
select throws_ok($$select * from public.list_deleted_records()$$, '42501', null, 'anon no ejecuta list_deleted_records');

-- ─── Ventana de 30 días ─────────────────────────────────────────────────────
reset role;
update public.pain_logs set deleted_at = now() - interval '31 days'
where id = 'aaaaaaaa-0000-4000-8000-000000000002';
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select throws_ok(
  $$select public.restore_record('pain_logs', 'aaaaaaaa-0000-4000-8000-000000000002')$$,
  'P0002', null, 'pasados 30 días ya no se puede deshacer'
);
select throws_ok($$select public.purge_expired_soft_deletes()$$, '42501', null, 'el paciente no ejecuta la purga');

reset role;
select is(public.purge_expired_soft_deletes(), 1, 'la purga elimina lo borrado hace más de 30 días');

-- ─── Auditoría: solo eventos, nunca valores ─────────────────────────────────
select is(
  (select array_agg(event_type order by id) from public.audit_log
   where record_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  array['soft_delete', 'restore'],
  'audit_log registra borrado y restauración de la densitometría'
);
select is(
  (select count(*)::int from public.audit_log
   where record_id = 'aaaaaaaa-0000-4000-8000-000000000003' and event_type = 'purge'),
  1,
  'el reemplazo del día 11 queda auditado como purge'
);
select is(
  (select count(*)::int from public.audit_log
   where record_id = 'aaaaaaaa-0000-4000-8000-000000000002' and event_type = 'purge'),
  1,
  'la purga por vencimiento queda auditada'
);

-- ─── Borrado de cuenta = HARD DELETE, aunque haya registros borrados suave ──
update public.dose_events set deleted_at = now() where id = 'aaaaaaaa-0000-4000-8000-000000000004';
select ok(
  (select deleted_at is not null from public.dose_events where id = 'aaaaaaaa-0000-4000-8000-000000000004'),
  'hay una toma borrada suave antes de borrar la cuenta'
);
delete from auth.users where id = '11111111-1111-4111-8111-111111111111';
select is(
  (select count(*)::int from public.dexa_scans where user_id = '11111111-1111-4111-8111-111111111111')
    + (select count(*)::int from public.pain_logs where user_id = '11111111-1111-4111-8111-111111111111')
    + (select count(*)::int from public.dose_events where user_id = '11111111-1111-4111-8111-111111111111'),
  0,
  'el borrado de cuenta elimina todo, incluidos los registros borrados suave'
);
select is(
  (select count(*)::int from public.audit_log where record_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  2,
  'la auditoría sobrevive sin datos clínicos ni user_id'
);

select * from finish();
rollback;
