-- Datos clínicos del paciente: perfil, consentimientos, test, densitometrías y diario de dolor.
-- Reglas comunes: RLS habilitada y forzada, anon sin privilegios, cada paciente solo
-- accede a sus filas ((select auth.uid()) se evalúa una vez por consulta) y las
-- fechas diarias se validan contra el día de America/Lima.

-- ─── profiles ───────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 200),
  age int check (age between 1 and 119),
  sex public.sex,
  menopausal_status public.menopausal_status,
  -- null = sin responder: nunca se asume "No".
  has_fracture_history boolean,
  weight_kg numeric(4, 1) check (weight_kg > 0 and weight_kg <= 500),
  allergies text not null default '' check (char_length(allergies) <= 2000),
  phone text not null default '' check (char_length(phone) <= 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
revoke all on table public.profiles from anon, authenticated;
-- Sin DELETE: el borrado (ARCO) elimina el usuario de auth y cae en cascada.
grant select, insert, update on table public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─── consents (solo se agregan filas) ───────────────────────────────────────
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  purpose public.consent_purpose not null,
  policy_version text not null check (char_length(policy_version) between 1 and 64),
  -- Lo pone el cliente (consentimientos dados sin conexión), pero nunca en el futuro.
  granted_at timestamptz not null check (granted_at <= now() + interval '5 minutes'),
  -- Una revocación es una fila nueva con revoked_at; nunca se edita la original.
  revoked_at timestamptz check (revoked_at is null or revoked_at >= granted_at),
  created_at timestamptz not null default now()
);

create index consents_user_id_idx on public.consents (user_id);

alter table public.consents enable row level security;
alter table public.consents force row level security;
revoke all on table public.consents from anon, authenticated;
grant select, insert on table public.consents to authenticated;

create policy consents_select_own on public.consents
  for select to authenticated using ((select auth.uid()) = user_id);
create policy consents_insert_own on public.consents
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- ─── assessments (resultado del test, solo se agregan filas) ────────────────
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  chronological_age int not null check (chronological_age between 1 and 119),
  articular_age int not null check (articular_age between 1 and 129),
  risk_level public.risk_level not null,
  -- Respuestas validadas por Zod en el borde; aquí solo forma y tamaño.
  answers jsonb not null check (jsonb_typeof(answers) = 'object' and pg_column_size(answers) <= 4096),
  created_at timestamptz not null default now()
);

create index assessments_user_id_idx on public.assessments (user_id);

alter table public.assessments enable row level security;
alter table public.assessments force row level security;
revoke all on table public.assessments from anon, authenticated;
grant select, insert on table public.assessments to authenticated;

create policy assessments_select_own on public.assessments
  for select to authenticated using ((select auth.uid()) = user_id);
create policy assessments_insert_own on public.assessments
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- ─── dexa_scans ─────────────────────────────────────────────────────────────
create table public.dexa_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  scan_date date not null check (scan_date <= (now() at time zone 'America/Lima')::date),
  -- Rango = T_SCORE_INPUT_MIN/MAX de src/lib/clinical/constants.ts. Sin
  -- numeric(4,2): esa escala redondea en silencio (-1.004 → -1.00 = Normal);
  -- con scale() <= 2 un tercer decimal se rechaza.
  lumbar_t numeric not null check (lumbar_t between -6.0 and 4.0) check (scale(lumbar_t) <= 2),
  femoral_t numeric not null check (femoral_t between -6.0 and 4.0) check (scale(femoral_t) <= 2),
  radiology_center text not null default '' check (char_length(radiology_center) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- El índice único también sirve de índice por user_id.
  unique (user_id, scan_date)
);

alter table public.dexa_scans enable row level security;
alter table public.dexa_scans force row level security;
revoke all on table public.dexa_scans from anon, authenticated;
grant select, insert, update, delete on table public.dexa_scans to authenticated;

create policy dexa_scans_select_own on public.dexa_scans
  for select to authenticated using ((select auth.uid()) = user_id);
create policy dexa_scans_insert_own on public.dexa_scans
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy dexa_scans_update_own on public.dexa_scans
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy dexa_scans_delete_own on public.dexa_scans
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger dexa_scans_set_updated_at before update on public.dexa_scans
  for each row execute function public.set_updated_at();

-- ─── pain_logs ──────────────────────────────────────────────────────────────
create table public.pain_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date date not null check (log_date <= (now() at time zone 'America/Lima')::date),
  -- Rango = PAIN_LEVEL_MIN/MAX de src/lib/clinical/constants.ts.
  pain_level int not null check (pain_level between 0 and 10),
  stiffness public.stiffness_bucket not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table public.pain_logs enable row level security;
alter table public.pain_logs force row level security;
revoke all on table public.pain_logs from anon, authenticated;
grant select, insert, update, delete on table public.pain_logs to authenticated;

create policy pain_logs_select_own on public.pain_logs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy pain_logs_insert_own on public.pain_logs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy pain_logs_update_own on public.pain_logs
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy pain_logs_delete_own on public.pain_logs
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger pain_logs_set_updated_at before update on public.pain_logs
  for each row execute function public.set_updated_at();
