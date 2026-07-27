/**
 * Cart: tipos publicos.
 *
 * Alineado con docs:
 * - 13_DATABASE_DESIGN (fallback retail_price cuando wholesale_price es null)
 * - 18_WHOLESALE_STRATEGY (pricing unico, sin catqlogos paralelos)
 * - Frontend/Backend Handoff (CartItem snapshot - immutable en server, replayable)
 *
 * Un CartItem es un **snapshot inmutable** de un producto en un momento del tiempo.
 * El carrito client-side nunca edita campos del producto en si; almacena lo que
 * el usuario esta intentando comprar. Si el Producto cambia su precio despues, las
 * reglas de pricing deben decidir si el cambio aplica (no implementado en este paso).
 */

export type CartMode = 'RETAIL' | 'WHOLESALE'

export interface CartProductSnapshot {
  /**
   * Identificador logico de la variante del producto en el carrito.
   * Combina productId (+ variante/atributo si existiera). En futuras iteraciones
   * se puede anexar slug de atributos/variants para que dos variaciones no colapsen.
   */
  readonly id: string
  readonly productId: string
  readonly slug: string
  readonly name: string
  readonly price: number
  readonly compareAtPrice?: number | null
  readonly wholesalePrice?: number | null
  readonly isWholesaleAvailable: boolean
  readonly image?: { url?: string | null; alt?: string | null } | null
}

export interface CartItem extends CartProductSnapshot {
  readonly quantity: number
}

export interface CartItemInput
  extends Omit<CartProductSnapshot, 'isWholesaleAvailable'> {
  quantity: number
  isWholesaleAvailable?: boolean
}

export interface CartTotals {
  subtotal: number
  itemCount: number
  hasWholesaleItems: boolean
  items: ReadonlyArray<CartItem>
}
