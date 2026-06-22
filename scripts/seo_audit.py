#!/usr/bin/env python3
"""
Sponge Website — SEO Audit Agent
================================

A dependency-free static SEO auditor for this Vite + React (JS) site. It scores
on-page/technical SEO and lists every issue by severity, so regressions don't
ship as the site grows (new pages, new assets, new blog posts).

Runs locally with Python 3 only (no node required). Designed for a monthly
launchd/cron run; also useful before each deploy.

Usage:
    python3 scripts/seo_audit.py            # print report
    python3 scripts/seo_audit.py --report   # also write SEO_AUDIT_REPORT.md
    python3 scripts/seo_audit.py --notify    # macOS notification with the score
    python3 scripts/seo_audit.py --strict    # exit 1 if any CRITICAL issues
"""

import argparse
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SRC = REPO / "src"
PUBLIC = REPO / "public"
INDEX_HTML = REPO / "index.html"
APP = SRC / "App.jsx"

CRITICAL, WARN, INFO = "CRITICAL", "WARNING", "INFO"

# Routes that intentionally should NOT be indexed / in the sitemap.
NOINDEX_ROUTES = {"/cart", "/checkout", "/account", "/dashboard"}

findings = []


def add(sev, area, msg):
    findings.append((sev, area, msg))


