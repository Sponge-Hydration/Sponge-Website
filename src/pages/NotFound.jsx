import { Link } from 'react-router-dom'
import { Seo } from '../components/useSEO'
import { DropletIcon } from '../components/icons'

export default function NotFound() {
  return (
    <section className="section">
      <Seo title="Page not found | Sponge" description="The page you’re looking for doesn’t exist." path="/404" noindex />
      <div className="container empty-state">
        <div className="empty-state__icon" aria-hidden="true"><DropletIcon size={56} /></div>
        <h2>This page ran dry</h2>
        <p>We couldn’t find the page you were looking for.</p>
        <Link to="/" className="btn btn--primary btn--lg">Back to home</Link>
      </div>
    </section>
  )
}
