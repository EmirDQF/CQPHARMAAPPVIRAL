import { getBrowserSupabase } from "@/lib/supabase/client";
import { API_BASE_URL, IS_REMOTE_API, resolveApiUrl } from "./apiBase";

async function readAccessToken(): Promise<string | null> {
  try {
    const { data } = (await getBrowserSupabase()?.auth.getSession()) ?? { data: null };
    return data?.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * fetch hacia la API de Artikare. En la web es un fetch normal (cookies de
 * mismo origen). En la app empaquetada resuelve contra NEXT_PUBLIC_API_BASE_URL
 * y manda el token de sesión como Bearer, sin cookies de otro origen; el
 * servidor valida el token siempre (MASVS AUTH).
 */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  if (typeof input !== "string") return fetch(input, init);
  const url = resolveApiUrl(input, API_BASE_URL);
  if (!IS_REMOTE_API) return fetch(url, init);

  const headers = new Headers(init.headers);
  const token = await readAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...init, headers, credentials: "omit" });
}
