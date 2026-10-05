import type {
  Category,
  Product,
  ProductImage,
  ProductTag,
} from '@/payload-types'

export type FilterTagKind = 'aroma' | 'ritual' | 'general'

type WhereValue = string | number | boolean | { [k: string]: unknown }
interface Where {
  [field: string]: WhereValue | WhereValue[] | undefined
}

const PAYLOAD_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || ''
const DEFAULT_PAGE_SIZE = 12

type SortOption =
  | '-createdAt'
  | 'createdAt'
  | 'price'
  | '-price'
  | 'title'
  | '-title'
  | 'sortOrder'
  | '-featured,sortOrder,-createdAt'

export interface CatalogFilters {
  categorySlug?: string
  tagSlug?: string
  /** Filtro Aroma: slug de un tag kind='aroma'. Se combina (AND) con ritual. */
  aromaSlug?: string
  /** Filtro Ritual: slug de un tag kind='ritual'. Se combina (AND) con aroma. */
  ritualSlug?: string
  q?: string
  minPrice?: number
  maxPrice?: number
  featured?: boolean
  isSolistica?: boolean
  sort?: SortOption
}

export interface CatalogPage {
  page: number
  totalPages: number
  totalDocs: number
  docs: ProductWithImage[]
}

export type ProductWithImage = Product & {
  featuredImage?: Pick<ProductImage, 'id' | 'url' | 'alt' | 'filename'> | null
}

/**
 * Disponibilidad manual del storefront: un producto está AGOTADO cuando el
 * staff lo marca (`soldOut`) o cuando se queda sin stock. El agotado sigue
 * visible en catálogo y PDP (con badge y compra bloqueada); solo
 * `active=false` lo despublica.
 */
export function isAgotado(product: {
  soldOut?: boolean | null
  stock?: number | null
}): boolean {
  if (product.soldOut === true) return true
  return (
    typeof product.stock === 'number' &&
    Number.isFinite(product.stock) &&
    product.stock <= 0
  )
}

interface FetchProductsResult {
  docs: Product[]
  totalDocs: number
  totalPages: number
  page: number
}

function appendNestedField(
  usp: URLSearchParams,
  prefix: string,
  value: unknown,
): void {
  if (value === null || typeof value === 'object') {
    if (Array.isArray(value)) {
      value.forEach((item, idx) =>
        appendNestedField(usp, `${prefix}[${idx}]`, item),
      )
      return
    }
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      appendNestedField(usp, `${prefix}[${k}]`, v)
    }
    return
  }
  usp.append(prefix, String(value))
}

function urlForWhere(where: Where | undefined, prefix = 'where'): string {
  const usp = new URLSearchParams()
  if (!where) return usp.toString()
  for (const [k, v] of Object.entries(where)) {
    appendNestedField(usp, `${prefix}[${k}]`, v)
  }
  return usp.toString()
}

interface ResolveRefsInput {
  categorySlug?: string
  tagSlug?: string
  aromaSlug?: string
  ritualSlug?: string
}

async function resolveIdBySlug(
  collection: 'categories' | 'product-tags',
  slug: string,
  kind?: FilterTagKind,
): Promise<number | undefined> {
  const where: Record<string, unknown> = { slug: { equals: slug } }
  if (kind !== undefined) {
    where.kind = { equals: kind }
  }
  const data = await payloadFetch<{ docs: Array<{ id: number; active?: boolean }> }>(
    `/api/${collection}?where=${encodeURIComponent(
      JSON.stringify(where),
    )}&limit=1`,
    { next: { revalidate: 300, tags: [collection] } },
  )
  const doc = data.docs[0]
  // Una categoría/tipo oculto (active=false) no resuelve en el storefront.
  // Un slug de otro grupo tampoco resuelve como aroma/ritual.
  if (!doc || doc.active === false) return undefined
  return doc.id
}

/**
 * Resuelve una categoría a sí misma + sus hijas activas (tipos). El
 * storefront agrega: la página de una categoría muestra sus productos
 * directos y los de sus tipos. Desconocida u oculta → undefined (vacío).
 */
export async function resolveCategoryIds(
  categorySlug: string,
): Promise<number[] | undefined> {
  const id = await resolveIdBySlug('categories', categorySlug)
  if (id === undefined) return undefined
  const children = await payloadFetch<{ docs: Array<{ id: number }> }>(
    `/api/categories?where=${encodeURIComponent(
      JSON.stringify({ parent: { equals: id }, active: { equals: true } }),
    )}&limit=100&depth=0`,
    { next: { revalidate: 300, tags: ['categories'] } },
  )
  return [id, ...children.docs.map((d) => d.id)]
}

/**
 * `like` de Payload se traduce a ILIKE: `%` y `_` del texto del usuario
 * actuarían como comodines. Se escapan para que la búsqueda sea literal.
 */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}

