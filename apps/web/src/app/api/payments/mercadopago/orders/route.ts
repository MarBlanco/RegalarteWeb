import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  createMpOrder,
  getMpAccessToken,
  MpError,
} from '@/lib/mercadopago/client'
import {
  buildMpCreatePayload,
} from '@/lib/mercadopago/orders'
import { buildBackUrls } from '@/lib/mercadopago/return-urls'

export const dynamic = 'force-dynamic'

const NO_STORE: ResponseInit['headers'] = {
  'Cache-Control': 'no-store, max-age=0',
}

interface InitiateOrder {
  id: number
  orderNumber: string
  status: string
  total: number
  customer?: { email?: unknown; firstName?: unknown; lastName?: unknown } | null
  items?: Array<{ name?: unknown; quantity?: unknown; unitPrice?: unknown }> | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * POST /api/payments/mercadopago/orders — inicia el pago de un pedido.
 *
 * Body: { orderId, email }. El email debe coincidir con el customer del
 * pedido (prueba de pertenencia para checkout invitado). Crea una Order
 * de MP por intento (X-Idempotency-Key único), persiste provider + ID
 * externo real y devuelve SOLO el checkout_url al browser.
 */
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400, headers: NO_STORE })
  }
  if (!isRecord(body)) {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400, headers: NO_STORE })
  }
  const orderId = Number(body.orderId)
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!Number.isInteger(orderId) || orderId <= 0 || !email) {
    return NextResponse.json(
      { error: 'Pedido o email inválido' },
      { status: 400, headers: NO_STORE },
    )
  }

  const token = getMpAccessToken()
  if (!token) {
    return NextResponse.json(
      { error: 'Pagos no configurados. Intentá de nuevo en unos minutos.' },
      { status: 503, headers: NO_STORE },
    )
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const signSecret = process.env.PAYLOAD_SECRET
  if (!appUrl || !signSecret) {
    return NextResponse.json(
      { error: 'Pagos no configurados. Intentá de nuevo en unos minutos.' },
      { status: 503, headers: NO_STORE },
    )
  }

  try {
    const payload = await getPayload({ config })
    const found = (await payload
      .findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
      .catch(() => null)) as InitiateOrder | null
    if (!found) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404, headers: NO_STORE },
      )
    }
    if (found.status !== 'pending') {
      return NextResponse.json(
        { error: 'El pedido ya fue procesado' },
        { status: 409, headers: NO_STORE },
      )
    }
    const ownerEmail =
      typeof found.customer?.email === 'string'
        ? found.customer.email.trim().toLowerCase()
        : ''
    if (!ownerEmail || ownerEmail !== email) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403, headers: NO_STORE })
    }
    const total = Number(found.total)
    if (!Number.isFinite(total) || total <= 0) {
      return NextResponse.json(
        { error: 'Total del pedido inválido' },
        { status: 400, headers: NO_STORE },
      )
    }

    const lines = (Array.isArray(found.items) ? found.items : []).map((it) => ({
      name: typeof it.name === 'string' ? it.name : 'Producto',
      quantity: typeof it.quantity === 'number' ? it.quantity : 1,
      unitPrice: typeof it.unitPrice === 'number' ? it.unitPrice : 0,
    }))

    let mpPayload: Record<string, unknown>
    try {
      mpPayload = buildMpCreatePayload({
        orderNumber: found.orderNumber,
        email: ownerEmail,
        firstName:
          typeof found.customer?.firstName === 'string'
            ? found.customer.firstName
            : undefined,
        lastName:
          typeof found.customer?.lastName === 'string'
            ? found.customer.lastName
            : undefined,
        lines,
        total,
        backUrls: buildBackUrls(appUrl, found.id, signSecret),
      }) as unknown as Record<string, unknown>
    } catch {
      return NextResponse.json(
        { error: 'No se pudo iniciar el pago. Intentá de nuevo.' },
        { status: 500, headers: NO_STORE },
      )
    }

    const idempotencyKey = `rg-${found.id}-${Date.now().toString(36)}${Math.floor(
      Math.random() * 1e6,
    ).toString(36)}`
    let created: { id: string; checkoutUrl: string }
    try {
      created = await createMpOrder(mpPayload, { token, idempotencyKey })
    } catch (err) {
      if (err instanceof MpError && err.status === 423) {
        return NextResponse.json(
          { error: 'Mercado Pago está ocupado. Reintentá en unos segundos.' },
          { status: 503, headers: NO_STORE },
        )
      }
      return NextResponse.json(
        { error: 'No se pudo iniciar el pago. Intentá de nuevo.' },
        { status: 502, headers: NO_STORE },
      )
    }

    await payload.update({
      collection: 'orders',
      id: found.id,
      data: { paymentProvider: 'mercadopago', paymentExternalId: created.id },
      overrideAccess: true,
    })

    return NextResponse.json(
      { checkoutUrl: created.checkoutUrl, externalId: created.id },
      { headers: NO_STORE },
    )
  } catch {
    return NextResponse.json(
      { error: 'No se pudo iniciar el pago. Intentá de nuevo.' },
      { status: 500, headers: NO_STORE },
    )
  }
}
