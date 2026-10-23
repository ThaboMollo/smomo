import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Sends Expo push notifications to the other party of a booking.
//
// Previously this took `userIds: string[]` straight from the request body and
// fanned out on the service-role key with no authorisation check, so any caller
// holding any valid JWT — including an anonymous Supabase user — could push
// arbitrary notifications to arbitrary users.
//
// Now the caller names a booking, and the function works out who the other
// party is using the CALLER's own JWT (so RLS decides whether they may see that
// booking at all). The service-role client is used only to read push tokens,
// which no user is allowed to read directly.
//
// Body: { bookingId, title, body, data? }  -> notifies the other party
//    or { requestId, title, body, data? }  -> notifies the request's client,
//                                             and only if the caller has an
//                                             offer on that request

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "missing bearer token" }, 401);
    }

    const { bookingId, requestId, title, body, data } = await req.json();
    const hasBooking = typeof bookingId === "string" && bookingId.length > 0;
    const hasRequest = typeof requestId === "string" && requestId.length > 0;
    if (hasBooking === hasRequest) {
      return json({ error: "supply exactly one of bookingId or requestId" }, 400);
    }
    if (typeof title !== "string" || typeof body !== "string") {
      return json({ error: "title and body are required" }, 400);
    }

    // Caller-scoped client: RLS applies, so an unrelated user sees no booking.
    const asCaller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: me } = await asCaller.auth.getUser();
    if (!me?.user) return json({ error: "invalid token" }, 401);

    // Push tokens are not readable by any user role, hence service role here.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let recipient: string;

    if (hasBooking) {
      const { data: booking, error: bookingErr } = await asCaller
        .from("bookings")
        .select("id, client_id, practitioner_id")
        .eq("id", bookingId)
        .maybeSingle();
      if (bookingErr) throw bookingErr;
      if (!booking) return json({ error: "booking not found" }, 404);

      // Only a party may notify, and only the OTHER party may be notified.
      if (me.user.id === booking.client_id) {
        recipient = booking.practitioner_id;
      } else if (me.user.id === booking.practitioner_id) {
        recipient = booking.client_id;
      } else {
        return json({ error: "not a party to this booking" }, 403);
      }
    } else {
      // Request scope: used when a practitioner has just made an offer, before
      // any booking exists. Proven by the caller's own offer row, which
      // request_offers RLS only returns to that practitioner.
      const { data: offer, error: offerErr } = await asCaller
        .from("request_offers")
        .select("id")
        .eq("request_id", requestId)
        .eq("practitioner_id", me.user.id)
        .maybeSingle();
      if (offerErr) throw offerErr;
      if (!offer) return json({ error: "no offer by you on this request" }, 403);

      const { data: request, error: reqErr } = await admin
        .from("booking_requests")
        .select("client_id")
        .eq("id", requestId)
        .maybeSingle();
      if (reqErr) throw reqErr;
      if (!request) return json({ error: "request not found" }, 404);
      recipient = request.client_id;
    }

    const { data: tokens, error } = await admin
      .from("device_push_tokens")
      .select("expo_push_token")
      .eq("user_id", recipient);
    if (error) throw error;

    const messages = (tokens ?? []).map((t: { expo_push_token: string }) => ({
      to: t.expo_push_token,
      sound: "default",
      title,
      body,
      data: { ...(data ?? {}), ...(hasBooking ? { bookingId } : { requestId }) },
    }));

    if (messages.length > 0) {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(messages),
      });
    }

    return json({ sent: messages.length });
  } catch (e) {
    return json({ error: String(e) }, 400);
  }
});
