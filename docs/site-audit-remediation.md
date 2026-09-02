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
| P1 — checkout, tracking, conversion-critical | 7 | 6 | 0 | 2 | 0 |
| P2 — messaging, trust, navigation | 9 | 8 | 0 | 0 | 1 |
| P3 — mobile & accessibility | 7 | 7 | 0 | 0 | 0 |
| P4 — SEO & structured data | 7 | 6 | 0 | 1 | 0 |
| P5 — performance | 3 | 3 | 0 | 0 | 0 |
| P6 — visual & content polish | 8 | 7 | 0 | 1 | 0 |
| **Total** | **49** | **46** | **0** | **3** | **0** |

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
- **Status:** **Complete**
- **Evidence:** commit `ffe24ca`. Labelled `role="radiogroup"` on the PDP above the buy button, defaulting to **white** (the colour almost all the photography shows, and the one the silent default was *not*). Selecting a colour switches the gallery to the matching shot. The choice is passed through to the cart for every clip; multi-clip products stay individually editable there and say so. Production verified: selecting Black updates the label and swaps the main image to `g2-black-vertical.jpg`, and add-to-cart stores `colors:["black"]`.

### A-06 — Cart has no quantity control and no cross-sell
- **Original finding:** Each unit is its own row with "+ Add another"/"Remove"; four trackers produce four rows. No promo field, no payment icons, and **no cross-sell of the $14.99 Magnetic Adhesive 3-Pack**, which is the natural attach product and solves the "swap between bottles" use case the copy already sells.
- **Priority / impact:** P1 (AOV).
- **Affected:** `Cart.jsx`.
- **Dependencies:** A-05.
- **Acceptance criteria:** identical colours grouped with a quantity stepper; 3-Pack offered as a one-tap add-on.
- **Status:** **Complete**
- **Evidence:** commit `ffe24ca`. Units sharing a product **and** a colour combination collapse into one row with a quantity stepper; changing a colour on a grouped row applies to every unit in it so the group stays one row. The $14.99 Magnetic Adhesive 3-Pack is offered as a one-tap add-on, shown only when a clip is in the cart and no adhesive is. Verified locally with a mixed cart (1 white + 3 black → **two** rows, $59.99 and $179.97, shipping $15.10) and in production (2 black → one row, qty 2, $119.98, total $131.33). The existing Family Pack upsell is unaffected and now correctly reads "save $39.97" after A-24.

### A-07 — Redundant `/checkout` interstitial
- **Original finding:** `/cart → /checkout → Stripe`. The middle page repeats the summary and adds a click at peak intent, offering nothing the cart did not.
- **Priority / impact:** P1 (minor, but free).
- **Affected:** `Checkout.jsx`.
- **Dependencies:** A-03 — the page becomes worth keeping if it captures email.
- **Acceptance criteria:** either go straight to Stripe, or the interstitial earns itself with email capture and express-wallet signalling.
- **Status:** **Complete**
- **Evidence:** resolved by keeping the page and making it earn its place rather than removing it. Commit `4768306` put email capture on `/checkout` before the Stripe redirect — the placement that makes an abandoned checkout recoverable, which is worth more than the click it costs. Verified in production.
- **Deliberately not done:** express-wallet signalling ("Apple Pay / Google Pay available"). Which wallets are actually enabled is a Stripe dashboard fact I cannot read, and advertising a payment method that then does not appear is worse than saying nothing. Add it once the enabled wallets are confirmed.

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
- **Status:** **Complete (partial)** — three of five answered; two need real measurements
- **Evidence:** commit `eb2f2fc`. A four-way comparison table (reminder app / smart bottle / clip-on reminder / Sponge) plus an objection block answering: retention ("I'll stop using it after a month" → that is what App Lock is for), the price gap against a cheaper reminder clip (which explicitly says buy the cheaper thing if a blinking light is enough), the dateless pre-order, and bottle compatibility. Live on the homepage.
- **Update 2026-08-26 (`9ffa8e9`):** the **Apple Health** objection is now answered — it was the single most-requested thing in our own published reviews (two of four reviewers asked for it by name) and the site said nothing. It is now an FAQ answer, a feature card, a comparison-table row and a trust-bar stat. Four of five objections answered.
- **Outstanding, and deliberately not faked:** the accuracy figure (A-10) and the device's real dimensions. Both are hardware measurements. Publishing invented numbers for a measurement device is the one thing worse than staying silent.

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
- **Status:** **Complete**
- **Evidence:** commit `9ffa8e9`. Nathan supplied the records 2026-08-26: **~80 Clip orders** (65 shipped, 15 outstanding) plus **~40 Coasters** shipped historically = **~105 products shipped of ~120 ordered**. The old claim was wrong twice — it counted *products* as *customers*, and it implied everything had shipped. Now **"100+ Sponge products shipped"**, which those figures support and which claims neither unique purchasers nor full fulfilment. The closing CTA was corrected to match. Verified live; zero occurrences of "120+" remain sitewide.

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
- **Status:** **Complete (partial)**
- **Evidence:** commit `eb2f2fc` links the comparison post from the new homepage comparison section — it was the highest-intent asset on the site and nothing pointed at it. Commit `b28607f` adds BlogPosting + BreadcrumbList schema, attributed to the organisation.
- **Outstanding:** per-author bylines (naming a specific author is a business fact, not mine to assign) and citations on the health claims in the posts, which need real sources. Publishing cadence is a business decision.

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
- **Status:** **Complete**
- **Evidence:** commit `3fcdc6f`. `StickyBuyBar.jsx` appears below 620px — exactly where `.header__order` is hidden — after roughly one viewport of scrolling, showing the product, "$59.99 + shipping & tax · Pre-order" and one filled CTA. Suppressed on `/cart`, `/checkout`, `/account`, `/dashboard`, `/order-status`, `/404`, and while the consent banner is up (also bottom-fixed; z-index 55 sits below its 60). On a PDP it anchors back to the buy controls via a new `id="buy"`. Production verified at 390px: hidden at top, shown after scroll, 48px CTA, no overflow.

### A-17 — Four WCAG contrast failures
- **Original finding:** `.trust__lbl` 3.88:1 (needs 4.5), `.tcard__who span` 4.15:1, `.stars` 2.03:1 (needs 3:1 for non-text), persona card body ~2.1:1 where white sits on the aqua end of the brand gradient.
- **Priority / impact:** P3.
- **Affected:** `index.css`.
- **Dependencies:** none.
- **Acceptance criteria:** all four ≥ the required ratio, measured.
- **Status:** **Complete**
- **Evidence:** commit `0de4008`. Measured before → after, in production: trust-bar labels **3.88 → 7.48:1**; review attribution **4.15 → 7.99:1**; star glyphs **2.03 → 4.87:1**; persona card body **~2.1 → 4.72:1**. The persona cards were the interesting one — white over `--grad-brand` passes at the blue end and fails at the aqua end, so the gradient now runs to a darker teal and the body text is full white rather than 90%. **The worst point on a gradient is what has to pass, not the average.**

