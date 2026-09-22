import { Link, useParams } from 'react-router-dom'
import { Seo, SITE } from '../components/useSEO'
import { blogBySlug, blogPosts } from '../data'

// Inline markup inside a body string: [3] or [3, 4] is a citation to the
// numbered source list, and [label](/path) is an internal link. Anything else in
// square brackets is left alone.
const INLINE = /\[(\d+(?:\s*,\s*\d+)*)\](?!\()|\[([^\]]+)\]\((\/[^)\s]*)\)/g

function renderInline(text) {
  const out = []
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) {
      // A citation hugs the word before it ("detect it¹"), so drop the space
      // that separates them in the source text.
      const before = text.slice(last, m.index)
      out.push(m[1] ? before.replace(/\s+$/, '') : before)
    }
    if (m[1]) {
      const nums = m[1].split(/\s*,\s*/)
      out.push(
        <sup className="cite" key={m.index}>
          {nums.map((n, j) => (
            <span key={n}>
              {j > 0 && ','}
              <a href={`#source-${n}`} aria-label={`Source ${n}`}>{n}</a>
            </span>
          ))}
        </sup>
      )
    } else {
      out.push(<Link key={m.index} to={m[3]}>{m[2]}</Link>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function BlogPost() {
  const { slug } = useParams()
  const post = blogBySlug(slug)

  if (!post) {
    return (
      <section className="section">
        <Seo title="Article not found | Sponge" description="This article could not be found." path={`/blog/${slug || ''}`} noindex />
        <div className="container empty-state">
          <h2>Article not found</h2>
          <Link to="/blog" className="btn btn--primary">Back to blog</Link>
        </div>
      </section>
    )
  }

  const others = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2)

  return (
    <section className="section">
      <Seo
        title={`${post.title} | Sponge Blog`}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
        ogType="article"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            datePublished: post.date,
            // Attributed to the company, not an individual — the posts carry no
            // byline and inventing an author would be fabricating one.
            author: { '@type': 'Organization', name: 'Sponge Hydration' },
            publisher: {
              '@type': 'Organization',
              name: 'Sponge Hydration',
              logo: { '@type': 'ImageObject', url: `${SITE}/icon-512.png` },
            },
            mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/blog/${post.slug}` },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Blog', item: `${SITE}/blog` },
              { '@type': 'ListItem', position: 2, name: post.title },
            ],
          },
        ]}
      />
      <div className="container">
        <div className="breadcrumb"><Link to="/blog">Blog</Link> <span>/</span> {post.tag}</div>
        <article className="article">
          <span className="blog-card__tag">{post.tag}</span>
          <h1>{post.title}</h1>
          <div className="article__meta">
            {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} · {post.readTime}
          </div>
          {/* A body entry is either a plain string (paragraph) or a block:
              {h2}/{h3} a heading, {ul} a list, {quote, cite} a pull quote,
              {img, alt, caption} a figure, {note} the general-wellness caveat
              that has to sit with any health claim. */}
          {post.body.map((b, i) => {
            if (typeof b === 'string') return <p key={i}>{renderInline(b)}</p>
            if (b.h2) return <h2 key={i} id={slugify(b.h2)}>{b.h2}</h2>
            if (b.h3) return <h3 key={i}>{b.h3}</h3>
            if (b.ul) return <ul key={i}>{b.ul.map((li, j) => <li key={j}>{renderInline(li)}</li>)}</ul>
            if (b.quote) {
              return (
                <figure key={i} className="article__quote">
                  <blockquote><p>{renderInline(b.quote)}</p></blockquote>
                  {b.cite && <figcaption>{b.cite}</figcaption>}
                </figure>
              )
            }
            if (b.img) {
              return (
                <figure key={i} className="article__figure">
                  <img src={b.img} alt={b.alt || ''} loading="lazy" decoding="async" />
                  {b.caption && <figcaption>{b.caption}</figcaption>}
                </figure>
              )
            }
            if (b.note) return <p key={i} className="article__note">{b.note}</p>
            return null
          })}

          {post.sources?.length > 0 && (
            <div className="article__sources">
              <h2>Sources</h2>
              <ol>
                {post.sources.map((src, i) => (
                  <li key={i} id={`source-${i + 1}`}>
                    {src.url
                      ? <a href={src.url} target="_blank" rel="noopener noreferrer">{src.text}</a>
                      : src.text}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="article__cta">
            <h3>Track your hydration automatically</h3>
            <p>Sponge clips onto any bottle and logs every sip for you. Build the habit without the willpower.</p>
            <Link to="/products" className="btn btn--primary btn--lg">Order Sponge now — $59.99</Link>
          </div>
        </article>

        {others.length > 0 && (
          <div className="article__more">
            <h3>Keep reading</h3>
            <div className="features">
              {others.map((p) => (
                <article className="blog-card" key={p.slug}>
                  <div className="blog-card__body">
                    <span className="blog-card__tag">{p.tag}</span>
                    <h3><Link to={`/blog/${p.slug}`}>{p.title}</Link></h3>
                    <p>{p.excerpt}</p>
                    <Link to={`/blog/${p.slug}`} className="link-btn">Read article →</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
