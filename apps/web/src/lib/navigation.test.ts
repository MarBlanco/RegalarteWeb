import { describe, it, expect } from 'vitest'
import {
  DEFAULT_NAV_LINKS,
  MAX_NAV_ITEMS,
  resolveNavLinks,
  sanitizeNavItems,
  toEditorItems,
} from './navigation'

const cat = (id: number, slug: string, active = true) => ({ id, slug, active })

describe('resolveNavLinks', () => {
  it('sin opciones guardadas devuelve el menú por defecto', () => {
    expect(resolveNavLinks(null)).toBe(DEFAULT_NAV_LINKS)
    expect(resolveNavLinks({ items: [] })).toBe(DEFAULT_NAV_LINKS)
  })

  it('resuelve categoría y ruta en orden y omite las desactivadas', () => {
    const out = resolveNavLinks({
      items: [
        { label: 'Inicio', destinationType: 'path', path: '/', active: true },
        { label: 'Jabones', destinationType: 'category', category: cat(9, 'jabones'), active: true },
        { label: 'Oculta', destinationType: 'category', category: cat(2, 'velas'), active: false },
        { label: 'Regalos', destinationType: 'path', path: '/catalogo?category=regalarte', accent: true },
      ],
    })
    expect(out).toEqual([
      { href: '/', label: 'Inicio', category: null, accent: false },
      { href: '/catalogo?category=jabones', label: 'Jabones', category: 'jabones', accent: false },
      { href: '/catalogo?category=regalarte', label: 'Regalos', category: 'regalarte', accent: true },
    ])
  })

  it('omite categorías inexistentes/ocultas, rutas inválidas y textos vacíos', () => {
    const out = resolveNavLinks({
      items: [
        { label: 'Borrada', destinationType: 'category', category: null },
        { label: 'Sin poblar', destinationType: 'category', category: 5 },
        { label: 'Inactiva', destinationType: 'category', category: cat(3, 'x', false) },
        { label: 'Externa', destinationType: 'path', path: 'https://evil.com' },
        { label: 'Protocolo', destinationType: 'path', path: '//evil.com' },
        { label: '  ', destinationType: 'path', path: '/ok' },
        { label: 'Ok', destinationType: 'path', path: '/ayuda' },
      ],
    })
    expect(out).toEqual([{ href: '/ayuda', label: 'Ok', category: null, accent: false }])
  })
})

describe('toEditorItems', () => {
  const categories = [
    { id: 2, slug: 'velas', title: 'Velas' },
    { id: 8, slug: 'regalarte', title: 'Regalarte' },
  ]

  it('sin guardado parte del menú por defecto resolviendo ids reales', () => {
    const items = toEditorItems(null, categories)
    expect(items[0]).toMatchObject({ label: 'Inicio', destinationType: 'path', path: '/' })
    expect(items[1]).toMatchObject({ label: 'Velas', destinationType: 'category', categoryId: 2 })
    // categoría por defecto inexistente → ruta equivalente (nada se pierde)
    expect(items[2]).toMatchObject({
      label: 'Aromas',
      destinationType: 'path',
      path: '/catalogo?category=aromas',
    })
    expect(items.at(-1)).toMatchObject({ label: 'Regalarte', accent: true })
    expect(new Set(items.map((i) => i.key)).size).toBe(items.length)
  })

  it('con guardado conserva las desactivadas y el id de la categoría', () => {
    const items = toEditorItems(
      {
        items: [
          { label: 'A', destinationType: 'category', category: cat(2, 'velas'), active: false },
          { label: 'B', destinationType: 'category', category: 8 },
          { label: 'C', destinationType: 'path', path: '/ayuda', accent: true },
        ],
      },
      categories,
    )
    expect(items.map((i) => [i.label, i.categoryId, i.active])).toEqual([
      ['A', 2, false],
      ['B', 8, true],
      ['C', null, true],
    ])
    expect(items[2]).toMatchObject({ destinationType: 'path', path: '/ayuda', accent: true })
  })
})

describe('sanitizeNavItems', () => {
  const valid = new Set([2, 8])

  it('acepta categorías válidas y rutas internas, recortando textos', () => {
    const out = sanitizeNavItems(
      {
        items: [
          { label: ' Velas ', destinationType: 'category', categoryId: 2, active: false },
          { label: 'Inicio', destinationType: 'path', path: ' / ', accent: true },
        ],
      },
      valid,
    )
    expect(out).toEqual({
      items: [
        { label: 'Velas', destinationType: 'category', category: 2, path: null, active: false, accent: false },
        { label: 'Inicio', destinationType: 'path', category: null, path: '/', active: true, accent: true },
      ],
    })
  })

  it.each([
    ['sin cuerpo', null],
    ['lista vacía', { items: [] }],
    ['texto vacío', { items: [{ label: ' ', destinationType: 'path', path: '/' }] }],
    ['texto largo', { items: [{ label: 'x'.repeat(41), destinationType: 'path', path: '/' }] }],
    ['ruta externa', { items: [{ label: 'a', destinationType: 'path', path: 'https://x.com' }] }],
    ['categoría inexistente', { items: [{ label: 'a', destinationType: 'category', categoryId: 99 }] }],
    ['categoría sin id', { items: [{ label: 'a', destinationType: 'category' }] }],
    [
      'demasiadas opciones',
      {
        items: Array.from({ length: MAX_NAV_ITEMS + 1 }, () => ({
          label: 'a',
          destinationType: 'path',
          path: '/',
        })),
      },
    ],
  ])('rechaza %s', (_n, body) => {
    expect(sanitizeNavItems(body, valid)).toHaveProperty('error')
  })
})
