# Super prompt para Claude Code en tu PC (terminal)

Ábrelo en la carpeta del repo y pega el bloque. Necesita en tu PC: Node, Git, Android Studio (SDK + JBR) y el teléfono con depuración USB.

```
Actúa como Staff Engineer en CQPHARMAAPPVIRAL (Artikare). Misión: dejar la app terminada, perfeccionada y subida, yendo directo al código. Sin re-auditar lo ya hecho.

LECTURA ÚNICA: CLAUDE.md → src/lib/clinical/constants.ts → docs/DESIGN.md → docs/BLOCKERS.md → docs/MOBILE.md → docs/SUPERPROMPT-UX.md.

FASE 0 — Traer el trabajo pendiente
1. git status y git log --oneline -5. Si existe docs/patches/, aplica: git am docs/patches/*.patch
   (si falla un parche: git am --abort, resuelve el conflicto a mano y continúa; no pierdas ningún cambio).
2. npm ci · npx tsc --noEmit · npx eslint · npx vitest run · npm run build. Todo debe quedar en verde antes de seguir.

FASE 1 — Terminar y perfeccionar (un bloque a la vez, TDD, commit atómico en español)
Público: 35 a 70 años. Visual, interactivo, muy fácil. Una acción principal por pantalla, botones 3D grandes, letra ajustable, color con icono y texto, contraste AA.
a. Contraste en modo oscuro de textos secundarios (deuda de Lighthouse en docs/ROADMAP.md). Arreglar con tokens y correr src/lib/design.
b. Prueba E2E (Playwright) del flujo diario: abrir → "Tu siguiente paso" → tomar → chequeo → celebrar. Incluir un caso con letra "Muy grande".
c. Modo de lectura fácil: tarjetas con menos texto y iconos más grandes cuando el tamaño de letra es "Muy grande".
d. Evitar el parpadeo del tamaño de letra al abrir: aplicar data-text-size antes de hidratar sin romper CSP ni hidratación.
e. Lighthouse móvil en /, /app y /test: Accesibilidad ≥ 95, sin saltos de diseño.
f. Revisión final: /code-review y /security-review sobre todo el diff; corregir hallazgos reales.

REGLAS CLÍNICAS (prevalecen): prohibido cura/revierte/regenera/repara/elimina el dolor/garantiza ni que un suplemento reemplace al médico; permitido apoya/contribuye/complementa/acompaña. Bandera roja (T ≤ -2.5, fractura previa, dolor ≥ 8 por 3+ días) → CTA reumatológica por encima de todo producto. Nunca mostrar datos que el paciente no registró. Fechas en America/Lima (08:30 y 21:30). La gráfica de dolor no atribuye mejoría a un producto.

FASE 2 — APK de prueba para el teléfono
1. Con el teléfono por USB: npm run mobile:dev (déjalo corriendo) y en otra terminal npm run mobile:install.
   Alternativa sin cable: con la web desplegada en https, CAP_ENV=dev CAP_SERVER_URL=<https-url> npm run cap:sync y luego en android/: gradlew assembleDebug → android/app/build/outputs/apk/debug/app-debug.apk.
2. Prueba en el teléfono: onboarding, Hoy, Pastillero, tamaño de letra, recordatorios, deep links. Anota y corrige lo que falle.

FASE 3 — Subir
1. Última pasada: tsc, eslint, vitest, build, npm audit --omit=dev. Todo en verde.
2. Actualiza docs/ROADMAP.md y docs/BLOCKERS.md con el estado real.
3. git push -u origin main-1hxlqb (con 4 reintentos y espera 2s, 4s, 8s, 16s si es un error de red). No abras un PR salvo que yo lo pida.

NO TE TOCA (sólo lo reportas): iOS, appId final, dominio, huella de Play, revisión legal/clínica, formularios de tiendas. Nunca imprimas secretos ni valores de variables.
Al terminar entrega: qué se hizo, qué pasó en cada candado y qué me falta hacer a mí.
```
