import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  qty: number
  type: 'product' | 'service'
}

interface CartContextType {
  items: CartItem[]
  total: number
  count: number
  add: (item: Omit<CartItem, 'qty'>) => void
  remove: (id: string) => void
  increment: (id: string) => void
  decrement: (id: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const count = items.reduce((s, i) => s + i.qty, 0)

  const add = useCallback((item: Omit<CartItem, 'qty'>) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === item.id)
      if (exists) return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...item, qty: 1 }]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const increment = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty: i.qty + 1 } : i))
  }, [])

  const decrement = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty - 1) } : i)
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  return (
    <CartContext.Provider value={{ items, total, count, add, remove, increment, decrement, clear }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be inside CartProvider')
  return ctx
}
