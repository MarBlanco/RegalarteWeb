/**
 * Cupones de descuento del checkout.
 *
 * Los cupones viven en la colección `coupons` de Payload (editable por
 * admin en /admin). Este módulo conserva la lógica pura compartida por
 * cliente (vista previa del resumen) y servidor (aplicación autoritativa al
 * crear la orden, coherente con AUDIT-004: totales calculados desde la DB,
 * nunca del cliente). La búsqueda en DB está en `coupon-service.ts`.
 *
 * El servidor siempre revalida el código: un cupón inexistente, inactivo o
 * retirado rechaza la orden aunque el cliente lo muestre aplicado.
 */

export interface CouponDef {
  /** Código normalizado (mayúsculas, sin espacios). */
  code: string
  /** Porcentaje de descuento sobre el subtotal (0-100). */
  percent: number
}

/** Normaliza lo que escribe el cliente: recorta y pasa a mayúsculas. */
export function normalizeCouponCode(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.trim().toUpperCase().replace(/\s+/g, '')
}

/**
 * Documento de la colección `coupons` → cupón aplicable, o null si está
 * inactivo o es inválido (porcentaje fuera de 1-100, código vacío).
 */
export function couponFromDoc(doc: unknown): CouponDef | null {
  if (!doc || typeof doc !== 'object') return null
  const { code, percent, active } = doc as {
    code?: unknown
    percent?: unknown
    active?: unknown
  }
  if (active === false) return null
  const normalized = normalizeCouponCode(code)
  if (!normalized) return null
  if (typeof percent !== 'number' || !Number.isFinite(percent)) return null
  if (percent < 1 || percent > 100) return null
  return { code: normalized, percent }
}

/** Descuento en pesos (redondeado a 2 decimales, nunca negativo). */
export function couponDiscount(subtotal: number, coupon: CouponDef): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0
  const pct = Math.min(100, Math.max(0, coupon.percent))
  return Math.round(((subtotal * pct) / 100) * 100) / 100
}

/** Total con cupón aplicado (nunca negativo). */
export function couponTotal(subtotal: number, coupon: CouponDef): number {
  return Math.max(0, Math.round((subtotal - couponDiscount(subtotal, coupon)) * 100) / 100)
}
