/**
 * Navegación principal editable (global `navigation`).
 *
 * Funciones puras, seguras para cliente y servidor. La fuente de verdad de los
 * slugs es la colección `categories`: una opción de tipo categoría guarda la
 * relación, no el slug. Los defaults son EXACTAMENTE el menú que estaba en
 * código: sin opciones guardadas la tienda no cambia.
 */

export interface NavLink {
  href: string
  label: string
  /** Slug de categoría para marcar la opción activa; null si no aplica. */
  category: string | null
  accent?: boolean
}

export const DEFAULT_NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Inicio', category: null },
  { href: '/catalogo?category=velas', label: 'Velas', category: 'velas' },
  { href: '/catalogo?category=aromas', label: 'Aromas', category: 'aromas' },
  { href: '/catalogo?category=wax-melts', label: 'Wax-Melts', category: 'wax-melts' },
  { href: '/catalogo?category=quemadores', label: 'Quemadores', category: 'quemadores' },
  { href: '/catalogo?category=packs', label: 'Packs', category: 'packs' },
  { href: '/catalogo?category=regalarte', label: 'Regalarte', category: 'regalarte', accent: true },
]

export const MAX_NAV_ITEMS = 20
export const MAX_NAV_LABEL = 40

const INTERNAL_PATH_RE = /^\/(?!\/)[^\s]*$/
const CATALOG_CATEGORY_RE = /^\/catalogo\?category=([a-z0-9-]+)$/

export type NavDestinationType = 'category' | 'path'

export interface NavCategoryOption {
  id: number
  slug: string
  title: string
}

/** Fila editable (incluye opciones desactivadas). */
export interface NavEditorItem {
  key: string
  label: string
  destinationType: NavDestinationType
  categoryId: number | null
  path: string
  active: boolean
  accent: boolean
}

export function isInternalPath(value: unknown): value is string {
  return typeof value === 'string' && INTERNAL_PATH_RE.test(value)
}

export function categoryHref(slug: string): string {
  return `/catalogo?category=${slug}`
}

type StoredCategory =
  | { id?: number; slug?: string; active?: boolean }
  | number
  | null
  | undefined

interface StoredItem {
  label?: unknown
  destinationType?: unknown
  category?: StoredCategory
  path?: unknown
  active?: unknown
  accent?: unknown
}

function storedItems(stored: unknown): StoredItem[] | null {
  const raw =
    stored && typeof stored === 'object'
      ? (stored as { items?: unknown }).items
      : null
  return Array.isArray(raw) && raw.length > 0 ? (raw as StoredItem[]) : null
}

function populatedSlug(c: StoredCategory): string | null {
  if (!c || typeof c !== 'object') return null
  if (typeof c.slug !== 'string' || c.slug === '' || c.active === false) return null
  return c.slug
}

/** Link visible de una opción guardada (null si no se puede mostrar). */
function toNavLink(item: StoredItem): NavLink | null {
  const label = typeof item.label === 'string' ? item.label.trim() : ''
  if (!label) return null
  const accent = item.accent === true
  if (item.destinationType === 'path') {
    if (!isInternalPath(item.path)) return null
    const m = CATALOG_CATEGORY_RE.exec(item.path)
    return { href: item.path, label, category: m ? m[1] : null, accent }
  }
  const slug = populatedSlug(item.category)
  if (!slug) return null
  return { href: categoryHref(slug), label, category: slug, accent }
}

/**
 * Global guardado (leído con depth >= 1) → opciones visibles del Nav, en
 * orden. Las desactivadas y las que apuntan a una categoría inexistente u
 * oculta no se muestran. Sin opciones guardadas → menú por defecto.
 */
export function resolveNavLinks(stored: unknown): NavLink[] {
  const items = storedItems(stored)
  if (!items) return DEFAULT_NAV_LINKS
  const out: NavLink[] = []
  for (const item of items) {
    if (item.active === false) continue
    const link = toNavLink(item)
    if (link) out.push(link)
  }
  return out
}

let keySeq = 0
export function newNavKey(): string {
  keySeq += 1
  return `nav-${Date.now().toString(36)}-${keySeq}`
}

/**
 * Global guardado → filas del editor. Sin nada guardado se parte del menú por
 * defecto, resolviendo cada categoría contra la lista real de categorías.
 */
export function toEditorItems(
  stored: unknown,
  categories: NavCategoryOption[],
): NavEditorItem[] {
  const items = storedItems(stored)
  if (!items) {
    return DEFAULT_NAV_LINKS.map((link) => {
      const cat = link.category
        ? categories.find((c) => c.slug === link.category)
        : undefined
      return {
        key: newNavKey(),
        label: link.label,
        destinationType: cat ? 'category' : 'path',
        categoryId: cat ? cat.id : null,
        path: cat ? '' : link.href,
        active: true,
        accent: link.accent === true,
      }
    })
  }
  return items.map((item) => {
    const cat = item.category
    let categoryId: number | null = null
    if (typeof cat === 'number') categoryId = cat
    else if (cat && typeof cat === 'object' && typeof cat.id === 'number') categoryId = cat.id
    return {
      key: newNavKey(),
      label: typeof item.label === 'string' ? item.label : '',
      destinationType: item.destinationType === 'path' ? 'path' : 'category',
      categoryId,
      path: typeof item.path === 'string' ? item.path : '',
      active: item.active !== false,
      accent: item.accent === true,
    }
  })
}

export interface NavItemData {
  label: string
  destinationType: NavDestinationType
  category: number | null
  path: string | null
  active: boolean
  accent: boolean
}

/**
 * Valida el cuerpo del PUT. Devuelve los datos listos para guardar o un
 * mensaje de error. `validCategoryIds` = categorías activas existentes.
 */
export function sanitizeNavItems(
  body: unknown,
  validCategoryIds: ReadonlySet<number>,
): { items: NavItemData[] } | { error: string } {
  const raw =
    body && typeof body === 'object' ? (body as { items?: unknown }).items : null
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: 'Agregá al menos una opción' }
  }
  if (raw.length > MAX_NAV_ITEMS) {
    return { error: `Máximo ${MAX_NAV_ITEMS} opciones` }
  }
  const items: NavItemData[] = []
  for (const r of raw) {
    const row = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>
    const label = typeof row.label === 'string' ? row.label.trim() : ''
    if (!label) return { error: 'Cada opción necesita un texto' }
    if (label.length > MAX_NAV_LABEL) {
      return { error: `El texto admite hasta ${MAX_NAV_LABEL} caracteres` }
    }
    const active = row.active !== false
    const accent = row.accent === true
    if (row.destinationType === 'path') {
      const path = typeof row.path === 'string' ? row.path.trim() : ''
      if (!isInternalPath(path)) {
        return { error: `"${label}": la ruta debe empezar con /` }
      }
      items.push({ label, destinationType: 'path', category: null, path, active, accent })
    } else {
      const id = row.categoryId
      if (typeof id !== 'number' || !validCategoryIds.has(id)) {
        return { error: `"${label}": elegí una categoría válida` }
      }
      items.push({ label, destinationType: 'category', category: id, path: null, active, accent })
    }
  }
  return { items }
}
