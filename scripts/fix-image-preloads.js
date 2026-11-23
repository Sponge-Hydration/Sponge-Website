// Build step, used by vite.config.js (ssgOptions.onPageRendered).
//
// vite-react-ssg writes a preload tag for every image a page imports, and puts
// `crossorigin` on it. The browser then fetches the home page's hero poster
// twice: once for the preload (CORS mode) and again for the <video poster>
// (no-CORS mode), logging "preload ... not used because the request credentials
// mode does not match". Dropping the attribute lets the one download serve both,
// and fetchpriority tells the browser it is the first thing worth painting.
// Font and script preloads keep `crossorigin`: those requests really are CORS.
//
// Lives in its own file so test/gallery-thumbs.test.js can import it without
// loading Vite.
export function fixImagePreloads(html) {
  return html.replace(/<link\b[^>]*>/g, (tag) => {
    if (!/\brel="preload"/.test(tag) || !/\bas="image"/.test(tag)) return tag
    const cleaned = tag.replace(/\s+crossorigin(="[^"]*")?/, '')
    return /\bfetchpriority=/.test(cleaned) ? cleaned : cleaned.replace(/>$/, ' fetchpriority="high">')
  })
}
