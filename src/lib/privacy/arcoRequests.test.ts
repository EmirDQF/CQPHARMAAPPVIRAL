import { afterEach, describe, expect, it, vi } from "vitest";
import { ACCOUNT_DELETION_CONFIRMATION } from "../api/handleArcoDelete";
import { fetchAccountExport, hasServerSession, requestAccountDeletion } from "./arcoRequests";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("hasServerSession", () => {
  it("solo hay datos en el servidor con sesión anónima o cuenta", () => {
    expect(hasServerSession("account")).toBe(true);
    expect(hasServerSession("anonymous")).toBe(true);
    expect(hasServerSession("guest")).toBe(false);
    expect(hasServerSession("unconfigured")).toBe(false);
    expect(hasServerSession("loading")).toBe(false);
  });
});

describe("fetchAccountExport", () => {
  it("devuelve los datos de la cuenta sin caché", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ success: true, data: { citas: [] } }));

    await expect(fetchAccountExport(fetcher)).resolves.toEqual({ ok: true, data: { citas: [] } });
    expect(fetcher).toHaveBeenCalledWith("/api/arco/export", expect.objectContaining({ cache: "no-store" }));
  });

  it("un error del servidor, una respuesta inválida o la red caída devuelven ok:false", async () => {
    const responses = [
      () => Promise.resolve(jsonResponse({ success: false, error: "x" }, 503)),
      () => Promise.resolve(jsonResponse({ success: true })),
      () => Promise.reject(new TypeError("Failed to fetch")),
    ];
    for (const respond of responses) {
      await expect(fetchAccountExport(vi.fn<typeof fetch>().mockImplementation(respond))).resolves.toEqual({
        ok: false,
      });
    }
  });
});

describe("requestAccountDeletion", () => {
  it("envía la confirmación explícita y devuelve true si se borró", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ success: true, data: { deleted: true } }));

    await expect(requestAccountDeletion(fetcher)).resolves.toBe(true);
    const [, init] = fetcher.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual({ confirmacion: ACCOUNT_DELETION_CONFIRMATION });
  });

  it("devuelve false si el servidor no lo confirma o no hay red", async () => {
    await expect(
      requestAccountDeletion(vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ success: false }, 503)))
    ).resolves.toBe(false);
    await expect(
      requestAccountDeletion(vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch")))
    ).resolves.toBe(false);
  });
});
