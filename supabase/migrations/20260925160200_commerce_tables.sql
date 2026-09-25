-- Catálogo CQ Pharma, pastillero, frascos iniciados y citas.
-- Mismas reglas comunes que 20260925160100_clinical_tables.sql.

-- ─── products (catálogo; solo lectura para el paciente) ─────────────────────
create table public.products (
  id text primary key check (id ~ '^[a-z0-9-]{1,64}$'),
  name text not null check (char_length(name) between 1 and 120),
  composition text[] not null check (cardinality(composition) >= 1),
  digemid_registration text check (char_length(digemid_registration) >= 1),
  presentation text check (char_length(presentation) >= 1),
  doses_per_bottle int not null check (doses_per_bottle > 0),
  price_pen numeric(10, 2) check (price_pen > 0),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Ningún producto se publica sin su registro sanitario, presentación y precio.
  constraint products_active_requires_regulatory_data check (
    not active or (digemid_registration is not null and presentation is not null and price_pen is not null)
  )
);

alter table public.products enable row level security;
alter table public.products force row level security;
revoke all on table public.products from anon, authenticated;
-- Escritura solo con service_role (migraciones y seed).
grant select on table public.products to authenticated;

create policy products_select_authenticated on public.products
  for select to authenticated using (true);

create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ─── dose_events ────────────────────────────────────────────────────────────
create table public.dose_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dose_id public.dose_id not null,
  product_id text not null references public.products (id) on update cascade on delete restrict,
  taken_on date not null check (taken_on <= (now() at time zone 'America/Lima')::date),
  -- Margen para la deriva del reloj del celular.
  taken_at timestamptz not null default now() check (taken_at <= now() + interval '5 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, dose_id, taken_on)
);

create index dose_events_product_id_idx on public.dose_events (product_id);

alter table public.dose_events enable row level security;
alter table public.dose_events force row level security;
revoke all on table public.dose_events from anon, authenticated;
grant select, insert, update, delete on table public.dose_events to authenticated;

create policy dose_events_select_own on public.dose_events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy dose_events_insert_own on public.dose_events
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy dose_events_update_own on public.dose_events
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy dose_events_delete_own on public.dose_events
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger dose_events_set_updated_at before update on public.dose_events
  for each row execute function public.set_updated_at();

-- ─── bottles ("Empecé un frasco nuevo") ─────────────────────────────────────
create table public.bottles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id text not null references public.products (id) on update cascade on delete restrict,
  started_on date not null check (started_on <= (now() at time zone 'America/Lima')::date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id, started_on)
);

create index bottles_product_id_idx on public.bottles (product_id);

alter table public.bottles enable row level security;
alter table public.bottles force row level security;
revoke all on table public.bottles from anon, authenticated;
grant select, insert, update, delete on table public.bottles to authenticated;

create policy bottles_select_own on public.bottles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy bottles_insert_own on public.bottles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy bottles_update_own on public.bottles
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy bottles_delete_own on public.bottles
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger bottles_set_updated_at before update on public.bottles
  for each row execute function public.set_updated_at();

-- ─── appointments ───────────────────────────────────────────────────────────
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Mismo alfabeto que APPOINTMENT_CODE_PATTERN (sin I, O, 0 ni 1).
  code text not null unique check (code ~ '^ART-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$'),
  service_id public.clinical_service_id not null,
  appointment_date date not null,
  slot public.appointment_slot not null,
  patient_name text not null check (char_length(patient_name) between 2 and 120),
  patient_age int not null check (patient_age between 1 and 119),
  patient_phone text not null check (patient_phone ~ '^[+0-9 -]{6,20}$'),
  booked_by public.appointment_booked_by not null,
  status public.appointment_status not null default 'solicitada',
  consent_version text not null check (char_length(consent_version) between 1 and 64),
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index appointments_user_id_idx on public.appointments (user_id);

alter table public.appointments enable row level security;
alter table public.appointments force row level security;
revoke all on table public.appointments from anon, authenticated;
-- INSERT solo vía la RPC create_appointment (C4). El paciente solo puede cancelar.
grant select on table public.appointments to authenticated;
grant update (status) on table public.appointments to authenticated;

create policy appointments_select_own on public.appointments
  for select to authenticated using ((select auth.uid()) = user_id);
create policy appointments_cancel_own on public.appointments
  for update to authenticated
  -- Solo citas vigentes: una cita atendida o ya cancelada no se toca.
  using ((select auth.uid()) = user_id and status in ('solicitada', 'confirmada'))
  with check ((select auth.uid()) = user_id and status = 'cancelada');

create trigger appointments_set_updated_at before update on public.appointments
  for each row execute function public.set_updated_at();
