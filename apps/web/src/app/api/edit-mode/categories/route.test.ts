import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidateTag } from 'next/cache'
import { POST } from './route'
import { PUT, DELETE } from './[id]/route'

vi.mock('payload', () => ({
  getPayload: vi.fn(),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))

const { getPayload } = await import('payload')

function mockPayloadDb() {
  return {
    findByID: vi.fn().mockResolvedValue({ id: 3, title: 'Velas' }),
    find: vi.fn().mockResolvedValue({ docs: [] }),
    create: vi.fn().mockResolvedValue({ id: 31, title: 'X', slug: 'x' }),
    update: vi.fn().mockResolvedValue({ id: 31, title: 'X', slug: 'x' }),
    delete: vi.fn().mockResolvedValue({ id: 31 }),
    auth: vi.fn().mockResolvedValue({ user: { role: 'staff' } }),
  }
}

function authedJson(body: unknown) {
  return new Request('http://test/api/edit-mode/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer tok',
    },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Tipos — alta desde el editor central', () => {
  it('respeta visibilidad, orden y SEO enviados y asocia al padre', async () => {
    const db = mockPayloadDb()
    vi.mocked(getPayload).mockResolvedValue(db as never)
    const res = await POST(
      authedJson({
        title: 'Vela Bubble',
        parent: 3,
        active: false,
        sortOrder: 0,
        seoTitle: 'SEO',
      }),
    )
    expect(res.status).toBe(201)
    expect(db.create.mock.calls[0][0].data).toMatchObject({
      title: 'Vela Bubble',
      slug: 'vela-bubble',
      parent: 3,
      active: false,
      sortOrder: 0,
      seoTitle: 'SEO',
    })
  })

  it('sin orden enviado calcula el siguiente', async () => {
    const db = mockPayloadDb()
    db.find.mockResolvedValue({ docs: [{ sortOrder: 4 }] })
    vi.mocked(getPayload).mockResolvedValue(db as never)
    await POST(authedJson({ title: 'Otro', parent: 3 }))
    expect(db.create.mock.calls[0][0].data).toMatchObject({ sortOrder: 5, active: true })
  })
})

describe('Tipos — invalidación inmediata del caché', () => {
  it('POST invalida categories', async () => {
    vi.mocked(getPayload).mockResolvedValue(mockPayloadDb() as never)
    const res = await POST(authedJson({ title: 'Nuevo Tipo', parent: 3 }))
    expect(res.status).toBe(201)
    expect(revalidateTag).toHaveBeenCalledWith('categories', 'max')
  })

  it('PUT invalida categories', async () => {
    vi.mocked(getPayload).mockResolvedValue(mockPayloadDb() as never)
    const res = await PUT(authedJson({ title: 'Renombrado' }), {
      params: Promise.resolve({ id: '31' }),
    })
    expect(res.status).toBe(200)
    expect(revalidateTag).toHaveBeenCalledWith('categories', 'max')
  })

  it('DELETE invalida categories', async () => {
    vi.mocked(getPayload).mockResolvedValue(mockPayloadDb() as never)
    const res = await DELETE(authedJson({}), {
      params: Promise.resolve({ id: '31' }),
    })
    expect(res.status).toBe(200)
    expect(revalidateTag).toHaveBeenCalledWith('categories', 'max')
  })
})
