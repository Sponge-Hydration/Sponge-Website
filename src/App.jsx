import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import { ScrollToTop } from './components/bits'

import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Dashboard from './pages/Dashboard'
import Caregivers from './pages/Caregivers'
import HowItWorks from './pages/HowItWorks'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import About from './pages/About'
import Team from './pages/Team'
import Contact from './pages/Contact'
import Account from './pages/Account'
import Legal from './pages/Legal'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <ScrollToTop />
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/shop/p/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/caregivers" element={<Caregivers />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/about" element={<About />} />
          <Route path="/team" element={<Team />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/account" element={<Account />} />
          <Route path="/legal/:doc" element={<Legal />} />

          {/* Legacy URL redirects (match the old site's paths) */}
          <Route path="/products-1" element={<Navigate to="/products" replace />} />
          <Route path="/sponge-for-caregivers" element={<Navigate to="/caregivers" replace />} />
          <Route path="/aboutus" element={<Navigate to="/about" replace />} />
          <Route path="/accounts" element={<Navigate to="/account" replace />} />
          <Route path="/terms-of-service" element={<Navigate to="/legal/terms" replace />} />
          <Route path="/privacy-policy" element={<Navigate to="/legal/privacy" replace />} />
          <Route path="/return-policy" element={<Navigate to="/legal/returns" replace />} />
          <Route path="/warranty-policy" element={<Navigate to="/legal/warranty" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
