# Dockwise Supabase/Vercel Backend, Progress Sync, and Paid Content Implementation Plan

> **For Hermes:** Use the `subagent-driven-development` skill to implement this plan task-by-task. Keep the web product as the active target; defer/remove iOS/Capacitor work unless explicitly requested later.

**Goal:** Add accounts, cloud-synchronised progress, achievements, and a safe foundation for a later paid Dockwise tier without compromising the offline-first browser simulator.

**Architecture:** Keep the deterministic Vite simulator and physics engine in the browser. Add Supabase Auth and Postgres for identity/progress, with Row Level Security protecting user-owned data. Use Vercel server-side routes for privileged operations such as billing webhooks, entitlements, leaderboard submissions, and administrative actions. Keep localStorage as an offline cache and queue writes until the user is online.

**Tech Stack:** Existing Vite/vanilla JavaScript app, Supabase Auth, Supabase Postgres, `@supabase/supabase-js`, Vercel deployment/functions, and a payment provider added later behind a provider-neutral entitlement interface. Recommended payment direction: Paddle or Lemon Squeezy if minimising EU VAT/merchant-of-record work; Stripe Checkout is also viable if Mattias wants maximum control and accepts handling more tax/compliance responsibilities.

---

## Product decisions to make before coding

These decisions are deliberately separated from implementation. Record the final choices in `docs/backend/product-decisions.md` before Task 1.

### Free tier

The free tier should remain useful without an account:

- Browser simulator remains playable offline.
- Current free lessons remain available locally.
- Local progress works without signing in.
- Account creation is optional until the user wants sync, achievements, leaderboards, or paid content.
- Do not add a mandatory login wall to the current public funnel.

### Likely paid tier

Design for a future paid tier such as:

- More guided lessons.
- Additional boat/engine/rudder controls.
- More berth and line configurations.
- Advanced analysis mode and replay/history.
- Additional environmental conditions.
- Extended progress statistics.
- Possibly challenge packs or instructor-created content.

Do not hard-code a single product name such as `premium=true`. Use product and entitlement records so future offerings can include one-time packs, subscriptions, bundles, or promotional grants.

### Online/offline policy

- Physics and already-downloaded lessons must continue to work offline.
- Cloud sync is best-effort and must never block Run, Step, Reset, or lesson play.
- Paid content requires a previously verified entitlement and a locally cached content pack while offline.
- New purchases, account creation, entitlement refresh, and leaderboard submission require connectivity.
- When an entitlement cannot be refreshed, use a documented grace period rather than unexpectedly hiding content during a session.

### Anti-cheat boundary

Personal progress is not a security-sensitive score. Leaderboards are.

- Treat browser-submitted progress as advisory until validated.
- Do not accept an arbitrary client-provided score as a leaderboard record.
- Record a compact attempt input/event stream or deterministic result signature for competitive submissions.
- Keep the first leaderboard version modest: best verified result per user/lesson and rate limits, not a full anti-cheat platform.

---

## Current codebase touchpoints

The existing project is a Vite app with no Supabase dependency yet.

- `package.json` — add `@supabase/supabase-js`; remove or isolate Capacitor work only in a separate cleanup task after the web backend is stable.
- `src/app.js` — current UI event wiring, lesson lifecycle, local storage integration, and `window.__dockwise` browser test hooks.
- `src/lessons.js` — bundled lesson catalog and deterministic lesson definitions.
- `src/storage.js` — current versioned local document/migration logic; extend rather than replace it.
- `src/platform.js` — currently abstracts browser/native persistence; simplify toward browser persistence if iOS is formally retired.
- `src/training.js` — deterministic training session state and result summaries; keep this pure and server-independent.
- `src/physics.js` — do not make network calls or depend on accounts.
- `tests/storage.test.js` — migration, local cache, queued sync, and merge tests.
- `tests/training.test.js` — deterministic result and attempt payload tests.
- `scripts/browser-verify.mjs` — login UI, offline mode, sync status, account deletion/logout, and paid/free gating tests.
- `index.html` and `styles.css` — account, sync, entitlement, and progress UI; keep it usable on small screens.
- `docs/privacy.html` and `docs/support.html` or their current equivalents — update data collection, account deletion, analytics, and payment disclosures.
- `README.md` — document local development, Supabase setup, environment variables, migrations, and deployment.

