# Registro de cambios

Todos los cambios importantes de Artikare se anotan aquí.
Formato: [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) · Versionado: [SemVer](https://semver.org/lang/es/).
La versión sale de `package.json`; Android calcula `versionCode = mayor×10000 + menor×100 + parche`.

> ⚠️ **Contenido médico pendiente de validación del médico del proyecto.** Textos, fichas, juegos y
> frases son orientativos y no reemplazan la evaluación ni el tratamiento indicado por tu médico.

## [0.2.0] - 2026-10-17 (pruebas)

### Añadido

- **Aprender**: 25 fichas de reumatología con 3 preguntas para llevar al médico cada una, glosario con buscador
  y señales de alarma; XP con tope diario. Con bandera roja se ocultan las fichas de movimiento.
- **Jugar**: 6 mini-juegos educativos sin reloj (79 ítems), nivel adaptable y mejor marca guardada en el celular.
- **Recompensas**: insignias de aprendizaje, medalla de Artiko y cofre del día. La bonificación comercial queda
  **apagada** hasta que se decida.
- **Panel "Mi salud"**: siguiente mejor acción, anillos de constancia, rigidez registrada y esqueleto de carga.
- **64 frases motivadoras** que no se repiten en 14 días, con botón "Otra frase".
- **Sonidos** de acierto, error suave, fanfarria, racha y cofre, con botón de silencio en la cabecera.
- **Perfil**: opción "No estoy segura" en menopausia, con migración de datos y un aviso amable.
- **Artiko, la mascota**, como logo de la app, icono, splash y guía del primer arranque.
- **Android empaquetado** (`CAP_MODE=bundled`): la interfaz va dentro del APK y abre sin internet; la API
  remota solo para respaldo, cuentas, ARCO y citas (`Authorization: Bearer`, CORS limitado).
- **Versión visible** en Ajustes → "Acerca de" ("Artikare v0.2.0 (build 200)"), horneada en el build.
- `npm run verify:version` (dentro de `preflight`): falla si `package.json`, `build.gradle` y
  `capacitor.config.ts` no comparten la misma versión.

### Cambiado

- **Pack Diagnóstico Óseo**: incluye dosaje de vitamina D y densitometría (DMO) con la nueva indicación.
- La app abre en el registro con Artiko; tema claro con botón de modo oscuro; WhatsApp del consultorio.
- `versionName`/`versionCode` de Android ya no se escriben a mano: se calculan desde `package.json`
  (antes `"1.0"` / `1`).

### Corregido

- Revisión clínica y de accesibilidad: sin mecanismos de acción de suplementos, sin consejos de movimiento con
  bandera roja, límites OMS precisos (-2.5 exacto es osteoporosis), texto de 18 px y foco visible al desplazar.
- Juegos: partida memorizada, avance sin división por cero y claves estables.
- Cabecera: con letra "Muy grande" los botones bajan de línea en vez de desbordar.

### Pruebas

- Auditoría e2e de botones sin acción en Mi salud, Aprender y Jugar, y flujos del pack, menopausia y juegos.

## [0.1.0] - 2026-10-12

### Añadido

- Landing con test de edad articular orientativo (7 preguntas) y su descargo.
- PWA: semáforo óseo OMS, banderas rojas por encima de cualquier producto, pastillero 08:30/21:30 (Lima),
  diario de dolor y rigidez, reposición el día 50 de 60.
- Cuenta, respaldo y derechos ARCO (Ley N.º 29733) con CSRF y límite de solicitudes.
- Android con Capacitor 8 (modo remoto), App Links, recordatorios nativos y aviso al conectarse a Wi-Fi (opt-in).

[0.2.0]: https://github.com/EmirDQF/CQPHARMAAPPVIRAL/releases/tag/v0.2.0
[0.1.0]: https://github.com/EmirDQF/CQPHARMAAPPVIRAL/commits/main
