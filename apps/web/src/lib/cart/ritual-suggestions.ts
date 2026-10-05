import type { RitualProduct } from '@/components/cart/ritual-card'
import { isAgotado } from '@/lib/catalog'

export const RITUAL_SUGGESTIONS_LIMIT = 5

/** Query al REST público de Payload: solo productos publicados. */
export const RITUAL_SUGGESTIONS_URL = `/api/products?${new URLSearchParams({
  'where[active][equals]': 'true',
  limit: '12',
  depth: '1',
  sort: '-featured,sortOrder',
}).toString()}`

interface RawProduct {
  id?: unknown
  slug?: unknown
  title?: unknown
  price?: unknown
  active?: unknown
  soldOut?: unknown
  stock?: unknown
  images?: unknown
}

function firstImageUrl(images: unknown): string | null {
  if (!Array.isArray(images)) return null
  for (const img of images) {
    if (img && typeof img === 'object' && typeof (img as { url?: unknown }).url === 'string') {
      return (img as { url: string }).url
    }
  }
  return null
}

/**
 * "Completá tu ritual": productos REALES (publicados, con stock, que no estén
 * ya en el carrito). Nunca inventa productos que no existan en el CMS.
 */
export function buildRitualSuggestions(
  docs: unknown,
  inCartSlugs: ReadonlySet<string>,
  limit = RITUAL_SUGGESTIONS_LIMIT,
): RitualProduct[] {
  if (!Array.isArray(docs)) return []
  const out: RitualProduct[] = []
  for (const raw of docs as RawProduct[]) {
    if (out.length >= limit) break
    if (!raw || typeof raw !== 'object') continue
    if (
      (typeof raw.id !== 'number' && typeof raw.id !== 'string') ||
      typeof raw.slug !== 'string' ||
      typeof raw.title !== 'string' ||
      typeof raw.price !== 'number'
    ) {
      continue
    }
    if (raw.active === false) continue
    if (
      isAgotado({
        soldOut: raw.soldOut as boolean | null | undefined,
        stock: raw.stock as number | null | undefined,
      })
    ) {
      continue
    }
    if (inCartSlugs.has(raw.slug)) continue
    out.push({
      id: String(raw.id),
      slug: raw.slug,
      name: raw.title,
      price: raw.price,
      image: firstImageUrl(raw.images),
    })
  }
  return out
}
