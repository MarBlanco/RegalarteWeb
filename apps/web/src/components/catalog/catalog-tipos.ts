/**
 * Capa de TIPOS/colecciones por categoría (CAT-04.2).
 *
 * Arquitectura CMS-first:
 * - Si el CMS tiene categorías hijas activas (`parent` = categoría actual),
 *   esas son los tipos: nombre, slug, imagen, orden y estado salen del CMS
 *   (Dashboard → Categorías). Los productos se asignan por `category`.
 * - Si no hay hijas, se usan los tipos MOCK de este archivo para representar
 *   el diseño. Cuando el CMS los tenga, los mocks se sustituyen solos.
 *
 * Los productos mock se generan de forma DETERMINÍSTICA, por lo que el PDP
 * puede reconstruir exactamente el mismo producto desde el slug.
 */

import type { Category } from '@/payload-types'
import type { ProductWithImage } from '@/lib/catalog'
import {
  MOCK_BADGES,
  findMockProductBySlug,
  type MockBadge,
} from './catalog-mock'

export interface Tipo {
  slug: string
  name: string
  /** Texto corto para la tarjeta del selector. */
  tagline: string
  /** Descripción completa para el encabezado de colección. */
  description: string
  image: string | null
  /** Cantidad ilustrativa (mock) o real cuando el CMS la provea. */
  count: number
  /** Verdadero cuando el tipo existe en el CMS. */
  real: boolean
}

export interface MockTipoSeed {
  slug: string
  name: string
  tagline: string
  description: string
  count: number
}

const MOCK_IMG = [
  '/assets/hero/hero-solistica-1.jpeg',
  '/assets/hero/hero-solistica-2.jpeg',
  '/assets/hero/hero-solistica-3.jpeg',
]

/** Tipos mock por categoría (se sustituyen solos con hijas reales del CMS). */
export const MOCK_TIPOS: Record<string, MockTipoSeed[]> = {
  velas: [
    { slug: 'vela-clasica', name: 'Vela Clásica', tagline: 'Aromas atemporales', description: 'Aromas atemporales que iluminan tus espacios con calidez y armonía.', count: 12 },
    { slug: 'vela-bubble', name: 'Vela Bubble', tagline: 'Diseños únicos', description: 'Formas escultóricas que decoran y perfuman con estilo propio.', count: 8 },
    { slug: 'vela-en-lata', name: 'Vela en Lata', tagline: 'Prácticas y versátiles', description: 'Compañeras ideales para llevar tu ritual donde vayas.', count: 10 },
    { slug: 'vela-de-soja', name: 'Vela de Soja', tagline: 'Naturaleza en tu hogar', description: 'Cera vegetal de soja para una combustión limpia y duradera.', count: 14 },
    { slug: 'sets-regalos', name: 'Sets & Regalos', tagline: 'Combos especiales', description: 'Combinaciones pensadas para regalar y compartir.', count: 6 },
  ],
  aromas: [
    { slug: 'difusores', name: 'Difusores', tagline: 'Aroma continuo', description: 'Fragancia constante que acompaña tus espacios todo el día.', count: 10 },
    { slug: 'home-sprays', name: 'Home Sprays', tagline: 'Frescura instantánea', description: 'Un gesto simple para renovar el aire de tu hogar.', count: 8 },
    { slug: 'brumas-textiles', name: 'Brumas Textiles', tagline: 'Para tus telas', description: 'Cortinas, ropa de cama y sillones con tu aroma favorito.', count: 6 },
    { slug: 'aceites', name: 'Aceites', tagline: 'Esencias puras', description: 'Concentrados intensos para hornillos y difusores.', count: 9 },
    { slug: 'sets-aromaticos', name: 'Sets Aromáticos', tagline: 'Combos especiales', description: 'Rituales completos en una sola caja.', count: 5 },
  ],
  'wax-melts': [
    { slug: 'melts-clasicos', name: 'Clásicos', tagline: 'Los de siempre', description: 'Los aromas esenciales que nunca fallan.', count: 11 },
    { slug: 'melts-florales', name: 'Florales', tagline: 'Jardín en casa', description: 'Bouquets delicados para un hogar en flor.', count: 7 },
    { slug: 'melts-frutales', name: 'Frutales', tagline: 'Frescura dulce', description: 'Chispa frutal para levantar cualquier ambiente.', count: 8 },
    { slug: 'melts-gourmand', name: 'Gourmand', tagline: 'Antojos cálidos', description: 'Vainilla, caramelo y todo lo acogedor.', count: 6 },
    { slug: 'melts-sets', name: 'Sets', tagline: 'Para regalar', description: 'Degustaciones perfectas para obsequiar.', count: 4 },
  ],
  quemadores: [
    { slug: 'quemador-ceramica', name: 'Cerámica', tagline: 'Artesanales', description: 'Piezas de cerámica hechas con calidez artesanal.', count: 9 },
    { slug: 'quemador-vidrio', name: 'Vidrio', tagline: 'Elegancia pura', description: 'Transparencia y luz para tus wax melts.', count: 7 },
    { slug: 'quemador-metal', name: 'Metal', tagline: 'Diseño moderno', description: 'Líneas contemporáneas con carácter.', count: 5 },
    { slug: 'quemador-electrico', name: 'Eléctricos', tagline: 'Sin llama', description: 'Aroma seguro sin fuego, ideal para cada rincón.', count: 6 },
    { slug: 'quemador-sets', name: 'Sets', tagline: 'Con wax melts', description: 'Quemador más melts: el ritual completo.', count: 4 },
  ],
  packs: [
    { slug: 'pack-relax', name: 'Pack Relax', tagline: 'Calma total', description: 'Todo lo necesario para bajar el ritmo.', count: 6 },
    { slug: 'pack-home', name: 'Pack Home', tagline: 'Tu hogar ideal', description: 'Transformá cada ambiente con un solo gesto.', count: 8 },
    { slug: 'pack-completo', name: 'Pack Completo', tagline: 'La experiencia full', description: 'Velas, aromas y detalles en una caja única.', count: 5 },
    { slug: 'pack-regalo', name: 'Pack Regalo', tagline: 'Listo para dar', description: 'Presentación premium, sin vueltas.', count: 7 },
    { slug: 'pack-duo', name: 'Packs Dúo', tagline: 'Para compartir', description: 'El doble de ritual, para vos y alguien más.', count: 4 },
  ],
  regalarte: [
    { slug: 'cajas-regalo', name: 'Cajas', tagline: 'Clásicas y premium', description: 'Cajas que emocionan antes de abrirse.', count: 8 },
    { slug: 'tarjetas', name: 'Tarjetas', tagline: 'Con tu mensaje', description: 'Palabras que acompañan cada regalo.', count: 12 },
    { slug: 'envoltorios', name: 'Envoltorios', tagline: 'Papel de seda', description: 'Detalles que elevan cualquier presente.', count: 6 },
    { slug: 'bolsas', name: 'Bolsas', tagline: 'Llevalo fácil', description: 'Prácticas y lindas para entregar en mano.', count: 5 },
    { slug: 'sets-regalo', name: 'Sets', tagline: 'Todo incluido', description: 'Regalos completos, cero estrés.', count: 7 },
  ],
}

