import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('payload', () => ({
  getPayload: vi.fn(),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

const { getPayload } = await import('payload')

const ENV_KEYS = [
  'MERCADOPAGO_ACCESS_TOKEN',
  'NEXT_PUBLIC_APP_URL',
  'PAYLOAD_SECRET',
] as const
const savedEnv: Record<string, string | undefined> = {}

function setEnv() {
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k]
  process.env.MERCADOPAGO_ACCESS_TOKEN = 'APP_USR-test'
  process.env.NEXT_PUBLIC_APP_URL = 'https://tienda.test'
  process.env.PAYLOAD_SECRET = 's3cret'
}

function restoreEnv() {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k]
    else process.env[k] = savedEnv[k]
  }
}

const PENDING_ORDER = {
  id: 10,
  orderNumber: 'RG-2026-AAAAAA',
  status: 'pending',
  total: 47900,
  customer: { email: 'a@b.com', firstName: 'Juan', lastName: 'P' },
  items: [{ name: 'Vela', quantity: 1, unitPrice: 47900 }],
}

function mockPayloadDb(order: unknown) {
  return {
    findByID: vi.fn().mockResolvedValue(order),
    update: vi.fn().mockResolvedValue({ id: 10 }),
  }
}

function post(body: unknown) {
  return new Request('http://test/api/payments/mercadopago/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
  restoreEnv()
})

describe('POST initiate — validaciones', () => {
  it('503 sin token configurado', async () => {
    setEnv()
    delete process.env.MERCADOPAGO_ACCESS_TOKEN
    const res = await POST(post({ orderId: 10, email: 'a@b.com' }))
    expect(res.status).toBe(503)
    restoreEnv()
  })

  it('400 cuerpo inválido', async () => {
    setEnv()
    for (const body of [{}, { orderId: 'x' }, { orderId: 10 }]) {
      const res = await POST(post(body))
      expect(res.status).toBe(400)
    }
    restoreEnv()
  })

  it('404 pedido inexistente', async () => {
    setEnv()
    vi.mocked(getPayload).mockResolvedValue(mockPayloadDb(null) as never)
    const res = await POST(post({ orderId: 999, email: 'a@b.com' }))
    expect(res.status).toBe(404)
    restoreEnv()
  })

  it('403 email distinto', async () => {
    setEnv()
    vi.mocked(getPayload).mockResolvedValue(mockPayloadDb(PENDING_ORDER) as never)
    const res = await POST(post({ orderId: 10, email: 'otro@x.com' }))
    expect(res.status).toBe(403)
    restoreEnv()
  })

  it('409 pedido no pendiente', async () => {
    setEnv()
    vi.mocked(getPayload).mockResolvedValue(
      mockPayloadDb({ ...PENDING_ORDER, status: 'paid' }) as never,
    )
    const res = await POST(post({ orderId: 10, email: 'a@b.com' }))
    expect(res.status).toBe(409)
    restoreEnv()
  })
})

describe('POST initiate — creación real', () => {
  it('crea la Order en MP, persiste provider+id y devuelve solo checkout_url', async () => {
    setEnv()
    const db = mockPayloadDb(PENDING_ORDER)
    vi.mocked(getPayload).mockResolvedValue(db as never)
    const fetchMock = vi.fn().mockResolvedValue({
      status: 201,
      json: () =>
        Promise.resolve({ id: 'ORDMP1', checkout_url: 'https://mp.test/c/1' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const res = await POST(post({ orderId: 10, email: 'A@B.COM' }))
    expect(res.status).toBe(200)
    const json = (await res.json()) as Record<string, unknown>
    expect(json).toEqual({
      checkoutUrl: 'https://mp.test/c/1',
      externalId: 'ORDMP1',
    })

    // Payload enviado a MP con referencia e idempotencia.
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.mercadopago.com/v1/orders')
    expect(init.headers['X-Idempotency-Key']).toMatch(/^rg-10-/)
    const sent = JSON.parse(init.body)
    expect(sent.external_reference).toBe('RG-2026-AAAAAA')
    expect(sent.total_amount).toBe('47900')

    // Persistencia en nuestra orden.
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'orders',
        id: 10,
        data: { paymentProvider: 'mercadopago', paymentExternalId: 'ORDMP1' },
      }),
    )
    restoreEnv()
  })

  it('error de MP → 502 sin persistir', async () => {
    setEnv()
    const db = mockPayloadDb(PENDING_ORDER)
    vi.mocked(getPayload).mockResolvedValue(db as never)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ message: 'bad' }),
      }),
    )
    const res = await POST(post({ orderId: 10, email: 'a@b.com' }))
    expect(res.status).toBe(502)
    expect(db.update).not.toHaveBeenCalled()
    restoreEnv()
  })
})
