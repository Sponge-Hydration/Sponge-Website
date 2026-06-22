# Sponge Website — SEO Audit Agent

This repo already has a strong SEO baseline (per-route `useSEO` hook, Product /
FAQ / Organization JSON-LD, sitemap, robots, legacy redirects). This adds a
**reusable auditor** so that baseline doesn't quietly regress as the site grows.

## Run it

```bash
python3 scripts/seo_audit.py            # print report
python3 scripts/seo_audit.py --report   # also write SEO_AUDIT_REPORT.md
python3 scripts/seo_audit.py --notify   # macOS notification with the score
python3 scripts/seo_audit.py --strict   # exit 1 on critical issues (for CI / pre-deploy)
```

No `node` required — pure Python 3.

## What it checks

- **Broken local asset references** — any `/path.ext` in `index.html` that's
  missing from `/public`. (This is what catches a missing `og-image.jpg`, icon,
  or web manifest before it ships as a blank social-share preview.)
- **Per-route SEO** — every indexable route in `App.jsx` must call `useSEO()`,
  so no page silently inherits the homepage title/description.
- **Sitemap coverage** — every public route appears in `sitemap.xml`.
- **robots.txt** — present and points to the sitemap.
- **Structured data** — Product, FAQPage, and Organization JSON-LD present;
  flags an empty `sameAs`.
- **Image alt text** — flags `<img>` without `alt`.
- **Meta lengths** — title / description within search-result display limits.

Score = 100 − (critical×12 + warning×4 + info×1).

## Monthly automation

A macOS `launchd` job (`com.spongehydration.seo.audit`) runs the auditor on the
1st of each month and sends a notification with the score. The generated
`SEO_AUDIT_REPORT.md` is git-ignored (it's a regenerated snapshot).

## Current known items (informational)

- `Organization.sameAs` is empty — add real social profile URLs.
- The homepage title (68 chars) and meta description (284 chars) exceed typical
  search-result display lengths; they're keyword-rich, so this is a judgment call.
