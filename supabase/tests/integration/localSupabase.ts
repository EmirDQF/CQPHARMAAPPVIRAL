import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const localStatusSchema = z.object({
  API_URL: z.url(),
  ANON_KEY: z.string().min(1),
  SERVICE_ROLE_KEY: z.string().min(1),
});

type LocalStatus = z.infer<typeof localStatusSchema>;

/**
 * Lee URL y claves del Supabase local (`supabase start`). Las claves quedan en
 * memoria: nunca se imprimen ni se escriben en disco.
 */
export function readLocalSupabase(): LocalStatus {
  // Comando fijo, sin argumentos interpolados (npx necesita shell en Windows).
  const output = execSync("npx supabase status -o json", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return localStatusSchema.parse(JSON.parse(output));
}

const CLIENT_OPTIONS = { auth: { persistSession: false, autoRefreshToken: false } };

export function createLocalClient(status: LocalStatus, key: string): SupabaseClient {
  return createClient(status.API_URL, key, CLIENT_OPTIONS);
}

export interface TestPatient {
  client: SupabaseClient;
  userId: string;
}

/** Paciente con cuenta permanente (solo en tests locales se usa contraseña). */
export async function createPermanentPatient(
  status: LocalStatus,
  admin: SupabaseClient
): Promise<TestPatient> {
  const email = `paciente-${randomUUID()}@test.local`;
  const password = randomUUID();
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw created.error;

  const client = createLocalClient(status, status.ANON_KEY);
  const signedIn = await client.auth.signInWithPassword({ email, password });
  if (signedIn.error) throw signedIn.error;
  return { client, userId: created.data.user.id };
}

/** Invitado con sesión anónima: rol authenticated con su propio auth.uid(). */
export async function createGuestPatient(status: LocalStatus): Promise<TestPatient> {
  const client = createLocalClient(status, status.ANON_KEY);
  const { data, error } = await client.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user) throw new Error("signInAnonymously no devolvió usuario");
  return { client, userId: data.user.id };
}
