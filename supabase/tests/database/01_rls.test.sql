-- Aislamiento entre pacientes (RLS): A no ve, edita ni borra lo de B; anon no toca nada.
begin;
create extension if not exists pgtap with schema extensions;

select plan(58);

-- ─── Datos de prueba (como postgres, sin RLS) ───────────────────────────────
insert into auth.users (id, email, aud, role)
values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local', 'authenticated', 'authenticated'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local', 'authenticated', 'authenticated');

insert into public.profiles (id, name, age, sex)
values ('22222222-2222-4222-8222-222222222222', 'B', 60, 'femenino');
insert into public.consents (user_id, purpose, policy_version, granted_at)
values ('22222222-2222-4222-8222-222222222222', 'perfil-clinico', 'v-test', now());
insert into public.assessments (user_id, chronological_age, articular_age, risk_level, answers)
values ('22222222-2222-4222-8222-222222222222', 60, 68, 'moderado', '{}');
insert into public.dexa_scans (user_id, scan_date, lumbar_t, femoral_t)
values ('22222222-2222-4222-8222-222222222222', '2026-01-10', -2.6, -1.9);
insert into public.pain_logs (user_id, log_date, pain_level, stiffness)
values ('22222222-2222-4222-8222-222222222222', '2026-01-10', 5, '15-30');
insert into public.dose_events (user_id, dose_id, product_id, taken_on)
values ('22222222-2222-4222-8222-222222222222', 'morning-collagen', 'colageno-vitamina-c', '2026-01-10');
insert into public.bottles (user_id, product_id, started_on)
values ('22222222-2222-4222-8222-222222222222', 'colageno-vitamina-c', '2026-01-10');
insert into public.appointments (
  user_id, code, service_id, appointment_date, slot,
  patient_name, patient_age, patient_phone, booked_by, consent_version, consent_at
)
values (
  '22222222-2222-4222-8222-222222222222', 'ART-BBBBBB', 'densitometria', '2026-12-01', 'manana',
  'Paciente B', 60, '987654321', 'propia', 'v-test', now()
);

-- ─── Estructura: RLS forzada y anon sin privilegios ─────────────────────────
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and c.relname in ('profiles','consents','assessments','dexa_scans','pain_logs',
                       'products','dose_events','bottles','appointments','audit_log','consent_proofs')
     and c.relrowsecurity and c.relforcerowsecurity),
  11,
  'las 11 tablas tienen RLS habilitada y forzada'
);
select is(
  (select count(*)::int from information_schema.role_table_grants
   where grantee = 'anon' and table_schema = 'public'),
  0,
  'anon no tiene ningún privilegio sobre tablas de public'
);
select is(
  (select count(*)::int from pg_policies where schemaname = 'public' and 'public' = any(roles)),
  0,
  'ninguna política aplica al rol public'
);

-- ─── anon (sin sesión) no lee nada ──────────────────────────────────────────
set local role anon;
set local request.jwt.claims to '{"role":"anon"}';
select throws_ok('select * from public.profiles', '42501', null, 'anon no lee profiles');
select throws_ok('select * from public.consents', '42501', null, 'anon no lee consents');
select throws_ok('select * from public.assessments', '42501', null, 'anon no lee assessments');
select throws_ok('select * from public.dexa_scans', '42501', null, 'anon no lee dexa_scans');
select throws_ok('select * from public.pain_logs', '42501', null, 'anon no lee pain_logs');
select throws_ok('select * from public.products', '42501', null, 'anon no lee products');
select throws_ok('select * from public.dose_events', '42501', null, 'anon no lee dose_events');
select throws_ok('select * from public.bottles', '42501', null, 'anon no lee bottles');
select throws_ok('select * from public.appointments', '42501', null, 'anon no lee appointments');

-- ─── Paciente A ─────────────────────────────────────────────────────────────
reset role;
set local role authenticated;
set local request.jwt.claims to
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

