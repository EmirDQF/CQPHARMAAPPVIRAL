-- Separa la opción combinada "No sé / Prefiero no decirlo" en dos respuestas.
-- 'no-aplica' se conserva por compatibilidad: el cliente la lee como 'no-segura'.
alter type public.menopausal_status add value if not exists 'no-segura';
alter type public.menopausal_status add value if not exists 'no-decir';
