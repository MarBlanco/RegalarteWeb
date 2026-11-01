import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('payload', () => ({ getPayload: vi.fn() }))
vi.mock('@payload-config', () => ({ default: {} }))

const { getPayload } = await import('payload')

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://tienda.example/')
})

async function load() {
  return (await import('./sitemap')).default
}

describe('sitemap', () => {
  it('incluye las páginas base y cada producto activo con su slug', async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [
        { slug: 'vela-uno', updatedAt: '2026-10-01T00:00:00.000Z' },
        { slug: '', updatedAt: null },
        { slug: 'difusor-dos', updatedAt: null },
      ],
    })
    vi.mocked(getPayload).mockResolvedValue({ find } as never)
    const urls = (await (await load())()).map((e) => e.url)
    expect(urls).toEqual([
      'https://tienda.example/',
      'https://tienda.example/catalogo',
      'https://tienda.example/solistica',
      'https://tienda.example/catalogo/vela-uno',
      'https://tienda.example/catalogo/difusor-dos',
    ])
    expect(find.mock.calls[0][0].where).toEqual({ active: { not_equals: false } })
  })

  it('si la base falla devuelve igualmente las páginas base', async () => {
    vi.mocked(getPayload).mockRejectedValue(new Error('db down'))
    const urls = (await (await load())()).map((e) => e.url)
    expect(urls).toHaveLength(3)
  })

  it('sin NEXT_PUBLIC_APP_URL no genera entradas (no hay URLs absolutas posibles)', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    expect(await (await load())()).toEqual([])
  })
})