-- A no ve nada de B
select is_empty('select 1 from public.profiles', 'A no ve el perfil de B');
select is_empty('select 1 from public.consents', 'A no ve consentimientos de B');
select is_empty('select 1 from public.assessments', 'A no ve evaluaciones de B');
select is_empty('select 1 from public.dexa_scans', 'A no ve densitometrías de B');
select is_empty('select 1 from public.pain_logs', 'A no ve el diario de dolor de B');
select is_empty('select 1 from public.dose_events', 'A no ve las tomas de B');
select is_empty('select 1 from public.bottles', 'A no ve los frascos de B');
select is_empty('select 1 from public.appointments', 'A no ve las citas de B');

-- El catálogo sí es visible para cualquier sesión (incluida la anónima)
select is((select count(*)::int from public.products), 2, 'A lee el catálogo sembrado');

-- A no puede escribir filas a nombre de B
select throws_ok(
  $$insert into public.profiles (id, name) values ('22222222-2222-4222-8222-222222222222', 'X')$$,
  '42501', null, 'A no crea un perfil con el id de B'
);
select throws_ok(
  $$insert into public.dexa_scans (user_id, scan_date, lumbar_t, femoral_t)
    values ('22222222-2222-4222-8222-222222222222', '2026-02-01', -1, -1)$$,
  '42501', null, 'A no inserta densitometrías a nombre de B'
);
select throws_ok(
  $$insert into public.pain_logs (user_id, log_date, pain_level, stiffness)
    values ('22222222-2222-4222-8222-222222222222', '2026-02-01', 3, '0-15')$$,
  '42501', null, 'A no inserta dolor a nombre de B'
);
select throws_ok(
  $$insert into public.dose_events (user_id, dose_id, product_id, taken_on)
    values ('22222222-2222-4222-8222-222222222222', 'night-magnesium', 'citrato-magnesio-d3', '2026-02-01')$$,
  '42501', null, 'A no inserta tomas a nombre de B'
);
select throws_ok(
  $$insert into public.bottles (user_id, product_id, started_on)
    values ('22222222-2222-4222-8222-222222222222', 'citrato-magnesio-d3', '2026-02-01')$$,
  '42501', null, 'A no inserta frascos a nombre de B'
);
select throws_ok(
  $$insert into public.consents (user_id, purpose, policy_version, granted_at)
    values ('22222222-2222-4222-8222-222222222222', 'cita', 'v', now())$$,
  '42501', null, 'A no inserta consentimientos a nombre de B'
);
select throws_ok(
  $$insert into public.assessments (user_id, chronological_age, articular_age, risk_level, answers)
    values ('22222222-2222-4222-8222-222222222222', 40, 45, 'bajo', '{}')$$,
  '42501', null, 'A no inserta evaluaciones a nombre de B'
);

-- Intentos de editar o borrar lo de B no afectan ninguna fila
select lives_ok($$update public.profiles set name = 'hackeado'$$, 'update de perfiles ajenos no falla');
select lives_ok($$update public.dexa_scans set lumbar_t = 0$$, 'update de densitometrías ajenas no falla');
select lives_ok($$update public.pain_logs set pain_level = 0$$, 'update de dolor ajeno no falla');
select throws_ok($$delete from public.dexa_scans$$, '42501', null, 'sin DELETE directo de densitometrías');
select throws_ok($$delete from public.pain_logs$$, '42501', null, 'sin DELETE directo de dolor');
select throws_ok($$delete from public.dose_events$$, '42501', null, 'sin DELETE directo de tomas');
select lives_ok($$delete from public.bottles$$, 'delete de frascos ajenos no falla');
select lives_ok($$update public.appointments set status = 'cancelada'$$, 'cancelar citas ajenas no falla');

-- Lo propio sí funciona
select lives_ok(
  $$insert into public.profiles (name, age, sex) values ('A', 55, 'masculino')$$,
  'A crea su perfil (id = auth.uid() por defecto)'
);
select lives_ok(
  $$insert into public.dexa_scans (scan_date, lumbar_t, femoral_t) values ('2026-02-01', -1.2, -0.8)$$,
  'A registra su densitometría'
);
select is(
  (select user_id from public.dexa_scans),
  '11111111-1111-4111-8111-111111111111'::uuid,
  'user_id se completa con auth.uid()'
);

