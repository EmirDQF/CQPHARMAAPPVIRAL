# Material para la Play Console — Artikare

Borrador listo para copiar en la consola. Lo revisa una prueba automática (`src/lib/clinical/copyAudit.test.ts` y `src/lib/playListing.test.ts`): la descripción corta debe tener 80 caracteres como máximo y el texto no puede usar ninguna frase prohibida de `CLAUDE.md` (Reglas clínicas vigentes); solo verbos permitidos ("apoya", "acompaña", "complementa tu tratamiento").
Las reglas de Google Play cambian: confirma en la consola cada punto marcado con ⚠️ antes de enviar.

## Ficha principal de la tienda

**Nombre de la app (≤ 30):** Artikare

**Descripción corta (≤ 80):**

<!-- descripcion-corta -->
Tu semáforo óseo, pastillero y diario de dolor, con Artiko a tu lado.
<!-- /descripcion-corta -->

**Descripción larga:**

<!-- descripcion-larga -->
Artikare te acompaña a cuidar tus huesos y articulaciones día a día, con Artiko, una mascota amable que te recuerda lo importante sin presión.

Qué puedes hacer:
• Semáforo Óseo: registra los T-score de tu densitometría (columna lumbar y cuello femoral) y mira tu resultado traducido a verde, amarillo o rojo según la clasificación de la OMS. Si no registraste una densitometría, la app lo dice tal cual: nunca muestra datos de ejemplo.
• Diario de dolor y rigidez: anota en 10 segundos cómo amanecieron tus articulaciones y mira tu evolución en una gráfica.
• Pastillero: recordatorios de tus tomas a las 08:30 y 21:30 (hora de Lima). El aviso es discreto y no muestra datos de salud en tu pantalla.
• Test orientativo de edad articular: siete preguntas para darte una primera señal y saber si conviene conversar con un especialista.
• Citas: agenda tu densitometría o tu consulta con reumatología.
• Ficha para tu médico: un resumen imprimible de lo que registraste.

Tu privacidad primero:
• Antes de pedirte cualquier dato de salud te pedimos tu autorización (Ley N.º 29733). Si no la das, usas la app como invitado.
• Tus datos se guardan en tu celular. Solo se copian a tu cuenta si la creas y lo autorizas.
• Puedes descargar o borrar tus datos y tu cuenta cuando quieras desde Ajustes.

Importante: Artikare es una herramienta de acompañamiento y educación. No da diagnósticos y no reemplaza a tu médico. Los suplementos CQ Pharma complementan el tratamiento que tu médico indica y apoyan tu salud ósea y articular. Si tienes dolor intenso, una fractura o un resultado de osteoporosis, la app te recomienda primero una evaluación reumatológica.

Artikare · respaldado por el rigor médico de CQ Pharma.
<!-- /descripcion-larga -->

**Categoría:** Medicina ⚠️ (alternativa: Salud y bienestar). **Etiquetas:** salud ósea, recordatorios de medicación, diario de dolor.
**Correo de contacto:** el del responsable del tratamiento (CQ Pharma). **Sitio web:** `https://TU-DOMINIO`. **Política de privacidad:** `https://TU-DOMINIO/privacidad`.

## Seguridad de los datos (Data safety) — respuestas sugeridas

Base: `src/app/privacidad/page.tsx`, `src/lib/sync/domains.ts`, `src/lib/schemas/*`, `supabase/migrations/*`. Sin SDK de analítica, publicidad ni seguimiento (ver `package.json`).

| Pregunta | Respuesta sugerida |
|---|---|
| ¿La app recopila o comparte datos de los tipos requeridos? | **Sí** (solo si la persona crea una cuenta, autoriza el respaldo o agenda una cita) |
| ¿Todos los datos se cifran en tránsito? | **Sí** (HTTPS/TLS; el release no admite cleartext) |
| ¿Se puede solicitar el borrado de los datos? | **Sí**: en la app (Ajustes → Borrar mi cuenta y mis datos) y por la URL de borrado de cuenta |
| ¿Se comparten datos con terceros? | **No**. Supabase (base de datos) y Resend (correo de acceso) actúan como proveedores de servicio por cuenta de CQ Pharma ⚠️ (confirma con el abogado) |

