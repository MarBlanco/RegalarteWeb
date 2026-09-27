'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuth } from '@/hooks/use-auth'

interface EditModeState {
  /** Cuando es true, Guale ve la tienda exactamente como un cliente. */
  viewAsClient: boolean
  setViewAsClient: (value: boolean) => void
}

export const useEditMode = create<EditModeState>()(
  persist(
    (set) => ({
      viewAsClient: false,
      setViewAsClient: (viewAsClient) => set({ viewAsClient }),
    }),
    { name: 'regalarte-edit-mode' },
  ),
)

/** ¿El usuario actual puede editar contenido comercial? (gate visual). */
export function useIsStaff(): boolean {
  const user = useAuth((s) => s.user)
  const token = useAuth((s) => s.token)
  if (!token) return false
  return user?.role === 'admin' || user?.role === 'staff'
}

/**
 * ¿Modo Edición activo? Requiere rol staff/admin, sesión válida y no estar
 * en "ver como cliente". El control de seguridad real está en el backend
 * (`PUT /api/home-content` revalida el JWT y el rol).
 */
export function useEditActive(): boolean {
  const isStaff = useIsStaff()
  const viewAsClient = useEditMode((s) => s.viewAsClient)
  return isStaff && !viewAsClient
}
