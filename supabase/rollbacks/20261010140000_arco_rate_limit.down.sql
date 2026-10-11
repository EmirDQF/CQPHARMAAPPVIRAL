-- Revierte 20261010140000_arco_rate_limit.sql. El registro de solicitudes es operativo y se descarta.
drop function if exists public.consume_arco_quota(text);
drop table if exists public.arco_requests;