| Tipo de dato (categoría de Google) | ¿Se recopila? | Obligatorio u opcional | Para qué |
|---|---|---|---|
| Información personal → Nombre | Sí | Opcional (apodo; nombre del paciente al agendar) | Funcionalidad de la app, gestión de la cuenta |
| Información personal → Correo electrónico | Sí | Opcional (solo para crear cuenta) | Gestión de la cuenta (código de acceso) |
| Información personal → Número de teléfono | Sí | Opcional (solo al agendar una cita) | Funcionalidad de la app (confirmar la cita) |
| Salud y actividad física → Información de salud | Sí | Opcional (respaldo autorizado) | Funcionalidad de la app: densitometría, dolor, tomas, edad, sexo, menopausia, fracturas |
| Ubicación, contactos, fotos, mensajes, audio, archivos, historial web | No | — | — |
| Actividad en la app, IDs de dispositivo o de publicidad, diagnósticos de fallos | No | — | — |

Datos que **nunca** salen del celular: progreso del juego de Artiko (`artikare_game_v1`), preferencias de letra, vibración y recordatorios.

## Cuestionario de clasificación de contenido (IARC) — respuestas sugeridas

- Categoría: **Referencia, noticias o educación** / app de salud ⚠️ (elige la que ofrezca la consola).
- Violencia, miedo, sexualidad, lenguaje soez, drogas, alcohol o tabaco: **No**.
- Juegos de azar o apuestas simuladas: **No** (las recompensas son solo cosméticas, no se compran).
- Interacción entre usuarios o contenido generado por usuarios: **No**.
- Comparte la ubicación del usuario: **No**. Compras digitales dentro de la app: **No**.
- Resultado esperado: apta para todo público; el público objetivo declarado es **adultos (35+)**, no niños.

## Otras declaraciones de "Contenido de la app"

- **Apps de salud** ⚠️: declarar que gestiona datos de salud personal y recordatorios de medicación; no es un dispositivo médico ni diagnostica.
- **Eliminación de cuenta**: ruta en la app (Ajustes → Borrar mi cuenta y mis datos) + URL pública: `https://TU-DOMINIO/app/ajustes` (la misma pantalla en la web; también enlaza la política en `/privacidad`).
- **Anuncios**: no contiene. **Acceso a la app**: sin restricción (modo invitado; la cuenta es opcional).
- **Permisos**: notificaciones (`POST_NOTIFICATIONS`) y alarmas exactas (`SCHEDULE_EXACT_ALARM`) para recordar las tomas a hora fija; reinicio (`RECEIVE_BOOT_COMPLETED`) para reprogramarlas.

## Recursos gráficos necesarios

| Recurso | Tamaño | Estado |
|---|---|---|
| Icono de la app | 512 × 512 PNG (32 bits, sin transparencia) | ✅ `docs/play-assets/icono-512.png` (hueso azul clínico sobre menta, sin transparencia; lo genera `npm run generate:android-assets`) |
| Gráfico de funciones | 1024 × 500 PNG/JPG | ✅ `docs/play-assets/grafico-funciones-1024x500.png` (lienzo crema, círculo menta con el hueso y acentos pastel; sin texto, así no hay copy clínico que revisar) |
| Capturas de teléfono | 2 a 8, 16:9 o 9:16, lado mínimo 320 px | Generar con `CAPTURAS=1 npx playwright test e2e/capturas.spec.ts` (paleta final) y elegir: bienvenida de Artiko, Hoy, Pastillero, Semáforo Óseo (con una densitometría registrada por ti, nunca inventada), Logros, Ajustes de privacidad |
| Capturas de tableta 7" y 10" | Opcional | No aplica por ahora |
