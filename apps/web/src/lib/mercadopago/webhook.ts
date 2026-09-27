/**
 * Mercado Pago — validación de webhooks y de órdenes para el pase a paid.
 *
 * SERVER-ONLY (node:crypto). Esquema oficial de firma:
 * - headers `x-signature: ts=<ts>,v1=<hash>` y `x-request-id: <uuid>`
 * - query `data.id=<resource-id>`
 * - manifiesto `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
 * - HMAC-SHA256 con el secret del dashboard, comparación timing-safe.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'
import type { MpOrder } from './client'

export { mapMpStatus } from './orders'

export interface WebhookParts {
  xSignature: string | null
  xRequestId: string | null
  dataId: string | null
  type: string | null
}

export function parseSignature(
  xSignature: string | null,
): { ts: string; v1: string } | null {
  if (!xSignature) return null
  const ts = xSignature.match(/(?:^|,\s*)ts=([^,]+)/)?.[1]?.trim()
  const v1 = xSignature.match(/(?:^|,\s*)v1=([^,]+)/)?.[1]?.trim()
  if (!ts || !v1) return null
  return { ts, v1 }
}

/** Manifiesto firmado según documentación oficial. */
export function buildManifest(
  dataId: string,
  xRequestId: string,
  ts: string,
): string {
  return `id:${dataId};request-id:${xRequestId};ts:${ts};`
}

/** true solo si la firma HMAC coincide exactamente. */
export function verifyWebhookSignature(
  parts: Pick<WebhookParts, 'xSignature' | 'xRequestId' | 'dataId'>,
  secret: string,
): boolean {
  if (!secret) return false
  const parsed = parseSignature(parts.xSignature)
  if (!parsed || !parts.xRequestId || !parts.dataId) return false
  const expected = createHmac('sha256', secret)
    .update(buildManifest(parts.dataId, parts.xRequestId, parsed.ts))
    .digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(parsed.v1, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export interface PaidValidation {
  ok: boolean
  /** Motivo legible para logs (nunca se expone tal cual al cliente). */
  reason: string
}

function toNumber(value: unknown): number | null {
  const n = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN
  return Number.isFinite(n) ? n : null
}

/**
 * Reglas mínimas para permitir pending → paid:
 * - es la orden correcta (id presente)
 * - external_reference coincide con nuestro orderNumber
 * - status `processed` (todas las transacciones procesadas)
 * - currency ARS
 * - total_amount de MP == nuestro total
 * - total_paid_amount >= total_amount
 */
export function validateMpOrderForPaid(
  mpOrder: MpOrder,
  expected: { orderNumber: string; total: number },
): PaidValidation {
  if (!mpOrder || typeof mpOrder.id !== 'string' || !mpOrder.id) {
    return { ok: false, reason: 'mp-order-sin-id' }
  }
  if (mpOrder.external_reference !== expected.orderNumber) {
    return { ok: false, reason: 'external-reference-mismatch' }
  }
  if (mpOrder.status !== 'processed') {
    return { ok: false, reason: `mp-status-${mpOrder.status ?? 'unknown'}` }
  }
  if (mpOrder.currency !== 'ARS') {
    return { ok: false, reason: `currency-${mpOrder.currency ?? 'unknown'}` }
  }
  const mpTotal = toNumber(mpOrder.total_amount)
  const mpPaid = toNumber(mpOrder.total_paid_amount)
  if (mpTotal === null || mpTotal !== expected.total) {
    return { ok: false, reason: 'monto-mismatch' }
  }
  if (mpPaid === null || mpPaid < mpTotal) {
    return { ok: false, reason: 'no-acreditado' }
  }
  return { ok: true, reason: 'ok' }
}
