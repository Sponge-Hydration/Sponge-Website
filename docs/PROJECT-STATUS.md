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
- Token-opt config added: `CLAUDE.md`, `.claude/settings.json`, `.claude/rules/shipping-sync.md`.

## Open to-dos
1. **Rotate the Stripe TEST keys** shared earlier in chat (Dashboard → Test mode →
   API keys → roll). Live keys were never exposed.
2. **Place one real LIVE test order** (real card, then refund in Stripe) to confirm
   the live chain: payment → sheet row → emails → order-status link. Only tested in test mode.
3. **Set real USPS shipping rates.** Currently placeholders — edit BOTH (keep in sync):
   `src/shipping.js` (dollars) and `functions/api/create-checkout-session.js` (`SHIP_TIERS`, cents).
   Also confirm Family Pack weight (currently treated as 4 oz like every item, but it holds 4 clips).
4. **#5 SEO — Search Console** (now unblocked): submit `sitemap.xml`, URL-inspect key pages;
   keep `/order-status` out of the sitemap (noindex). Reconcile sitemap with current routes.
5. **#8 Cleanup:**
   - Delete stray **Worker** projects `spongehydration` + `sponge-hydration` (Cloudflare dashboard;
     token can't delete Workers). One squats the clean name.
   - Delete **TEST rows** in the `2026` sheet (~orders #55–60, incl. the sample tracking # on #60).
   - Remove dead code in `functions/api/_integrations.js` (old Apps Script `appendToSheet` +
     `GOOGLE_SHEET_WEBHOOK_URL`/`SHEET_SHARED_SECRET` — superseded by `_sheets.js`).
6. **Commit the token-opt config** (`CLAUDE.md`, `.claude/settings.json`, `.claude/rules/`) —
   created locally but NOT yet committed. Pushing triggers a no-op rebuild.
7. **Trim MCP connectors** in the new session via `/mcp` (drop computer-use, Claude-in-Chrome,
   scheduling/registry/session-mgmt, Gmail connector; keep browser preview, optionally Drive/Cloudflare).
   Do it at session start (mid-session toggles bust the prompt cache).

## Token tips for the new session
- `CLAUDE.md` auto-loads — don't re-explore the stack.
- Use **Haiku** for routine edits/verification; escalate to Opus only for hard work.
- Keep MCP connectors trimmed; avoid mid-session model/MCP switches.

## Key references
- Secrets/integration setup: `docs/order-integrations.md`
- Cloudflare account id: `11011d90c39d9b8cfe4f46afe2b01267`; token in `.cf-token` (Pages:Edit only).
- Local full-stack test: `npm run build && npx wrangler pages dev dist --port 8788`.
