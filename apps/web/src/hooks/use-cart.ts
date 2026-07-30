/**
 * Compat layer: reexporta el carrito desde la nueva ubicacion estructurada.
 *
 * Ruta legada: import { useCart } from '@/hooks/use-cart'
 * Ruta nueva : import { useCartStore } from '@/lib/cart'
 *
 * El modulo original (`use-cart.ts`) exportaba el hook `useCart` y tipos
 * relacionados; ambos estan ahora en `lib/cart/store.ts`. Este archivo queda
 * como shim estable para que el codigo que ya importaba desde hooks/ siga
 * funcionando sin cambios de import.
 */

export {
  useCartStore as useCart,
  selectUnitPrice,
  selectTotals,
  selectItemCount,
  selectHasItems,
} from '@/lib/cart'
export type {
  CartItem,
  CartItemInput,
  CartMode,
  CartProductSnapshot,
  CartTotals,
} from '@/lib/cart'
