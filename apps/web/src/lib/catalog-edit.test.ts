import { describe, it, expect } from 'vitest'
import {
  slugify,
  sanitizeCategoryCreate,
  sanitizeCategoryPatch,
  reorderSiblings,
  sanitizeProductCreate,
  sanitizeFilterTagCreate,
  sanitizeFilterTagPatch,
} from './catalog-edit'
import { getCategoryTipos } from '@/components/catalog/catalog-tipos'

const NAV_SLUGS = [
  'velas',
  'aromas',
  'wax-melts',
  'quemadores',
  'packs',
  'regalarte',
]

describe('Catálogo dinámico — las 6 categorías resuelven tipos', () => {
  it.each(NAV_SLUGS)('%s tiene tipos con forma válida', (slug) => {
    const tipos = getCategoryTipos(slug, [])
    expect(tipos.length).toBeGreaterThanOrEqual(5)
    for (const t of tipos) {
      expect(t.slug).toBeTruthy()
      expect(t.name).toBeTruthy()
      expect(typeof t.real).toBe('boolean')
    }
  })
})

describe('Catálogo dinámico — slugify', () => {
  it('normaliza títulos a slugs limpios', () => {
    expect(slugify('Vela Clásica')).toBe('vela-clasica')
    expect(slugify('  Sets & Regalos  ')).toBe('sets-regalos')
    expect(slugify('Wax-Melts')).toBe('wax-melts')
    expect(slugify('')).toBe('')
  })
})

describe('Catálogo dinámico — alta de tipo', () => {
  it('acepta título y padre', () => {
    expect(
      sanitizeCategoryCreate({ title: 'Bubble', parent: 3 }),
    ).toEqual({
      title: 'Bubble',
      description: '',
      parent: 3,
      active: true,
    })
  })

  it('rechaza sin título o sin padre', () => {
    expect(sanitizeCategoryCreate(null)).toBeNull()
    expect(sanitizeCategoryCreate({ title: '', parent: 3 })).toBeNull()
    expect(sanitizeCategoryCreate({ title: 'X' })).toBeNull()
    expect(sanitizeCategoryCreate({ title: 'X', parent: 'y' })).toBeNull()
  })
})

describe('Catálogo dinámico — edición de tipo', () => {
  it('acepta patch parcial válido', () => {
    expect(
      sanitizeCategoryPatch({ title: 'Nuevo', sortOrder: 2, active: false }),
    ).toEqual({ title: 'Nuevo', sortOrder: 2, active: false })
    expect(sanitizeCategoryPatch({ image: null })).toEqual({ image: null })
  })

  it('rechaza vacío o inválido', () => {
    expect(sanitizeCategoryPatch({})).toBeNull()
    expect(sanitizeCategoryPatch({ title: '' })).toBeNull()
    expect(sanitizeCategoryPatch({ sortOrder: -1 })).toBeNull()
  })
})

describe('Catálogo dinámico — alta de producto', () => {
  it('acepta título, precio y categoría', () => {
    expect(
      sanitizeProductCreate({ title: 'Vela X', price: 5000, category: 3 }),
    ).toEqual({
      title: 'Vela X',
      price: 5000,
      category: 3,
      stock: 0,
      active: true,
    })
  })

  it('rechaza incompleto o inválido, sin campos técnicos', () => {
    expect(sanitizeProductCreate({ title: 'X', price: 5 })).toBeNull()
    expect(
      sanitizeProductCreate({ title: 'X', price: 5, category: 3, slug: 'y' }),
    ).toEqual({
      title: 'X',
      price: 5,
      category: 3,
      stock: 0,
      active: true,
    })
    expect(
      sanitizeProductCreate({
        title: 'X',
        price: 5,
        category: 3,
        role: 'admin',
        wholesalePrice: 1,
      }),
    ).toEqual({
      title: 'X',
      price: 5,
      category: 3,
      stock: 0,
      active: true,
    })
  })
})

