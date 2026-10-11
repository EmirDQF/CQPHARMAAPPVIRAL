import { redirect } from "next/navigation";
import { resolveDeepLink } from "@/lib/native/deepLinks";
import { readSiteUrl } from "@/lib/native/appIdentity";

/**
 * Enlace corto que se comparte (y que abre la app por App Links): lleva al
 * test de la landing conservando solo los UTM permitidos.
 */
export default async function TestShortLink({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams(
    Object.entries(await searchParams).flatMap(([key, value]) => (typeof value === "string" ? [[key, value]] : []))
  );
  const siteUrl = readSiteUrl();
  const allowed = resolveDeepLink(`${new URL("/test", siteUrl).href}?${params.toString()}`, siteUrl) ?? "/test";
  const query = allowed.slice("/test".length);
  redirect(`/${query}`);
}