---

# Phase 0: Product and security foundations

### Task 1: Record backend and monetisation decisions

**Objective:** Create one source of truth for product boundaries before implementation.

**Files:**
- Create: `docs/backend/product-decisions.md`

**Include:**

- Free/no-account behaviour.
- Whether email magic links, Google, Apple, or password login are supported initially.
- Whether paid content is a one-time purchase, subscription, or both later.
- Whether leaderboards are global, per-lesson, weekly, or disabled initially.
- Data retention and account deletion expectations.
- EU/Swedish privacy and payment assumptions.
- Explicit statement that the simulator remains playable offline.

**Verification:** Review the document against every later phase. No code should depend on an undecided provider-specific product name.

**Commit:** `docs: define backend and monetization decisions`

### Task 2: Create a Supabase project strategy

**Objective:** Separate local/development/staging/production data and credentials.

**Files:**
- Create: `docs/backend/supabase-environments.md`
- Create: `.env.example`
- Modify: `.gitignore`

**Environment variables:**

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_REF=
```

Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` may be exposed to the browser. The service-role key must only exist in Vercel server-side environments and local server tooling; never put it in Vite source or `dist`.

**Verification:** Add a secret scan test that fails if a service-role key pattern or `.env` file is staged.

**Commit:** `chore: document Supabase environments and secret boundaries`

### Task 3: Define the backend module boundaries

**Objective:** Prevent Supabase calls from leaking into the physics engine.

**Files:**
- Create: `src/backend/supabase-client.js`
- Create: `src/backend/auth.js`
- Create: `src/backend/sync.js`
- Create: `src/backend/entitlements.js`
- Create: `src/backend/leaderboards.js`
- Create: `src/backend/backend-errors.js`

**Rules:**

- `physics.js` and `training.js` remain pure.
- `app.js` calls backend modules through small interfaces.
- Backend modules return typed/plain objects and normalised errors.
- Every backend operation has an offline-safe failure path.

**Verification:** Unit-test imports with missing environment variables. The app must start in offline/local-only mode rather than crash.

**Commit:** `refactor: isolate backend integration boundaries`

---

# Phase 1: Authentication without breaking anonymous use

### Task 4: Add Supabase client dependency and browser client

**Objective:** Initialise the public Supabase client safely.

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create/modify: `src/backend/supabase-client.js`
- Modify: `.env.example`

**Implementation requirements:**

- Use `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)` only when both values exist.
- Expose `isBackendConfigured()`.
- Never use the service-role key in browser code.
- Configure auth persistence only through Supabase’s browser-safe client.

**Test:**

```bash
node --test tests/backend-client.test.js
```

Expected: configured and unconfigured environments both initialise safely.

**Commit:** `feat: add optional Supabase browser client`

### Task 5: Add optional magic-link authentication

**Objective:** Let users sign in without making login mandatory.

