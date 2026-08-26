# Site Audit Remediation Ledger

Permanent source of truth for the full spongehydration.com audit of **2026-08-25**
and everything done about it since. Every finding from that audit is transcribed
here, including low-priority ones.

**Statuses:** `Not Started` · `In Progress` · `Blocked` · `User Action Required` · `Complete`

**How to use this file:** never delete a row. Move it to `Complete` with evidence,
or to `User Action Required` with the exact action needed. New findings get the
next free ID.

---

## Summary

| Priority band | Total | Complete | In Progress | User Action Required | Not Started |
|---|---|---|---|---|---|
| P0 — broken / legal / privacy / data integrity | 8 | 6 | 0 | 2 | 0 |
| P1 — checkout, tracking, conversion-critical | 7 | 4 | 0 | 2 | 1 |
| P2 — messaging, trust, navigation | 8 | 3 | 0 | 1 | 4 |
| P3 — mobile & accessibility | 6 | 3 | 0 | 0 | 3 |
| P4 — SEO & structured data | 6 | 0 | 0 | 0 | 6 |
| P5 — performance | 3 | 0 | 0 | 0 | 3 |
| P6 — visual & content polish | 5 | 1 | 0 | 1 | 3 |
| **Total** | **43** | **17** | **0** | **6** | **20** |

Counts are maintained by hand; the per-row Status column is authoritative.

---

## Blocked / User Action Required — the short list

Everything here needs Nathan, not code. Nothing else in the ledger depends on
these except where a row says so.

| ID | What is needed | Why it cannot be done in the repo |
|---|---|---|
| A-33 | Disable **Cloudflare Web Analytics** auto-injection for the `sponge-website` Pages project (site token `36bb4ffa9b1e4f95b56f62977197614d`). Cloudflare dashboard → **Web Analytics** → that site → turn off automatic setup; or Workers & Pages → `sponge-website` → the Web Analytics toggle. | Measured: the beacon is injected downstream of Pages Functions (`beaconVisibleToFunction: false`), so no middleware or build change can remove it. |
| A-34 | Supply the six tracker config values (below). | Account credentials. |
| A-36 | Business postal address for the privacy contact section — **optional**. | A business fact. Do not invent one, and do not publish a personal home address. |
| A-13 | Airtable env vars in Cloudflare so `/api/reviews` works. | Account credentials. |
| A-21 | Original product photography (see A-21 shot list). | Requires a camera and the physical product. |
| A-24 | Decide the Family Pack price now that the real saving is $39.97, not $100. | A pricing decision. |

### A-34 — required analytics configuration

Nothing tracks until these are set. Code is deployed and gated already.

Cloudflare Pages → `sponge-website` → Settings → **Environment variables** (build-time, public):

| Variable | Value |
|---|---|
| `VITE_GA4_ID` | GA4 measurement id, `G-XXXXXXXXXX` |
| `VITE_META_PIXEL_ID` | Meta numeric pixel/dataset id |
| `VITE_TIKTOK_PIXEL_ID` | TikTok pixel id from TikTok Events Manager |

Cloudflare Pages → `sponge-website` → Settings → **Secrets** (server-side):

| Variable | Value |
|---|---|
| `META_PIXEL_ID` | Same numeric id as `VITE_META_PIXEL_ID` |
| `META_CAPI_TOKEN` | Conversions API token, Events Manager → dataset → Settings |
| `META_TEST_EVENT_CODE` | *Temporary, verification only.* Set while checking Events Manager → Test Events, then **remove**. |

**A redeploy is required after setting the `VITE_` values** — they are inlined at
build time, not read at runtime. Until then Vite tree-shakes the vendor code out
entirely; the current production bundle contains zero references to
googletagmanager, facebook, or tiktok.

---

## P0 — Broken functionality, security, privacy, legal, data integrity

### A-01 — "Free shipping" contradicted at checkout
- **Original finding:** Hero read *"30-day money-back guarantee · Free shipping to the US & Canada"*. A real cart reached checkout at `$59.99 → Shipping (USPS Ground) $8.75 → Total $68.74 + tax`. The same page also said shipping was **US only**, so the Canada half failed too.
- **Priority / impact:** P0. A 14.6% surprise at the highest-abandonment moment, plus an advertised-price claim that could draw consumer-protection complaints.
- **Affected:** `src/pages/Home.jsx` hero, `/checkout`, `/cart`.
- **Dependencies:** none.
- **Acceptance criteria:** no "free shipping" or "Canada" claim anywhere; cart shows the real USPS charge; cart and checkout totals identical.
- **Status:** **Complete**
- **Evidence:** commit `fa116e2` → merge `63938d3`. Cart now shows `Shipping (USPS Ground)` from `shippingForCart()`. Verified in production: 1 unit `$8.75 / $68.74 + tax`, 2 units `$11.35 / $131.33 + tax`, cart and checkout identical. Sitewide grep for "free shipping"/"Canada" returns 0 across all pages.

### A-02 — Homepage never disclosed the pre-order
- **Original finding:** Homepage said "Order Sponge", "Order Now", "Checkout - $59.99", "Trusted by 120+ early customers". The word *pre-order* appeared nowhere; the PDP said **PRE-ORDER · Ships in ~8 weeks**.
- **Priority / impact:** P0. Buyers qualified on one set of terms and paid on another.
- **Affected:** `Home.jsx`, `Header.jsx`, `Cart.jsx`, `Checkout.jsx`, `BlogPost.jsx`, `data.js`.
- **Dependencies:** A-35 (the 8-week figure turned out to be untrue).
- **Acceptance criteria:** pre-order status visible before the buy decision on every entry point.
- **Status:** **Complete**
- **Evidence:** commit `fa116e2`. Hero eyebrow, hero CTA, header CTA, CTA band, cart, checkout, PDP and blog CTA all carry pre-order framing. Verified live.

