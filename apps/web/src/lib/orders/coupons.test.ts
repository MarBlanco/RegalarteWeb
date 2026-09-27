import { describe, it, expect } from 'vitest'
import {
  normalizeCouponCode,
  getCoupon,
  couponDiscount,
  couponTotal,
} from './coupons'

describe('Cupones — normalización y validez', () => {
  it('normaliza mayúsculas y espacios', () => {
    expect(normalizeCouponCode('  regalarte10 ')).toBe('REGALARTE10')
    expect(normalizeCouponCode('REGALARTE10')).toBe('REGALARTE10')
    expect(normalizeCouponCode('')).toBe('')
    expect(normalizeCouponCode(null)).toBe('')
  })

  it('resuelve el cupón inicial sin importar el formato', () => {
    expect(getCoupon('regalarte10')).toMatchObject({
      code: 'REGALARTE10',
      percent: 10,
    })
    expect(getCoupon('  REGALARTE10 ')).not.toBeNull()
  })

  it('código desconocido o vacío es inválido', () => {
    expect(getCoupon('INEXISTENTE')).toBeNull()
    expect(getCoupon('')).toBeNull()
    expect(getCoupon('regalarte10 ' + 'x')).toBeNull()
  })
})

describe('Cupones — matemática del descuento', () => {
  const coupon = { code: 'REGALARTE10', percent: 10 }

  it('10% del subtotal redondeado', () => {
    expect(couponDiscount(85800, coupon)).toBe(8580)
    expect(couponTotal(85800, coupon)).toBe(77220)
  })

  it('subtotal no positivo no descuenta', () => {
    expect(couponDiscount(0, coupon)).toBe(0)
    expect(couponDiscount(-5, coupon)).toBe(0)
  })
})
