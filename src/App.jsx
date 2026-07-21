import Layout from './components/Layout'
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
import OrderStatus from './pages/OrderStatus'
import Legal from './pages/Legal'
import NotFound from './pages/NotFound'
import { visibleProducts, blogPosts } from './data'

// react-router data routes, consumed by vite-react-ssg for prerendering.
// Legacy Squarespace paths are handled by 301s in public/_redirects, not here.
export const routes = [
  {
    path: '/',
    element: <Layout />,
    entry: 'src/components/Layout.jsx',
    children: [
      { index: true, element: <Home /> },
      { path: 'products', element: <Products /> },
      {
        path: 'shop/p/:slug',
        element: <ProductDetail />,
        getStaticPaths: () => visibleProducts.map((p) => `shop/p/${p.slug}`),
      },
      { path: 'cart', element: <Cart /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'caregivers', element: <Caregivers /> },
      { path: 'how-it-works', element: <HowItWorks /> },
      { path: 'blog', element: <Blog /> },
      {
        path: 'blog/:slug',
        element: <BlogPost />,
        getStaticPaths: () => blogPosts.map((p) => `blog/${p.slug}`),
      },
      { path: 'about', element: <About /> },
      { path: 'team', element: <Team /> },
      { path: 'contact', element: <Contact /> },
      { path: 'account', element: <Account /> },
      { path: 'order-status', element: <OrderStatus /> },
      // Prerendered to dist/404.html; Cloudflare Pages serves it with a real 404
      // status for unmatched paths. The '*' route below handles client-side nav.
      { path: '404', element: <NotFound /> },
      {
        path: 'legal/:doc',
        element: <Legal />,
        getStaticPaths: () => ['legal/terms', 'legal/privacy', 'legal/returns', 'legal/warranty'],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]

export default routes
