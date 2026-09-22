// The long-form posts carry numbered citations ([3], [3, 4]) that link to their
// source lists. A source added or removed without renumbering silently points a
// health claim at the wrong study, which is worse than no citation at all. This
// fails the build before that ships.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { blogPosts, faqs } from '../src/data.js'

const CITE = /\[(\d+(?:\s*,\s*\d+)*)\](?!\()/
const CITE_ALL = new RegExp(CITE.source, 'g')
const LINK_ALL = /\[([^\]]+)\]\((\/[^)\s]*)\)/g

const strings = (post) =>
  post.body.flatMap((b) => (typeof b === 'string' ? [b] : [...(b.ul || []), b.quote || '']))

describe.each(blogPosts.filter((p) => strings(p).some((t) => CITE.test(t))).map((p) => [p.slug, p]))(
  '%s',
  (_, post) => {
    const cited = new Set()
    for (const t of strings(post)) {
      for (const m of t.matchAll(CITE_ALL)) m[1].split(/\s*,\s*/).forEach((n) => cited.add(Number(n)))
    }

    it('cites only sources that exist', () => {
      for (const n of cited) {
        expect(n, `[${n}] has no source`).toBeGreaterThanOrEqual(1)
        expect(n, `[${n}] has no source`).toBeLessThanOrEqual(post.sources.length)
      }
    })

    it('cites every source it lists', () => {
      post.sources.forEach((_, i) => expect(cited.has(i + 1), `source ${i + 1} is never cited`).toBe(true))
    })

    it('links every source to a URL', () => {
      post.sources.forEach((src, i) => expect(src.url, `source ${i + 1}`).toMatch(/^https:\/\//))
    })
  }
)

describe('internal links inside posts', () => {
  const blogSlugs = new Set(blogPosts.map((p) => p.slug))
  const pages = new Set(['/how-it-works', '/team', '/caregivers', '/products', '/about', '/blog'])

  it('point at pages that exist', () => {
    for (const post of blogPosts) {
      for (const t of strings(post)) {
        for (const m of t.matchAll(LINK_ALL)) {
          const to = m[2]
          const ok = to.startsWith('/blog/') ? blogSlugs.has(to.slice(6)) : pages.has(to)
          expect(ok, `${post.slug} links to ${to}`).toBe(true)
        }
      }
    }
  })
})

describe('homepage cards lead to more detail, not the checkout', () => {
  const home = readFileSync(path.resolve(process.cwd(), 'src/pages/Home.jsx'), 'utf8')
  const block = (name) => {
    const start = home.indexOf(`const ${name} = [`)
    return home.slice(start, home.indexOf('\n]', start))
  }

  it('gives every feature card a destination that is not the shop, cart or checkout', () => {
    const tos = [...block('features').matchAll(/to: '([^']+)'/g)].map((m) => m[1])
    expect(tos.length).toBe(6)
    for (const to of tos) expect(to).not.toMatch(/^\/(shop|cart|checkout|products)/)
  })

  it('points FAQ anchors at questions that exist', () => {
    const ids = new Set(faqs.map((f) => f.id))
    for (const m of block('features').matchAll(/#faq-([a-z0-9-]+)/g)) {
      expect(ids.has(m[1]), `no FAQ with id ${m[1]}`).toBe(true)
    }
  })

  it('does not wrap the how-it-works steps in a link', () => {
    expect(block('STEPS')).not.toMatch(/shop\/p\//)
    expect(home.includes('to="/shop/p/sponge-clip" className="step')).toBe(false)
  })
})
