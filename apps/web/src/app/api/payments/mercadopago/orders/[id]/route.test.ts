import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'

vi.mock('@payload-config', () => ({
  default: {},
}))

const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
  for (const k of ['MERCADOPAGO_ACCESS_TOKEN'] as const) saved[k] = process.env[k]
})

function restore() {
  for (const k of ['MERCADOPAGO_ACCESS_TOKEN'] as const) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
}

describe('GET estado de Order MP', () => {
  it('503 sin token', async () => {
    delete process.env.MERCADOPAGO_ACCESS_TOKEN
    const res = await GET(new Request('http://test/x'), {
      params: Promise.resolve({ id: 'ORD1' }),
    })
    expect(res.status).toBe(503)
    restore()
  })

  it('normaliza la respuesta', async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = 'APP_USR-test'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        json: () =>
          Promise.resolve({
            id: 'ORD1',
            status: 'processed',
            external_reference: 'RG-1',
            total_amount: '100',
            total_paid_amount: '100',
            currency: 'ARS',
          }),
      }),
    )
    const res = await GET(new Request('http://test/x'), {
      params: Promise.resolve({ id: 'ORD1' }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      id: 'ORD1',
      status: 'processed',
      currency: 'ARS',
    })
    restore()
  })

  it('404 de MP → 404', async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = 'APP_USR-test'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 404,
        json: () => Promise.resolve({ message: 'no' }),
      }),
    )
    const res = await GET(new Request('http://test/x'), {
      params: Promise.resolve({ id: 'NOPE' }),
    })
    expect(res.status).toBe(404)
    restore()
  })
})
