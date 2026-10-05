/**
 * Orders: service que crea una Order en Payload a partir de un input
 * ya validado por el route handler.
 *
 * Responsabilidades:
 *  - generar `orderNumber` unico.
 *  - calcular totales server-side desde PRECIOS DE LA DB (AUDIT-004):
 *    el payload del cliente solo aporta carrito (productId + quantity);
 *    identidad, precio unitario y totales se resuelven consultando
 *    Products en Payload. Se rechaza la orden si el producto no existe,
 *    no esta activo o no esta comprable (agotado).
 *  - persistir via `payload.create`.
 *
 * El service NO se llama desde el cliente. Solo desde
 * `app/api/orders/route.ts`.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { randomBytes } from 'crypto'
import { signOrderId } from '@/lib/mercadopago/return-urls'

import type {
  CreateOrderInput,
  CreateOrderResult,
} from './types'
import {
  buildLinesFromProducts,
  buildTotals,
  OrderRejectedError,
  parseProductId,
  type ProductPricingSource,
} from './lines'
import { couponDiscount, getCoupon } from './coupons'

function buildOrderNumber(now: Date): string {
  const year = now.getUTCFullYear()
  // Random suffix evita colisiones dentro del mismo timestamp.
  // crypto.randomBytes(3) -> 6 hex chars, cryptographically secure.
  const suffix = randomBytes(3).toString('hex').toUpperCase()
  return `RG-${year}-${suffix}`
}

async function loadProducts(ids: number[]): Promise<
  ReadonlyMap<number, ProductPricingSource>
> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'products',
    where: { id: { in: ids } },
    limit: Math.max(1, ids.length),
    depth: 0,
  })
  return new Map(
    docs.map((p) => [p.id, p as unknown as ProductPricingSource]),
  )
}

export { OrderRejectedError }

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const ids = Array.from(
    new Set(input.items.map((item) => parseProductId(item.productId))),
  )
  if (ids.length === 0) {
    throw new OrderRejectedError('Carrito sin productos validos')
  }

  // El cupón se valida acá (autoridad): el cliente solo sugiere el código.
  const coupon = input.couponCode ? getCoupon(input.couponCode) : null
  if (input.couponCode && !coupon) {
    throw new OrderRejectedError('Cupón inválido', 'INVALID_COUPON')
  }

  const productsById = await loadProducts(ids)
  const lines = buildLinesFromProducts(input, productsById)
  const subtotal = buildTotals(lines).subtotal
  const discount = coupon ? couponDiscount(subtotal, coupon) : 0
  const totals = buildTotals(lines, discount)

  const payload = await getPayload({ config })

  const order = await payload.create({
    collection: 'orders',
    data: {
      orderNumber: buildOrderNumber(new Date()),
      status: 'pending',
      mode: input.mode,
      customer: input.customer,
      address: input.address,
      notes: input.notes ?? { message: '' },
      items: lines.map((line) => ({
        product: Number.parseInt(line.productId, 10),
        slug: line.slug,
        name: line.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      })),
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      couponCode: coupon ? coupon.code : null,
      discount: totals.discount,
      total: totals.total,
    },
    depth: 0,
  })

  return {
    status: 'success',
    orderId: String(order.id),
    // URL provista al provider para que el checkout sepa a donde volver.
    // Sin pasarela externa (provider mock) es la confirmación del pedido,
    // firmada para que solo quien creó la orden pueda consultarla.
    redirectUrl: `/checkout/orden/${order.id}?sig=${signOrderId(
      order.id as number,
      process.env.PAYLOAD_SECRET ?? '',
    )}`,
  }
}