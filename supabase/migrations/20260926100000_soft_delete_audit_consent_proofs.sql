-- C1.1: borrado suave con 30 días para deshacer, auditoría sin valores clínicos y
-- prueba seudonimizada del consentimiento tras borrar la cuenta (Ley 29733,
-- pendiente de revisión legal). El borrado de cuenta sigue siendo HARD DELETE:
-- auth.users → on delete cascade elimina todo, incluso lo borrado suave.

-- ─── Esquema privado (no expuesto por PostgREST) ────────────────────────────
create schema private;
revoke all on schema private from public, anon, authenticated;

-- ─── Borrado suave ──────────────────────────────────────────────────────────
alter table public.dexa_scans add column deleted_at timestamptz;
alter table public.pain_logs add column deleted_at timestamptz;
alter table public.dose_events add column deleted_at timestamptz;

-- Sin DELETE directo del paciente: borra en suave por RPC y en duro solo con la cuenta.
revoke delete on table public.dexa_scans, public.pain_logs, public.dose_events from authenticated;
drop policy dexa_scans_delete_own on public.dexa_scans;
drop policy pain_logs_delete_own on public.pain_logs;
drop policy dose_events_delete_own on public.dose_events;

-- Lo borrado no se ve ni se edita, y deleted_at solo cambia por las RPC.
alter policy dexa_scans_select_own on public.dexa_scans
  using ((select auth.uid()) = user_id and deleted_at is null);
alter policy dexa_scans_insert_own on public.dexa_scans
  with check ((select auth.uid()) = user_id and deleted_at is null);
alter policy dexa_scans_update_own on public.dexa_scans
  using ((select auth.uid()) = user_id and deleted_at is null)
  with check ((select auth.uid()) = user_id and deleted_at is null);

alter policy pain_logs_select_own on public.pain_logs
  using ((select auth.uid()) = user_id and deleted_at is null);
alter policy pain_logs_insert_own on public.pain_logs
  with check ((select auth.uid()) = user_id and deleted_at is null);
alter policy pain_logs_update_own on public.pain_logs
  using ((select auth.uid()) = user_id and deleted_at is null)
  with check ((select auth.uid()) = user_id and deleted_at is null);

alter policy dose_events_select_own on public.dose_events
  using ((select auth.uid()) = user_id and deleted_at is null);
alter policy dose_events_insert_own on public.dose_events
  with check ((select auth.uid()) = user_id and deleted_at is null);
alter policy dose_events_update_own on public.dose_events
  using ((select auth.uid()) = user_id and deleted_at is null)
  with check ((select auth.uid()) = user_id and deleted_at is null);

-- ─── audit_log: solo tipo de evento, tabla, id y fecha ──────────────────────
create table public.audit_log (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('soft_delete', 'restore', 'purge')),
  table_name text not null check (table_name in ('dexa_scans', 'pain_logs', 'dose_events')),
  record_id uuid not null,
  occurred_at timestamptz not null default now()
);

create index audit_log_record_id_idx on public.audit_log (record_id);

alter table public.audit_log enable row level security;
alter table public.audit_log force row level security;
-- Sin políticas: solo service_role (soporte) la consulta.
revoke all on table public.audit_log from anon, authenticated;

create function private.audit_soft_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    insert into public.audit_log (event_type, table_name, record_id) values ('soft_delete', tg_table_name, new.id);
  elsif old.deleted_at is not null and new.deleted_at is null then
    insert into public.audit_log (event_type, table_name, record_id) values ('restore', tg_table_name, new.id);
  end if;
  return null;
end;
$$;

create trigger dexa_scans_audit_soft_delete after update of deleted_at on public.dexa_scans
  for each row execute function private.audit_soft_delete();
create trigger pain_logs_audit_soft_delete after update of deleted_at on public.pain_logs
  for each row execute function private.audit_soft_delete();
create trigger dose_events_audit_soft_delete after update of deleted_at on public.dose_events
  for each row execute function private.audit_soft_delete();

