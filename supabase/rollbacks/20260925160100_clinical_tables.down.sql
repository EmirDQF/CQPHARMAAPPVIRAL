-- Revierte 20260925160100_clinical_tables.sql (borra datos: exportar antes en producción).
drop table if exists public.pain_logs;
drop table if exists public.dexa_scans;
drop table if exists public.assessments;
drop table if exists public.consents;
drop table if exists public.profiles;
