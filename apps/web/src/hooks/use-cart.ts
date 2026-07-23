import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuth } from '@/hooks/use-auth'

export interface CartItem {
  id: string
  productId: string
  slug: string
  name: string
  price: number
  wholesalePrice?: number | null
  quantity: number
  image?: string
  variant?: string
}

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i,
              ),
            }
          }
          return { items: [...state.items, item] }
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter((i) => i.id !== id)
            : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        const state = get()
        // Access isWholesale from useAuth store directly
        const isWholesale = useAuth.getState().isWholesale()
        return state.items.reduce((total, item) => {
          const price = isWholesale && item.wholesalePrice ? item.wholesalePrice : item.price
          return total + price * item.quantity
        }, 0)
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: 'regalarte-cart',
    },
  ),
)