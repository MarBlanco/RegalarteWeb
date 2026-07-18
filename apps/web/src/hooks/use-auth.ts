'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'visitor' | 'retail' | 'wholesale' | 'staff' | 'admin'
export type CustomerType = 'RETAIL' | 'WHOLESALE'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  customer_type: CustomerType
  business_name?: string
  cuit?: string
  phone?: string
  province?: string
  city?: string
  whatsapp?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (isLoading: boolean) => void
  logout: () => void
  isAuthenticated: () => boolean
  isWholesale: () => boolean
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),

      logout: () => set({ user: null, token: null }),

      isAuthenticated: () => !!get().user && !!get().token,
      isWholesale: () => get().user?.customer_type === 'WHOLESALE',
    }),
    {
      name: 'regalarte-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    },
  ),
)
