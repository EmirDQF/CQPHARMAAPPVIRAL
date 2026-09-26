import type { NextRequest } from "next/server";
import { refreshSupabaseSession } from "@/lib/supabase/proxySession";

// Next 16: proxy.ts reemplaza a middleware.ts. Solo refresca la sesión; no bloquea rutas.
export function proxy(request: NextRequest) {
  return refreshSupabaseSession(request);
}

export const config = {
  // Sin estáticos, imágenes, service worker ni manifest.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
