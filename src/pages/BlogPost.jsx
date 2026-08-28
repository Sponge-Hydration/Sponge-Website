import { Link, useParams } from 'react-router-dom'
import { Seo, SITE } from '../components/useSEO'
import { blogBySlug, blogPosts } from '../data'

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
            {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {post.readTime}
          </div>
          {/* A body entry is either a plain string (paragraph) or a block:
              {h2} a heading, {ul} a list, {note} the general-wellness caveat that
              has to sit with any health claim. */}
          {post.body.map((b, i) => {
            if (typeof b === 'string') return <p key={i}>{b}</p>
            if (b.h2) return <h2 key={i}>{b.h2}</h2>
            if (b.ul) return <ul key={i}>{b.ul.map((li, j) => <li key={j}>{li}</li>)}</ul>
            if (b.note) return <p key={i} className="article__note">{b.note}</p>
            return null
          })}

          {post.sources?.length > 0 && (
            <div className="article__sources">
              <h2>Sources</h2>
              <ol>
                {post.sources.map((src, i) => (
                  <li key={i}>
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
            <Link to="/products" className="btn btn--primary btn--lg">Pre-order Sponge — $59.99</Link>
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
