import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="brand"><img className="brand__logo brand__logo--light" src="/media/logo/mark-white.png" alt="" aria-hidden="true" /> Sponge</div>
            <p>The smart hydration tracker that clips to any water bottle and helps you hit your daily water goal — automatically.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <Link to="/products">All products</Link>
            <Link to="/shop/p/sponge-clip">Sponge Tracker</Link>
            <Link to="/cart">Cart</Link>
          </div>
          <div>
            <h4>Company</h4>
            <Link to="/about">About us</Link>
            <Link to="/team">Team</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/caregivers">Caregivers</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div>
            <h4>Support</h4>
            <Link to="/how-it-works">Setup &amp; FAQ</Link>
            <Link to="/legal/returns">Return policy</Link>
            <Link to="/legal/warranty">Warranty</Link>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} Sponge Hydration. All rights reserved.</span>
          <span className="footer__legal">
            <Link to="/legal/terms">Terms</Link>
            <Link to="/legal/privacy">Privacy</Link>
            <Link to="/legal/returns">Returns</Link>
            <Link to="/legal/warranty">Warranty</Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