-- Tablas de solo inserción y catálogo de solo lectura
select lives_ok(
  $$insert into public.consents (purpose, policy_version, granted_at) values ('perfil-clinico', 'v', now())$$,
  'A registra su consentimiento'
);
select throws_ok($$update public.consents set policy_version = 'x'$$, '42501', null, 'consents no admite UPDATE');
select throws_ok($$delete from public.consents$$, '42501', null, 'consents no admite DELETE');
select throws_ok($$update public.assessments set risk_level = 'bajo'$$, '42501', null, 'assessments no admite UPDATE');
select throws_ok($$delete from public.profiles$$, '42501', null, 'profiles no admite DELETE (ARCO va por el servidor)');
select throws_ok(
  $$insert into public.products (id, name, composition, doses_per_bottle) values ('x', 'X', '{x}', 1)$$,
  '42501', null, 'el paciente no escribe en el catálogo'
);

-- Citas: solo por la RPC; el paciente solo puede cancelar
select throws_ok(
  $$insert into public.appointments (code, service_id, appointment_date, slot, patient_name,
      patient_age, patient_phone, booked_by, consent_version, consent_at)
    values ('ART-AAAAAA', 'densitometria', '2026-12-01', 'tarde', 'A', 55, '987654321', 'propia', 'v', now())$$,
  '42501', null, 'el paciente no inserta citas directamente'
);

reset role;
insert into public.appointments (
  user_id, code, service_id, appointment_date, slot,
  patient_name, patient_age, patient_phone, booked_by, consent_version, consent_at
)
values (
  '11111111-1111-4111-8111-111111111111', 'ART-AAAAAA', 'densitometria', '2026-12-01', 'tarde',
  'Paciente A', 55, '987654321', 'propia', 'v-test', now()
);
set local role authenticated;
set local request.jwt.claims to
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select throws_ok(
  $$update public.appointments set status = 'confirmada'$$,
  '42501', null, 'el paciente no confirma su propia cita'
);
select throws_ok(
  $$update public.appointments set code = 'ART-CCCCCC'$$,
  '42501', null, 'el paciente no cambia el código de su cita'
);
select lives_ok($$update public.appointments set status = 'cancelada'$$, 'el paciente cancela su cita');
select is((select status::text from public.appointments), 'cancelada', 'la cita propia quedó cancelada');

-- Una cita ya atendida no se puede cancelar
reset role;
insert into public.appointments (
  user_id, code, service_id, appointment_date, slot, status,
  patient_name, patient_age, patient_phone, booked_by, consent_version, consent_at
)
values (
  '11111111-1111-4111-8111-111111111111', 'ART-DDDDDD', 'densitometria', '2026-01-05', 'manana', 'atendida',
  'Paciente A', 55, '987654321', 'propia', 'v-test', now()
);
set local role authenticated;
set local request.jwt.claims to
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select lives_ok(
  $$update public.appointments set status = 'cancelada' where code = 'ART-DDDDDD'$$,
  'cancelar una cita atendida no falla, pero no la toca'
);

-- ─── Verificación final como postgres: lo de B sigue intacto ────────────────
reset role;
select is((select status::text from public.appointments where code = 'ART-DDDDDD'), 'atendida', 'la cita atendida sigue atendida');
select is((select name from public.profiles where id = '22222222-2222-4222-8222-222222222222'), 'B', 'perfil de B intacto');
select is((select lumbar_t from public.dexa_scans where user_id = '22222222-2222-4222-8222-222222222222'), -2.6::numeric, 'densitometría de B intacta');
select is((select pain_level from public.pain_logs where user_id = '22222222-2222-4222-8222-222222222222'), 5, 'dolor de B intacto');
select is((select count(*)::int from public.dose_events where user_id = '22222222-2222-4222-8222-222222222222'), 1, 'tomas de B intactas');
select is((select count(*)::int from public.bottles where user_id = '22222222-2222-4222-8222-222222222222'), 1, 'frascos de B intactos');
select is((select status::text from public.appointments where code = 'ART-BBBBBB'), 'solicitada', 'cita de B sin cancelar');

select * from finish();
rollback;
