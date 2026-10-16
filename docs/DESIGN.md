# DESIGN — sistema "Clínico sereno" (pastel claro, tinta oscura)

**Tema:** claro por defecto para todos (no sigue al modo oscuro del sistema). El botón sol/luna del encabezado (`ThemeToggle`) cambia a oscuro y lo recuerda (`artikare_theme_v1`); `globals.css` pinta el oscuro con `html[data-theme="dark"]` y la variante `dark:` de Tailwind sigue ese atributo.

**Sonidos (`src/lib/feedback/sounds.ts`):** tonos propios sintetizados con Web Audio (sin archivos ni melodías de terceros): `tap` al tocar un botón, `success` al anotar una toma o guardar el chequeo, `complete` al cumplir una misión, `celebrate` en la meta del día, un desbloqueo y el final del primer arranque, `gentle` al deshacer o fallar el quiz. Cortos (≤ 0,8 s) y a volumen bajo; se apagan en Ajustes.

Fuente de verdad: `src/lib/design/tokens.ts`. `src/app/globals.css` declara exactamente esos valores (claro y oscuro) y `src/lib/design/contrast.test.ts` falla si un valor no coincide, si un par texto/fondo baja de AA (4.5:1 texto, 3:1 gráficos y bordes de controles) o si un color decorativo se parece a uno del semáforo (ΔE CIE76 < 10). Los componentes usan solo utilidades de Tailwind (`bg-pastel-mint`, `text-clinic`, …), nunca hex sueltos.

Meta visual: clínico, cálido, humano y sereno. Sin neón, sin rellenos saturados, sin degradados ni brillos, sin relieve 3D.

## Tokens

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `canvas` / `surface` | `#FBF8F3` (crema) / `#FFFFFF` | `#141A22` / `#1C2430` | Fondo de página / tarjetas. En oscuro, superficies profundas suaves, nunca negro puro |
| `ink` / `muted` | `#1F2A37` / `#5B6573` | `#E8EDF2` / `#A7B2BE` | Texto / texto secundario |
| `line` | `#E7E1D7` | `#2E3946` | Bordes neutros |
| `clinic` | `#1F4E79` | `#9CC3E8` | Azul clínico: títulos, enlaces, navegación, foco |
| `action` + `action-ink` + `action-edge` | `#C9E8E4` + `#0F3D2E` + `#3F8A7E` | `#234640` + `#C9E8E4` + `#6DB8AA` | Botón principal (`btn-primary`); `action-hover` al pasar el puntero |
| `progress` | `#3F8A7E` | `#6DB8AA` | Anillos y barras de gráficas (≥ 3:1) |
| `risk-*` | sin cambios | sin cambios | Semáforo OMS y bandera roja: **no se pastelizan** |

Pasteles, cada uno con su tinta (`-ink`, texto AA encima y sobre la tarjeta) y su borde (`-edge`, ≥ 3:1 sobre tarjeta y lienzo):

| Pastel | Claro (relleno / tinta / borde) | Oscuro (relleno / tinta / borde) |
|---|---|---|
| `mint` | `#C9E8E4` / `#0F3D2E` / `#3F8A7E` | `#234640` / `#C9E8E4` / `#6DB8AA` |
| `sky` | `#CFE3F5` / `#123A5C` / `#4F86B8` | `#213A52` / `#CFE3F5` / `#78A9D6` |
| `lavender` | `#E0DAF2` / `#3A2F66` / `#8273B8` | `#312C4A` / `#E0DAF2` / `#A193D6` |
| `peach` | `#FBDCC8` / `#6B2E12` / `#C0703F` | `#4A3022` / `#FBDCC8` / `#D99467` |
| `rose` | `#EED3E6` / `#6B1F36` / `#B5679A` | `#46293A` / `#EED3E6` / `#CF8CB3` |
| `lemon` | `#F1EBD6` / `#5A4608` / `#8F8045` | `#3D3826` / `#F1EBD6` / `#C2B27A` |

Ajustes respecto de la base sugerida (para no confundirse con el semáforo, ΔE ≥ 10): menta `#CDEBDD` → `#C9E8E4` (se parecía al fondo verde "Normal"), rosa `#F8D9E0` → `#EED3E6` (fondo rojo), limón `#F6EBC0` → `#F1EBD6` (fondo amarillo "Osteopenia").

Forma: `rounded-card` (20 px) y `rounded-control` (16 px), `shadow-soft` muy tenue. Movimiento: 150–250 ms, siempre `motion-safe:`; `prefers-reduced-motion` lo anula globalmente. Foco: `:focus-visible` de 3 px en azul clínico para todo control.

## Capa viva (Artiko)

Los tonos de juego **son alias de la paleta pastel** (`GAME_TONE_PASTEL` en `tokens.ts`), en claro y en oscuro: `vital` = menta, `streak` = durazno, `xp` = lavanda, `gold` = limón, `sky` = cielo, `pink` = rosa. Cada uno trae relleno (`bg-vital`), tinta (`text-vital-ink`, también `-text` sobre tarjeta) y borde (`border-vital-deep`). No hay rellenos saturados propios: la prueba falla si `globals.css` declara un hex para un tono de juego.

Artiko se dibuja con la paleta clara fija (también en modo oscuro, para que se reconozca igual) y contorno suave `#2B3A4A` (`--color-clinic-deep`), nunca negro puro.

