import { afterEach, describe, expect, it, vi } from "vitest";
import type { RepositoryClient } from "@/lib/repositories/supabaseRows";
import { ARCO_HOURLY_LIMITS, consumeArcoQuota } from "./arcoRateLimit";

function stubRpc(result: { data: unknown; error: { message: string } | null }) {
  const rpc = vi.fn(async () => result);
  return { client: { rpc } as unknown as RepositoryClient, rpc };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("consumeArcoQuota", () => {
  it("asks the database for the quota of the requested right", async () => {
    const { client, rpc } = stubRpc({ data: true, error: null });

    await expect(consumeArcoQuota(client, "delete")).resolves.toBe("allowed");
    expect(rpc).toHaveBeenCalledWith("consume_arco_quota", { p_kind: "delete" });
  });

  it("reports the limit when the database refuses the request", async () => {
    const { client } = stubRpc({ data: false, error: null });
    await expect(consumeArcoQuota(client, "export")).resolves.toBe("limited");
  });

  it("fails closed when the database errors or answers something unexpected", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(consumeArcoQuota(stubRpc({ data: null, error: { message: "caída" } }).client, "export")).resolves.toBe(
      "unavailable"
    );
    await expect(consumeArcoQuota(stubRpc({ data: "sí", error: null }).client, "export")).resolves.toBe("unavailable");
  });

  it("keeps export more permissive than the irreversible delete", () => {
    expect(ARCO_HOURLY_LIMITS.delete).toBeLessThan(ARCO_HOURLY_LIMITS.export);
  });
});
