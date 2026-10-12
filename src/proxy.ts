import { NextResponse, type NextRequest } from "next/server";
import { corsHeadersFor } from "@/lib/api/mobileCors";
import { refreshSupabaseSession } from "@/lib/supabase/proxySession";

// Next 16: proxy.ts reemplaza a middleware.ts. Refresca la sesión (no bloquea rutas) y
// da CORS a la API solo para el WebView de la app empaquetada (orígenes de Capacitor).
export async function proxy(request: NextRequest) {
  const isApi = request.nextUrl.pathname.startsWith("/api/");
  const origin = request.headers.get("origin");

  if (isApi && request.method === "OPTIONS") {
    const cors = corsHeadersFor(origin, true);
    return new NextResponse(null, { status: cors ? 204 : 403, headers: cors ?? {} });
  }

  const response = await refreshSupabaseSession(request);
  if (isApi) {
    Object.entries(corsHeadersFor(origin, false) ?? {}).forEach(([key, value]) => response.headers.set(key, value));
  }
  return response;
}

export const config = {
  // Sin estáticos, imágenes, service worker ni manifest.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
