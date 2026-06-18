import { useEffect } from 'react'

const SITE = 'https://www.spongehydration.com'

function setMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(path) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', SITE + path)
}

/**
 * Lightweight per-route SEO: title, description, canonical, OG/Twitter.
 * SPA meta isn't a substitute for SSR, but modern crawlers render it.
 */
export function useSEO({ title, description, path = '/' }) {
  useEffect(() => {
    if (title) document.title = title
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', SITE + path)
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setCanonical(path)
  }, [title, description, path])
}
