/**
 * Sync DEV → PROD — cómputo del plan y aplicación (testeable, sin I/O).
 *
 * El script CLI (`scripts/sync-content.ts`) solo obtiene los datos vía
 * Payload y delega acá. Los tests usan un cliente falso en memoria.
 */
import {
  sameData,
  buildCategoryData,
  buildTagData,
  buildAttributeData,
  buildProductData,
  stripGlobalMeta,
  eligibleProduct,
  eligibleBySlug,
  JUNK_PRODUCT_SLUGS,
  SYNCED_GLOBALS,
  type Rec,
  type PlanAction,
  type GlobalAction,
  type SyncedCollection,
} from './plan'

export interface ExportData {
  categories: Rec[]
  tags: Rec[]
  attributes: Rec[]
  products: Rec[]
  globals: Record<string, Rec | null>
}

export interface SyncPlan {
  actions: PlanAction[]
  globalActions: GlobalAction[]
  warnings: string[]
  src: ExportData
  built: {
    categories: Map<string, Rec>
    tags: Map<string, Rec>
    attributes: Map<string, Rec>
  }
}

export interface SyncClient {
  create(collection: string, data: Rec): Promise<Rec>
  update(collection: string, id: number, data: Rec): Promise<Rec>
  updateGlobal(slug: string, data: Rec): Promise<unknown>
}

function bySlug(docs: Rec[]): Map<string, Rec> {
  const map = new Map<string, Rec>()
  for (const d of docs) {
    if (typeof d.slug === 'string' && d.slug) map.set(d.slug, d)
  }
  return map
}

