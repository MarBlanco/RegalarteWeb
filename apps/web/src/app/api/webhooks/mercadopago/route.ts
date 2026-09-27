import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  getMpAccessToken,
  getMpOrder,
  getMpWebhookSecret,
  MpError,
} from '@/lib/mercadopago/client'
import {
  validateMpOrderForPaid,
  verifyWebhookSignature,
} from '@/lib/mercadopago/webhook'

export const dynamic = 'force-dynamic'

const NO_STORE: ResponseInit['headers'] = {
  'Cache-Control': 'no-store, max-age=0',
}

interface OurOrder {
  id: number
  orderNumber: string
  status: string
  total: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * POST /api/webhooks/mercadopago — notificaciones de Mercado Pago.
 *
 * - Valida la firma HMAC (401 si no coincide). Sin secreto configurado
 *   no se procesa nada (500).
 * - Solo atiende tópico `order`; lo demás se ignora con 200.
 * - Ante la notificación, consulta la Order en MP y SOLO si pasa todas
 *   las validaciones (referencia, estado processed, ARS, montos) permite
 *   pending → paid. Idempotente: pedido ya paid u otro estado → 200
 *   sin cambios. Nunca confía en el body/query para el resultado.
 */
export async function POST(req: Request) {
  const secret = getMpWebhookSecret()
  if (!secret) {
    return NextResponse.json(
      { error: 'Webhook no configurado' },
      { status: 500, headers: NO_STORE },
    )
  }

  let body: unknown = null
  try {
    body = await req.json()
  } catch {
    body = null
  }
  const url = new URL(req.url)
  const bodyRec = isRecord(body) ? body : null
  const bodyData = isRecord(bodyRec?.data) ? bodyRec.data : null
  const dataId =
    url.searchParams.get('data.id') ??
    (typeof bodyData?.id === 'string' ? bodyData.id : null)
  const type =
    url.searchParams.get('type') ??
    (typeof bodyRec?.type === 'string' ? bodyRec.type : null)

  const valid = verifyWebhookSignature(
    {
      xSignature: req.headers.get('x-signature'),
      xRequestId: req.headers.get('x-request-id'),
      dataId,
    },
    secret,
  )
  if (!valid) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401, headers: NO_STORE })
  }
  if (!dataId) {
    return NextResponse.json({ error: 'Notificación inválida' }, { status: 400, headers: NO_STORE })
  }
  if (type !== 'order') {
    return NextResponse.json({ ok: true, ignored: 'non-order' }, { headers: NO_STORE })
  }

  const token = getMpAccessToken()
  if (!token) {
    return NextResponse.json(
      { error: 'Pagos no configurados' },
      { status: 500, headers: NO_STORE },
    )
  }

  try {
    let mpOrder
    try {
      mpOrder = await getMpOrder(dataId, { token })
    } catch (err) {
      if (err instanceof MpError && err.status === 404) {
        return NextResponse.json(
          { ok: true, ignored: 'mp-order-not-found' },
          { headers: NO_STORE },
        )
      }
      throw err
    }

    const payload = await getPayload({ config })
    const found = await payload.find({
      collection: 'orders',
      where: { orderNumber: { equals: mpOrder.external_reference ?? '' } },
      limit: 1,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    } as never)
    const ours = (found.docs[0] ?? null) as OurOrder | null
    if (!ours) {
      return NextResponse.json(
        { ok: true, ignored: 'unknown-reference' },
        { headers: NO_STORE },
      )
    }
    if (ours.status === 'paid') {
      return NextResponse.json(
        { ok: true, orderId: ours.id, already: true },
        { headers: NO_STORE },
      )
    }
    if (ours.status !== 'pending') {
      return NextResponse.json(
        { ok: true, ignored: `status-${ours.status}` },
        { headers: NO_STORE },
      )
    }

    const validation = validateMpOrderForPaid(mpOrder, {
      orderNumber: ours.orderNumber,
      total: Number(ours.total),
    })
    if (!validation.ok) {
      return NextResponse.json(
        { ok: true, ignored: validation.reason },
        { headers: NO_STORE },
      )
    }

    await payload.update({
      collection: 'orders',
      id: ours.id,
      data: {
        status: 'paid',
        paymentProvider: 'mercadopago',
        paymentExternalId: mpOrder.id,
      },
      overrideAccess: true,
    })
    return NextResponse.json(
      { ok: true, orderId: ours.id },
      { headers: NO_STORE },
    )
  } catch {
    return NextResponse.json(
      { error: 'No se pudo procesar la notificación' },
      { status: 500, headers: NO_STORE },
    )
  }
}
