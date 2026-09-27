/**
 * Mercado Pago Orders API — cliente REST mínimo (fetch, sin SDK).
 *
 * SERVER-ONLY: el Access Token jamás sale del servidor. Nunca importar
 * este módulo (tampoco `webhook.ts` ni `return-urls.ts`, que usan
 * node:crypto) desde componentes de cliente. `orders.ts` sí es puro y
 * puede usarse en ambos lados.
 */

const MP_API_BASE = 'https://api.mercadopago.com'

function isPlaceholder(value: string | undefined): boolean {
  return (
    !value || value.trim() === '' || value.startsWith('placeholder')
  )
}

/** Access Token server-side o null si no está configurado. */
export function getMpAccessToken(): string | null {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  return isPlaceholder(token) ? null : (token as string)
}

/** Secret del webhook (dashboard MP) o null si no está configurado. */
export function getMpWebhookSecret(): string | null {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  return isPlaceholder(secret) ? null : (secret as string)
}

export class MpError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export interface MpPaymentTx {
  id?: string
  amount?: string
  paid_amount?: string
  status?: string
  status_detail?: string
}

export interface MpOrder {
  id: string
  status?: string
  status_detail?: string
  external_reference?: string | null
  total_amount?: string
  total_paid_amount?: string
  currency?: string
  checkout_url?: string | null
  transactions?: { payments?: MpPaymentTx[] }
}

async function mpFetch(
  path: string,
  token: string,
  init: RequestInit & { idempotencyKey?: string },
): Promise<{ status: number; json: unknown }> {
  let res: Response
  try {
    res = await fetch(`${MP_API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.idempotencyKey
          ? { 'X-Idempotency-Key': init.idempotencyKey }
          : {}),
        ...(init.headers || {}),
      },
    })
  } catch {
    throw new MpError('Sin conexión con Mercado Pago', 503)
  }
  let json: unknown = null
  try {
    json = await res.json()
  } catch {
    json = null
  }
  return { status: res.status, json }
}

function mpErrorMessage(json: unknown, fallback: string): {
  message: string
  code?: string
} {
  if (json && typeof json === 'object') {
    const rec = json as Record<string, unknown>
    const message =
      typeof rec.message === 'string' && rec.message ? rec.message : fallback
    const error =
      typeof rec.error === 'string' && rec.error ? rec.error : undefined
    return { message: error ? `${message} (${error})` : message, code: error }
  }
  return { message: fallback }
}

export interface MpCreateResult {
  id: string
  checkoutUrl: string
}

/**
 * POST /v1/orders. Exige 201 + id + checkout_url; cualquier otra cosa
 * es MpError (el caller lo traduce a 502 sin exponer detalles).
 */
export async function createMpOrder(
  payload: Record<string, unknown>,
  opts: { token: string; idempotencyKey: string },
): Promise<MpCreateResult> {
  const { status, json } = await mpFetch('/v1/orders', opts.token, {
    method: 'POST',
    idempotencyKey: opts.idempotencyKey,
    body: JSON.stringify(payload),
  })
  if (status === 201 && json && typeof json === 'object') {
    const rec = json as Record<string, unknown>
    if (typeof rec.id === 'string' && typeof rec.checkout_url === 'string') {
      return { id: rec.id, checkoutUrl: rec.checkout_url }
    }
  }
  const { message, code } = mpErrorMessage(
    json,
    'Mercado Pago no pudo crear la orden',
  )
  throw new MpError(message, status, code)
}

/** GET /v1/orders/{id}. 404 de MP → MpError 404 (el caller decide). */
export async function getMpOrder(
  mpOrderId: string,
  opts: { token: string },
): Promise<MpOrder> {
  const { status, json } = await mpFetch(
    `/v1/orders/${encodeURIComponent(mpOrderId)}`,
    opts.token,
    { method: 'GET' },
  )
  if (status === 200 && json && typeof json === 'object') {
    const rec = json as Record<string, unknown>
    if (typeof rec.id === 'string') return rec as unknown as MpOrder
  }
  if (status === 404) throw new MpError('Orden no encontrada en MP', 404)
  const { message, code } = mpErrorMessage(
    json,
    'No se pudo consultar la orden en Mercado Pago',
  )
  throw new MpError(message, status, code)
}
