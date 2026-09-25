-- Prueba seudonimizada del consentimiento que sobrevive al borrado de cuenta (Ley 29733).
-- Pendiente de revisión legal.
begin;
create extension if not exists pgtap with schema extensions;

select plan(15);

insert into auth.users (id, email, aud, role)
values ('33333333-3333-4333-8333-333333333333', 'c@test.local', 'authenticated', 'authenticated');

insert into public.consents (user_id, purpose, policy_version, granted_at, revoked_at)
values
  ('33333333-3333-4333-8333-333333333333', 'perfil-clinico', 'v-proof-test', '2026-01-01T10:00:00Z', null),
  ('33333333-3333-4333-8333-333333333333', 'cita', 'v-proof-test', '2026-01-02T10:00:00Z', '2026-01-05T10:00:00Z');

select columns_are(
  'public', 'consent_proofs',
  array['id', 'subject_hash', 'purpose', 'policy_version', 'granted_at', 'revoked_at', 'created_at'],
  'consent_proofs no guarda user_id, nombre, email, teléfono ni datos de salud'
);
select is(
  (select count(*)::int from public.consent_proofs where policy_version = 'v-proof-test'),
  0,
  'mientras la cuenta existe no hay pruebas seudonimizadas'
);
select ok(
  (select value ~ '^[0-9a-f]{64}$' from private.server_secrets where name = 'consent_proof_salt'),
  'el salt existe y se generó en el servidor (32 bytes aleatorios)'
);

-- ─── Nadie fuera del servidor ve pruebas ni salt ────────────────────────────
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select throws_ok($$select * from public.consent_proofs$$, '42501', null, 'el paciente no lee consent_proofs');
select throws_ok($$select * from private.server_secrets$$, '42501', null, 'el paciente no lee el salt');
reset role;
set local role anon;
select throws_ok($$select * from public.consent_proofs$$, '42501', null, 'anon no lee consent_proofs');
reset role;

-- ─── consents es solo de agregado: sin cuenta borrada no se borra nada ───────
select throws_ok(
  $$delete from public.consents where user_id = '33333333-3333-4333-8333-333333333333' and purpose = 'cita'$$,
  '42501',
  null,
  'ni el servidor borra un consentimiento suelto mientras la cuenta existe'
);
select is(
  (select count(*)::int from public.consent_proofs where policy_version = 'v-proof-test'),
  0,
  'un borrado suelto rechazado no fabrica una prueba de revocación'
);
select ok(
  (select relforcerowsecurity from pg_class where oid = 'private.server_secrets'::regclass),
  'server_secrets tiene FORCE ROW LEVEL SECURITY, como audit_log y consent_proofs'
);

-- ─── Borrado de cuenta ──────────────────────────────────────────────────────
delete from auth.users where id = '33333333-3333-4333-8333-333333333333';

select is(
  (select count(*)::int from public.consents where user_id = '33333333-3333-4333-8333-333333333333'),
  0,
  'los consentimientos con user_id se borran con la cuenta'
);
select is(
  (select count(*)::int from public.consent_proofs where policy_version = 'v-proof-test'),
  2,
  'queda una prueba seudonimizada por consentimiento'
);
select is(
  (select count(distinct subject_hash)::int from public.consent_proofs where policy_version = 'v-proof-test'),
  1,
  'las pruebas del mismo paciente comparten el mismo hash'
);
select isnt(
  (select subject_hash from public.consent_proofs where policy_version = 'v-proof-test' limit 1),
  encode(extensions.digest('33333333-3333-4333-8333-333333333333', 'sha256'), 'hex'),
  'el hash usa salt: no coincide con el SHA-256 simple del user_id'
);
select ok(
  (select bool_and(revoked_at is not null) from public.consent_proofs where policy_version = 'v-proof-test'),
  'toda prueba queda revocada al borrar la cuenta'
);
select is(
  (select revoked_at from public.consent_proofs where policy_version = 'v-proof-test' and purpose = 'cita'),
  '2026-01-05T10:00:00Z'::timestamptz,
  'una revocación previa conserva su fecha original'
);

select * from finish();
rollback;
