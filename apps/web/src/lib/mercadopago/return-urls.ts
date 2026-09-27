/**
 * URLs de retorno del pago (success/failure/pending).
 *
 * Llevan `order` + firma HMAC con secreto server-only: las páginas
 * verifican la firma y muestran el estado consultando NUESTRO backend,
 * nunca los query params. Evita enumerar pedidos ajenos por ID.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

export type PaymentReturnResult = 'success' | 'failure' | 'pending'

export function signOrderId(orderId: number, secret: string): string {
  return createHmac('sha256', secret).update(`order:${orderId}`).digest('hex')
}

export function verifyOrderSig(
  orderId: number,
  sig: string | null,
  secret: string,
): boolean {
  if (!secret || !sig) return false
  const expected = Buffer.from(signOrderId(orderId, secret), 'utf8')
  const actual = Buffer.from(sig, 'utf8')
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}

export function buildBackUrls(
  appUrl: string,
  orderId: number,
  secret: string,
): { successUrl: string; failureUrl: string; pendingUrl: string } {
  const base = appUrl.replace(/\/$/, '')
  const sig = signOrderId(orderId, secret)
  const qs = `order=${orderId}&sig=${sig}`
  return {
    successUrl: `${base}/checkout/pago/success?${qs}`,
    failureUrl: `${base}/checkout/pago/failure?${qs}`,
    pendingUrl: `${base}/checkout/pago/pending?${qs}`,
  }
}

export function isReturnResult(value: unknown): value is PaymentReturnResult {
  return value === 'success' || value === 'failure' || value === 'pending'
}
