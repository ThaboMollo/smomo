You are helping Thami hand a software engineer (Claude, working in his code repo) everything it needs to extend the backend of a web app called SMOMO. Your job is ONLY to collect information and report it back, exactly and completely. You must NOT change anything.

# 0. Hard rules (read first)

1. READ-ONLY. Run only SELECT statements and look at dashboard pages. Do not run INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, GRANT or any other statement that writes. Do not click Pause, Restore, Delete, Reset, Rotate, Regenerate, Save, Upgrade or Transfer anywhere. If a page asks you to confirm a change, stop and tell Thami.
2. NO SECRETS. Never copy, print or paste any secret value: service_role key, JWT secret, database password, database connection string with a password, SMTP password, Twilio auth token, API keys, Vercel tokens, webhook signing secrets. For secrets report only the NAME and whether it is set ("set" / "not set"). The Supabase project URL and the public "anon" key are NOT secret and may be included.
3. NO PERSONAL DATA. Do not export real users' emails, phone numbers, ID numbers, addresses, names or messages. Use counts and aggregates only. The only exceptions are (a) the public business data of the practitioner_profiles table (business name, slug, categories, rating fields), (b) the synthetic test accounts listed in query Q16, and (c) the single account Thami tells you he used when his own registration failed (Q17).
4. NEVER summarise away technical content. Where a query returns SQL source code (function definitions, policies, trigger definitions), paste it in full, unedited, in a code block. If a result is too long for the chat, put it in a downloadable file (names given below) and also list the file names in the report. Do not say "and so on" or "similar".
5. If you cannot do something (no access, a page doesn't exist, a query errors), say exactly what failed and the exact error text. Do not guess or invent values. Mark anything you could not verify as UNVERIFIED.
6. If you cannot operate a browser or the Supabase dashboard yourself, work interactively: give Thami one numbered step at a time ("open Supabase, project X, SQL Editor, paste this, press Run, then copy the result table as CSV or JSON and paste it to me"), then collect the results.

# 1. Context

- App: SMOMO, a marketplace connecting clients with independent beauty professionals (hair, nails, make-up, beauty, tattoo) in South Africa, now expanding to Lesotho, Eswatini (formerly Swaziland), Botswana, Zimbabwe and Namibia.
- Web app: https://smomo-redesign.vercel.app (Next.js on Vercel, project "smomo-redesign" in the Vercel team "Jameel The Designer's projects").
- Supabase project ref: ltnjiihfgvwtzrmtkclh (URL https://ltnjiihfgvwtzrmtkclh.supabase.co). Region reportedly eu-west-1.
- API: a NestJS app deployed at https://smomo-api.vercel.app/v1. It lives in a Vercel account that Thami's engineer tooling cannot reach. It uses only SUPABASE_URL and SUPABASE_ANON_KEY (no service-role key), so all business logic is in Postgres functions (RPCs) and row-level-security (RLS) policies. The RPCs it calls are: accept_offer, create_request, feed_requests_for_practitioner, is_admin, make_offer, mark_payment_paid, search_providers, set_practitioner_location, verify_payment.
- Tables (14 in the generated types): booking_requests, bookings, device_push_tokens, messages, payments, portfolio_items, practitioner_profiles, profiles, reports, request_offers, reviews, services, subscriptions, user_identity. The API itself touches all of these except messages and device_push_tokens, which the apps use directly. Storage bucket used: request-photos. There is an edge function: send-push.
- Why this is needed: prices are stored in rand only (columns named *_zar), payments are modelled around PayShap (South Africa only), ID types are only "sa_id" and "passport", and there is no country field. Claude needs the exact current database definition in order to write safe migration SQL for multi-country, multi-currency and flexible payment methods. Claude will write the SQL; Thami or you will run it later, after review. Nothing is run now.

# 2. Deliverable

Produce ONE report titled "SMOMO backend handoff", with the numbered sections below, in this order. Under each section paste the raw results (in code blocks) and add a one-line note on anything odd. Finish with a section "Open problems" listing everything you could not retrieve and why.

# 3. Supabase SQL (run in Supabase > SQL Editor, project ltnjiihfgvwtzrmtkclh, one query at a time)

Run each query separately and copy the full result. Q-numbers must appear in your report.

Q1. Versions and extensions
select 'version' as k, version() as v union all select 'ext:'||extname, extversion from pg_extension order by 1;

Q2. Every table and column in public (exact types, defaults, nullability)
select c.table_name, c.ordinal_position, c.column_name, c.udt_name as type, c.is_nullable, c.column_default from information_schema.columns c join information_schema.tables t on t.table_schema=c.table_schema and t.table_name=c.table_name and t.table_type='BASE TABLE' where c.table_schema='public' order by c.table_name, c.ordinal_position;

Q3. Constraints (primary keys, foreign keys, unique, check)
select conrelid::regclass::text as table_name, conname, contype, pg_get_constraintdef(oid) as definition from pg_constraint where connamespace='public'::regnamespace order by 1,2;

Q4. Indexes
select tablename, indexname, indexdef from pg_indexes where schemaname='public' order by 1,2;

Q5. Enum types
select t.typname as enum_name, string_agg(e.enumlabel, ', ' order by e.enumsortorder) as labels from pg_type t join pg_enum e on e.enumtypid=t.oid join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' group by 1 order by 1;

Q6. ALL custom functions with FULL source (this is the most important result; save as file sql_functions.sql if long)
select p.proname, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef as security_definer, pg_get_functiondef(p.oid) as definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' and not exists (select 1 from pg_depend d where d.objid=p.oid and d.deptype='e') order by 1;

Q7. Triggers (including any on auth.users, such as one that creates a profile row on sign-up)
select tgrelid::regclass::text as on_table, tgname, pg_get_triggerdef(oid) as definition from pg_trigger where not tgisinternal order by 1,2;

Q8. Row-level security: which tables have it, and every policy
select c.relname as table_name, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced from pg_class c where c.relnamespace='public'::regnamespace and c.relkind='r' order by 1;
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check from pg_policies where schemaname in ('public','storage') order by schemaname, tablename, policyname;

Q9. Views
select schemaname, viewname, definition from pg_views where schemaname='public' order by 2;

Q10. Who may use what (grants)
select grantee, table_name, string_agg(privilege_type, ', ' order by privilege_type) as privileges from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','authenticated','service_role') group by 1,2 order by 2,1;
select routine_name, grantee, privilege_type from information_schema.routine_privileges where routine_schema='public' and grantee in ('anon','authenticated') and routine_name in (select proname from pg_proc where pronamespace='public'::regnamespace and not exists (select 1 from pg_depend d where d.objid=pg_proc.oid and d.deptype='e')) order by 1,2;

Q11. Storage buckets
select id, name, public, file_size_limit, allowed_mime_types from storage.buckets order by 1;

Q12. Realtime publications
select pubname, schemaname, tablename from pg_publication_tables order by 1,2,3;

Q13. Scheduled jobs (only if the cron schema exists; otherwise report "no cron schema")
select jobid, jobname, schedule, command, active from cron.job order by 1;

Q14. Row counts (aggregate only, no personal data)
select 'auth.users' as t, count(*) as n from auth.users
union all select 'auth.users last 14d', count(*) from auth.users where created_at > now() - interval '14 days'
union all select 'auth.users anonymous', count(*) from auth.users where is_anonymous
union all select 'auth.users unconfirmed email', count(*) from auth.users where email_confirmed_at is null
union all select 'profiles', count(*) from public.profiles
union all select 'profiles without phone', count(*) from public.profiles where phone is null
union all select 'user_identity', count(*) from public.user_identity
union all select 'practitioner_profiles', count(*) from public.practitioner_profiles
union all select 'services', count(*) from public.services
union all select 'portfolio_items', count(*) from public.portfolio_items
union all select 'booking_requests', count(*) from public.booking_requests
union all select 'request_offers', count(*) from public.request_offers
union all select 'bookings', count(*) from public.bookings
union all select 'payments', count(*) from public.payments
union all select 'reviews', count(*) from public.reviews
union all select 'subscriptions', count(*) from public.subscriptions
union all select 'reports', count(*) from public.reports
union all select 'messages', count(*) from public.messages
union all select 'device_push_tokens', count(*) from public.device_push_tokens;

Q15. Is real money or real activity flowing? (aggregates)
select 'booking status: '||status as k, count(*) as n from public.bookings group by status
union all select 'payment: '||payment_type||' / '||status, count(*) from public.payments group by payment_type, status
union all select 'request status: '||status, count(*) from public.booking_requests group by status;

Q15b. Provider listing (public business data only)
select slug, business_name, categories, verification_status, rating, rating_count, jobs_done, created_at from public.practitioner_profiles order by created_at;

Q16. Synthetic test accounts (created by the engineer while testing; Thami wants them removed later, do NOT delete them)
select id, email, created_at, last_sign_in_at from auth.users where email ilike 'smomo.diag.%@example.com' or email ilike 'smomo.layout.%@example.com' order by created_at;

Q17. Thami's own failed registration. Ask Thami: "Which email address did you use when registering failed?" Then run (replace the email with his; this is his own account):
select u.id, u.created_at, u.email_confirmed_at, u.last_sign_in_at, p.phone is not null as profile_has_phone, p.first_name, exists(select 1 from public.user_identity i where i.user_id=u.id) as has_identity, exists(select 1 from public.practitioner_profiles pp where pp.id=u.id) as is_practitioner from auth.users u left join public.profiles p on p.id=u.id where u.email = 'THAMIS_EMAIL_HERE';
If no row comes back, say so.

# 4. Supabase dashboard (look, do not change)

Report each of these as found:

D1. Project: name, organisation, plan (Free/Pro/etc.), region, status (active/paused), Postgres version, whether daily backups or point-in-time recovery are on, current database size and egress versus plan limits, and how many other projects are in the organisation (names and status only). Note whether the project is at risk of auto-pausing from inactivity.
D2. Authentication > Sign In / Providers: email provider enabled?, "Confirm email" on/off, "Allow new users to sign up" on/off, anonymous sign-ins on/off, phone provider (which SMS provider, and whether it is actually configured: names only, no tokens), password minimum length and required character types, leaked-password protection on/off, MFA settings.
D3. Authentication > URL Configuration: Site URL and every Redirect URL.
D4. Authentication > Emails: is a CUSTOM SMTP server configured? If yes: host, port, sender address and sender name (NOT the password). If no: say "using Supabase's built-in email service" and report its rate limit. List which email templates exist and whether they are customised.
D5. Authentication > Rate Limits: all values.
D6. Authentication > Hooks and Attack Protection: anything enabled (CAPTCHA, hooks).
D7. Edge Functions: list of functions, and the full source of "send-push" (download or paste). Secrets: NAMES only.
D8. Database > Webhooks, Database > Replication, Integrations: anything configured.
D9. Advisors: the complete list of Security advisor and Performance advisor findings (title, severity, affected object, and the suggested remediation text).
D10. Logs (last 7 days): (a) Auth logs: count of errors grouped by message, and list any failed sign-ups (messages such as user_already_exists, weak_password, over_email_send_rate_limit, validation_failed); (b) Postgres logs: errors grouped by message, especially unique-violation errors (for example constraint names containing "phone" or "email"); (c) API logs: counts of 4xx and 5xx responses for /auth/v1/signup, /auth/v1/token and /rest/v1/rpc/*.
D11. Project Settings > API: the project URL and the public anon key (these are public), plus the list of exposed schemas. Do NOT copy the service_role key or JWT secret.

# 5. Where the API is hosted (Vercel and GitHub)

V1. Find which Vercel account/team hosts the project serving https://smomo-api.vercel.app. Report: team name, project name, who the team members are (names/roles), the connected Git repository and production branch, root directory, install/build/output settings, Node.js version, and the environment variable NAMES with their targets (Production/Preview/Development), saying whether each is set. For SUPABASE_URL, confirm whether its value points to project ref ltnjiihfgvwtzrmtkclh (this value is not secret).
V2. Report the deployment history (last 5 deployments: date, branch, commit message, status).
V3. Tell Thami what his options are to give Claude's tooling (which deploys as the Vercel user "jameel-the-designer", team "Jameel The Designer's projects") the ability to ship API changes: (a) invite that user to the team that owns smomo-api, (b) transfer the project to Jameel The Designer's team, or (c) create a new API project from the repo folder apps/api inside Thami's own team using only SUPABASE_URL and SUPABASE_ANON_KEY. Say which of these are possible given the account structure you found. Do not perform any of them.
V4. GitHub: who owns the original repository the API was deployed from (the engineer's repo may be "Jameel-The-Designer/smomo-redesign", forked from an older "smomo-main"), and whether the person who deployed smomo-api is Thami or someone else.

# 6. Questions you must ask Thami and record verbatim (these are business decisions; do not answer for him)

P1. Payments: which payment methods must work in each country: South Africa (PayShap, EFT, card?), Lesotho, Eswatini, Botswana, Zimbabwe, Namibia? Mobile money (for example M-Pesa, EcoCash, MTN MoMo, Orange Money)? Bank transfer? Cash on the day? Should SMOMO ever hold or process money, or stay "client pays the pro directly" with SMOMO only recording it?
P2. Currency: should each provider price in their local currency (ZAR, LSL, SZL, BWP, NAD, ZWG or USD), or should everything stay in rand with conversion shown? Who sets exchange rates if conversion is used? Which currency should Zimbabwe use?
P3. Deposits, refunds and disputes: any changes for the new countries?
P4. ID verification: which ID types per country should be accepted at sign-up (SA ID, passport, national ID of Lesotho/Eswatini/Botswana (Omang)/Zimbabwe/Namibia, driver's licence)? Required for clients too, or only for pros?
P5. Launch: which country first after South Africa, and when? Are there already pros or clients lined up in those countries?
P6. Seed and test data: the 4 providers whose slugs end in "-a000" look like demonstration data. Should they be removed before real launch? (Do not remove them.) May the synthetic test accounts in Q16 be deleted later?
P7. Email and SMS: which email address and domain should SMOMO send from (Thami said he will provide an email)? Does he control the DNS for that domain (needed for SPF/DKIM)? Does he want email sign-up confirmation, password reset, and SMS codes? Who pays for the email/SMS provider?
P8. Legal and contact: who owns the Privacy Policy and Terms (currently "to be published")? What support email/WhatsApp should appear on the site? Is there a registered business entity?
P9. Maps: is Thami willing to create a Google Cloud project with billing to get a Maps/Places API key for address search (otherwise the app uses a free, lower-quality OpenStreetMap service)? Who should own that Google account?
P10. Anything else he wants changed in the backend while Claude is in there.

# 7. Final output format

1. A short summary (max 15 lines): project health, anything alarming (paused, near limits, security advisor criticals, missing RLS, anonymous sign-ins on, no SMTP), and your answer to "why did registration fail for Thami" if the logs show it.
2. Sections Q1 to Q17, D1 to D11, V1 to V4, each with raw results.
3. Thami's answers to P1 to P10, verbatim.
4. "Open problems": everything you could not retrieve, with the exact error.
5. List of any files you produced (for example sql_functions.sql, schema_columns.csv) and tell Thami to hand ALL of it, plus this report, to Claude.

Remember: read-only, no secrets, no personal data, no summarising of SQL source.
