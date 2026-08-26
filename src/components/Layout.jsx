import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { ScrollToTop } from './bits'
import { CartProvider } from '../cart/CartContext'
import { initAnalytics, trackPageView } from '../analytics'

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

  return (
    <CartProvider>
      <a href="#main" className="skip-link">Skip to content</a>
      <ScrollToTop />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </CartProvider>
  )
}