async function buildWhere(
  filters: CatalogFilters,
  refs: ResolveRefsInput,
): Promise<Where | undefined> {
  // El storefront lista por `active`: el agotado (soldOut/stock 0) sigue
  // visible con compra bloqueada; solo active=false despublica.
  const and: Where[] = [{ active: { equals: true } }]

  if (refs.categorySlug) {
    const ids = await resolveCategoryIds(refs.categorySlug)
    if (!ids) {
      return undefined
    }
    and.push(
      ids.length === 1 ? { category: { equals: ids[0] } } : { category: { in: ids } },
    )
  }

  if (refs.tagSlug) {
    const id = await resolveIdBySlug('product-tags', refs.tagSlug)
    if (id) {
      and.push({ tags: { contains: id } })
    } else {
      return undefined
    }
  }

  // Aroma y Ritual se combinan con AND: el producto debe tener AMBOS tags.
  if (refs.aromaSlug) {
    const id = await resolveIdBySlug('product-tags', refs.aromaSlug, 'aroma')
    if (id) {
      and.push({ tags: { contains: id } })
    } else {
      return undefined
    }
  }

  if (refs.ritualSlug) {
    const id = await resolveIdBySlug('product-tags', refs.ritualSlug, 'ritual')
    if (id) {
      and.push({ tags: { contains: id } })
    } else {
      return undefined
    }
  }

  if (filters.featured) {
    and.push({ featured: { equals: true } })
  }

  if (filters.isSolistica) {
    and.push({ isSolistica: { equals: true } })
  }

  if (filters.minPrice !== undefined) {
    and.push({ price: { greater_than_equal: filters.minPrice } })
  }

  if (filters.maxPrice !== undefined) {
    and.push({ price: { less_than_equal: filters.maxPrice } })
  }

  if (filters.q && filters.q.trim().length > 0) {
    and.push({ title: { like: escapeLike(filters.q.trim()) } })
  }

  return and.length > 1 ? { and } : and[0]
}

