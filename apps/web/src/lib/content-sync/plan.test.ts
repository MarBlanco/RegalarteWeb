import { describe, it, expect } from 'vitest'
import {
  parseArgs,
  isLocalDest,
  prodGuard,
  sameData,
  buildCategoryData,
  buildTagData,
  buildAttributeData,
  buildProductData,
  stripGlobalMeta,
  eligibleProduct,
  eligibleBySlug,
  JUNK_PRODUCT_SLUGS,
} from './plan'

describe('sync args y guardia prod', () => {
  it('exige source y dest postgresql', () => {
    expect(parseArgs([])).toMatchObject({ error: expect.any(String) })
    expect(parseArgs(['--source', 'x', '--dest', 'y'])).toMatchObject({
      error: expect.any(String),
    })
    const ok = parseArgs([
      '--source',
      'postgresql://a',
      '--dest',
      'postgresql://b',
    ])
    expect(ok).toMatchObject({ apply: false, confirmProd: false })
  })

  it('--export permite omitir --dest', () => {
    const ok = parseArgs([
      '--source',
      'postgresql://a',
      '--export',
      'out.json',
    ])
    expect(ok).toMatchObject({ exportFile: 'out.json' })
  })

  it('detecta destino local', () => {
    expect(isLocalDest('postgresql://u:p@localhost:5432/db')).toBe(true)
    expect(isLocalDest('postgresql://u:p@127.0.0.1/db')).toBe(true)
    expect(isLocalDest('postgresql://u:p@db.xxx.com/db')).toBe(false)
  })

  it('destino no local exige --confirm-prod', () => {
    const args = {
      source: 'postgresql://a',
      dest: 'postgresql://u:p@prod.host/db',
      apply: true,
      confirmProd: false,
    }
    expect(prodGuard(args)).toMatch(/--confirm-prod/)
    expect(prodGuard({ ...args, confirmProd: true })).toBeNull()
    expect(
      prodGuard({ ...args, dest: 'postgresql://u:p@localhost/db', apply: true }),
    ).toBeNull()
  })
})

describe('sync builders', () => {
  it('categoría: campos sincronizados sin active ni image', () => {
    const data = buildCategoryData({
      title: 'Velas',
      slug: 'velas',
      active: true,
      image: 5,
      parent: null,
      sortOrder: 2,
    })
    expect(data).toMatchObject({ title: 'Velas', slug: 'velas', sortOrder: 2 })
    expect(data).not.toHaveProperty('active')
    expect(data).not.toHaveProperty('image')
  })

  it('tag: kind validado con fallback general', () => {
    expect(buildTagData({ name: 'V', slug: 'v', kind: 'aroma' })).toMatchObject({
      kind: 'aroma',
    })
    expect(buildTagData({ name: 'V', slug: 'v', kind: 'raro' })).toMatchObject({
      kind: 'general',
    })
  })

  it('atributo: values saneados', () => {
    const data = buildAttributeData({
      name: 'Salida',
      slug: 'nota-salida',
      values: [{ value: 'Vainilla', sortOrder: 0 }, { value: '' }, null],
    })
    expect(data.values).toEqual([{ value: 'Vainilla', sortOrder: 0 }])
  })

  it('producto: null sin categoría resuelta; sin images', () => {
    expect(
      buildProductData({ title: 'X', slug: 'x' }, { categoryId: null, tagIds: [], attributeIds: [] }),
    ).toBeNull()
    const data = buildProductData(
      { title: 'X', slug: 'x', price: 100, images: [1], active: true },
      { categoryId: 7, tagIds: [1], attributeIds: [] },
    )
    expect(data).toMatchObject({ category: 7, tags: [1] })
    expect(data).not.toHaveProperty('images')
    expect(data).not.toHaveProperty('active')
  })

  it('sameData ignora orden de claves y null/undefined', () => {
    expect(sameData({ a: 1, b: null }, { b: undefined, a: 1 })).toBe(true)
    expect(sameData({ a: 1 }, { a: 2 })).toBe(false)
  })

  it('stripGlobalMeta quita metadatos', () => {
    expect(
      stripGlobalMeta({ id: 1, title: 'T', createdAt: 'x', updatedAt: 'y' }),
    ).toEqual({ title: 'T' })
  })
})

describe('sync elegibilidad', () => {
  it('excluye inactivos, sin slug y basura', () => {
    expect(eligibleProduct({ slug: 'x', active: true })).toBe(true)
    expect(eligibleProduct({ slug: 'x', active: false })).toBe(false)
    expect(eligibleProduct({ slug: JUNK_PRODUCT_SLUGS[0], active: true })).toBe(false)
    expect(eligibleProduct({ active: true })).toBe(false)
  })

  it('categorías/tags/attributes: slug + activo', () => {
    expect(eligibleBySlug({ slug: 'v', active: true }, { activeRequired: true })).toBe(true)
    expect(eligibleBySlug({ slug: 'v', active: false }, { activeRequired: true })).toBe(false)
  })
})