### A-35 — The "~8 weeks" ship window was not true
- **Original finding:** Surfaced during A-02. Nathan confirmed there is no known timeline; a batch runs only when enough pre-orders accumulate.
- **Priority / impact:** P0. Stating a delivery window you cannot meet is the exact exposure the FTC Mail Order Rule addresses.
- **Affected:** `data.js` (5 sites), `Home.jsx`, `Cart.jsx`, `Checkout.jsx`, `/legal/*`.
- **Dependencies:** none.
- **Acceptance criteria:** no date promised anywhere; a published pre-order policy that is defensible without one.
- **Status:** **Complete**
- **Evidence:** commit `fa116e2`. All "~8 weeks" copy replaced with "Ships with our next production batch". New `/legal/pre-order` policy: card charged at purchase, price locked, **unconditional cancellation for a full refund any time before shipment** (7 business days) — the clause that makes having no date defensible — proactive refund if a batch is cancelled, minor-spec-change latitude. Registered in `getStaticPaths`, sitemap and footer. Live: `/legal/pre-order` returns 200, dated August 2026.

### A-13 — `/api/reviews` returns 503 in production
- **Original finding:** `GET /api/reviews → 503 {"error":"Reviews are not configured."}`. Two console errors on every page load. The homepage and `/reviews` silently fall back to four hardcoded reviews, so the **review submission form is posting into a void** — customer reviews are very likely being lost.
- **Priority / impact:** P0. Silent data loss plus a dead CTA.
- **Affected:** `functions/api/reviews.js`, `/reviews`, homepage reviews section.
- **Dependencies:** Airtable credentials.
- **Acceptance criteria:** endpoint returns 200; a test review submitted through the live form appears in Airtable; no console errors.
- **Status:** **User Action Required**
- **Required action:** add `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_REVIEWS_TABLE` to the Cloudflare Pages project (see `.dev.vars.example`) and redeploy. The PAT needs `data.records:read` **and** `data.records:write`.
- **Evidence:** re-confirmed still failing 2026-08-25.

### A-30 — Privacy policy was 90 words and became inaccurate
- **Original finding:** A single paragraph. No processors, retention, cookies, CCPA/CPRA rights, children's data, or address. Enabling Meta/TikTok made its "we never sell your personal data" claim misleading, since sharing for cross-context behavioural advertising is "sharing" under CPRA.
- **Priority / impact:** P0. Legal exposure and an App Store/Play requirement.
- **Affected:** `/legal/privacy`.
- **Dependencies:** A-31, A-32.
- **Acceptance criteria:** complete policy naming only processors this repo actually calls; sell vs share distinguished; all required sections present.
- **Status:** **Complete**
- **Evidence:** commit `4b2379f` → merge `93ee170`, amended by `b7c497d`. Processors verified against the codebase: Stripe, Cloudflare, Google (Gmail, Sheets, Fonts, Analytics), Airtable, Meta, TikTok — every one is actually called. Live check: all 12 sections present, "we do not sell" and "we do share ... if you allow" both stated. Postal address deliberately deferred (A-36).

### A-31 — No consent mechanism for analytics/advertising
- **Original finding:** Raised when tracking was added — no way to reject, change, or revoke.
- **Priority / impact:** P0.
- **Affected:** `src/consent.js`, `src/analytics.js`, `PrivacyControls.jsx`, `Layout.jsx`, `Footer.jsx`, `Legal.jsx`.
- **Dependencies:** none.
- **Acceptance criteria:** default deny; per-category choice; change and revoke; no tag loads or fires against the choice; essential functionality unaffected.
- **Status:** **Complete**
- **Evidence:** commit `4b2379f`. Default DENY; categories `analytics` (GA4) and `advertising` (Meta/TikTok/CAPI); consent re-read per event so mid-session withdrawal is immediate; downgrades clear cookies and reload, upgrades load immediately. **51 tests** (`npm test`). Production verified: cold visit loads no vendor script; declining holds through the whole funnel while the cart still works; withdrawal clears storage and cookies and restores the banner.

### A-32 — Global Privacy Control not honoured
- **Original finding:** No GPC detection, which California treats as a valid opt-out.
- **Priority / impact:** P0.
- **Affected:** `src/consent.js`, `PrivacyControls.jsx`.
- **Dependencies:** A-31.
- **Acceptance criteria:** GPC detected automatically, forces advertising off, overrides stored grants, never persisted over, and is explained to the user.
- **Status:** **Complete**
- **Evidence:** commit `4b2379f`. Production verified: toggle renders disabled with `aria-describedby`, explanatory note shown, `advertising:false` persisted even when a grant was stored. Covered by 5 GPC tests.

