/**
 * Orders: service que crea una Order en Payload a partir de un input
 * ya validado por el route handler.
 *
 * Responsabilidades:
 *  - generar `orderNumber` unico.
 *  - calcular totales server-side desde PRECIOS DE LA DB (AUDIT-004):
 *    el payload del cliente solo aporta carrito (productId + quantity);
 *    identidad, precio unitario y totales se resuelven consultando
 *    Products en Payload. Se rechaza la orden si el producto no existe
 *    o no esta activo.
 *  - persistir via `payload.create`.
 *
 * El service NO se llama desde el cliente. Solo desde
 * `app/api/orders/route.ts`.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { randomBytes } from 'crypto'

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

  const productsById = await loadProducts(ids)
  const lines = buildLinesFromProducts(input, productsById)
  const totals = buildTotals(lines)

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
      total: totals.total,
    },
    depth: 0,
  })

  return {
    status: 'success',
    orderId: String(order.id),
    // URL provista al provider para que el checkout sepa a donde volver.
    // Hoy apunta a una ruta mock; TICKET-010 la cambiara por la URL real
    // del proveedor de pago.
    redirectUrl: `/checkout/orden/${order.id}?status=mock-success`,
  }
}