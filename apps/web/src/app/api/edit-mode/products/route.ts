import { NextResponse } from 'next/server'
import { revalidateCatalog } from '@/lib/revalidate-catalog'
import type { getPayload } from 'payload'
import { slugify } from '@/lib/catalog-edit'
import { plainTextToLexical, sanitizeProductPatch } from '@/lib/product-edit'
import { uniqueSlug, verifyStaff } from '../auth'

export const dynamic = 'force-dynamic'

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>

async function idsExist(
  payload: PayloadInstance,
  collection: 'categories' | 'product-tags' | 'product-images',
  ids: number[],
): Promise<boolean> {
  if (ids.length === 0) return true
  const { docs } = await payload.find({
    collection,
    where: { id: { in: ids } },
    limit: ids.length,
    depth: 0,
    pagination: false,
  } as never)
  return docs.length === ids.length
}

/**
 * Crear producto (MODO EDICIÓN, storefront). Mismo contrato y whitelist que
 * la edición (`PUT /api/edit-mode/products/:id`): título, precio, categoría
 * (obligatorios) y stock, estado, destacado, tags, imágenes y descripción
 * (opcionales). El slug lo genera el servidor; nunca se acepta del cliente.
 * Solo admin/staff verificados por JWT; el alta respeta además el `access`
 * de la colección.
 */
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const verified = await verifyStaff(req)
  if ('error' in verified) return verified.error
  const { payload, user } = verified

  // Producto nuevo: la descripción parte de un documento simple vacío.
  const data = sanitizeProductPatch(body, plainTextToLexical(''))
  if (
    !data ||
    data.title === undefined ||
    data.price === undefined ||
    data.category === undefined
  ) {
    return NextResponse.json(
      { error: 'Nombre, precio y categoría son requeridos' },
      { status: 400 },
    )
  }

  try {
    if (!(await idsExist(payload, 'categories', [data.category]))) {
      return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 })
    }
    if (data.tags && !(await idsExist(payload, 'product-tags', data.tags))) {
      return NextResponse.json({ error: 'Tags inválidos' }, { status: 400 })
    }
    if (data.images && !(await idsExist(payload, 'product-images', data.images))) {
      return NextResponse.json({ error: 'Imágenes inválidas' }, { status: 400 })
    }

    // Si dos altas con el mismo título compiten por el slug, la restricción
    // única rechaza una: se reintenta una vez con un slug recalculado (que ya
    // ve la fila ganadora). Cualquier otro error vuelve a fallar y da 500.
    let created: { id: number; title: string; slug: string } | null = null
    for (let attempt = 0; attempt < 2 && !created; attempt++) {
      try {
        created = (await payload.create({
          collection: 'products',
          data: {
            ...data,
            slug: await uniqueSlug(payload, 'products', slugify(data.title)),
          },
          user: user as never,
          overrideAccess: false,
        } as never)) as unknown as { id: number; title: string; slug: string }
      } catch (err) {
        if (attempt === 1) throw err
      }
    }
    if (!created) throw new Error('create failed')

    // Listados, facetas y PDP usan el tag 'products': invalida ya para que el
    // producto nuevo aparezca al refrescar.
    revalidateCatalog('products')

    return NextResponse.json(
      { id: created.id, title: created.title, slug: created.slug },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { error: 'No se pudo crear el producto' },
      { status: 500 },
    )
  }
}

/**
 * Productos ocultos (`active=false`) de una categoría y sus tipos (MODO
 * EDICIÓN). El storefront público nunca los lista, así que sin esto un
 * producto en Oculto no se podría volver a encontrar para reactivarlo.
 * Solo admin/staff por JWT.
 */
export async function GET(req: Request) {
  const verified = await verifyStaff(req)
  if ('error' in verified) return verified.error
  const { payload } = verified

  const category = Number(new URL(req.url).searchParams.get('category'))
  if (!Number.isInteger(category) || category <= 0) {
    return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 })
  }

  try {
    const children = await payload.find({
      collection: 'categories',
      where: { parent: { equals: category } },
      limit: 200,
      depth: 0,
      pagination: false,
    } as never)
    const ids = [
      category,
      ...(children.docs as unknown as Array<{ id: number }>).map((c) => c.id),
    ]
    const found = await payload.find({
      collection: 'products',
      where: { and: [{ active: { equals: false } }, { category: { in: ids } }] },
      limit: 100,
      depth: 1,
      sort: 'title',
    } as never)
    const docs = (
      found.docs as unknown as Array<{
        id: number
        title: string
        slug: string
        price: number
        stock?: number | null
        soldOut?: boolean | null
        images?: Array<number | { url?: string | null }>
      }>
    ).map((p) => {
      const first = Array.isArray(p.images) ? p.images[0] : null
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        price: p.price,
        stock: p.stock ?? null,
        soldOut: p.soldOut === true,
        imageUrl:
          first && typeof first === 'object' && typeof first.url === 'string'
            ? first.url
            : null,
      }
    })
    const total =
      typeof (found as { totalDocs?: number }).totalDocs === 'number'
        ? (found as { totalDocs: number }).totalDocs
        : docs.length
    return NextResponse.json(
      { docs, total },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { error: 'No se pudieron cargar los productos ocultos' },
      { status: 500 },
    )
  }
}
