import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { canEditHomeContent } from '@/lib/home-content'
import { sanitizeProductPatch } from '@/lib/product-edit'

export const dynamic = 'force-dynamic'

function extractToken(req: Request): string | null {
  const header =
    req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!header) return null
  const parts = header.trim().split(/\s+/)
  const token = parts.length > 1 ? parts[parts.length - 1] : parts[0]
  return token || null
}

async function idsExist(
  payload: Awaited<ReturnType<typeof getPayload>>,
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
 * Edición comercial de un producto (MODO EDICIÓN, storefront).
 * Vive bajo `/api/edit-mode/*` a propósito: NO debe interceptar el REST
 * nativo de Payload (`/api/products/:id`, servido por el catch-all
 * `(payload)`), que el modal usa para LEER y el /admin para operar.
 * Solo admin/staff verificados por JWT. Whitelist estricta de campos
 * comerciales (ver `sanitizeProductPatch`). Nunca expone slug, B2B, SEO,
 * usuarios, roles ni configuración técnica.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params
  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
  }

  const token = extractToken(req)
  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })

    const existing = await payload
      .findByID({ collection: 'products', id, depth: 0 })
      .catch(() => null)
    if (!existing) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 },
      )
    }

    const patch = sanitizeProductPatch(
      body,
      (existing as { description?: unknown }).description,
    )
    if (!patch) {
      return NextResponse.json(
        { error: 'Sin cambios válidos para guardar' },
        { status: 400 },
      )
    }

    let user: unknown = null
    try {
      const auth = await payload.auth({
        headers: new Headers({ Authorization: `JWT ${token}` }),
      })
      user = auth.user
    } catch {
      user = null
    }
    if (!canEditHomeContent(user as { role?: string } | null)) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }

    if (patch.category !== undefined) {
      if (!(await idsExist(payload, 'categories', [patch.category]))) {
        return NextResponse.json(
          { error: 'Categoría inválida' },
          { status: 400 },
        )
      }
    }
    if (patch.tags !== undefined) {
      if (!(await idsExist(payload, 'product-tags', patch.tags))) {
        return NextResponse.json({ error: 'Tags inválidos' }, { status: 400 })
      }
    }
    if (patch.images !== undefined) {
      if (!(await idsExist(payload, 'product-images', patch.images))) {
        return NextResponse.json(
          { error: 'Imágenes inválidas' },
          { status: 400 },
        )
      }
    }

    const updated = (await payload.update({
      collection: 'products',
      id,
      data: patch,
      user: user as never,
      overrideAccess: false,
    })) as {
      id: number
      title: string
      slug: string
      price: number
      compareAtPrice?: number | null
      stock?: number
      soldOut?: boolean | null
      active?: boolean
      featured?: boolean
    }

    // Invalida el caché del storefront (listados, facetas y PDP usan el tag
    // 'products'): sin esto, router.refresh() reutiliza datos viejos hasta
    // 30–60s y el cambio (p. ej. Agotado↔Disponible) no se ve al instante.
    revalidateTag('products', 'max')

    return NextResponse.json(
      {
        id: updated.id,
        title: updated.title,
        slug: updated.slug,
        price: updated.price,
        compareAtPrice: updated.compareAtPrice ?? null,
        stock: updated.stock ?? null,
        soldOut: updated.soldOut ?? false,
        active: updated.active ?? null,
        featured: updated.featured ?? null,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { error: 'No se pudo guardar el producto' },
      { status: 500 },
    )
  }
}
