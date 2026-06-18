import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { productById } from '../data'

const CartContext = createContext(null)
const STORAGE_KEY = 'sponge-cart-v1'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const qty = (state[action.id] || 0) + (action.qty || 1)
      return { ...state, [action.id]: qty }
    }
    case 'setQty': {
      const next = { ...state }
      if (action.qty <= 0) delete next[action.id]
      else next[action.id] = action.qty
      return next
    }
    case 'remove': {
      const next = { ...state }
      delete next[action.id]
      return next
    }
    case 'clear':
      return {}
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
    const items = Object.entries(state)
      .map(([id, qty]) => {
        const product = productById(id)
        return product ? { ...product, qty, lineTotal: product.price * qty } : null
      })
      .filter(Boolean)
    const count = items.reduce((n, i) => n + i.qty, 0)
    const subtotal = items.reduce((n, i) => n + i.lineTotal, 0)
    return {
      items,
      count,
      subtotal,
      add: (id, qty = 1) => dispatch({ type: 'add', id, qty }),
      setQty: (id, qty) => dispatch({ type: 'setQty', id, qty }),
      remove: (id) => dispatch({ type: 'remove', id }),
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