### A-33 — Cloudflare "cookieless beacon" classification
- **Original finding:** The audit noted a single third-party script, `static.cloudflareinsights.com/beacon.min.js`, and treated it as essential infrastructure. That assumption was challenged and re-examined 2026-08-25.
- **Priority / impact:** P0. It determines whether the site's privacy claims are true.
- **Affected:** `functions/_middleware.js`, `PrivacyControls.jsx`, `/legal/privacy`.
- **Dependencies:** none for the code half; account access for the disable half.
- **Findings — measured, not assumed:**
  - It is **Cloudflare Web Analytics** (RUM), **not** security or hosting infrastructure. The tag carries `data-cf-beacon={"version":"2024.11.0","token":"36bb4ffa9b1e4f95b56f62977197614d"}` — a Web Analytics **site token** — and POSTs to `/cdn-cgi/rum`.
  - **Captured payload:** `location` (page address), `referrer`, `eventType`/`nt` (navigation type), `firstPaint`, `firstContentfulPaint`, `timingsV2` (protocol, transferSize, decodedBodySize), `pageloadId` (a UUID regenerated per page load), `siteToken`, `startTime`. **No cookie, no device fingerprint, no cross-page or cross-site identifier.**
  - **Cookieless is not the same as essential.** It is measurement, and it runs before any consent decision.
  - **It cannot be controlled from this repository.** A query-gated diagnostic build measured `beaconVisibleToFunction: false` — the beacon is absent from the HTML when a Pages Function sees it, so Cloudflare injects it downstream in the CDN pipeline. No middleware, HTMLRewriter, or build change can strip or gate it.
- **Acceptance criteria:** classification recorded; site claims made accurate; disable action documented precisely.
- **Status:** **Complete** (code and claims) · disable is **User Action Required**
- **Evidence:** commit `b7c497d`. Banner headline "We track nothing until you say so." → "You decide what we measure." Dialog no longer folds it into Essential and states plainly that it is measurement, runs before you choose, and cannot be switched off there. Policy describes exactly what it records and that it is enabled at the hosting account. The strong "no request before you choose" promise is now scoped explicitly to the consent-gated vendors. `test/beacon-classification.test.js` (7 tests) prevents both a shipped beacon and the return of an absolute claim. Diagnostic removed and confirmed gone from production.
- **Required action to fully remove:** see the User Action table above.

---

## P1 — Checkout, purchasing, tracking, conversion-critical

### A-03 — No email capture anywhere on the site
- **Original finding:** All 20 pages searched. No newsletter, waitlist, notify-me on the sold-out Coaster, lead magnet, pre-Stripe field, or exit intent. The contact and review forms collect email for support only.
- **Priority / impact:** P1, arguably the highest-value gap. ~97–99% of first visits do not buy, and with an open-ended pre-order window every one of them is currently unreachable. Abandoned-cart recovery — normally the highest-ROI DTC flow — is impossible.
- **Affected:** `/checkout`, `/products`, footer, `/blog`.
- **Dependencies:** an email platform decision (or a simple Sheets/Airtable capture).
- **Acceptance criteria:** email captured at three points — before the Stripe redirect, a notify-me on sold-out SKUs, and one honest footer/blog offer; stored somewhere retrievable; consent-appropriate copy.
- **Status:** **Complete**
- **Status note:** the "email platform decision" dependency was resolved without one — signup writes to the spreadsheet the order log already uses, so no new service or credential was needed.
- **Evidence:** commit `4768306`. `functions/api/subscribe.js` writes to a **Subscribers** tab in the existing order spreadsheet, reusing the Google service account already configured in production. Honeypot, source allow-list, duplicate-safe, and it returns 503 rather than faking success when unconfigured. One reusable `EmailSignup` component in the footer, on sold-out products, and on `/checkout` before the Stripe redirect. 9 new tests (60 total). Production verified: invalid address → 400; honeypot → 200 with no write; real address → 200; a submission through the live footer UI returned the confirmation state. Same flex-basis-on-main-axis bug as the privacy banner found and fixed (a 190px-tall input in the stacked variant).
- **Follow-up for Nathan:** two clearly-marked test rows were created during verification — `claude-verification-test@spongehydration.com` and `claude-ui-verification@spongehydration.com`. Delete them from the Subscribers tab, and confirm the first appears only once (which also confirms de-duplication).

### A-04 — No advertising or analytics instrumentation
- **Original finding:** Only script was the Cloudflare beacon. No GA4, Meta pixel, TikTok pixel, or Conversions API. Paid spend could not be measured, optimised, or retargeted.
- **Priority / impact:** P1. Nothing else about paid acquisition works without it.
- **Affected:** `src/analytics.js`, `functions/api/_meta-capi.js`, `webhook.js`, `create-checkout-session.js`.
- **Dependencies:** A-34 (account values).
- **Acceptance criteria:** GA4 + Meta (browser and CAPI) + TikTok firing `view_item`, `add_to_cart`, `begin_checkout`, `purchase`, deduplicated, and consent-gated.
- **Status:** **Complete** (implementation) — see A-37, A-38 for the remaining halves
- **Evidence:** commit `966f74c` → merge `7d9d068`. Full funnel implemented; server-side Meta CAPI from the Stripe webhook inside the existing `allSettled` set so it can never block an order; both purchase copies carry `event_id` = Stripe session id for deduplication. Verified with dummy IDs: `purchase` at `$131.33` with the session as `transaction_id`, `begin_checkout` at `$68.74`, `view_item`/`add_to_cart` on all three platforms. **Bug found and fixed during this work:** React runs child effects before parent effects, so a page's tracking effect fired before `Layout`'s init and the first event of every cold page load was silently dropped — precisely the ad-click landing. Every `track*` entry point now initialises first.

