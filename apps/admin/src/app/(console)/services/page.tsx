import { ServiceEditor, type ServiceRow } from '@/components/ServiceEditor';
import { requireUser } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Services' };

/**
 * What the pro offers.
 *
 * `services.indicative_price_zar` is the only thing feeding the "from R…" figure on a
 * public profile and in search results — the price of actual work is whatever offer the
 * pro sends. Inactive services stay in the table rather than being deleted so past
 * bookings keep their context.
 *
 * RLS scopes this to the caller's own rows.
 */
export default async function Services() {
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
    .from('services')
    .select('id, category, title, description, duration_minutes, indicative_price_zar, is_active')
    .eq('practitioner_id', user.id)
    .order('is_active', { ascending: false })
    .order('title', { ascending: true });
  if (error) throw error;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Services</h1>
        <p className="mt-1 text-sm text-text-muted">
          What you offer and roughly what it costs. Clients see the lowest typical price as
          “from R…”; the real price is the offer you send.
        </p>
      </div>

      <ServiceEditor rows={(data ?? []) as ServiceRow[]} />
    </div>
  );
}
