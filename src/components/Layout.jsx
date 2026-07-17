import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { ScrollToTop } from './bits'
import { CartProvider } from '../cart/CartContext'

export default function Layout() {
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
