/**
 * Fetch utility local para PDP. La ruta principal de catálogo (/catalogo)
 * mantiene sus fetchers con where JSON-encoded en lib/catalog.ts.
 *
 * Payload REST en este proyecto acepta correctamente filtros solo con la sintaxis
 * bracket-notation en query string (e.g. `?where[slug][equals]=vela-001`). Por
 * eso, PDP usa este helper exclusivo para resolver un Product por slug.
 */

import type { Product } from '@/payload-types'

type QueryValue = string | number | boolean
type BracketWhere = Record<string, QueryValue | Record<string, QueryValue>>

function buildQuery(params: Record<string, QueryValue | undefined>): string {
  const usp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue
    usp.append(key, String(value))
  }
  return usp.toString()
}

function appendNestedField(
  usp: URLSearchParams,
  prefix: string,
  value: QueryValue | BracketWhere,
): void {
  if (value === null || typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      appendNestedField(usp, `${prefix}[${k}]`, v)
    }
    return
  }
  usp.append(prefix, String(value))
}

function urlForWhere(where: BracketWhere): string {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(where)) {
    appendNestedField(usp, `where[${k}]`, v)
  }
  return usp.toString()
}

interface FetchResult {
  docs: Product[]
  totalDocs: number
}

function getPayloadBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || ''
}

export async function fetchProductBySlugRaw(
  slug: string,
  baseUrl: string = getPayloadBaseUrl(),
): Promise<FetchResult> {
  const query = buildQuery({
    limit: 1,
    depth: 1,
  })
  const where = urlForWhere({ slug: { equals: slug } })
  const url = `${baseUrl}/api/products?${query}&${where}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 60, tags: ['products'] },
  })
  if (!res.ok) {
    throw new Error(
      `Payload fetch failed (${res.status}) for /api/products?slug=${slug}`,
    )
  }
  return (await res.json()) as FetchResult
}
