/**
 * Local mirror of the hub's scalar-file-column ratchet.
 *
 * Every column holding a hub file id must be named by
 * `manifest.delete_file_columns`, so the hub reads the id off the doomed row
 * and queues the R2 reclaim inside the DELETE's own transaction. The pattern
 * this replaces was a trailing `files.delete(id).catch(() => {})` in the
 * client, fired after the row was already gone: when it was interrupted the
 * metadata row survived, so the orphan reconciler read the object as live, no
 * UI could reach it, and it stayed billed against the household's hard file cap
 * until the app was uninstalled.
 *
 * `delete_cascades` does NOT satisfy this. That key fires when the PARENT is
 * deleted; a direct DELETE of the row that owns the file consults
 * `delete_file_columns` and nothing else.
 *
 * The hub rejects the bundle at publish time. This test is the same check where
 * it is cheap to fix.
 */
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { describe, it, expect } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(__dirname, "../manifest.json"), "utf-8"));
const prefix = `app_${manifest.id.replaceAll("-", "_")}__`;

const migrationsDir = join(__dirname, "../migrations");
const schema = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(join(migrationsDir, f), "utf-8"))
  .join("\n");

/** Scalar hub-file-id columns. List columns (`*_file_ids`) are a different
 *  lane — the reclaim engine reads raw SQL and cannot parse a JSON array. */
const FILE_ID_COLUMN_RE = /^(?:file_id|file_key|photo_id|[a-z0-9_]*_file_id|[a-z0-9_]*_photo_id|[a-z0-9_]*_image_id)$/;

function createTableBody(table) {
  const head = new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+["\\[]?${table}["\\]]?\\s*\\(`, "i");
  const m = head.exec(schema);
  if (!m) return null;
  let depth = 1;
  let i = m.index + m[0].length;
  const start = i;
  while (i < schema.length && depth > 0) {
    if (schema[i] === "(") depth++;
    else if (schema[i] === ")") depth--;
    i++;
  }
  return schema.slice(start, i - 1);
}

function columnNames(body) {
  const segments = [];
  let depth = 0;
  let current = "";
  for (const ch of body) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) { segments.push(current); current = ""; } else current += ch;
  }
  segments.push(current);
  const constraints = new Set(["primary", "unique", "check", "foreign", "constraint"]);
  return segments
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.split(/\s+/)[0].replace(/^["[`]|["\]`]$/g, ""))
    .filter((name) => !constraints.has(name.toLowerCase()));
}

/** Every app table's columns: CREATE TABLE bodies plus appended ALTER TABLE ADD
 *  COLUMN statements. Both checks below need the ALTERs — several apps add
 *  their file column in a later migration. */
function appTableColumns() {
  const tables = new Map();
  for (const m of schema.matchAll(/create\s+table\s+if\s+not\s+exists\s+["\[]?([A-Za-z0-9_]+)["\]]?\s*\(/gi)) {
    if (!m[1].startsWith(prefix)) continue;
    const body = createTableBody(m[1]);
    if (body) tables.set(m[1], new Set(columnNames(body)));
  }
  for (const m of schema.matchAll(/alter\s+table\s+["\[]?([A-Za-z0-9_]+)["\]]?\s+add\s+column\s+["\[]?([A-Za-z0-9_]+)["\]]?/gi)) {
    tables.get(m[1])?.add(m[2]);
  }
  return tables;
}

/** [unprefixedTable, column] for every scalar file column in the schema. */
function schemaFileColumns() {
  const found = [];
  for (const [physical, columns] of appTableColumns()) {
    for (const column of columns) {
      if (FILE_ID_COLUMN_RE.test(column)) found.push([physical.slice(prefix.length), column]);
    }
  }
  return found;
}

/** Tables/columns whose deletes reclaim durably: delete_file_columns, plus
 *  versioned_records (that lane reclaims through the countersigned purge). */
function declaredColumns() {
  const declared = new Map();
  const add = (table, columns) => {
    if (!table) return;
    const set = declared.get(table) ?? new Set();
    declared.set(table, set);
    for (const column of [columns].flat().filter(Boolean)) set.add(column);
  };
  for (const [table, columns] of Object.entries(manifest.delete_file_columns ?? {})) add(table, columns);
  for (const cfg of Object.values(manifest.versioned_records ?? {})) {
    add(cfg.table, cfg.file_column);
    add(cfg.version_table, cfg.file_column);
  }
  return declared;
}

describe("hub file reclaim", () => {
  it("declares every scalar file column for the app-originated delete lane", () => {
    const declared = declaredColumns();
    const undeclared = schemaFileColumns()
      .filter(([table, column]) => !declared.get(table)?.has(column))
      .map(([table, column]) => `${table}.${column}`);
    expect(undeclared).toEqual([]);
  });

  it("names only real tables and columns", () => {
    const tables = appTableColumns();
    for (const [table, columns] of Object.entries(manifest.delete_file_columns ?? {})) {
      const names = tables.get(`${prefix}${table}`);
      expect(names, `delete_file_columns.${table} has no CREATE TABLE`).toBeDefined();
      // The engine resolves the doomed rows by id before deleting them.
      expect(names.has("id"), `${table} needs an id column`).toBe(true);
      for (const column of columns) {
        expect(names.has(column), `${table}.${column} is missing from the schema`).toBe(true);
        // The reclaim reads this column in raw SQL, outside the decrypt path.
        expect(column.endsWith("_id") || (manifest.db_plaintext_columns ?? []).includes(column)
          || manifest.db_encryption === "off", `${table}.${column} would be encrypted at rest`).toBe(true);
      }
    }
  });
});

/**
 * This app stores hub FILE IDS, not URLs. A URL cannot be declared to the
 * hub's reclaim keys — the engine hands the column's contents straight to the
 * outbox — so while these columns held URLs, every lane that unlinks a photo
 * had to reclaim with a best-effort `files.delete()` fired after the write,
 * and a lost call stranded the bytes for good.
 */
import { readFileSync as _read } from "fs";
const clientSrc = _read(new URL("../src/index.html", import.meta.url), "utf-8");

describe("file ids, not URLs", () => {
  it("declares both unlink lanes: replacing a plan, and dropping a photo", () => {
    expect(manifest.update_file_columns?.gardens).toContain("plan_file_id");
    expect(manifest.update_file_list_columns?.plants).toContain("photo_file_ids");
  });

  it("declares the delete lanes too — they are independent of the update ones", () => {
    expect(manifest.delete_file_columns?.gardens).toContain("plan_file_id");
    expect(manifest.delete_file_list_columns?.plants).toContain("photo_file_ids");
  });

  it("stores the upload's id, never its url", () => {
    expect(clientSrc).not.toContain("result.url");
  });

  it("no longer parses a file id back out of a URL", () => {
    // `url.split('/api/files/')[1]` hard-coded the hub's routing into app data.
    expect(clientSrc).not.toContain("/api/files/");
  });

  it("hands both unlink lanes to the hub rather than reclaiming client-side", () => {
    const remove = clientSrc.slice(
      clientSrc.indexOf("async function removePhotoFromPlant("),
      clientSrc.indexOf("async function uploadFloorPlan("),
    );
    expect(remove).not.toContain("files.delete");
    const plan = clientSrc.slice(
      clientSrc.indexOf("async function uploadFloorPlan("),
      clientSrc.indexOf("// ── Wire file inputs"),
    );
    // The only deletes left in the floor-plan lane undo an upload no row ever
    // referenced — never the replaced plan, which is the hub's now.
    expect(plan).not.toContain("files.delete(previous");
  });
});
