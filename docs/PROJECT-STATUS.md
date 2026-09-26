# Project Status & Handoff

Snapshot for continuing work in a fresh session. Read `../CLAUDE.md` first for
stack/deploy/layout; this file is **current state + open to-dos**.

**Site is LIVE:** https://www.spongehydration.com (Cloudflare Pages project
`sponge-website`, git auto-deploy from `main`; Stripe in **LIVE mode**).

## Done & verified (working in production)
- Stripe hosted **Checkout** + **webhook** (`checkout.session.completed`).
- **Google Sheet** order log (tab `2026`) via service account.
- **Order emails** (Gmail API, send-as team@): customer confirmation (logo header,
  itemized summary w/ colors, shipping address, order #) + team notification.
- **Order-status page** `/order-status?token=…` (signed token, reads sheet,
  30-day-post-delivery expiry, carrier-link tracking).
- **SEO:** vite-react-ssg prerendering, 301 redirects (`public/_redirects`),
  real 404s, apex→www (`functions/_middleware.js`).
- **Custom domain** cutover done (DNS on Cloudflare, MX/email preserved, SPF added).
- **Shipping:** US-only, weight-based (4 oz/item) USPS tiers — rates are PLACEHOLDERS.
- Colors restricted to **black/white** (retired colors coerced client + server).
- **Dashboard & Account** entry points hidden (routes still resolve).
- Token-opt config added & committed: `CLAUDE.md`, `.claude/settings.json`, `.claude/rules/shipping-sync.md`.
- **Sitemap reconciled with routes** (2026-07-26): added the 4 `/legal/*` pages; verified all 20
  listed URLs prerender and carry `index, follow`, and that `cart`/`checkout`/`dashboard`/`account`/
  `order-status`/`404` are `noindex` and excluded. Hidden SKU `sponge-2-pack` stays out.
- **Dead code removed** from `functions/api/_integrations.js` (Apps Script `appendToSheet` +
  `GOOGLE_SHEET_WEBHOOK_URL`/`SHEET_SHARED_SECRET`); sheet writes are `_sheets.js` only.
- **Real USPS Ground Advantage shipping** (2026-07-26): `GA_RETAIL` table (Notice 123, eff.
  2026-07-12), flat by weight at `REP_ZONE=6` (origin ZIP 94044). Per-SKU weights; Family Pack
  fixed to 16 oz (4 clips). Client dollars ↔ server cents mirrored. LIVE & verified (clip = $8.75).
- **Sales tax via Stripe Tax** (2026-07-26): `automatic_tax` gated behind env `STRIPE_TAX_ENABLED`
  (set to `true` in Cloudflare prod). Stripe Tax is configured in the dashboard (origin + CA reg);
  live session creation verified succeeding. Emails/webhook thread tax so totals reconcile.
- **Analytics: GA4 property switch + Microsoft Clarity** (2026-09-11): moved `VITE_GA4_ID` from the
  old personal-account property `G-Y4KDGQXHTY` to the sponge-owned `G-DGZGWC184G`
  (team@spongehydration.com) — verified live, zero hits to the old id. Added **Microsoft Clarity**
  (`ygqhrydoog`, session replay + heatmaps) consent-gated in `src/analytics.js` under the `analytics`
  category, disclosed in the privacy policy. Both env-driven & consent-gated; Meta/TikTok pixels still
  unset. GA4 funnel events already fire (view_item → add_to_cart → begin_checkout → purchase).
- **GA4 Data API access + weekly funnel email** (2026-09-11): reused the Sheets service account
  `sponge-sheets-writer@…` (scope `analytics.readonly`, granted Viewer on the real property
  **437571529** which owns `G-DGZGWC184G`). Ad-hoc CLI puller `scripts/ga4-funnel.mjs` (web-only
  funnel). Automated weekly report: Pages Function `functions/api/ga4-weekly-report.js` pulls the 7-day
  web funnel and emails team@spongehydration.com via `sendGmail()`, token-protected by the Cloudflare
  secret **`GA4_REPORT_TOKEN`**; fired by claude.ai routine `trig_01EhdXCQnSwbJux2Bfy2FtRZ`
  (cron `0 3 * * 1` UTC = Sun 8pm PT). End-to-end send verified (`emailed:true`). Numbers are ~zero
  until the freshly-switched property accumulates traffic.

- **Weekly website report bundle** (2026-09-26): `functions/api/weekly-site-report.js` returns JSON only
  (GA4 overview/channels/sources/landing pages/devices/geo/funnel, Stripe orders/revenue/refunds/units/
  abandoned checkouts, Clarity weekly roll-up, email signups, app actives), this week vs last week in PT.
  Daily `functions/api/clarity-snapshot.js` saves Clarity's 1-day export to the **`Clarity Daily`** tab of
  the order sheet (the API only covers 1–3 days). Both use `?key=<GA4_REPORT_TOKEN>`. Fired by claude.ai
  scheduled tasks: weekly report `trig_01ShRot5RiU7HSQpuD756jxd` (Sun 7:46pm PT, writes + emails the
  analysis) and a daily Clarity snapshot task. Needs **`CLARITY_API_TOKEN`** set in Cloudflare prod.

## Required env / secrets (prod, Cloudflare Pages)
- Build-time (bake into bundle — change requires **redeploy**): `VITE_GA4_ID=G-DGZGWC184G`,
  `VITE_CLARITY_ID=ygqhrydoog`, `STRIPE_TAX_ENABLED=true`.
- Runtime secrets: `GOOGLE_SA_EMAIL`/`GOOGLE_SA_PRIVATE_KEY` (Sheets + GA4), `GMAIL_*`/`ORDER_FROM_EMAIL`
  (order + report email), `STRIPE_*`, `STATUS_TOKEN_SECRET`, **`CLARITY_API_TOKEN`** (weekly report + daily snapshot), and **`GA4_REPORT_TOKEN`** (weekly-report
  trigger — if missing, `/api/ga4-weekly-report` returns 500/401 and the Sunday email silently stops).

## Open to-dos
1. **Rotate the Stripe TEST keys** shared earlier in chat (Dashboard → Test mode →
   API keys → roll). Live keys were never exposed.
2. **Place one real LIVE test order** (real card, then refund in Stripe) to confirm
   the live chain: payment → sheet row → emails → order-status link + tax line. Only tested in test mode.
3. **Confirm shipping weights on a scale.** `SKU_WEIGHT_OZ` in both shipping files are ESTIMATES
   (clip 4 oz, family 16 oz, adhesive 2 oz, +2 oz box). Adjust if real packages differ. Consider
   whether `REP_ZONE` should be 7 (margin-safe) vs 6 (current) for the CA→nationwide mix.
4. **#5 SEO — Search Console** (now unblocked): submit `sitemap.xml`, URL-inspect key pages.
   Sitemap itself is already reconciled with the routes (see Done); this is dashboard work only.
5. **#8 Cleanup:**
   - Delete stray **Worker** projects `spongehydration` + `sponge-hydration` (Cloudflare dashboard;
     token can't delete Workers). One squats the clean name.
   - Delete **TEST rows** in the `2026` sheet (~orders #55–60, incl. the sample tracking # on #60).
6. **Trim MCP connectors** in the new session via `/mcp` (drop computer-use, Claude-in-Chrome,
   scheduling/registry/session-mgmt, Gmail connector; keep browser preview, optionally Drive/Cloudflare).
   Do it at session start (mid-session toggles bust the prompt cache).
7. **Migrate Google service account + GCP project off the personal account.** The SA
   `sponge-sheets-writer@claudestuff-501202.iam.gserviceaccount.com` (used by Sheets order log,
   and now GA4 Data API) lives in GCP project `claudestuff-501202`, which is under the **personal**
   Google account (phnative@gmail.com), not sponge's Workspace. So Sheets/GA4 backend identity
   depends on a personal account. Recreate the SA under a **sponge-owned GCP org/Workspace**, re-grant
   it on the Sheet + the `G-DGZGWC184G` GA4 property, swap `GOOGLE_SA_EMAIL`/`GOOGLE_SA_PRIVATE_KEY`
   in `.dev.vars` + Cloudflare, and decommission the old SA. (Gmail OAuth already uses
   team@spongehydration.com — this is the remaining personal-account dependency.)
8. **Grant the service account Viewer on the live GA4 property `G-DGZGWC184G`** (owned by
   team@spongehydration.com) so the Data API funnel puller works. It currently only sees an empty
   personal property (553741075). Superseded by #7 once the SA moves under the sponge org.

## Token tips for the new session
- `CLAUDE.md` auto-loads — don't re-explore the stack.
- Use **Haiku** for routine edits/verification; escalate to Opus only for hard work.
- Keep MCP connectors trimmed; avoid mid-session model/MCP switches.

## Key references
- Secrets/integration setup: `docs/order-integrations.md`
- Cloudflare account id: `11011d90c39d9b8cfe4f46afe2b01267`; token in `.cf-token` (Pages:Edit only).
- Local full-stack test: `npm run build && npx wrangler pages dev dist --port 8788`.
