import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { ScrollToTop } from './bits'
import { CartProvider } from '../cart/CartContext'
import { initAnalytics, trackPageView } from '../analytics'
import PrivacyControls from './PrivacyControls'
import StickyBuyBar from './StickyBuyBar'
import { CONSENT_EVENT } from '../consent'

export default function Layout() {
  const { pathname } = useLocation()

  // Load the tags on first client render, then count every SPA navigation.
  // Effects don't run during prerender, so nothing here executes in Node.
  useEffect(() => {
    initAnalytics()
  }, [])

  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])

  // When a visitor grants a category they had not granted before, load it now
  // rather than waiting for the next navigation, and count the current page.
  // Downgrades are handled by PrivacyControls, which reloads — scripts that
  // have already executed cannot be unloaded any other way.
  useEffect(() => {
    const onConsentChange = () => {
      initAnalytics()
      trackPageView(window.location.pathname)
    }
    window.addEventListener(CONSENT_EVENT, onConsentChange)
    return () => window.removeEventListener(CONSENT_EVENT, onConsentChange)
  }, [])

  return (
    <CartProvider>
      <a href="#main" className="skip-link">Skip to content</a>
      <ScrollToTop />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <StickyBuyBar />
      <PrivacyControls />
    </CartProvider>
  )
}