### A-18 — Star ratings distinguished by colour alone
- **Original finding:** A 4-star review renders five glyphs with the fifth in `--line` (#e4ecf2), effectively invisible. Text extraction returns `★★★★★` for all four reviews regardless of score. Fails **WCAG 1.4.1 Use of Color**, and sighted users cannot reliably tell 4 from 5 either.
- **Priority / impact:** P3.
- **Affected:** `Reviews.jsx`, `index.css`.
- **Dependencies:** none.
- **Acceptance criteria:** outlined empty state, fill ≥3:1, numeric rating shown alongside.
- **Status:** **Complete**
- **Evidence:** commit `0de4008`. Empty stars are now outlined (`☆`) so the difference is carried by **shape**, not hue, and the numeric value is printed alongside. Fill darkened to clear 3:1 (4.87:1 measured). Production now renders `★★★★☆ 4.0` and `★★★★★ 5.0` — previously every review extracted as five filled stars regardless of score.

### A-19 — A visible headline hidden from screen readers
- **Original finding:** `<section class="lifestyle-band" aria-hidden="true">` wraps the decorative photo **and** the visible 32px quote "Hydration that keeps up with you, on the court, at the desk, everywhere."
- **Priority / impact:** P3.
- **Affected:** `Home.jsx`.
- **Dependencies:** none.
- **Acceptance criteria:** `aria-hidden` moved to the `<img>` only; text exposed.
- **Status:** **Complete**
- **Evidence:** commit `0de4008`. `aria-hidden` now sits on the decorative `<img>`; the section and its visible headline are exposed. Production HTML confirms `class="lifestyle-band"` with no `aria-hidden` on the section.

### A-20 — Non-descriptive labels and an uncaptioned video
- **Original finding:** Gallery thumbnails labelled "View image 1"–"View image 6". FAQ buttons set `aria-expanded` but no `aria-controls`, and answer panels have no `id`. The app-demo video on `/how-it-works` has no `<track>` captions and no title — a WCAG 1.2.2 failure if it carries narration, and commercially relevant since social-referred visitors watch muted.
- **Priority / impact:** P3.
- **Affected:** `ProductDetail.jsx`, `HowItWorks.jsx`.
- **Dependencies:** captions require the video's audio content.
- **Acceptance criteria:** descriptive thumbnail labels, `aria-controls` wired, video titled and captioned.
- **Status:** **Complete (partial)** — captions remain outstanding
- **Evidence:** commit `0de4008`. Gallery thumbnails now describe the actual shot ("Side profile, showing thickness", "Close-up of the status light and USB-C port", …) instead of "View image 3", and the active one carries `aria-current`. FAQ buttons gained `aria-controls`; panels gained an `id` and a labelled region role. The setup video gained a `title` and in-band fallback text.
- **Outstanding:** a `<track>` caption file. A caption must transcribe the real audio, which has to come from the source video — writing one from guesswork would be fabricating content. **User action:** supply a transcript (or confirm the video is silent, in which case the existing caption text is sufficient and this closes).

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
- **Status:** **Complete**
- **Evidence:** commit `b28607f`. Root cause: all three blocks were hardcoded in `index.html`, which vite-react-ssg uses as the template for every route. Product and FAQPage removed from the template; `<Seo>` gained a `jsonLd` prop so schema lives with the content it describes. FAQPage is generated from the same `faqs` array the page renders, so markup cannot drift from visible content. **Live verification** — `/`, `/about`, `/blog`, `/reviews`, `/legal/privacy`: Organization only. `/how-it-works`: + FAQPage. `/shop/p/sponge-clip`: + Product, Offer, BreadcrumbList, MerchantReturnPolicy. `/blog/signs-of-dehydration`: + BlogPosting, BreadcrumbList. 10 new tests assert this against the **built** output, since that is what Google crawls.

### A-23 — Product schema thin and availability wrong
- **Original finding:** Missing `sku`, `gtin`, `priceValidUntil`, `shippingDetails`, `hasMerchantReturnPolicy` and — most valuable — `aggregateRating` despite four on-page reviews. `offers.url` points at the homepage on every page.
- **Priority / impact:** P4.
- **Affected:** `index.html`.
- **Dependencies:** A-22, A-12 (aggregate rating needs real reviews).
- **Acceptance criteria:** per-product schema with correct URL and availability; rating added once real.
- **Status:** **Complete (partial)** — everything except aggregateRating
- **Evidence:** commit `b28607f`. Each product now carries its own `sku`, its own gallery images, an offer URL pointing at **that product** (previously every product's offer pointed at the homepage), availability that switches to `SoldOut` for sold-out SKUs, and a `MerchantReturnPolicy` matching the published 30-day free-return terms.
- **Outstanding:** `aggregateRating`. Four reviews exist and the review API is still unconfigured (A-13), so any figure would be unsubstantiated. A test asserts it is absent so it cannot be added carelessly; add it once real reviews flow.

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
- **Status:** **Complete**
- **Evidence:** commit `d5bdf7c`. Rebuilt at 1200×630 from the real desk photograph — a Sponge-branded bottle as the subject — with a scrim carrying "Tracks every sip. Locks your apps." and the domain and price, both legible at thumbnail size. Adds `og:image:width`/`height` and corrects the alt text, which described a different image entirely. Live: 118,519 bytes, 1200×630.
- **Note:** composed from an existing real asset, not designed. A purpose-shot card remains part of A-21.

### A-27 — Smaller metadata issues
- **Original finding:** PDP title "Sponge Hydration Tracker - $59.99 | Sponge Hydration Tracker" duplicates the brand. `og:type` hardcoded to `product` on every page including blog and legal. `og:image` identical everywhere. Obsolete `meta keywords` tag.
- **Priority / impact:** P4.
- **Affected:** `useSEO.jsx`, `index.html`, `ProductDetail.jsx`.
- **Dependencies:** none.
- **Acceptance criteria:** no duplicated brand in titles; correct `og:type` per page; keywords tag deleted.
- **Status:** **Complete**
- **Evidence:** commit `b28607f`. PDP title no longer repeats the brand ("Sponge Hydration Tracker — $59.99 | Sponge"). `og:type` is per-page and verified live: `website` on the homepage, `product` on PDPs, `article` on blog posts. The keywords meta tag is gone. **Note for future editors:** the removal comment originally contained literal tag syntax, and the build re-serialized it into a real empty `meta` element — do not write tag syntax inside comments in `index.html`.

### A-28 — Keyword-stuffed SEO prose block
- **Original finding:** A footer block with bolded exact-match phrases written for a 2014 crawler. Human visitors register it as spam.
- **Priority / impact:** P4.
- **Affected:** `Home.jsx`.
- **Dependencies:** none.
- **Acceptance criteria:** replaced with a genuine comparison section that answers a real query.
- **Status:** **Complete**
- **Evidence:** commit `eb2f2fc`. The three bolded keyword paragraphs are gone, replaced by a real comparison table across cost, keeping your own bottle, whether it measures anything, what it does when you fall behind, and month-one survival. It is a real `<table>` with scoped headers and a caption, marks the Sponge column by **shape** (✓ / ·) as well as tint so it does not depend on colour, and scrolls inside its own container so the page never scrolls sideways. Verified live at 390px and desktop.

---

## P5 — Performance

### A-29 — Images unoptimised for delivery
- **Original finding:** No `srcset`/`sizes` on any of the 11 homepage images, so phones download desktop files. Only one image declares `width`/`height`, leaving the rest able to shift layout. The three step images are 1000×1500 delivered into 345×210 boxes — ~20× the pixels needed, with most of each photo cropped away. `recovery.webp` is 1920×1639 into a 1425×460 band. Mixed JPEG/WebP, no AVIF.
- **Priority / impact:** P5.
- **Affected:** `Home.jsx`, `public/media/**`.
- **Dependencies:** A-21 for replacements.
- **Acceptance criteria:** responsive variants, explicit dimensions on every image, correct crops, AVIF with WebP fallback.
- **Status:** **Complete (partial)**
- **Evidence:** commit `62a5a02`. All eleven homepage images now declare intrinsic `width`/`height` (only one did), plus `decoding="async"`, with `loading="lazy"` retained below the fold — that removes the layout-shift risk. Re-sized the five images paying for pixels nobody sees, each to 2× its CSS box: **455,835 → 271,912 bytes (−40%)**. Resized preserving aspect rather than pre-cropping, because the step images are framed with `object-position` and a pre-crop would silently have moved what each one shows.
- **Deliberately left alone:** `showcase-centered.webp` (800×936 into a 560×655 box is already *below* 2×; shrinking it would make it soft) and `applock.webp` (600×1208 into 300×604 — exactly 2×). Not every large file is an oversized one.
- **Outstanding:** `srcset`/`sizes` and AVIF. Both need a build-time image pipeline to be worth it; hand-maintained variants would rot. Lower value now that the raw sizes are right.

### A-40 — Hero video is 1.0MB and autoplays
- **Original finding:** Fully downloaded despite `preload="metadata"`, and almost certainly the LCP element. Over 60% of the ~1.6MB page weight.
- **Priority / impact:** P5.
- **Affected:** `Home.jsx`, `public/media/video/`.
- **Dependencies:** A-21.
- **Acceptance criteria:** under 400KB, or a still plus a play affordance on mobile; LCP asset preloaded.
- **Status:** **Complete**
- **Evidence:** commit `d5bdf7c`. Re-encoded 720×1280/30fps/~910kbps → 540×960/24fps/CRF 30 with faststart: **1,017KB → 372KB, −63%**, verified live. It renders at 360 CSS px, so the source was roughly 2× larger than it needed to be in both dimensions and framerate. Quality was checked frame-by-frame at render size before shipping rather than assumed.

### A-41 — Render-blocking Google Fonts with six weights
- **Original finding:** Inter loaded from Google Fonts at weights 400–900 via a render-blocking stylesheet. Preconnects are correct but the request is still on the critical path. Also a third-party request that receives every visitor's IP.
- **Priority / impact:** P5. Self-hosting also removes a processor from the privacy policy.
- **Affected:** `index.html`.
- **Dependencies:** none.
- **Acceptance criteria:** two or three weights self-hosted as WOFF2 with `font-display:swap`, primary face preloaded.
- **Status:** **Complete**
- **Evidence:** commit `8550f7c`. Inter ships as a **variable** font, so rather than the planned two or three static weights, one 48KB WOFF2 covers the whole 400–900 axis — a single same-origin preloaded request replacing a render-blocking cross-origin stylesheet **and** the six font files it discovered. `font-display: swap`. Verified live: **zero** requests to fonts.googleapis.com or fonts.gstatic.com, one `@font-face` resolved, weight 900 rendering.
- **Privacy consequence, actioned:** Google Fonts received every visitor's IP on every page load purely to serve type. It is out of the request path and **removed from the processor list in the privacy policy**. CLAUDE.md records that re-adding a hosted font means putting the processor back. SIL OFL 1.1 licence ships alongside the font as required.

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
- **Status:** **User Action Required** — but substantially reduced, see below
- **Audit of the full library, 2026-08-26:** `assets/photos/` holds 38 edited device shots, 50 raw, 9 app screenshots, packaging and founders. Findings:
  - **Three strong assets were sitting unused** while the site showed weaker or misleading substitutes: the **Hydration Locks** settings screen, the **"SOCIAL APPS LOCKED"** lock screen, and a **real iPhone home screen with the Sponge widget**. The lock screen is the "lock moment" I had previously recorded as not existing. It existed. All three are now live.
  - **The black Clip on a white bottle** (`2026-03-08_…closeup-of-sponge-clip-on-bottle`) is the most legible product shot we own — the white-on-white gallery makes the product nearly invisible. It is now the hero still and the Step 1 image.
  - **Retire:** the `edited/` lifestyle composites (`sponge-on-desk` and that generative batch) are AI — visible texture tears, garbled "OWA…" logo text, mush backgrounds. `full-bottle-no-hand` has a half-erased Owala logo. Do not use.
  - **`gym.jpg` / `track.jpg`** contain no product at all — the same flaw as the athlete persona. Not substitutes for anything.
- **Substitutions made without new photography:** hero still, Step 1, App Lock screen, the new "On your phone" section, the OG card (A-26) and the lifestyle band (A-42).
- **Reworked 2026-08-27 (`f62e137`, `5224d27`) after Nathan rejected the first pass.** Two mistakes, both mine: I never opened `assets/videos/` at all, and I let `object-fit` choose the framing instead of cropping to the subject myself. Measured, the how-it-works steps were discarding **146%** and **192%** of their images and the lifestyle band **175%**. Every image is now authored at its container's aspect, so `object-fit` has nothing left to decide — the steps crop **0–1%**. The video library also turned out to hold the two best assets on the site: the studio film of the black Clip now in the hero, and the tutorial frame showing it attached to a bottle base.
- **The lifestyle band needed the same treatment twice.** It was authored at 2.258 but renders as wide as **4.17** (it is full-bleed, and its height clamps at 460px), so it always cropped vertically — and `object-position: center 25%` pulled that crop upward and sliced the Clip off the bottom edge. Rebuilt at 2.756 and verified at **both** extremes of the range rather than one: the Clip and its lit LED survive 1.39 through 4.17. The band quote ran to 720px, which put its right edge over the bottle, so it is pulled in to 520px.
- **Persona photos replaced 2026-08-27 (`cfb8545`).** These were the last bad images on the homepage, and each failed differently:
  - **athlete** — a real photo of two people on a court with **no product in it at all**.
  - **professional** — the *same* kitchen frame already used by the lifestyle band, cropped so the Clip at the bottle's base was out of shot. A duplicate that also failed to show the device.
  - **caregiver** — **AI-generated**: a generic white tumbler standing on a white disc, with the usual giveaways in the hands. It depicted a product we do not sell in that form and staged a caregiving scene that never happened.
  All three were authored at 700×526 for a card that renders at 2:1, hence the 50% crop.
- **What replaced them,** all real frames from our own footage in `assets/videos/playable`, one per persona: the athlete cut (an outdoor court, a basketball, and an Owala and a Nalgene each wearing a black Clip on its base); the office cut (a laptop, a Nalgene with the Clip at its base, and a phone showing 52.3 oz logged and connected — product, app and context in one frame); and the gift cut (a hand holding the Clip on a kitchen counter beside a Sponge-branded bottle). No identifiable faces in any of the three, and each crop was **placed to exclude** the burned-in social captions rather than blurring or painting over them.
- **Authored at 740×370** — the card's widest rendered aspect (349×175) at 2×. Desktop now crops **0%** instead of 50%, and narrower breakpoints only trim the sides, where each subject is already centred. The leftover `objectPosition` nudge on the professional card is gone.
- **Homepage imagery is now clean:** every image crops 0%, none is broken, and **nothing is over 25%**. Verified live.
- **Still outstanding here:** the shot list items that need a camera rather than an edit — the App Lock moment on real hardware, a scale/thickness shot, a three-bottles shot, one real person with the product, and an Apple Health screen capture. The hero video item is closed (A-54).
- **Still required:** the shot list issued 2026-08-26, minus the hero video, which is now closed (A-54) — the App Lock moment on real hardware, scale/thickness, three-bottles, one real person, and an Apple Health screen capture (no screenshot of it exists in the library).

### A-42 — AI watermark live on the homepage
- **Original finding:** `/media/lifestyle/recovery.webp` ships with the Gemini generation watermark visible.
- **Priority / impact:** P6 band, but a credibility event for a health brand.
- **Affected:** `Home.jsx`, `public/media/lifestyle/recovery.webp`.
- **Dependencies:** none to remove; A-21 to replace.
- **Acceptance criteria:** watermarked asset no longer served.
- **Status:** **Complete**
- **Evidence:** commit `df917ad`. `recovery.webp` is deleted from `public/`, not merely unreferenced. Replaced with `desk.jpg` — a **real** photograph of a Sponge-branded Nalgene with the tracker lit at its base, so the band now shows our own product and branding instead of a Hydro Flask and an AI watermark. `gym.jpg` and `track.jpg` were rejected: they contain no product at all, the same flaw as the athlete persona.
- **Live check:** origin returns **404** for the deleted file (confirmed with a cache-busted request). The edge briefly still served a cached copy under a 4-hour TTL, which expires on its own; a Cloudflare cache purge would clear it immediately. No page references it.

### A-43 — Sold-out Coaster is a dead end
- **Original finding:** Occupies a quarter of the shop grid marked "Sold out" with no way to express interest — and it is the form factor most of the photography shows.
- **Priority / impact:** P6.
- **Affected:** `Products.jsx`, `data.js`.
- **Dependencies:** A-03.
- **Acceptance criteria:** notify-me email field, or hide the SKU.
- **Status:** **Complete**
- **Evidence:** commit `4768306`. The sold-out product page now carries a notify-me signup ("Email me when the Sponge Coaster is back") writing to the same subscriber list, so demonstrated interest is captured instead of dead-ending. The shop grid routes to it via Details.

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
- **Status:** **Complete (partial)** — one item needs Nathan
- **Evidence:** price-CTA dashes fixed in `fa116e2` and `492a923`; a site-wide sweep now finds no hyphen used as a dash in user-facing copy. Team names are already full names everywhere — no bare "Dom" anywhere in `src/`.
- **Outstanding (User Action):** the founders photo caption reads "Christopher Miglio and Nathan Katzaroff" while the headshot cards order Nathan → Chris → Dom. Aligning them by editing the caption would misidentify who is actually on the left in that photograph. **Only Nathan can say which order the photo shows.**

---

## Health claims and regulatory register

Carried from the audit's claims section. Sponge is a general wellness product and
should stay one; the line it must not cross is claiming to diagnose, treat,
prevent or mitigate disease.

| ID | Statement | Where | Status |
|---|---|---|---|
| A-46 | "Dehydration is one of the most common, and most preventable, reasons older adults end up in the hospital." | `/caregivers` hero | **Complete** — commit `2770a1e`. **The claim was not merely uncited, it was wrong.** In the HOOP cohort dehydration was present in 8.9% of older emergency admissions and was the *primary* cause in **0.6%** — not a leading cause of admission. Removed rather than footnoted. Replaced with what the evidence does support: it is common, easy to miss, and older people admitted dehydrated do measurably worse (30-day mortality **17% vs 7%**), cited to *Age and Ageing* vol. 44 no. 6 (2015) with a link. The citation states what it is being used for **and what it is not**. A general-wellness disclaimer was added to the hero. |
| A-47 | "Chronic mild dehydration is one of the most common and overlooked health issues" | `/about` | **Complete** — `2770a1e`. Replaced with a behavioural claim needing no citation. |
| A-48 | "Most people are dehydrated, and don't even know it" | Homepage | **Complete** — `2770a1e`. Now "You already know you should drink more water" — self-evidently true, needs no source, and a stronger setup for App Lock. |
| A-49 | "Low-hydration alerts — Get notified if they're falling behind" | `/caregivers` | **Complete** — `2770a1e`. Renamed "Behind-goal alerts"; the copy now says outright that it tracks drinking, not health, and won't tell you anything clinical. The old name implied a clinical reading of hydration status on a page selling monitoring for a vulnerable group. |
| A-50 | "Goals adapt to your body, activity, and climate" | Homepage features, `/blog/how-much-water-should-you-drink`, product features | **Complete, and now correctly scoped 2026-08-28 (`ledger13`).** Nathan confirmed the app **does recommend a personalized goal at sign-up, derived from information the user shares**. That is a real feature and is now stated on the product page and in a new FAQ. What remains retired is the different and stronger claim that goals **adapt over time** to body, activity and climate — he has never confirmed that, and the new FAQ says outright that the goal stays where you set it. The distinction is the whole point of this entry: a personalized *starting recommendation* is not adaptive personalization. Earlier history — `2770a1e`, `9ffa8e9`, `f2cb31d`. **It was only Complete on the homepage.** The blog post still told readers Sponge "learns your patterns over time, then sets a personalized daily goal that reflects what your body actually needs", and its excerpt promised a target fitting "your body, activity, and climate" — the exact claim Nathan declined to confirm. It survived because the audit swept pages, not `data.js`. Removed 2026-08-28; verified absent across the homepage and all three posts. Nathan reviewed and **did not confirm** automatic adaptation, so the claim stays retired rather than restored. The card was removed entirely and its slot reassigned to Apple Health. The original rationale ("no health-platform integrations") is now outdated — see A-56 — but the conclusion stands on Nathan's own answer. |
| A-60 | "The world's first universal automatic water tracking device" | **Hero video, burned in** | **Complete** — `83075a4`. An unverified superlative that no copy review could ever have caught: it was not in `data.js` or any page, only inside the `0827.mp4` caption track. Removed by switching to the `0827(2)` cut, which keeps the instructional captions and drops the claim sequence. **This is the finding that motivated a full re-sweep — see A-61.** |
| A-61 | Sitewide claim sweep after A-60 | All 27 rendered pages, plus media carrying text | **Complete** — `394c1b6`. Three corrected: **"Personalized daily hydration goals"** (A-50 for the third time — homepage fixed in `2770a1e`, blog in `f2cb31d`, this survived on `/products` and the PDP; now "Daily goal you set, tracked automatically"); **"measure exactly how much you drank"** (an absolute accuracy claim while A-10 is open precisely because the figure is unquantified; now "work out how much you drank"); **"accurate, automatic intake data you can trust"** (same problem, softer wording). Verified and left alone: the `$80` smart-bottle comparison (checked against the HidrateSpark store — PRO 21 oz **$79.99**, 32 oz **$84.99**), the bundle arithmetic, the OG card, `app-demo.mp4` (no burned-in captions), and every "cure/treat/prevent" hit, all of which are disclaimer wording. |
| A-62 | Hardware and component specs asserted without a source | `/shop/p/magnetic-adhesive-3-pack`, setup explainer, sitewide | **Mostly resolved 2026-08-28 — Nathan confirmed the 3M adhesive, the 8-day battery, and that the device uses a load cell and an accelerometer plus a non-trivial algorithm.** Those three now stand on his confirmation. **Still open: the "Three 60mm magnetic mounts" and "Ultra-thin 0.7mm profile" dimensions, which he did not address.** The word "precise" was dropped from the weight-reading copy regardless — the hardware is confirmed, the precision was never quantified. Original finding: — these cannot be checked from the repo and were **not** invented by remediation; they predate it. Nathan needs to confirm each: **"Strong 3M adhesive backing"** names a specific manufacturer, and if the tape is not actually 3M this is a false statement about a third party's trademark; **"Three 60mm magnetic mounts"** and **"Ultra-thin 0.7mm profile"** are exact dimensions — note the tension that the Clip's *own* dimensions are still recorded as unknown (A-09) while the accessory carries specs to a tenth of a millimetre; **"load cells and an accelerometer"** describes the sensing hardware; **"8-day battery"** appears in nine places and is load-bearing for the comparison table. |
| A-51 | Pre-order with no stated cancellation right | `/legal/returns` | **Complete** — `fa116e2`. |
| A-52 | Compare-at `$79.99` | `/products`, PDP | **Complete** — removed, see A-24. |


---

## Findings raised during remediation

### A-53 — Autoplaying hero video had no way to stop it
- **Original finding:** Raised 2026-08-26 while compressing the hero video. It autoplays, loops and runs ~9 seconds, which WCAG **2.2.2 Pause, Stop, Hide** treats as moving content that starts automatically and lasts more than five seconds. There was no mechanism to stop it, and `prefers-reduced-motion` was handled in CSS for animations but did nothing about the video.
- **Priority / impact:** P3 (accessibility), also a data cost on cellular.
- **Affected:** `Home.jsx`, `index.css`.
- **Acceptance criteria:** reduced-motion users never get motion; everyone else can stop it.
- **Status:** **Complete**
- **Evidence:** commit `d5bdf7c`. `prefers-reduced-motion` now renders the poster frame instead, and the video file is never fetched. Everyone else gets a pause/play control. Both paths verified in the browser: with the media query stubbed, no `<video>` element is created at all.

### A-59 — Blog posts were thin and carried unsourced health claims
- **Original finding:** Raised by Nathan 2026-08-28 ("make the blogs read longer and have good content and research backed material"). The three posts ran about **150 words each** — three paragraphs, no headings, no citations — and asserted physiological claims with nothing behind them. One also carried the retired A-50 claim (see above).
- **Priority / impact:** P2. These pages exist to earn organic search traffic on hydration questions; at 150 words with no sources they neither rank nor persuade, and the health assertions carried regulatory risk on a wellness product.
- **Affected:** `data.js` (`blogPosts`), `BlogPost.jsx`, `index.css`.
- **Acceptance criteria:** substantially longer, every factual claim traceable to a checked source, health claims carrying the general-wellness caveat, and nothing asserted that the evidence does not support.
- **Status:** **Complete**
- **Evidence:** commit `f2cb31d`. Now **872 / 797 / 643 words** with **7 citations**, all URLs verified live. Sources: Valtin (*Am J Physiol* 2002) on the 8×8 myth and its 1945 Food and Nutrition Board origin; the National Academies 2004 adequate intakes (3.7 L / 2.7 L **total** water, ~20% from food, medians rather than thresholds); Armstrong (*J Nutr* 2012, −1.36% body mass) and Ganio (*Br J Nutr* 2011, −1.59%) on mood and perceived effort; thirst thresholds (~0.5% in daily activity, 1–2% under exercise-heat stress); and a meta-review of self-monitoring for the behavioural argument.
- **Claims removed rather than dressed up:** the "half an ounce to one ounce per pound" formula (no authority uses it, and it can double its own answer); "by the time you feel thirsty you are already behind" (overstates the physiology — thirst is reasonably sensitive, it is just easy to ignore, and it blunts with age); the promise of "7 signs" (only four replicate across both studies, so the post is retitled); and the framing of the Connecticut studies as proof of "brain fog" — what moved was mood and perceived effort, while objective cognitive scores largely did not.
- **Named as weakly evidenced, on the page:** dry skin, sugar cravings, and the widely-repeated "2% loss costs 20% of focus" figure, which traces to no such study.
- **Also:** the comparison post now states the clip-on's own downsides (a second thing to charge, an adhesive mount, blindness to a glass poured from the tap) and quotes **no competitor prices**, since those move. Read times were corrected — they claimed 5–7 minutes for 150-word posts.
- **Renderer:** `BlogPost.jsx` now supports headings, lists, the wellness note and a numbered source list; body entries may be blocks as well as plain strings.

### A-58 — The hero copy ran edge-to-edge on every viewport below the max-width
- **Original finding:** Found 2026-08-27 while measuring the hero for the background video. `.hero__grid` also carries the `.container` class, and its `padding` **shorthand** overrode `.container`'s `padding: 0 24px` — same specificity, later in the file — zeroing the horizontal gutter. Above the max-width the container's own centring hid it, which is why it survived review; below it the hero copy touched both screen edges. On a phone the eyebrow pill ran from edge to edge.
- **Priority / impact:** P3. Long-standing, affected every phone and tablet, and made the hero look broken on exactly the viewports most visitors use.
- **Affected:** `index.css` `.hero__grid`; homepage hero at every width below `--maxw`.
- **Acceptance criteria:** the hero copy keeps the same 24px gutter as every other section at all widths.
- **Status:** **Complete**
- **Evidence:** commit `5224d27`. Padding restored to `72px 24px 84px`. Verified live: computed `padding-left`/`padding-right` both report **24px**, and checked visually at 390, 768, 940, 1280, 1440 and 1920.

### A-57 — width/height attributes stretched images that had no CSS height
- **Update 2026-08-27 (`5224d27`):** the regression guard pinned `.hero__video`, the inset 9/16 phone frame, which no longer exists now that the hero is a full-bleed background. The guard **moved rather than being deleted**, and the risk it covers is now higher, not lower: the reduced-motion still carries `width="1920" height="1080"` attributes while serving a **720×1200 portrait** file below 940px, so the hints disagree with the real file on every phone. It does not stretch only because the rule pins both dimensions and `object-fit: cover`. Three tests now assert exactly that.
- **Original finding:** Reported by Nathan 2026-08-26 — the Hydration Locks screenshot rendered visibly distorted. **A regression I introduced in `62a5a02`** while adding width/height attributes for layout stability (A-29).
- **Cause:** browsers apply an `<img>` element's width **and** height attributes as *presentational hints*. `.appshot` sets `width: min(300px, 78%)` and no height, so the 600×1066 screenshot was forced to 300×**1066** — aspect 0.281 against a natural 0.563, exactly 2× too tall. Worse, a presentational height is a **definite** height, so it also silently overrode `aspect-ratio` on `.hero__video`: the hero still was laid out 328×798 instead of 328×582, hidden by `object-fit: cover` cropping rather than visibly stretching.
- **Priority / impact:** P6 visually, but it degraded the section carrying the strongest product story.
- **Affected:** `src/index.css` base `img` rule; every image with dimension attributes whose CSS set only a width.
- **Acceptance criteria:** no image whose `object-fit` is `fill` differs from its natural aspect; images that set their own height keep it.
- **Status:** **Complete**
- **Evidence:** commit `634f7ff`. `height: auto` added to the base `img` rule — element specificity (0,0,1) loses to every class rule, so `.step__img`, `.persona__img`, `.lifestyle-band img` and the logos keep their deliberate heights. Verified **in production** by measuring every image with lazy loading forced on: **0 distorted**; hydration-locks 0.563 = 0.563, widget 0.460 = 0.460, lock-screen 1.000 = 1.000, showcase 0.855 = 0.855. Also checked the PDP and /how-it-works. `test/image-aspect.test.js` (7 tests) pins the fix. 95 tests.

### A-56 — Apple Health sync and the iPhone widget were missing from the site
- **Original finding:** Raised by Nathan 2026-08-26. The current app **writes hydration into Apple Health** and ships an **iPhone home-screen widget**. Neither appeared anywhere on the website. The audit had recorded the *absence* of health-platform integrations as a competitive weakness (A-09) and as grounds for deprioritising athletes — both based on an outdated picture.
- **Priority / impact:** P2. Apple Health was the single most-requested thing in the site's own published reviews, and the one place HidrateSpark was genuinely ahead.
- **Affected:** `Home.jsx` features, comparison table and trust bar; `data.js` FAQ.
- **Acceptance criteria:** both capabilities presented accurately, evidenced where evidence exists, and reflected in the competitive comparison.
- **Status:** **Complete**
- **Evidence:** commit `9ffa8e9`. Apple Health is a feature card, an FAQ answer, a comparison-table row and a trust-bar stat replacing the non-stat "Any / Water bottle". The widget is a feature card plus a new **"On your phone"** section built on the real home-screen screenshot. Verified live.
- **Deliberately not claimed:** nothing about *how* the sync behaves beyond writing intake, and no Apple Health screenshot — none exists in the library. Requested in the shot list.

### A-55 — Six pages had no h1 at all
- **Original finding:** Raised 2026-08-26 in the final audit pass. `/products`, `/how-it-works`, `/blog`, `/team`, `/contact` and `/reviews` each used `SectionHead` as their page title, and `SectionHead` has always rendered an `h2`. Those six documents began their outline at level 2 with **no h1**, which loses an SEO signal and breaks heading navigation for assistive tech (WCAG 1.3.1).
- **Priority / impact:** P3/P4.
- **Affected:** `bits.jsx`, the six pages, `index.css`.
- **Acceptance criteria:** exactly one h1 on every indexable page, visually unchanged.
- **Status:** **Complete**
- **Evidence:** commit `8d49d4b`. `SectionHead` gained an `as` prop defaulting to `h2`, so every mid-page use is untouched; the six page-title uses pass `as="h1"`. Home deliberately unchanged — it already has a hero h1 and its SectionHeads are genuine sections. The stylesheet only targeted `.section-head h2`, so the new h1s would have rendered unstyled; it now targets both. Verified live: exactly one h1 on all 11 pages checked. A test asserts this across 13 built pages.

### A-54 final — the hero plays Sponge’s own promo
- **2026-08-27, `28f3838`.** Nathan supplied `assets/videos/raw/2026-06-30-shoot/cut videos water bottle b-roll/0827.mp4` — the finished promo: 24.2s, 1080×1920, burned-in captions reading *"Introducing Sponge / the world's first universal automatic water tracking device / simply attach your adhesive / and snap on your Sponge"*, closing on studio shots of the black Clip. It replaces the six-shot film assembled from b-roll; their own edit with their own script beats anything cut from offcuts.
- **Portrait, so the panel is 9:16 capped at 330px wide** — at full column width a 9:16 panel would stand 985px tall. `aspect-ratio` matches the file, so nothing is cropped: audited at ten widths, **0% throughout**.
- **Looped seamlessly.** It opens on dark wood and closes on white studio, so a plain loop would hard-cut. The last 0.7s is dissolved over the first 0.7s so the outgoing frame matches the incoming one — verified by comparing the output's first and last frames, which are now identical.
- **Audio stripped.** Hero autoplay must be muted or browsers refuse it, so the 196 kbps stereo track was pure weight. The captions are burned in, so muting costs nothing.
- **640×1138 at crf 32, 1.87MB for 23.5s.** Checked against crf 28 at the caption-plus-app frame: text equally crisp, keyboard detail marginally softer, a megabyte cheaper.
- **Removed:** the floating "Tracking sips" and "1.4L today" cards. The promo carries its own captions in the same region making the same claim, so the two competed. One line in `Home.jsx` restores them.

### A-40 update — hero video weight after the film rebuild
- The hero is now a **14.75s six-shot film at 1280×896, 957KB**, replacing an 88KB two-file loop. The increase is deliberate and was Nathan's call (the loop "felt like a GIF"); it is still a single request and well under the 5.5MB original that A-40 first compressed.
- **crf 34** was chosen by comparing frames against crf 30 at the film's most detailed moment (the app screen) — the two are indistinguishable, and it saved 35%. The portrait encode is gone entirely, so the page fetches one file rather than choosing between two.

### A-54 — The hero video has the same content defects as its poster
- **Original finding:** Raised 2026-08-26. Frame inspection during compression showed the hero loop contains a **Hydro Flask** tumbler with the logo visible twice, sitting on a **closed laptop**, with burned-in social captions ("any bottle") — a repurposed social clip — and it demonstrates the **dock**, not the clip the copy sells.
- **Priority / impact:** P6 by band, but it is the first thing a visitor sees, so it carries the same weight as A-21.
- **Affected:** `public/media/video/hero.mp4`, homepage hero.
- **Dependencies:** A-21 (needs a shoot).
- **Acceptance criteria:** a hero loop showing the clip attaching to an unbranded bottle, no laptop, no burned-in captions, no competitor logos.
- **Status:** **Complete**
- **Interim, shipped `9ffa8e9`:** the hero stopped playing the clip and showed a still instead, gated behind `HERO_VIDEO_ENABLED`.
- **Evidence:** commit `5224d27`. Correct footage did not need filming — it was already in the library. `assets/videos/playable/clip-vertical-b.mp4` is real studio footage of the actual **black Clip**: chrome ring, embossed Sponge logo, USB-C port, moulded regulatory text. No competitor bottle, no laptop, no burned-in captions. It replaces the Hydro Flask clip entirely, and `hero.mp4` is deleted rather than retained.
- **How it is composited:** the footage sits on a studio sweep measuring **218–230, not white**, which would have shown as a grey slab behind the copy. Lifting the whites to clip at 209 puts the background at a true **255** while leaving the device untouched — it is black, nowhere near the clip point. That lets the layer be composited with `mix-blend-mode: multiply`, so the white multiplies away and the hero's own gradient shows through: no key, no matte, and the white padding around the footage is invisible. Purity re-checked **after** encoding, at the pad seam, not just before.
- **Scope change:** Nathan asked for the video to become the **entire hero background** rather than a phone-sized inset, so it now covers the section.
- **Rebuilt again 2026-08-27 (`a494815`) — Nathan: "it feels like a GIF now, it got much shorter."** Both true: it was **3.7s of a single shot, ping-ponged**, which is the recipe for looking like a GIF.
- **Why it could not simply be extended.** The floating-device treatment worked by compositing white-background footage with `mix-blend-mode: multiply`. That constrains the hero to footage *on white*. A survey of every clip's edge brightness returned a blunt answer: only the CG turntable is natively white, and the one real studio clip yields about **1.8 seconds** in which the device is fully in frame with margin. That 1.8s *was* the loop. There was nothing to extend it with.
- **Ruled out, with reasons:** the **turntable** is 16s on pure white but is a render — its black colourway has a cream ring where the real unit has chrome, no body seam and no USB-C port, so side by side they read as two different products; **device-animation-exploded** is on near-black, **app-demo** on dark navy and the **app screenshots** are dark-mode, all of which multiply into slabs; **clip-landscape-a** is real but sits on mid-grey, and normalising it to white would erase the white device along with its background. Drive's Media Library was checked too — raw iPhone footage and duplicates of what is already local.
- **So a longer hero meant giving up the multiply treatment.** That is the real trade, and it is why the look changed.
- **The film:** six shots, **14.75s**, real footage throughout — the Clip on white → two bottles wearing Clips courtside → drinking → a hand setting the Clip on a kitchen counter → the app reading 52.3 oz beside the bottle → back to the Clip on white. It opens and closes on the same white studio shot, so the **loop point is invisible** and the first frame still looks like the clean hero it replaced. Cross-dissolves, no ping-pong. Every social source carries burned-in captions; each shot is a band cropped **clear** of them rather than blurred or covered.
- **Built and discarded:** a version using the attach tutorial. That footage is shot macro, and full-bleed at hero width it becomes a wall of hand and bottle; framing it inside a blurred ambient fill only made it look like a letterboxed vertical video. Environmental shots only.
- **Layout:** at ≥940px the film is full-bleed and the scrim is now load-bearing for legibility rather than decorative. Below 940px the copy is full-width and leaves no room beside it — hiding 70% of the film behind a scrim only ever revealed the bottom edge of the frame, so the film gets its **own full-width strip** under the copy and the whole composed shot is visible. One file serves both, so the separate portrait encode is deleted.

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
| 2026-08-25 | `1f051bf` | This ledger created |
| 2026-08-26 | `4768306` | A-03, A-07, A-43 — email capture in three places, 9 tests |
| 2026-08-26 | `ffe24ca` | A-05, A-06 — PDP colour selection, grouped cart rows, adhesive cross-sell |
| 2026-08-26 | `0de4008` | A-17, A-18, A-19, A-20 — contrast, star shape, exposed headline, labels |
| 2026-08-26 | `3fcdc6f` | A-16 — sticky mobile buy bar |
| 2026-08-26 | `eb2f2fc` | A-09, A-14, A-28 — comparison table, objection block, blog link |
| 2026-08-26 | `df917ad` | A-42 — AI-watermarked lifestyle image removed and replaced |
| 2026-08-26 | `b28607f` | A-22, A-23, A-27 — structured data scoped per page, 10 tests |
| 2026-08-26 | `2770a1e` | A-46 to A-50 — health claims corrected and cited, wellness disclaimer |
| 2026-08-26 | `d5bdf7c` | A-26, A-40, A-53 — OG card rebuilt, hero video −63%, autoplay pause control |
| 2026-08-26 | `62a5a02` | A-29 — images right-sized (−40%) and given intrinsic dimensions |
| 2026-08-26 | `8550f7c` | A-41 — Inter self-hosted as one variable font; Google Fonts dropped as a processor |
| 2026-08-26 | `8d49d4b` | A-55 — six pages given an h1; regression test across 13 pages |
| 2026-08-26 | `9ffa8e9` | A-11, A-21 (partial), A-54 (interim), A-56 — Apple Health + widget, corrected shipped-products claim, unused assets put to work, hero still |
| 2026-08-26 | `634f7ff` | A-57 — fixed images stretched by presentational height hints (regression from 62a5a02) |
| 2026-08-27 | `f62e137` | A-21, A-29 — imagery redone from real footage after rejection; steps recropped from 146–192% to 0–1% |
| 2026-08-27 | `5224d27` | A-54, A-58 — hero video becomes the full-bleed background from real footage of the black Clip; hero gutter restored; A-57 guard moved |
| 2026-08-27 | `cfb8545` | A-21 — persona photos replaced with real footage (one was AI); homepage now has no image cropping over 25% |
| 2026-08-27 | `a494815` | A-54, A-40 — hero becomes a real 14.75s six-shot film; multiply treatment retired; portrait encode dropped; 957KB |
| 2026-08-27 | `3659c40` | A-54 — hero crop measured at 40–53% discard and fixed; strip aspect capped; crop-audit script added |
| 2026-08-27 | `c44c40a` | A-54 — hero media content-hashed via Vite; the 4h cache on `public/` had been serving stale cuts |
| 2026-08-27 | `9fb52cf` | A-54 — film moved out of full-bleed into a contained panel; 0% cropped at every viewport |
| 2026-08-27 | `28f3838` | A-54 — replaced with Sponge’s own 24s promo (`0827.mp4`) at Nathan’s direction; portrait panel, looped seamlessly |
| 2026-08-28 | `476eb5e` | A-54 — hero promo enlarged to 460×818 and re-encoded at 800×1422 |
| 2026-08-28 | `87a389d` | A-21 — lifestyle band swapped for the training flat-lay (AI marks cropped out); app day-chart added to the empty column in "On your phone" |
| 2026-08-28 | `f2cb31d` | A-59, A-50 — blog posts rewritten long and sourced; the retired adaptive-goal claim removed from the blog, where it had survived |
| 2026-08-28 | `83075a4` | A-60 — hero swapped to the `0827(2)` cut, removing the burned-in "world's first" superlative |
| 2026-08-28 | `394c1b6` | A-61, A-62 — sitewide claim sweep: three corrected, competitor pricing verified, hardware specs escalated to Nathan |
| 2026-08-28 | `(this)` | A-50, A-62 — Nathan confirmed 3M, 8-day battery and the load-cell/accelerometer/algorithm stack; the sign-up goal recommendation restored as a claim, ongoing adaptation still retired |


---

## Subscriber test rows — housekeeping

Two rows were written to the **Subscribers** tab of the existing order
spreadsheet (the same Google Sheet the order log uses, `GOOGLE_SHEET_ID`) while
verifying A-03:

| Row | What it tested |
|---|---|
| `claude-verification-test@spongehydration.com` | The API path — a direct POST to `/api/subscribe`, proving the endpoint authenticates to Google, creates the tab if absent, and appends. Posted **twice**, so if de-duplication works it should appear **once**. |
| `claude-ui-verification@spongehydration.com` | The UI path — submitted through the real footer form on the live site, proving the form, the request and the success state work end to end. |

**Why the de-dup check matters:** the endpoint deliberately returns the same
response for a new and an existing address, so list membership cannot be probed
from outside. That makes "the twice-posted address appears once" the only
external evidence that de-duplication works.

**Status:** I have no credentials for that spreadsheet, so I could not read or
delete the rows. Instead `test/subscriber-dedup.test.js` exercises the **real**
`appendSubscriber` against a stubbed Sheets API and proves the branch: a known
address is not appended, matching is case- and whitespace-insensitive, stored
addresses are normalised, and a failed read still appends rather than dropping a
signup. Deleting the two rows is a short manual step for Nathan.

## Final audit of the deployed site — 2026-08-26

Run against production after all of the above, looking for regressions and
omissions rather than re-confirming known fixes.

**Checked and clean:**
- All 23 routes return 200; `/nonexistent-page` correctly returns 404.
- Every page carries a description, a canonical, and now exactly one h1.
- Sitemap includes `/legal/pre-order`.
- Zero occurrences sitewide of: "free shipping", "8 weeks", "79.99", "299.96",
  "Save $100", "most preventable", "drink-water reminder device", "Order Now",
  `recovery.webp`.
- Cold first visit: consent banner shown, **zero** tracker requests, zero
  Google Fonts requests. The only third-party host is Cloudflare's own beacon
  (A-33, User Action Required).
- 390px: no horizontal overflow, one h1, video pause control present.
- Cart and checkout still agree on totals; the order path is unaffected by any
  of this work.

**Found and fixed during this pass:** A-55 (six pages with no h1).

**Page weight, cold and compressed:** critical path **619KB**, down from roughly
1.6MB — document 7.9KB, CSS 11KB, JS 114KB, font 48KB, hero video 372KB, poster
72KB. Lazy images (personas 158KB, showcase 187KB) load after.

**Measurement note:** a warm browser reported ~1.6MB because it was serving
pre-optimisation copies from cache (`transferSize: 0`). Always cache-bust and
send `--compressed` when measuring, or the numbers are meaningless.
