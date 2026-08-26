import { Link } from 'react-router-dom'
import { openPrivacyPreferences } from './PrivacyControls'
import EmailSignup from './EmailSignup'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="brand"><img className="brand__logo brand__logo--light" src="/media/logo/mark-white.png" alt="" aria-hidden="true" /> Sponge</div>
            <p>The smart hydration tracker that clips to any water bottle and helps you hit your daily water goal, automatically.</p>
            <div className="footer__apps">
              <a href="https://apps.apple.com/us/app/sponge-hydration/id6566195232" target="_blank" rel="noopener noreferrer">App Store</a>
              <a href="https://play.google.com/store/apps/details?id=com.spongehydrationAndroid.sponge" target="_blank" rel="noopener noreferrer">Google Play</a>
            </div>
            <div className="footer__signup">
              <p className="footer__signup-pitch">
                <strong>We send one email a month.</strong> What we learned building the
                hardware, what the hydration research actually says, and when the next batch
                opens. No drip sequence.
              </p>
              <EmailSignup
                source="footer"
                label="Email address"
                cta="Sign up"
                variant="stacked"
                done="Thanks — you’re on the list. One email a month, that’s it."
              />
            </div>
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
            <Link to="/reviews">Reviews</Link>
            <Link to="/caregivers">Caregivers</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div>
            <h4>Support</h4>
            <Link to="/how-it-works">Setup &amp; FAQ</Link>
            <Link to="/legal/pre-order">Pre-order policy</Link>
            <Link to="/legal/returns">Return policy</Link>
            <Link to="/legal/warranty">Warranty</Link>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} Sponge Hydration LLC. All rights reserved.</span>
          <span className="footer__legal">
            <Link to="/legal/terms">Terms</Link>
            <Link to="/legal/privacy">Privacy</Link>
            <Link to="/legal/returns">Returns</Link>
            <Link to="/legal/warranty">Warranty</Link>
            {/* CPRA requires this to be a clear, persistent, site-wide control. */}
            <button type="button" className="footer__privacy-btn" onClick={openPrivacyPreferences}>
              Do Not Sell or Share My Personal Information
            </button>
          </span>
        </div>
      </div>
    </footer>
  )
}
