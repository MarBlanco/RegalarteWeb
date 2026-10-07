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

describe('Tipos — orden y visibilidad', () => {
  it('el alta usa active enviado y se ubica al final (máximo + 1, desde 1)', async () => {
    const db = mockPayloadDb()
    db.find.mockResolvedValue({ docs: [{ sortOrder: 4 }] })
    vi.mocked(getPayload).mockResolvedValue(db as never)
    await POST(authedJson({ title: 'Nuevo', parent: 3, active: false }))
    expect(db.create.mock.calls[0][0].data).toMatchObject({ sortOrder: 5, active: false, parent: 3 })
    db.find.mockResolvedValue({ docs: [] })
    await POST(authedJson({ title: 'Primero', parent: 3 }))
    expect(db.create.mock.calls[1][0].data).toMatchObject({ sortOrder: 1, active: true })
  })

  it('PUT con sortOrder reubica entre hermanos y renumera todos sin duplicados', async () => {
    const db = mockPayloadDb()
    db.findByID.mockResolvedValue({ id: 41, title: 'Vela Clásica', parent: 3 })
    db.find.mockResolvedValue({
      docs: [
        { id: 41, sortOrder: 2 },
        { id: 43, sortOrder: 2 },
        { id: 44, sortOrder: 3 },
        { id: 45, sortOrder: 4 },
      ],
    })
    vi.mocked(getPayload).mockResolvedValue(db as never)
    const res = await PUT(authedJson({ sortOrder: 3 }), { params: Promise.resolve({ id: '41' }) })
    expect(res.status).toBe(200)
    const updates = db.update.mock.calls.map((c) => [c[0].id, c[0].data.sortOrder])
    // 43→1, 44→2, 41→3 (la edición propia); 45 ya estaba en 4 y no se toca
    expect(updates).toEqual(
      expect.arrayContaining([
        [43, 1],
        [44, 2],
        [41, 3],
      ]),
    )
    expect(updates).toHaveLength(3)
  })

  it('PUT sin sortOrder no toca a los hermanos', async () => {
    const db = mockPayloadDb()
    db.findByID.mockResolvedValue({ id: 41, title: 'Vela Clásica', parent: 3 })
    vi.mocked(getPayload).mockResolvedValue(db as never)
    await PUT(authedJson({ active: false }), { params: Promise.resolve({ id: '41' }) })
    expect(db.update).toHaveBeenCalledTimes(1)
    expect(db.find).not.toHaveBeenCalled()
  })
})

describe('Tipos — invalidación inmediata del caché', () => {
  it('POST invalida categories', async () => {
    vi.mocked(getPayload).mockResolvedValue(mockPayloadDb() as never)
    const res = await POST(authedJson({ title: 'Nuevo Tipo', parent: 3 }))
    expect(res.status).toBe(201)
    expect(revalidateTag).toHaveBeenCalledWith('categories', { expire: 0 })
  })

  it('PUT invalida categories', async () => {
    vi.mocked(getPayload).mockResolvedValue(mockPayloadDb() as never)
    const res = await PUT(authedJson({ title: 'Renombrado' }), {
      params: Promise.resolve({ id: '31' }),
    })
    expect(res.status).toBe(200)
    expect(revalidateTag).toHaveBeenCalledWith('categories', { expire: 0 })
  })

  it('DELETE invalida categories', async () => {
    vi.mocked(getPayload).mockResolvedValue(mockPayloadDb() as never)
    const res = await DELETE(authedJson({}), {
      params: Promise.resolve({ id: '31' }),
    })
    expect(res.status).toBe(200)
    expect(revalidateTag).toHaveBeenCalledWith('categories', { expire: 0 })
  })
})
