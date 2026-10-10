# ROADMAP ARTIKARE — camino a Google Play y App Store

Fuentes de verdad: `CLAUDE.md` (reglas clínicas) → `src/lib/clinical/constants.ts` → `.claude/rules/*` → este archivo.
Plan histórico de persistencia: `docs/plans/fase-1-supabase.md` (C1–C5, ejecutado).
Bloqueos detallados: `docs/BLOCKERS.md` · Informe de lanzamiento: `docs/RELEASE.md`.

## Estado por fase

| Fase | Contenido | Avance |
|---|---|---|
| 0 | Línea base real | 100 % |
| 1 | C5: privacidad, ARCO y encendido del respaldo | 100 % (código) · revisión legal pendiente |
| 2 | Hábito diario y compartir ético | 0 % |
| 3 | Capacitor (modo remoto) | 0 % |
| 4 | Android / Google Play | 0 % |
| 5 | iOS / App Store | 0 % |
| 6 | Cumplimiento de tiendas | 0 % |
| 7 | Verificación y entrega | 0 % |

## Fase 0 — línea base (2026-10-10, HEAD f3013d9)

- `npm run typecheck` → exit 0 · `npm run lint` → exit 0.
- `npm test` → 67 archivos, 642/642 tests.
- `npm run build` → OK (21 páginas, modo invitado sin variables de Supabase).
- `npm run test:e2e` → 8/8 a 375 px con `E2E_PORT=3200` (el 3100 estaba ocupado por otro proceso local y Playwright lo reutilizaba).
- `npm run test:db` → pgTAP 140/140 e integración 42/42, tras acotar el test 33 de `02_constraints` al usuario de prueba.

## Fase 1 — C5 ARCO y privacidad (2026-10-10, `9b8eeda` + `89efaf5`)

- Ajustes (`/app/ajustes`) con los cuatro derechos: acceso (exportar JSON del celular y de la cuenta), rectificación, cancelación (borrado en cascada, cierre de sesión y limpieza de `artikare_*`) y oposición.
- `/api/arco/export`: lee con la sesión del paciente (RLS), `Cache-Control: no-store`. `/api/arco/delete`: exige mismo origen (CSRF), confirmación explícita y service role solo en servidor.
- Política con transferencia internacional (Supabase sa-east-1) y marca "Pendiente de revisión legal".
- Revisores: seguridad (HIGH CSRF corregido), a11y (descripción del diálogo, foco inicial en Cancelar, ayuda del botón deshabilitado), base de datos (sin CRITICAL/HIGH).
- Candados: tsc 0 · eslint 0 · vitest 693/693 · pgTAP 140/140 · integración 46/46.
- Respaldo de Mi Panel e invitación a crear cuenta **encendidos** (`src/lib/auth/features.ts`).

## Decisiones del usuario pendientes

- Correo real de privacidad (`PRIVACY_CONTACT` en `src/app/privacidad/page.tsx`) y plazos de conservación por definir con asesoría legal.
- Revisión legal de `/privacidad` (Ley 29733) antes de publicar.

## Deuda técnica conocida (MEDIUM, no bloquea)

- Programar `purge_expired_soft_deletes()` (pg_cron o Scheduled Function) a diario; sin purga, lo borrado en suave de más de 30 días queda fuera de la exportación.
- Límite de frecuencia en `/api/arco/export` y `/api/arco/delete`.
- Añadir el paquete `server-only` a `src/lib/supabase/admin.ts`.
- Índice parcial `where deleted_at is not null` en `dexa_scans`, `pain_logs` y `dose_events`.

SIGUIENTE: E2E de flujos críticos, pulido PWA y empaquetado Capacitor (Fases 3–4).