-- Un registro nuevo con la misma clave única reemplaza al borrado suave
-- (el paciente volvió a registrar ese día), así el UNIQUE y los upsert siguen funcionando.
create function private.purge_soft_deleted_duplicate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  purged_id uuid;
begin
  if tg_table_name = 'dexa_scans' then
    delete from public.dexa_scans
    where user_id = new.user_id and scan_date = new.scan_date and deleted_at is not null
    returning id into purged_id;
  elsif tg_table_name = 'pain_logs' then
    delete from public.pain_logs
    where user_id = new.user_id and log_date = new.log_date and deleted_at is not null
    returning id into purged_id;
  elsif tg_table_name = 'dose_events' then
    delete from public.dose_events
    where user_id = new.user_id and dose_id = new.dose_id and taken_on = new.taken_on and deleted_at is not null
    returning id into purged_id;
  end if;

  if purged_id is not null then
    insert into public.audit_log (event_type, table_name, record_id) values ('purge', tg_table_name, purged_id);
  end if;
  return new;
end;
$$;

create trigger dexa_scans_purge_soft_deleted_duplicate before insert on public.dexa_scans
  for each row execute function private.purge_soft_deleted_duplicate();
create trigger pain_logs_purge_soft_deleted_duplicate before insert on public.pain_logs
  for each row execute function private.purge_soft_deleted_duplicate();
create trigger dose_events_purge_soft_deleted_duplicate before insert on public.dose_events
  for each row execute function private.purge_soft_deleted_duplicate();

