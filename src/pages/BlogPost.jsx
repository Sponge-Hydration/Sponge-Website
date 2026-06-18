import { Link, useParams } from 'react-router-dom'
import { useSEO } from '../components/useSEO'
import { blogBySlug, blogPosts } from '../data'

export default function BlogPost() {
  const { slug } = useParams()
  const post = blogBySlug(slug)

  useSEO({
    title: post ? `${post.title} | Sponge Blog` : 'Article not found | Sponge',
    description: post ? post.excerpt : 'This article could not be found.',
    path: `/blog/${slug || ''}`,
  })

  if (!post) {
    return (
      <section className="section">
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
      <div className="container">
        <div className="breadcrumb"><Link to="/blog">Blog</Link> <span>/</span> {post.tag}</div>
        <article className="article">
          <span className="blog-card__tag">{post.tag}</span>
          <h1>{post.title}</h1>
          <div className="article__meta">
            {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {post.readTime}
          </div>
          {post.body.map((para, i) => <p key={i}>{para}</p>)}

          <div className="article__cta">
            <h3>Track your hydration automatically</h3>
            <p>Sponge clips onto any bottle and logs every sip for you. Build the habit without the willpower.</p>
            <Link to="/products" className="btn btn--primary btn--lg">Order Sponge — $59.99</Link>
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
