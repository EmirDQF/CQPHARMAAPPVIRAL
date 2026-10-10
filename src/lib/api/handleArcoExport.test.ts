import { afterEach, describe, expect, it, vi } from "vitest";
import type { RepositoryClient } from "@/lib/repositories/supabaseRows";
import { ACCOUNT_EXPORT_SECTIONS, handleArcoExport } from "./handleArcoExport";
import type { SyncRequester } from "./handleSyncBatch";

const requester: SyncRequester = { id: "00000000-0000-4000-8000-00000000a11c", isAnonymous: false };

type Result = { data: unknown; error: { message: string } | null };

function stubClient(rowsByTable: Record<string, unknown[]>, failing: string | null = null) {
  const selectedTables: string[] = [];
  const client = {
    from(table: string) {
      return {
        select(columns: string): Promise<Result> {
          selectedTables.push(`${table}:${columns}`);
          if (table === failing) return Promise.resolve({ data: null, error: { message: "caída" } });
          return Promise.resolve({ data: rowsByTable[table] ?? [], error: null });
        },
      };
    },
    rpc(name: string): Promise<Result> {
      if (name === failing) return Promise.resolve({ data: null, error: { message: "caída" } });
      return Promise.resolve({ data: [{ table_name: "pain_logs" }], error: null });
    },
  };
  return { client: client as unknown as RepositoryClient, selectedTables };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleArcoExport", () => {
  it("sin sesión responde 401 y no lee nada", async () => {
    const { client, selectedTables } = stubClient({});

    await expect(handleArcoExport({ client, requester: null })).resolves.toEqual({
      status: 401,
      error: expect.any(String),
    });
    expect(selectedTables).toEqual([]);
  });

  it("entrega cada tabla propia con un nombre legible, más la papelera", async () => {
    const { client, selectedTables } = stubClient({ pain_logs: [{ log_date: "2026-10-01", pain_level: 3 }] });

    const result = await handleArcoExport({ client, requester });

    expect(result.status).toBe(200);
    if (result.status !== 200) return;
    expect(result.data.diarioDeDolorYRigidez).toEqual([{ log_date: "2026-10-01", pain_level: 3 }]);
    expect(result.data.papelera).toEqual([{ table_name: "pain_logs" }]);
    expect(result.data.cuenta).toEqual({ id: requester.id, tipo: "cuenta" });
    expect(selectedTables).toHaveLength(ACCOUNT_EXPORT_SECTIONS.length);
  });

  it("si una tabla falla responde 503 sin registrar datos", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = stubClient({ pain_logs: [{ pain_level: 9 }] }, "dexa_scans");

    await expect(handleArcoExport({ client, requester })).resolves.toEqual({ status: 503, error: expect.any(String) });
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain("pain_level");
  });

  it("una sesión anónima también puede pedir lo suyo", async () => {
    const { client } = stubClient({});

    const result = await handleArcoExport({ client, requester: { ...requester, isAnonymous: true } });

    expect(result.status === 200 && result.data.cuenta).toEqual({ id: requester.id, tipo: "invitado" });
  });
});
