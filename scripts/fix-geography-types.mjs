#!/usr/bin/env node
/**
 * Post-processes `packages/shared/src/database.ts` after `supabase gen types`.
 *
 * The generator emits PostGIS `geography` columns as `unknown`, because it has no mapping
 * for the type. An `unknown` property anywhere in a table's Row is enough to collapse
 * supabase-js's type inference for that whole table: `.from('practitioner_profiles')
 * .select('id')` resolves to `never`, and every column read goes unchecked. The repo never
 * noticed because no app typed its Supabase client — `createServerClient(...)` was called
 * without the `<Database>` generic everywhere.
 *
 * PostgREST serialises `geography` to a GeoJSON string, and nothing in this codebase reads
 * the raw geometry — the RPCs return `distance_km` instead and build points from lat/lng.
 * So `string` is both accurate and enough to restore inference.
 *
 * Runs as part of `pnpm gen:types`, so regenerating cannot silently undo it.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../packages/shared/src/database.ts', import.meta.url);

// Only the geography columns, matched by name, so an `unknown` that genuinely means
// unknown somewhere else is left alone.
const COLUMNS = ['location', 'base_location'];

const src = readFileSync(FILE, 'utf8');
let out = src;
let changed = 0;

for (const col of COLUMNS) {
  // `location: unknown` (Row) and `location?: unknown` (Insert/Update).
  const re = new RegExp(`(\\n\\s+${col})(\\??): unknown(?=\\n)`, 'g');
  out = out.replace(re, (_m, head, optional) => {
    changed += 1;
    return `${head}${optional}: string${optional ? '' : ' | null'}`;
  });
}

if (changed === 0) {
  console.log('fix-geography-types: nothing to change (no `unknown` geography columns found).');
  process.exit(0);
}

writeFileSync(FILE, out);
console.log(`fix-geography-types: mapped ${changed} geography column(s) from \`unknown\` to \`string\`.`);