### A-37 — Production tracker activation
- **Original finding:** Split from A-04. The code is deployed but inert.
- **Priority / impact:** P1.
- **Affected:** Cloudflare Pages env vars.
- **Dependencies:** A-34.
- **Acceptance criteria:** all six values set; site redeployed; vendor code present in the bundle again.
- **Status:** **User Action Required**
- **Evidence:** current production bundle `app-C6P1j3Wd.js` contains **0** references to googletagmanager, connect.facebook.net, analytics.tiktok, or fbevents — confirmed tree-shaken because the IDs are empty. Consent machinery (`sponge-privacy-v1`, `globalPrivacyControl`, `openprivacy`, `consentchange`) is present.

### A-38 — Post-activation consent and event verification
- **Original finding:** Split from A-04. Consent gating has only been proven against dummy IDs, because the real vendor code is not in the production bundle yet.
- **Priority / impact:** P1. This is the check that proves the privacy work holds in the build that actually ships tags.
- **Affected:** `src/analytics.js`, `functions/api/webhook.js`.
- **Dependencies:** A-37.
- **Acceptance criteria:** on the real build — (1) a cold first visit issues **no** request to googletagmanager, facebook, or tiktok; (2) declining keeps it that way through the full funnel; (3) accepting fires the funnel; (4) GPC suppresses Meta/TikTok while leaving GA4; (5) a real order from a buyer who declined advertising produces **no** Meta CAPI call — check the webhook log for `metaCapi: skipped - buyer declined advertising sharing`; (6) a consented order produces exactly **one** Meta conversion, not two, confirming `event_id` deduplication in Events Manager.
- **Status:** **Pending** — blocked on A-37

### A-05 — Colour choice only existed after adding to cart
- **Original finding:** The PDP had no colour selector; adding to cart wrote `colors:["black"]` silently. Black/White radios appeared only in the cart, and the homepage "Checkout - $59.99" button skipped the cart entirely, so that buyer never saw the choice. White is the colour in most of the good photography.
- **Priority / impact:** P1.
- **Affected:** `ProductDetail.jsx`, `Cart.jsx`, `Home.jsx`.
- **Dependencies:** none.
- **Acceptance criteria:** colour selectable on the PDP above the buy button, gallery reflects it, still editable in the cart.
- **Status:** **Not Started**

### A-06 — Cart has no quantity control and no cross-sell
- **Original finding:** Each unit is its own row with "+ Add another"/"Remove"; four trackers produce four rows. No promo field, no payment icons, and **no cross-sell of the $14.99 Magnetic Adhesive 3-Pack**, which is the natural attach product and solves the "swap between bottles" use case the copy already sells.
- **Priority / impact:** P1 (AOV).
- **Affected:** `Cart.jsx`.
- **Dependencies:** A-05.
- **Acceptance criteria:** identical colours grouped with a quantity stepper; 3-Pack offered as a one-tap add-on.
- **Status:** **Not Started**

### A-07 — Redundant `/checkout` interstitial
- **Original finding:** `/cart → /checkout → Stripe`. The middle page repeats the summary and adds a click at peak intent, offering nothing the cart did not.
- **Priority / impact:** P1 (minor, but free).
- **Affected:** `Checkout.jsx`.
- **Dependencies:** A-03 — the page becomes worth keeping if it captures email.
- **Acceptance criteria:** either go straight to Stripe, or the interstitial earns itself with email capture and express-wallet signalling.
- **Status:** **Not Started**

---

## P2 — Messaging, trust, navigation, high-impact conversion

### A-08 — Positioning: competing where Sponge is third best
- **Original finding:** The site sells "an automatic hydration tracker that works with any bottle". On that ground HidrateSpark PRO 2 wins (21-day battery vs 8, Apple Health/Fitbit/Garmin/Google Fit/Withings, 4.7★ from 2,598 reviews, 15+ institution logos, 5 clinical trials) and Ulla wins on price (~$30, 6-month battery, 500,000+ sold, and already owns "Stay Hydrated Without Thinking"). App Lock is the only unrepeatable feature and it is the 7th thing on the homepage. Brick sells a $59.00 physical app-blocker — the identical price — on 55,000+ 5-star reviews.
- **Priority / impact:** P2 but the highest-ceiling item in the audit.
- **Affected:** `Home.jsx` (structure and copy), `/about`.
- **Dependencies:** A-21 (the lock demo needs photography/video that does not exist).
- **Acceptance criteria:** homepage restructured to lead with App Lock; new H1; personas reduced; App Lock moved to position two.
- **Status:** **Not Started**
- **Recommendation of record:** primary audience = the phone-aware habit builder, 22–38. Secondary = caregivers, but only once real proof exists. Deprioritise athletes until Apple Health ships, general wellness (Ulla owns it), and workplace (needs a B2B motion).

### A-09 — Objections raised by the site's own reviews go unanswered
- **Original finding:** Accuracy, Apple Health, the wait, thickness, and price-vs-Ulla are all unanswered. Two of four published reviews ask for Apple Health by name; one asks for a thinner device.
- **Priority / impact:** P2, high conversion impact.
- **Affected:** `/how-it-works` FAQ, PDP.
- **Dependencies:** A-10 for the accuracy figure.
- **Acceptance criteria:** each of the five objections answered on-page, plus a comparison table.
- **Status:** **Not Started**

### A-10 — "Is it accurate?" answered without a number
- **Original finding:** The FAQ answers a different question than the one asked: *"Sponge measures real sips with on-device sensors rather than asking you to remember and self-report."* For a measurement device, declining to quantify the central claim reads as evasion.
- **Priority / impact:** P2.
- **Affected:** `data.js` FAQ, PDP.
- **Dependencies:** **a real tested accuracy figure** — must not be invented.
- **Acceptance criteria:** a published tolerance and method, plus a stated limitation.
- **Status:** **Blocked** — requires a measured figure from Nathan/Chris. Do not fabricate.

