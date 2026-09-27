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
      vi.unstubAllGlobals()
    })

    it('initiate delega en el backend y devuelve el checkout_url', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            checkoutUrl: 'https://mp.test/checkout/1',
            externalId: 'ORDMP1',
          }),
      })
      vi.stubGlobal('fetch', fetchMock)
      const result = await provider.initiate({
        orderId: '10',
        redirectUrl: 'https://tienda.test/x',
        payerEmail: 'a@b.com',
      })
      expect(result).toEqual({
        status: 'ready',
        externalId: 'ORDMP1',
        redirectUrl: 'https://mp.test/checkout/1',
      })
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/payments/mercadopago/orders',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ orderId: '10', email: 'a@b.com' }),
        }),
      )
    })

    it('initiate exige orderId y payerEmail (nada silencioso)', async () => {
      await expect(
        provider.initiate({ redirectUrl: 'https://x.test', payerEmail: 'a@b.com' }),
      ).rejects.toThrow('orderId es requerido')
      await expect(
        provider.initiate({ orderId: '10', redirectUrl: 'https://x.test' }),
      ).rejects.toThrow('payerEmail es requerido')
    })

    it('initiate propaga el error del backend', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve({ error: 'Sin permiso' }),
        }),
      )
      await expect(
        provider.initiate({
          orderId: '10',
          redirectUrl: 'https://x.test',
          payerEmail: 'a@b.com',
        }),
      ).rejects.toThrow('Sin permiso')
    })

    it('getStatus normaliza vía backend', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ status: 'processed' }),
        }),
      )
      const result = await provider.getStatus('ORDMP1')
      expect(result).toEqual({ status: 'approved', externalId: 'ORDMP1' })
    })

    it('cancel no se simula: lanza explícito', async () => {
      await expect(provider.cancel('ORDMP1')).rejects.toThrow()
    })
  })
})