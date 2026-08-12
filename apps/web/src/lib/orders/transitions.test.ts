/**
 * Orders: tests de la maquina de estados (AUDIT-005).
 */

import { describe, expect, it } from 'vitest'

import { canTransition, isOrderStatus } from './transitions'

const ALL: ReturnType<typeof Object.freeze> = [
  'pending',
  'paid',
  'rejected',
  'cancelled',
  'fulfilled',
] as const

describe('orders transitions (AUDIT-005)', () => {
  it('permite pending -> paid | rejected | cancelled', () => {
    expect(canTransition('pending', 'paid')).toBe(true)
    expect(canTransition('pending', 'rejected')).toBe(true)
    expect(canTransition('pending', 'cancelled')).toBe(true)
  })

  it('permite paid -> fulfilled | cancelled (reembolso)', () => {
    expect(canTransition('paid', 'fulfilled')).toBe(true)
    expect(canTransition('paid', 'cancelled')).toBe(true)
  })

  it('los estados terminales no salen a ningun otro estado', () => {
    for (const terminal of ['rejected', 'cancelled', 'fulfilled'] as const) {
      for (const to of ALL) {
        if (to !== terminal) {
          expect(canTransition(terminal, to)).toBe(false)
        }
      }
    }
  })

  it('rechaza regresiones invalidas desde paid', () => {
    expect(canTransition('paid', 'pending')).toBe(false)
    expect(canTransition('paid', 'rejected')).toBe(false)
  })

  it('rechaza regresiones invalidas desde rejected', () => {
    expect(canTransition('rejected', 'paid')).toBe(false)
    expect(canTransition('rejected', 'pending')).toBe(false)
  })

  it('permite same -> same (edicion sin cambio de estado)', () => {
    for (const s of ALL) {
      expect(canTransition(s, s)).toBe(true)
    }
  })

  it('isOrderStatus solo acepta estados validos', () => {
    expect(isOrderStatus('pending')).toBe(true)
    expect(isOrderStatus('paid')).toBe(true)
    expect(isOrderStatus('fulfilled')).toBe(true)
    expect(isOrderStatus('delivered')).toBe(false)
    expect(isOrderStatus(undefined)).toBe(false)
    expect(isOrderStatus(null)).toBe(false)
  })
})