async function payloadFetch<T>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number; tags?: string[] } },
): Promise<T> {
  const res = await fetch(`${PAYLOAD_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  if (!res.ok) {
    throw new Error(
      `Payload fetch failed (${res.status}) for ${path}: ${await res
        .text()
        .then((t) => t.slice(0, 200))
        .catch(() => '')}`,
    )
  }
  return (await res.json()) as T
}

function emptyPage(): CatalogPage {
  return { page: 1, totalDocs: 0, totalPages: 1, docs: [] }
}

async function queryProducts(
  where: Where,
  sort: string,
  page: number,
  limit: number,
): Promise<CatalogPage> {
  const result = await payloadFetch<FetchProductsResult>(
    `/api/products?page=${page}&limit=${limit}&sort=${encodeURIComponent(
      sort,
    )}&depth=1&where=${encodeURIComponent(JSON.stringify(where))}`,
    { next: { revalidate: 30, tags: ['products'] } },
  )

  const docs = result.docs.map((product) => {
    let featured: ProductWithImage['featuredImage'] = null
    if (Array.isArray(product.images) && product.images.length > 0) {
      const first = product.images[0]
      if (typeof first !== 'number' && first) {
        featured = {
          id: first.id,
          url: first.url ?? null,
          alt: first.alt ?? null,
          filename: first.filename ?? null,
        }
      }
    }
    return { ...product, featuredImage: featured }
  })

  return {
    page: result.page,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    docs,
  }
}

/**
 * Caso combinado aroma+ritual. Payload fusiona dos `contains` sobre la
 * misma relación en una sola fila (siempre vacío), así que se resuelve en
 * dos pasos con la relación real: ids con el aroma, luego intersección con
 * el ritual. Ambos pasos usan el mismo recorte base del listado.
 */
async function fetchProductsCombined(
  filters: CatalogFilters,
  page: number,
  limit: number,
  sort: string,
): Promise<CatalogPage> {
  const [aromaId, ritualId] = await Promise.all([
    resolveIdBySlug('product-tags', filters.aromaSlug ?? '', 'aroma'),
    resolveIdBySlug('product-tags', filters.ritualSlug ?? '', 'ritual'),
  ])
  if (aromaId === undefined || ritualId === undefined) return emptyPage()

  const base = await buildWhere(
    {
      q: filters.q,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      featured: filters.featured,
      isSolistica: filters.isSolistica,
    },
    { categorySlug: filters.categorySlug, tagSlug: filters.tagSlug },
  )
  if (base === undefined) return emptyPage()

  // Paso 1: candidatos con el aroma (un solo `contains`: soportado).
  const scoped: Where = { and: [base, { tags: { contains: aromaId } }] }
  const candidates = await payloadFetch<{ docs: Array<{ id: number }> }>(
    `/api/products?limit=1000&depth=0&where=${encodeURIComponent(
      JSON.stringify(scoped),
    )}`,
    { next: { revalidate: 30, tags: ['products'] } },
  )
  const ids = candidates.docs
    .map((d) => d.id)
    .filter((n): n is number => typeof n === 'number')
  if (ids.length === 0) return emptyPage()

  // Paso 2: intersección con el ritual (campos distintos: sí combinan).
  const intersect: Where = {
    and: [base, { id: { in: ids } }, { tags: { contains: ritualId } }],
  }
  return queryProducts(intersect, sort, page, limit)
}

export async function fetchProducts(
  filters: CatalogFilters = {},
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
): Promise<CatalogPage> {
  const sort = filters.sort ?? '-createdAt'
  if (filters.aromaSlug && filters.ritualSlug) {
    return fetchProductsCombined(filters, page, limit, sort)
  }
  const refs = {
    categorySlug: filters.categorySlug,
    tagSlug: filters.tagSlug,
    aromaSlug: filters.aromaSlug,
    ritualSlug: filters.ritualSlug,
  }
  const where = await buildWhere(filters, refs)
  if (where === undefined) {
    return emptyPage()
  }
  return queryProducts(where, sort, page, limit)
}

export async function fetchCategories(): Promise<Category[]> {
  const result = await payloadFetch<{ docs: Category[] }>(
    '/api/categories?limit=100&sort=title&where=' +
      encodeURIComponent(JSON.stringify({ active: { equals: true } })),
    { next: { revalidate: 300, tags: ['categories'] } },
  )
  return result.docs
}

export async function fetchProductTags(): Promise<ProductTag[]> {
  const result = await payloadFetch<{ docs: ProductTag[] }>(
    '/api/product-tags?limit=100&sort=name&where=' +
      encodeURIComponent(JSON.stringify({ active: { equals: true } })),
    { next: { revalidate: 300, tags: ['product-tags'] } },
  )
  return result.docs
}

/** Tags activos de un grupo de filtro (Aroma o Ritual), ordenados por nombre. */
export async function fetchFilterTags(
  kind: 'aroma' | 'ritual',
): Promise<ProductTag[]> {
  const result = await payloadFetch<{ docs: ProductTag[] }>(
    '/api/product-tags?limit=100&sort=name&where=' +
      encodeURIComponent(
        JSON.stringify({
          active: { equals: true },
          kind: { equals: kind },
        }),
      ),
    { next: { revalidate: 300, tags: ['product-tags'] } },
  )
  return result.docs
}

export interface FacetOption {
  id: number
  slug: string
  name: string
  color: string | null
  /** Productos vinculados: activos (incluye agotados visibles) en la categoría del contexto. */
  count: number
}

export interface FilterFacets {
  aromas: FacetOption[]
  rituales: FacetOption[]
  /** Rango real de precios. Origen: `price` de productos activos (incluye agotados visibles). */
  bounds: { min: number; max: number }
}

async function countProducts(where: Where): Promise<number> {
  const result = await payloadFetch<{ totalDocs: number }>(
    `/api/products?limit=0&depth=0&where=${encodeURIComponent(
      JSON.stringify(where),
    )}`,
    { next: { revalidate: 30, tags: ['products'] } },
  )
  return result.totalDocs
}

/**
 * Facetas del sidebar: opciones reales con contadores calculados desde los
 * productos vinculados (nunca hardcodeados) y rango de precios derivado del
 * `price` real. Todo se acota a la categoría del contexto cuando existe;
 * nunca a los demás filtros activos (para no colapsar las opciones).
 */
export async function fetchFilterFacets(
  categorySlug?: string,
): Promise<FilterFacets> {
  const [aromaTags, ritualTags, categoryIds] = await Promise.all([
    fetchFilterTags('aroma'),
    fetchFilterTags('ritual'),
    categorySlug
      ? resolveCategoryIds(categorySlug)
      : Promise.resolve(undefined),
  ])

  const base: Where[] = [{ active: { equals: true } }]
  if (categoryIds !== undefined) {
    base.push(
      categoryIds.length === 1
        ? { category: { equals: categoryIds[0] } }
        : { category: { in: categoryIds } },
    )
  }
  const scoped = (tagId: number): Where => ({
    and: [...base, { tags: { contains: tagId } }],
  })

  const allTags = [...aromaTags, ...ritualTags]
  const [counts, boundsDocs] = await Promise.all([
    Promise.all(allTags.map((t) => countProducts(scoped(t.id)))),
    payloadFetch<{ docs: Array<{ price: number }> }>(
      `/api/products?limit=1000&depth=0&where=${encodeURIComponent(
        JSON.stringify(base.length > 1 ? { and: base } : base[0]),
      )}`,
      { next: { revalidate: 30, tags: ['products'] } },
    ),
  ])

  const prices = boundsDocs.docs
    .map((d) => Number(d.price))
    .filter((n) => Number.isFinite(n) && n >= 0)
  const bounds =
    prices.length > 0
      ? {
          min: Math.floor(Math.min(...prices) / 100) * 100,
          max: Math.ceil(Math.max(...prices) / 100) * 100,
        }
      : { min: 0, max: 0 }

  const withCounts = (tags: ProductTag[], offset: number): FacetOption[] =>
    tags.map((t, i) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      color: t.color ?? null,
      count: counts[offset + i] ?? 0,
    }))

  return {
    aromas: withCounts(aromaTags, 0),
    rituales: withCounts(ritualTags, aromaTags.length),
    bounds,
  }
}


