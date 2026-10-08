import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ updateTag: vi.fn() }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))
vi.mock('@payload-config', () => ({ default: {} }))

const { updateTag } = await import('next/cache')
const { getPayload } = await import('payload')
// vitest.setup mockea la acción globalmente; acá se prueba la real.
const { refreshStorefrontAction } = await vi.importActual<typeof import('./refresh-storefront')>('./refresh-storefront')

function asUser(role: string | null) {
  vi.mocked(getPayload).mockResolvedValue({
    auth: vi.fn().mockResolvedValue({ user: role ? { role } : null }),
  } as never)
}

beforeEach(() => vi.clearAllMocks())

describe('refreshStorefrontAction', () => {
  it.each(['admin', 'staff'])('%s: expira products, categories y product-tags', async (role) => {
    asUser(role)
    expect(await refreshStorefrontAction('tok')).toEqual({ ok: true })
    expect(updateTag).toHaveBeenCalledWith('products')
    expect(updateTag).toHaveBeenCalledWith('categories')
    expect(updateTag).toHaveBeenCalledWith('product-tags')
  })

  it.each(['retail', 'wholesale', null])('rol %s: no purga nada', async (role) => {
    asUser(role)
    expect(await refreshStorefrontAction('tok')).toEqual({ ok: false })
    expect(updateTag).not.toHaveBeenCalled()
  })

  it('token vacío o JWT inválido: no purga', async () => {
    expect(await refreshStorefrontAction('')).toEqual({ ok: false })
    vi.mocked(getPayload).mockResolvedValue({
      auth: vi.fn().mockRejectedValue(new Error('jwt')),
    } as never)
    expect(await refreshStorefrontAction('bad')).toEqual({ ok: false })
    expect(updateTag).not.toHaveBeenCalled()
  })
})
