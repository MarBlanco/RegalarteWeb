/**
 * Payment: MercadoPagoProvider REAL (Checkout Pro vía Orders API).
 *
 * Este provider corre en el BROWSER pero NUNCA toca Mercado Pago
 * directamente ni maneja secretos: delega en el backend propio
 * (`/api/payments/mercadopago/*`), que usa el Access Token server-side.
 *
 * - `initiate`: el backend crea la Order en MP y devuelve SOLO el
 *   checkout_url; el UI redirige ahí (pago 100% fuera de nuestra app).
 * - `getStatus`: estado normalizado vía backend (sin secretos).
 * - `cancel`: no soportado desde la app (la orden expira sola en MP o
 *   se gestiona desde el panel de Mercado Pago). Lanza error explícito:
 *   jamás simula una cancelación.
 */

import type {
  PaymentCancelResult,
  PaymentInitInput,
  PaymentInitResult,
  PaymentProvider,
  PaymentStatusResult,
} from './types'
import { mapMpStatus } from '@/lib/mercadopago/orders'

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: unknown }
    if (typeof data?.error === 'string' && data.error) return data.error
  } catch {
    /* cuerpo no-JSON */
  }
  return fallback
}

export class MercadoPagoProvider implements PaymentProvider {
  readonly name = 'mercadopago'

  async initiate(input: PaymentInitInput): Promise<PaymentInitResult> {
    if (input.orderId === undefined || input.orderId === '') {
      throw new Error('MercadoPagoProvider: orderId es requerido')
    }
    if (!input.payerEmail) {
      throw new Error('MercadoPagoProvider: payerEmail es requerido')
    }
    let res: Response
    try {
      res = await fetch('/api/payments/mercadopago/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: input.orderId, email: input.payerEmail }),
      })
    } catch {
      throw new Error('MercadoPagoProvider: sin conexión con el servidor')
    }
    if (!res.ok) {
      throw new Error(await readError(res, 'No se pudo iniciar el pago'))
    }
    const data = (await res.json().catch(() => null)) as {
      checkoutUrl?: unknown
      externalId?: unknown
    } | null
    if (
      !data ||
      typeof data.checkoutUrl !== 'string' ||
      typeof data.externalId !== 'string'
    ) {
      throw new Error('MercadoPagoProvider: respuesta inválida del servidor')
    }
    return {
      status: 'ready',
      externalId: data.externalId,
      redirectUrl: data.checkoutUrl,
    }
  }

  async getStatus(externalId: string): Promise<PaymentStatusResult> {
    let res: Response
    try {
      res = await fetch(
        `/api/payments/mercadopago/orders/${encodeURIComponent(externalId)}`,
      )
    } catch {
      throw new Error('MercadoPagoProvider: sin conexión con el servidor')
    }
    if (!res.ok) {
      throw new Error(await readError(res, 'No se pudo consultar el pago'))
    }
    const data = (await res.json().catch(() => null)) as {
      status?: unknown
    } | null
    return {
      status: mapMpStatus(
        typeof data?.status === 'string' ? data.status : undefined,
      ),
      externalId,
    }
  }

  async cancel(): Promise<PaymentCancelResult> {
    throw new Error(
      'MercadoPagoProvider: la cancelación se gestiona desde el panel de Mercado Pago o por expiración de la orden',
    )
  }
}
