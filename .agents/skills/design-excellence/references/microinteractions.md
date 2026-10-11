# Microinteracciones pulidas

## Presupuesto de tiempo

| Tipo | Duración | Easing |
|---|---|---|
| Hover / cambio de color | 150 ms | `ease-out` |
| Presión (scale 0.98) | 100–150 ms | `ease-out` |
| Entrada de tarjeta / hoja | 200–250 ms | `ease-out` (`animate-fade-in`) |
| Salida | ~150 ms (más corta que la entrada) | `ease-in` |
| Celebración (confeti) | piezas de 150–250 ms escalonadas | solo en logros de constancia |

Todo con `motion-safe:`; `globals.css` ya anula el movimiento con
`prefers-reduced-motion`. Animar solo `opacity` y `transform`.

## Estados de un control

`Button` ya trae `focus-visible:ring-3`, `active:scale-[0.98]` y
`disabled:opacity-50`. Al extenderlo:

- **Cargando**: mantener el ancho, cambiar el texto ("Guardando…"),
  `aria-busy`, deshabilitar el doble envío.
- **Éxito**: confirmación en el mismo lugar del gesto (check + texto) y
  `aria-live="polite"`; no navegar automáticamente.
- **Toque**: feedback < 100 ms; si la acción tarda, mostrar estado optimista.

## Feedback clínicamente seguro

- Tomar una dosis / check-in: micro-celebración suave permitida.
- Resultados clínicos (semáforo, T-score, bandera roja): **sin** animación
  lúdica, sin confeti, sin contadores que "suben". Aparecen estáticos.
- Recompensas premian constancia, nunca resultados clínicos ni compras.

## Estabilidad

- Skeletons con el mismo alto que el contenido final.
- Contenido dependiente del dispositivo: reservar alto (`min-h-*`) y pintar
  al hidratar.
- Hojas inferiores / diálogos: foco al abrir, `Escape` cierra, foco vuelve
  al disparador (las primitivas de Base UI lo resuelven).
