/**
 * Lector mínimo del DDL de supabase/migrations para el test de paridad
 * Zod ↔ PostgreSQL (sqlParity.test.ts). Solo lo importan tests: no toca
 * el sistema de archivos ni la red, recibe el SQL ya concatenado.
 *
 * Entiende el subconjunto de DDL que usa el proyecto. Cualquier sentencia que
 * cambie tipos, columnas o CHECK de una forma que no reconoce lanza un error,
 * para que una migración nueva nunca deje el test pasando en falso.
 */

export interface SqlCheck {
  name: string;
  /** Columna dueña del CHECK (inline o de una sola columna), o null si es de tabla. */
  column: string | null;
  expression: string;
}

export interface SqlColumn {
  name: string;
  /** Tipo normalizado: `int`, `numeric(4,1)`, `text[]`, `timestamptz`, `public.sex`… */
  type: string;
  notNull: boolean;
  references: { table: string; column: string } | null;
}

export interface SqlTable {
  name: string;
  columns: SqlColumn[];
  checks: SqlCheck[];
}

export interface SqlSchema {
  enums: ReadonlyMap<string, readonly string[]>;
  tables: ReadonlyMap<string, SqlTable>;
}

// ─── Léxico ──────────────────────────────────────────────────────────────────

/** Quita comentarios `--` y `/* *\/` respetando literales '…' y cuerpos $tag$…$tag$. */
export function stripSqlComments(sql: string): string {
  let output = "";
  let index = 0;
  while (index < sql.length) {
    const rest = sql.slice(index);
    if (rest.startsWith("--")) {
      const end = sql.indexOf("\n", index);
      index = end === -1 ? sql.length : end;
    } else if (rest.startsWith("/*")) {
      const end = sql.indexOf("*/", index + 2);
      index = end === -1 ? sql.length : end + 2;
    } else {
      const quoted = readQuoted(sql, index);
      output += quoted ?? sql[index];
      index += quoted?.length ?? 1;
    }
  }
  return output;
}

/** Literal '…' o cuerpo $tag$…$tag$ que empieza en `index`, o null. */
function readQuoted(sql: string, index: number): string | null {
  if (sql[index] === "'") {
    let end = index + 1;
    while (end < sql.length) {
      if (sql[end] === "'" && sql[end + 1] === "'") end += 2;
      else if (sql[end] === "'") break;
      else end += 1;
    }
    return sql.slice(index, end + 1);
  }
  const dollarTag = /^\$[A-Za-z_]*\$/.exec(sql.slice(index));
  if (dollarTag) {
    const close = sql.indexOf(dollarTag[0], index + dollarTag[0].length);
    const end = close === -1 ? sql.length : close + dollarTag[0].length;
    return sql.slice(index, end);
  }
  return null;
}

/** Parte `text` por `separator` solo en el nivel superior (fuera de paréntesis y literales). */
export function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  let index = 0;
  while (index < text.length) {
    const quoted = readQuoted(text, index);
    if (quoted) {
      current += quoted;
      index += quoted.length;
      continue;
    }
    const char = text[index];
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === separator && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
    index += 1;
  }
  if (current.trim()) parts.push(current.trim());
  return parts.filter(Boolean);
}

type Token =
  | { kind: "word"; text: string }
  | { kind: "string"; text: string }
  | { kind: "group"; text: string };

/** Palabras, literales y grupos (…) del nivel superior de un fragmento. */
function tokenize(fragment: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < fragment.length) {
    const char = fragment[index];
    if (/\s/.test(char)) {
      index += 1;
    } else if (char === "'") {
      const quoted = readQuoted(fragment, index) ?? "";
      tokens.push({ kind: "string", text: quoted.slice(1, -1).replace(/''/g, "'") });
      index += quoted.length;
    } else if (char === "(") {
      const end = findClosingParen(fragment, index);
      tokens.push({ kind: "group", text: fragment.slice(index + 1, end).trim() });
      index = end + 1;
    } else {
      const word = /^[^\s()']+/.exec(fragment.slice(index))?.[0] ?? char;
      tokens.push({ kind: "word", text: word });
      index += word.length;
    }
  }
  return tokens;
}

