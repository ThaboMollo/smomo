/**
 * TEMPORARY type bridge for migration 16 — DELETE THIS FILE once the migration is applied
 * and `pnpm gen:types` has been re-run.
 *
 * `packages/shared/src/database.ts` is generated from the live database, so it describes
 * the schema as it is *now*, not as migration 16 leaves it. The code in this app targets
 * the post-migration shape, because the deploy order is: apply migration 16, then ship the
 * API. Until the types are regenerated the two disagree, and this file is the whole of
 * that disagreement, written down in one place rather than scattered as casts.
 *
 * What migration 16 changes about these three RPCs:
 *   - `create_request`: p_lat/p_lng become nullable with defaults, and p_city is added.
 *   - `set_practitioner_location`: same, plus p_city.
 *   - `search_providers`: same, plus p_city.
 *
 * To remove: apply the migration, run `pnpm gen:types`, delete this file, and drop the
 * `PendingMigration16` intersection from `DbSchema` in `supabase.service.ts`. The
 * regenerated types will then say all of this on their own, and a leftover override here
 * would start masking real drift.
 */
import type { Database } from '@smomo/shared';

type Fns = Database['public']['Functions'];

/**
 * The same widening `supabase.service.ts` applies to every other RPC: an argument the
 * generated types mark optional also accepts an explicit null, because that is what we
 * must send (spec RC-2). Repeated here because these three entries REPLACE the mapped
 * ones rather than adding to them, so they do not inherit it.
 */
type AcceptsNull<Args> = {
  [K in keyof Args]: undefined extends Args[K] ? Args[K] | null : Args[K];
};

/** Inherited arguments, widened, with the migration-16 ones layered over the top. */
type Reshaped<Name extends keyof Fns, Changed> = Omit<Fns[Name], 'Args'> & {
  Args: AcceptsNull<Omit<Fns[Name]['Args'], keyof Changed>> & Changed;
};

/** What migration 16 does to all three: coordinates optional, city added. */
type NullableCoords = {
  p_lat?: number | null;
  p_lng?: number | null;
  p_city?: string | null;
};

export type PendingMigration16 = {
  create_request: Reshaped<'create_request', NullableCoords>;
  set_practitioner_location: Reshaped<'set_practitioner_location', NullableCoords>;
  search_providers: Reshaped<'search_providers', NullableCoords>;
};
