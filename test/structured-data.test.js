// A-22/A-23/A-27. The template used to inject Product + FAQPage into EVERY
// page, including /about, /blog and the legal pages. Google requires FAQ markup
// to correspond to FAQ content visible on that page, so that was a guidelines
// violation and the likeliest cause of a manual action.
//
// These run against the BUILT output, because that is what Google actually
// crawls. Run `npm run build` first.

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// Resolved from the working directory, which vitest runs at the repo root.
// An import.meta.url-relative path does not survive vitest's transform here,
// and a bare file:// URL percent-encodes the space in the repo path.
const dist = (p) => path.resolve(process.cwd(), 'dist', p)
const built = existsSync(dist('index.html'))
const read = (p) => readFileSync(dist(p), 'utf8')
const types = (p) => {
  const out = new Set()
  for (const m of read(p).matchAll(/"@type":\s*"([A-Za-z]+)"/g)) out.add(m[1])
  return out
}

// Skip rather than fail when dist is absent, so `npm test` alone still works.
const d = built ? describe : describe.skip

d('the template no longer carries page-specific schema', () => {
  const NON_PRODUCT = [
    'index.html', 'products.html', 'about.html', 'team.html', 'blog.html',
    'reviews.html', 'contact.html', 'legal/privacy.html', 'legal/terms.html',
    'legal/returns.html', 'legal/warranty.html', 'legal/pre-order.html',
  ]

  it('puts Product on no page that does not sell a single product', () => {
    for (const p of NON_PRODUCT) {
      if (!existsSync(dist(p))) continue
      expect(types(p), `${p} should not carry Product`).not.toContain('Product')
    }
  })

  it('puts FAQPage only on the page that displays the FAQ', () => {
    for (const p of NON_PRODUCT) {
      if (!existsSync(dist(p))) continue
      expect(types(p), `${p} should not carry FAQPage`).not.toContain('FAQPage')
    }
    expect(types('how-it-works.html')).toContain('FAQPage')
  })

  it('keeps Organization site-wide, which is legitimate', () => {
    for (const p of ['index.html', 'about.html', 'legal/privacy.html']) {
      if (!existsSync(dist(p))) continue
      expect(read(p)).toMatch(/"@type":\s*"Organization"/)
    }
  })
})

d('product pages carry real per-product data', () => {
  const p = 'shop/p/sponge-clip.html'

  it('has Product and BreadcrumbList', () => {
    const t = types(p)
    expect(t).toContain('Product')
    expect(t).toContain('BreadcrumbList')
  })

  it('points the offer at the product, not the homepage', () => {
    expect(read(p)).toContain('spongehydration.com/shop/p/sponge-clip')
  })

  it('carries sku and a return policy', () => {
    const t = types(p)
    expect(read(p)).toMatch(/"sku":\s*"sponge-clip"/)
    expect(t).toContain('MerchantReturnPolicy')
  })

  it('claims no aggregateRating, which would be unsubstantiated today', () => {
    expect(read(p)).not.toContain('aggregateRating')
  })
})

d('blog posts carry article schema', () => {
  it('has BlogPosting and BreadcrumbList', () => {
    const t = types('blog/signs-of-dehydration.html')
    expect(t).toContain('BlogPosting')
    expect(t).toContain('BreadcrumbList')
  })
})

d('og:type reflects the page', () => {
  const og = (p) => read(p).match(/og:type"\s*content="([a-z]+)"/)?.[1]
  it('is website, product and article respectively', () => {
    expect(og('index.html')).toBe('website')
    expect(og('shop/p/sponge-clip.html')).toBe('product')
    expect(og('blog/signs-of-dehydration.html')).toBe('article')
  })
})

d('obsolete metadata is gone', () => {
  it('ships no keywords meta tag', () => {
    expect(read('index.html').match(/<meta[^>]*name="keywords"[^>]*>/)).toBeNull()
  })
})

// A-55. Six pages used SectionHead — which renders an h2 — as their page title,
// so their document outline began at level 2 with no h1 at all.
d('every indexable page has exactly one h1', () => {
  const PAGES = [
    'index.html', 'products.html', 'how-it-works.html', 'blog.html', 'team.html',
    'contact.html', 'reviews.html', 'about.html', 'caregivers.html',
    'shop/p/sponge-clip.html', 'blog/signs-of-dehydration.html',
    'legal/privacy.html', 'legal/pre-order.html',
  ]
  it.each(PAGES)('%s has one h1', (p) => {
    if (!existsSync(dist(p))) return
    expect((read(p).match(/<h1[\s>]/g) || []).length).toBe(1)
  })
})
