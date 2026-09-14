# Smomo v2 — Progressive Auth & Role-First Onboarding (Implementation Spec)

## 1. Goal
Remove the authentication wall. Anyone can open the app, pick a role, and do the
valuable thing (browse providers / draft a request as a client; build a studio profile as a
practitioner) **before** registering. Registration (email + password) is only required at the
moment of commitment:

- **Client** must register **before publishing** a service request.
- **Practitioner** must register **before saving** their profile.

This supersedes the phone/OTP auth from v1. Phone/WhatsApp become profile fields only.

## 2. Decisions (locked)
- **Anonymous session backbone.** Silent `signInAnonymously()` on launch; registration *upgrades*
  the same account (same `uid`), so drafts/profile/portfolio persist through registration.
- **Login = email + password.** Phone OTP removed → no SMS provider needed.
- **Instant accounts** (email confirmation OFF for MVP).
- **Role-specific registration** (light client, full practitioner).
- **ID Number captured for everyone** (SA ID Luhn-validated, else passport format check).
  **PayShap ID practitioners-only.** For practitioners the ID drives `verification_status`
  (gates going online); for clients it is stored only.
- **Request** = category + optional photo + optional **budget range (min–max)** + booking mode +
  timing. Discovery is **list-only** for now (map commented out).

## 3. Registration field sets
**Client** (gate: "Publish request")
`first_name, last_name, nationality→(id_type,id_number), home_address, mobile, whatsapp?(optional), email, password`

**Practitioner** (gate: "Save profile" — business profile/services/portfolio already built pre-auth)
`first_name, last_name, nationality→(id_type,id_number), home_address, work_address, mobile, whatsapp?(optional), payshap_id, email, password`

`nationality` toggles ID vs Passport. `work_address` is geocoded → `practitioner_profiles.base_location`.

## 4. Data model changes (migration `10_progressive_auth`)
### profiles (add columns)
```
first_name text, last_name text, home_address text, whatsapp_number text
```
Keep `full_name` (set = trim(first || ' ' || last)); `phone` = mobile; email lives in `auth.users`.

### user_identity (generalise practitioner_identity → both roles)
```
alter table public.practitioner_identity rename to user_identity;
-- columns unchanged: user_id pk, id_type, id_number, id_dob, id_gender, id_citizenship,
--                    verification_status, verified_at, timestamps
```
- RLS: owner + admin only (rename policies).
- `process_identity_verification` trigger: unchanged (Luhn/passport validate + extract).
- `sync_verification_to_profile` trigger: guard so it only updates `practitioner_profiles`
  when a row exists (clients have none) — `update ... where id = new.user_id` already no-ops safely.

### booking_requests
```
alter table public.booking_requests
  drop column offer_price_zar,
  add column image_url text,
  add column budget_min numeric(10,2),
  add column budget_max numeric(10,2);
```

### RPCs
- `create_request(...)`: replace `p_offer_price` with `p_budget_min, p_budget_max, p_image_url`.
- `feed_requests_for_practitioner(...)`: return `budget_min, budget_max, image_url`
  (drop `offer_price_zar`). (search_providers unchanged.)

### Storage
- New bucket **`request-photos`** (public-read, owner-write, `{uid}/…` convention) + 4 policies
  mirroring the `portfolio` bucket.

### Regenerate types
Re-pull `src/types/database.ts` (or hand-patch: profiles cols, rename table, request cols, RPC args).

## 5. Auth architecture
### AuthProvider (rewrite)
- **Init:** `getSession()`; if none → `signInAnonymously()`. Subscribe to `onAuthStateChange`.
- **Expose:** `isAnonymous = session?.user?.is_anonymous ?? false`, plus existing `profile`,
  `practitioner`, `subscription`, `isAdmin`, `isPractitioner`.
- **`registerClient(input)`** and **`registerPractitioner(input)`**:
  1. `updateUser({ email, password })` → upgrades the anon user (throws if email in use).
  2. `update profiles set first_name,last_name,full_name,phone,whatsapp_number,home_address`.
  3. `upsert user_identity { id_type, id_number }` (trigger validates/sets verification).
  4. practitioner: also `update profiles set is_practitioner=true`; `set_practitioner_location(workAddr coords)`;
     ensure `subscriptions` (trialing); `practitioner_profiles.payshap_proxy = payshap_id`.
  5. `refresh()`.
- **`loginWithPassword(email, password)`** → `signInWithPassword`.
- **Email-in-use** on register → throw typed error → UI routes to Login prefilled.
- **`signOut()`** → `supabase.auth.signOut()` then immediately `signInAnonymously()` so the app
  stays browsable.
- **Remove** `signInWithPhone`, `verifyOtp`.

