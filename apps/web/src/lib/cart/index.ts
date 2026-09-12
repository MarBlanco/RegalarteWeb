/**
 * Cart: barrel publico.
 * Punto de entrada unico para que futuras UIs consuman el carrito sin importar
 * internals del store.
 */

export * from './types'
export * from './pricing'
export {
  useCartStore,
  selectUnitPrice,
  selectTotals,
  selectItemCount,
  selectHasItems,
} from './store'
export { useCartUIStore } from './ui-store'
export { FREE_SHIPPING_THRESHOLD, freeShippingProgress } from './shipping'
