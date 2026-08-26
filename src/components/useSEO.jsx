import { Head } from 'vite-react-ssg'

const SITE = 'https://www.spongehydration.com'

/**
 * Per-route SEO head, rendered at build time (SSG) and on the client via
 * react-helmet-async. Render <Seo .../> near the top of a page's JSX.
 * Pass noindex for transactional/interactive pages (cart, checkout, etc.).
 */
export function Seo({
  title,
  description,
  path = '/',
  noindex = false,
  ogType = 'website',
  jsonLd = null,
}) {
  const url = SITE + path
  // Structured data belongs to the page that displays the content it describes,
  // never to the shared template — see the note in index.html. Accepts one
  // object or an array of them.
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []
  return (
    <Head>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      {title && <meta name="twitter:title" content={title} />}
      {description && <meta name="twitter:description" content={description} />}
      <meta name="robots" content={noindex ? 'noindex' : 'index, follow, max-image-preview:large'} />
      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Head>
  )
}

export { SITE }
