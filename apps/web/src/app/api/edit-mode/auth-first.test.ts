import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('payload', () => ({ getPayload: vi.fn() }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }))

const { getPayload } = await import('payload')
const media = await import('./media/route')
const categories = await import('./categories/route')
const categoryById = await import('./categories/[id]/route')
const productTags = await import('./product-tags/route')
const productTagById = await import('./product-tags/[id]/route')
const attributeById = await import('./attributes/[id]/route')
const products = await import('./products/route')

const ctx = { params: Promise.resolve({ id: '1' }) }
const bad = (method: string, body: BodyInit | null) =>
  new Request('http://test/api/edit-mode/x', {
    method,
    headers: { 'content-type': 'application/json' },
    body,
  })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getPayload).mockResolvedValue({
    auth: vi.fn().mockResolvedValue({ user: { role: 'retail' } }),
  } as never)
})

// Sin credenciales la respuesta no debe depender de la validez del cuerpo: 401 antes que 400.
describe('edit-mode: autentica antes de validar el cuerpo', () => {
  const cases: Array<[string, () => Promise<Response>]> = [
    ['POST media', () => media.POST(bad('POST', 'no-es-form'))],
    ['POST categories', () => categories.POST(bad('POST', '{no json'))],
    ['PUT categories/[id]', () => categoryById.PUT(bad('PUT', '{no json'), ctx)],
    ['POST product-tags', () => productTags.POST(bad('POST', '{no json'))],
    ['PUT product-tags/[id]', () => productTagById.PUT(bad('PUT', '{no json'), ctx)],
    ['PUT attributes/[id]', () => attributeById.PUT(bad('PUT', '{no json'), ctx)],
    ['POST products', () => products.POST(bad('POST', '{no json'))],
  ]

  it.each(cases)('%s: sin token responde 401, no 400', async (_name, call) => {
    expect((await call()).status).toBe(401)
  })

  it('con token de un cliente (sin rol comercial) responde 403, no 400', async () => {
    const req = new Request('http://test/api/edit-mode/x', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok', 'content-type': 'application/json' },
      body: '{no json',
    })
    expect((await productTags.POST(req)).status).toBe(403)
  })
})
