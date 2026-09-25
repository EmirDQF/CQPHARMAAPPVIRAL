-- Revierte 20260925160300_seed_products.sql.
-- Falla a propósito (FK on delete restrict) si ya hay tomas o frascos que usan
-- estos productos: un rollback nunca borra registros de pacientes.
delete from public.products where id in ('colageno-vitamina-c', 'citrato-magnesio-d3');