**Files:**
- Create: `src/backend/auth.js`
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`
- Create: `tests/auth.test.js`

**UI states:**

- Signed out: `Sign in to sync progress`.
- Email entered: `Send magic link`.
- Link sent: clear confirmation without exposing email unnecessarily.
- Signed in: display name/email, sync status, sign out, delete account.
- Backend unavailable: explain that local progress still works.

**Do not add yet:** password reset, social login, Apple login, or profile customisation unless product decisions require them.

**Verification:** Browser test covers signed-out local play, configured/unconfigured UI, and no crash when Supabase is unreachable. Use a local mock for unit tests; never put a real account/token in the repository.

**Commit:** `feat: add optional magic-link account flow`

### Task 6: Add anonymous installation identity

**Objective:** Make local progress mergeable when a user signs in later.

**Files:**
- Modify: `src/storage.js`
- Create: `src/backend/identity.js`
- Modify: `tests/storage.test.js`

**Persist locally:**

```text
installationId
localDocumentVersion
lastSyncAt
pendingSyncOperations
```

Use a random UUID generated locally. It is not a user identifier and must not be treated as one.

**Verification:** Existing v2 local documents migrate without losing lesson attempts, completions, scenarios, or settings.

**Commit:** `feat: preserve anonymous progress for later account merge`

### Task 7: Specify and implement account merge rules

**Objective:** Merge local progress into a newly authenticated account deterministically.

**Files:**
- Create: `docs/backend/progress-merge.md`
- Modify: `src/backend/sync.js`
- Modify: `tests/storage.test.js`
- Create: `tests/sync.test.js`

**Rules:**

- Attempts are append-only and deduplicated by client attempt ID.
- Completion is the union of completed lessons.
- Best result uses a documented comparison function, not last-write-wins.
- Scenario names resolve conflicts with stable suffixes rather than silently overwriting.
- Local data is never deleted until the cloud acknowledgement is received.
- Sync failures remain queued and visible.

**Verification:** Test first login with no local data, local-only data, server-only data, conflicting best results, duplicate retries, and offline reconnection.

**Commit:** `feat: merge anonymous progress on account sign-in`

---

# Phase 2: Supabase schema and Row Level Security

### Task 8: Create the initial SQL migration

**Objective:** Create the minimum durable schema for profiles, progress, and attempts.

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`
- Create: `supabase/seed.sql`
- Create: `docs/backend/schema.md`

**Initial tables:**

```text
profiles
  id uuid primary key references auth.users(id) on delete cascade
  display_name text
  created_at timestamptz
  updated_at timestamptz

lesson_progress
  user_id uuid references profiles(id) on delete cascade
  lesson_id text
  attempts integer not null default 0
  completed boolean not null default false
  best_distance numeric
  best_heading_error numeric
  best_elapsed numeric
  updated_at timestamptz
  primary key (user_id, lesson_id)

lesson_attempts
  id uuid primary key
  user_id uuid references profiles(id) on delete cascade
  lesson_id text not null
  client_attempt_id text not null
  status text not null
  collision_count integer not null default 0
  peak_line_load numeric not null default 0
  distance numeric
  heading_error numeric
  elapsed numeric
  input_signature text
  created_at timestamptz
  unique (user_id, client_attempt_id)
```

Do not store raw telemetry frames initially. They increase privacy, storage, and abuse surface without helping the first product version.

**Verification:** Apply migration to a disposable Supabase project and run schema inspection. The migration must be repeatable in CI against a fresh database.

**Commit:** `feat: add initial Supabase progress schema`

### Task 9: Add profiles trigger and RLS policies

**Objective:** Ensure every authenticated user has a profile and cannot read another user’s data.

**Files:**
- Create: `supabase/migrations/0002_profiles_and_rls.sql`
- Create: `tests/rls/policies.sql` or equivalent database test script

**RLS requirements:**

- Users can select/update only their own profile.
- Users can select/insert/update only their own progress.
- Users can select/insert only their own attempts.
- Client cannot update verified leaderboard fields directly.
- Service-role/server functions bypass RLS only where explicitly required.

**Verification:** Test authenticated user A against user B’s rows. Both direct SQL policy tests and a client integration test should exist before production use.

**Commit:** `feat: secure user progress with Supabase RLS`

### Task 10: Add typed progress repository

**Objective:** Hide table details from the UI and centralise merge/upsert behaviour.

**Files:**
- Create: `src/backend/progress-repository.js`
- Modify: `src/backend/sync.js`
- Create: `tests/progress-repository.test.js`

**Methods:**

```text
loadProgress(userId)
recordAttempt(userId, attempt)
upsertLessonProgress(userId, progress)
mergeLocalProgress(userId, localDocument)
queueOfflineOperation(operation)
flushOfflineQueue(userId)
```

All methods must handle timeout, offline, expired session, RLS denial, and duplicate request safely.

