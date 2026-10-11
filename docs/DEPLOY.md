# DEPLOY — publicar la web de Artikare en Vercel

Todo lo de esta guía lo hace **el usuario** en sus paneles: el código ya está listo (`npm run build` limpio).
Nunca pegues claves en el chat ni las subas al repositorio: van solo en Vercel y en tu `.env.local`.

## 0. Antes de empezar

- Cuenta de GitHub con el repositorio subido (`git push` lo haces tú).
- Cuentas en Vercel, Supabase, Resend y Cloudflare (Turnstile).
- Un dominio `*.vercel.app` con HTTPS basta para probar; luego puedes conectar el tuyo.

## 1. Supabase (base de datos y acceso)

1. Crea el proyecto en la región **South America (São Paulo) `sa-east-1`**. Para pacientes reales usa el plan **Pro** (backups diarios y sin pausa por inactividad).
2. Aplica las migraciones desde tu equipo:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-de-tu-proyecto>
   npx supabase db push
   ```
3. **Database → Extensions:** activa `pg_cron`. Comprueba en el SQL Editor que existe la purga diaria: `select jobname from cron.job;` debe listar `daily-soft-delete-purge` (si no, vuelve a correr `db push`).
4. **Authentication → URL Configuration:** *Site URL* = tu dominio (`https://<tu-app>.vercel.app`) y agrégalo en *Redirect URLs*.
5. **Authentication → Providers → Email:** "Confirm email" **activado**.
6. **Authentication → Email:** OTP de 6 dígitos que vence en 600 s; en las plantillas "Confirm signup", "Magic Link" y "Change Email address" pega el contenido de `supabase/templates/otp.html`.
7. **Authentication → SMTP:** usa Resend como SMTP propio (dominio verificado con SPF/DKIM en Resend).
8. **Authentication → Attack Protection:** captcha **Turnstile** con tu `TURNSTILE_SECRET_KEY`.
9. **Project Settings → API:** copia la URL, la `anon key` y la `service_role key` para el paso 3.

## 2. Cloudflare Turnstile

Crea un widget en modo **Managed** o **Non-interactive** (nunca un desafío visual obligatorio) con tu dominio de Vercel. Te da la *site key* y la *secret key*.

## 3. Vercel

1. **Add New → Project → Import** tu repositorio de GitHub. Framework: Next.js (se detecta solo). No cambies el comando de build (`next build`).
2. **Settings → Environment Variables**, entorno **Production**:

| Variable | Valor | Pública |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://<tu-app>.vercel.app` (sin `/` final) | sí |
| `CAP_SERVER_URL` | el mismo dominio https | no |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | sí |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key (**nunca** con prefijo `NEXT_PUBLIC_`) | no |
| `RESEND_API_KEY` | clave de Resend | no |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | site key de Turnstile | sí |
| `TURNSTILE_SECRET_KEY` | secret key de Turnstile | no |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `51` + 9 dígitos que empiezan en 9 (sin `+`) | sí |
| `ANDROID_SHA256_FINGERPRINT` | huellas `AA:BB:…` separadas por coma (subida y Play App Signing) | no |

3. **Deploy.** Si cambias variables después, usa **Redeploy**.

Sin las variables de Supabase la app funciona en modo invitado (todo en el celular). Sin `NEXT_PUBLIC_WHATSAPP_NUMBER` los botones de WhatsApp aparecen deshabilitados; nunca hay un número de reserva.

## 4. Comprobar el despliegue

- Abre `https://<tu-app>.vercel.app`, haz el test y entra a `/app`.
- `https://<tu-app>.vercel.app/.well-known/assetlinks.json` responde tus huellas (o `[]` si aún no definiste `ANDROID_SHA256_FINGERPRINT`).
- En tu equipo, con las mismas variables en `.env.local`: `npm run verify-env -- --strict` debe decir OK.
- Para instalarla desde el navegador del celular: menú → "Agregar a la pantalla de inicio" (PWA).

## 5. Después: la app de Android

Con el dominio funcionando, sigue `docs/MOBILE.md` → `npm run build:android` (exige `CAP_SERVER_URL` https y tu keystore).
