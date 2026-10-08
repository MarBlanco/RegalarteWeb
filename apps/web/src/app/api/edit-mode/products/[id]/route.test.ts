import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePath, revalidateTag } from 'next/cache'
import { PUT } from './route'

vi.mock('payload', () => ({
  getPayload: vi.fn(),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

const { getPayload } = await import('payload')

function mockPayload() {
  return {
    findByID: vi.fn().mockResolvedValue({ id: 4, title: 'Vela' }),
    auth: vi.fn().mockResolvedValue({ user: { role: 'staff' } }),
    update: vi
      .fn()
      .mockImplementation(({ data }: { data: unknown }) =>
        Promise.resolve({ id: 4, ...(data as object) }),
      ),
  }
}

function putRequest(body: unknown) {
  return new Request('http://test/api/edit-mode/products/4', {
    method: 'PUT',
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

describe('PUT edit-mode products — invalidación de caché', () => {
  it('Agotado→Disponible invalida el tag products para refresco inmediato', async () => {
    vi.mocked(getPayload).mockResolvedValue(mockPayload() as never)
    const res = await PUT(putRequest({ soldOut: false }), {
      params: Promise.resolve({ id: '4' }),
    })
    expect(res.status).toBe(200)
    expect(revalidateTag).toHaveBeenCalledWith('products', { expire: 0 })
    expect(revalidateTag).toHaveBeenCalledTimes(1)
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('Disponible→Agotado también invalida', async () => {
    vi.mocked(getPayload).mockResolvedValue(mockPayload() as never)
    const res = await PUT(putRequest({ soldOut: true }), {
      params: Promise.resolve({ id: '4' }),
    })
    expect(res.status).toBe(200)
    expect(revalidateTag).toHaveBeenCalledWith('products', { expire: 0 })
  })

  it('si el guardado falla, no invalida', async () => {
    const failing = mockPayload()
    failing.update = vi.fn().mockRejectedValue(new Error('db'))
    vi.mocked(getPayload).mockResolvedValue(failing as never)
    const res = await PUT(putRequest({ soldOut: true }), {
      params: Promise.resolve({ id: '4' }),
    })
    expect(res.status).toBe(500)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