**Commit:** `feat: add progress repository and offline sync queue`

---

# Phase 3: Progress UI and data quality

### Task 11: Add visible sync status

**Objective:** Make cloud state understandable instead of silently failing.

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`
- Modify: `src/backend/sync.js`
- Modify: `scripts/browser-verify.mjs`

**States:**

- Local only.
- Syncing.
- Synced at time.
- Offline; queued.
- Sign in required.
- Sync failed; retry.

Never interrupt a running exercise with an auth or network modal.

**Commit:** `feat: show local and cloud progress status`

### Task 12: Record completed attempts at stable lifecycle points

**Objective:** Persist meaningful lesson results without writing on every simulation frame.

**Files:**
- Modify: `src/app.js`
- Modify: `src/training.js` only if a serialisable result helper is needed
- Modify: `tests/training.test.js`
- Modify: `tests/sync.test.js`

**Write only when:**

- lesson completes;
- lesson fails after a meaningful attempt;
- user explicitly exits an active attempt if product decisions require abandoned-attempt analytics.

Do not count browser verification runs or local retries as duplicate cloud attempts without a stable client attempt ID.

**Verification:** A successful lesson produces one idempotent attempt record even if the browser retries the request.

**Commit:** `feat: sync lesson results at attempt boundaries`

### Task 13: Add progress dashboard

**Objective:** Give signed-in users a reason to create and keep an account.

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`
- Create: `src/progress-view.js`
- Modify: `scripts/browser-verify.mjs`

**Display:**

- Lessons completed out of total available lessons.
- Best result per lesson.
- Recent attempts.
- Achievements earned.
- Offline/sync state.

Keep the dashboard useful on mobile and avoid introducing a large framework rewrite merely for this screen.

**Commit:** `feat: add signed-in progress dashboard`

---

# Phase 4: Achievements and leaderboards

### Task 14: Define achievement rules as data

**Objective:** Add gamification without scattering hard-coded checks throughout the app.

**Files:**
- Create: `src/achievements.js`
- Create: `tests/achievements.test.js`
- Create: `docs/backend/achievement-rules.md`

**Initial achievements:**

- First departure.
- First collision-free lesson.
- Rudder under control.
- Prop walk understood.
- Spring mastered.
- Clean alongside arrival.
- Completed all free lessons.
- No-collision streak.

Each rule should consume a normalised result/progress object and return a deterministic boolean.

**Commit:** `feat: define deterministic achievement rules`

### Task 15: Add server-side achievement awarding

**Objective:** Prevent clients from granting themselves arbitrary achievements.

**Files:**
- Create: `supabase/migrations/0003_achievements.sql`
- Create: `api/award-achievements.js` or the chosen Vercel route structure
- Modify: `src/backend/entitlements.js` only if shared response types are needed
- Create: `tests/api/achievements.test.js`

Use a unique constraint on `(user_id, achievement_key)`. Awarding must be idempotent.

**Verification:** Replaying the same attempt does not duplicate an achievement. A client cannot insert an arbitrary achievement through RLS.

**Commit:** `feat: award achievements through verified server results`

### Task 16: Add a deliberately simple leaderboard

**Objective:** Test whether competition improves Dockwise before building complex social infrastructure.

**Files:**
- Create: `supabase/migrations/0004_leaderboards.sql`
- Create: `api/leaderboards/submit.js`
- Create: `api/leaderboards/list.js`
- Create: `src/backend/leaderboards.js`
- Create: `tests/api/leaderboards.test.js`

**Initial rules:**

- One leaderboard per lesson.
- One best verified result per user per lesson.
- Use a transparent composite or a single clearly documented metric.
- Use display names, never emails.
- Rate-limit submissions.
- Add report/hide capability before public launch.

Do not expose a raw table allowing browser-side arbitrary score updates.

**Commit:** `feat: add verified per-lesson leaderboards`

---

# Phase 5: Paid tier and entitlements

### Task 17: Design product-neutral entitlements

**Objective:** Make payment-provider changes possible without rewriting lesson gating.