### A-24 — Fictitious compare-at pricing
- **Original finding:** `$79.99` strikethrough on a device that has only ever sold at `$59.99`. Family Pack anchored at `$299.96` (= $74.99/unit, a price that never existed); 2-Pack at `$159.98`.
- **Priority / impact:** P2 with real legal exposure — FTC 16 CFR 233 requires a former price to have been genuinely offered in good faith, and Cal. Bus. & Prof. Code 17501 requires it to have prevailed within 3 months of the ad.
- **Affected:** `data.js`, `Products.jsx`, `ProductDetail.jsx`, `Home.jsx`.
- **Dependencies:** none for removal; a pricing decision for the Family Pack.
- **Acceptance criteria:** no unsubstantiated former price anywhere; bundle anchors reflect real arithmetic.
- **Status:** **Complete** (claims) · Family Pack repricing is **User Action Required**
- **Evidence:** commit `492a923` → merge `eb5220d`. Device `compareAt` removed. Bundle anchors corrected to the true sum of parts: Family Pack `$239.96` (4 × $59.99, saving **$39.97 not $100**), 2-Pack `$119.98`, both labelled "if bought separately". Two stale hardcoded numbers fixed (Family Pack badge and its "Save $100 vs. buying singles" feature bullet). Replaced with a durable category anchor: *"Smart bottles start around $80 and ask you to replace the bottle you already own. Sponge clips onto it."* — framed by category rather than naming a competitor whose price would go stale into a false claim. Live: 0 occurrences of `79.99`/`299.96`/`Save $100` across all product pages.
- **Note for Nathan:** "Save $39.97" is a materially weaker offer than "Save $100". At 4-for-$239.96 the Family Pack discount is 17%, which is thin for a bundle aimed at caregivers. Repricing is a margin decision.

### A-11 — "120+ early customers" vs ~60 shipped
- **Original finding:** The site claims 120+ customers; `CLAUDE.md` records ~60 units shipped April 2026. If the figure counts pre-orders, "customers" is the wrong word.
- **Priority / impact:** P2, substantiation risk.
- **Affected:** trust bar and CTA band in `Home.jsx`.
- **Dependencies:** the true number.
- **Acceptance criteria:** figure verified, or the noun corrected.
- **Status:** **User Action Required** — needs the real count. Partially mitigated: the hero eyebrow no longer carries it (A-02).

### A-12 — Only four reviews, two of them criticisms
- **Original finding:** "Beautiful." (5★, one word), a 4★ asking for a how-to video and Whoop/Apple Health, a 4★ asking for Apple Health and background sync, and a 5★ reading in full *"Needs to be thinner, like 10mm total."* No aggregate rating anywhere. The submission form is nine fields deep.
- **Priority / impact:** P2.
- **Affected:** homepage `#reviews`, `/reviews`.
- **Dependencies:** A-13 (the form posts to a broken endpoint).
- **Acceptance criteria:** API fixed, form shortened to three fields, shipped customers emailed for reviews, aggregate rating displayed, publishing policy stated so candour reads as confidence.
- **Status:** **Not Started**

### A-14 — Blog stale and unlinked
- **Original finding:** Three posts, most recent 27 May 2026 — three months stale at audit. No author bylines, no citations on health claims, no internal links back to the product. The comparison post is the highest-intent asset on the site and is not linked from the homepage.
- **Priority / impact:** P2.
- **Affected:** `/blog`, `BlogPost.jsx`.
- **Dependencies:** none.
- **Acceptance criteria:** comparison post linked from the homepage; bylines added; health claims cited; either publish monthly or remove the dates.
- **Status:** **Not Started**

### A-15 — Contact page has no phone number or address
- **Original finding:** Email and "Mon-Fri, 9am-6pm ET" only. The ET hours are worth confirming for a California company. Caregivers buying a monitoring device for a parent look for a phone number.
- **Priority / impact:** P2.
- **Affected:** `/contact`, footer, `/caregivers`.
- **Dependencies:** A-36 (address), a phone line decision.
- **Acceptance criteria:** phone number and business address present, timezone confirmed.
- **Status:** **User Action Required**

---

## P3 — Mobile usability and accessibility

### A-16 — Phones lose the buy button entirely
- **Original finding:** `.header__order{display:none}` below 620px, and the mobile menu contains five nav links and **no purchase action**. No sticky buy bar. On a 14,635px-tall page a mobile visitor passes no persistent way to buy.
- **Priority / impact:** P3 by band but high conversion value — mobile is most of the traffic.
- **Affected:** `Header.jsx`, `index.css`.
- **Dependencies:** none.
- **Acceptance criteria:** a sticky bottom bar on mobile once the hero scrolls out: price, status, one filled CTA.
- **Status:** **Not Started**

### A-17 — Four WCAG contrast failures
- **Original finding:** `.trust__lbl` 3.88:1 (needs 4.5), `.tcard__who span` 4.15:1, `.stars` 2.03:1 (needs 3:1 for non-text), persona card body ~2.1:1 where white sits on the aqua end of the brand gradient.
- **Priority / impact:** P3.
- **Affected:** `index.css`.
- **Dependencies:** none.
- **Acceptance criteria:** all four ≥ the required ratio, measured.
- **Status:** **Not Started** *(the equivalent failure in new privacy UI was fixed at build time — `.privacy-opt__always` moved from `--muted` to `--ink-soft`, 4.15:1 → 7.99:1)*

