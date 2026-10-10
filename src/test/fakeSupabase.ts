/**
 * Supabase en memoria para los tests de repositorios y sincronización (C3).
 * Emula solo lo que usan los adaptadores, con las reglas de la base:
 * - RLS: el SELECT no devuelve filas con `deleted_at` (un solo paciente).
 * - upsert por `onConflict` (sin `user_id`, que la base pone con auth.uid()).
 * - Un INSERT con la clave de una fila borrada en suave la reemplaza (trigger de C1.1).
 * - `soft_delete_record` marca `deleted_at`.
 * No importa el SDK (solo src/lib/repositories y src/lib/supabase pueden):
 * los tests de repositorios lo convierten al tipo del cliente.
 */

type Row = Record<string, unknown>;
type FakeError = { message: string; code: string } | null;
type Operation = "select" | "upsert" | "insert" | "rpc";

interface UpsertOptions {
  onConflict?: string;
  ignoreDuplicates?: boolean;
}

const INJECTED_FAILURE: FakeError = { message: "fallo inyectado", code: "08006" };
const FAKE_USER_ID = "00000000-0000-4000-8000-00000000a11c";

function keyColumnsOf(onConflict: string | undefined): string[] {
  return (onConflict ?? "id")
    .split(",")
    .map((column) => column.trim())
    .filter((column) => column !== "user_id");
}

function sameKey(a: Row, b: Row, columns: readonly string[]): boolean {
  return columns.every((column) => a[column] === b[column]);
}

function project(row: Row, columns: string): Row {
  if (columns.trim() === "*") return { ...row };
  return Object.fromEntries(
    columns.split(",").map((column) => [column.trim(), row[column.trim()]])
  );
}

export function createFakeSupabase() {
  const tables = new Map<string, Row[]>();
  const pendingFailures: Operation[] = [];
  const calls: { operation: Operation; target: string; size: number }[] = [];
  let nextId = 1;

  function rowsOf(table: string): Row[] {
    if (!tables.has(table)) tables.set(table, []);
    return tables.get(table) as Row[];
  }

  function shouldFail(operation: Operation): boolean {
    const index = pendingFailures.indexOf(operation);
    if (index === -1) return false;
    pendingFailures.splice(index, 1);
    return true;
  }

  function newRow(values: Row): Row {
    const now = new Date().toISOString();
    return {
      id: `00000000-0000-4000-8000-${String(nextId++).padStart(12, "0")}`,
      user_id: FAKE_USER_ID,
      created_at: now,
      updated_at: now,
      ...values,
      deleted_at: null,
    };
  }

  function upsertRow(table: string, rawValues: Row, options: UpsertOptions): void {
    const keyColumns = keyColumnsOf(options.onConflict);
    // `profiles.id default auth.uid()`: sin id, el upsert apunta a la fila del paciente.
    const values = keyColumns.includes("id") && rawValues.id === undefined
      ? { ...rawValues, id: FAKE_USER_ID }
      : rawValues;
    const live = rowsOf(table).filter((row) => !(row.deleted_at && sameKey(row, values, keyColumns)));
    tables.set(table, live);

    const existing = live.find((row) => sameKey(row, values, keyColumns));
    if (!existing) {
      live.push(newRow(values));
      return;
    }
    if (options.ignoreDuplicates) return;
    Object.assign(existing, values, { updated_at: new Date().toISOString() });
  }

  function selectBuilder(table: string, columns: string) {
    const filters: ((row: Row) => boolean)[] = [];
    const builder = {
      in(column: string, values: readonly unknown[]) {
        filters.push((row) => values.includes(row[column]));
        return builder;
      },
      eq(column: string, value: unknown) {
        filters.push((row) => row[column] === value);
        return builder;
      },
      then<R>(resolve: (result: { data: Row[] | null; error: FakeError }) => R) {
        calls.push({ operation: "select", target: table, size: 0 });
        if (shouldFail("select")) {
          return Promise.resolve(resolve({ data: null, error: INJECTED_FAILURE }));
        }
        const data = rowsOf(table)
          .filter((row) => !row.deleted_at)
          .filter((row) => filters.every((matches) => matches(row)))
          .map((row) => project(row, columns));
        return Promise.resolve(resolve({ data, error: null }));
      },
    };
    return builder;
  }

  function mutation(operation: Operation, target: string, size: number, apply: () => void) {
    calls.push({ operation, target, size });
    if (shouldFail(operation)) return Promise.resolve({ error: INJECTED_FAILURE });
    apply();
    return Promise.resolve({ error: null as FakeError });
  }

  const client = {
    from(table: string) {
      return {
        select: (columns: string) => selectBuilder(table, columns),
        upsert: (values: Row | Row[], options: UpsertOptions = {}) => {
          const rows = Array.isArray(values) ? values : [values];
          return mutation("upsert", table, rows.length, () =>
            rows.forEach((row) => upsertRow(table, row, options))
          );
        },
        insert: (values: Row | Row[]) => {
          const rows = Array.isArray(values) ? values : [values];
          return mutation("insert", table, rows.length, () =>
            rows.forEach((row) => rowsOf(table).push(newRow(row)))
          );
        },
      };
    },
    rpc(name: string, args: { p_table: string; p_id: string }) {
      return mutation("rpc", name, 1, () => {
        if (name !== "soft_delete_record") throw new Error(`rpc no emulada: ${name}`);
        const row = rowsOf(args.p_table).find((candidate) => candidate.id === args.p_id);
        if (row) row.deleted_at = new Date().toISOString();
      });
    },
  };

  return {
    client,
    /** Filas tal como están en la "base", incluidas las borradas en suave. */
    rows: (table: string): Row[] => rowsOf(table).map((row) => ({ ...row })),
    seed: (table: string, values: Row[]): void => {
      values.forEach((value) => rowsOf(table).push(newRow(value)));
    },
    /** La próxima operación de ese tipo devuelve error (fallo intermitente). */
    failNext: (operation: Operation): void => {
      pendingFailures.push(operation);
    },
    calls,
  };
}

export type FakeSupabase = ReturnType<typeof createFakeSupabase>;
