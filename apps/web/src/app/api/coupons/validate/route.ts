import { NextResponse } from 'next/server'
import { findActiveCoupon } from '@/lib/orders/coupon-service'

export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'no-store' }

/**
 * Valida un código de cupón para la vista previa del checkout. Devuelve solo
 * `{ code, percent }` de un cupón activo; nunca lista cupones. El servidor
 * revalida el código al crear la orden (AUDIT-004).
 */
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ valid: false }, { status: 400, headers: NO_STORE })
  }
  const code = (body as { code?: unknown } | null)?.code
  if (typeof code !== 'string' || code.length > 64) {
    return NextResponse.json({ valid: false }, { status: 400, headers: NO_STORE })
  }
  try {
    const coupon = await findActiveCoupon(code)
    if (!coupon) {
      return NextResponse.json({ valid: false }, { status: 404, headers: NO_STORE })
    }
    return NextResponse.json(
      { valid: true, code: coupon.code, percent: coupon.percent },
      { headers: NO_STORE },
    )
  } catch {
    return NextResponse.json({ valid: false }, { status: 500, headers: NO_STORE })
  }
}
