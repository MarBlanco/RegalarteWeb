import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { slugify, sanitizeCategoryCreate } from '@/lib/catalog-edit'
import { verifyStaff, uniqueSlug } from '../auth'

export const dynamic = 'force-dynamic'

/**
 * Listar tipos hijas de una categoría (MODO EDICIÓN). Incluye las ocultas
 * (`active=false`) para que Guale pueda reactivarlas. Solo admin/staff.
 * El storefront público NUNCA usa esta ruta (usa el REST público filtrado).
 */
export async function GET(req: Request) {
  const verified = await verifyStaff(req)
  if ('error' in verified) return verified.error
  const { payload } = verified

  const { searchParams } = new URL(req.url)
  const parent = Number(searchParams.get('parent'))
  if (!Number.isInteger(parent) || parent <= 0) {
    return NextResponse.json(
      { error: 'Categoría padre inválida' },
      { status: 400 },
    )
  }

  try {
    const found = await payload.find({
      collection: 'categories',
      where: { parent: { equals: parent } },
      limit: 100,
      depth: 1,
      pagination: false,
      sort: 'sortOrder',
    } as never)
    const docs = (found.docs as unknown as Array<Record<string, unknown>>).map((d) => {
      const image =
        d.image !== null && typeof d.image === 'object'
          ? (d.image as { id?: unknown; url?: unknown })
          : null
      return {
        id: d.id,
        title: d.title,
        slug: d.slug,
        description: typeof d.description === 'string' ? d.description : '',
        image:
          image && typeof image.id === 'number'
            ? {
                id: image.id,
                url: typeof image.url === 'string' ? image.url : null,
              }
            : null,
        sortOrder: typeof d.sortOrder === 'number' ? d.sortOrder : 0,
        active: d.active !== false,
        seoTitle: typeof d.seoTitle === 'string' ? d.seoTitle : '',
        seoDescription: typeof d.seoDescription === 'string' ? d.seoDescription : '',
      }
    })
    return NextResponse.json(
      { docs },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { error: 'No se pudieron cargar los tipos' },
      { status: 500 },
    )
  }
}

/**
 * Crear tipo = categoría hija (MODO EDICIÓN). Solo admin/staff.
 * El slug se genera en servidor desde el título (Guale nunca ve URLs).
 */
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }
  const data = sanitizeCategoryCreate(body)
  if (!data) {
    return NextResponse.json(
      { error: 'Título y categoría padre requeridos' },
      { status: 400 },
    )
  }

  const verified = await verifyStaff(req)
  if ('error' in verified) return verified.error
  const { payload, user } = verified

  try {
    const parent = await payload
      .findByID({ collection: 'categories', id: data.parent, depth: 0 })
      .catch(() => null)
    if (!parent) {
      return NextResponse.json(
        { error: 'Categoría padre inválida' },
        { status: 400 },
      )
    }
    if (data.image !== undefined) {
      const media = await payload
        .findByID({ collection: 'media', id: data.image, depth: 0 })
        .catch(() => null)
      if (!media) {
        return NextResponse.json({ error: 'Imagen inválida' }, { status: 400 })
      }
    }

    const siblings = await payload.find({
      collection: 'categories',
      where: { parent: { equals: data.parent } },
      limit: 200,
      depth: 0,
      pagination: false,
      sort: '-sortOrder',
    } as never)
    const first = siblings.docs[0] as { sortOrder?: unknown } | undefined
    const sortOrder =
      data.sortOrder ??
      (typeof first?.sortOrder === 'number' ? first.sortOrder + 1 : 0)

    const created = (await payload.create({
      collection: 'categories',
      data: {
        title: data.title,
        slug: await uniqueSlug(payload, 'categories', slugify(data.title)),
        description: data.description,
        parent: data.parent,
        sortOrder,
        active: data.active,
        ...(data.image !== undefined ? { image: data.image } : {}),
        ...(data.seoTitle !== undefined ? { seoTitle: data.seoTitle } : {}),
        ...(data.seoDescription !== undefined
          ? { seoDescription: data.seoDescription }
          : {}),
      },
      user: user as never,
      overrideAccess: false,
    })) as { id: number; title: string; slug: string }

    // El selector de tipos y el catálogo cachean categorías (300s):
    // invalida para reflejo inmediato.
    revalidateTag('categories', 'max')

    return NextResponse.json(
      { id: created.id, title: created.title, slug: created.slug },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { error: 'No se pudo crear el tipo' },
      { status: 500 },
    )
  }
}
