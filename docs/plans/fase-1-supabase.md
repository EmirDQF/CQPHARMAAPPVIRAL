# Fase 1 (Hito C) — Persistencia y base de datos con Supabase

**Estado:** plan aprobado por el usuario el 2026-09-25, con los ajustes incluidos abajo.
**Base:** commit `392822e` (Hito B cerrado).
**Fuentes de verdad, por orden:** CLAUDE.md → "Reglas clínicas vigentes" y `src/lib/clinical/constants.ts`; luego `.claude/rules/*`; luego este plan.

---

## 0. Guardarraíles (no negociables)

- **Nunca** pedir claves por chat, imprimirlas en la salida ni escribirlas en el repo. El usuario escribe `.env.local`, que está en `.gitignore`.
- **Preguntar antes** de cualquier cambio remoto: `supabase link`, `supabase db push`, cambios en el panel de Supabase, Vercel o Resend.
- **Invitado primero:** nada que hoy funciona sin cuenta queda bloqueado tras el registro. Esto incluye el test, el diario de dolor, el pastillero, la racha, el reporte médico y las citas.
- **Sin pérdida de datos:** nada local se borra hasta que el servidor confirma. La migración desde `artikare_*_v1` tiene tests que prueban que no se pierde ningún registro.
- **Sin datos de salud en** URLs, query strings, logs, eventos de analítica ni parámetros de OG.
- **Sin datos demo en la app.** Los fakes en memoria existen solo en los tests.
- **Rutas intactas:** no se mueven `/`, `/citas`, `/app`, `/app/reporte-medico` ni `/blog/*`.
- **Sin downgrade** de Next 16, React 19 ni Tailwind v4.
- **Bloqueante de lanzamiento:** pasar el proyecto Supabase al plan **Pro** (backups diarios y sin pausa por inactividad) antes de cargar pacientes reales. En desarrollo se usa Free en `sa-east-1`.

---

## 1. Esquema (nombres fijos, no se renombran)

Tablas: `profiles`, `consents`, `assessments`, `dexa_scans`, `pain_logs`, `dose_events`, `appointments`.
Añadidos por los ajustes comerciales del punto 5: `products` (catálogo) y `bottles` (frascos iniciados).

| Tabla | Columnas clave / restricciones | Política RLS |
|---|---|---|
| `profiles` | `id uuid PK = auth.users.id`; `age int CHECK (age BETWEEN 1 AND 119)`; `sex` enum `femenino`/`masculino`; `menopausal_status` enum `premenopausica`/`posmenopausica`/`no-aplica` (nulo permitido); `has_fracture_history boolean` (nulo = sin responder); `weight_kg numeric CHECK > 0`; `allergies`, `phone`, `name` text | SELECT, INSERT y UPDATE solo si `id = auth.uid()` |
| `consents` | Solo se agregan filas: `purpose`, `policy_version`, `granted_at`, `revoked_at` | INSERT y SELECT propios; sin UPDATE ni DELETE |
| `assessments` | Resultado del test: edad real, edad articular, nivel de riesgo, respuestas en `jsonb` validado por Zod en el borde | Solo INSERT y SELECT propios (el invitado anónimo tiene su propio `auth.uid()`) |
| `dexa_scans` | `scan_date date CHECK (scan_date <= current_date)`; `lumbar_t` y `femoral_t numeric CHECK BETWEEN -6 AND 4` (= `T_SCORE_INPUT_MIN/MAX`); `UNIQUE(user_id, scan_date)` | CRUD propio |
| `pain_logs` | `log_date date` (día de Lima); `pain_level int CHECK BETWEEN 0 AND 10`; `stiffness` enum; `UNIQUE(user_id, log_date)` | CRUD propio |
| `products` | `id text PK` (slug), nombre, composición, `digemid_registration`, presentación, `doses_per_bottle int > 0`, `price_pen numeric > 0`, `active boolean` | SELECT solo para `authenticated`; escritura solo con `service_role` (migraciones y seed) |
| `dose_events` | `dose_id` (`morning-collagen`/`night-magnesium`), `product_id FK products`, `taken_on date` (día de Lima), `taken_at timestamptz`; `UNIQUE(user_id, dose_id, taken_on)` | CRUD propio |
| `bottles` | `product_id FK products`, `started_on date`; `UNIQUE(user_id, product_id, started_on)` | CRUD propio |
| `appointments` | `code text UNIQUE` generado en el servidor con el alfabeto de `APPOINTMENT_CODE_PATTERN`; `service_id`, `slot_at timestamptz`, `status` | SELECT y UPDATE (cancelar) propios; INSERT **solo** vía la RPC `create_appointment` |

