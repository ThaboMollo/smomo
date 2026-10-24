import { redirect } from 'next/navigation';

import { CONSOLE_URL } from '@/lib/env';

/**
 * Moved. The schedule now lives in the SMOMO Console (`apps/admin`) as
 * **Bookings**, so there is one implementation rather than two kept in step by hand.
 *
 * A redirect rather than a deletion: anyone with this bookmarked, or following an old
 * push notification, lands where the feature actually is instead of on a 404.
 */
export default function MovedToConsole() {
  redirect(`${CONSOLE_URL}/bookings`);
}
