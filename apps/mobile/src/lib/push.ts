import { supabase } from '@/lib/supabase';

/**
 * Best-effort push notification. Invokes the `send-push` Edge Function which
 * resolves the recipients' Expo tokens and delivers via Expo's push service.
 * Failures are swallowed so notifications never break the primary flow.
 */
export async function notifyUsers(
  userIds: (string | null | undefined)[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const recipients = userIds.filter((u): u is string => !!u);
  if (!recipients.length) return;
  try {
    await supabase.functions.invoke('send-push', {
      body: { userIds: recipients, title, body, data },
    });
  } catch {
    // ignore
  }
}
