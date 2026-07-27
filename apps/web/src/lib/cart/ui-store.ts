/**
 * Cart: estado de la UI (drawer abierto/cerrado, etc).
 *
 * Mantenido en un store separado al del dominio para evitar acoplar el flag de
 * UI con el contenido del carrito. Un mismo carrito puede persistir entre sesiones
 * aunque el drawer se abra o cierre.
 */

'use client'

import { create } from 'zustand'

interface CartUIState {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  setOpen: (value: boolean) => void
}

export const useCartUIStore = create<CartUIState>()((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (value) => set({ isOpen: value }),
}))