export function computePlan(src: ExportData, dst: ExportData): SyncPlan {
  const actions: PlanAction[] = []
  const warnings: string[] = []
  const built = {
    categories: new Map<string, Rec>(),
    tags: new Map<string, Rec>(),
    attributes: new Map<string, Rec>(),
  }

  const dstCatBySlug = bySlug(dst.categories)
  const dstTagBySlug = bySlug(dst.tags)
  const dstAttrBySlug = bySlug(dst.attributes)
  const dstProdBySlug = bySlug(dst.products)

  const planCollection = (
    collection: SyncedCollection,
    items: Rec[],
    dstBySlug: Map<string, Rec>,
    build: (doc: Rec) => Rec,
    eligible: (doc: Rec) => boolean,
  ): Map<string, Rec> => {
    const out = new Map<string, Rec>()
    for (const doc of items) {
      const slug = typeof doc.slug === 'string' ? doc.slug : ''
      if (!eligible(doc)) continue
      const data = build(doc)
      out.set(slug, data)
      const existing = dstBySlug.get(slug)
      if (!existing) {
        actions.push({ collection, slug, op: 'create' })
      } else if (!sameData(data, build(existing))) {
        actions.push({
          collection,
          slug,
          op: 'update',
          destId: existing.id as number,
        })
      } else {
        actions.push({ collection, slug, op: 'unchanged' })
      }
    }
    return out
  }

  built.categories = planCollection(
    'categories',
    src.categories,
    dstCatBySlug,
    buildCategoryData,
    (d) => eligibleBySlug(d, { activeRequired: true }),
  )
  built.tags = planCollection(
    'product-tags',
    src.tags,
    dstTagBySlug,
    buildTagData,
    (d) => eligibleBySlug(d, { activeRequired: true }),
  )
  built.attributes = planCollection(
    'product-attributes',
    src.attributes,
    dstAttrBySlug,
    buildAttributeData,
    (d) => eligibleBySlug(d, { activeRequired: true }),
  )

  const catIds = new Map<string, number>()
  const tagIds = new Map<string, number>()
  const attrIds = new Map<string, number>()
  dstCatBySlug.forEach((doc, slug) => catIds.set(slug, doc.id as number))
  dstTagBySlug.forEach((doc, slug) => tagIds.set(slug, doc.id as number))
  dstAttrBySlug.forEach((doc, slug) => attrIds.set(slug, doc.id as number))

  const catSlugOf = (doc: Rec): string | null => {
    const c = doc.category
    if (typeof c === 'number') {
      const found = src.categories.find((s) => s.id === c)
      return found && typeof found.slug === 'string' ? found.slug : null
    }
    return null
  }
  const slugsOf = (doc: Rec, key: string, pool: Rec[]): string[] => {
    const v = doc[key]
    if (!Array.isArray(v)) return []
    return v.flatMap((id) => {
      if (typeof id !== 'number') return []
      const found = pool.find((s) => s.id === id)
      return found && typeof found.slug === 'string' ? [found.slug] : []
    })
  }
  const resolveIds = (doc: Rec): {
    categoryId: number | null
    tagIds: number[]
    attributeIds: number[]
  } => ({
    categoryId: (() => {
      const s = catSlugOf(doc)
      return s ? (catIds.get(s) ?? null) : null
    })(),
    tagIds: slugsOf(doc, 'tags', src.tags).flatMap((s) => {
      const id = tagIds.get(s)
      return id === undefined ? [] : [id]
    }),
    attributeIds: slugsOf(doc, 'attributes', src.attributes).flatMap((s) => {
      const id = attrIds.get(s)
      return id === undefined ? [] : [id]
    }),
  })

  for (const doc of src.products) {
    const slug = typeof doc.slug === 'string' ? doc.slug : ''
    if (!eligibleProduct(doc)) {
      if (slug && (doc.active !== true || JUNK_PRODUCT_SLUGS.includes(slug))) {
        warnings.push(`producto excluido: ${slug || '(sin slug)'}`)
      }
      continue
    }
    const dst = dstProdBySlug.get(slug)
    if (!dst) {
      // Create: la categoría viene en el mismo plan (se resuelve al aplicar).
      // Solo se omite si ni siquiera está en origen.
      const catSlug = catSlugOf(doc)
      if (!catSlug || !built.categories.has(catSlug)) {
        warnings.push(`producto ${slug}: categoría sin resolver, se omite`)
        continue
      }
      actions.push({ collection: 'products', slug, op: 'create' })
      continue
    }
    const rel = resolveIds(doc)
    if (rel.categoryId === null) {
      warnings.push(`producto ${slug}: categoría sin resolver, se omite`)
      continue
    }
    const data = buildProductData(doc, rel)
    if (!data) continue
    const dstBuilt = buildProductData(dst, {
      categoryId: rel.categoryId,
      tagIds: data.tags as number[],
      attributeIds: data.attributes as number[],
    })
    if (!dstBuilt || !sameData(data, dstBuilt)) {
      actions.push({
        collection: 'products',
        slug,
        op: 'update',
        destId: dst.id as number,
      })
    } else {
      actions.push({ collection: 'products', slug, op: 'unchanged' })
    }
  }

  const globalActions: GlobalAction[] = []
  for (const g of SYNCED_GLOBALS) {
    const s = src.globals[g]
    if (!s) {
      warnings.push(`global ${g} ausente en origen, se omite`)
      globalActions.push({ global: g, op: 'unchanged' })
      continue
    }
    const d = dst.globals[g]
    globalActions.push({
      global: g,
      op: !d || !sameData(stripGlobalMeta(s), stripGlobalMeta(d)) ? 'update' : 'unchanged',
    })
  }

  return { actions, globalActions, warnings, src, built }
}

/**
 * Aplica un plan con un cliente inyectado.
 * - Crea con active=true; nunca modifica `active` en destino.
 * - Padres de categorías en segunda pasada (ya existen a esa altura).
 * - Relaciones de productos resueltas con ids destino finales.
 * - Nunca borra.
 */
