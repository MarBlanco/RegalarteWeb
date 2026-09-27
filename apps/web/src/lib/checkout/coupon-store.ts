'use client'

import { create } from 'zustand'
import { getCoupon, normalizeCouponCode } from '@/lib/orders/coupons'

type CouponStatus = 'idle' | 'applied' | 'invalid'

interface CouponState {
  /** Código aplicado (normalizado) o null. */
  code: string | null
  percent: number
  status: CouponStatus
  /** Valida y aplica. Vacío → vuelve a idle. */
  apply: (input: string) => void
  clear: () => void
}

/**
 * Cupón del checkout (UI). La vista previa del descuento es inmediata;
 * la aplicación autoritativa ocurre en el servidor al crear la orden.
 */
export const useCouponStore = create<CouponState>()((set) => ({
  code: null,
  percent: 0,
  status: 'idle',
  apply: (input) => {
    const normalized = normalizeCouponCode(input)
    if (!normalized) {
      set({ code: null, percent: 0, status: 'idle' })
      return
    }
    const coupon = getCoupon(normalized)
    if (!coupon) {
      set({ code: null, percent: 0, status: 'invalid' })
      return
    }
    set({ code: coupon.code, percent: coupon.percent, status: 'applied' })
  },
  clear: () => set({ code: null, percent: 0, status: 'idle' }),
}))
