import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({
  unstable_cache: (fn: () => unknown) => fn,
}))
vi.mock('payload', () => ({ getPayload: vi.fn() }))
vi.mock('@payload-config', () => ({ default: {} }))

const { getPayload } = await import('payload')
const { getNavLinks } = await import('./navigation-server')
const { DEFAULT_NAV_LINKS } = await import('./navigation')

beforeEach(() => vi.clearAllMocks())

describe('getNavLinks', () => {
  it('lee el global con depth 1 y resuelve las opciones visibles', async () => {
    const findGlobal = vi.fn().mockResolvedValue({
      items: [{ label: 'Packs', destinationType: 'path', path: '/catalogo?category=packs' }],
    })
    vi.mocked(getPayload).mockResolvedValue({ findGlobal } as never)
    expect(await getNavLinks()).toEqual([
      { href: '/catalogo?category=packs', label: 'Packs', category: 'packs', accent: false },
    ])
    expect(findGlobal.mock.calls[0][0]).toMatchObject({ slug: 'navigation', depth: 1 })
  })

  it('si la DB falla devuelve el menú por defecto', async () => {
    vi.mocked(getPayload).mockRejectedValue(new Error('db down'))
    expect(await getNavLinks()).toBe(DEFAULT_NAV_LINKS)
  })
})
