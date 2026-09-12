/**
 * Datos MOCK exclusivamente para fidelización visual del catálogo (CAT-03.9).
 *
 * - NO reemplazan ni modifican los datos reales del CMS.
 * - Solo se usan para completar visualmente el grid / sidebar cuando los
 *   datos reales no alcanzan (p. ej. 1 producto real vs grid de 8 del mock).
 * - Los productos reales del CMS siempre se muestran primero.
 */

import type { ProductWithImage } from '@/lib/catalog'

export type MockBadge = 'FAVORITO' | 'NUEVO' | 'IDEAL PARA REGALAR'

export const MOCK_GRID_SIZE = 8

const MOCK_IMAGES = [
  '/assets/hero/hero-solistica-1.jpeg',
  '/assets/hero/hero-solistica-2.jpeg',
  '/assets/hero/hero-solistica-3.jpeg',
]

interface MockProductSeed {
  id: number
  title: string
  slug: string
  subtitle: string
  price: number
  badge: MockBadge | null
}

const MOCK_SEEDS: MockProductSeed[] = [
  { id: 9001, title: 'Vela Vainilla & Ámbar', slug: 'mock-vela-vainilla-ambar', subtitle: 'Vainilla · Ámbar · Almizcle', price: 38900, badge: 'FAVORITO' },
  { id: 9002, title: 'Vela Sándalo & Cedro', slug: 'mock-vela-sandalo-cedro', subtitle: 'Sándalo · Cedro · Cuero', price: 38900, badge: 'NUEVO' },
  { id: 9003, title: 'Vela Bubble Canela', slug: 'mock-vela-bubble-canela', subtitle: 'Canela · Naranja · Vainilla', price: 39900, badge: null },
  { id: 9004, title: 'Vela Lavanda & Albaca', slug: 'mock-vela-lavanda-albaca', subtitle: 'Lavanda · Albaca · Romero', price: 39900, badge: 'IDEAL PARA REGALAR' },
  { id: 9005, title: 'Vela en Lata Té Blanco', slug: 'mock-vela-lata-te-blanco', subtitle: 'Té Blanco · Lirio · Almizcle', price: 26500, badge: 'NUEVO' },
  { id: 9006, title: 'Vela Cerámica Sándalo & Cuero', slug: 'mock-vela-ceramica-sandalo-cuero', subtitle: 'Sándalo · Cuero · Cedro', price: 46900, badge: null },
  { id: 9007, title: 'Set Vela Clásica', slug: 'mock-set-vela-clasica', subtitle: 'Vela · Fósforos · Wax Melts', price: 56900, badge: null },
  { id: 9008, title: 'Set Dúo Vainilla & Ámbar', slug: 'mock-set-duo-vainilla-ambar', subtitle: 'Vainilla · Ámbar · Almizcle', price: 64900, badge: null },
]

export const MOCK_PRODUCTS: ProductWithImage[] = MOCK_SEEDS.map((seed, index) => ({
  id: seed.id,
  title: seed.title,
  slug: seed.slug,
  description: null,
  price: seed.price,
  compareAtPrice: null,
  wholesalePrice: null,
  isWholesaleAvailable: false,
  stock: 100,
  active: true,
  featured: false,
  isSolistica: false,
  sortOrder: index,
  category: 0,
  tags: [],
  attributes: [],
  images: [],
  seoTitle: null,
  seoDescription: seed.subtitle,
  updatedAt: new Date(0).toISOString(),
  createdAt: new Date(0).toISOString(),
  featuredImage: {
    id: seed.id,
    url: MOCK_IMAGES[index % MOCK_IMAGES.length],
    alt: seed.title,
    filename: null,
  },
}))

export const MOCK_BADGES: Record<number, MockBadge> = Object.fromEntries(
  MOCK_SEEDS.filter((s) => s.badge).map((s) => [s.id, s.badge as MockBadge]),
)

export const MOCK_PRODUCT_IDS = new Set<number>(MOCK_SEEDS.map((s) => s.id))

export function isMockProductId(id: number | string): boolean {
  return MOCK_PRODUCT_IDS.has(Number(id))
}

export function findMockProductBySlug(slug: string): ProductWithImage | null {
  return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null
}

/** Categoría representativa para el detalle de productos mock. */
export const MOCK_CATEGORY = { id: 0, title: 'Velas', slug: 'velas' }

/** Galería del detalle mock: reutiliza las imágenes reales del proyecto. */
export function mockDetailImages(title: string): {
  id: number
  url: string | null
  alt: string
  filename: string | null
  caption: string | null
}[] {
  return MOCK_IMAGES.map((url, index) => ({
    id: 91000 + index,
    url,
    alt: title,
    filename: null,
    caption: null,
  }))
}

/** Grupos de filtros del mock (conteos ilustrativos, no del CMS). */
export interface MockFilterOption {
  slug: string
  name: string
  count: number
  color?: string
}

export const MOCK_TIPO_DE_VELA: MockFilterOption[] = [
  { slug: 'vela-clasica', name: 'Vela Clásica', count: 48 },
  { slug: 'vela-bubble', name: 'Vela Bubble', count: 18 },
  { slug: 'vela-en-lata', name: 'Vela en Lata', count: 26 },
  { slug: 'vela-de-soja', name: 'Vela de Soja', count: 24 },
  { slug: 'sets-regalos', name: 'Sets & Regalos', count: 16 },
]

export const MOCK_AROMAS: MockFilterOption[] = [
  { slug: 'vainilla', name: 'Vainilla', count: 28, color: '#E9C893' },
  { slug: 'ambar', name: 'Ámbar', count: 22, color: '#C47A2B' },
  { slug: 'sandalo', name: 'Sándalo', count: 18, color: '#A5714B' },
  { slug: 'lavanda', name: 'Lavanda', count: 20, color: '#B49BC7' },
  { slug: 'citrico', name: 'Cítrico', count: 16, color: '#E3C565' },
  { slug: 'naranja', name: 'Naranja', count: 12, color: '#D98E3B' },
  { slug: 'romero', name: 'Romero', count: 9, color: '#7D8F5A' },
  { slug: 'cuero', name: 'Cuero', count: 7, color: '#6B4A2F' },
]

export const MOCK_RITUALES: MockFilterOption[] = [
  { slug: 'relajacion', name: 'Relajación', count: 32 },
  { slug: 'energia', name: 'Energía', count: 18 },
  { slug: 'meditacion', name: 'Meditación', count: 16 },
  { slug: 'descanso', name: 'Descanso', count: 28 },
  { slug: 'bienestar', name: 'Bienestar', count: 22 },
]

/** Rango del slider del mock (ilustrativo). */
export const MOCK_PRICE_BOUNDS = { min: 8900, max: 89900 }

export const MOCK_STOCK_COUNT = 132
