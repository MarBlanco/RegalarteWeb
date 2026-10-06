import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidateTag } from 'next/cache'
import { GET, PUT } from './route'

vi.mock('payload', () => ({ getPayload: vi.fn() }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

const { getPayload } = await import('payload')

function mockPayload(role: string | null = 'staff') {
  const payload = {
    auth: vi.fn().mockResolvedValue({ user: role ? { role } : null }),
    find: vi.fn().mockResolvedValue({ docs: [{ id: 2, slug: 'velas', title: 'Velas' }] }),
    findGlobal: vi.fn().mockResolvedValue({ items: [] }),
    updateGlobal: vi.fn().mockResolvedValue({ items: [{ label: 'Velas' }] }),
  }
  vi.mocked(getPayload).mockResolvedValue(payload as never)
  return payload
}

const req = (method: string, body?: unknown, token: string | null = 'tok') =>
  new Request('http://test/api/edit-mode/navigation', {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

const goodBody = {
  items: [{ label: 'Velas', destinationType: 'category', categoryId: 2 }],
}

beforeEach(() => vi.clearAllMocks())

describe('/api/edit-mode/navigation', () => {
  it('sin token → 401 y no toca la DB', async () => {
    const payload = mockPayload()
    expect((await GET(req('GET', undefined, null))).status).toBe(401)
    expect((await PUT(req('PUT', goodBody, null))).status).toBe(401)
    expect(payload.updateGlobal).not.toHaveBeenCalled()
  })

  it.each(['retail', 'wholesale', null])('rol %s → 403 en GET y PUT', async (role) => {
    const payload = mockPayload(role)
    expect((await GET(req('GET'))).status).toBe(403)
    expect((await PUT(req('PUT', goodBody))).status).toBe(403)
    expect(payload.updateGlobal).not.toHaveBeenCalled()
  })

  it.each(['staff', 'admin'])('%s lee opciones y categorías', async (role) => {
    mockPayload(role)
    const res = await GET(req('GET'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      stored: { items: [] },
      categories: [{ id: 2, slug: 'velas', title: 'Velas' }],
    })
  })

  it.each(['staff', 'admin'])('%s guarda y revalida el cache del menú', async (role) => {
    const payload = mockPayload(role)
    const res = await PUT(req('PUT', goodBody))
    expect(res.status).toBe(200)
    expect(payload.updateGlobal.mock.calls[0][0]).toMatchObject({
      slug: 'navigation',
      data: {
        items: [
          { label: 'Velas', destinationType: 'category', category: 2, path: null, active: true, accent: false },
        ],
      },
    })
    expect(revalidateTag).toHaveBeenCalledWith('navigation', { expire: 0 })
  })

  it('valida destinos: categoría inexistente y ruta externa → 400', async () => {
    const payload = mockPayload('staff')
    const bad = await PUT(
      req('PUT', { items: [{ label: 'X', destinationType: 'category', categoryId: 99 }] }),
    )
    expect(bad.status).toBe(400)
    const ext = await PUT(
      req('PUT', { items: [{ label: 'X', destinationType: 'path', path: 'https://evil.com' }] }),
    )
    expect(ext.status).toBe(400)
    expect(payload.updateGlobal).not.toHaveBeenCalled()
  })

  it('cuerpo no JSON → 400; fallo de DB → 500', async () => {
    mockPayload('staff')
    const notJson = new Request('http://test', {
      method: 'PUT',
      headers: { Authorization: 'Bearer tok' },
      body: '{',
    })
    expect((await PUT(notJson)).status).toBe(400)
    const payload = mockPayload('staff')
    payload.updateGlobal.mockRejectedValue(new Error('boom'))
    expect((await PUT(req('PUT', goodBody))).status).toBe(500)
    payload.findGlobal.mockRejectedValue(new Error('boom'))
    expect((await GET(req('GET'))).status).toBe(500)
  })
})
