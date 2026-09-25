-- Restricciones clínicas: rangos de constants.ts, fechas no futuras (día de Lima),
-- unicidad por día, catálogo regulado, borrado en cascada y updated_at.
begin;
create extension if not exists pgtap with schema extensions;

select plan(34);

insert into auth.users (id, email, aud, role)
values ('11111111-1111-4111-8111-111111111111', 'a@test.local', 'authenticated', 'authenticated');

create temp table lima as select (now() at time zone 'America/Lima')::date as today;
grant select on lima to authenticated;

set local role authenticated;
set local request.jwt.claims to
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

-- ─── dexa_scans ─────────────────────────────────────────────────────────────
select throws_ok(
  $$insert into public.dexa_scans (scan_date, lumbar_t, femoral_t) values ('2026-01-01', -6.1, -1)$$,
  '23514', null, 'T-score lumbar -6.1 rechazado'
);
select throws_ok(
  $$insert into public.dexa_scans (scan_date, lumbar_t, femoral_t) values ('2026-01-01', -1, 4.1)$$,
  '23514', null, 'T-score femoral 4.1 rechazado'
);
select throws_ok(
  $$insert into public.dexa_scans (scan_date, lumbar_t, femoral_t)
    select today + 1, -1, -1 from lima$$,
  '23514', null, 'densitometría con fecha futura (día de Lima) rechazada'
);
select throws_ok(
  $$insert into public.dexa_scans (scan_date, lumbar_t, femoral_t) values ('2026-01-02', -1.004, -1)$$,
  '23514', null, '-1.004 se rechaza (no se redondea a -1.00 = Normal)'
);
select throws_ok(
  $$insert into public.dexa_scans (scan_date, lumbar_t, femoral_t) values ('2026-01-02', -1, -2.495)$$,
  '23514', null, '-2.495 se rechaza en vez de redondearse'
);
select lives_ok(
  $$insert into public.dexa_scans (scan_date, lumbar_t, femoral_t) select today, -6.0, 4.0 from lima$$,
  'extremos -6.0 y 4.0 con fecha de hoy aceptados'
);
select throws_ok(
  $$insert into public.dexa_scans (scan_date, lumbar_t, femoral_t) select today, -2, -2 from lima$$,
  '23505', null, 'una sola densitometría por día'
);

-- ─── pain_logs ──────────────────────────────────────────────────────────────
select throws_ok(
  $$insert into public.pain_logs (log_date, pain_level, stiffness) values ('2026-01-01', 11, '0-15')$$,
  '23514', null, 'dolor 11 rechazado'
);
select throws_ok(
  $$insert into public.pain_logs (log_date, pain_level, stiffness) values ('2026-01-01', -1, '0-15')$$,
  '23514', null, 'dolor -1 rechazado'
);
select throws_ok(
  $$insert into public.pain_logs (log_date, pain_level, stiffness) select today + 1, 3, '0-15' from lima$$,
  '23514', null, 'dolor con fecha futura rechazado'
);
select throws_ok(
  $$insert into public.pain_logs (log_date, pain_level, stiffness) values ('2026-01-01', 3, '60+')$$,
  '22P02', null, 'rigidez desconocida rechazada'
);
select lives_ok(
  $$insert into public.pain_logs (log_date, pain_level, stiffness) values ('2026-01-01', 0, '30+')$$,
  'dolor 0 aceptado'
);
select throws_ok(
  $$insert into public.pain_logs (log_date, pain_level, stiffness) values ('2026-01-01', 2, '0-15')$$,
  '23505', null, 'un solo registro de dolor por día'
);

-- ─── profiles ───────────────────────────────────────────────────────────────
select throws_ok($$insert into public.profiles (age) values (0)$$, '23514', null, 'edad 0 rechazada');
select throws_ok($$insert into public.profiles (age) values (120)$$, '23514', null, 'edad 120 rechazada');
select throws_ok($$insert into public.profiles (weight_kg) values (0)$$, '23514', null, 'peso 0 rechazado');
select throws_ok($$insert into public.profiles (weight_kg) values (500.1)$$, '23514', null, 'peso > 500 rechazado');
select throws_ok(
  $$insert into public.consents (purpose, policy_version, granted_at) values ('cita', 'v', now() + interval '1 day')$$,
  '23514', null, 'consentimiento con fecha futura rechazado'
);
select throws_ok(
  $$insert into public.profiles (menopausal_status) values ('perimenopausica')$$,
  '22P02', null, 'estado menopáusico desconocido rechazado'
);

