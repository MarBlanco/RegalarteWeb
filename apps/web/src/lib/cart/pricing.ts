/**
 * Cart: pricing resolvers.
 *
 * ReglasValidadas:
 * - precio minorista siempre es item.price
 * - precio mayorista solo aplica si:
 *     (a) el modo del carrito es WHOLESALE,
 *     (b) el producto esta habilitado para venta mayorista (`isWholesaleAvailable`),
 *     (c) y ademas wholesalePrice esta definido y es >= 0.
 * - Si WHOLESALE no aplica por cualquier motivo, fallback a retail_price.
 * - El total nunca puede ser negativo.
 */

import type {
  CartItem,
  CartMode,
  CartProductSnapshot,
  CartTotals,
} from './types'

export function resolveUnitPrice(
  item: CartProductSnapshot,
  mode: CartMode,
): number {
  const retailPrice = item.price
  if (mode === 'WHOLESALE' && item.isWholesaleAvailable) {
    if (
      typeof item.wholesalePrice === 'number' &&
      Number.isFinite(item.wholesalePrice) &&
      item.wholesalePrice >= 0
    ) {
      return item.wholesalePrice
    }
  }
  return retailPrice
}

export function getItemCount(items: ReadonlyArray<CartItem>): number {
  return items.reduce((acc, item) => acc + item.quantity, 0)
}

export function getSubtotal(
  items: ReadonlyArray<CartItem>,
  mode: CartMode,
): number {
  return items.reduce((acc, item) => {
    const unit = resolveUnitPrice(item, mode)
    return acc + unit * item.quantity
  }, 0)
}

export function hasWholesaleEligibleItem(
  items: ReadonlyArray<CartItem>,
): boolean {
  return items.some((item) => item.isWholesaleAvailable)
}

export function getTotals(
  items: ReadonlyArray<CartItem>,
  mode: CartMode,
): CartTotals {
  const subtotal = Math.max(0, getSubtotal(items, mode))
  return {
    subtotal,
    itemCount: getItemCount(items),
    hasWholesaleItems: hasWholesaleEligibleItem(items),
    items,
  }
}

/**
 * Cap de cantidad aplicado al store. Reglas:
 * - quantity minima = 0 (cero elimina el item)
 * - maxima depende del stock provisto; si no se provee stock, no se acota.
 */
export function clampQuantity(requested: number, stock?: number | null): number {
  if (!Number.isFinite(requested)) return 0
  const lower = Math.max(0, Math.floor(requested))
  if (typeof stock === 'number' && Number.isFinite(stock) && stock > 0) {
    return Math.min(lower, stock)
  }
  return lower
}
