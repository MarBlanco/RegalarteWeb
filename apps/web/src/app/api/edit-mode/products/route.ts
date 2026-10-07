import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
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

    const created = (await payload.create({
      collection: 'products',
      data: {
        ...data,
        slug: await uniqueSlug(payload, 'products', slugify(data.title)),
      },
      user: user as never,
      overrideAccess: false,
    } as never)) as unknown as { id: number; title: string; slug: string }

    // Listados, facetas y PDP usan el tag 'products': invalida ya para que el
    // producto nuevo aparezca al refrescar.
    revalidateTag('products', { expire: 0 })

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
