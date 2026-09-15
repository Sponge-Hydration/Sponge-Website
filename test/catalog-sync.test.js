// The catalog lives in three places that are kept in sync by hand: src/data.js
// (what the shop shows), src/shipping.js (what the cart quotes) and
// functions/api/create-checkout-session.js (what Stripe actually charges). A
// product added to one and missed in another either cannot be bought, or is
// charged a price or shipping rate the page never showed. These tests fail
// before that reaches a customer.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { products } from '../src/data.js'
import { SKU_WEIGHT_OZ, shippingForCart } from '../src/shipping.js'

const server = readFileSync(
  path.resolve(process.cwd(), 'functions/api/create-checkout-session.js'),
  'utf8'
)

// { id: cents } from the server's CATALOG literal.
const serverAmounts = Object.fromEntries(
  [...server.matchAll(/'([a-z0-9-]+)':\s*\{\s*name:\s*'[^']*',\s*amount:\s*(\d+)/g)].map((m) => [m[1], Number(m[2])])
)

// The server's SKU_WEIGHT_OZ object literal.
const serverWeights = Object.fromEntries(
  [...server.match(/const SKU_WEIGHT_OZ = \{([^}]*)\}/)[1].matchAll(/'([a-z0-9-]+)':\s*(\d+)/g)].map((m) => [m[1], Number(m[2])])
)

const purchasable = products.filter((p) => !p.hidden && !p.soldOut)

describe('the shop, the cart and Stripe agree on the catalog', () => {
  it('prices every purchasable product on the server at the price the page shows', () => {
    for (const p of purchasable) {
      expect(serverAmounts[p.id], `${p.id} missing from the server CATALOG`).toBeDefined()
      expect(serverAmounts[p.id], `${p.id} price`).toBe(Math.round(p.price * 100))
    }
  })

  it('does not let the server sell anything the shop does not offer', () => {
    const offered = new Set(purchasable.map((p) => p.id))
    for (const id of Object.keys(serverAmounts)) expect(offered.has(id), id).toBe(true)
  })

  it('weighs every purchasable product the same on the client and the server', () => {
    expect(serverWeights).toEqual(SKU_WEIGHT_OZ)
    for (const p of purchasable) {
      expect(SKU_WEIGHT_OZ[p.id], `${p.id} has no shipping weight`).toBeDefined()
    }
  })
})

describe('the Sponge Dot', () => {
  const dot = products.find((p) => p.id === 'sponge-dot')

  it('is $29.99 and has no colour choice', () => {
    expect(dot.price).toBe(29.99)
    expect(dot.clips).toBe(0)
  })

  it('ships one to three Dots for the same rate as a single clip', () => {
    const clip = shippingForCart([{ id: 'sponge-clip', qty: 1 }])
    for (const qty of [1, 2, 3]) expect(shippingForCart([{ id: 'sponge-dot', qty }])).toBe(clip)
  })

  it('makes no sensor or measurement claim', () => {
    const copy = [dot.tagline, dot.short, ...dot.features].join(' ').toLowerCase()
    for (const banned of ['automatic', 'sip tracking', 'accura', 'sensor', 'battery', 'app-lock', 'app lock']) {
      expect(copy, `Dot copy claims "${banned}"`).not.toContain(banned)
    }
  })
})
