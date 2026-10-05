import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchProducts, fetchFilterFacets } from './catalog'

/**
 * Filtros Aroma/Ritual: verifica el `where` REAL enviado a Payload
 * (no solo la UI): resolución de slugs por grupo y combinación AND.
 */

const TAG_IDS: Record<string, { id: number; kind: string }> = {
  'vainilla-nota': { id: 11, kind: 'aroma' },
  'ambar-nota': { id: 12, kind: 'aroma' },
  relajacion: { id: 21, kind: 'ritual' },
  energia: { id: 22, kind: 'ritual' },
}

let lastProductsWhere: unknown = null

const CATEGORY_IDS: Record<string, number> = { velas: 3 }
const CATEGORY_CHILDREN: Record<number, number[]> = { 3: [31, 32] }

function mockFetch() {
  return vi.fn(async (url: string) => {
    const u = new URL(url, 'http://test')
    if (u.pathname === '/api/categories') {
      const where = JSON.parse(u.searchParams.get('where') ?? '{}')
      if (where.slug?.equals) {
        const id = CATEGORY_IDS[where.slug.equals]
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              docs: id ? [{ id, active: true }] : [],
            }),
        }
      }
      if (where.parent?.equals !== undefined) {
        const kids = CATEGORY_CHILDREN[where.parent.equals] ?? []
        return {
          ok: true,
          json: () =>
            Promise.resolve({ docs: kids.map((id) => ({ id })) }),
        }
      }
      return { ok: true, json: () => Promise.resolve({ docs: [] }) }
    }
    if (u.pathname === '/api/product-tags') {
      const where = JSON.parse(u.searchParams.get('where') ?? '{}')
      // Resolución por slug (+kind cuando filtra aroma/ritual).
      if (where.slug?.equals) {
        const found = TAG_IDS[where.slug.equals]
        const kindOk =
          !where.kind?.equals || found?.kind === where.kind.equals
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              docs:
                found && kindOk
                  ? [{ id: found.id, active: true }]
                  : [],
            }),
        }
      }
      // Listado por grupo para facetas.
      const docs = Object.entries(TAG_IDS)
        .filter(
          ([, t]) =>
            where.kind?.equals === undefined ||
            t.kind === where.kind.equals,
        )
        .map(([slug, t]) => ({
          id: t.id,
          slug,
          name: slug,
          color: null,
          active: true,
        }))
      return { ok: true, json: () => Promise.resolve({ docs }) }
    }
    if (u.pathname === '/api/products') {
      const where = JSON.parse(u.searchParams.get('where') ?? '{}')
      lastProductsWhere = where
      if (u.searchParams.get('limit') === '0') {
        const contains = JSON.stringify(where).includes('"contains":11')
          ? 3
          : 0
        return {
          ok: true,
          json: () => Promise.resolve({ totalDocs: contains }),
        }
      }
      const flat = JSON.stringify(where)
      // Paso 1 del combinado: candidatos con el aroma.
      if (flat.includes('"contains":11') && !flat.includes('"in"')) {
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              docs: [{ id: 101 }],
              totalDocs: 1,
              totalPages: 1,
              page: 1,
            }),
        }
      }
      // Paso 2: intersección id + ritual → el producto vinculado a ambos.
      if (flat.includes('"in":[101]') && flat.includes('"contains":21')) {
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              docs: [
                {
                  id: 101,
                  title: 'Vela Vainilla & Relajación',
                  slug: 'vela-test',
                  price: 100,
                  images: [],
                },
              ],
              totalDocs: 1,
              totalPages: 1,
              page: 1,
            }),
        }
      }
      // Bounds de facetas: precios reales.
      if (u.searchParams.get('limit') === '1000' && !flat.includes('tags')) {
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              docs: [{ price: 4500 }, { price: 49100 }, { price: 0.06 }],
              totalDocs: 3,
              totalPages: 1,
              page: 1,
            }),
        }
      }
      return {
        ok: true,
        json: () =>
          Promise.resolve({ docs: [], totalDocs: 0, totalPages: 1, page: 1 }),
      }
    }
    throw new Error(`URL no mockeada: ${url}`)
  })
}

beforeEach(() => {
  lastProductsWhere = null
  vi.unstubAllGlobals()
  vi.stubGlobal('fetch', mockFetch())
})

describe('Filtros Aroma/Ritual — where real a Payload', () => {
  it('aroma + ritual se combinan con AND (BOTH vinculados)', async () => {
    const res = await fetchProducts(
      { aromaSlug: 'vainilla-nota', ritualSlug: 'relajacion' },
      1,
      12,
    )
    // Resultado: solo el producto vinculado a AMBOS.
    expect(res.totalDocs).toBe(1)
    expect(res.docs[0]).toMatchObject({ id: 101 })
    // Mecanismo: intersección id + contains del ritual (un solo contains
    // por query, porque Payload fusiona dos contains en una sola fila).
    const and = (lastProductsWhere as { and: unknown[] }).and
    expect(and).toContainEqual({ id: { in: [101] } })
    expect(and).toContainEqual({ tags: { contains: 21 } })
  })

  it('un slug de otro grupo no resuelve como aroma (vacío, no todo)', async () => {
    const res = await fetchProducts({ aromaSlug: 'relajacion' }, 1, 12)
    expect(res.totalDocs).toBe(0)
    expect(res.docs).toEqual([])
  })

  it('slug inexistente devuelve vacío', async () => {
    const res = await fetchProducts({ aromaSlug: 'inexistente' }, 1, 12)
    expect(res.totalDocs).toBe(0)
  })
})

describe('Facetas — contadores y bounds desde datos reales', () => {
  it('cuenta vinculados y deriva bounds del price real', async () => {
    const facets = await fetchFilterFacets()
    expect(facets.aromas).toHaveLength(2)
    expect(facets.aromas[0]).toMatchObject({ slug: 'vainilla-nota', count: 3 })
    expect(facets.rituales).toHaveLength(2)
    expect(facets.bounds).toEqual({ min: 0, max: 49100 })
  })
})

describe('Categoría — agrega hijas activas (tipos)', () => {
  it('categoría con hijas filtra por in[]', async () => {
    await fetchProducts({ categorySlug: 'velas' }, 1, 12)
    const and = (lastProductsWhere as { and: unknown[] }).and
    expect(and).toContainEqual({ category: { in: [3, 31, 32] } })
  })

  it('categoría inexistente devuelve vacío', async () => {
    const res = await fetchProducts({ categorySlug: 'inexistente' }, 1, 12)
    expect(res.totalDocs).toBe(0)
    expect(res.docs).toEqual([])
  })
})

describe('Búsqueda por texto — comodines escapados', () => {
  function titleLike(): string | undefined {
    const where = lastProductsWhere as { and?: Array<{ title?: { like?: string } }> }
    return where.and?.find((c) => c.title)?.title?.like
  }

  it('%, _ y barra invertida del usuario se buscan de forma literal', async () => {
    await fetchProducts({ q: '50%_off\\' }, 1, 12)
    expect(titleLike()).toBe('50\\%\\_off\\\\')
  })

  it('un texto normal no se altera', async () => {
    await fetchProducts({ q: 'vela' }, 1, 12)
    expect(titleLike()).toBe('vela')
  })
})
