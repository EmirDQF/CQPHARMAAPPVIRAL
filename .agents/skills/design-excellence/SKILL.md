---
name: design-excellence
description: Diseño de interfaz de alta estética y jerarquía médica clara para Artikare (Next.js 16, Tailwind CSS v4, shadcn/ui base-nova sobre Base UI, Geist). Úsala al crear o revisar cualquier componente, pantalla, tarjeta, CTA, gráfica o microinteracción en src/components o src/app, y al tocar globals.css o src/lib/design/tokens.ts.
license: CC-BY-4.0
metadata:
  adapted_from: github.com/rebelytics/one-skill-to-rule-them-all (task-observer, Eoghan Henn and contributors, CC BY 4.0)
  adaptation: "Se tomaron sus principios de método (núcleo breve + referencias bajo demanda, registrar las propias violaciones, segunda violación => barrera estructural). Las reglas de diseño son propias de este proyecto."
---

# Design Excellence — Artikare "Clínico amable"

Una pantalla de salud tiene una sola pregunta que responder primero: **¿qué
significa esto para mí y qué hago ahora?** La estética sirve a esa respuesta;
nunca compite con ella.

## Fuentes de verdad (leer antes de diseñar)

| Qué | Dónde | Regla |
|---|---|---|
| Reglas clínicas, semáforo OMS, frases prohibidas | `CLAUDE.md` y `src/lib/clinical/constants.ts` | Mandan sobre cualquier decisión estética |
| Tokens de color, forma, movimiento | `src/lib/design/tokens.ts` + `docs/DESIGN.md` | Solo utilidades Tailwind de token, nunca hex sueltos |
| Contraste AA | `src/lib/design/contrast.test.ts` | Par nuevo => `CONTRAST_PAIRS` + `npx vitest run src/lib/design` |
| Primitivas | `src/components/ui/*` (shadcn base-nova, `@base-ui/react`) | Extender con variantes `cva`, no reescribir |

## Referencias — cargar bajo demanda, no al inicio

- `references/hierarchy-and-layout.md` — jerarquía médica, orden de CTAs,
  tipografía Geist, espaciado, estados vacíos. **Cargar al diseñar o
  reordenar una pantalla o tarjeta.**
- `references/microinteractions.md` — duraciones, easing, estados de
  botón/toque, feedback de acciones, reduced-motion, CLS. **Cargar al añadir
  animación, transición o feedback de una acción.**

## Las 10 reglas del núcleo

1. **Jerarquía clínica primero.** Orden visual = orden de importancia:
   bandera roja / CTA reumatológica > resultado (semáforo) > acción diaria >
   producto/recompensa. Ningún CTA de producto por encima de una bandera roja.
2. **El semáforo no se estetiza.** `risk-*` nunca se pasteliza, degrada ni
   anima de forma lúdica. Color + texto + icono siempre (nunca solo color).
   Sin densitometría: "Sin densitometría registrada", jamás un valor de ejemplo.
3. **Contraste AA verificable.** Texto ≥ 4.5:1, gráficos/bordes de control
   ≥ 3:1. Un pastel es fondo y lleva su `-ink`; nunca texto pastel sobre blanco.
4. **Regla 60/30/10.** `canvas`/`surface` 60 %, `clinic` 30 % (títulos,
   navegación), `action-strong` 10 % (una sola acción principal por vista).
5. **Táctil y legible.** Objetivos ≥ 44 px: acciones principales con
   `size="touch"` (48 px) o `size="xl"` (56 px) de `Button`; los tamaños
   `default`/`sm`/`icon` (28–32 px) solo en zonas densas secundarias con área
   táctil ampliada. Cuerpo ≥ 16 px (`text-base`).
6. **Geist con intención.** `font-sans` (Geist) para todo; `font-mono`
   (Geist Mono) + `tabular-nums` solo para cifras clínicas (T-score, horas,
   dosis) para que no "bailen". Máx. 3 tamaños por tarjeta.
7. **Movimiento con propósito.** 150–250 ms, `ease-out` al entrar, siempre
   prefijado `motion-safe:`. Nada de movimiento en resultados clínicos.
8. **Cero saltos de diseño.** Lo que depende del dispositivo (racha, hora,
   datos locales) reserva su alto en el HTML prerenderizado.
9. **Accesible por construcción.** HTML semántico, foco visible (3 px
   `clinic` global), etiquetas en todo input, `aria-live="polite"` para
   confirmaciones, orden de foco = orden visual.
10. **Copy clínico permitido.** Verbos "apoya", "acompaña", "complementa tu
    tratamiento". Ninguna frase de cura/reversión en titulares, badges ni
    tooltips. Todo resultado del test lleva su descargo.

## Flujo de trabajo

1. Leer la pantalla existente y las fuentes de verdad de arriba.
2. Cargar la referencia que corresponda a la tarea.
3. Implementar con tokens y primitivas existentes; variante nueva => `cva`.
4. Verificar: `npx vitest run src/lib/design`, revisión a 375 px, teclado,
   modo oscuro y `prefers-reduced-motion`.
5. Checklist de entrega (abajo) antes de declarar terminado.

## Aplicar las reglas (método heredado de task-observer)

- **Registra tus propias violaciones.** Si rompes una regla de esta skill o
  de `docs/DESIGN.md`, dilo en el mismo turno; es la única evidencia de que
  su protección es débil.
- **Segunda violación de la misma regla => barrera, no más texto.** No
  reescribas la regla más fuerte: propón un test (como `contrast.test.ts`),
  una regla de lint o una variante por defecto que impida el error.
- **Núcleo breve.** Lo detallado vive en `references/`; si una sección del
  núcleo crece, muévela a una referencia.

## Checklist de entrega

- [ ] Orden visual respeta la jerarquía clínica (regla 1)
- [ ] Sin hex sueltos; pares nuevos añadidos a `CONTRAST_PAIRS` y test verde
- [ ] Una sola acción principal por vista, ≥ 48 px
- [ ] Estados: reposo, hover, `focus-visible`, activo, deshabilitado, cargando, vacío, error
- [ ] `motion-safe:` en toda animación; nada se mueve en el semáforo
- [ ] Sin CLS en contenido dependiente del dispositivo
- [ ] Probado a 375 px, claro/oscuro, solo teclado
- [ ] Copy sin frases prohibidas; descargo presente donde aplica
