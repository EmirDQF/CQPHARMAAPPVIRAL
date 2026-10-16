-- Revierte 20261016090000_menopausal_status_unsure.sql. Postgres no elimina
-- valores de un enum: las respuestas nuevas vuelven al valor combinado anterior
-- y los valores quedan sin uso (inofensivos).
update public.profiles
   set menopausal_status = 'no-aplica'
 where menopausal_status in ('no-segura', 'no-decir');
