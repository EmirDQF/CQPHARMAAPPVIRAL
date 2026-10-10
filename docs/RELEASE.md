# RELEASE — estado de lanzamiento de Artikare (2026-10-10, HEAD `986eae6`)

## Candados (salida real)

| Candado | Resultado |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npx eslint src e2e capacitor.config.ts` | 0 problemas |
| `npx vitest run` | 75 archivos, 699/699 |
| `npm run test:e2e` (375 px) | 14/14 |
| `npm run test:db` | pgTAP 140/140 · integración 46/46 |
| `npm run build` (Next 16.4.0) | OK |
| `npx cap sync android` | OK |
| Lighthouse móvil, landing (throttling real) | LCP 1.9–2.1 s · Perf 85–88 · A11y 96 · BP 100 · SEO 100 |
| `npm audit` | 0 críticos · 5 HIGH solo en lint (dev) · 3 moderados en CLI de Capacitor (dev, iOS) |

## Listo

- **Test de edad articular** con resultado y descargo; tarjeta compartible con OG.
- **Semáforo óseo OMS** (peor T-score; -2.5 exacto = osteoporosis; Z-score en menores) y bandera roja con CTA reumatológica por encima de productos.
- **Pastillero** 08:30/21:30 Lima con racha; **diario de dolor y rigidez**; reposición por frasco.
- **Citas** por RPC con límite por hora; el WhatsApp lleva solo el código.
- **Cuenta y respaldo** (Supabase, OTP por correo, Turnstile) **encendidos**; outbox sin pérdida.
- **ARCO** en Ajustes: exportar, rectificar, borrar (cascada + cierre de sesión + limpieza local, con CSRF por mismo origen) y oponerse.
- **PWA**: manifest con iconos 192/512 y maskable, `sw.js` que nunca cachea `/api`, RSC ni `no-store`; robots y sitemap.
- **Android (Capacitor 8, modo remoto)** con recordatorios nativos de toma en hora de Lima y texto genérico.

## BLOQUEADO / lo hace el usuario

| Ítem | Acción |
|---|---|
| iOS | Sin macOS en este equipo (ver `docs/BLOCKERS.md` B1). |
| `appId` y dominio | Confirmar `com.artikare.app` y fijar `CAP_SERVER_URL` (B2, B3). |
| Auth en paneles | Checklist 8b de `docs/plans/fase-1-supabase.md` (Supabase Auth, SMTP Resend, Turnstile). |
| Legal | Revisión de `/privacidad` (Ley 29733), correo real en `PRIVACY_CONTACT`, plazos de conservación. |
| Clínica | Validación médica de textos, preguntas y algoritmo del test. |
| Tiendas | Cuentas y firma de Google Play (keystore) y App Store; fichas, capturas, formulario de seguridad de datos. |
| Producción | Variables de entorno (Supabase, service role, Resend, Turnstile, WhatsApp, `NEXT_PUBLIC_SITE_URL`), dominio y despliegue. |
| Purga | Programar `purge_expired_soft_deletes()` a diario (pg_cron o Scheduled Function) en el proyecto de producción. |

## Deuda conocida (no bloquea)

- Rate limit en `/api/arco/*`; paquete `server-only` en `src/lib/supabase/admin.ts`; índices parciales sobre `deleted_at`.
- LCP simulado ("lantern") de Lighthouse ≈ 3.9 s por la evaluación de JS; con throttling real cumple < 2.5 s.
- En la app nativa la oferta de recordatorios vuelve a mostrarse tras reiniciar (el permiso no se lee del SO al abrir); reprogramar es idempotente.
- `braces` (lint) sin versión parcheada publicada; revisar en la próxima actualización de dependencias.
