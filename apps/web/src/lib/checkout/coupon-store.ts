'use client'

import { create } from 'zustand'
import { normalizeCouponCode } from '@/lib/orders/coupons'

type CouponStatus = 'idle' | 'checking' | 'applied' | 'invalid'

interface CouponState {
  /** Código aplicado (normalizado) o null. */
  code: string | null
  percent: number
  status: CouponStatus
  /** Valida contra el servidor y aplica. Vacío → vuelve a idle. */
  apply: (input: string) => Promise<void>
  clear: () => void
}

/**
 * Cupón del checkout (UI). La vista previa del descuento sale de
 * `/api/coupons/validate`; la aplicación autoritativa ocurre en el servidor
 * al crear la orden.
 */
export const useCouponStore = create<CouponState>()((set) => ({
  code: null,
  percent: 0,
  status: 'idle',
  apply: async (input) => {
    const normalized = normalizeCouponCode(input)
    if (!normalized) {
      set({ code: null, percent: 0, status: 'idle' })
      return
    }
    set({ status: 'checking' })
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized }),
      })
      const data = res.ok ? await res.json() : null
      if (
        data?.valid === true &&
        typeof data.code === 'string' &&
        typeof data.percent === 'number'
      ) {
        set({ code: data.code, percent: data.percent, status: 'applied' })
        return
      }
    } catch {
      /* se trata como inválido */
    }
    set({ code: null, percent: 0, status: 'invalid' })
  },
  clear: () => set({ code: null, percent: 0, status: 'idle' }),
}))
