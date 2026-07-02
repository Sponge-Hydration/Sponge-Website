# Sponge Hydration — Website

Marketing site and store for **Sponge**, the smart clip-on hydration tracker that works with any water bottle.

Built with React 18, React Router 6, and Vite.

## Features

- **Multi-page site:** Home, Products, product detail, Caregivers, Setup & FAQ, Blog, About, Team, Contact, Account.
- **Working order flow:** add to cart → persistent cart (localStorage) → checkout → order confirmation.
- **Hydration dashboard:** goal ring, weekly chart, streaks, app-lock states, and sip log.
- **SEO:** per-route meta tags, canonical URLs, Product/FAQ/Organization JSON-LD, `sitemap.xml`, and `robots.txt`, optimized for terms like *hydration tracker* and *hydration tracking device*.
- **Legacy URL redirects** that map the previous site's paths to the new routes.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Project structure

```
src/
  pages/        Route components (Home, Products, Cart, Dashboard, ...)
  components/   Header, Footer, shared bits, useSEO hook
  cart/         Cart context (state + localStorage persistence)
  data.js       Products, blog posts, FAQs, testimonials, team
public/         robots.txt, sitemap.xml, manifest, favicon
```

## Deployment

Hosted on **Cloudflare Pages** (project `spongehydration`). Pushes to `main`
auto-deploy via GitHub Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

Checkout uses **Stripe hosted Checkout** with the order flow handled by Cloudflare
Pages Functions in [`functions/api/`](functions/api/). Paid orders are logged to a
Google Sheet and trigger confirmation emails — see
[docs/order-integrations.md](docs/order-integrations.md) for setup.

## Notes

- The dashboard uses sample data for preview purposes.
- Product imagery uses placeholders pending real photos.
