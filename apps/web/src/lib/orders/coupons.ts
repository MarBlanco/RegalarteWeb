/**
 * Cupones de descuento del checkout.
 *
 * No existe infraestructura previa de cupones en el proyecto: este módulo
 * es la ÚNICA fuente de verdad, compartida por cliente (vista previa del
 * resumen) y servidor (aplicación autoritativa al crear la orden, coherente
 * con AUDIT-004: totales calculados desde la DB, nunca del cliente).
 *
 * El servidor siempre revalida el código: un cupón inválido o retirado
 * rechaza la orden aunque el cliente lo muestre aplicado.
 */

export interface CouponDef {
  /** Código normalizado (mayúsculas, sin espacios). */
  code: string
  /** Porcentaje de descuento sobre el subtotal (0-100). */
  percent: number
}

/** Catálogo inicial de cupones. Un solo cupón de lanzamiento. */
const COUPONS: CouponDef[] = [{ code: 'REGALARTE10', percent: 10 }]

/** Normaliza lo que escribe el cliente: recorta y pasa a mayúsculas. */
export function normalizeCouponCode(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.trim().toUpperCase().replace(/\s+/g, '')
}

/** Cupón válido o null (código desconocido o vacío). */
export function getCoupon(code: unknown): CouponDef | null {
  const normalized = normalizeCouponCode(code)
  if (!normalized) return null
  return COUPONS.find((c) => c.code === normalized) ?? null
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