function findClosingParen(text: string, openIndex: number): number {
  let depth = 0;
  let index = openIndex;
  while (index < text.length) {
    const quoted = readQuoted(text, index);
    if (quoted) {
      index += quoted.length;
      continue;
    }
    if (text[index] === "(") depth += 1;
    if (text[index] === ")") {
      depth -= 1;
      if (depth === 0) return index;
    }
    index += 1;
  }
  throw new Error(`Paréntesis sin cerrar: ${text.slice(openIndex, openIndex + 80)}`);
}

const isWord = (token: Token | undefined, ...texts: string[]): boolean =>
  token?.kind === "word" && texts.includes(token.text.toLowerCase());

// ─── Esquema mutable interno ─────────────────────────────────────────────────

interface MutableTable {
  name: string;
  columns: Map<string, SqlColumn>;
  checks: SqlCheck[];
}

interface ParserState {
  enums: Map<string, string[]>;
  tables: Map<string, MutableTable>;
}

/** `public.x` o `x` → `x`; otros esquemas → null (no forman parte de la API). */
function publicName(qualified: string): string | null {
  const parts = qualified.replace(/"/g, "").split(".");
  if (parts.length === 1) return parts[0].toLowerCase();
  return parts[0].toLowerCase() === "public" ? parts[1].toLowerCase() : null;
}

const TYPE_ALIASES: Record<string, string> = {
  integer: "int",
  int4: "int",
  int8: "bigint",
  bool: "boolean",
  "timestamp with time zone": "timestamptz",
  "double precision": "float8",
  "character varying": "varchar",
};

const COLUMN_KEYWORDS = [
  "not",
  "null",
  "primary",
  "references",
  "check",
  "unique",
  "generated",
  "constraint",
  "default",
  "collate",
];

function readType(tokens: Token[], start: number): { type: string; next: number } {
  let next = start;
  const words: string[] = [];
  while (tokens[next]?.kind === "word" && !isWord(tokens[next], ...COLUMN_KEYWORDS)) {
    words.push(tokens[next].text.toLowerCase());
    next += 1;
  }
  let type = words.join(" ");
  type = TYPE_ALIASES[type] ?? type;
  if (tokens[next]?.kind === "group" && type !== "") {
    type = `${type}(${tokens[next].text.replace(/\s+/g, "")})`;
    next += 1;
  }
  if (type === "") throw new Error("Columna sin tipo");
  return { type, next };
}

function nextCheckName(table: MutableTable, base: string): string {
  const taken = new Set(table.checks.map((check) => check.name));
  if (!taken.has(base)) return base;
  let suffix = 1;
  while (taken.has(`${base}${suffix}`)) suffix += 1;
  return `${base}${suffix}`;
}

const REFERENTIAL_ACTION_WORDS = ["cascade", "restrict", "set", "null", "default", "no", "action"];

function skipReferentialActions(tokens: Token[], start: number): number {
  let next = start;
  while (isWord(tokens[next], "on") && isWord(tokens[next + 1], "update", "delete")) {
    next += 2;
    while (isWord(tokens[next], ...REFERENTIAL_ACTION_WORDS)) next += 1;
  }
  return next;
}

/** Agrega una columna (y sus CHECK inline) a `table`. */
function addColumn(table: MutableTable, definition: string): void {
  const tokens = tokenize(definition);
  const name = tokens[0].text.replace(/"/g, "").toLowerCase();
  const { type, next: afterType } = readType(tokens, 1);
  const column: SqlColumn = { name, type, notNull: false, references: null };
  let pendingName: string | null = null;
  let index = afterType;

  while (index < tokens.length) {
    const token = tokens[index];
    if (isWord(token, "not") && isWord(tokens[index + 1], "null")) {
      column.notNull = true;
      index += 2;
    } else if (isWord(token, "null", "unique")) {
      index += 1;
    } else if (isWord(token, "primary") && isWord(tokens[index + 1], "key")) {
      column.notNull = true;
      index += 2;
    } else if (isWord(token, "constraint")) {
      pendingName = tokens[index + 1].text.toLowerCase();
      index += 2;
    } else if (isWord(token, "check") && tokens[index + 1]?.kind === "group") {
      table.checks.push({
        name: pendingName ?? nextCheckName(table, `${table.name}_${name}_check`),
        column: name,
        expression: tokens[index + 1].text,
      });
      pendingName = null;
      index += 2;
    } else if (isWord(token, "references")) {
      const referencedTable = publicName(tokens[index + 1].text);
      const hasColumn = tokens[index + 2]?.kind === "group";
      column.references = {
        table: referencedTable ?? tokens[index + 1].text,
        column: hasColumn ? tokens[index + 2].text.toLowerCase() : "id",
      };
      index = skipReferentialActions(tokens, index + (hasColumn ? 3 : 2));
    } else if (isWord(token, "default", "generated", "collate")) {
      if (isWord(token, "generated")) column.notNull = true;
      index += 1;
      while (index < tokens.length && !isWord(tokens[index], ...COLUMN_KEYWORDS)) index += 1;
    } else {
      throw new Error(`Modificador no modelado en ${table.name}.${name}: ${definition}`);
    }
  }
  table.columns.set(name, column);
}

/** Columna única referida por un CHECK de tabla, para nombrarlo como PostgreSQL. */
function singleReferencedColumn(table: MutableTable, expression: string): string | null {
  const referenced = [...table.columns.keys()].filter((column) =>
    new RegExp(`\\b${column}\\b`).test(expression)
  );
  return referenced.length === 1 ? referenced[0] : null;
}

function addTableConstraint(table: MutableTable, definition: string): void {
  const tokens = tokenize(definition);
  let name: string | null = null;
  let index = 0;
  if (isWord(tokens[0], "constraint")) {
    name = tokens[1].text.toLowerCase();
    index = 2;
  }
  if (isWord(tokens[index], "unique") || isWord(tokens[index], "primary")) return;
  if (isWord(tokens[index], "check") && tokens[index + 1]?.kind === "group") {
    const expression = tokens[index + 1].text;
    const column = singleReferencedColumn(table, expression);
    table.checks.push({
      name: name ?? nextCheckName(table, `${table.name}_${column ?? ""}${column ? "_" : ""}check`),
      column,
      expression,
    });
    return;
  }
  throw new Error(`Restricción de tabla no modelada en ${table.name}: ${definition}`);
}

const TABLE_CONSTRAINT_START = /^(constraint|unique|primary|check|foreign|exclude)\b/i;

function parseCreateTable(state: ParserState, statement: string): void {
  const match = /^create table (?:if not exists )?([\w."]+) \(/i.exec(statement);
  if (!match) throw new Error(`create table no modelado: ${statement.slice(0, 80)}`);
  const name = publicName(match[1]);
  if (name === null) return;
  const open = match[0].length - 1;
  const body = statement.slice(open + 1, findClosingParen(statement, open));
  const table: MutableTable = { name, columns: new Map(), checks: [] };
  for (const entry of splitTopLevel(body, ",")) {
    if (TABLE_CONSTRAINT_START.test(entry)) addTableConstraint(table, entry);
    else addColumn(table, entry);
  }
  state.tables.set(name, table);
}

function requireTable(state: ParserState, name: string): MutableTable {
  const table = state.tables.get(name);
  if (!table) throw new Error(`Tabla desconocida: ${name}`);
  return table;
}

const IGNORED_ALTER_TABLE_ACTIONS =
  /^(enable|disable|force|no force) row level security$|^owner to |^replica identity /i;
const NON_CHECK_CONSTRAINT_SUFFIX = /_(key|pkey|fkey|excl)$/;

function applyAlterColumn(table: MutableTable, action: string): void {
  const match = /^alter (?:column )?([\w"]+) (.+)$/i.exec(action);
  const column = match ? table.columns.get(match[1].replace(/"/g, "").toLowerCase()) : undefined;
  if (!match || !column) throw new Error(`alter column no modelado en ${table.name}: ${action}`);
  const change = match[2];
  const typeChange = /^(?:set data )?type (.+?)(?: using .+)?$/i.exec(change);
  if (typeChange) {
    column.type = readType(tokenize(typeChange[1]), 0).type;
  } else if (/^set not null$/i.test(change)) {
    column.notNull = true;
  } else if (/^drop not null$/i.test(change)) {
    column.notNull = false;
  } else if (!/^(set|drop) default\b/i.test(change)) {
    throw new Error(`alter column no modelado en ${table.name}: ${action}`);
  }
}

function applyAlterTableAction(state: ParserState, table: MutableTable, action: string): void {
  const addColumnMatch = /^add column (?:if not exists )?(.+)$/i.exec(action);
  const addConstraintMatch = /^add (constraint .+|check .+|unique .+|primary key .+)$/i.exec(action);
  const dropColumnMatch = /^drop column (?:if exists )?([\w"]+)/i.exec(action);
  const dropConstraintMatch = /^drop constraint (if exists )?([\w"]+)/i.exec(action);
  const renameColumnMatch = /^rename (?:column )?([\w"]+) to ([\w"]+)$/i.exec(action);
  const renameTableMatch = /^rename to ([\w"]+)$/i.exec(action);

  if (addColumnMatch) {
    addColumn(table, addColumnMatch[1]);
  } else if (addConstraintMatch) {
    addTableConstraint(table, addConstraintMatch[1]);
  } else if (dropColumnMatch) {
    const column = dropColumnMatch[1].replace(/"/g, "").toLowerCase();
    table.columns.delete(column);
    table.checks = table.checks.filter((check) => check.column !== column);
  } else if (dropConstraintMatch) {
    const name = dropConstraintMatch[2].replace(/"/g, "").toLowerCase();
    const remaining = table.checks.filter((check) => check.name !== name);
    const known = remaining.length !== table.checks.length;
    if (!known && !dropConstraintMatch[1] && !NON_CHECK_CONSTRAINT_SUFFIX.test(name)) {
      throw new Error(`drop constraint de un CHECK desconocido en ${table.name}: ${name}`);
    }
    table.checks = remaining;
  } else if (renameTableMatch) {
    state.tables.delete(table.name);
    table.name = renameTableMatch[1].toLowerCase();
    state.tables.set(table.name, table);
  } else if (renameColumnMatch) {
    renameColumn(table, renameColumnMatch[1].toLowerCase(), renameColumnMatch[2].toLowerCase());
  } else if (/^alter /i.test(action)) {
    applyAlterColumn(table, action);
  } else if (!IGNORED_ALTER_TABLE_ACTIONS.test(action)) {
    throw new Error(`alter table no modelado en ${table.name}: ${action}`);
  }
}

function renameColumn(table: MutableTable, from: string, to: string): void {
  const column = table.columns.get(from);
  if (!column) throw new Error(`Columna desconocida: ${table.name}.${from}`);
  table.columns.delete(from);
  table.columns.set(to, { ...column, name: to });
  const word = new RegExp(`\\b${from}\\b`, "g");
  table.checks = table.checks.map((check) => ({
    ...check,
    column: check.column === from ? to : check.column,
    expression: check.expression.replace(word, to),
  }));
}

function parseAlterTable(state: ParserState, statement: string): void {
  const match = /^alter table (?:if exists )?(?:only )?([\w."]+) (.+)$/i.exec(statement);
  if (!match) throw new Error(`alter table no modelado: ${statement.slice(0, 80)}`);
  const name = publicName(match[1]);
  if (name === null) return;
  const table = requireTable(state, name);
  for (const action of splitTopLevel(match[2], ",")) applyAlterTableAction(state, table, action);
}

function parseEnumStatement(state: ParserState, statement: string): void {
  const create = /^create type ([\w."]+) as enum \((.*)\)$/i.exec(statement);
  if (create) {
    const name = publicName(create[1]);
    const values = tokenize(create[2]).filter((token) => token.kind === "string");
    if (name) state.enums.set(name, values.map((token) => token.text));
    return;
  }
  const alter = /^alter type ([\w."]+) (.+)$/i.exec(statement);
  const name = alter ? publicName(alter[1]) : null;
  if (!alter || name === null) return;
  const values = state.enums.get(name);
  if (!values) throw new Error(`alter type de un enum desconocido: ${name}`);

  const add = /^add value (?:if not exists )?'([^']+)'(?: (before|after) '([^']+)')?$/i.exec(alter[2]);
  const renameValue = /^rename value '([^']+)' to '([^']+)'$/i.exec(alter[2]);
  const renameType = /^rename to ([\w"]+)$/i.exec(alter[2]);
  if (add) {
    if (values.includes(add[1])) return;
    const anchor = add[3] ? values.indexOf(add[3]) : values.length;
    const position = add[2]?.toLowerCase() === "after" ? anchor + 1 : anchor;
    values.splice(position, 0, add[1]);
  } else if (renameValue) {
    const position = values.indexOf(renameValue[1]);
    if (position === -1) throw new Error(`rename value de un valor desconocido: ${statement}`);
    values[position] = renameValue[2];
  } else if (renameType) {
    state.enums.delete(name);
    state.enums.set(renameType[1].toLowerCase(), values);
  } else if (!/^owner to /i.test(alter[2])) {
    throw new Error(`alter type no modelado: ${statement}`);
  }
}

function parseDrop(state: ParserState, statement: string): void {
  const match = /^drop (table|type) (?:if exists )?([\w.", ]+?)(?: cascade| restrict)?$/i.exec(statement);
  if (!match) return;
  for (const qualified of match[2].split(",")) {
    const name = publicName(qualified.trim());
    if (name === null) continue;
    if (match[1].toLowerCase() === "table") state.tables.delete(name);
    else state.enums.delete(name);
  }
}

/** Separa sentencias por `;` fuera de literales, cuerpos $$ y paréntesis. */
export function splitStatements(sql: string): string[] {
  return splitTopLevel(sql, ";").map((statement) => statement.replace(/\s+/g, " ").trim());
}

/** Aplica, en orden, todas las migraciones concatenadas y devuelve el esquema público resultante. */
export function parseMigrations(sql: string): SqlSchema {
  const state: ParserState = { enums: new Map(), tables: new Map() };
  for (const statement of splitStatements(stripSqlComments(sql))) {
    if (/^create table /i.test(statement)) parseCreateTable(state, statement);
    else if (/^alter table /i.test(statement)) parseAlterTable(state, statement);
    else if (/^(create|alter) type /i.test(statement)) parseEnumStatement(state, statement);
    else if (/^drop (table|type) /i.test(statement)) parseDrop(state, statement);
  }
  const tables = new Map(
    [...state.tables].map(([name, table]): [string, SqlTable] => [
      name,
      { name, columns: [...table.columns.values()], checks: [...table.checks] },
    ])
  );
  return { enums: state.enums, tables };
}

// ─── Análisis de expresiones CHECK ───────────────────────────────────────────

export type CheckAtom =
  | { kind: "lowerBound"; value: number; inclusive: boolean }
  | { kind: "upperBound"; value: number; inclusive: boolean }
  | { kind: "lengthMin"; value: number }
  | { kind: "lengthMax"; value: number }
  | { kind: "pattern"; source: string }
  | { kind: "maxScale"; value: number }
  | { kind: "notFutureDate"; timeZone: string }
  | { kind: "notFutureTimestamp"; skewMinutes: number }
  | { kind: "minItems"; value: number }
  | { kind: "jsonObject" }
  | { kind: "maxStoredBytes"; value: number }
  | { kind: "notBefore"; otherColumn: string }
  | { kind: "oneOf"; values: string[] }
  | { kind: "unknown"; expression: string };

const NUMBER = String.raw`(-?\d+(?:\.\d+)?)`;

function stripOuterParens(expression: string): string {
  let current = expression.trim();
  while (current.startsWith("(") && findClosingParen(current, 0) === current.length - 1) {
    current = current.slice(1, -1).trim();
  }
  return current;
}

/** Parte por AND del nivel superior sin romper `between x and y`. */
function splitConjunction(expression: string): string[] {
  const AND_MARK = "\u0000";
  const pieces: string[] = [];
  const marked = expression.replace(/\s+and\s+/gi, AND_MARK);
  for (const markedPiece of splitTopLevel(marked, AND_MARK)) {
    // Los AND dentro de paréntesis no parten el átomo: se restauran tal cual.
    const piece = markedPiece.replaceAll(AND_MARK, " and ");
    const previous = pieces.at(-1);
    if (previous !== undefined && /\bbetween\s+\S+$/i.test(previous)) {
      pieces[pieces.length - 1] = `${previous} and ${piece}`;
    } else {
      pieces.push(piece);
    }
  }
  return pieces;
}

function analyzeAtom(column: string, rawAtom: string): CheckAtom[] {
  const c = column;
  // CHECK con NULL da "unknown" y pasa: `c is null or X` equivale a `X`.
  const atom = stripOuterParens(rawAtom).replace(new RegExp(`^${c} is null or `, "i"), "");
  const rules: [RegExp, (match: RegExpExecArray) => CheckAtom[]][] = [
    [new RegExp(`^${c} between ${NUMBER} and ${NUMBER}$`, "i"), (m) => [
      { kind: "lowerBound", value: Number(m[1]), inclusive: true },
      { kind: "upperBound", value: Number(m[2]), inclusive: true },
    ]],
    [new RegExp(`^${c} (>=|>) ${NUMBER}$`, "i"), (m) => [
      { kind: "lowerBound", value: Number(m[2]), inclusive: m[1] === ">=" },
    ]],
    [new RegExp(`^${c} (<=|<) ${NUMBER}$`, "i"), (m) => [
      { kind: "upperBound", value: Number(m[2]), inclusive: m[1] === "<=" },
    ]],
    [new RegExp(`^char_length\\(${c}\\) between (\\d+) and (\\d+)$`, "i"), (m) => [
      { kind: "lengthMin", value: Number(m[1]) },
      { kind: "lengthMax", value: Number(m[2]) },
    ]],
    [new RegExp(`^char_length\\(${c}\\) <= (\\d+)$`, "i"), (m) => [{ kind: "lengthMax", value: Number(m[1]) }]],
    [new RegExp(`^char_length\\(${c}\\) >= (\\d+)$`, "i"), (m) => [{ kind: "lengthMin", value: Number(m[1]) }]],
    [new RegExp(`^${c} ~ '((?:[^']|'')*)'$`, "i"), (m) => [{ kind: "pattern", source: m[1].replace(/''/g, "'") }]],
    [new RegExp(`^scale\\(${c}\\) <= (\\d+)$`, "i"), (m) => [{ kind: "maxScale", value: Number(m[1]) }]],
    [new RegExp(`^${c} <= \\(now\\(\\) at time zone '([^']+)'\\)::date$`, "i"), (m) => [
      { kind: "notFutureDate", timeZone: m[1] },
    ]],
    [new RegExp(`^${c} <= now\\(\\) \\+ interval '(\\d+) minutes'$`, "i"), (m) => [
      { kind: "notFutureTimestamp", skewMinutes: Number(m[1]) },
    ]],
    [new RegExp(`^cardinality\\(${c}\\) >= (\\d+)$`, "i"), (m) => [{ kind: "minItems", value: Number(m[1]) }]],
    [new RegExp(`^jsonb_typeof\\(${c}\\) = 'object'$`, "i"), () => [{ kind: "jsonObject" }]],
    [new RegExp(`^pg_column_size\\(${c}\\) <= (\\d+)$`, "i"), (m) => [{ kind: "maxStoredBytes", value: Number(m[1]) }]],
    [new RegExp(`^${c} >= ([a-z_]\\w*)$`, "i"), (m) => [{ kind: "notBefore", otherColumn: m[1].toLowerCase() }]],
    [new RegExp(`^${c} in \\((.+)\\)$`, "i"), (m) => [{
      kind: "oneOf",
      values: tokenize(m[1]).filter((token) => token.kind === "string").map((token) => token.text),
    }]],
  ];
  for (const [pattern, build] of rules) {
    const match = pattern.exec(atom);
    if (match) return build(match);
  }
  return [{ kind: "unknown", expression: atom }];
}

/** Traduce el CHECK de una columna a átomos verificables; lo no reconocido queda como `unknown`. */
export function analyzeColumnCheck(column: string, expression: string): CheckAtom[] {
  return splitConjunction(stripOuterParens(expression)).flatMap((atom) => analyzeAtom(column, atom));
}