-- ─── assessments y consents ─────────────────────────────────────────────────
select throws_ok(
  $$insert into public.assessments (chronological_age, articular_age, risk_level, answers)
    values (50, 130, 'alto', '{}')$$,
  '23514', null, 'edad articular 130 rechazada'
);
select throws_ok(
  $$insert into public.assessments (chronological_age, articular_age, risk_level, answers)
    values (50, 60, 'alto', '[]')$$,
  '23514', null, 'respuestas que no son objeto rechazadas'
);
select throws_ok(
  $$insert into public.consents (purpose, policy_version, granted_at, revoked_at)
    values ('cita', 'v', now(), now() - interval '1 day')$$,
  '23514', null, 'revocación anterior al consentimiento rechazada'
);

-- ─── dose_events y bottles ──────────────────────────────────────────────────
select throws_ok(
  $$insert into public.dose_events (dose_id, product_id, taken_on) values ('noon-extra', 'colageno-vitamina-c', '2026-01-01')$$,
  '22P02', null, 'toma fuera del horario rechazada'
);
select throws_ok(
  $$insert into public.dose_events (dose_id, product_id, taken_on) values ('morning-collagen', 'kolflex', '2026-01-01')$$,
  '23503', null, 'producto fuera del catálogo rechazado'
);
select throws_ok(
  $$insert into public.dose_events (dose_id, product_id, taken_on)
    select 'morning-collagen', 'colageno-vitamina-c', today + 1 from lima$$,
  '23514', null, 'toma con fecha futura rechazada'
);
select lives_ok(
  $$insert into public.dose_events (dose_id, product_id, taken_on) values ('morning-collagen', 'colageno-vitamina-c', '2026-01-01')$$,
  'toma válida aceptada'
);
select throws_ok(
  $$insert into public.dose_events (dose_id, product_id, taken_on) values ('morning-collagen', 'colageno-vitamina-c', '2026-01-01')$$,
  '23505', null, 'una sola toma por horario y día'
);
select throws_ok(
  $$insert into public.bottles (product_id, started_on) select 'colageno-vitamina-c', today + 1 from lima$$,
  '23514', null, 'frasco con fecha futura rechazado'
);

-- ─── updated_at ─────────────────────────────────────────────────────────────
reset role;
update public.pain_logs set updated_at = '2000-01-01' where log_date = '2026-01-01';
select ok(
  (select updated_at > '2000-01-02' from public.pain_logs where log_date = '2026-01-01'),
  'el trigger renueva updated_at en cada UPDATE'
);

-- ─── Catálogo y citas (como postgres) ───────────────────────────────────────
select throws_ok(
  $$update public.products set active = true where id = 'colageno-vitamina-c'$$,
  '23514', null, 'un producto no se activa sin DIGEMID, presentación y precio'
);
select is(
  (select count(*)::int from public.products where active),
  0,
  'el catálogo sembrado queda inactivo hasta tener datos regulatorios'
);
select throws_ok(
  $$insert into public.appointments (user_id, code, service_id, appointment_date, slot, patient_name,
      patient_age, patient_phone, booked_by, consent_version, consent_at)
    values ('11111111-1111-4111-8111-111111111111', 'ART-ABC1O0', 'densitometria', '2026-12-01',
      'tarde', 'A', 55, '987654321', 'propia', 'v', now())$$,
  '23514', null, 'código de cita con caracteres ambiguos rechazado'
);

-- ─── Borrado en cascada (ARCO) ──────────────────────────────────────────────
delete from auth.users where id = '11111111-1111-4111-8111-111111111111';
select is(
  (select count(*)::int from public.dexa_scans) + (select count(*)::int from public.pain_logs)
    + (select count(*)::int from public.dose_events),
  0,
  'borrar el usuario de auth elimina sus datos clínicos'
);
select is((select count(*)::int from public.products), 2, 'el catálogo no se borra con el usuario');

select * from finish();
rollback;