function mockTiposFor(categorySlug: string): Tipo[] {
  const seeds = MOCK_TIPOS[categorySlug] ?? []
  return seeds.map((s, i) => ({
    slug: s.slug,
    name: s.name,
    tagline: s.tagline,
    description: s.description,
    image: MOCK_IMG[i % MOCK_IMG.length],
    count: s.count,
    real: false,
  }))
}

/**
 * Resuelve los tipos de una categoría: hijas activas del CMS primero,
 * mock si no hay. Nunca hardcodea en los componentes.
 */
export function getCategoryTipos(
  categorySlug: string,
  cmsCategories: Category[],
): Tipo[] {
  const current = cmsCategories.find((c) => c.slug === categorySlug)
  if (current) {
    const children = cmsCategories
      .filter((c) => {
        if (c.active === false) return false
        const parent = c.parent
        if (parent === null || parent === undefined) return false
        return typeof parent === 'number'
          ? parent === current.id
          : parent.id === current.id
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    if (children.length > 0) {
      return children.map((c) => ({
        slug: c.slug,
        name: c.title,
        tagline: c.description ?? '',
        description: c.description ?? '',
        image:
          c.image && typeof c.image === 'object' && 'url' in c.image
            ? ((c.image as { url?: string | null }).url ?? null)
            : null,
        count: 0,
        real: true,
      }))
    }
  }
  return mockTiposFor(categorySlug)
}

/** Nombre de un tipo mock por slug (para títulos cuando no hay CMS). */
export function mockTipoName(slug: string): string | null {
  for (const seeds of Object.values(MOCK_TIPOS)) {
    const found = seeds.find((s) => s.slug === slug)
    if (found) return found.name
  }
  return null
}

/** Nombre de categoría mock por slug (fallback de títulos). */
export function mockCategoryName(slug: string): string | null {
  const seeds = MOCK_TIPOS[slug]
  if (!seeds) return null
  void seeds
  const titles: Record<string, string> = {
    velas: 'Velas',
    aromas: 'Aromas',
    'wax-melts': 'Wax-Melts',
    quemadores: 'Quemadores',
    packs: 'Packs',
    regalarte: 'Regalarte',
  }
  return titles[slug] ?? null
}

// ---- Generador determinístico de productos mock por (categoría, tipo) ----

const AROMA_POOL = [
  'Vainilla & Ámbar',
  'Sándalo & Cedro',
  'Lavanda & Albaca',
  'Canela & Naranja',
  'Té Blanco & Lirio',
  'Jazmín & Limón',
  'Cacao & Caramelo',
  'Romero & Eucalipto',
  'Almizcle & Crema',
  'Cuero & Cedro',
  'Flores Blancas & Almizcle',
  'Naranja & Vainilla',
]

const TRIO_POOL = [
  'Vainilla · Ámbar · Almizcle',
  'Sándalo · Cedro · Cuero',
  'Lavanda · Albaca · Romero',
  'Canela · Naranja · Vainilla',
  'Té Blanco · Lirio · Almizcle',
  'Jazmín · Limón · Verbena',
  'Cacao · Caramelo · Vainilla',
  'Romero · Eucalipto · Frescura',
  'Algodón · Flores Blancas · Almizcle',
  'Cuero · Cedro · Especias',
  'Lino & Algodón · 200 ml',
  'Ámbar · Vainilla · Maderas',
]

const PRICE_BASE: Record<string, number> = {
  velas: 30000,
  aromas: 25000,
  'wax-melts': 15000,
  quemadores: 18000,
  packs: 45000,
  regalarte: 12000,
}

const BADGE_CYCLE: (MockBadge | null)[] = [
  'FAVORITO',
  'NUEVO',
  null,
  'IDEAL PARA REGALAR',
  null,
  'NUEVO',
  null,
  null,
  'FAVORITO',
  null,
  'NUEVO',
  null,
]

function hashString(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export interface GeneratedMock {
  products: ProductWithImage[]
  badges: Record<number, MockBadge>
}

/**
 * Genera hasta `take` productos mock para (categoría, tipo). Determinístico:
 * el mismo input produce siempre el mismo output (el PDP los reconstruye).
 */
export function mockTipoProducts(
  categorySlug: string,
  tipoSlug: string,
  tipoName: string,
  take = 8,
): GeneratedMock {
  const products: ProductWithImage[] = []
  const badges: Record<number, MockBadge> = {}
  const base = PRICE_BASE[categorySlug] ?? 20000
  const offset = hashString(`${categorySlug}:${tipoSlug}`) % AROMA_POOL.length
  for (let i = 0; i < take; i++) {
    const aroma = AROMA_POOL[(offset + i) % AROMA_POOL.length]
    const id = 95000 + (hashString(`${categorySlug}:${tipoSlug}`) % 400) * 12 + i
    const badge = BADGE_CYCLE[(offset + i) % BADGE_CYCLE.length]
    if (badge) badges[id] = badge
    products.push({
      id,
      title: `${tipoName} ${aroma}`,
      slug: `mock-${categorySlug}-${tipoSlug}-${i + 1}`,
      description: null,
      price: base + i * 1100 + ((offset + i) % 3) * 400,
      compareAtPrice: null,
      wholesalePrice: null,
      isWholesaleAvailable: false,
      stock: 100,
      active: true,
      featured: false,
      isSolistica: false,
      sortOrder: i,
      category: 0,
      tags: [],
      attributes: [],
      images: [],
      seoTitle: null,
      seoDescription: TRIO_POOL[(offset + i) % TRIO_POOL.length],
      updatedAt: new Date(0).toISOString(),
      createdAt: new Date(0).toISOString(),
      featuredImage: {
        id,
        url: MOCK_IMG[(offset + i) % MOCK_IMG.length],
        alt: `${tipoName} ${aroma}`,
        filename: null,
      },
    })
  }
  return { products, badges }
}

/** Reconstruye un producto mock generado desde su slug (para el PDP). */
export function findGeneratedMockProduct(
  slug: string,
): { product: ProductWithImage; badge: MockBadge | null } | null {
  const match = /^mock-(.+)-(\d+)$/.exec(slug)
  if (!match) return null
  const [, middle, indexRaw] = match
  const index = Number(indexRaw) - 1
  if (!Number.isInteger(index) || index < 0 || index >= 12) return null
  for (const [categorySlug, seeds] of Object.entries(MOCK_TIPOS)) {
    for (const tipo of seeds) {
      if (middle === `${categorySlug}-${tipo.slug}`) {
        const { products, badges } = mockTipoProducts(
          categorySlug,
          tipo.slug,
          tipo.name,
          index + 1,
        )
        const product = products[index]
        if (!product) return null
        return { product, badge: badges[product.id] ?? null }
      }
    }
  }
  return null
}

/** Badge mock por id: legacy primero, luego generados determinísticos. */
export function mockBadgeForSlug(
  slug: string,
  legacyBadges: Record<number | string, MockBadge>,
  id: number | string,
): MockBadge | null {
  const legacy = legacyBadges[id]
  if (legacy) return legacy
  const generated = findGeneratedMockProduct(slug)
  return generated?.badge ?? null
}

export interface ResolvedMockDetail {
  product: ProductWithImage
  badge: MockBadge | null
}

/**
 * Resuelve cualquier slug mock (legacy CAT-03.9 o generados CAT-04.2)
 * al producto + badge para el PDP.
 */
export function resolveMockDetail(slug: string): ResolvedMockDetail | null {
  const legacy = findMockProductBySlug(slug)
  if (legacy) {
    return { product: legacy, badge: MOCK_BADGES[legacy.id] ?? null }
  }
  return findGeneratedMockProduct(slug)
}