**Files:**
- Create: `docs/backend/entitlements.md`
- Create: `src/backend/entitlements.js`
- Create: `tests/entitlements.test.js`

**Use concepts like:**

```text
product_key: dockwise_pro
feature_key: lesson_pack_advanced
feature_key: control_pack_wind_current
feature_key: analysis_replay
status: active | trialing | past_due | revoked | expired
source: paddle | lemonsqueezy | stripe | admin | promotion
valid_until: nullable timestamp
```

The app asks:

```text
hasEntitlement('lesson_pack_advanced')
hasEntitlement('control_pack_wind_current')
hasEntitlement('analysis_replay')
```

It must not ask whether `isPremium === true` in dozens of places.

**Commit:** `feat: add product-neutral entitlement model`

### Task 18: Separate free and paid content packs

**Objective:** Make feature gating explicit and testable before adding payments.

**Files:**
- Modify: `src/lessons.js`
- Create: `src/content-packs.js`
- Create: `src/feature-gates.js`
- Modify: `src/app.js`
- Modify: `tests/lessons.test.js`
- Create: `tests/feature-gates.test.js`

Add metadata such as:

```js
{
  id: 'advanced-spring-departure',
  pack: 'advanced-lessons',
  requiredEntitlement: 'lesson_pack_advanced'
}
```

Free content must remain available with no backend configured. Locked content should show its description and a clear upgrade action, but not pretend the user owns it.

**Important limitation:** JavaScript shipped to the browser can be inspected. Client-side gating is product UX, not true secrecy. Paid lesson definitions should be lazy-loaded or fetched from a server-controlled content endpoint if preventing casual access matters.

**Commit:** `feat: add free and paid content gates`

### Task 19: Add purchase provider behind a Vercel webhook

**Objective:** Convert verified payment events into Supabase entitlements.

**Files:**
- Create: `api/billing/webhook.js`
- Create: `api/billing/checkout.js`
- Create: `api/billing/portal.js`
- Create: `src/backend/billing.js`
- Create: `supabase/migrations/0005_billing_and_entitlements.sql`
- Create: `tests/api/billing.test.js`

**Webhook requirements:**

- Verify provider signature before parsing the event.
- Store provider event ID with a unique constraint.
- Make processing idempotent.
- Map provider customer/user identity to `auth.users.id` through a stable server-side mapping.
- Grant/revoke entitlements from verified events only.
- Never accept `userId`, `paid: true`, or product access from browser input.
- Log safe event metadata; never log payment tokens or secrets.

**Provider choice:**

- Prefer Paddle/Lemon Squeezy if wanting merchant-of-record handling and simpler EU tax administration.
- Prefer Stripe Checkout if wanting maximum control, future marketplace flexibility, or existing Stripe experience.
- Keep the database and application interfaces provider-neutral.

**Commit:** `feat: add verified billing webhook and entitlements`

### Task 20: Add upgrade UX without blocking free play

