/**
 * Sync DEV → PROD de contenido (núcleo puro, sin I/O ni Payload).
 *
 * Reglas del mecanismo:
 * - Identidad estable: `slug` en colecciones (único en el schema).
 * - Idempotente: si el doc destino ya iguala los campos sincronizados,
 *   la acción es `unchanged` (no escribe ni en modo apply).
 * - Nunca borra, nunca toca usuarios/órdenes/medios/imágenes.
 * - Excluye inactivos y basura conocida.
 * - El flag `active` solo se setea al crear (origen activo); jamás se
 *   modifica en destino (no reactiva ni desactiva nada existente).
 */

export const JUNK_PRODUCT_SLUGS = ['sdsdsdsdsdsd']

export const SYNCED_COLLECTIONS = [
  'categories',
  'product-tags',
  'product-attributes',
  'products',
] as const

export type SyncedCollection = (typeof SYNCED_COLLECTIONS)[number]

export const SYNCED_GLOBALS = ['home-content', 'pdp-content'] as const

export type PlanOp = 'create' | 'update' | 'unchanged'

export interface PlanAction {
  collection: SyncedCollection
  slug: string
  op: PlanOp
  destId?: number
}

export interface GlobalAction {
  global: (typeof SYNCED_GLOBALS)[number]
  op: 'update' | 'unchanged'
}

export interface SyncArgs {
  source: string
  dest: string
  apply: boolean
  confirmProd: boolean
  exportFile?: string
}

export function parseArgs(argv: string[]): SyncArgs | { error: string } {
  const get = (name: string): string | undefined => {
    const i = argv.indexOf(name)
    return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined
  }
  const source = get('--source')
  const dest = get('--dest')
  const exportFile = get('--export')
  if (!source || (!dest && !exportFile)) {
    return {
      error:
        'Faltan parámetros. Uso: sync:content --source <uri> [--dest <uri>] [--apply] [--confirm-prod] [--export <archivo>]',
    }
  }
  for (const [label, uri] of [
    ['source', source],
    ['dest', dest ?? source],
  ] as const) {
    if (!uri.startsWith('postgresql://') && !uri.startsWith('postgres://')) {
      return { error: `URI ${label} inválida (se espera postgresql://…)` }
    }
  }
  return {
    source,
    dest: dest ?? source,
    apply: argv.includes('--apply'),
    confirmProd: argv.includes('--confirm-prod'),
    ...(exportFile ? { exportFile } : {}),
  }
}

function hostnameOf(uri: string): string {
  try {
    return new URL(uri).hostname
  } catch {
    return ''
  }
}

/** Destino local (desarrollo/testing): nunca exige confirmación. */
export function isLocalDest(uri: string): boolean {
  return ['localhost', '127.0.0.1', '::1'].includes(hostnameOf(uri))
}

/**
 * Guardia anti-accidentes: un destino NO local exige --confirm-prod
 * explícito. Devuelve el mensaje de aborto o null si puede continuar.
 */
export function prodGuard(args: SyncArgs): string | null {
  if (!isLocalDest(args.dest) && !args.confirmProd) {
    return (
      'Destino NO local. Reejecutá con --confirm-prod para confirmar ' +
      'que querés escribir en producción. Sin --apply nada se escribe.'
    )
  }
  return null
}

export type Rec = Record<string, unknown>

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v : undefined
}

function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

function asBoolean(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined
}

function slugOf(doc: Rec): string | null {
  return typeof doc.slug === 'string' && doc.slug ? doc.slug : null
}

function pickDefined(data: Rec): Rec {
  const out: Rec = {}
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) out[k] = v
  }
  return out
}

/** Compara solo las claves sincronizadas (orden de claves irrelevante). */
export function sameData(a: Rec, b: Rec): boolean {
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]))
  for (const k of keys) {
    if (JSON.stringify(a[k] ?? null) !== JSON.stringify(b[k] ?? null)) {
      return false
    }
  }
  return true
}

