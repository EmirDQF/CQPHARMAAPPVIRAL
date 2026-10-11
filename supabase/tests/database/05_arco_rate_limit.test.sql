-- Límite de frecuencia de los derechos ARCO en la base (compartido entre instancias).
begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email, aud, role)
values
  ('55555555-5555-4555-8555-555555555555', 'arco-a@test.local', 'authenticated', 'authenticated'),
  ('66666666-6666-4666-8666-666666666666', 'arco-b@test.local', 'authenticated', 'authenticated');

-- ─── Estructura ─────────────────────────────────────────────────────────────
select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.arco_requests'::regclass),
  'arco_requests tiene RLS habilitada y forzada'
);
select ok(
  not has_table_privilege('authenticated', 'public.arco_requests', 'select, insert, update, delete')
    and not has_table_privilege('anon', 'public.arco_requests', 'select, insert, update, delete'),
  'ni anon ni authenticated tocan arco_requests directamente'
);
select ok(
  (select prosecdef and proconfig @> array['search_path=""'] from pg_proc
   where oid = 'public.consume_arco_quota(text)'::regprocedure),
  'consume_arco_quota es security definer con search_path vacío'
);
select ok(
  not has_function_privilege('anon', 'public.consume_arco_quota(text)', 'execute'),
  'anon no puede ejecutar consume_arco_quota'
);

-- ─── Cupos por usuario ──────────────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims to '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}';

select is(
  (select bool_and(public.consume_arco_quota('export')) from generate_series(1, 10)),
  true,
  'A puede exportar 10 veces en una hora'
);
select is(public.consume_arco_quota('export'), false, 'la exportación 11 de la hora se rechaza');
select is(
  (select bool_and(public.consume_arco_quota('delete')) from generate_series(1, 3)),
  true,
  'los cupos de borrado son independientes de los de exportación'
);
select is(public.consume_arco_quota('delete'), false, 'el cuarto borrado de la hora se rechaza');
select throws_ok(
  $$select public.consume_arco_quota('rectificar')$$, '22023', null, 'un tipo desconocido se rechaza'
);

set local request.jwt.claims to '{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated"}';
select is(public.consume_arco_quota('export'), true, 'el cupo de A no afecta a B');

set local request.jwt.claims to '{"role":"authenticated"}';
select throws_ok($$select public.consume_arco_quota('export')$$, '42501', null, 'sin sesión no hay cupo');
reset role;

-- ─── Ventana de una hora ────────────────────────────────────────────────────
update public.arco_requests
set created_at = now() - interval '61 minutes'
where user_id = '55555555-5555-4555-8555-555555555555' and kind = 'delete';

set local role authenticated;
set local request.jwt.claims to '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}';
select is(public.consume_arco_quota('delete'), true, 'pasada la hora el cupo de borrado se recupera');
reset role;

select is(
  (select count(*)::int from public.arco_requests
   where user_id = '55555555-5555-4555-8555-555555555555' and created_at <= now() - interval '1 hour'),
  0,
  'las solicitudes vencidas del usuario se limpian al consumir cupo'
);

delete from auth.users where id = '55555555-5555-4555-8555-555555555555';
select is(
  (select count(*)::int from public.arco_requests where user_id = '55555555-5555-4555-8555-555555555555'),
  0,
  'borrar la cuenta borra en cascada su registro de solicitudes'
);

select * from finish();
rollback;
