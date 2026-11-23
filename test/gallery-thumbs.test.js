// Product page thumbnails load small copies from public/media/thumbs/ instead of
// the full gallery files (site audit, 2026-11-23). A gallery image added to
// src/data.js without its thumbnail would show a broken image in the strip, so
// this fails first. It also pins the meta-description rule from the same audit.
import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { products } from '../src/data.js'
import { thumbSrc } from '../src/pages/ProductDetail.jsx'
import { fixImagePreloads } from '../scripts/fix-image-preloads.js'

const onDisk = (url) => path.resolve(process.cwd(), 'public', url.replace(/^\//, ''))

describe('gallery thumbnails', () => {
  const shots = [...new Set(products.filter((p) => p.gallery?.length > 1).flatMap((p) => p.gallery))]

  it('there are galleries to check', () => {
    expect(shots.length).toBeGreaterThan(5)
  })

  it('every gallery image exists', () => {
    for (const src of shots) expect(existsSync(onDisk(src)), src).toBe(true)
  })

  it('every gallery image has a thumbnail, and it is small', () => {
    for (const src of shots) {
      const thumb = onDisk(thumbSrc(src))
      expect(existsSync(thumb), `${src} has no ${thumbSrc(src)}`).toBe(true)
      expect(statSync(thumb).size, thumbSrc(src)).toBeLessThan(15_000)
    }
  })

  it('no two gallery images share a thumbnail name', () => {
    expect(new Set(shots.map(thumbSrc)).size).toBe(shots.length)
  })

  it('every product image exists', () => {
    for (const p of products) if (p.img) expect(existsSync(onDisk(p.img)), p.img).toBe(true)
  })
})

describe('product meta descriptions', () => {
  it('fit a search result with the ships line (the pre-order disclosure) intact', () => {
    for (const p of products) {
      const base = `${p.seoShort || p.short} ${p.ships}.`
      expect(base.length, `${p.id}: ${base}`).toBeLessThanOrEqual(160)
    }
  })
})

describe('image preload tags', () => {
  const poster = '<link rel="preload" as="image" href="/assets/hero-film-poster-abc.jpg" crossorigin="">'

  it('lose crossorigin, so the poster is downloaded once, and gain fetchpriority', () => {
    expect(fixImagePreloads(poster)).toBe(
      '<link rel="preload" as="image" href="/assets/hero-film-poster-abc.jpg" fetchpriority="high">',
    )
  })

  it('font, script and stylesheet tags keep crossorigin', () => {
    const others = [
      '<link rel="preload" href="/fonts/inter-latin-var.woff2" as="font" type="font/woff2" crossorigin="">',
      '<link rel="modulepreload" crossorigin="" href="/assets/app-abc.js">',
      '<link rel="stylesheet" crossorigin="" href="/assets/app-abc.css">',
    ]
    for (const tag of others) expect(fixImagePreloads(tag)).toBe(tag)
  })

  it('is safe to run twice and leaves the rest of the page alone', () => {
    const page = `<html><head>${poster}</head><body><p>crossorigin as="image"</p></body></html>`
    const once = fixImagePreloads(page)
    expect(fixImagePreloads(once)).toBe(once)
    expect(once).toContain('<p>crossorigin as="image"</p>')
  })
})
