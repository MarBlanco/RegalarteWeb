/**
 * Envío gratis: umbral ilustrativo para la barra de progreso del carrito.
 * No hay cálculo de envío en backend; el checkout lo confirma. Si el CMS
 * publica un umbral real, reemplazar esta constante por ese valor.
 */
export const FREE_SHIPPING_THRESHOLD = 105000

export function freeShippingProgress(subtotal: number): {
  reached: boolean
  remaining: number
  pct: number
} {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return { reached: true, remaining: 0, pct: 100 }
  }
  return {
    reached: false,
    remaining: FREE_SHIPPING_THRESHOLD - subtotal,
    pct: Math.min(
      100,
      Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100),
    ),
  }
}
