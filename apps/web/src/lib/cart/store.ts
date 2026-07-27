/**
 * Cart: store Zustand con persistencia en localStorage.
 *
 * Decisiones arquitectonicas (Infraestructura del carrito - Sprint 3 paso 1):
 * - Un solo store global, sin provider adicional: Zustand reemplaza Redux/Context.
 * - Persistencia en `localStorage` con key versionada (`regalarte-cart-v1`)
 *   para permitir migraciones futuras sin colisionar con el codigo legado
 *   que persiste en `regalarte-cart` (use-cart.ts original).
 * - Acciones puras y deterministas: un mismo input produce el mismo output.
 * - Snapshot por-item: el store nunca muta un CartItem; lo reemplaza.
 * - Sin UI aqui: drawer / page / checkout / Mercado Pago viven en pasos posteriores.
 */

'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type {
  CartItem,
  CartItemInput,
  CartMode,
  CartProductSnapshot,
} from './types'
import { clampQuantity, getTotals, resolveUnitPrice } from './pricing'

interface CartState {
  items: CartItem[]
  mode: CartMode
  /** marca si la rehidratacion desde localStorage ya ocurrio (evita mismatch SSR) */
  hydrated: boolean

  addItem: (input: CartItemInput) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void

  setMode: (mode: CartMode) => void
  setWholesale: (value: boolean) => void

  /** Tests/debug: marca manualmente la rehidratacion */
  markHydrated: () => void
}

interface PersistedCartSnapshotV1 {
  state: {
    items: CartItem[]
    mode: CartMode
  }
  version: number
}

const PERSIST_KEY = 'regalarte-cart-v1'
const PERSIST_VERSION = 1

function buildSnapshot(input: CartItemInput): CartProductSnapshot {
  return {
    id: input.id,
    productId: input.productId,
    slug: input.slug,
    name: input.name,
    price: input.price,
    compareAtPrice: input.compareAtPrice ?? null,
    wholesalePrice: input.wholesalePrice ?? null,
    isWholesaleAvailable: Boolean(input.isWholesaleAvailable),
    image: input.image ?? null,
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      mode: 'RETAIL',
      hydrated: false,

      addItem: (input) =>
        set((state) => {
          const incomingPrice = input.price
          const targetId = input.id
          const quantityToAdd = Math.max(1, Math.floor(input.quantity))

          const existing = state.items.find((i) => i.id === targetId)
          if (existing) {
            return {
              items: state.items.map((i) => {
                if (i.id !== targetId) return i
                return {
                  ...i,
                  quantity: i.quantity + quantityToAdd,
                  price: incomingPrice,
                  wholesalePrice: input.wholesalePrice ?? i.wholesalePrice,
                  compareAtPrice:
                    input.compareAtPrice !== undefined
                      ? input.compareAtPrice
                      : i.compareAtPrice,
                }
              }),
            }
          }

          const snapshot = buildSnapshot(input)
          return {
            items: [...state.items, { ...snapshot, quantity: quantityToAdd }],
          }
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.id !== id) }
          }
          return {
            items: state.items.map((i) =>
              i.id === id
                ? { ...i, quantity: clampQuantity(quantity) }
                : i,
            ),
          }
        }),

      clearCart: () => set({ items: [] }),

      setMode: (mode) => set({ mode }),

      setWholesale: (value) =>
        set({ mode: value ? 'WHOLESALE' : 'RETAIL' }),

      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: PERSIST_KEY,
      version: PERSIST_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        mode: state.mode,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated()
      },
      migrate: (persistedState, _version) => {
        // Soporte defensivo: si en futuro hay v0 -> v1 esto dormaliza.
        if (!persistedState || typeof persistedState !== 'object') {
          return { items: [], mode: 'RETAIL' }
        }
        const raw = persistedState as Partial<PersistedCartSnapshotV1['state']>
        return {
          items: Array.isArray(raw.items) ? raw.items : [],
          mode: raw.mode === 'WHOLESALE' ? 'WHOLESALE' : 'RETAIL',
        }
      },
    },
  ),
)

// ---- Selectors utilitarios (estan pensados para que la UI no repita logica) ----

export const selectUnitPrice = (item: CartItem, mode: CartMode): number =>
  resolveUnitPrice(item, mode)

export const selectTotals = (state: Pick<CartState, 'items' | 'mode'>) =>
  getTotals(state.items, state.mode)

export const selectItemCount = (state: Pick<CartState, 'items'>) =>
  state.items.reduce((acc, i) => acc + i.quantity, 0)

export const selectHasItems = (state: Pick<CartState, 'items'>) =>
  state.items.length > 0