**Reglas comunes:**
- `ENABLE ROW LEVEL SECURITY` y `FORCE ROW LEVEL SECURITY` en todas las tablas.
- `REVOKE ALL ... FROM anon` en todas las tablas. El rol `anon` (sin sesión) no toca ninguna tabla; el invitado usa sesión anónima, que es rol `authenticated` con `is_anonymous = true`.
- Ninguna política de SELECT es pública.
- `user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE`, con índice en `user_id`.
- Las políticas usan `(select auth.uid())` para que la evaluación se cachee por consulta.
- `created_at` y `updated_at` con trigger.
- Las CHECK repiten los rangos de `constants.ts`. Un test de vitest compara las constantes con los valores que aparecen en el SQL, para que no se desincronicen.
- Cada migración `supabase/migrations/<ts>_<nombre>.sql` tiene su script inverso en `supabase/rollbacks/<ts>_<nombre>.down.sql`, porque Supabase solo aplica migraciones hacia adelante. Cada rollback se prueba en local: `up → down → up` sin errores.

---

## 2. Autenticación

- **OTP de 6 dígitos por email**, enviado por **Resend** como SMTP propio de Supabase Auth. La plantilla usa `{{ .Token }}`, sin enlace.
- **Sin contraseñas ni magic links**, porque rompen la sesión de la PWA/TWA.
- **Interfaz del proveedor.** La interfaz `OtpChannel` (`sendCode(destination)`, `verifyCode(destination, code)`) tiene la implementación `EmailOtpChannel`. SMS o WhatsApp se suman después como otra implementación, sin tocar las pantallas.
- **Captcha:** Turnstile (gratuito y sin fricción) en el inicio anónimo y en el envío del OTP, integrado con la protección captcha nativa de Supabase Auth (`captchaToken`).
- **Invitado primero:**
  - La app arranca sin sesión y todo sigue en localStorage, como hoy.
  - La sesión anónima se crea solo cuando hay algo que enviar al servidor: la evaluación del test o una cita.
  - Al verificar el OTP, la cuenta anónima se convierte en permanente (`updateUser({ email })` + verificación), así que el `auth.uid()` se conserva y los datos no se mueven.
- **Invitación a crear cuenta**, como respaldo: "No pierdas tus registros si cambias de celular", siempre con **"Ahora no"** (que se recuerda por un tiempo con una clave local nueva).
  - Aparece en tres momentos: al llegar a 3 días de racha, al abrir el reporte médico y al agendar una cita.
  - Sin copy de miedo ni culpa.
- **Sesión:** se refresca en `proxy.ts` (convención de Next 16) con `@supabase/ssr`. No se protege ninguna ruta existente.

---

## 3. Arquitectura (Repository Pattern)

```
components ──▶ hooks (useSyncExternalStore) ──▶ src/lib/repositories/<dominio>.ts (interfaz)
                                                   ├─ Local*Repository     (invitado / sin conexión; stores actuales)
                                                   └─ Supabase*Repository  (con sesión)
```

- **Una interfaz por dominio:** `ProfileRepository`, `ConsentRepository`, `AssessmentRepository`, `DexaScanRepository`, `PainLogRepository`, `DoseEventRepository`, `BottleRepository`, `AppointmentRepository`.
- **Los componentes nunca importan Supabase.** Solo `src/lib/supabase/*` y los adaptadores `Supabase*Repository` lo hacen. Una regla de ESLint (`no-restricted-imports`) lo hace cumplir en `src/components/**` y `src/app/**` (excepto las rutas API).
- **La caché local es la fuente de la UI.** Los stores `artikare_*_v1` siguen alimentando la pantalla, y la escritura remota va por la outbox. Así el modo sin conexión y el service worker funcionan igual que hoy.
- **Esquemas Zod compartidos** en `src/lib/schemas/`. Validan en los bordes: localStorage, rutas API y respuestas de Supabase. De ahí salen los tipos que comparten cliente y servidor.
- **Fakes en memoria** (`InMemory*Repository`) solo en `src/test/`, nunca importados desde la app.

---

## 4. Dependencias y claves

