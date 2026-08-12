import { describe, it, expect } from 'vitest'
import {
  resolveUnitPrice,
  getItemCount,
  getSubtotal,
  getTotals,
  hasWholesaleEligibleItem,
  clampQuantity,
} from '@/lib/cart/pricing'
import type { CartItem, CartMode } from '@/lib/cart/types'

const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 'item-1',
  productId: 'prod-1',
  slug: 'test-product',
  name: 'Test Product',
  price: 10000,
  compareAtPrice: null,
  wholesalePrice: 8000,
  isWholesaleAvailable: true,
  image: null,
  quantity: 1,
  ...overrides,
})

describe('Cart Pricing', () => {
  describe('resolveUnitPrice', () => {
    it('returns retail price in RETAIL mode', () => {
      const item = makeItem({ price: 10000, wholesalePrice: 8000, isWholesaleAvailable: true })
      expect(resolveUnitPrice(item, 'RETAIL')).toBe(10000)
    })

    it('returns wholesale price in WHOLESALE mode when available', () => {
      const item = makeItem({ price: 10000, wholesalePrice: 8000, isWholesaleAvailable: true })
      expect(resolveUnitPrice(item, 'WHOLESALE')).toBe(8000)
    })

    it('falls back to retail price in WHOLESALE when wholesale not available', () => {
      const item = makeItem({ price: 10000, wholesalePrice: 8000, isWholesaleAvailable: false })
      expect(resolveUnitPrice(item, 'WHOLESALE')).toBe(10000)
    })

    it('falls back to retail price when wholesalePrice is null', () => {
      const item = makeItem({ price: 10000, wholesalePrice: null, isWholesaleAvailable: true })
      expect(resolveUnitPrice(item, 'WHOLESALE')).toBe(10000)
    })

    it('falls back to retail price when wholesalePrice is negative', () => {
      const item = makeItem({ price: 10000, wholesalePrice: -1, isWholesaleAvailable: true })
      expect(resolveUnitPrice(item, 'WHOLESALE')).toBe(10000)
    })
  })

  describe('getItemCount', () => {
    it('sums quantities correctly', () => {
      const items = [makeItem({ quantity: 2 }), makeItem({ id: 'item-2', quantity: 3 })]
      expect(getItemCount(items)).toBe(5)
    })

    it('returns 0 for empty array', () => {
      expect(getItemCount([])).toBe(0)
    })
  })

  describe('getSubtotal', () => {
    it('calculates subtotal in RETAIL mode', () => {
      const items = [
        makeItem({ price: 10000, quantity: 2 }),
        makeItem({ id: 'item-2', price: 5000, quantity: 1 }),
      ]
      expect(getSubtotal(items, 'RETAIL')).toBe(25000)
    })

    it('calculates subtotal in WHOLESALE mode with wholesale prices', () => {
      const items = [
        makeItem({ price: 10000, wholesalePrice: 8000, quantity: 2 }),
        makeItem({ id: 'item-2', price: 5000, wholesalePrice: 4000, quantity: 1 }),
      ]
      expect(getSubtotal(items, 'WHOLESALE')).toBe(20000)
    })

    it('uses retail price for items without wholesale in WHOLESALE mode', () => {
      const items = [
        makeItem({ price: 10000, wholesalePrice: 8000, quantity: 1 }),
        makeItem({ id: 'item-2', price: 5000, wholesalePrice: null, quantity: 1 }),
      ]
      // item1 uses wholesale 8000, item2 falls back to retail 5000 = 13000
      expect(getSubtotal(items, 'WHOLESALE')).toBe(13000)
    })
  })

  describe('getTotals', () => {
    it('returns correct totals structure', () => {
      const items = [makeItem({ price: 10000, quantity: 2 })]
      const totals = getTotals(items, 'RETAIL')
      expect(totals).toEqual({
        subtotal: 20000,
        itemCount: 2,
        hasWholesaleItems: true,
        items,
      })
    })

    it('subtotal never negative', () => {
      const totals = getTotals([], 'RETAIL')
      expect(totals.subtotal).toBe(0)
    })
  })

  describe('hasWholesaleEligibleItem', () => {
    it('returns true when any item has wholesale available', () => {
      const items = [
        makeItem({ isWholesaleAvailable: false }),
        makeItem({ id: 'item-2', isWholesaleAvailable: true }),
      ]
      expect(hasWholesaleEligibleItem(items)).toBe(true)
    })

    it('returns false when no items have wholesale', () => {
      const items = [makeItem({ isWholesaleAvailable: false })]
      expect(hasWholesaleEligibleItem(items)).toBe(false)
    })
  })

  describe('clampQuantity', () => {
    it('clamps to 0 for negative quantity', () => {
      expect(clampQuantity(-5)).toBe(0)
    })

    it('clamps to 0 for NaN', () => {
      expect(clampQuantity(NaN)).toBe(0)
    })

    it('floors decimal quantities', () => {
      expect(clampQuantity(3.7)).toBe(3)
    })

    it('respects stock limit', () => {
      expect(clampQuantity(10, 5)).toBe(5)
    })

    it('ignores null/undefined stock', () => {
      expect(clampQuantity(10, null)).toBe(10)
      expect(clampQuantity(10, undefined)).toBe(10)
    })

    it('ignores zero or negative stock', () => {
      expect(clampQuantity(10, 0)).toBe(10)
      expect(clampQuantity(10, -1)).toBe(10)
    })
  })
})