import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createOrder, OrderRejectedError } from './service'
import { verifyOrderSig } from '@/lib/mercadopago/return-urls'

vi.mock('payload', () => ({
  getPayload: vi.fn(),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

const { getPayload } = await import('payload')

function mockPayload() {
  return {
    find: vi.fn().mockResolvedValue({
      docs: [{ id: 1, title: 'Vela', slug: 'vela', price: 100, active: true }],
    }),
    create: vi.fn().mockImplementation(({ data }: { data: object }) =>
      Promise.resolve({ id: 7, ...(data as object) }),
    ),
  }
}

function makeInput(couponCode?: string) {
  return {
    customer: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@mail.com',
      phone: '123',
    },
    address: {
      province: 'P',
      city: 'C',
      street: 'S 1',
      postalCode: '1000',
    },
    mode: 'RETAIL' as const,
    ...(couponCode !== undefined ? { couponCode } : {}),
    items: [
      {
        id: '1',
        productId: '1',
        slug: 'vela',
        name: 'Vela',
        price: 100,
        compareAtPrice: null,
        wholesalePrice: null,
        isWholesaleAvailable: false,
        image: null,
        quantity: 1,
      },
    ],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createOrder — cupón', () => {
  it('cupón válido persiste código, descuento y total', async () => {
    const payload = mockPayload()
    vi.mocked(getPayload).mockResolvedValue(payload as never)
    const result = await createOrder(makeInput('regalarte10'))

    expect(result.status).toBe('success')
    expect(payload.create).toHaveBeenCalledOnce()
    const data = payload.create.mock.calls[0][0].data
    expect(data).toMatchObject({
      couponCode: 'REGALARTE10',
      discount: 10,
      subtotal: 100,
      total: 90,
    })
  })

  it('sin cupón no hay descuento', async () => {
    const payload = mockPayload()
    vi.mocked(getPayload).mockResolvedValue(payload as never)
    await createOrder(makeInput())

    const data = payload.create.mock.calls[0][0].data
    expect(data).toMatchObject({
      couponCode: null,
      discount: 0,
      total: 100,
    })
  })

  it('cupón inválido rechaza sin tocar la DB', async () => {
    const payload = mockPayload()
    vi.mocked(getPayload).mockResolvedValue(payload as never)

    const err = await createOrder(makeInput('TRUCHO')).catch((e) => e)
    expect(err).toBeInstanceOf(OrderRejectedError)
    expect((err as OrderRejectedError).code).toBe('INVALID_COUPON')
    expect(payload.find).not.toHaveBeenCalled()
    expect(payload.create).not.toHaveBeenCalled()
  })
})

describe('createOrder — destino del checkout', () => {
  it('redirectUrl apunta a la confirmación firmada del pedido', async () => {
    vi.stubEnv('PAYLOAD_SECRET', 'test-secret')
    const payload = mockPayload()
    vi.mocked(getPayload).mockResolvedValue(payload as never)
    const result = await createOrder(makeInput())
    expect(result.status).toBe('success')
    const url = (result as { redirectUrl: string }).redirectUrl
    const [path, qs] = url.split('?')
    expect(path).toBe('/checkout/orden/7')
    const sig = new URLSearchParams(qs).get('sig')
    expect(verifyOrderSig(7, sig, 'test-secret')).toBe(true)
    expect(verifyOrderSig(8, sig, 'test-secret')).toBe(false)
    vi.unstubAllEnvs()
  })
})
