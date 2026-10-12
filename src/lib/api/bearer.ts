/** "Bearer <token>" → token; cualquier otra cosa → null. */
export function parseBearerToken(authorization: string | null): string | null {
  const match = /^Bearer\s+([A-Za-z0-9._~+/-]+=*)$/.exec(authorization?.trim() ?? "");
  return match ? match[1] : null;
}
