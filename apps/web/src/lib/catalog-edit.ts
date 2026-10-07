/**
 * Edición comercial de catálogo (MODO EDICIÓN, storefront).
 *
 * - Tipos = categorías hijas (modelo existente `Categories.parent`).
 * - Productos = colección existente `Products` (sin límite de tarjetas).
 * - "Quitar" un producto NUNCA lo borra: usa `active=false`, el mecanismo
 *   comercial existente (el listado filtra `active`).
 * - "Eliminar" un tipo vacío lo borra; con productos lo desactiva
 *   (evita huérfanos, reversible por admin).
 */

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const t = value.trim()
  if (!t) return null
  return t.slice(0, max)
}

function cleanId(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) return null
  return n
}

function cleanBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

function cleanNumber(value: unknown, max = 999999999): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const n = typeof value === 'string' && value.trim() === '' ? NaN : Number(value)
  if (!Number.isFinite(n) || n < 0 || n > max) return null
  return n
}

export interface CategoryCreateData {
  title: string
  slug: string
  description: string
  parent: number
  sortOrder: number
  active: boolean
  image?: number
  seoTitle?: string
  seoDescription?: string
}

/** Creación saneada: orden y slug los completa el servidor si faltan. */
export type CategoryCreateInput = Omit<CategoryCreateData, 'slug' | 'sortOrder'> & {
  sortOrder?: number
}

/** Sanitiza creación de tipo (categoría hija). Slug se genera en servidor. */
export function sanitizeCategoryCreate(body: unknown): CategoryCreateInput | null {
  if (!isRecord(body)) return null
  const title = body.title === undefined ? null : cleanText(body.title, 80)
  if (title === null) return null
  const parent = body.parent === undefined ? null : cleanId(body.parent)
  if (parent === null) return null
  const data: CategoryCreateInput = {
    title,
    description:
      typeof body.description === 'string'
        ? body.description.slice(0, 600)
        : '',
    parent,
    active: true,
  }
  if (body.image !== undefined) {
    const image = cleanId(body.image)
    if (image === null) return null
    data.image = image
  }
  if (!readCreateOptions(body, data)) return null
  return data
}

/** Visibilidad, orden y SEO opcionales del alta. Devuelve false si son inválidos. */
function readCreateOptions(
  body: Record<string, unknown>,
  data: CategoryCreateInput,
): boolean {
  if (body.active !== undefined) {
    const b = cleanBoolean(body.active)
    if (b === null) return false
    data.active = b
  }
  if (body.sortOrder !== undefined) {
    const n = cleanNumber(body.sortOrder, 100000)
    if (n === null || !Number.isInteger(n)) return false
    data.sortOrder = n
  }
  return readSeo(body, data)
}

/** SEO opcional (campos existentes de Categories). Devuelve false si es inválido. */
function readSeo(
  body: Record<string, unknown>,
  into: { seoTitle?: string; seoDescription?: string },
): boolean {
  if (body.seoTitle !== undefined) {
    if (typeof body.seoTitle !== 'string') return false
    into.seoTitle = body.seoTitle.trim().slice(0, 120)
  }
  if (body.seoDescription !== undefined) {
    if (typeof body.seoDescription !== 'string') return false
    into.seoDescription = body.seoDescription.trim().slice(0, 300)
  }
  return true
}

export interface CategoryPatchData {
  title?: string
  description?: string
  sortOrder?: number
  active?: boolean
  image?: number | null
  seoTitle?: string
  seoDescription?: string
}

/** Sanitiza edición de tipo. */
export function sanitizeCategoryPatch(body: unknown): CategoryPatchData | null {
  if (!isRecord(body)) return null
  const patch: CategoryPatchData = {}
  if (body.title !== undefined) {
    const title = cleanText(body.title, 80)
    if (title === null) return null
    patch.title = title
  }
  if (body.description !== undefined) {
    if (typeof body.description !== 'string') return null
    patch.description = body.description.slice(0, 600)
  }
  if (body.sortOrder !== undefined) {
    const n = cleanNumber(body.sortOrder, 100000)
    if (n === null || !Number.isInteger(n)) return null
    patch.sortOrder = n
  }
  if (body.active !== undefined) {
    const b = cleanBoolean(body.active)
    if (b === null) return null
    patch.active = b
  }
  if (body.image !== undefined) {
    if (body.image === null) {
      patch.image = null
    } else {
      const image = cleanId(body.image)
      if (image === null) return null
      patch.image = image
    }
  }
  if (!readSeo(body, patch)) return null
  return Object.keys(patch).length > 0 ? patch : null
}

