# ROADMAP ARTIKARE — camino a Google Play y App Store

Fuentes de verdad: `CLAUDE.md` (reglas clínicas) → `src/lib/clinical/constants.ts` → `.claude/rules/*` → este archivo.
Plan histórico de persistencia: `docs/plans/fase-1-supabase.md` (C1–C5).

## Estado por fase

| Fase | Contenido | Avance |
|---|---|---|
| 0 | Línea base real | 100 % |
| 1 | C5: privacidad, ARCO y encendido del respaldo | 0 % |
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
- `npm run test:db` → pgTAP 140/140 e integración 42/42, tras acotar el test 33 de `02_constraints` al usuario de prueba (contaba filas de otras cuentas que deja la suite de integración).

## Decisiones del usuario pendientes

_(ninguna por ahora)_

## BLOQUEOS

_(ninguno por ahora)_

SIGUIENTE: Fase 1.1 — derechos ARCO desde Ajustes (exportar, rectificar, cancelar, oponerse).
