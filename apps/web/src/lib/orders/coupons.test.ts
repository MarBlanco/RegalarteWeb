import { describe, it, expect } from 'vitest'
import {
  normalizeCouponCode,
  couponFromDoc,
  couponDiscount,
  couponTotal,
} from './coupons'

describe('Cupones — normalización', () => {
  it('normaliza mayúsculas y espacios', () => {
    expect(normalizeCouponCode('  regalarte10 ')).toBe('REGALARTE10')
    expect(normalizeCouponCode('REGALARTE10')).toBe('REGALARTE10')
    expect(normalizeCouponCode('')).toBe('')
    expect(normalizeCouponCode(null)).toBe('')
  })
})

describe('Cupones — documento de la colección', () => {
  it('un cupón activo válido se normaliza', () => {
    expect(couponFromDoc({ code: ' regalarte10 ', percent: 10, active: true })).toEqual({
      code: 'REGALARTE10',
      percent: 10,
    })
    // `active` ausente (default true en la colección) también aplica.
    expect(couponFromDoc({ code: 'X1', percent: 5 })).toEqual({ code: 'X1', percent: 5 })
  })

  it('inactivo, vacío o con porcentaje inválido no aplica', () => {
    expect(couponFromDoc({ code: 'X1', percent: 10, active: false })).toBeNull()
    expect(couponFromDoc({ code: '  ', percent: 10 })).toBeNull()
    expect(couponFromDoc({ code: 'X1', percent: 0 })).toBeNull()
    expect(couponFromDoc({ code: 'X1', percent: 101 })).toBeNull()
    expect(couponFromDoc({ code: 'X1', percent: '10' })).toBeNull()
    expect(couponFromDoc({ code: 'X1', percent: Number.NaN })).toBeNull()
    expect(couponFromDoc(null)).toBeNull()
    expect(couponFromDoc(undefined)).toBeNull()
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