- **Autorizado instalar:** `@supabase/supabase-js`, `@supabase/ssr` y `supabase` (CLI, devDependency).
- **Local:** Docker ya está instalado; se usa `supabase start` para migraciones y tests de RLS.
- **`.env.example`** (el que ya existe): se agregan `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (solo servidor), `RESEND_API_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`. `NEXT_PUBLIC_WHATSAPP_NUMBER` ya estaba.
- **Validación del entorno:**
  - `src/lib/env.ts` valida el entorno con Zod.
  - `SUPABASE_SERVICE_ROLE_KEY` solo se lee en un módulo con `import "server-only"`.
  - Sin variables de Supabase la app sigue en modo invitado. Solo se registra un aviso, sin romper nada.
- **Lo que hace el usuario** (no Claude):
  - Crear el proyecto Supabase (`sa-east-1`, Free para desarrollo).
  - Escribir `.env.local`.
  - Autorizar cada cambio remoto.
  - Inscribir el banco de datos ante la ANPD.

---

## 5. Comercial (CQ Pharma)

- **Catálogo de tomas.** `dose_events.product_id` referencia a `products`, y no hay nombres de producto fijos en los componentes. El catálogo inicial se siembra con los dos productos actuales:
  - 08:30: colágeno + vitamina C.
  - 21:30: citrato de magnesio + D3.
  - Viven en el catálogo, y `DOSE_SCHEDULE` guarda el `productId`.
- **Kolflex NO se agrega** hasta que el usuario entregue composición, registro DIGEMID, tomas por frasco y precio.
- **Reposición del día 50:**
  - Se calcula con las tomas registradas de **cada frasco**, como hoy en `bottleTracking.ts`, y no con la racha.
  - Nueva acción **"Empecé un frasco nuevo"**, que registra en `bottles` o en la clave local nueva `artikare_bottles_v1`. Desde ese momento se cuentan solo las tomas de ese producto a partir de `started_on`.
  - Sin frasco registrado se mantiene el comportamiento actual: todas las tomas cuentan. Así ningún paciente pierde su aviso.
- **Bandera roja activa:** la reposición con descuento se sigue ocultando (ya implementado en el Hito B; se mantiene el test).

---

## 6. Legal (Ley 29733)

- **`/privacidad`** recibe dos cambios:
  - Texto de **transferencia internacional**: los datos se alojan en Brasil, región `sa-east-1` de Supabase.
  - Botón **"Borrar mis datos"**.
  - Ambos llevan la marca visible de *pendiente de revisión legal*.
- **ARCO (C5):**
  - `GET /api/arco/export` devuelve un JSON con todos los datos del usuario.
  - `POST /api/arco/delete` pide confirmación y hace un borrado en cascada más la eliminación del usuario de auth (con `service_role` en el servidor).
  - En modo invitado, el botón borra las claves `artikare_*` locales.
- **Inscripción ante la ANPD:** la hace el usuario.

---

## 7. Sub-hitos

Cada sub-hito sigue este orden: **tests primero** → `tsc --noEmit` → `eslint` → `vitest` → `next build` → Playwright a 375px → revisores → un commit convencional en español → `git push origin main` → reporte de 8 líneas o menos con la salida real de los candados.
Revisores siempre: `healthcare-reviewer` y `code-reviewer`, más los extra de la tabla. Se corrige todo CRITICAL y HIGH.

| Sub-hito | Contenido | Tests primero | Revisores extra |
|---|---|---|---|
| **C1 — Esquema y RLS** | CLI y dependencias; `supabase/config.toml`; migraciones de las 9 tablas con sus rollbacks; seed de `products`; `src/lib/schemas/*` | pgTAP (`supabase test db`) más una suite de integración en vitest contra el Supabase local: el usuario A no ve, edita ni borra lo de B; `anon` no lee nada; las CHECK rechazan T = -6.1, dolor 11 y fechas futuras; rollback `up → down → up`; paridad constantes ↔ SQL | `database-reviewer`, `security-reviewer` |
| **C2 — Autenticación** | `src/lib/supabase/{client,server}.ts`; `proxy.ts`; `OtpChannel` y `EmailOtpChannel`; Turnstile; sesión anónima perezosa; pantalla de acceso en es-PE; invitación con "Ahora no" en los 3 momentos | Unitarios del canal OTP con fake; la invitación aparece o no según racha, reporte y cita; "Ahora no" se respeta; E2E del flujo de invitado intacto sin variables de Supabase | `security-reviewer`, `a11y-architect` |
| **C3 — Repositorios y migración** | Interfaces por dominio; adaptadores Local y Supabase; outbox extendida a los nuevos endpoints; migración `artikare_*_v1` → servidor al primer login, en lotes e idempotente (upsert por las claves UNIQUE); "Empecé un frasco nuevo" | Fakes en memoria; **ningún registro se pierde** con fallos intermitentes; no se borra nada local sin confirmación; reintento idempotente; conflictos resueltos (dolor por fecha: gana el `updated_at` más reciente; tomas: unión); reposición por frasco | `database-reviewer` |
| **C4 — Citas en servidor** | RPC `create_appointment` (`SECURITY DEFINER`, `search_path` fijo) que genera el código y aplica un rate limit (3 citas por hora por usuario) en la base; `/api/appointments` la usa; captcha en el envío | Código único con el alfabeto correcto; la cuarta cita en una hora se rechaza con 429; el usuario A no ve las citas de B; el WhatsApp sigue llevando solo el código | `security-reviewer` |
| **C5 — ARCO y privacidad** | `/api/arco/export` y `/api/arco/delete`; botón "Borrar mis datos"; texto de transferencia internacional; marca de revisión legal | La exportación trae solo lo propio y todo lo propio; el borrado elimina en cascada y cierra la sesión; en invitado limpia `artikare_*`; nada de datos de salud en logs | `security-reviewer`, `a11y-architect` |

---

## 8. Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Pérdida de datos en la migración | La copia local se conserva hasta la confirmación del servidor; upsert idempotente; tests con fallos inyectados |
| Fuga entre usuarios por RLS mal escrita | Tests A/B/anon en cada tabla; `FORCE RLS`; `database-reviewer` |
| Service role expuesta en el cliente | `server-only` y una regla de ESLint; revisión de seguridad; nunca con prefijo `NEXT_PUBLIC_` |
| Abuso del OTP o spam | Turnstile, límites de Supabase Auth y rate limit de citas en la base |
| El proyecto Free se pausa o no tiene backups | Solo desarrollo; Pro es bloqueante de lanzamiento |
| Paridad de reglas clínicas entre TS y SQL | Test de paridad de constantes |
| Emails del OTP en spam | Dominio verificado en Resend (SPF/DKIM), que configura el usuario |
| La UI sin conexión deja de funcionar | La caché local sigue siendo la fuente de la UI; E2E en modo sin conexión |

## 8b. Checklist de producción de Auth (C2, lo hace el usuario en los paneles)

Bloqueante antes de poner las variables de Supabase en Vercel:

- **Supabase → Authentication → Providers → Email:** "Confirm email" **activado**. Con esa opción apagada, Supabase asigna el correo a una sesión anónima sin verificar el OTP, y alguien podría apropiarse del correo de otra persona (comprobado en local).
- **Supabase → Authentication → Email:** el OTP vence en **600 s** y tiene 6 dígitos. Las plantillas "Confirm signup", "Magic Link" y "Change Email address" usan el contenido de `supabase/templates/otp.html` (solo `{{ .Token }}`, sin enlace).
- **Supabase → Authentication → Attack Protection:** captcha **Turnstile activado**, con `TURNSTILE_SECRET_KEY`. Sin esto, el captcha es solo un control del lado del cliente, porque la API de Auth es pública.
- **Vercel:** `NEXT_PUBLIC_TURNSTILE_SITE_KEY` definida. En producción, si falta, la pantalla de acceso se cierra (fail-closed).
- **Cloudflare Turnstile:** usar el modo del widget **"Managed"** o **"Non-interactive"**, nunca un desafío visual obligatorio (WCAG 3.3.8).
- **Resend:** dominio verificado (SPF/DKIM) y configurado como SMTP propio de Supabase.
- **La invitación a crear cuenta** sigue oculta (`src/lib/auth/features.ts`) hasta que C3 respalde los registros. No se activa antes.

## 9. Pendientes heredados (requieren decisión del usuario o validación clínica)

- Umbral de derivación en pacientes con Z-score: hoy es T ≤ -2.5; la ISCD usa Z ≤ -2.0. Necesita validación clínica.
- Datos de Kolflex: composición, DIGEMID, tomas por frasco y precio.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` en Vercel, para quitar el número de reserva.
