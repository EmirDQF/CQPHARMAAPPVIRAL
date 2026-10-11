-- Límite de frecuencia de los derechos ARCO (/api/arco/export y /api/arco/delete).
-- Vive en la base para que todas las instancias del servidor compartan el conteo.
-- Solo guarda quién, qué derecho y cuándo (sin datos de salud); cada llamada
-- limpia lo del usuario con más de una hora y borrar la cuenta lo borra en cascada.
-- Límites (por usuario y hora): export 10, delete 3 = ARCO_HOURLY_LIMITS en
-- src/lib/api/arcoRateLimit.ts (lo verifica sqlParity.test.ts).

create table public.arco_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('export', 'delete')),
  created_at timestamptz not null default now()
);

create index arco_requests_user_kind_created_idx
  on public.arco_requests (user_id, kind, created_at desc);

alter table public.arco_requests enable row level security;
alter table public.arco_requests force row level security;
revoke all on public.arco_requests from public, anon, authenticated;

create function public.consume_arco_quota(p_kind text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  hourly_limit int;
  recent_count int;
begin
  if current_user_id is null then
    raise exception 'Se requiere sesión' using errcode = '42501';
  end if;

  hourly_limit := case p_kind when 'export' then 10 when 'delete' then 3 end;
  if hourly_limit is null then
    raise exception 'Tipo de solicitud ARCO inválido' using errcode = '22023';
  end if;

  -- Una solicitud a la vez por paciente: el conteo no tiene carreras.
  perform pg_advisory_xact_lock(hashtextextended('arco:' || current_user_id::text, 0));

  delete from public.arco_requests
  where user_id = current_user_id and created_at <= now() - interval '1 hour';

  select count(*) into recent_count
  from public.arco_requests
  where user_id = current_user_id and kind = p_kind;
  if recent_count >= hourly_limit then
    return false;
  end if;

  insert into public.arco_requests (user_id, kind) values (current_user_id, p_kind);
  return true;
end;
$$;

revoke all on function public.consume_arco_quota(text) from public, anon;
grant execute on function public.consume_arco_quota(text) to authenticated;
