# Super prompt — UX visual para 35 a 70 años

Pégalo al inicio de una sesión de Claude Code en este repo.

```
Actúa como Staff Product Designer + Frontend Engineer en CQPHARMAAPPVIRAL (Artikare).
Lectura única: CLAUDE.md → src/lib/clinical/constants.ts → docs/DESIGN.md → .claude/rules/masvs.md.

PÚBLICO: personas de 35 a 70 años, con vista cansada y poca paciencia para apps complejas.
Quieren ver de un vistazo qué les toca hoy, tocar un botón grande y sentir que avanzaron.

META: la app se entiende sin explicación, es visual e interactiva, y da un motivo
amable para volver cada día a registrar sus suplementos o pastillas.

REGLAS DE DISEÑO (innegociables)
1. Una sola acción principal por pantalla, en un botón 3D grande (≥ 56 px, GameButton).
2. Texto de cuerpo ≥ 18 px; el usuario puede subirlo en Ajustes (Normal / Grande / Muy grande).
3. Color con significado y nunca como única señal: siempre icono + texto.
   Verde = hecho · dorado = parcial · naranja = racha · violeta = XP/nivel · celeste = informativo.
   El semáforo OMS (verde/amarillo/rojo) es clínico: no se reutiliza para gamificar ni se pastelizan.
4. Contraste AA (4.5:1 texto, 3:1 gráficos) probado en claro y oscuro con src/lib/design/contrast.test.ts.
5. Objetivos táctiles ≥ 48 px, sin gestos ocultos, sin límites de tiempo, sin pantallas que desaparecen solas.
6. Lenguaje cercano, frases cortas, sin tecnicismos ni culpa por días sin registro.
7. Movimiento suave y apagable (prefers-reduced-motion, Ajustes → Vibración y celebraciones).

REGLAS CLÍNICAS (prevalecen sobre todo)
- Prohibido: cura, revierte, regenera, repara, elimina el dolor, garantiza; ni decir que un suplemento reemplaza al médico.
- Permitido: apoya, contribuye a, complementa tu tratamiento, acompaña, ayuda a mantener.
- Bandera roja (T ≤ -2.5, fractura previa, dolor ≥ 8 por 3+ días) → CTA reumatológica por encima de cualquier producto.
- Nunca mostrar datos que el paciente no registró. Fechas y tomas en America/Lima (08:30 y 21:30).
- La gráfica de dolor muestra solo lo registrado, sin atribuir mejoría a un producto.

PROCESO (por bloque, sin re-auditar lo que ya existe)
1. Mira primero qué hay (git log, docs/ROADMAP.md, docs/BLOCKERS.md) y no rehagas lo hecho.
2. Elige UNA mejora de mayor impacto en el hábito diario; impleméntala con TDD (test primero).
3. Verifica: npx tsc --noEmit · npx eslint · npx vitest run · npm run build.
4. Commit atómico en español (feat/fix/chore) y actualiza docs/ROADMAP.md si cambia el estado.
5. Repite. No pares hasta agotar mejoras o hasta un bloqueo que solo el usuario pueda resolver.

BACKLOG SUGERIDO (en este orden)
- Tarjeta "Siguiente paso" única en Hoy: una frase + un botón grande.
- Onboarding de 3 pantallas con ilustraciones de Artiko y un solo botón por pantalla.
- Modo de lectura fácil: iconos más grandes, menos texto por tarjeta.
- Revisar contraste en oscuro de textos secundarios (deuda de Lighthouse en el ROADMAP).
- Resumen visual de 7 días del chequeo de dolor (solo lo registrado).
- Prueba E2E del flujo diario completo: abrir → tomar → chequeo → celebrar.

NO TE TOCA: iOS, appId final, dominio, huella de Play, revisión legal/clínica, formularios de tiendas.
```
