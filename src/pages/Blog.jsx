import { Link } from 'react-router-dom'
import { Seo } from '../components/useSEO'
import { SectionHead } from '../components/bits'
import { DropletIcon } from '../components/icons'
import { blogPosts } from '../data'

export default function Blog() {
  return (
    <section className="section">
      <Seo
        title={'The Sponge Blog | Hydration Science, Tips & Tracker Guides'}
        description="Practical guides on how much water to drink, signs of dehydration, and choosing the right hydration tracking device — from the team behind Sponge."
        path="/blog"
      />
      <div className="container">
        <SectionHead eyebrow="Blog" title="Hydration, explained">
          Science-backed guides on drinking more water and getting the most from your hydration tracker.
        </SectionHead>
        <div className="features">
          {blogPosts.map((p) => (
            <article className="blog-card" key={p.slug}>
              <Link to={`/blog/${p.slug}`} className="blog-card__media">
                {p.cover ? <img src={p.cover} alt={p.title} loading="lazy" /> : <span aria-hidden="true"><DropletIcon size={40} /></span>}
              </Link>
              <div className="blog-card__body">
                <span className="blog-card__tag">{p.tag}</span>
                <h3><Link to={`/blog/${p.slug}`}>{p.title}</Link></h3>
                <p>{p.excerpt}</p>
                <div className="blog-card__meta">
                  <span>{new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span>· {p.readTime}</span>
                </div>
                <Link to={`/blog/${p.slug}`} className="link-btn">Read article →</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
