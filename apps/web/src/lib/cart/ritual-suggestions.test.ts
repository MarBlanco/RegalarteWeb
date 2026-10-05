import { describe, it, expect } from 'vitest'
import { buildRitualSuggestions } from './ritual-suggestions'

const base = { id: 1, slug: 'a', title: 'A', price: 100, active: true, stock: 5, images: [] }

describe('buildRitualSuggestions', () => {
  it('mapea productos reales con su primera imagen', () => {
    const out = buildRitualSuggestions(
      [{ ...base, images: [{ url: '/img/a.webp' }] }],
      new Set(),
    )
    expect(out).toEqual([
      { id: '1', slug: 'a', name: 'A', price: 100, image: '/img/a.webp' },
    ])
  })

  it('excluye ocultos, agotados, sin stock y los que ya están en el carrito', () => {
    const out = buildRitualSuggestions(
      [
        { ...base, id: 1, slug: 'oculto', active: false },
        { ...base, id: 2, slug: 'agotado', soldOut: true },
        { ...base, id: 3, slug: 'sin-stock', stock: 0 },
        { ...base, id: 4, slug: 'en-carrito' },
        { ...base, id: 5, slug: 'ok' },
      ],
      new Set(['en-carrito']),
    )
    expect(out.map((p) => p.slug)).toEqual(['ok'])
  })

  it('respeta el límite y tolera datos inválidos', () => {
    const docs = Array.from({ length: 9 }, (_, i) => ({ ...base, id: i + 1, slug: `p${i}` }))
    expect(buildRitualSuggestions(docs, new Set())).toHaveLength(5)
    expect(buildRitualSuggestions(null, new Set())).toEqual([])
    expect(buildRitualSuggestions([null, { id: 1 }, 'x'], new Set())).toEqual([])
  })
})
