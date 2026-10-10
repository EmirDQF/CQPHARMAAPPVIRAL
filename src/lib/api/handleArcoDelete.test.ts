import { afterEach, describe, expect, it, vi } from "vitest";
import { ACCOUNT_DELETION_CONFIRMATION, handleArcoDelete, type AccountDeleter } from "./handleArcoDelete";
import type { SyncRequester } from "./handleSyncBatch";

const requester: SyncRequester = { id: "00000000-0000-4000-8000-00000000a11c", isAnonymous: false };
const confirmedBody = { confirmacion: ACCOUNT_DELETION_CONFIRMATION };

function fakeDeleter(error: { message: string } | null = null) {
  const deleteUser = vi.fn<AccountDeleter["deleteUser"]>().mockResolvedValue({ error });
  return { deleter: { deleteUser } satisfies AccountDeleter, deleteUser };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleArcoDelete", () => {
  it("sin sesión responde 401 y no borra nada", async () => {
    const { deleter, deleteUser } = fakeDeleter();

    await expect(handleArcoDelete({ requester: null, body: confirmedBody, deleter })).resolves.toMatchObject({
      status: 401,
    });
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("sin la confirmación explícita responde 400 y no borra nada", async () => {
    const { deleter, deleteUser } = fakeDeleter();

    for (const body of [{}, { confirmacion: "borrar" }, null]) {
      await expect(handleArcoDelete({ requester, body, deleter })).resolves.toMatchObject({ status: 400 });
    }
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("con confirmación borra al usuario de la sesión, nunca a otro", async () => {
    const { deleter, deleteUser } = fakeDeleter();

    await expect(
      handleArcoDelete({ requester, body: { ...confirmedBody, userId: "otro" }, deleter })
    ).resolves.toEqual({ status: 200, data: { deleted: true } });
    expect(deleteUser).toHaveBeenCalledWith(requester.id);
  });

  it("una sesión anónima también puede borrar lo suyo", async () => {
    const { deleter, deleteUser } = fakeDeleter();

    await handleArcoDelete({ requester: { ...requester, isAnonymous: true }, body: confirmedBody, deleter });

    expect(deleteUser).toHaveBeenCalledWith(requester.id);
  });

  it("sin service role configurada responde 503", async () => {
    await expect(handleArcoDelete({ requester, body: confirmedBody, deleter: null })).resolves.toMatchObject({
      status: 503,
    });
  });

  it("si Supabase falla responde 503 sin registrar el id", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const { deleter } = fakeDeleter({ message: "caída" });

    await expect(handleArcoDelete({ requester, body: confirmedBody, deleter })).resolves.toMatchObject({
      status: 503,
    });
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain(requester.id);
  });
});
