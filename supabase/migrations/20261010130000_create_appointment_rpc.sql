-- C4: las citas se crean solo por esta RPC (appointments no tiene grant de INSERT).
-- El celular propone el código: se muestra y viaja por WhatsApp aunque no haya
-- red. La base lo acepta si cumple el alfabeto y está libre; si ya es de otra
-- cita, genera otro y lo devuelve. Reenviar la misma cita (reintento de la
-- outbox) devuelve el mismo código sin crear otra ni consumir cupo.
-- Límite: APPOINTMENT_HOURLY_LIMIT (3) citas por paciente y hora, en la base.

create function public.create_appointment(
  p_code text,
  p_service_id public.clinical_service_id,
  p_appointment_date date,
  p_slot public.appointment_slot,
  p_patient_name text,
  p_patient_age int,
  p_patient_phone text,
  p_booked_by public.appointment_booked_by,
  p_consent_version text,
  p_consent_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  recent_count int;
  candidate text := p_code;
  random_bytes bytea;
  attempt int;
begin
  if current_user_id is null then
    raise exception 'Se requiere sesión' using errcode = '42501';
  end if;

  -- Una cita a la vez por paciente: el reintento y el conteo no tienen carreras.
  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  if exists (
    select 1 from public.appointments where code = p_code and user_id = current_user_id
  ) then
    return p_code;
  end if;

  select count(*) into recent_count
  from public.appointments
  where user_id = current_user_id and created_at > now() - interval '1 hour';
  if recent_count >= 3 then
    raise exception 'Límite de citas por hora alcanzado' using errcode = 'P0429';
  end if;

  for attempt in 1..5 loop
    if attempt > 1 or candidate is null or candidate !~ ('^ART-[' || alphabet || ']{6}$') then
      random_bytes := extensions.gen_random_bytes(6);
      -- 256 es múltiplo de 32: cada carácter del alfabeto es igual de probable.
      select 'ART-' || string_agg(substr(alphabet, get_byte(random_bytes, position) % 32 + 1, 1), '' order by position)
      into candidate
      from generate_series(0, 5) as position;
    end if;

    begin
      insert into public.appointments (
        user_id, code, service_id, appointment_date, slot, patient_name,
        patient_age, patient_phone, booked_by, consent_version, consent_at
      ) values (
        current_user_id, candidate, p_service_id, p_appointment_date, p_slot, p_patient_name,
        p_patient_age, p_patient_phone, p_booked_by, p_consent_version, p_consent_at
      );
      return candidate;
    exception when unique_violation then
      -- El código ya es de otra cita: se intenta con uno nuevo.
      null;
    end;
  end loop;

  raise exception 'No se pudo generar un código de cita único' using errcode = 'P0001';
end;
$$;

revoke execute on function public.create_appointment(
  text, public.clinical_service_id, date, public.appointment_slot, text, int, text,
  public.appointment_booked_by, text, timestamptz
) from public, anon;
grant execute on function public.create_appointment(
  text, public.clinical_service_id, date, public.appointment_slot, text, int, text,
  public.appointment_booked_by, text, timestamptz
) to authenticated;
