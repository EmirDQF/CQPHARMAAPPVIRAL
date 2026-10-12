# Super prompt final — mascota primero, paleta pastel legible y verificación para Play

Pégalo en Claude Code dentro del repo (terminal local).

```
Actúa como Staff Engineer + Product Designer en CQPHARMAAPPVIRAL (Artikare). Misión: dejar la app lista para Google Play. Ve directo al código; no re-audites lo ya hecho.
LECTURA ÚNICA: CLAUDE.md → src/lib/clinical/constants.ts → docs/DESIGN.md → docs/PLAY-STORE.md → docs/BLOCKERS.md → .claude/rules/masvs.md.

PARTE A — INICIO CON LA MASCOTA (flujo del primer arranque)
Al abrir la app por primera vez: splash con Artiko → Artiko saluda y pide los datos primero → el usuario continúa a "Hoy".
1. Orden obligatorio: splash → UNA bienvenida corta de Artiko ("Hola, soy Artiko, cuéntame de ti") → consentimiento (Ley 29733: NO se capturan datos de salud sin consentimiento explícito previo, y debe poder negarse) → perfil (nombre, edad, sexo, menopausia, antecedente de fractura) → metas/recordatorios → Hoy.
2. Reduce las pantallas de bienvenida a 1 (hoy son varias): quien abre la app debe llegar al formulario en ≤ 2 toques.
3. Artiko sigue visible en cada paso (globo de diálogo con la pregunta actual, emoción acorde). Un campo grande por pantalla, teclado correcto (numérico para edad), validación amable.
4. Si el usuario niega el consentimiento, puede usar la app como invitado (sin respaldo en la nube) y se le vuelve a ofrecer completar su perfil desde Hoy.
5. Tests: orden de pasos, que sin consentimiento no se guarde nada de salud, que el perfil quede guardado, y que se muestre solo una vez.

PARTE B — PALETA PASTEL, CLARA Y MUY LEGIBLE (que no parezca "hecha por IA")
Problema: hoy la capa viva usa colores saturados y botones 3D tipo videojuego; se ve genérico. Meta: clínico, cálido, humano, sereno.
1. Reemplaza los rellenos saturados (vital, streak, xp, gold, sky, pink) por una paleta pastel en tokens.ts + globals.css + DESIGN.md, siempre con TINTA OSCURA encima y contraste AA (4.5:1 texto, 3:1 gráficos) probado en src/lib/design/contrast.test.ts, en claro y en oscuro.
   Base sugerida (ajústala hasta pasar AA): fondo crema #FBF8F3 · superficie #FFFFFF · tinta #1F2A37 · azul clínico #1F4E79 · menta #CDEBDD · cielo #CFE3F5 · lavanda #E0DAF2 · durazno #FBDCC8 · rosa #F8D9E0 · limón #F6EBC0, cada uno con su tinta (#0F3D2E, #123A5C, #3A2F66, #6B2E12, #6B1F36, #5A4608).
2. Botón principal: relleno pastel (menta o cielo) con borde de 2 px más oscuro y tinta oscura; sin relieve 3D exagerado ni degradados brillantes. Mantén ≥ 56 px, foco visible, pulsado con ligera escala.
3. Sin neón, sin degradados morado→azul, sin brillos ni emojis como único elemento gráfico. Ilustraciones y Artiko con trazos suaves; tipografía Nunito, títulos 28–40 px, cuerpo ≥ 18 px, interlineado 1.5.
4. El semáforo OMS (verde/amarillo/rojo) NO se pastelea: conserva su significado y contraste. Ningún color de juego puede repetir un tono del semáforo (la prueba actual lo exige; actualízala).
5. Revisa TODAS las pantallas: landing, test, onboarding, Hoy, Pastillero, Semáforo, Diario de dolor, Ajustes, Citas, Blog, Privacidad. Modo oscuro: superficies profundas suaves (no negro puro), mismos pasteles atenuados con tinta clara.
6. Verifica: vitest (incluye contraste), Lighthouse móvil Accesibilidad ≥ 95, y capturas de las pantallas clave en 3 tamaños de letra (Normal / Grande / Muy grande).

PARTE C — VERIFICACIÓN DE CUMPLIMIENTO PARA PLAY (entrega un informe en docs/PLAY-CHECKLIST.md)
Revisa y marca ✅/⚠️/❌ con evidencia (archivo:línea) cada punto; corrige lo que sea código:
1. Identidad: appId com.artikare.app = capacitor.config.ts = build.gradle; versionCode/versionName; targetSdk vigente que exige Play ⚠️ (confirma).
2. Release seguro: sin cleartext, sin localhost, sin debug en release; firma con keystore; guardias de build:android pasan.
3. Permisos del manifest: solo los necesarios (notificaciones, alarmas exactas si hace falta); sin permisos sensibles injustificados; sin PACKAGE_USAGE_STATS.
4. Privacidad/salud (MASVS + Ley 29733): consentimiento previo y revocable, minimización, exportar/borrar cuenta, sin PII en logs/URLs/localStorage sin necesidad, cabeceras de seguridad, service role solo en servidor, rate limit ARCO, RLS en todas las tablas.
5. Lenguaje clínico: busca frases prohibidas (cura, revierte, regenera, repara, elimina el dolor, garantiza) en TODO el código, la landing, el blog, las notificaciones y los textos de la ficha; el descargo "no reemplaza al médico" presente; bandera roja por encima de cualquier producto.
6. Datos mostrados: nunca un T-score que el usuario no registró; sin datos demo.
7. Accesibilidad: objetivos ≥ 48 px, etiquetas, contraste, tamaño de letra ajustable, prefers-reduced-motion.
8. Material para la consola: genera docs/PLAY-LISTING.md con descripción corta (≤ 80), larga, respuestas sugeridas de Data safety, cuestionario de clasificación y lista de capturas necesarias.
9. App Links: assetlinks.json correcto cuando ANDROID_SHA256_FINGERPRINT esté definido; falla claro si no.

PARTE D — CIERRE
1. tsc · eslint · vitest · next build · npm audit --omit=dev · npm run mobile:verify (se detiene en verify-env si faltan variables de producción: es lo esperado; dilo).
2. Commits atómicos en español; actualiza docs/ROADMAP.md y docs/BLOCKERS.md; git push -u origin main-1hxlqb (reintenta 4 veces con 2s, 4s, 8s, 16s si es de red). No abras PR salvo que yo lo pida.
3. Entrega: qué cambió, resultado de cada candado, y la lista de lo que me falta a mí (cuenta de Play, dominio, huella, revisión legal/clínica, fichas).

NO TE TOCA: iOS, appId final, dominio, huella de Play, revisión legal/clínica, formularios de la consola. Nunca imprimas secretos.
```
