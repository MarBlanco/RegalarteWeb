import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getMpAccessToken,
  getMpWebhookSecret,
  createMpOrder,
  getMpOrder,
  MpError,
} from './client'

const TOKEN = 'APP_USR-test'

function mockFetchOnce(status: number, json: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      status,
      json: () => Promise.resolve(json),
    }),
  )
}

beforeEach(() => {
  vi.unstubAllGlobals()
  delete process.env.MERCADOPAGO_ACCESS_TOKEN
  delete process.env.MERCADOPAGO_WEBHOOK_SECRET
})

describe('config server-only', () => {
  it('token ausente o placeholder → null', () => {
    expect(getMpAccessToken()).toBeNull()
    process.env.MERCADOPAGO_ACCESS_TOKEN = 'placeholder-mp-access-token'
    expect(getMpAccessToken()).toBeNull()
    process.env.MERCADOPAGO_ACCESS_TOKEN = TOKEN
    expect(getMpAccessToken()).toBe(TOKEN)
  })

  it('secret ausente → null', () => {
    expect(getMpWebhookSecret()).toBeNull()
    process.env.MERCADOPAGO_WEBHOOK_SECRET = 's3cret'
    expect(getMpWebhookSecret()).toBe('s3cret')
  })
})

describe('createMpOrder', () => {
  it('envía auth + idempotency y devuelve id + checkout_url', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 201,
      json: () =>
        Promise.resolve({ id: 'ORD1', checkout_url: 'https://mp.test/c/1' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const res = await createMpOrder(
      { type: 'online' },
      { token: TOKEN, idempotencyKey: 'rg-1-abc' },
    )
    expect(res).toEqual({ id: 'ORD1', checkoutUrl: 'https://mp.test/c/1' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.mercadopago.com/v1/orders')
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`)
    expect(init.headers['X-Idempotency-Key']).toBe('rg-1-abc')
  })

  it('sin 201 o sin campos lanza MpError', async () => {
    mockFetchOnce(400, { message: 'bad', error: 'property_value' })
    await expect(
      createMpOrder({}, { token: TOKEN, idempotencyKey: 'k' }),
    ).rejects.toMatchObject({ status: 400 })
    mockFetchOnce(201, { id: 'ORD1' })
    await expect(
      createMpOrder({}, { token: TOKEN, idempotencyKey: 'k' }),
    ).rejects.toBeInstanceOf(MpError)
  })

  it('falla de red → 503', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('down')),
    )
    await expect(
      createMpOrder({}, { token: TOKEN, idempotencyKey: 'k' }),
    ).rejects.toMatchObject({ status: 503 })
  })
})

describe('getMpOrder', () => {
  it('200 con id devuelve la orden', async () => {
    mockFetchOnce(200, { id: 'ORD1', status: 'processed' })
    const order = await getMpOrder('ORD1', { token: TOKEN })
    expect(order.id).toBe('ORD1')
  })

  it('404 → MpError 404', async () => {
    mockFetchOnce(404, { message: 'not found' })
    await expect(getMpOrder('NOPE', { token: TOKEN })).rejects.toMatchObject(
      { status: 404 },
    )
  })
})
