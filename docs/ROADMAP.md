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
| 6 | Cumplimiento de tiendas (privacidad, datos de salud, borrado de cuenta) | 85 % · checklist con evidencia y borrador de la ficha listos; formularios, icono y gráfico de la ficha (usuario) | `bc5116e` `e82f47b` `3a53b1f` |
| 8 | Experiencia profesional: pack y menopausia corregidos, 64 frases, sonidos, Aprender (25 fichas), 6 mini-juegos (79 ítems), insignias, cofre, panel Mi salud | 100 % código · validación médica pendiente (BLOCKERS S-C1) | `72e2493` `dab9100` `50f36ae` `ad6b1c0` `81244f4` `a6650c2` `2ee4646` `7b3c327` `c980fa2` |
| 7 | Verificación y entrega | 100 % técnico · `npm run preflight`, E2E, BD, build | `22eefa8` `55a37d1` |

## Deuda técnica conocida (no bloquea)

- Lighthouse "lantern" (simulado) estima LCP ~3.9 s por la evaluación de JS; con throttling real es 1.6–1.7 s. Medición local del 2026-10-12 (equipo Windows, muy variable entre corridas): Rendimiento `/` 63, `/app` 51–58 (TBT 1.1–2.1 s), `/test` 79. No se comparó contra la versión anterior en el mismo equipo.
- Icono de la app (`public/icons/icon.svg`, mipmaps de Android) y `ic_launcher` siguen en el teal anterior: decidir si se pasan a la paleta pastel antes de la ficha.
- 8 vulnerabilidades solo de desarrollo (cadena de lint `braces` sin versión parcheada; `uuid` vía `@capacitor/cli`/xcode). Producción: 0.
- Monitoreo de fallos del job `daily-soft-delete-purge` (`cron.job_run_details`) por definir en producción.
- `STREAK_BENEFIT_ENABLED` en `constants.ts` queda apagado a propósito (decisión de producto). Se eliminaron `STREAK_MILESTONES` (los hitos viven en `rewards/catalog.ts`) y `UNDO_WINDOW_MS` (deshacer no tiene límite de tiempo, WCAG 2.2.1).

## Versiones

| Versión | Fecha | Qué es | Estado |
|---|---|---|---|
| 0.1.0 | 2026-10-12 | Web + PWA + Android modo remoto | Histórico (`main` hasta `2b69f8d`) |
| 0.2.0 | 2026-10-17 | Fase 8 completa, interfaz empaquetada en el APK, versión única (`versionCode` 200) | APK debug de pruebas; Release en GitHub pendiente de `gh auth login` (BLOCKERS R1) |
| 1.0.0 | — | Primera subida a Google Play | Requiere validación médica, dominio, API https, firma de Play y migración S-D1 |

SIGUIENTE: desplegar la web con dominio HTTPS y variables de producción → `npm run build:android` → primera subida a Google Play (pista interna) → huella de Play App Signing en `ANDROID_SHA256_FINGERPRINT`.

- [x] Super prompt final (2026-10-12): primer arranque con Artiko, una bienvenida, consentimiento antes del perfil (Ley 29733), una pregunta por pantalla y modo invitado con oferta desde Hoy (`7a3ebdc`); paleta pastel clara con tinta oscura, botón sin relieve 3D, sin degradados, Artiko con colores fijos y prueba de que ningún pastel se parece al semáforo (`deb6292`); cabeceras de seguridad (`bc5116e`); barrido de frases prohibidas en todo el texto visible (`e82f47b`); objetivos de 48 px (`89462bc`); `docs/PLAY-CHECKLIST.md` y `docs/PLAY-LISTING.md` (`3a53b1f`). tsc OK, eslint 0, vitest 137 archivos · 1505/1505, E2E 31/31, `next build` OK, `npm audit --omit=dev` 0, Lighthouse móvil A11y 100 en `/`, `/app`, `/test`.
- [x] Super prompt terminal (2026-10-12): letra sin parpadeo al abrir (`3d2277a`), lectura fácil con "Muy grande" (`237bb8b`), E2E del flujo diario (`67633e4`), "Tu siguiente paso" no ofrece la toma de 21:30 antes de su hora (`f6837a6`). Contraste oscuro AA verificado (textos secundarios ≥ 6.7:1). Lighthouse móvil `/`, `/app`, `/test`: A11y 100, BP 100, SEO 100, CLS ≤ 0.021. vitest 1166/1166, E2E 30/30, `npm audit --omit=dev` 0. Pendiente: prueba en teléfono (Fase 2).
- [x] V1–V7 rediseño clínico-amable (2026-10-11): primitivas shadcn base-nova, profundidad ambiental, una sola familia de iconos, Z-score sin cifra protagonista; vitest 943/943, E2E 17/17, Lighthouse A11y 100 (`9c6f930` `0c52296` `47cae74`).
- [x] Despliegue documentado en `docs/DEPLOY.md`; keystore y artefactos de release en `docs/MOBILE.md` (`cfaeef9` `48b0a62`).
