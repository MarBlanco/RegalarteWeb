import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'

vi.mock('payload', () => ({ getPayload: vi.fn() }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }))

const { getPayload } = await import('payload')

function mockPayload(role: string | null) {
  const payload = {
    auth: vi.fn().mockResolvedValue({ user: role ? { role } : null }),
    find: vi.fn().mockImplementation(async (args: { collection: string }) =>
      args.collection === 'categories'
        ? { docs: [{ id: 41 }, { id: 42 }] }
        : {
            docs: [
              { id: 5, title: 'Vela Oculta', slug: 'vela-oculta', price: 4000, stock: 3, soldOut: false, images: [{ url: '/m/a.jpg' }] },
              { id: 6, title: 'Sin imagen', slug: 'sin-imagen', price: 100, images: [9] },
            ],
            totalDocs: 2,
          },
    ),
  }
  vi.mocked(getPayload).mockResolvedValue(payload as never)
  return payload
}

const req = (qs: string, token: string | null = 'tok') =>
  new Request(`http://test/api/edit-mode/products${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

beforeEach(() => vi.clearAllMocks())

describe('GET /api/edit-mode/products (productos ocultos)', () => {
  it.each(['staff', 'admin'])('%s: lista los ocultos de la categoría y sus tipos', async (role) => {
    const payload = mockPayload(role)
    const res = await GET(req('?category=3'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.total).toBe(2)
    expect(body.docs).toEqual([
      { id: 5, title: 'Vela Oculta', slug: 'vela-oculta', price: 4000, stock: 3, soldOut: false, imageUrl: '/m/a.jpg' },
      { id: 6, title: 'Sin imagen', slug: 'sin-imagen', price: 100, stock: null, soldOut: false, imageUrl: null },
    ])
    const productQuery = payload.find.mock.calls.find((c) => c[0].collection === 'products')![0]
    expect(productQuery.where).toEqual({
      and: [{ active: { equals: false } }, { category: { in: [3, 41, 42] } }],
    })
  })

  it('sin token 401; cliente 403; categoría inválida 400; error 500', async () => {
    mockPayload('retail')
    expect((await GET(req('?category=3', null))).status).toBe(401)
    expect((await GET(req('?category=3'))).status).toBe(403)
    const payload = mockPayload('staff')
    expect((await GET(req('?category=abc'))).status).toBe(400)
    payload.find.mockRejectedValue(new Error('db'))
    expect((await GET(req('?category=3'))).status).toBe(500)
  })
})