export async function applyPlan(
  client: SyncClient,
  plan: SyncPlan,
  dst: ExportData,
): Promise<void> {
  const finalIds: Record<'categories' | 'tags' | 'attributes', Map<string, number>> = {
    categories: new Map<string, number>(),
    tags: new Map<string, number>(),
    attributes: new Map<string, number>(),
  }
  const keyOf = (
    collection: SyncedCollection,
  ): 'categories' | 'tags' | 'attributes' =>
    collection === 'categories'
      ? 'categories'
      : collection === 'product-tags'
        ? 'tags'
        : 'attributes';
  const seedExisting = (pool: Rec[], map: Map<string, number>): void => {
    for (const d of pool) {
      if (typeof d.slug === 'string' && typeof d.id === 'number') {
        map.set(d.slug, d.id)
      }
    }
  }
  seedExisting(dst.categories, finalIds.categories)
  seedExisting(dst.tags, finalIds.tags)
  seedExisting(dst.attributes, finalIds.attributes)

  const writeSimple = async (
    collection: Exclude<SyncedCollection, 'products'>,
    data: Map<string, Rec>,
  ): Promise<void> => {
    for (const a of plan.actions.filter((x) => x.collection === collection)) {
      const datum = { ...(data.get(a.slug) ?? {}) }
      if (a.op === 'create') {
        const created = await client.create(collection, {
          ...datum,
          active: true,
        })
        finalIds[keyOf(collection)].set(a.slug, created.id as number)
      } else if (a.op === 'update' && a.destId !== undefined) {
        const updated = await client.update(collection, a.destId, datum)
        finalIds[keyOf(collection)].set(a.slug, updated.id as number)
      }
    }
  }

  await writeSimple('categories', plan.built.categories)

  // Padres (segunda pasada, solo no-unchanged con padre en origen).
  const srcCatBySlug = new Map<string, Rec>()
  for (const d of plan.src.categories) {
    if (typeof d.slug === 'string') srcCatBySlug.set(d.slug, d)
  }
  for (const a of plan.actions.filter(
    (x) => x.collection === 'categories' && x.op !== 'unchanged',
  )) {
    const src = srcCatBySlug.get(a.slug)
    const parentId =
      src && typeof src.parent === 'number'
        ? (() => {
            const p = plan.src.categories.find((s) => s.id === src.parent)
            const ps = p && typeof p.slug === 'string' ? p.slug : null
            return ps ? finalIds.categories.get(ps) : undefined
          })()
        : undefined
    const selfId = finalIds.categories.get(a.slug)
    if (parentId !== undefined && selfId !== undefined) {
      await client.update('categories', selfId, { parent: parentId })
    }
  }

  await writeSimple('product-tags', plan.built.tags)
  await writeSimple('product-attributes', plan.built.attributes)

  // Productos con relaciones finales.
  const slugOfId = (pool: Rec[], id: number): string | null => {
    const found = pool.find((s) => s.id === id)
    return found && typeof found.slug === 'string' ? found.slug : null
  }
  for (const a of plan.actions.filter((x) => x.collection === 'products')) {
    const src = plan.src.products.find((s) => s.slug === a.slug)
    if (!src) continue
    const catRaw = src.category
    const catSlug =
      typeof catRaw === 'number' ? slugOfId(plan.src.categories, catRaw) : null
    const categoryId = catSlug ? (finalIds.categories.get(catSlug) ?? null) : null
    if (categoryId === null) continue
    const tagIds = (Array.isArray(src.tags) ? src.tags : []).flatMap((id) => {
      if (typeof id !== 'number') return []
      const s = slugOfId(plan.src.tags, id)
      const resolved = s ? finalIds.tags.get(s) : undefined
      return resolved === undefined ? [] : [resolved]
    })
    const attributeIds = (Array.isArray(src.attributes) ? src.attributes : []).flatMap(
      (id) => {
        if (typeof id !== 'number') return []
        const s = slugOfId(plan.src.attributes, id)
        const resolved = s ? finalIds.attributes.get(s) : undefined
        return resolved === undefined ? [] : [resolved]
      },
    )
    const datum = buildProductData(src, { categoryId, tagIds, attributeIds })
    if (!datum) continue
    if (a.op === 'create') {
      await client.create('products', { ...datum, active: true })
    } else if (a.op === 'update' && a.destId !== undefined) {
      await client.update('products', a.destId, datum)
    }
  }

  for (const g of plan.globalActions) {
    if (g.op === 'update') {
      const src = plan.src.globals[g.global]
      if (src) await client.updateGlobal(g.global, stripGlobalMeta(src))
    }
  }
}