export function buildCategoryData(doc: Rec): Rec {
  return pickDefined({
    title: asString(doc.title),
    slug: slugOf(doc),
    description: asString(doc.description) ?? null,
    sortOrder: asNumber(doc.sortOrder) ?? 0,
    featured: asBoolean(doc.featured) ?? false,
    seoTitle: asString(doc.seoTitle) ?? null,
    seoDescription: asString(doc.seoDescription) ?? null,
  })
}

export function buildTagData(doc: Rec): Rec {
  const kind =
    doc.kind === 'aroma' || doc.kind === 'ritual' || doc.kind === 'general'
      ? doc.kind
      : 'general'
  return pickDefined({
    name: asString(doc.name),
    slug: slugOf(doc),
    description: asString(doc.description) ?? null,
    color: asString(doc.color) ?? null,
    icon: asString(doc.icon) ?? null,
    kind,
    sortOrder: asNumber(doc.sortOrder) ?? 0,
    featured: asBoolean(doc.featured) ?? false,
    seoTitle: asString(doc.seoTitle) ?? null,
    seoDescription: asString(doc.seoDescription) ?? null,
  })
}

export function buildAttributeData(doc: Rec): Rec {
  const values = Array.isArray(doc.values)
    ? doc.values.flatMap((v) => {
        if (!v || typeof v !== 'object') return []
        const value = (v as Rec).value
        const sortOrder = (v as Rec).sortOrder
        if (typeof value !== 'string' || !value) return []
        return [
          {
            value,
            sortOrder:
              typeof sortOrder === 'number' && Number.isFinite(sortOrder)
                ? sortOrder
                : 0,
          },
        ]
      })
    : []
  return pickDefined({
    name: asString(doc.name),
    slug: slugOf(doc),
    description: asString(doc.description) ?? null,
    values,
    sortOrder: asNumber(doc.sortOrder) ?? 0,
  })
}

export interface ProductRelCtx {
  categoryId: number | null
  tagIds: number[]
  attributeIds: number[]
}

export function buildProductData(doc: Rec, rel: ProductRelCtx): Rec | null {
  if (rel.categoryId === null) return null
  return pickDefined({
    title: asString(doc.title),
    slug: slugOf(doc),
    description: doc.description ?? null,
    price: asNumber(doc.price),
    compareAtPrice: asNumber(doc.compareAtPrice) ?? null,
    wholesalePrice: asNumber(doc.wholesalePrice) ?? null,
    isWholesaleAvailable: asBoolean(doc.isWholesaleAvailable) ?? false,
    sku: asString(doc.sku) ?? null,
    stock: asNumber(doc.stock) ?? 0,
    soldOut: asBoolean(doc.soldOut) ?? false,
    featured: asBoolean(doc.featured) ?? false,
    isSolistica: asBoolean(doc.isSolistica) ?? false,
    sortOrder: asNumber(doc.sortOrder) ?? 0,
    category: rel.categoryId,
    tags: rel.tagIds,
    attributes: rel.attributeIds,
    seoTitle: asString(doc.seoTitle) ?? null,
    seoDescription: asString(doc.seoDescription) ?? null,
  })
}

/** Limpia metadatos de un global antes de updateGlobal. */
export function stripGlobalMeta(doc: Rec): Rec {
  const { id, createdAt, updatedAt, globalType, ...rest } = doc
  void id
  void createdAt
  void updatedAt
  void globalType
  return rest
}

/** ¿El doc origen califica para sync? (activo, con slug, sin basura). */
export function eligibleProduct(doc: Rec): boolean {
  const slug = slugOf(doc)
  if (!slug || doc.active !== true) return false
  return !JUNK_PRODUCT_SLUGS.includes(slug)
}

export function eligibleBySlug(
  doc: Rec,
  opts: { activeRequired: boolean },
): boolean {
  const slug = slugOf(doc)
  if (!slug) return false
  if (opts.activeRequired && doc.active !== true) return false
  return true
}
