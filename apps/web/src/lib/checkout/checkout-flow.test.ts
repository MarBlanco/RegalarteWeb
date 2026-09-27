import { describe, it, expect, vi } from 'vitest'
import { continueCheckout } from './checkout-flow'
import type { PaymentProvider } from '@/lib/payment'

function fakeProvider(
  initiate: PaymentProvider['initiate'],
): PaymentProvider {
  return {
    name: 'fake',
    initiate,
    getStatus: vi.fn(),
    cancel: vi.fn(),
  }
}

describe('continueCheckout', () => {
  it('redirige con el checkout_url del provider', async () => {
    const initiate = vi.fn().mockResolvedValue({
      status: 'ready',
      externalId: 'ORDMP1',
      redirectUrl: 'https://mp.test/c/1',
    })
    const decision = await continueCheckout(
      { status: 'success', orderId: '10', redirectUrl: 'https://x.test' },
      fakeProvider(initiate),
    )
    expect(decision).toEqual({
      kind: 'redirect',
      url: 'https://mp.test/c/1',
      orderId: 'ORDMP1',
    })
  })

  it('pasa el email al initiate cuando se provee', async () => {
    const initiate = vi.fn().mockResolvedValue({
      status: 'ready',
      externalId: 'ORDMP1',
      redirectUrl: 'https://mp.test/c/1',
    })
    await continueCheckout(
      { status: 'success', orderId: '10', redirectUrl: 'https://x.test' },
      fakeProvider(initiate),
      { payerEmail: 'a@b.com' },
    )
    expect(initiate).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: '10', payerEmail: 'a@b.com' }),
    )
  })

  it('submit no exitoso → error sin llamar al provider', async () => {
    const initiate = vi.fn()
    const decision = await continueCheckout(
      { status: 'error', message: 'x' },
      fakeProvider(initiate),
    )
    expect(decision).toEqual({ kind: 'error', reason: 'invalid_submit_result' })
    expect(initiate).not.toHaveBeenCalled()
  })
})