**Objective:** Let users discover and purchase paid content without degrading the free product.

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`
- Modify: `src/backend/billing.js`
- Modify: `scripts/browser-verify.mjs`

**Flows:**

- Locked lesson card → explanation → sign in → checkout.
- Signed-out user → sign in first, then return to intended product.
- Successful checkout → refresh entitlements → unlock content.
- Cancelled checkout → return without losing state.
- Offline → explain that purchase verification is unavailable; preserve already cached access.

Do not put a payment iframe or heavy account UI inside the simulation canvas.

**Commit:** `feat: add non-blocking paid content upgrade flow`

### Task 21: Add entitlement cache and grace-period behaviour

**Objective:** Make paid content usable during short offline periods without making revocation impossible.

**Files:**
- Modify: `src/backend/entitlements.js`
- Modify: `src/storage.js`
- Create: `tests/entitlements-cache.test.js`

**Rules:**

- Cache the last verified entitlement response with timestamp and signature/version.
- Allow cached access for a documented grace period, e.g. 7 days, unless the server has explicitly returned revoked/expired.
- Never cache payment secrets.
- Make cache invalidation deterministic after sign-out or account deletion.

**Commit:** `feat: cache verified entitlements for offline play`

---

# Phase 6: Vercel deployment and operations

### Task 22: Choose web hosting migration path

**Objective:** Decide whether Vercel replaces GitHub Pages or temporarily serves a second deployment.

**Recommendation:** Deploy Vercel as the canonical backend-capable web app while keeping GitHub Pages only until the Vercel deployment is verified. Avoid two user-facing URLs after the migration is complete.

**Files:**
- Create: `vercel.json` only if routing requires it.
- Create: `docs/backend/vercel-deployment.md`
- Modify: `README.md`

**Configure:**

- Production and preview environments.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as public build variables.
- `SUPABASE_SERVICE_ROLE_KEY` and billing webhook secrets as server-only variables.
- Supabase Auth redirect URLs for local, preview, and production domains.
- Custom domain later, after the app works on the Vercel domain.

**Verification:** Preview deployments use a separate Supabase development project or a safe test tenant. Production secrets must never appear in build output.

**Commit:** `chore: document Vercel deployment and environments`

### Task 23: Add API route health and error observability

**Objective:** Diagnose backend failures without exposing sensitive information.

**Files:**
- Create: `api/health.js`
- Create: `src/backend/telemetry.js` or use a minimal logging boundary
- Create: `tests/api/health.test.js`
- Modify: `docs/backend/operations.md`

**Monitor:**

- Auth failures.
- Sync queue growth.
- RLS errors.
- Webhook signature failures.
- Entitlement refresh failures.
- Leaderboard abuse/rate-limit events.

Do not add third-party analytics until privacy wording and consent requirements are decided. Product metrics can initially be derived from anonymised server-side attempt records.

**Commit:** `feat: add backend health and safe operational diagnostics`

### Task 24: Add rate limiting and abuse controls

**Objective:** Protect public API routes and control accidental spend.

**Files:**
- Modify: `api/leaderboards/submit.js`
- Modify: `api/billing/webhook.js`
- Create: `api/_shared/rate-limit.js`
- Create: `tests/api/rate-limit.test.js`

**Controls:**

- Per-user and per-IP limits on leaderboard submissions.
- Maximum attempt payload size.
- Webhook replay protection.
- Reject impossible numeric values and timestamps.
- Avoid accepting raw arbitrary JSON blobs into Postgres.

**Commit:** `feat: protect public backend routes`

---

# Phase 7: Privacy, account lifecycle, and release

### Task 25: Implement account deletion and data export

**Objective:** Give users a complete account lifecycle before storing cloud progress or taking payment.

**Files:**
- Create: `api/account/delete.js`
- Create: `api/account/export.js`
- Modify: `src/backend/auth.js`
- Modify: `index.html`
- Modify: `docs/privacy.html`
- Create: `tests/api/account.test.js`

**Requirements:**

- User can request an export of profile, progress, attempts, achievements, and entitlements metadata.
- User can delete the account.
- Deletion removes or anonymises dependent rows according to the retention policy.
- Payment-provider records are not falsely claimed to be erased if the provider must retain legally required transaction records; document the boundary.
- Sign-out clears local entitlement cache and private cloud data from the active browser unless the user chooses to retain anonymous local progress.

**Commit:** `feat: add account export and deletion`

### Task 26: Update privacy and support documentation

**Objective:** Make the real backend behaviour accurately documented.

**Files:**
- Modify: `docs/privacy.html`
- Modify: `docs/support.html`
- Modify: `README.md`
- Create: `docs/backend/data-inventory.md`

Document:

- Account data.
- Progress and attempt data.
- Cookies/local storage.
- Authentication provider.
- Hosting and database providers.
- Payment provider when introduced.
- Retention and deletion.
- Contact/support process.
- Whether analytics and leaderboards are optional.

**Commit:** `docs: document cloud data and account lifecycle`

### Task 27: Add the end-to-end release gate

**Objective:** Prove the backend works before switching the public URL.

**Files:**
- Modify: `scripts/browser-verify.mjs`
- Modify: `package.json`
- Create: `scripts/verify-backend-config.mjs`
- Modify: `.github/workflows/pages.yml` or the new Vercel deployment documentation

**Required checks:**

```bash
npm ci
npm test
npm run build
npm run verify:build
npm run test:browser
node scripts/verify-backend-config.mjs
npm run security:scan
```

Add separate integration tests using a disposable Supabase project or local Supabase CLI environment. Do not make production data a test fixture.

**Browser scenarios:**

- Anonymous offline play.
- Sign in and local-progress merge.
- Cloud progress reload on a second browser context.
- Offline queue then reconnect.
- Sign out.
- Account deletion.
- Locked paid lesson without entitlement.
- Mock entitlement unlock.
- Leaderboard submission rejection for invalid payload.

**Commit:** `test: add backend release verification`

### Task 28: Migrate hosting and announce the product boundary

**Objective:** Make Vercel the canonical web deployment only after the release gate passes.

**Steps:**

1. Deploy to Vercel preview.
2. Run all browser/account/sync tests against preview.
3. Configure production Supabase redirect URLs.
4. Configure Vercel production environment variables.
5. Deploy production.
6. Verify auth callbacks, sync, and local offline operation.
7. Point the public domain to Vercel.
8. Keep GitHub Pages available temporarily as a rollback artifact, but do not advertise both URLs.
9. Remove or archive iOS/Capacitor release work from the active product roadmap.

**Commit:** `chore: make Vercel the canonical Dockwise deployment`

---

# Recommended implementation order

Do not start with payments. The best sequence is:

1. Product decisions and secret boundaries.
2. Optional Supabase client.
3. Optional magic-link authentication.
4. Anonymous identity and merge rules.
5. Schema and RLS.
6. Offline sync queue.
7. Visible progress dashboard.
8. Achievements.
9. Minimal verified leaderboard, only if it improves the product.
10. Product-neutral entitlements.
11. Free/paid content gates.
12. Payment provider and signed webhooks.
13. Vercel production migration.
14. Privacy/account deletion/release gate.

This sequence ensures that you can launch accounts and progress without committing prematurely to a pricing model or payment provider.

# Suggested first paid product

Start with one simple paid product rather than a subscription-heavy catalogue:

```text
Dockwise Advanced Pack
- 10–20 additional lessons
- advanced wind/current exercises
- expanded line configurations
- advanced analysis/replay
- one-time purchase
```

A one-time pack fits the current product better than immediately adding a subscription. Consider a subscription only if you later add continuously updated content, instructor courses, community challenges, or cloud-heavy services that create ongoing costs.

Keep the entitlement key stable:

```text
lesson_pack_advanced
```

The product price/name can change without changing every lesson and feature gate.

# Cost-control rules

- Do not write every simulation frame to Supabase.
- Do not enable Realtime until a real feature needs it.
- Do not store replay videos or large files in the database.
- Keep attempt payloads small and bounded.
- Add Vercel spend limits and Supabase usage alerts before public launch.
- Use a development Supabase project separate from production.
- Keep paid content assets versioned so clients do not repeatedly download them.
- Do not add SMS authentication initially; SMS introduces direct per-message cost and abuse risk.

# Definition of done

The backend phase is complete when:

- Anonymous offline play still works with no backend configuration.
- A user can sign in with a magic link.
- Local progress merges into cloud progress without data loss or duplication.
- Progress sync survives offline periods and retries safely.
- RLS prevents cross-user reads/writes.
- Achievements are deterministic and idempotent.
- Leaderboard submissions are server-validated or explicitly marked non-competitive.
- Paid features use product-neutral entitlements.
- Billing events are signature-verified and idempotent.
- Account export and deletion work.
- Vercel preview and production environments are separated.
- No secrets appear in browser bundles, Git history, logs, screenshots, or generated artifacts.
- The current physics and browser verification suite still passes.
- The public free product remains useful without an account or payment.
