-- Catálogo inicial: los dos productos del pastillero (DOSE_SCHEDULE.productId).
-- Va en una migración (no en seed.sql) porque dose_events y bottles dependen de
-- él también en producción. Queda inactivo hasta recibir registro DIGEMID,
-- presentación y precio: nunca se inventan datos regulatorios.

insert into public.products (id, name, composition, doses_per_bottle)
values
  ('colageno-vitamina-c', 'Colágeno Hidrolizado + Vitamina C', array['Colágeno hidrolizado', 'Vitamina C'], 60),
  ('citrato-magnesio-d3', 'Citrato de Magnesio + D3', array['Citrato de magnesio', 'Vitamina D3'], 60);
