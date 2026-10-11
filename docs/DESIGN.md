# DESIGN — sistema "Clínico amable"

Fuente de verdad: `src/lib/design/tokens.ts`. `src/app/globals.css` declara exactamente esos valores (claro y oscuro) y `src/lib/design/contrast.test.ts` falla si un valor no coincide o si un par texto/fondo baja de AA (4.5:1 texto, 3:1 gráficos). Los componentes usan solo utilidades de Tailwind (`bg-pastel-mint`, `text-clinic`, …), nunca hex sueltos.

## Tokens

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `canvas` / `surface` | `#F8FAFC` / `#FFFFFF` | `#0B1220` / `#111A2E` | Fondo de página / tarjetas (60 %) |
| `ink` / `muted` | `#0F172A` / `#64748B` | `#E2E8F0` / `#94A3B8` | Texto / texto secundario |
| `line` | `#E2E8F0` | `#1E293B` | Bordes |
| `clinic` | `#0F4C81` | `#7DB7E8` | Títulos, enlaces, navegación (30 %) |
| `action-strong` + `on-action-strong` | `#0F766E` + blanco | igual | Botón principal (10 %) |
| `action` + `action-ink` | `#14B8A6` + `#042F2E` | `#2DD4BF` + `#042F2E` | Solo rellenos con su tinta |
| `progress` | `#0F766E` | `#2DD4BF` | Anillos y barras de gráficas |
| `pastel-{mint,sky,lavender,peach,rose,lemon}` + `-ink` | ver tokens.ts | ver tokens.ts | Fondos de tarjetas, gráficas e insignias, **siempre con su tinta** |
| `risk-*` | sin cambios | sin cambios | Semáforo OMS y bandera roja: **no se pastelizan** |

Forma: `rounded-card` (20 px) y `rounded-control` (16 px), `shadow-soft`. Movimiento: 150–250 ms (`animate-fade-in`, `animate-confetti`), siempre `motion-safe:`; `prefers-reduced-motion` lo anula globalmente. Foco: `:focus-visible` de 3 px en azul clínico para todo control.

## Reglas de uso

1. Un pastel nunca es color de texto sobre blanco: va de fondo y lleva su `-ink` encima.
2. Clases literales: Tailwind no genera `bg-pastel-${tone}`; usa un mapa (`src/components/rewards/toneClasses.ts`).
3. ¿Un par nuevo de colores? Agrégalo a `CONTRAST_PAIRS` en `tokens.ts` y corre `npx vitest run src/lib/design`.
4. Bandera roja y CTA reumatológica siempre por encima de cualquier producto o recompensa.
5. Objetivos táctiles ≥ 44 px (los botones principales usan 48–56 px). Cuerpo ≥ 16 px.
6. Contenido que depende del celular (racha, hora) no va en el HTML prerenderizado: se reserva el mismo alto (sin saltos de diseño) y se pinta al hidratar.

## Agregar una recompensa en 3 pasos

1. Abre `src/lib/rewards/catalog.ts` y añade un objeto: `id` (minúsculas y guiones, único), `title` (≤ 40), `description` (≤ 140), `rule`, `illustration` y `tone`. Reglas posibles: `streak` (racha con días de gracia), `completeDays` (días completos acumulados), `longestRun`, `checkInDays`, `monthlyCheckIn`, `returnAfterBreak`. Solo constancia: nunca resultados clínicos ni compras.
2. Escribe el copy con verbos permitidos ("acompaña", "apoya") y sin culpa. Zod lo rechaza al cargar si tiene una frase prohibida o un id repetido.
3. Corre `npx vitest run src/lib/rewards`: si pasa, la vitrina y la celebración lo muestran sin tocar componentes. Para un catálogo remoto, crea otro adaptador de `RewardCatalogRepository` (`src/lib/rewards/repository.ts`) que use `parseCatalogOrFallback`.

El progreso vive en `artikare_rewards_v1` (versionado, con migración), solo en el celular y dentro de "exportar/borrar mis datos" (ARCO). No guarda datos clínicos.
