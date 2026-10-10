---
name: masvs
description: Concise OWASP MASVS v2 checklist (STORAGE, CRYPTO, AUTH, NETWORK, PLATFORM, CODE, PRIVACY). Use when writing or reviewing code that handles user/health data, auth, storage, network calls, or platform integrations.
metadata:
  origin: OWASP MASVS v2 (summary)
---

# OWASP MASVS — Essential Controls

Apply on every change touching sensitive data. Pharma app = health/PII data → treat as high sensitivity.

## STORAGE
- Never store secrets, tokens, or PII in plain storage (localStorage, AsyncStorage, SharedPreferences, logs).
- Use Keychain / Keystore / secure-store (mobile) or httpOnly+Secure+SameSite cookies (web).
- No sensitive data in logs, analytics, crash reports, URLs, clipboard, or screenshots/backups.
- Wipe sensitive data on logout.

## CRYPTO
- Use platform/vetted libs only (WebCrypto, libsodium, platform keystore). No custom crypto.
- AES-GCM / ChaCha20-Poly1305; SHA-256+; passwords → argon2/bcrypt (server side).
- No hardcoded keys/IVs; keys from secure storage or KMS; random via CSPRNG.

## AUTH
- Authentication and authorization enforced on the **server**, never client-only.
- Short-lived access tokens + rotating refresh tokens; invalidate server-side on logout.
- Biometrics bound to keystore keys, not a boolean flag. Rate-limit login/OTP.
- Re-authenticate for sensitive actions (prescriptions, payments, profile changes).

## NETWORK
- HTTPS/TLS 1.2+ only; no cleartext, no disabled cert validation.
- Consider certificate pinning for critical API endpoints (mobile).
- Validate all server responses; never trust client-supplied IDs (prevent IDOR).

## PLATFORM
- Validate all input from deep links, intents, URL params, WebViews, and IPC.
- WebViews: disable JS/file access unless required; no `javascript:`/untrusted URLs.
- Sanitize rendered HTML (no `dangerouslySetInnerHTML` with untrusted data).
- Request minimum permissions; mask sensitive fields in UI.

## CODE
- No secrets in source or client bundles (`NEXT_PUBLIC_*` is public!). Use env vars server-side.
- Keep dependencies updated; run `npm audit` / SCA before release.
- Parameterized queries; schema validation (e.g., zod) at every boundary.
- Release builds: no debug flags, no verbose errors, no source maps exposed publicly.

## PRIVACY
- Collect only data strictly needed (data minimization); document purpose.
- Explicit consent before collecting health data or tracking; allow withdrawal.
- Support data access/deletion requests; anonymize analytics.
- Disclose third-party SDKs that receive user data.

## Review Gate
Before merging, confirm: no secrets exposed · sensitive data encrypted at rest/in transit · server-side authz · inputs validated · minimal data collected.
