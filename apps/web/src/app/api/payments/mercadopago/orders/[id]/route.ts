import { NextResponse } from 'next/server'
import {
  getMpAccessToken,
  getMpOrder,
  MpError,
} from '@/lib/mercadopago/client'

export const dynamic = 'force-dynamic'

const NO_STORE: ResponseInit['headers'] = {
  'Cache-Control': 'no-store, max-age=0',
}

/**
 * GET /api/payments/mercadopago/orders/[id] — estado normalizado de una
 * Order de MP (lo usa el provider para getStatus). Solo expone estado y
 * montos, nunca secretos.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params
  const mpOrderId = typeof rawId === 'string' ? rawId.trim().slice(0, 80) : ''
  if (!mpOrderId) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400, headers: NO_STORE })
  }
  const token = getMpAccessToken()
  if (!token) {
    return NextResponse.json(
      { error: 'Pagos no configurados' },
      { status: 503, headers: NO_STORE },
    )
  }
  try {
    const order = await getMpOrder(mpOrderId, { token })
    return NextResponse.json(
      {
        id: order.id,
        status: order.status ?? null,
        externalReference: order.external_reference ?? null,
        totalAmount: order.total_amount ?? null,
        paidAmount: order.total_paid_amount ?? null,
        currency: order.currency ?? null,
      },
      { headers: NO_STORE },
    )
  } catch (err) {
    if (err instanceof MpError && err.status === 404) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404, headers: NO_STORE },
      )
    }
    return NextResponse.json(
      { error: 'No se pudo consultar el pago' },
      { status: 502, headers: NO_STORE },
    )
  }
}
