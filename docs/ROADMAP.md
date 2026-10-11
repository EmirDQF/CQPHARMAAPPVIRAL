# ROADMAP ARTIKARE — camino a Google Play y App Store

Fuentes de verdad: `CLAUDE.md` (reglas clínicas) → `src/lib/clinical/constants.ts` → `.claude/rules/*` → este archivo.
Plan histórico de persistencia: `docs/plans/fase-1-supabase.md` (C1–C5, ejecutado).
Bloqueos que requieren al usuario: `docs/BLOCKERS.md` · Informe con los candados: `docs/RELEASE.md`.

## Estado por fase (2026-10-11)

| Fase | Contenido | Avance | Commits |
|---|---|---|---|
| 0 | Línea base real | 100 % | `14bde38` |
| 1 | C5: privacidad, ARCO, respaldo encendido; rate limit ARCO y purga diaria | 100 % código · revisión legal pendiente | `9b8eeda` `89efaf5` `d25c6ef` `afac653` |
| 2 | Hábito diario y compartir ético (racha, reposición día 50, invitación sin resultado) | 100 % código · validación clínica pendiente | `0ffa8c5` `92f6570` |
| 3 | Capacitor modo remoto, shell offline, recordatorios nativos; verificado en teléfono físico | 100 % | `1df0df0` `8b02222` `f8c8094` `0bc9b2d` `e8f662a` |
| 4 | Android / Google Play: entornos dev/release, cleartext solo debug, App Links, assetlinks, firma y `build:android` blindado | 95 % · falta dominio, huella de Play y ficha (usuario) | `0ffa8c5` `2f4319a` `3b10fbd` `60def24` `fd6ea4d` `8e9656c` `b6c21a6` |
| 5 | iOS / App Store | 0 % · bloqueado sin macOS (BLOCKERS B1) | — |
| 6 | Cumplimiento de tiendas (privacidad, datos de salud, borrado de cuenta) | 70 % · borrado y ARCO en la app; formularios de tienda (usuario) | — |
| 7 | Verificación y entrega | 100 % técnico · `npm run preflight`, E2E, BD, build | `22eefa8` `55a37d1` |

## Deuda técnica conocida (no bloquea)

- `text-neutral-500` en modo oscuro roza el contraste AA en textos secundarios (Lighthouse A11y 95–96).
- Lighthouse "lantern" (simulado) estima LCP ~3.9 s por la evaluación de JS; con throttling real es 1.6–1.7 s.
- 8 vulnerabilidades solo de desarrollo (cadena de lint `braces` sin versión parcheada; `uuid` vía `@capacitor/cli`/xcode). Producción: 0.
- Monitoreo de fallos del job `daily-soft-delete-purge` (`cron.job_run_details`) por definir en producción.
- Constantes de política aún sin uso en `constants.ts` (`STREAK_MILESTONES`, `UNDO_WINDOW_MS`, `MAX_DAILY_NOTIFICATIONS`, `STREAK_BENEFIT_ENABLED`): decisión de producto.

SIGUIENTE: desplegar la web con dominio HTTPS y variables de producción → `npm run build:android` → primera subida a Google Play (pista interna) → huella de Play App Signing en `ANDROID_SHA256_FINGERPRINT`.
