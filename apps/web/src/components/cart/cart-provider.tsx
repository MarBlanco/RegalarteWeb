'use client'

import { CartDrawer } from './cart-drawer'

/**
 * CartProvider: monta la UI global del carrito (drawer + contador wireado en el header).
 *
 * No es un Context real: Zustand expone su store directamente. La sigla "Provider"
 * queda para mantener paridad conceptual con AuthProvider del proyecto y para que
 * un cambio futuro (por ejemplo sync server) pueda agregar contexto reactivo sin
 * cambiar el consumer.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CartDrawer />
    </>
  )
}
