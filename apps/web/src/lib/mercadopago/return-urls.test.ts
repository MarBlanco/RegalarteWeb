import { describe, it, expect } from 'vitest'
import {
  signOrderId,
  verifyOrderSig,
  buildBackUrls,
  isReturnResult,
} from './return-urls'

describe('return urls firmadas', () => {
  it('firma y verifica el mismo id', () => {
    const sig = signOrderId(32, 's3cret')
    expect(verifyOrderSig(32, sig, 's3cret')).toBe(true)
  })

  it('otro id o secreto no verifican', () => {
    const sig = signOrderId(32, 's3cret')
    expect(verifyOrderSig(33, sig, 's3cret')).toBe(false)
    expect(verifyOrderSig(32, sig, 'otro')).toBe(false)
    expect(verifyOrderSig(32, null, 's3cret')).toBe(false)
  })

  it('construye las 3 urls con order y sig', () => {
    const urls = buildBackUrls('https://tienda.test/', 32, 's3cret')
    for (const u of [urls.successUrl, urls.failureUrl, urls.pendingUrl]) {
      expect(u).toContain('order=32&sig=')
    }
    expect(urls.successUrl).toContain('/checkout/pago/success?')
    expect(urls.failureUrl).toContain('/checkout/pago/failure?')
    expect(urls.pendingUrl).toContain('/checkout/pago/pending?')
  })

  it('valida el segmento de resultado', () => {
    expect(isReturnResult('success')).toBe(true)
    expect(isReturnResult('failure')).toBe(true)
    expect(isReturnResult('pending')).toBe(true)
    expect(isReturnResult('mock-success')).toBe(false)
  })
})
