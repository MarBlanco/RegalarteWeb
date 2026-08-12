/**
 * Orders: calculo puro de lineas y totales a partir de precios de la DB.
 *
 * AUDIT-004: los precios de la orden NO se toman del payload del cliente.
 * `buildLinesFromProducts` resuelve el precio unitario desde el Producto
 * en la base (via `ProductPricingSource`) aplicando las reglas de pricing
 * de `lib/cart/pricing.ts`. El snapshot que recibe del cliente solo aporta
 * `id` (variante), `productId` y `quantity`; identidad y precios provienen
 * de la DB.
 *
 * Se rechaza la orden (OrderRejectedError) si el producto no existe o no
 * esta activo, evitando crear ordenes de productos inexistentes o
 * despublicados.
 */

import { resolveUnitPrice } from '@/lib/cart/pricing'
import type { CartProductSnapshot, CartMode } from '@/lib/cart/types'
import type {
  CreateOrderInput,
  OrderItemLine,
  OrderTotals,
} from './types'

/**
 * Subconjunto de campos de Product que el pricing server-side necesita.
 * Permite desacoplar el calculo del tipo generado de Payload y testear
 * sin cargar la config.
 */
export interface ProductPricingSource {
  id: number
  title: string
  slug: string
  price: number
  compareAtPrice?: number | null
  wholesalePrice?: number | null
  isWholesaleAvailable?: boolean | null
  active?: boolean | null
}

/** Error tipado para productos no disponibles. El route handler lo traduce a HTTP. */
export class OrderRejectedError extends Error {}

export function parseProductId(productId: string): number {
  const n = Number.parseInt(productId, 10)
  return Number.isFinite(n) && n > 0 ? n : NaN
}

function buildSnapshot(
  item: CreateOrderInput['items'][number],
  product: ProductPricingSource,
): CartProductSnapshot {
  return {
    id: item.id,
    productId: item.productId,
    slug: product.slug,
    name: product.title,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    wholesalePrice: product.wholesalePrice ?? null,
    isWholesaleAvailable: Boolean(product.isWholesaleAvailable),
    image: item.image ?? null,
  }
}

function normalizeQuantity(value: number): number {
  return Math.max(1, Math.floor(value))
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function buildLinesFromProducts(
  input: CreateOrderInput,
  productsById: ReadonlyMap<number, ProductPricingSource>,
): OrderItemLine[] {
  return input.items.map((item) => {
    const productId = parseProductId(item.productId)
    const product = productsById.get(productId)

    if (!product || product.active === false) {
      throw new OrderRejectedError(
        `Producto no disponible (id=${item.productId})`,
      )
    }

    const quantity = normalizeQuantity(item.quantity)
    const unitPrice = resolveUnitPrice(buildSnapshot(item, product), input.mode)
    const lineTotal = roundMoney(unitPrice * quantity)

    return {
      productId: item.productId,
      slug: product.slug,
      name: product.title,
      quantity,
      unitPrice,
      lineTotal,
    }
  })
}

export function buildTotals(lines: ReadonlyArray<OrderItemLine>): OrderTotals {
  const subtotal = roundMoney(
    lines.reduce((acc, line) => acc + line.lineTotal, 0),
  )
  return {
    subtotal,
    shipping: 0,
    total: subtotal,
  }
}