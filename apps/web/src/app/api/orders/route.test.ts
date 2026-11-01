import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const createOrder = vi.fn()
vi.mock('@/lib/orders/service', () => ({
  createOrder: (...a: unknown[]) => createOrder(...a),
  OrderRejectedError: class OrderRejectedError extends Error {
    code = 'UNAVAILABLE'
  },
}))
vi.mock('payload', () => ({ getPayload: vi.fn() }))
vi.mock('@payload-config', () => ({ default: {} }))

const { getPayload } = await import('payload')
const { POST } = await import('./route')

const body = (mode: string) => ({
  customer: { firstName: 'Ana', lastName: 'Gómez', email: 'ana@mail.com', phone: '1155551234' },
  address: { province: 'Entre Ríos', city: 'Colón', street: 'Retiro en local', postalCode: '3280' },
  mode,
  items: [{ productId: '4', slug: 'vela', name: 'Vela', price: 30000, quantity: 1 }],
})

const req = (payload: unknown, headers: Record<string, string> = {}) =>
  new NextRequest('http://test/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  })

function authAs(user: Record<string, unknown> | null, wholesaleEnabled = true) {
  const auth = vi.fn().mockResolvedValue({ user })
  const findGlobal = vi.fn().mockResolvedValue({ wholesale_enabled: wholesaleEnabled })
  vi.mocked(getPayload).mockResolvedValue({ auth, findGlobal } as never)
  return auth
}

beforeEach(() => {
  vi.clearAllMocks()
  createOrder.mockResolvedValue({ status: 'success', orderId: '9', redirectUrl: '/checkout/orden/9?sig=x' })
})

describe('POST /api/orders — precio mayorista', () => {
  it('visitante sin sesión que envía mode WHOLESALE recibe 403 y no se crea el pedido', async () => {
    authAs(null)
    const res = await POST(req(body('WHOLESALE')))
    expect(res.status).toBe(403)
    expect((await res.json()).message).toMatch(/mayorista/i)
    expect(createOrder).not.toHaveBeenCalled()
  })

  it('cliente minorista autenticado que envía WHOLESALE también recibe 403', async () => {
    authAs({ customer_type: 'RETAIL', role: 'retail' })
    const res = await POST(req(body('WHOLESALE'), { authorization: 'Bearer tok' }))
    expect(res.status).toBe(403)
    expect(createOrder).not.toHaveBeenCalled()
  })

  it('cuenta mayorista: se crea el pedido y el token Bearer se normaliza a JWT', async () => {
    const auth = authAs({ customer_type: 'WHOLESALE', role: 'wholesale' })
    const res = await POST(req(body('WHOLESALE'), { authorization: 'Bearer tok123' }))
    expect(res.status).toBe(201)
    expect(createOrder).toHaveBeenCalledTimes(1)
    const sent = auth.mock.calls[0][0].headers as Headers
    expect(sent.get('authorization')).toBe('JWT tok123')
  })

  it('canal mayorista deshabilitado en la configuración: 403 incluso para una cuenta mayorista', async () => {
    authAs({ customer_type: 'WHOLESALE', role: 'wholesale' }, false)
    const res = await POST(req(body('WHOLESALE'), { authorization: 'Bearer tok' }))
    expect(res.status).toBe(403)
    expect(createOrder).not.toHaveBeenCalled()
  })

  it('modo RETAIL no consulta la sesión y sigue funcionando para visitantes', async () => {
    const auth = authAs(null)
    const res = await POST(req(body('RETAIL')))
    expect(res.status).toBe(201)
    expect(auth).not.toHaveBeenCalled()
  })

  it('si falla la verificación de sesión, se trata como no mayorista (falla cerrada)', async () => {
    vi.mocked(getPayload).mockRejectedValue(new Error('db down'))
    const res = await POST(req(body('WHOLESALE')))
    expect(res.status).toBe(403)
    expect(createOrder).not.toHaveBeenCalled()
  })
})

describe('POST /api/orders — valores sin sentido', () => {
  it('rechaza dirección, ciudad, código postal y teléfono inválidos con 400 y no crea el pedido', async () => {
    const bad = body('RETAIL') as ReturnType<typeof body> & Record<string, any>
    bad.address = { province: 'Entre Ríos', city: '1', street: 'x', postalCode: '!!' }
    bad.customer.phone = '12ab'
    const res = await POST(req(bad))
    expect(res.status).toBe(400)
    const paths = (await res.json()).fieldErrors.map((e: { path: string }) => e.path).sort()
    expect(paths).toEqual(['address.city', 'address.postalCode', 'address.street', 'customer.phone'])
    expect(createOrder).not.toHaveBeenCalled()
  })
})
