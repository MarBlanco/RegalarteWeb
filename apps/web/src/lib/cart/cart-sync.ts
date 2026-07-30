/**
 * Cart Sync: capa de sincronizacion Cart <-> Orders.
 *
 * Encapsula las operaciones que deben ejecutarse cuando el carrito
 * se cruza con un evento externo (creacion de una Order). Reutiliza
 * el store Zustand existente sin modificar su contrato publico.
 *
 * Uso desde checkout:
 *   const snapshot = captureCartSnapshot()
 *   const submit = await submitCheckout(values)
 *   if (submit.status === 'success') {
 *     syncCartWithOrder(submit.orderId)
 *     // Si la inicializacion del pago falla, el caller puede:
 *     // restoreCartFromSnapshot(snapshot)
 *   }
 */

import type { CartItem, CartMode } from './types'
import { useCartStore } from './store'

export interface CartSyncSnapshot {
  /** Copia profunda (estructural) de los items en el momento de captura. */
  items: ReadonlyArray<CartItem>
  /** Modo de precios en el momento de captura. */
  mode: CartMode
  /** Timestamp ISO de la captura. Util para logs / debugging. */
  capturedAt: string
}

/**
 * Captura el estado actual del carrito para eventual restauracion.
 *
 * Llamado tipicamente antes de vaciar el carrito, por si el flujo
 * posterior (ej. inicializacion del pago) falla y queremos devolverle
 * los items al usuario.
 */
export function captureCartSnapshot(): CartSyncSnapshot {
  const state = useCartStore.getState()
  return {
    items: state.items.map((item) => ({ ...item })),
    mode: state.mode,
    capturedAt: new Date().toISOString(),
  }
}

/**
 * Restaura el carrito a un snapshot capturado previamente.
 *
 * NOTA: si entre la captura y la restauracion se creo una Order
 * server-side (TICKET-009), el usuario deberia continuar con esa
 * Order antes de re-intentar un submit. Esta funcion no consulta
 * el backend: solo restaura el estado local.
 */
export function restoreCartFromSnapshot(snapshot: CartSyncSnapshot): void {
  useCartStore.setState({
    items: snapshot.items.map((item) => ({ ...item })),
    mode: snapshot.mode,
  })
}

/**
 * Sincroniza el carrito con una Order creada: vacia el carrito local
 * porque la Order server-side es ahora la fuente de verdad para esa
 * compra.
 *
 * `orderId` queda registrado como parametro para futuras extensiones
 * (ej. mostrar un toast "Order X creada", o correlacionar con un
 * pending state). Hoy solo se usa para que el caller pueda pasar el
 * identificador sin tener que leerlo del store.
 */
export function syncCartWithOrder(orderId: string | undefined): void {
  void orderId
  useCartStore.getState().clearCart()
}
