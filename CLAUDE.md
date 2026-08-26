# Sponge-Website

Marketing + store for Sponge hydration trackers. **Live: https://www.spongehydration.com**

## Stack & build
- React 18 + react-router 6 **data routes** + Vite 5 + **vite-react-ssg** (static prerender). Node 20.
- `npm run build` → `vite-react-ssg build` → `dist/`. `npm run dev` → Vite dev (port **4187**, see `.claude/launch.json`).
- Backend: **Cloudflare Pages Functions** in `functions/api/`. Test locally: `npm run build && npx wrangler pages dev dist --port 8788`.

## Deploy
- **Push to `main` → Cloudflare Pages (project `sponge-website`) native Git integration → auto-deploys.** No Actions, no `wrangler pages deploy`.
- Account id `11011d90c39d9b8cfe4f46afe2b01267`. Apex→www via `functions/_middleware.js`.
- Verify a deploy landed by curling the live function/page (edge rollout takes ~1–2 min and briefly serves mixed versions).

## Layout
- `src/App.jsx` — routes array (data-router) consumed by vite-react-ssg; dynamic routes use `getStaticPaths`. `*`→NotFound, plus `/404` prerenders `dist/404.html` (real 404s).
- `src/pages/`, `src/components/` (Header, Footer, Layout, `useSEO.jsx` exports the **`<Seo>`** component — react-helmet, NOT a hook), `src/cart/CartContext.jsx` (localStorage `sponge-cart-v3`, migrates v1/v2), `src/data.js`, `src/shipping.js`.
- `functions/api/`: `create-checkout-session`, `webhook` (checkout.session.completed → sheet + emails), `order-status`, `contact`, `reviews`; shared `_integrations.js` (Gmail), `_sheets.js` (Sheets service-account), `_status-token.js`, `_tracking.js`.

## Integrations
- **Stripe** hosted Checkout + webhook. Prod is **LIVE mode**.
- **Google Sheet** order log (tab `2026`) via service account JWT (`_sheets.js`). Team maintains tracking/delivery there.
- **Gmail** order + contact emails via OAuth2 refresh token, send-as `team@spongehydration.com`.
- **Order-status page** (`/order-status?token=…`): signed token → reads sheet row → 30-day-post-delivery expiry. Carrier-link tracking only (no paid API).
- **Airtable** reviews (`reviews.js`).

## Gotchas
- **Shipping is mirrored** in `src/shipping.js` (client, dollars) AND `create-checkout-session.js` (server, cents) — **keep in sync**. US-only, weight-based (4 oz/item) USPS tiers.
- **Colors offered = black/white only.** Retired colors coerce to `black` on client + server.
- Dashboard & Account entry points are **hidden** (links removed) but the routes still resolve for preview.
- SSG: no `window`/`document`/`localStorage` at module/render scope (effects/handlers are fine; `CartContext` load is guarded).
- Secrets: all in **`.dev.vars`** (gitignored) for local wrangler; production via `wrangler pages secret` / Cloudflare dashboard. **Never commit `.dev.vars`, `.cf-token`, or keys.** Cloudflare token in `.cf-token` (Pages:Edit only — can't touch DNS or Workers). Setup docs: `docs/order-integrations.md`.

## Privacy & consent
- **Consent gates all nonessential tags.** `src/consent.js` holds the state (localStorage `sponge-privacy-v1`); `src/analytics.js` refuses to inject or fire anything without the matching category. Default is DENY, so a first visit makes zero analytics/ad requests.
- Categories: `analytics` (GA4) and `advertising` (Meta + TikTok + server-side CAPI). Essential (cart, Stripe, Cloudflare) is never gated.
- **GPC** (`navigator.globalPrivacyControl`) forces `advertising` off and locks the toggle. Never persist an advertising grant while it is asserted.
- **Server-side CAPI honours the same choice**: the client sends `adConsent` to `create-checkout-session`, which stamps `metadata[ad_consent]` on the Stripe session; `webhook.js` calls Meta only when `adConsentGranted()` sees exactly `'1'`. **Fails closed.**
- UI: `src/components/PrivacyControls.jsx` (banner + dialog, mounted in Layout). The footer's "Do Not Sell or Share My Personal Information" button opens it via the `sponge:openprivacy` event. `/legal/privacy` also renders live controls.
- Downgrading consent clears tracker cookies and **reloads** — already-executed scripts cannot be unloaded any other way. Upgrades load immediately via the `sponge:consentchange` listener in Layout.
- `npm test` (Vitest + jsdom) covers persistence, revocation, GPC, tracker suppression, cold-load ordering, and server-side suppression. Run it before touching any of the above.

## Fonts
- **Inter is self-hosted** at `public/fonts/inter-latin-var.woff2` — a **variable** font, so one 48KB file covers the whole 400–900 weight axis the site uses. It replaced a render-blocking cross-origin stylesheet from Google Fonts plus its font fetches.
- Declared as a single `@font-face` with `font-weight: 100 900` at the top of `src/index.css`, preloaded from `index.html`, `font-display: swap`.
- Self-hosting also removed Google Fonts from the request path, which is why it is **no longer listed as a processor in the privacy policy**. If you ever re-add a hosted font, put the processor back.
- Licence: SIL OFL 1.1, shipped at `public/fonts/Inter-LICENSE.txt`. Keep it with the font.
