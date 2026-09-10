/**
 * Wishlist: store Zustand con persistencia en localStorage.
 *
 * Decisiones arquitectonicas:
 * - Un solo store global, sin provider adicional: Zustand.
 * - Persistencia en `localStorage` con key versionada (`regalarte-wishlist-v1`)
 * - Acciones puras y deterministas.
 * - Sin UI aqui: pagina / botones viven en componentes.
 */

'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface WishlistItem {
  id: string
  productId: string
  slug: string
  name: string
  price: number
  compareAtPrice: number | null
  wholesalePrice: number | null
  isWholesaleAvailable: boolean
  image: string | null
  addedAt: number
}

interface WishlistState {
  items: WishlistItem[]
  hydrated: boolean

  addItem: (item: Omit<WishlistItem, 'addedAt'>) => void
  removeItem: (id: string) => void
  clearWishlist: () => void
  isInWishlist: (id: string) => boolean
  toggleItem: (item: Omit<WishlistItem, 'addedAt'>) => void

  markHydrated: () => void
}

const PERSIST_KEY = 'regalarte-wishlist-v1'
const PERSIST_VERSION = 1

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,

      addItem: (item) =>
        set((state) => {
          if (state.items.find((i) => i.id === item.id)) {
            return state
          }
          return {
            items: [...state.items, { ...item, addedAt: Date.now() }],
          }
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      clearWishlist: () => set({ items: [] }),

      isInWishlist: (id) => get().items.some((i) => i.id === id),

      toggleItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id)
          if (existing) {
            return { items: state.items.filter((i) => i.id !== item.id) }
          }
          return { items: [...state.items, { ...item, addedAt: Date.now() }] }
        }),

      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'regalarte-wishlist-v1',
      version: PERSIST_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated()
      },
      migrate: (persistedState, _version) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return { items: [] }
        }
        const raw = persistedState as { items?: unknown[] }
        return {
          items: Array.isArray(raw.items) ? raw.items : [],
        }
      },
    },
  ),
)

export const selectWishlistCount = (state: { items: WishlistItem[] }) =>
  state.items.length

export const selectIsInWishlist = (state: { items: WishlistItem[] }, id: string) =>
  state.items.some((i) => i.id === id)