import { requireStaff } from '@/lib/session';

/**
 * Gate for every `/platform/*` route. One check here rather than repeated in each page,
 * and a professional who guesses a URL gets a 404 rather than a "forbidden" page — the
 * console does not confirm which routes exist to someone who may not see them.
 *
 * This is the fast gate. Every staff RPC re-checks `is_admin()` in the database, which is
 * the actual boundary.
 */
export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  await requireStaff();
  return children;
}
