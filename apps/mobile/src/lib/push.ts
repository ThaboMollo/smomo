import { supabase } from '@/lib/supabase';

/**
 * Best-effort push notifications via the `send-push` Edge Function.
 *
 * The function no longer accepts a recipient list — it derives the recipient
 * from the booking or request and verifies the caller is entitled to notify
 * them. Failures are swallowed so notifications never break the primary flow.
 */
async function send(body: Record<string, unknown>): Promise<void> {
  try {
    await supabase.functions.invoke('send-push', { body });
  } catch {
    // ignore
  }
}

/** Notifies the other party of a booking. */
export function notifyBooking(
  bookingId: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!bookingId) return Promise.resolve();
  return send({ bookingId, title, body, data });
}

/** Notifies the client who posted a request. Caller must have an offer on it. */
export function notifyRequestClient(
  requestId: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!requestId) return Promise.resolve();
  return send({ requestId, title, body, data });
}
