import { Link } from 'react-router-dom'
import { useSEO } from '../components/useSEO'

export default function NotFound() {
  useSEO({ title: 'Page not found | Sponge', description: 'The page you’re looking for doesn’t exist.', path: '/404' })
  return (
    <section className="section">
      <div className="container empty-state">
        <div className="empty-state__emoji">💧</div>
        <h2>This page ran dry</h2>
        <p>We couldn’t find the page you were looking for.</p>
        <Link to="/" className="btn btn--primary btn--lg">Back to home</Link>
      </div>
    </section>
  )
}