### A-18 — Star ratings distinguished by colour alone
- **Original finding:** A 4-star review renders five glyphs with the fifth in `--line` (#e4ecf2), effectively invisible. Text extraction returns `★★★★★` for all four reviews regardless of score. Fails **WCAG 1.4.1 Use of Color**, and sighted users cannot reliably tell 4 from 5 either.
- **Priority / impact:** P3.
- **Affected:** `Reviews.jsx`, `index.css`.
- **Dependencies:** none.
- **Acceptance criteria:** outlined empty state, fill ≥3:1, numeric rating shown alongside.
- **Status:** **Not Started**

### A-19 — A visible headline hidden from screen readers
- **Original finding:** `<section class="lifestyle-band" aria-hidden="true">` wraps the decorative photo **and** the visible 32px quote "Hydration that keeps up with you, on the court, at the desk, everywhere."
- **Priority / impact:** P3.
- **Affected:** `Home.jsx`.
- **Dependencies:** none.
- **Acceptance criteria:** `aria-hidden` moved to the `<img>` only; text exposed.
- **Status:** **Not Started**

### A-20 — Non-descriptive labels and an uncaptioned video
- **Original finding:** Gallery thumbnails labelled "View image 1"–"View image 6". FAQ buttons set `aria-expanded` but no `aria-controls`, and answer panels have no `id`. The app-demo video on `/how-it-works` has no `<track>` captions and no title — a WCAG 1.2.2 failure if it carries narration, and commercially relevant since social-referred visitors watch muted.
- **Priority / impact:** P3.
- **Affected:** `ProductDetail.jsx`, `HowItWorks.jsx`.
- **Dependencies:** captions require the video's audio content.
- **Acceptance criteria:** descriptive thumbnail labels, `aria-controls` wired, video titled and captioned.
- **Status:** **Not Started**

### A-39 — Accessibility of the new privacy UI
- **Original finding:** New requirement introduced by A-31.
- **Priority / impact:** P3.
- **Affected:** `PrivacyControls.jsx`, `index.css`.
- **Acceptance criteria:** dialog semantics, focus trap, Escape, focus restore, labelled controls, 44px targets, no mobile overflow, contrast ≥4.5:1.
- **Status:** **Complete**
- **Evidence:** commit `4b2379f`. Production verified at 390px: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus moves in on open, Tab wraps at the boundary, Escape closes, focus restores to the footer button; labels bound via `for`/`id`; buttons 44px; 0 horizontally overflowing elements; banner 232px (27% of viewport). **Bug found and fixed:** `.privacy-banner__text { flex: 1 1 380px }` — `flex-basis` applies to the main axis, which becomes *height* once the layout is `column`, forcing a 517px banner.

---

## P4 — SEO and structured data

### A-22 — Identical Product + FAQPage JSON-LD on every page
- **Original finding:** The same three JSON-LD blocks are injected on all 20 URLs, including `/about`, `/blog`, `/team`, `/reviews` and the legal pages. Google requires FAQ markup to correspond to FAQ content **visible on that page**; the five questions live only on `/how-it-works`. Product markup on `/about` and `/blog` is the same violation.
- **Priority / impact:** P4 by band, but the most likely cause of a future manual action against the domain.
- **Affected:** `index.html`, `useSEO.jsx`.
- **Dependencies:** none.
- **Acceptance criteria:** Product only on product pages with real per-product data; FAQPage only on `/how-it-works`; Organization site-wide; BlogPosting on posts; BreadcrumbList where breadcrumbs render.
- **Status:** **Not Started**

### A-23 — Product schema thin and availability wrong
- **Original finding:** Missing `sku`, `gtin`, `priceValidUntil`, `shippingDetails`, `hasMerchantReturnPolicy` and — most valuable — `aggregateRating` despite four on-page reviews. `offers.url` points at the homepage on every page.
- **Priority / impact:** P4.
- **Affected:** `index.html`.
- **Dependencies:** A-22, A-12 (aggregate rating needs real reviews).
- **Acceptance criteria:** per-product schema with correct URL and availability; rating added once real.
- **Status:** **Not Started** *(the `availability: PreOrder` half is now consistent with the site after A-02/A-35)*

### A-25 — No social profile links, empty `sameAs`
- **Original finding:** Not a single Instagram, TikTok, Facebook, X, YouTube or LinkedIn link anywhere. `Organization.sameAs` is `[]`. For a brand whose primary channels are organic TikTok and Instagram, the site is disconnected from every audience it builds, and Google has nothing to associate for a brand SERP.
- **Priority / impact:** P4, ~10 minutes of work.
- **Affected:** `Footer.jsx`, `index.html`.
- **Dependencies:** the profile URLs.
- **Acceptance criteria:** footer social row; `sameAs` populated.
- **Status:** **Not Started**

### A-26 — Social share image is a blank white card
- **Original finding:** `/og-image.jpg` is a white device on a white bottle on a white background, cropped so the bottle is cut off. No logo, wordmark, text or colour. At feed thumbnail size it renders as an empty white box, so every share of the site looks broken.
- **Priority / impact:** P4.
- **Affected:** `public/og-image.jpg`, `index.html`.
- **Dependencies:** A-21.
- **Acceptance criteria:** product on a coloured ground with the wordmark and a one-line claim, legible at thumbnail size.
- **Status:** **Not Started**

### A-27 — Smaller metadata issues
- **Original finding:** PDP title "Sponge Hydration Tracker - $59.99 | Sponge Hydration Tracker" duplicates the brand. `og:type` hardcoded to `product` on every page including blog and legal. `og:image` identical everywhere. Obsolete `meta keywords` tag.
- **Priority / impact:** P4.
- **Affected:** `useSEO.jsx`, `index.html`, `ProductDetail.jsx`.
- **Dependencies:** none.
- **Acceptance criteria:** no duplicated brand in titles; correct `og:type` per page; keywords tag deleted.
- **Status:** **Not Started**

### A-28 — Keyword-stuffed SEO prose block
- **Original finding:** A footer block with bolded exact-match phrases written for a 2014 crawler. Human visitors register it as spam.
- **Priority / impact:** P4.
- **Affected:** `Home.jsx`.
- **Dependencies:** none.
- **Acceptance criteria:** replaced with a genuine comparison section that answers a real query.
- **Status:** **Not Started**

---

## P5 — Performance

### A-29 — Images unoptimised for delivery
- **Original finding:** No `srcset`/`sizes` on any of the 11 homepage images, so phones download desktop files. Only one image declares `width`/`height`, leaving the rest able to shift layout. The three step images are 1000×1500 delivered into 345×210 boxes — ~20× the pixels needed, with most of each photo cropped away. `recovery.webp` is 1920×1639 into a 1425×460 band. Mixed JPEG/WebP, no AVIF.
- **Priority / impact:** P5.
- **Affected:** `Home.jsx`, `public/media/**`.
- **Dependencies:** A-21 for replacements.
- **Acceptance criteria:** responsive variants, explicit dimensions on every image, correct crops, AVIF with WebP fallback.
- **Status:** **Not Started**

### A-40 — Hero video is 1.0MB and autoplays
- **Original finding:** Fully downloaded despite `preload="metadata"`, and almost certainly the LCP element. Over 60% of the ~1.6MB page weight.
- **Priority / impact:** P5.
- **Affected:** `Home.jsx`, `public/media/video/`.
- **Dependencies:** A-21.
- **Acceptance criteria:** under 400KB, or a still plus a play affordance on mobile; LCP asset preloaded.
- **Status:** **Not Started**

### A-41 — Render-blocking Google Fonts with six weights
- **Original finding:** Inter loaded from Google Fonts at weights 400–900 via a render-blocking stylesheet. Preconnects are correct but the request is still on the critical path. Also a third-party request that receives every visitor's IP.
- **Priority / impact:** P5. Self-hosting also removes a processor from the privacy policy.
- **Affected:** `index.html`.
- **Dependencies:** none.
- **Acceptance criteria:** two or three weights self-hosted as WOFF2 with `font-display:swap`, primary face preloaded.
- **Status:** **Not Started**

---

## P6 — Visual and content polish

### A-21 — Photography sells a different product than the copy
- **Original finding, in detail:**
  - **Hero video poster** — a scuffed green **Gatorade** squeeze bottle, logo to camera, sitting on a white disc on a **closed laptop** on a kitchen table. Handheld vertical phone footage. The Sponge is ~5% of frame and reads as a coaster.
  - **"Meet Sponge" showcase** — a **soccer ball** is the largest, brightest object; an **Owala** and a **Nalgene** lie on their sides, both logos legible; two Sponge boxes, one upside down with its QR inverted; the tracker is attached to the *ball*. The alt text claims trackers are "clipped onto an Owala and a Nalgene" — factually wrong.
  - **Lifestyle band** — carries a visible **AI-generation sparkle watermark**, plus a **Hydro Flask** (wordmark and logo) and a Nike swoosh, and ghost artifacts where overlaid text was imperfectly removed.
  - **Step 1 "Clip it on"** — a **YETI** tumbler being *set down onto* a puck on a closed MacBook. Nothing is being clipped.
  - **Caregiver persona** — **AI-generated**: malformed fingers on the older woman's hand, unidentifiable objects on the counter, synthetic wood grain. Shows the dock, not the clip. This is the audience least likely to forgive it.
  - **Athlete persona** — two men on a public court, no bottle, **no Sponge visible at all**, Adidas and New Balance in frame.
  - **Working well:** `/media/gallery/g4-on-bottle.jpg` and siblings are genuine studio work — clean, lit, LED ring reading. Weakness: white on white on white gives no sense of thickness, and thickness is the objection a customer actually raised.
  - **Root problem:** the copy sells a magnetic clip-on; every real photograph shows the **Coaster**, which `/products` lists as **Sold out**.
- **Priority / impact:** P6 by band, but the audit's single highest-leverage fix — one afternoon with a camera.
- **Affected:** all homepage media, `/products`, `/caregivers`, `og-image.jpg`.
- **Dependencies:** physical product, a camera, one model.
- **Acceptance criteria — shot list:** (1) the magnetic mechanism, macro; (2) scale/thickness in profile beside a coin; (3) three bottles one tracker, unbranded; (4) the lock moment — a phone with Instagram greyed out beside a half-full bottle, which does not exist and is the only image that would stop a scroll; (5) one real person in real light, replacing all three personas; (6) a new OG card. **Standing rule: no competitor logos, no AI-generated humans, no laptops in frame.**
- **Status:** **User Action Required**
- **Interim mitigation:** the AI-watermarked lifestyle image is flagged for immediate removal (A-42).

### A-42 — AI watermark live on the homepage
- **Original finding:** `/media/lifestyle/recovery.webp` ships with the Gemini generation watermark visible.
- **Priority / impact:** P6 band, but a credibility event for a health brand.
- **Affected:** `Home.jsx`, `public/media/lifestyle/recovery.webp`.
- **Dependencies:** none to remove; A-21 to replace.
- **Acceptance criteria:** watermarked asset no longer served.
- **Status:** **Not Started**

### A-43 — Sold-out Coaster is a dead end
- **Original finding:** Occupies a quarter of the shop grid marked "Sold out" with no way to express interest — and it is the form factor most of the photography shows.
- **Priority / impact:** P6.
- **Affected:** `Products.jsx`, `data.js`.
- **Dependencies:** A-03.
- **Acceptance criteria:** notify-me email field, or hide the SKU.
- **Status:** **Not Started**

### A-44 — Homepage is 22 screens on a phone
- **Original finding:** 14,635px at 390px. The hero alone is 1,468px. The reviews section is 1,698px for four short quotes. Weakest material is front-loaded; App Lock sits at 7,458px, roughly screen eleven.
- **Priority / impact:** P6.
- **Affected:** `Home.jsx`.
- **Dependencies:** A-08.
- **Acceptance criteria:** reordered per A-08; hero compressed to one screen on mobile.
- **Status:** **Not Started**

### A-45 — Typography and copy nits
- **Original finding:** Hyphen used as dash throughout ("Order now - $59.99", "Checkout - $59.99", "Shop the Family Pack - $199.99"). Team page mixes full names with "Dom". Founders photo caption order disagrees with the headshot order below it.
- **Priority / impact:** P6.
- **Affected:** `Home.jsx`, `ProductDetail.jsx`, `Products.jsx`, `Team.jsx`, `Caregivers.jsx`.
- **Dependencies:** none.
- **Acceptance criteria:** en/em dashes correct; names consistent; caption order matches.
- **Status:** **Complete (partial)** — the price-CTA dashes were fixed in `fa116e2` and `492a923`. Team naming and caption order remain **Not Started**.

---

## Health claims and regulatory register

Carried from the audit's claims section. Sponge is a general wellness product and
should stay one; the line it must not cross is claiming to diagnose, treat,
prevent or mitigate disease.

| ID | Statement | Where | Status |
|---|---|---|---|
| A-46 | "Dehydration is one of the most common, and most preventable, reasons older adults end up in the hospital." | `/caregivers` hero | **Not Started** — highest exposure. Unsourced prevention claim about a clinical outcome, aimed at a vulnerable population, on a page selling remote monitoring. Needs a specific peer-reviewed citation, reframing to the condition rather than what Sponge prevents, and a plain "not a medical device" line. |
| A-47 | "Chronic mild dehydration is one of the most common and overlooked health issues" | `/about` | **Not Started** — cite or soften. |
| A-48 | "Most people are dehydrated, and don't even know it" | Homepage | **Not Started** — unsourced and imprecise; the recommended replacement is a behavioural claim needing no citation. |
| A-49 | "Low-hydration alerts — Get notified if they're falling behind" | `/caregivers` | **Not Started** — keep framed as goal tracking, never clinical escalation. |
| A-50 | "Goals adapt to your body, activity, and climate" | Homepage features | **Not Started** — implies an algorithm; state its basis or soften. The app reads activity from no health platform today. |
| A-51 | Pre-order with no stated cancellation right | `/legal/returns` | **Complete** — `fa116e2` added `/legal/pre-order` with an unconditional pre-shipment cancellation right and a 7-business-day refund commitment. |
| A-52 | Compare-at `$79.99` | `/products`, PDP | **Complete** — removed, see A-24. |

---

## What was already working (do not "fix")

Recorded so later passes do not regress them.

- **Server-side rendering** via vite-react-ssg — crawlers get complete HTML.
- **Per-page titles, descriptions and canonicals** on all 20 URLs, genuinely well written. `/cart` and `/404` correctly `noindex`. Valid sitemap referenced from robots.txt. Apex 301s to www.
- **Return policy** is clear and generous: prepaid label, 30 days from delivery.
- **Studio product photography** (`g4-on-bottle.jpg` and siblings).
- **Publishing critical reviews unedited** — rare and admirable; deployed wrongly, but the instinct is right.
- **Shipping engine** — real USPS Ground Advantage retail rates, weight-tiered, mirrored client/server. Do not edit one copy without the other (`.claude/rules/shipping-sync.md`).
- **No horizontal overflow** at 390/768/1440. Skip link, `lang`, one H1 per page, sane heading order, `aria-expanded` on nav and FAQ, `prefers-reduced-motion` handled.
- **TTFB ~400ms**, 17 requests on the homepage.

---

## Change log

| Date | Commit | What |
|---|---|---|
| 2026-08-25 | `fa116e2` → `63938d3` | A-01, A-02, A-35, A-51 — shipping truth, pre-order framing, pre-order policy |
| 2026-08-25 | `492a923` → `eb5220d` | A-24, A-52 — fictitious compare-at removed, bundle maths corrected, category anchor |
| 2026-08-25 | `966f74c` → `7d9d068` | A-04 — GA4 + Meta (browser and CAPI) + TikTok, consent-ready |
| 2026-08-25 | `4b2379f` → `93ee170` | A-30, A-31, A-32, A-39 — consent engine, GPC, policy rewrite, CPRA controls, 44 tests |
| 2026-08-25 | `0daf296` | Temporary beacon diagnostic (removed same day) |
| 2026-08-25 | `b7c497d` | A-33 — Cloudflare beacon classified, claims corrected, 7 tests |
