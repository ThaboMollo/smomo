import { PortfolioGrid, type PortfolioRow } from '@/components/PortfolioGrid';
import { requireUser } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Portfolio' };

/**
 * The pro's work.
 *
 * Read-and-curate only: captions, visibility and removal. **Uploading is not here** — it
 * needs the Supabase Storage client, a signed upload path and image validation, which the
 * mobile app already has (`lib/upload.ts`). Adding a second, divergent upload path for the
 * sake of completeness would be worse than sending people to the one that works.
 */
export default async function Portfolio() {
  const user = await requireUser();
  if (!user.isPractitioner) {
    return (
      <div className="panel">
        <div className="panel-body text-sm text-text-muted">
          <p className="font-medium text-text">This section is for professionals.</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('id, image_url, caption, category, is_public, source, created_at')
    .eq('practitioner_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Portfolio</h1>
        <p className="mt-1 text-sm text-text-muted">
          Your public work. Upload new photos from the SMOMO app; caption, hide and remove
          them here.
        </p>
      </div>

      <PortfolioGrid rows={(data ?? []) as PortfolioRow[]} />
    </div>
  );
}
