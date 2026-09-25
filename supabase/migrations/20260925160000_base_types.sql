-- Tipos y utilidades compartidas del esquema clínico de Artikare.
-- Los valores de cada enum replican los del cliente (ver src/lib/schemas/sqlParity.test.ts).

create type public.sex as enum ('femenino', 'masculino');
create type public.menopausal_status as enum ('premenopausica', 'posmenopausica', 'no-aplica');
create type public.risk_level as enum ('bajo', 'moderado', 'alto');
create type public.stiffness_bucket as enum ('0-15', '15-30', '30+');
create type public.consent_purpose as enum ('perfil-clinico', 'cita', 'contacto-test');
-- Los id de toma se persisten también en artikare_pillbox_v1: no renombrarlos.
create type public.dose_id as enum ('morning-collagen', 'night-magnesium');
create type public.clinical_service_id as enum ('densitometria', 'consulta-reumatologia', 'control-preventivo');
create type public.appointment_slot as enum ('manana', 'tarde');
create type public.appointment_booked_by as enum ('propia', 'hijo');
create type public.appointment_status as enum ('solicitada', 'confirmada', 'cancelada', 'atendida');

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
