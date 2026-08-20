import type {
  Category,
  Product,
  ProductImage,
  ProductTag,
} from '@/payload-types'

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

export interface CatalogFilters {
  categorySlug?: string
  tagSlug?: string
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
}

async function resolveIdBySlug(
  collection: 'categories' | 'product-tags',
  slug: string,
): Promise<number | undefined> {
  const data = await payloadFetch<{ docs: Array<{ id: number }> }>(
    `/api/${collection}?where=${encodeURIComponent(
      JSON.stringify({ slug: { equals: slug } }),
    )}&limit=1`,
    { next: { revalidate: 300, tags: [collection] } },
  )
  return data.docs[0]?.id
}

async function buildWhere(
  filters: CatalogFilters,
  refs: ResolveRefsInput,
): Promise<Where | undefined> {
  const and: Where[] = [
    { active: { equals: true } },
    { stock: { greater_than: 0 } },
  ]

  if (refs.categorySlug) {
    const id = await resolveIdBySlug('categories', refs.categorySlug)
    if (id) {
      and.push({ category: { equals: id } })
    } else {
      return undefined
    }
  }

  if (refs.tagSlug) {
    const id = await resolveIdBySlug('product-tags', refs.tagSlug)
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
    and.push({ title: { like: filters.q.trim() } })
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

export async function fetchProducts(
  filters: CatalogFilters = {},
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
): Promise<CatalogPage> {
  const sort = filters.sort ?? '-createdAt'
  const refs = {
    categorySlug: filters.categorySlug,
    tagSlug: filters.tagSlug,
  }
  const where = await buildWhere(filters, refs)
  if (where === undefined) {
    return { page: 1, totalDocs: 0, totalPages: 1, docs: [] }
  }
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


