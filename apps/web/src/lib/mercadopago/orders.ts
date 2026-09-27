/**
 * Mercado Pago Orders API — construcción del payload de creación.
 *
 * Módulo PURO (sin secretos ni node:*): seguro para importar desde
 * cualquier lado. El cliente REST y el webhook viven en módulos
 * server-only separados.
 *
 * Reglas (documentación oficial Checkout Pro vía Orders API):
 * - `total_amount` debe igualar EXACTAMENTE Σ(items[].unit_price×quantity).
 * - Nuestro total puede incluir descuento (cupón): se distribuye en
 *   centavos sobre las líneas para que la suma cierre al centavo.
 * - Montos como string con hasta 2 decimales.
 */

export interface MpLineInput {
  name: string
  quantity: number
  unitPrice: number
}

export interface MpBackUrls {
  successUrl: string
  failureUrl: string
  pendingUrl: string
}

export interface MpCreatePayload {
  type: 'online'
  total_amount: string
  external_reference: string
  processing_mode: 'manual'
  capture_mode: 'automatic_async'
  expiration_time: string
  payer: { email: string; first_name?: string; last_name?: string }
  items: Array<{
    title: string
    quantity: number
    unit_price: string
    unit_measure: 'unit'
  }>
  config: {
    online: {
      success_url: string
      failure_url: string
      pending_url: string
      auto_return: 'approved'
    }
  }
}

export class MpOrderBuildError extends Error {}

/** MP status → PaymentStatus del contrato interno. */
export function mapMpStatus(
  status: string | undefined,
): 'pending' | 'in_process' | 'approved' | 'rejected' | 'cancelled' {
  switch (status) {
    case 'processed':
      return 'approved'
    case 'action_required':
      return 'in_process'
    case 'cancelled':
      return 'cancelled'
    case 'created':
    default:
      return 'pending'
  }
}

/** Centavos enteros (evita errores de punto flotante). */
function toCents(value: number): number {
  if (!Number.isFinite(value)) throw new MpOrderBuildError('Monto inválido')
  return Math.round(value * 100)
}

/** String MP: entero sin decimales o con 2 decimales. */
export function formatMpAmount(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new MpOrderBuildError('Monto inválido')
  }
  if (cents % 100 === 0) return String(cents / 100)
  return (cents / 100).toFixed(2)
}

export interface BuildMpOrderInput {
  orderNumber: string
  email: string
  firstName?: string
  lastName?: string
  lines: MpLineInput[]
  /** Total a cobrar (ya con descuento aplicado). */
  total: number
  backUrls: MpBackUrls
  /** Validez de la orden en MP. Default P3D. */
  expirationTime?: string
}

/**
 * Arma el payload de POST /v1/orders distribuyendo la diferencia entre
 * subtotal y total (cupón) en centavos sobre las líneas. Lanza si la suma
 * no cierra exacta (MP rechazaría con total_amount_mismatch).
 */
export function buildMpCreatePayload(input: BuildMpOrderInput): MpCreatePayload {
  const totalCents = toCents(input.total)
  if (totalCents <= 0) throw new MpOrderBuildError('Total inválido')

  const lines = input.lines.map((l) => {
    if (!l.name.trim() || !Number.isInteger(l.quantity) || l.quantity <= 0) {
      throw new MpOrderBuildError('Línea inválida')
    }
    return { name: l.name.trim(), quantity: l.quantity, base: toCents(l.unitPrice) * l.quantity }
  })
  if (lines.length === 0) throw new MpOrderBuildError('Sin líneas')
  const subtotalCents = lines.reduce((acc, l) => acc + l.base, 0)
  const discountCents = subtotalCents - totalCents
  if (discountCents < 0) {
    throw new MpOrderBuildError('El total supera al subtotal')
  }

  // Reparte el descuento proporcional en centavos (resto en la última
  // línea) y luego fija unit_price por línea redondeando hacia abajo: el
  // drift total (< 1 centavo por línea) se absorbe en la última unidad.
  // Así Σ(unit_price × quantity) == total exacto, como exige MP.
  let assigned = 0
  const units = lines.map((l, i) => {
    const share =
      i < lines.length - 1
        ? Math.floor((discountCents * l.base) / subtotalCents)
        : discountCents - assigned
    assigned += share
    const lineTotal = l.base - share
    return {
      name: l.name,
      quantity: l.quantity,
      unit: Math.floor(lineTotal / l.quantity),
    }
  })

  const floored = units.reduce((acc, u) => acc + u.unit * u.quantity, 0)
  const drift = totalCents - floored
  if (drift < 0) throw new MpOrderBuildError('Drift de redondeo inesperado')
  units[units.length - 1].unit += drift

  const items = units.map((u) => ({
    title: u.name,
    quantity: u.quantity,
    unit_price: formatMpAmount(u.unit),
    unit_measure: 'unit' as const,
    _cents: u.unit * u.quantity,
  }))

  const check = items.reduce((acc, it) => acc + it._cents, 0)
  if (check !== totalCents) {
    throw new MpOrderBuildError('La suma de líneas no cierra con el total')
  }

  return {
    type: 'online',
    total_amount: formatMpAmount(totalCents),    external_reference: input.orderNumber,
    processing_mode: 'manual',
    capture_mode: 'automatic_async',
    expiration_time: input.expirationTime ?? 'P3D',
    payer: {
      email: input.email,
      ...(input.firstName ? { first_name: input.firstName } : {}),
      ...(input.lastName ? { last_name: input.lastName } : {}),
    },
    items: items.map(({ title, quantity, unit_price, unit_measure }) => ({
      title,
      quantity,
      unit_price,
      unit_measure,
    })),
    config: {
      online: {
        success_url: input.backUrls.successUrl,
        failure_url: input.backUrls.failureUrl,
        pending_url: input.backUrls.pendingUrl,
        auto_return: 'approved',
      },
    },
  }
}