-- ─── RPC del paciente ───────────────────────────────────────────────────────
create function public.soft_delete_record(p_table text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Se requiere sesión' using errcode = '42501';
  end if;

  case p_table
    when 'dexa_scans' then
      update public.dexa_scans set deleted_at = now()
      where id = p_id and user_id = current_user_id and deleted_at is null;
    when 'pain_logs' then
      update public.pain_logs set deleted_at = now()
      where id = p_id and user_id = current_user_id and deleted_at is null;
    when 'dose_events' then
      update public.dose_events set deleted_at = now()
      where id = p_id and user_id = current_user_id and deleted_at is null;
    else
      raise exception 'Tabla sin borrado suave' using errcode = '22023';
  end case;

  if not found then
    raise exception 'Registro no encontrado' using errcode = 'P0002';
  end if;
end;
$$;

create function public.restore_record(p_table text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Se requiere sesión' using errcode = '42501';
  end if;

  -- Ventana = SOFT_DELETE_RESTORE_DAYS de src/lib/clinical/constants.ts.
  case p_table
    when 'dexa_scans' then
      update public.dexa_scans set deleted_at = null
      where id = p_id and user_id = current_user_id and deleted_at > now() - interval '30 days';
    when 'pain_logs' then
      update public.pain_logs set deleted_at = null
      where id = p_id and user_id = current_user_id and deleted_at > now() - interval '30 days';
    when 'dose_events' then
      update public.dose_events set deleted_at = null
      where id = p_id and user_id = current_user_id and deleted_at > now() - interval '30 days';
    else
      raise exception 'Tabla sin borrado suave' using errcode = '22023';
  end case;

  if not found then
    raise exception 'Registro no encontrado o fuera del plazo para deshacer' using errcode = 'P0002';
  end if;
end;
$$;

-- Papelera del paciente: sus registros borrados que aún puede deshacer.
create function public.list_deleted_records()
returns table (table_name text, record_id uuid, deleted_at timestamptz, record jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select 'dexa_scans', d.id, d.deleted_at,
         jsonb_build_object('scan_date', d.scan_date, 'lumbar_t', d.lumbar_t, 'femoral_t', d.femoral_t)
  from public.dexa_scans d
  where d.user_id = auth.uid() and d.deleted_at > now() - interval '30 days'
  union all
  select 'pain_logs', p.id, p.deleted_at,
         jsonb_build_object('log_date', p.log_date, 'pain_level', p.pain_level, 'stiffness', p.stiffness)
  from public.pain_logs p
  where p.user_id = auth.uid() and p.deleted_at > now() - interval '30 days'
  union all
  select 'dose_events', e.id, e.deleted_at,
         jsonb_build_object('dose_id', e.dose_id, 'product_id', e.product_id, 'taken_on', e.taken_on)
  from public.dose_events e
  where e.user_id = auth.uid() and e.deleted_at > now() - interval '30 days'
  order by 3 desc;
$$;

-- Minimización de datos: lo borrado hace más de 30 días se elimina de verdad.
-- Solo service_role (tarea programada; ver docs/ROADMAP.md, fase H).
create function public.purge_expired_soft_deletes()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  purged_count integer;
begin
  with dexa as (
    delete from public.dexa_scans where deleted_at <= now() - interval '30 days' returning id
  ), pain as (
    delete from public.pain_logs where deleted_at <= now() - interval '30 days' returning id
  ), dose as (
    delete from public.dose_events where deleted_at <= now() - interval '30 days' returning id
  ), audited as (
    insert into public.audit_log (event_type, table_name, record_id)
    select 'purge', 'dexa_scans', id from dexa
    union all select 'purge', 'pain_logs', id from pain
    union all select 'purge', 'dose_events', id from dose
    returning 1
  )
  select count(*)::integer into purged_count from audited;
  return purged_count;
end;
$$;

revoke execute on function public.soft_delete_record(text, uuid) from public, anon;
revoke execute on function public.restore_record(text, uuid) from public, anon;
revoke execute on function public.list_deleted_records() from public, anon;
revoke execute on function public.purge_expired_soft_deletes() from public, anon, authenticated;
grant execute on function public.soft_delete_record(text, uuid) to authenticated;
grant execute on function public.restore_record(text, uuid) to authenticated;
grant execute on function public.list_deleted_records() to authenticated;
grant execute on function public.purge_expired_soft_deletes() to service_role;

-- ─── Prueba seudonimizada del consentimiento ────────────────────────────────
create table private.server_secrets (
  name text primary key,
  value text not null
);
alter table private.server_secrets enable row level security;
alter table private.server_secrets force row level security;
revoke all on table private.server_secrets from public, anon, authenticated;

-- El salt se genera dentro de la base: nunca pasa por el repositorio ni por el chat.
insert into private.server_secrets (name, value)
values ('consent_proof_salt', encode(extensions.gen_random_bytes(32), 'hex'));

create function private.pseudonymize_subject(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select encode(extensions.hmac(p_user_id::text, s.value, 'sha256'), 'hex')
  from private.server_secrets s
  where s.name = 'consent_proof_salt';
$$;

create table public.consent_proofs (
  id uuid primary key default gen_random_uuid(),
  subject_hash text not null check (subject_hash ~ '^[0-9a-f]{64}$'),
  purpose public.consent_purpose not null,
  policy_version text not null check (char_length(policy_version) between 1 and 64),
  granted_at timestamptz not null,
  revoked_at timestamptz not null check (revoked_at >= granted_at),
  created_at timestamptz not null default now()
);

create index consent_proofs_subject_hash_idx on public.consent_proofs (subject_hash);

alter table public.consent_proofs enable row level security;
alter table public.consent_proofs force row level security;
revoke all on table public.consent_proofs from anon, authenticated;

-- Los consentimientos solo se borran con la cuenta (cascada): antes de perderlos
-- queda la prueba sin user_id, sin datos de contacto ni de salud. Un borrado suelto
-- (la cuenta sigue en auth.users) se rechaza para no fabricar una revocación falsa.
create function private.preserve_consent_proof()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from auth.users u where u.id = old.user_id) then
    raise exception 'consents es solo de agregado: se borra únicamente con la cuenta'
      using errcode = '42501';
  end if;

  insert into public.consent_proofs (subject_hash, purpose, policy_version, granted_at, revoked_at)
  values (
    private.pseudonymize_subject(old.user_id),
    old.purpose,
    old.policy_version,
    old.granted_at,
    greatest(coalesce(old.revoked_at, now()), old.granted_at)
  );
  return old;
end;
$$;

create trigger consents_preserve_proof before delete on public.consents
  for each row execute function private.preserve_consent_proof();

revoke execute on all functions in schema private from public, anon, authenticated;
