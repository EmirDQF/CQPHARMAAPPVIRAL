# Auditoría de interactividad (G8, 2026-10-11)

Prueba automática: `e2e/interactivity.spec.ts` (Playwright, 375 px). Falla si en `/`, `/acceso`, `/citas`, `/blog`, `/privacidad`, `/app`, `/app/ajustes` o `/app/reporte-medico` aparece:

- un control visible **sin nombre accesible**;
- un enlace a `#`, vacío o `javascript:`, o un enlace interno que no responda < 400;
- un control **deshabilitado sin motivo visible** enlazado por `aria-describedby`;
- un botón habilitado que **no produce efecto** al tocarlo (se prueba cada uno en una página recién cargada: cambio en la página, navegación, diálogo, desplazamiento/foco, compartir, imprimir o ventana nueva). Un conmutador ya activo (`aria-pressed="true"`) no cuenta como muerto;
- un **foco invisible** al tabular por `/app`.

Estado pulsado: todos los `GameButton` usan `pressable-3d` (baja 4 px y escala 0.96); los controles previos tienen `active:scale-*`. Foco: `:focus-visible` de 3 px azul clínico en `globals.css`.

## Hallazgos y correcciones

| Hallazgo | Corrección |
|---|---|
| `/blog` respondía 404 (solo existía `/blog/[slug]`), aunque los deep links aceptan `/blog`. | Nuevo índice `src/app/blog/page.tsx` + sitemap. |
| Burbuja de WhatsApp **deshabilitada** cuando no hay número configurado (control muerto en todas las páginas públicas). | Sin número no se muestra nada (`WhatsAppFloatingButton`). Los CTA de WhatsApp en línea ya mostraban el motivo visible. |
| "Guardar registro de hoy" deshabilitado sin motivo. | Texto "Elige tu nivel de dolor y la rigidez para guardar." enlazado con `aria-describedby`. |
| Conmutador 7/30 días de 44 px. | 48 px (`min-h-12`). |
| "Lectura N min" en `text-neutral-400` (≈ 2.5:1, no AA). | `text-muted` (AA en lienzo y superficie). |
| Antes de G8: "Acepto y sigo", accesorios con 🔒 y opciones del quiz ya respondido usan `aria-disabled` + motivo visible. | — |

## Primer arranque (cubierto por `e2e/onboarding.spec.ts` y `FirstRunFlow.test.tsx`)

| Pantalla | Elemento | Acción real | Estado |
|---|---|---|---|
| Splash | Toda la pantalla "Toca para continuar" | Salta el splash (si no, avanza solo en 1.5 s) | OK |
| Bienvenida 1 | ¡Vamos! 🎉 | Siguiente pantalla | OK |
| Bienvenida 2 | ¡Me gusta! 💪 | Consentimiento | OK |
| Consentimiento | Casilla de autorización | Habilita "Acepto y sigo" | OK |
| Consentimiento | Leer la Política de Privacidad completa | Abre `/privacidad` en otra pestaña | OK |
| Consentimiento | Acepto y sigo ✅ | Perfil (deshabilitado con motivo hasta marcar la casilla) | OK |
| Consentimiento | Prefiero no dar mis datos | Salta el perfil; va a metas | OK |
| Perfil | Nombre o apodo, fecha de nacimiento, sexo, menopausia | Campos validados con Zod (errores en es-PE) | OK |
| Perfil | Guardar y seguir | Guarda perfil (solo edad) + consentimiento; va a metas | OK |
| Metas | Ligero / Normal / Pro | Elige 3, 5 o 7 misiones al día | OK |
| Metas | 🔔 Activar recordatorios / Ahora no | Pide el permiso del sistema / no lo pide | OK |
| Metas | ¡Listo! 🚀 | Llegada | OK |
| Llegada | Ir a Hoy ☀️ | Marca el primer arranque como hecho y muestra "Hoy" | OK |

## Inventario por ruta (generado de las páginas reales a 375 px, invitado con primer arranque hecho)

Los controles que solo aparecen tras una acción (hojas inferiores de misión, vista previa de compartir, diálogos del perfil, de la densitometría y de borrado) se prueban en sus pruebas de componente (`src/components/today/*.test.tsx`, `Settings.test.tsx`) y en `e2e/smoke.spec.ts`.

