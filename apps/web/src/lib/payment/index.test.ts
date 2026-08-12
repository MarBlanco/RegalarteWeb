import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getPaymentProvider,
  __resetPaymentProviderForTesting,
} from '@/lib/payment'
import type { PaymentProvider } from '@/lib/payment/types'

const originalEnv = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER

beforeEach(() => {
  __resetPaymentProviderForTesting()
  vi.resetModules()
  process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = originalEnv
})

describe('Payment Provider Factory', () => {
  it('returns MockPaymentProvider by default', () => {
    delete process.env.NEXT_PUBLIC_PAYMENT_PROVIDER
    const provider = getPaymentProvider()
    expect(provider.name).toBe('mock')
  })

  it('returns MockPaymentProvider for invalid provider name', () => {
    process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = 'invalid'
    const provider = getPaymentProvider()
    expect(provider.name).toBe('mock')
  })

  it('returns MockPaymentProvider when explicitly set to mock', () => {
    process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = 'mock'
    const provider = getPaymentProvider()
    expect(provider.name).toBe('mock')
  })

  it('returns MercadoPagoProvider when set to mercadopago', () => {
    process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = 'mercadopago'
    const provider = getPaymentProvider()
    expect(provider.name).toBe('mercadopago')
  })

  it('is case-insensitive for provider name', () => {
    process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = 'MercadoPago'
    const provider = getPaymentProvider()
    expect(provider.name).toBe('mercadopago')
  })

  it('caches the provider instance', () => {
    process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = 'mock'
    const p1 = getPaymentProvider()
    const p2 = getPaymentProvider()
    expect(p1).toBe(p2)
  })

  it('allows cache reset for testing', () => {
    process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = 'mock'
    const p1 = getPaymentProvider()
    __resetPaymentProviderForTesting()
    const p2 = getPaymentProvider()
    expect(p1).not.toBe(p2)
  })

  describe('MockPaymentProvider', () => {
    let provider: PaymentProvider

    beforeEach(() => {
      process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = 'mock'
      provider = getPaymentProvider()
    })

    it('implements initiate with redirectUrl', async () => {
      const result = await provider.initiate({ orderId: 'order-1', redirectUrl: 'https://example.com/success' })
      expect(result).toEqual({
        status: 'ready',
        externalId: expect.stringMatching(/^mock_order-1_\d+$/),
        redirectUrl: 'https://example.com/success',
      })
    })

    it('throws if redirectUrl missing', async () => {
      await expect(provider.initiate({ orderId: 'order-1', redirectUrl: '' })).rejects.toThrow('redirectUrl is required')
    })

    it('implements getStatus returning pending', async () => {
      const result = await provider.getStatus('mock_123')
      expect(result).toEqual({ status: 'pending', externalId: 'mock_123' })
    })

    it('implements cancel returning cancelled', async () => {
      const result = await provider.cancel('mock_123')
      expect(result).toEqual({ status: 'cancelled', externalId: 'mock_123' })
    })
  })

  describe('MercadoPagoProvider', () => {
    let provider: PaymentProvider

    beforeEach(() => {
      process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = 'mercadopago'
      provider = getPaymentProvider()
    })

    it('implements initiate with redirectUrl', async () => {
      const result = await provider.initiate({ orderId: 'order-1', redirectUrl: 'https://example.com/success' })
      expect(result).toEqual({
        status: 'ready',
        externalId: expect.stringMatching(/^mp_order-1_\d+$/),
        redirectUrl: 'https://example.com/success',
      })
    })

    it('throws if redirectUrl missing', async () => {
      await expect(provider.initiate({ orderId: 'order-1', redirectUrl: '' })).rejects.toThrow('redirectUrl is required')
    })

    it('implements getStatus returning pending', async () => {
      const result = await provider.getStatus('mp_123')
      expect(result).toEqual({ status: 'pending', externalId: 'mp_123' })
    })

    it('implements cancel returning cancelled', async () => {
      const result = await provider.cancel('mp_123')
      expect(result).toEqual({ status: 'cancelled', externalId: 'mp_123' })
    })
  })
})