function cleanColor(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string') return undefined
  const t = value.trim()
  if (!/^#[0-9a-fA-F]{6}$/.test(t)) return undefined
  return t
}

function cleanFilterKind(value: unknown): 'aroma' | 'ritual' | null {
  if (value !== 'aroma' && value !== 'ritual') return null
  return value
}

export interface FilterTagCreateData {
  name: string
  slug: string
  kind: 'aroma' | 'ritual'
  color?: string | null
}

/** Sanitiza creación de opción de filtro (aroma/ritual). Slug se genera en servidor. */
export function sanitizeFilterTagCreate(
  body: unknown,
): Omit<FilterTagCreateData, 'slug'> | null {
  if (!isRecord(body)) return null
  const name = body.name === undefined ? null : cleanText(body.name, 80)
  if (name === null) return null
  const kind = cleanFilterKind(body.kind)
  if (kind === null) return null
  const data: Omit<FilterTagCreateData, 'slug'> = { name, kind }
  if (body.color !== undefined) {
    const color = cleanColor(body.color)
    if (color === undefined) return null
    if (color !== null) data.color = color
  }
  return data
}

export interface FilterTagPatchData {
  name?: string
  color?: string | null
  active?: boolean
}

/**
 * Sanitiza edición de opción de filtro. Whitelist: nombre, color, activo.
 * Nunca slug ni kind (técnicos: el slug viaja en la URL del filtro).
 */
export function sanitizeFilterTagPatch(
  body: unknown,
): FilterTagPatchData | null {
  if (!isRecord(body)) return null
  const patch: FilterTagPatchData = {}
  if (body.name !== undefined) {
    const name = cleanText(body.name, 80)
    if (name === null) return null
    patch.name = name
  }
  if (body.color !== undefined) {
    const color = cleanColor(body.color)
    if (color === undefined) return null
    patch.color = color
  }
  if (body.active !== undefined) {
    const b = cleanBoolean(body.active)
    if (b === null) return null
    patch.active = b
  }
  return Object.keys(patch).length > 0 ? patch : null
}

export interface ProductCreateData {
  title: string
  slug: string
  price: number
  category: number
  stock: number
  active: boolean
  soldOut?: boolean
  compareAtPrice?: number | null
  tags?: number[]
  seoDescription?: string
}

/** Sanitiza creación de producto. Slug se genera en servidor. */
export function sanitizeProductCreate(
  body: unknown,
): Omit<ProductCreateData, 'slug'> | null {
  if (!isRecord(body)) return null
  const title = body.title === undefined ? null : cleanText(body.title, 200)
  if (title === null) return null
  const price = body.price === undefined ? null : cleanNumber(body.price)
  if (price === null) return null
  const category = body.category === undefined ? null : cleanId(body.category)
  if (category === null) return null
  const data: Omit<ProductCreateData, 'slug'> = {
    title,
    price,
    category,
    stock: 0,
    active: true,
  }
  if (body.stock !== undefined) {
    const stock = cleanNumber(body.stock, 1000000)
    if (stock === null || !Number.isInteger(stock)) return null
    data.stock = stock
  }
  if (body.soldOut !== undefined) {
    const b = cleanBoolean(body.soldOut)
    if (b === null) return null
    data.soldOut = b
  }
  if (body.compareAtPrice !== undefined) {
    if (body.compareAtPrice === null || body.compareAtPrice === '') {
      data.compareAtPrice = null
    } else {
      const n = cleanNumber(body.compareAtPrice)
      if (n === null) return null
      data.compareAtPrice = n
    }
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) return null
    const ids: number[] = []
    for (const t of body.tags) {
      const id = cleanId(t)
      if (id === null) return null
      if (!ids.includes(id)) ids.push(id)
    }
    data.tags = ids
  }
  if (body.seoDescription !== undefined) {
    if (typeof body.seoDescription !== 'string') return null
    const s = body.seoDescription.trim()
    if (s) data.seoDescription = s.slice(0, 300)
  }
  return data
}
