/**
 * Envío gratis: barra de progreso del carrito. El umbral real es el campo
 * `free_shipping_threshold` de la configuración de la tienda (editable por
 * admin); esta constante es el valor por defecto / de respaldo. No hay
 * cálculo de envío en backend; el checkout lo confirma.
 */
export const FREE_SHIPPING_THRESHOLD = 105000

/** Umbral válido (> 0) o el de respaldo. */
export function resolveFreeShippingThreshold(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : FREE_SHIPPING_THRESHOLD
}

export function freeShippingProgress(
  subtotal: number,
  threshold: number = FREE_SHIPPING_THRESHOLD,
): {
  reached: boolean
  remaining: number
  pct: number
} {
  const limit = resolveFreeShippingThreshold(threshold)
  if (subtotal >= limit) {
    return { reached: true, remaining: 0, pct: 100 }
  }
  return {
    reached: false,
    remaining: limit - subtotal,
    pct: Math.min(100, Math.round((subtotal / limit) * 100)),
  }
}