def read(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8", errors="replace")
    except FileNotFoundError:
        return ""


def audit_broken_asset_refs():
    """The check that catches missing og-image.jpg, webmanifest, icons, etc.
    Any root-absolute /path referenced in index.html must exist in public/."""
    html = read(INDEX_HTML)
    refs = set()
    for m in re.finditer(r'(?:href|src|content)="(/[^"]+)"', html):
        ref = m.group(1).split("?")[0].split("#")[0]
        # Skip Vite source/module paths — they resolve from /src, not /public.
        if ref.startswith(("/src/", "/@", "/node_modules/")):
            continue
        # only check real file paths (has an extension), skip route URLs
        if re.search(r"\.[a-zA-Z0-9]{2,5}$", ref):
            refs.add(ref)
    for ref in sorted(refs):
        if not (PUBLIC / ref.lstrip("/")).exists():
            add(CRITICAL, "index.html", f"References {ref} but the file is missing from /public — broken asset (e.g. blank social preview)")


def audit_per_route_seo():
    """Every content page wired into routing should call useSEO()."""
    app = read(APP)
    if not app:
        add(CRITICAL, "src/App.jsx", "App.jsx not found — cannot verify routing")
        return
    # Map "<Route path="/x" element={<PageName ..." -> (path, PageName)
    for m in re.finditer(r'<Route\s+path="([^"]+)"\s+element=\{<(\w+)', app):
        path, comp = m.group(1), m.group(2)
        if comp == "Navigate":
            continue  # redirect route
        if path in NOINDEX_ROUTES or path == "*":
            continue
        page = SRC / "pages" / f"{comp}.jsx"
        if not page.exists():
            add(WARN, "src/App.jsx", f"Route {path} -> <{comp}> but src/pages/{comp}.jsx not found")
            continue
        if "useSEO" not in read(page):
            add(CRITICAL, f"src/pages/{comp}.jsx", f"Indexable route {path} does not call useSEO() — inherits the homepage title/description")


def audit_sitemap_coverage():
    sm = read(PUBLIC / "sitemap.xml")
    if not sm:
        add(CRITICAL, "public/sitemap.xml", "sitemap.xml missing")
        return
    app = read(APP)
    static_routes = [
        m.group(1)
        for m in re.finditer(r'<Route\s+path="(/[^":*]*)"\s+element=\{<(\w+)', app)
        if m.group(2) != "Navigate"
    ]
    for path in static_routes:
        if path in NOINDEX_ROUTES:
            continue
        # dynamic segments (e.g. /shop/p/:slug) won't appear literally; skip
        if ":" in path:
            continue
        if path not in sm:
            add(WARN, "public/sitemap.xml", f"Route {path} is not listed in sitemap.xml")


def audit_robots():
    robots = read(PUBLIC / "robots.txt")
    if not robots:
        add(WARN, "public/robots.txt", "robots.txt missing")
    elif "Sitemap:" not in robots:
        add(WARN, "public/robots.txt", "robots.txt has no Sitemap: directive")


def audit_structured_data():
    html = read(INDEX_HTML)
    for kind in ("Product", "FAQPage", "Organization"):
        if f'"@type": "{kind}"' not in html and f'"@type":"{kind}"' not in html:
            add(WARN, "index.html", f"No {kind} JSON-LD structured data")
    if re.search(r'"sameAs"\s*:\s*\[\s*\]', html):
        add(INFO, "index.html", "Organization sameAs is empty — add real social profile URLs (X, LinkedIn, Instagram)")


def audit_images():
    for jsx in SRC.rglob("*.jsx"):
        for m in re.finditer(r"<img\b[^>]*>", read(jsx), re.S):
            tag = m.group(0)
            if "alt=" not in tag:
                add(WARN, f"{jsx.relative_to(REPO)}", "<img> without alt text")


def audit_meta_lengths():
    html = read(INDEX_HTML)
    t = re.search(r"<title>(.*?)</title>", html, re.S)
    if t and len(t.group(1).strip()) > 65:
        add(INFO, "index.html", f"Title is {len(t.group(1).strip())} chars (>65 may truncate in search results)")
    d = re.search(r'name="description"\s+content="(.*?)"', html, re.S)
    if d and len(d.group(1).strip()) > 165:
        add(INFO, "index.html", f"Meta description is {len(d.group(1).strip())} chars (>165 may truncate)")


def score():
    crit = sum(1 for s, _, _ in findings if s == CRITICAL)
    warn = sum(1 for s, _, _ in findings if s == WARN)
    info = sum(1 for s, _, _ in findings if s == INFO)
    return max(0, 100 - crit * 12 - warn * 4 - info * 1), crit, warn, info


def build_report():
    val, crit, warn, info = score()
    out = ["# Sponge Website — SEO Audit Report", ""]
    out.append(f"**Score: {val}/100**  ·  {crit} critical · {warn} warnings · {info} info")
    out.append("")
    for sev, label in [(CRITICAL, "🔴 Critical"), (WARN, "🟠 Warnings"), (INFO, "🔵 Info")]:
        items = [(a, m) for s, a, m in findings if s == sev]
        if not items:
            continue
        out.append(f"## {label} ({len(items)})")
        for area, msg in items:
            out.append(f"- **{area}** — {msg}")
        out.append("")
    if val == 100:
        out.append("✅ No issues found.")
    out.append("")
    out.append("_Generated by scripts/seo_audit.py — re-run after adding pages, assets, or blog posts._")
    return "\n".join(out), val, crit


def notify(val, crit):
    msg = f"SEO score {val}/100, {crit} critical issue(s). See SEO_AUDIT_REPORT.md."
    try:
        subprocess.run(
            ["/usr/bin/osascript", "-e",
             f'display notification "{msg}" with title "Sponge Website SEO Audit" sound name "Glass"'],
            check=False, timeout=15,
        )
    except Exception:
        pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true")
    ap.add_argument("--notify", action="store_true")
    ap.add_argument("--strict", action="store_true")
    args = ap.parse_args()

    audit_broken_asset_refs()
    audit_per_route_seo()
    audit_sitemap_coverage()
    audit_robots()
    audit_structured_data()
    audit_images()
    audit_meta_lengths()

    report, val, crit = build_report()
    print(report)
    if args.report:
        (REPO / "SEO_AUDIT_REPORT.md").write_text(report, encoding="utf-8")
        print(f"\nWrote {REPO / 'SEO_AUDIT_REPORT.md'}")
    if args.notify:
        notify(val, crit)
    if args.strict and crit:
        sys.exit(1)


if __name__ == "__main__":
    main()
