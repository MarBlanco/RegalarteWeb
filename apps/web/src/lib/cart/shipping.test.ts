import { describe, it, expect } from 'vitest'
import {
  FREE_SHIPPING_THRESHOLD,
  freeShippingProgress,
  resolveFreeShippingThreshold,
} from './shipping'

describe('resolveFreeShippingThreshold', () => {
  it('usa el valor configurado si es un número positivo', () => {
    expect(resolveFreeShippingThreshold(50000)).toBe(50000)
  })

  it('cae al valor por defecto si falta o es inválido', () => {
    for (const bad of [undefined, null, 0, -1, Number.NaN, '100', Infinity]) {
      expect(resolveFreeShippingThreshold(bad)).toBe(FREE_SHIPPING_THRESHOLD)
    }
  })
})

describe('freeShippingProgress', () => {
  it('sin umbral explícito usa el por defecto', () => {
    expect(freeShippingProgress(0)).toEqual({
      reached: false,
      remaining: FREE_SHIPPING_THRESHOLD,
      pct: 0,
    })
  })

  it('con el umbral de la configuración', () => {
    expect(freeShippingProgress(25000, 100000)).toEqual({
      reached: false,
      remaining: 75000,
      pct: 25,
    })
    expect(freeShippingProgress(100000, 100000)).toEqual({
      reached: true,
      remaining: 0,
      pct: 100,
    })
  })

  it('un umbral inválido no divide por cero', () => {
    expect(freeShippingProgress(10, 0).remaining).toBe(FREE_SHIPPING_THRESHOLD - 10)
  })
})
