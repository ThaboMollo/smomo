import { formatDateShort, type ServiceCategory, type ServiceMode } from '@smomo/shared';

import { BaseAndStatus } from '@/components/BaseAndStatus';
import { StudioForm } from '@/components/StudioForm';
import { VerificationTag } from '@/components/Tag';
import { requireUser } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'My studio' };

/**
 * The pro's own business profile.
 *
 * Read directly from `practitioner_profiles` plus its two side tables rather than through
 * the API's `/me`, because this page is the one place that edits them and wants the stored
 * values, not a composed view. RLS scopes every read to the caller.
 *
 * `verification_status` is shown but not editable — that is a staff decision, and the most
 * recent decision's note is surfaced so a rejected pro knows what to fix rather than
 * having to ask.
 */
export default async function Studio() {
  const user = await requireUser();
  if (!user.isPractitioner) {
    return (
      <div className="panel">
        <div className="panel-body text-sm text-text-muted">
          <p className="font-medium text-text">You do not have a studio yet.</p>
          <p className="mt-1">Set one up in the SMOMO app to start taking work.</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: pp }, { data: cats }, { data: socials }, { data: decisions }] = await Promise.all([
    supabase
      .from('practitioner_profiles')
      .select('business_name, bio, service_mode, travel_radius_km, years_experience, requires_deposit, deposit_percentage, base_address, city, is_online, verification_status, verified_at')
      .eq('id', user.id)
      .maybeSingle(),
    supabase.from('practitioner_categories').select('category').eq('practitioner_id', user.id),
    supabase.from('practitioner_socials').select('platform, handle').eq('practitioner_id', user.id),
    supabase
      .from('practitioner_verification_events')
      .select('to_status, note, created_at')
      .eq('practitioner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  if (!pp) {
    return (
      <div className="panel">
        <div className="panel-body text-sm text-text-muted">
          Your studio record is missing. Sign out and back in; if it persists, contact support.
        </div>
      </div>
    );
  }

  const handles = Object.fromEntries((socials ?? []).map((s) => [s.platform, s.handle])) as Record<string, string | undefined>;
  const lastDecision = decisions?.[0];
  const verified = pp.verification_status === 'verified';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">My studio</h1>
          <p className="mt-1 text-sm text-text-muted">
            What clients see, and how you are matched to work.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <VerificationTag status={pp.verification_status} />
          {verified && pp.verified_at ? (
            <span className="text-xs text-text-muted">since {formatDateShort(pp.verified_at)}</span>
          ) : null}
        </div>
      </div>

      {/* The staff note is the only thing that explains a rejection, so it leads. */}
      {lastDecision?.note && pp.verification_status === 'rejected' ? (
        <div className="panel">
          <div className="panel-body">
            <p className="text-sm font-medium text-danger">Verification was not approved</p>
            <p className="mt-1 text-sm text-text">{lastDecision.note}</p>
            <p className="mt-1 text-xs text-text-muted">
              Fix this and your profile is reviewed again. {formatDateShort(lastDecision.created_at)}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem] lg:items-start">
        <StudioForm
          initial={{
            businessName: pp.business_name ?? '',
            bio: pp.bio ?? '',
            categories: (cats ?? []).map((c) => c.category) as ServiceCategory[],
            serviceMode: (pp.service_mode ?? 'both') as ServiceMode,
            travelRadiusKm: pp.travel_radius_km ?? 15,
            yearsExperience: pp.years_experience,
            requiresDeposit: !!pp.requires_deposit,
            depositPercentage: pp.deposit_percentage,
            instagram: handles.instagram ?? '',
            facebook: handles.facebook ?? '',
            tiktok: handles.tiktok ?? '',
            xHandle: handles.x ?? '',
          }}
        />

        <BaseAndStatus
          baseAddress={pp.base_address ?? ''}
          city={pp.city ?? ''}
          isOnline={!!pp.is_online}
          verified={verified}
        />
      </div>
    </div>
  );
}