describe('Filtros — alta de opción aroma/ritual', () => {
  it('acepta nombre, grupo y color válido', () => {
    expect(
      sanitizeFilterTagCreate({
        name: 'Vainilla',
        kind: 'aroma',
        color: '#E9C893',
      }),
    ).toEqual({ name: 'Vainilla', kind: 'aroma', color: '#E9C893' })
  })

  it('acepta ritual sin color', () => {
    expect(
      sanitizeFilterTagCreate({ name: 'Relajación', kind: 'ritual' }),
    ).toEqual({ name: 'Relajación', kind: 'ritual' })
  })

  it('rechaza grupo general u otros campos técnicos', () => {
    expect(
      sanitizeFilterTagCreate({ name: 'X', kind: 'general' }),
    ).toBeNull()
    expect(sanitizeFilterTagCreate({ name: 'X' })).toBeNull()
    expect(sanitizeFilterTagCreate({ name: '', kind: 'aroma' })).toBeNull()
    expect(
      sanitizeFilterTagCreate({
        name: 'X',
        kind: 'aroma',
        color: 'rojo',
      }),
    ).toBeNull()
    expect(
      sanitizeFilterTagCreate({ name: 'X', kind: 'aroma', slug: 'x' }),
    ).toEqual({ name: 'X', kind: 'aroma' })
  })
})

describe('Filtros — edición de opción aroma/ritual', () => {
  it('acepta nombre, color y activo; nunca slug ni grupo', () => {
    expect(
      sanitizeFilterTagPatch({ name: 'Ámbar', color: '#C47A2B' }),
    ).toEqual({ name: 'Ámbar', color: '#C47A2B' })
    expect(sanitizeFilterTagPatch({ active: false })).toEqual({
      active: false,
    })
    expect(
      sanitizeFilterTagPatch({ name: 'X', slug: 'y', kind: 'ritual' }),
    ).toEqual({ name: 'X' })
  })

  it('rechaza vacío o valores inválidos', () => {
    expect(sanitizeFilterTagPatch({})).toBeNull()
    expect(sanitizeFilterTagPatch({ name: '' })).toBeNull()
    expect(sanitizeFilterTagPatch({ color: 'zzz' })).toBeNull()
    expect(sanitizeFilterTagPatch({ active: 'si' })).toBeNull()
  })
})

describe('Alta de tipo — visibilidad', () => {
  it('acepta active y lo rechaza si no es booleano', () => {
    expect(sanitizeCategoryCreate({ title: 'X', parent: 3, active: false })).toMatchObject({
      active: false,
    })
    expect(sanitizeCategoryCreate({ title: 'X', parent: 3, active: 'tal vez' })).toBeNull()
  })
})

describe('reorderSiblings', () => {
  const sibs = [
    { id: 1, sortOrder: 2 },
    { id: 2, sortOrder: 2 },
    { id: 3, sortOrder: 3 },
    { id: 4, sortOrder: 4 },
  ]
  const asList = (m: Map<number, number>) => [...m.entries()].sort((a, b) => a[1] - b[1]).map(([id]) => id)

  it('renumera de 1 a n sin duplicados, aun con duplicados previos', () => {
    const out = reorderSiblings(sibs, 1, 2)
    expect(asList(out)).toEqual([2, 1, 3, 4])
    expect(new Set(out.values()).size).toBe(4)
    expect([...out.values()].sort()).toEqual([1, 2, 3, 4])
  })

  it('mover al primero y al último', () => {
    expect(asList(reorderSiblings(sibs, 4, 1))).toEqual([4, 1, 2, 3])
    expect(asList(reorderSiblings(sibs, 1, 99))).toEqual([2, 3, 4, 1])
  })

  it('acota posiciones inválidas', () => {
    expect(asList(reorderSiblings(sibs, 3, 0))).toEqual([3, 1, 2, 4])
    expect(asList(reorderSiblings(sibs, 3, -5))).toEqual([3, 1, 2, 4])
  })
})
