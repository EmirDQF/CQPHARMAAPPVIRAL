-- Revierte 20261010130000_create_appointment_rpc.sql. Las citas ya creadas se conservan.
drop function if exists public.create_appointment(
  text, public.clinical_service_id, date, public.appointment_slot, text, int, text,
  public.appointment_booked_by, text, timestamptz
);
