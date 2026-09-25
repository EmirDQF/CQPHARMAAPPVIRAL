-- Revierte 20260925160000_base_types.sql (requiere revertir antes las tablas).
drop function if exists public.set_updated_at();
drop type if exists public.appointment_status;
drop type if exists public.appointment_booked_by;
drop type if exists public.appointment_slot;
drop type if exists public.clinical_service_id;
drop type if exists public.dose_id;
drop type if exists public.consent_purpose;
drop type if exists public.stiffness_bucket;
drop type if exists public.risk_level;
drop type if exists public.menopausal_status;
drop type if exists public.sex;
