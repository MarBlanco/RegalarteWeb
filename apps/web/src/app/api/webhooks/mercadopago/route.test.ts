import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHmac } from 'node:crypto'
import { POST } from './route'

vi.mock('payload', () => ({
  getPayload: vi.fn(),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

const { getPayload } = await import('payload')

const SECRET = 'wh-secret'
const savedEnv: Record<string, string | undefined> = {}

function setEnv() {
  for (const k of ['MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_WEBHOOK_SECRET'] as const) {
    savedEnv[k] = process.env[k]
  }
  process.env.MERCADOPAGO_ACCESS_TOKEN = 'APP_USR-test'
  process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET
}

function restoreEnv() {
  for (const k of ['MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_WEBHOOK_SECRET'] as const) {
    if (savedEnv[k] === undefined) delete process.env[k]
    else process.env[k] = savedEnv[k]
  }
}

function signHeaders(dataId: string, requestId = 'req-1', ts = '1704908010') {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const v1 = createHmac('sha256', SECRET).update(manifest).digest('hex')
  return {
    'x-signature': `ts=${ts},v1=${v1}`,
    'x-request-id': requestId,
  }
}

function webhookRequest(
  dataId: string,
  type: string,
  headers?: Record<string, string>,
) {
  return new Request(
    `http://test/api/webhooks/mercadopago?data.id=${dataId}&type=${type}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(headers ?? signHeaders(dataId)),
      },
      body: JSON.stringify({ data: { id: dataId }, type }),
    },
  )
}

const MP_PAID = {
  id: 'ORDMP1',
  status: 'processed',
  external_reference: 'RG-2026-AAAAAA',
  total_amount: '47900',
  total_paid_amount: '47900',
  currency: 'ARS',
}

const OUR_PENDING = {
  id: 10,
  orderNumber: 'RG-2026-AAAAAA',
  status: 'pending',
  total: 47900,
}

function mockPayloadDb(ours: unknown) {
  return {
    find: vi.fn().mockResolvedValue({ docs: ours ? [ours] : [] }),
    update: vi.fn().mockResolvedValue({ id: 10 }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
  restoreEnv()
})

describe('webhook — firma y tópico', () => {
  it('firma inválida → 401', async () => {
    setEnv()
    const res = await POST(
      webhookRequest('ORDMP1', 'order', {
        'x-signature': 'ts=1,v1=mala',
        'x-request-id': 'req-1',
      }),
    )
    expect(res.status).toBe(401)
    restoreEnv()
  })

  it('tópico no-order se ignora con 200', async () => {
    setEnv()
    const res = await POST(webhookRequest('X1', 'payment'))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true })
    restoreEnv()
  })
})

describe('webhook — pase a paid', () => {
  it('validación completa marca paid una sola vez', async () => {
    setEnv()
    const db = mockPayloadDb(OUR_PENDING)
    vi.mocked(getPayload).mockResolvedValue(db as never)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve(MP_PAID),
      }),
    )
    const res = await POST(webhookRequest('ORDMP1', 'order'))
    expect(res.status).toBe(200)
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'orders',
        id: 10,
        data: {
          status: 'paid',
          paymentProvider: 'mercadopago',
          paymentExternalId: 'ORDMP1',
        },
      }),
    )
    restoreEnv()
  })

  it('ya paid → no-op idempotente', async () => {
    setEnv()
    const db = mockPayloadDb({ ...OUR_PENDING, status: 'paid' })
    vi.mocked(getPayload).mockResolvedValue(db as never)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve(MP_PAID),
      }),
    )
    const res = await POST(webhookRequest('ORDMP1', 'order'))
    expect(res.status).toBe(200)
    expect(db.update).not.toHaveBeenCalled()
    restoreEnv()
  })

  it('monto distinto no marca paid', async () => {
    setEnv()
    const db = mockPayloadDb(OUR_PENDING)
    vi.mocked(getPayload).mockResolvedValue(db as never)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ ...MP_PAID, total_amount: '100' }),
      }),
    )
    const res = await POST(webhookRequest('ORDMP1', 'order'))
    expect(res.status).toBe(200)
    expect(db.update).not.toHaveBeenCalled()
    restoreEnv()
  })

  it('referencia desconocida no marca nada', async () => {
    setEnv()
    const db = mockPayloadDb(null)
    vi.mocked(getPayload).mockResolvedValue(db as never)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve(MP_PAID),
      }),
    )
    const res = await POST(webhookRequest('ORDMP1', 'order'))
    expect(res.status).toBe(200)
    expect(db.update).not.toHaveBeenCalled()
    restoreEnv()
  })
})
