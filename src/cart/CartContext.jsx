import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { productById, clipsFor, DEFAULT_COLOR, isColorAvailable } from '../data'

const CartContext = createContext(null)
const STORAGE_KEY = 'sponge-cart-v3'
const KEY_V2 = 'sponge-cart-v2'
const KEY_V1 = 'sponge-cart-v1'

const newUid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `u_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

// Ensure a unit has exactly `clips` colors, padding with the default. Colors
// that are no longer offered (e.g. from a previously saved cart) fall back to
// the default so nobody can check out with a retired color.
function normalizeColors(colors, clips) {
  const arr = (Array.isArray(colors) ? colors.slice(0, clips) : []).map((c) =>
    isColorAvailable(c) ? c : DEFAULT_COLOR
  )
  while (arr.length < clips) arr.push(DEFAULT_COLOR)
  return arr
}

// State is an array of units: { uid, id, colors: string[] } (one color per clip).
function toUnits(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    // Hidden SKUs (e.g. the retired 2-Pack) are dropped from saved carts so
    // nobody can check out with a product we no longer offer.
    .filter((u) => u && productById(u.id) && !productById(u.id).hidden)
    .map((u) => ({
      uid: u.uid || newUid(),
      id: u.id,
      // v3 uses `colors`; v2 used a single `color`.
      colors: normalizeColors(u.colors ?? (u.color != null ? [u.color] : []), clipsFor(u.id)),
    }))
}

function load() {
  try {
    const v3 = localStorage.getItem(STORAGE_KEY)
    if (v3) return toUnits(JSON.parse(v3))
    const v2 = localStorage.getItem(KEY_V2)
    if (v2) return toUnits(JSON.parse(v2))
    // v1 was a { id: qty } map.
    const v1 = localStorage.getItem(KEY_V1)
    if (v1) {
      const map = JSON.parse(v1)
      const units = []
      for (const [id, qty] of Object.entries(map)) {
        if (!productById(id)) continue
        for (let i = 0; i < qty; i++) {
          units.push({ uid: newUid(), id, colors: normalizeColors([], clipsFor(id)) })
        }
      }
      return units
    }
    return []
  } catch {
    return []
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const qty = Math.max(1, action.qty || 1)
      const clips = clipsFor(action.id)
      const additions = Array.from({ length: qty }, () => ({
        uid: newUid(),
        id: action.id,
        colors: normalizeColors(action.colors, clips),
      }))
      return [...state, ...additions]
    }
    case 'setColor':
      return state.map((u) => {
        if (u.uid !== action.uid) return u
        const colors = u.colors.slice()
        colors[action.index] = action.color
        return { ...u, colors }
      })
    case 'remove':
      return state.filter((u) => u.uid !== action.uid)
    case 'clear':
      return []
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const value = useMemo(() => {
    const items = state
      .map((u) => {
        const product = productById(u.id)
        if (!product) return null
        return {
          ...product,
          uid: u.uid,
          colors: normalizeColors(u.colors, product.clips ?? 1),
          lineTotal: product.price,
        }
      })
      .filter(Boolean)
    const count = items.length
    const subtotal = items.reduce((n, i) => n + i.price, 0)
    return {
      items,
      count,
      subtotal,
      // colors: array (one per clip) or omit for all-default.
      add: (id, qty = 1, colors = null) => dispatch({ type: 'add', id, qty, colors }),
      setColor: (unitId, index, color) => dispatch({ type: 'setColor', uid: unitId, index, color }),
      remove: (unitId) => dispatch({ type: 'remove', uid: unitId }),
      clear: () => dispatch({ type: 'clear' }),
    }
  }, [state])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