| Pantalla | Elemento | Acción real | Estado |
|---|---|---|---|
| `/` | enlace: Artikare, ir al inicio | Navega a / | OK |
| `/` | enlace: Agendar Densitometría | Navega a /citas | OK |
| `/` | botón: Evaluar mi Salud Ósea Gratis | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/` | botón: Reservar por WhatsApp | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | Deshabilitado con motivo visible (aria-describedby) |
| `/` | botón: Reservar por WhatsApp | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | Deshabilitado con motivo visible (aria-describedby) |
| `/` | botón: Reservar por WhatsApp | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | Deshabilitado con motivo visible (aria-describedby) |
| `/` | botón: Reservar por WhatsApp | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | Deshabilitado con motivo visible (aria-describedby) |
| `/` | enlace: Mito vs. EvidenciaLectura 2 minEl mito de la gelatina de pata: por qué | Navega a /blog/mito-gelatina-pata-vs-colageno-hidrolizado | OK |
| `/` | enlace: Mito vs. EvidenciaLectura 2 minTomar calcio por tu cuenta: lo que debe | Navega a /blog/peligro-de-tomar-calcio-solo | OK |
| `/` | enlace: Reto FuncionalLectura 2 minLa prueba de la silla: evalúa tus articulac | Navega a /blog/prueba-de-la-silla-evalua-tus-articulaciones | OK |
| `/` | enlace: Inicio | Navega a / | OK |
| `/` | enlace: Mi Panel | Navega a /app | OK |
| `/` | enlace: Privacidad | Navega a /privacidad | OK |
| `/acceso` | enlace: ← Volver a mi panel | Navega a /app | OK |
| `/citas` | botón: Densitometría Ósea ComputarizadaMedición precisa de tu densidad minera | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/citas` | botón: Consulta con Especialista en ReumatologíaEvaluación clínica completa d | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/citas` | botón: Control Preventivo ArticularRevisión periódica de tu progreso y ajuste | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/blog` | enlace: ← Volver a Artikare | Navega a / | OK |
| `/blog` | enlace: Reto FuncionalLectura 2 minLa prueba de la silla: evalúa tus articulac | Navega a /blog/prueba-de-la-silla-evalua-tus-articulaciones | OK |
| `/blog` | enlace: Mito vs. EvidenciaLectura 2 minTomar calcio por tu cuenta: lo que debe | Navega a /blog/peligro-de-tomar-calcio-solo | OK |
| `/blog` | enlace: Mito vs. EvidenciaLectura 2 minEl mito de la gelatina de pata: por qué | Navega a /blog/mito-gelatina-pata-vs-colageno-hidrolizado | OK |
| `/privacidad` | enlace: ← Volver a Artikare | Navega a / | OK |
| `/app` | botón: Editar mi perfil médico | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | enlace: Ajustes y privacidad | Navega a /app/ajustes | OK |
| `/app` | botón: Registrar | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: Anotar toma | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: Anotar toma | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: Responder | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: Empezar | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: Registrar mi densitometría | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | enlace: Agendar densitometría | Navega a /citas | OK |
| `/app` | botón: Ya me la tomé | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: Ya me la tomé | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: 0 · Sin dolor | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: 1 | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: 2 | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: 3 | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: 4 | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: 5 | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: 6 | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: 7 | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: 8 | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: 9 | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: 10 | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: 0–15 min | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: 15–30 min | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: +30 min | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: Guardar registro de hoy | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | Deshabilitado con motivo visible (aria-describedby) |
| `/app` | botón: 7 días | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: 30 días | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: Invita a tu mamá o papá a hacer el test 💌 | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: 🔒 gorra deportiva | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | Deshabilitado con motivo visible (aria-describedby) |
| `/app` | botón: 🔒 bufanda | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | Deshabilitado con motivo visible (aria-describedby) |
| `/app` | botón: 🔒 lentes | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | Deshabilitado con motivo visible (aria-describedby) |
| `/app` | botón: Mi día | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: Pastillero | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: Progreso | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: Logros | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app` | botón: Médico | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app/ajustes` | enlace: ← Volver a Mi Panel | Navega a /app | OK |
| `/app/ajustes` | input: Aviso al conectarte a Wi-FiSi quedan misiones, Artiko te lo dice al co | Campo (checkbox): edita el valor | OK |
| `/app/ajustes` | input: Pausa activaTras unos 10 minutos seguidos en la app, Artiko te propone | Campo (checkbox): edita el valor | OK |
| `/app/ajustes` | botón: 🔕 Silenciar hoy | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app/ajustes` | input: Vibración al tocarUn pulso corto confirma cada toque. | Campo (checkbox): edita el valor | OK |
| `/app/ajustes` | input: Confeti y celebracionesAnimaciones al completar tus misiones. | Campo (checkbox): edita el valor | OK |
| `/app/ajustes` | botón: Descargar mis datos (JSON) | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app/ajustes` | botón: Ver mis datos aquí | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app/ajustes` | botón: Corregir mi perfil médico | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app/ajustes` | enlace: Ir a Mi Panel | Navega a /app | OK |
| `/app/ajustes` | enlace: Política de Privacidad | Navega a /privacidad | OK |
| `/app/ajustes` | botón: Borrar mi cuenta y mis datos | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app/ajustes` | enlace: Política de Privacidad | Navega a /privacidad | OK |
| `/app/reporte-medico` | enlace: Volver a mi panel | Navega a /app | OK |
| `/app/reporte-medico` | botón: Imprimir / Guardar en PDF | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app/reporte-medico` | botón: Sube tu densitometría | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app/reporte-medico` | enlace: Agendar densitometría | Navega a /citas | OK |
| `/app/reporte-medico` | botón: 7 días | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
| `/app/reporte-medico` | botón: 30 días | Acción en la página (verificada por E2E: cambia la vista, abre diálogo, guarda o comparte) | OK |
