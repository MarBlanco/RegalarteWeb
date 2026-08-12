/**
 * Orders: service que crea una Order en Payload a partir de un input
 * ya validado por el route handler.
 *
 * Responsabilidades:
 *  - generar `orderNumber` unico.
 *  - calcular totales server-side desde el snapshot de items.
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
  OrderItemLine,
  OrderTotals,
} from './types'
import { resolveUnitPrice } from '@/lib/cart/pricing'

function buildOrderNumber(now: Date): string {
  const year = now.getUTCFullYear()
  // Random suffix evita colisiones dentro del mismo timestamp.
  // crypto.randomBytes(3) -> 6 hex chars, cryptographically secure.
  const suffix = randomBytes(3).toString('hex').toUpperCase()
  return `RG-${year}-${suffix}`
}

function buildItemLines(input: CreateOrderInput): OrderItemLine[] {
  return input.items.map((item) => {
    const unitPrice = resolveUnitPrice(item, input.mode)
    const lineTotal = unitPrice * item.quantity
    return {
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
    }
  })
}

function buildTotals(lines: ReadonlyArray<OrderItemLine>): OrderTotals {
  const subtotal = lines.reduce((acc, line) => acc + line.lineTotal, 0)
  return {
    subtotal,
    shipping: 0,
    total: subtotal,
  }
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const lines = buildItemLines(input)
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