### Draft handoff (client publish)
- Compose the request while anonymous; the optional photo uploads to `request-photos/{uid}/…`
  immediately (uid persists through upgrade), URL kept in a `PendingRequestContext`.
- On **Publish**: if `isAnonymous` → navigate to `/register?role=client`; on success the register
  screen runs `create_request(draft)` → `/request/[id]`. If already registered → publish directly.
- Practitioner data needs no draft store: Studio setup writes `practitioner_profiles`/`services`/
  `portfolio` under the anon uid (RLS `auth.uid()=id` passes); registration finalises identity+login.

## 6. Navigation map
```
_layout (providers; waits for anon session)
 index → if registered+role set → (app); else → /welcome
 /welcome                     role chooser: [ Need a service ] [ Offer services ]
 /login                       email + password
 /register   ?role=client|practitioner   role-aware full-screen form
 (app)/
   (client)/ discover(list, location prompt) · activity · chats · profile(shows Register CTA if anon)
   (work)/   studio(setup, anon-ok) · feed(needs reg+verified) · schedule · chats
   new-request  → gate publish on isAnonymous
   onboarding   → practitioner business profile (anon-ok) → gate save on isAnonymous
   request/[id] · offer/[id] · booking/[id] · complete/[id] · review/[id]
   provider/[id] · chat/[id] · report · admin · services · portfolio · edit-studio
```
- Remove `(auth)/sign-in`, `(auth)/verify`. Repurpose `(auth)/profile-setup` → not needed (name in register).
- `(app)/_layout`: drop the hard `session/full_name` redirect; allow anonymous browsing.
  Guard only the publish/save actions and the practitioner feed/schedule (needs registration).

## 7. Screen specs (new / changed)
- **/welcome** — two big cards (client/practitioner). Sets `ModeProvider` + routes.
- **/register** — role-aware. Sections: *You* (first/last, nationality→ID/passport w/ live Luhn),
  *Contact* (mobile, whatsapp?), *Where* (home; practitioner: + work address), practitioner: *Payouts*
  (PayShap ID), *Login* (email, password). Submit → registerClient/registerPractitioner → run pending
  action or land in app.
- **/login** — email + password + "Create account" link → /welcome.
- **client/discover** — request location on mount; **list only** (map block commented, kept for later);
  keep category chips + mode filter; prominent "Post a request".
- **new-request** — add photo picker (uploads to request-photos) + budget **min/max** inputs; keep
  mode + timing. Publish → auth gate.
- **onboarding (practitioner business profile)** — remove ID fields (moved to /register). Save → auth gate.
- **studio** — show verification status; if unverified practitioner, "You're pending verification"
  note (SA ID auto-verifies at registration; passport → admin review).

## 8. Security / RLS
- `user_identity`: owner + admin select/insert/update (rename existing policies).
- `request-photos`: public read; insert/update/delete where `(storage.foldername(name))[1] = auth.uid()`.
- `booking_requests` policies unchanged (client owner + directed target + admin).
- Anonymous users carry role `authenticated`, so existing grants/RLS keep working; no anon grants needed.

## 9. Manual dashboard steps (owner)
1. **Auth → Providers → Allow anonymous sign-ins → ON**
2. **Auth → Providers → Email → Enable; Confirm email → OFF**
3. (Optional) disable the **Phone** provider / clear test OTPs — no longer used.

## 10. Build sequence
1. **Migration 10** + storage bucket + regenerate types.
2. **AuthProvider** rewrite (anonymous + register/login) + `PendingRequestContext`.
3. **Routing**: `/welcome`, `/login`, `/register`; ungate `(app)`; retire phone screens.
4. **Client**: discover (location+list), new-request (photo+budget range) + publish gate.
5. **Practitioner**: onboarding (drop ID) + save gate; studio verification display.
6. **Data hooks**: update `useCreateRequest`, feed types, request types for budget range + image.
7. **Verify** end-to-end on emulator (anon browse → register client → publish; anon → register
   practitioner → save → appears in a client's list; login/return).

## 11. Verification plan
- Enable the two dashboard toggles.
- Fresh app launch → lands on /welcome without login.
- Client: choose client → allow location → see seeded providers list → draft request (+photo+budget)
  → Publish → register (client fields) → request appears in Activity + a matching practitioner's feed.
- Practitioner: choose practitioner → build studio (service, bio, portfolio) → Save → register
  (practitioner fields, SA ID) → verified → go online → sees the client request.
- Return: sign out (→ anonymous) → Login with email/password → lands in prior role.
- Re-run Supabase security advisors after the migration.

## 12. Retired in v2
Phone/OTP login, `(auth)/sign-in`, `(auth)/verify`, the SMS-provider requirement, `offer_price_zar`
(→ budget range), ID capture inside practitioner onboarding (→ registration).