**Tipografía:** Nunito (redondeada) servida por `next/font` desde el propio dominio. Títulos de pantalla 28–40 px (`text-[1.75rem]` a `text-[2.5rem]`); cuerpo ≥ 18 px (`text-lg`) con interlineado 1.5; etiquetas en mayúsculas pueden ir a 16 px.

**Botón pastel (`GameButton` / `gameButtonClasses`):** relleno pastel, borde de 2 px en el tono `-deep` y tinta oscura; `rounded-control`, ≥ 48 px (`md`) y ≥ 56 px en los principales (`lg`, `xl`). Al pulsar, `press-scale` (escala 0.97) sin mover el resto de la pantalla (CLS 0). Fuera de la capa viva, el botón principal usa la utilidad `btn-primary` (menta + borde + tinta). Vibra con `@capacitor/haptics` en la app o `navigator.vibrate` en la web, salvo que se apague en Ajustes → "Vibración, sonidos y celebraciones". Cada toque suena con un "pop" suave. Deshabilitado = `aria-disabled` + motivo visible.

Emojis: solo acento visual junto a un texto, con `aria-hidden="true"`; nunca como único elemento gráfico (los indicadores usan iconos de lucide).

## Reglas de uso

1. Un pastel nunca es color de texto ni de barra sobre blanco: va de fondo con su `-ink` encima; para trazos y barras, su `-edge`.
2. Clases literales: Tailwind no genera `bg-pastel-${tone}`; usa un mapa (`src/components/rewards/toneClasses.ts`).
3. ¿Un par nuevo de colores? Agrégalo a `CONTRAST_PAIRS` en `tokens.ts` y corre `npx vitest run src/lib/design`.
4. Bandera roja y CTA reumatológica siempre por encima de cualquier producto o recompensa.
5. Objetivos táctiles ≥ 48 px (los botones principales, ≥ 56 px). Cuerpo ≥ 18 px.
6. Contenido que depende del celular (racha, hora) no va en el HTML prerenderizado: se reserva el mismo alto (sin saltos de diseño) y se pinta al hidratar.

## Agregar una recompensa en 3 pasos

1. Abre `src/lib/rewards/catalog.ts` y añade un objeto: `id` (minúsculas y guiones, único), `title` (≤ 40), `description` (≤ 140), `rule`, `illustration` y `tone`. Reglas posibles: `streak` (racha con días de gracia), `completeDays` (días completos acumulados), `longestRun`, `checkInDays`, `monthlyCheckIn`, `returnAfterBreak`. Solo constancia: nunca resultados clínicos ni compras.
2. Escribe el copy con verbos permitidos ("acompaña", "apoya") y sin culpa. Zod lo rechaza al cargar si tiene una frase prohibida o un id repetido.
3. Corre `npx vitest run src/lib/rewards`: si pasa, la vitrina y la celebración lo muestran sin tocar componentes. Para un catálogo remoto, crea otro adaptador de `RewardCatalogRepository` (`src/lib/rewards/repository.ts`) que use `parseCatalogOrFallback`.

El progreso vive en `artikare_rewards_v1` (versionado, con migración), solo en el celular y dentro de "exportar/borrar mis datos" (ARCO). No guarda datos clínicos.

## Mi salud, Aprender y Jugar (2026-10-16)

Mismo sistema: pastel claro, tinta oscura, sin relieve 3D ni degradados, objetivos ≥ 48 px, texto ≥ 18 px (salvo pies de fuente de 16 px). La riqueza visual sale de tarjetas, barras y anillos animados, insignias e ilustraciones SVG propias.

- **Navegación inferior (5):** Mi día · Mi salud · Aprender · Jugar · Médico. "Pastillero" y "Progreso" pasan a Mi día / Mi salud; "Logros" vive al final de Jugar.
- **Mi salud** (`dashboard/health/`): una sola "Tu siguiente paso" (`pickNextBestAction`, bandera roja primero, en rosa con borde de riesgo), Semáforo Óseo o "Sin densitometría registrada", `ProgressRing` (tomas 7/30 días, racha, nivel), dolor 7/30 días y rigidez de 30 días **solo con lo registrado**, citas y tratamiento. Esqueleto de carga mientras no hay hora real.
- **`ProgressRing`** (`ui/`): SVG propio, tonos `vital`/`sky`/`streak`/`xp`, `role="img"` con el valor completo.
- **Aprender** (`learn/`): tarjetas de lección con emoji en círculo lavanda, barra de lecciones leídas, hoja inferior con idea clave en menta y "Preguntar a mi médico" en cielo; descargo siempre visible.
- **Jugar** (`games/`): `GameFrame` (volver, avance sin reloj, Artiko reaccionando), `ChoiceRoundGame` reutilizable (Mito, Escudo, Quiz), Plato, Casa segura (ilustración `HomeIllustration` con tokens `fill-*`) y Memoria. Explicación en cielo tras cada respuesta, con su fuente.
- **Recompensas:** `LearningRewardModal` (Artiko celebrando, chip `+N XP` en `xp`, insignias nuevas en `gold`, mensaje cálido). Cofre del día en `gold`. Accesorio nuevo de Artiko: `medal` (medalla del saber).
- **Sonidos** (`lib/feedback/sounds.ts`): `correct`, `softError` (grave, seno, volumen ≤ 0.08), `fanfare` (~1.5 s), `streak`, `chest`. Solo tras un toque; botón "Sonidos" en la cabecera = mismo interruptor de Ajustes.
- **Movimiento:** todo pasa por transiciones cortas; con `prefers-reduced-motion` la regla global anula animaciones (verificado: el pulso de Casa segura pasa de 2 s a 0.00001 s).
