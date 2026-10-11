import { NextResponse } from "next/server";
import { ANDROID_APP_ID } from "@/lib/native/appIdentity";
import { ASSET_LINKS_CACHE_CONTROL, buildAssetLinks, parseAndroidFingerprints } from "@/lib/native/assetLinks";

// La huella se lee en cada petición: se configura en el despliegue, no en el build.
export const dynamic = "force-dynamic";

/** Digital Asset Links de Android App Links (https://<dominio>/.well-known/assetlinks.json). */
export function GET() {
  const fingerprints = parseAndroidFingerprints(process.env.ANDROID_SHA256_FINGERPRINT);
  return NextResponse.json(buildAssetLinks(ANDROID_APP_ID, fingerprints), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": fingerprints ? ASSET_LINKS_CACHE_CONTROL.configured : ASSET_LINKS_CACHE_CONTROL.missing,
    },
  });
}
