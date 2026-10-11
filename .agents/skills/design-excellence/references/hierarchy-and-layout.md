# Jerarquía médica y composición

## Anatomía de una tarjeta clínica (de arriba abajo)

1. **Etiqueta de contexto** — `text-sm text-muted` ("Tu última densitometría · 15 ago").
2. **Dato principal** — una cifra o estado, `text-3xl font-semibold`; cifras
   en `font-mono tabular-nums`.
3. **Interpretación** — badge de estado (color + icono + texto) y una frase
   en lenguaje llano, `text-base text-ink`.
4. **Siguiente paso** — un único `Button size="touch"`; acciones secundarias
   como `variant="ghost"` o enlace `text-clinic`.
5. **Descargo / fuente** — `text-xs text-muted` al pie cuando aplique.

Una tarjeta = una idea. Si necesita dos CTAs principales, son dos tarjetas.

## Orden de pantalla (dashboard y resultado del test)

```
[Bandera roja + CTA evaluación reumatológica]   ← solo si aplica, siempre primero
[Resultado: semáforo / edad articular + descargo]
[Acción del día: check-in, pastillero]
[Progreso y recompensas]
[Productos / reposición]                         ← nunca por encima de lo anterior
```

## Tipografía Geist

| Rol | Clases |
|---|---|
| Título de pantalla | `text-2xl font-semibold tracking-tight text-clinic` |
| Título de tarjeta | `text-lg font-semibold text-ink` |
| Dato clínico | `font-mono text-3xl font-semibold tabular-nums` |
| Cuerpo | `text-base leading-relaxed text-ink` (≥ 16 px) |
| Secundario | `text-sm text-muted` |

`text-balance` en titulares y `text-pretty` en párrafos. Ancho de lectura
≤ `max-w-prose`.

## Espaciado y forma

- Ritmo en múltiplos de 4: interior de tarjeta `p-5`/`p-6`, entre tarjetas `gap-4`.
- `rounded-card` (20 px) para tarjetas, `rounded-control` (16 px) para
  controles grandes, `shadow-soft` como única sombra.
- Gutter móvil 16 px; sin scroll horizontal a 375 px.

## Estados vacíos y de error

- Vacío = invitación con una acción: "Sin densitometría registrada" +
  "Sube tu informe". Nunca datos de ejemplo que parezcan reales.
- Error = qué pasó + qué hacer, en tono sin culpa; `role="alert"` solo para
  errores que bloquean.

## Iconos

`lucide-react`, `size-5` en controles táctiles, `aria-hidden` cuando hay
texto al lado; botón solo-icono con `aria-label`.
