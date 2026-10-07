import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidateTag } from 'next/cache'
import { POST } from './route'

vi.mock('payload', () => ({ getPayload: vi.fn() }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

const { getPayload } = await import('payload')

function mockPayload(role: string | null = 'staff', existing: { categories?: number; tags?: number; images?: number } = {}) {
  const payload = {
    auth: vi.fn().mockResolvedValue({ user: role ? { role } : null }),
    // idsExist (find por id) devuelve tantos docs como ids pedidos salvo override;
    // uniqueSlug (find por slug) devuelve vacío => libre.
    find: vi.fn().mockImplementation(async (args: { collection: string; where?: Record<string, unknown> }) => {
      if (args.where && 'slug' in args.where) return { docs: [] }
      const ids = ((args.where?.id as { in?: number[] } | undefined)?.in ?? []) as number[]
      const key = args.collection === 'categories' ? 'categories' : args.collection === 'product-tags' ? 'tags' : 'images'
      const n = existing[key] ?? ids.length
      return { docs: ids.slice(0, n).map((id) => ({ id })) }
    }),
    create: vi.fn().mockResolvedValue({ id: 77, title: 'Vela Nueva', slug: 'vela-nueva' }),
  }
  vi.mocked(getPayload).mockResolvedValue(payload as never)
  return payload
}

const req = (body: unknown, token: string | null = 'tok') =>
  new Request('http://test/api/edit-mode/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

const good = {
  title: 'Vela Nueva',
  price: '1500.50',
  stock: '10',
  category: 3,
  active: true,
  featured: false,
  soldOut: false,
  tags: [1, 2],
  images: [4],
  descriptionText: 'Texto',
}

beforeEach(() => vi.clearAllMocks())

describe('POST /api/edit-mode/products', () => {
  it.each(['staff', 'admin'])('%s crea el producto con slug de servidor y revalida', async (role) => {
    const payload = mockPayload(role)
    const res = await POST(req(good))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ id: 77, title: 'Vela Nueva', slug: 'vela-nueva' })
    const args = payload.create.mock.calls[0][0]
    expect(args.collection).toBe('products')
    expect(args.overrideAccess).toBe(false)
    expect(args.data).toMatchObject({
      title: 'Vela Nueva',
      slug: 'vela-nueva',
      price: 1500.5,
      stock: 10,
      category: 3,
      active: true,
      featured: false,
      soldOut: false,
      tags: [1, 2],
      images: [4],
    })
    expect(args.data.description.root.children[0].children[0].text).toBe('Texto')
    expect(revalidateTag).toHaveBeenCalledWith('products', { expire: 0 })
  })

  it('no acepta un slug enviado por el cliente', async () => {
    const payload = mockPayload('staff')
    await POST(req({ ...good, slug: 'hack', wholesalePrice: 1 }))
    const data = payload.create.mock.calls[0][0].data
    expect(data.slug).toBe('vela-nueva')
    expect(data).not.toHaveProperty('wholesalePrice')
  })

  it('sin token → 401, cliente → 403, anónimo con JWT inválido → 403; nunca crea', async () => {
    const payload = mockPayload('retail')
    expect((await POST(req(good, null))).status).toBe(401)
    expect((await POST(req(good))).status).toBe(403)
    mockPayload(null)
    expect((await POST(req(good))).status).toBe(403)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it.each([
    ['sin título', { ...good, title: undefined }],
    ['sin precio', { ...good, price: undefined }],
    ['sin categoría', { ...good, category: undefined }],
    ['precio inválido', { ...good, price: '.' }],
    ['stock decimal', { ...good, stock: '1.5' }],
  ])('rechaza %s con 400', async (_n, body) => {
    const payload = mockPayload('staff')
    expect((await POST(req(body))).status).toBe(400)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('cuerpo no JSON → 400', async () => {
    mockPayload('staff')
    expect((await POST(req('{'))).status).toBe(400)
  })

  it('categoría, tags o imágenes inexistentes → 400', async () => {
    let payload = mockPayload('staff', { categories: 0 })
    expect((await POST(req(good))).status).toBe(400)
    payload = mockPayload('staff', { tags: 1 })
    expect((await POST(req(good))).status).toBe(400)
    payload = mockPayload('staff', { images: 0 })
    expect((await POST(req(good))).status).toBe(400)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('si el alta choca por slug repetido reintenta una vez con slug recalculado', async () => {
    const payload = mockPayload('staff')
    payload.create
      .mockRejectedValueOnce(new Error('unique'))
      .mockResolvedValueOnce({ id: 78, title: 'Vela Nueva', slug: 'vela-nueva-2' })
    const res = await POST(req(good))
    expect(res.status).toBe(201)
    expect(payload.create).toHaveBeenCalledTimes(2)
  })

  it('error de base de datos persistente → 500 tras un único reintento', async () => {
    const payload = mockPayload('staff')
    payload.create.mockRejectedValue(new Error('boom'))
    expect((await POST(req(good))).status).toBe(500)
    expect(payload.create).toHaveBeenCalledTimes(2)
  })
})
