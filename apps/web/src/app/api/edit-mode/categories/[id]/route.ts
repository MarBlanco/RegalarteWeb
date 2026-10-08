import { NextResponse } from 'next/server'
import { revalidateCatalog } from '@/lib/revalidate-catalog'
import { reorderSiblings, sanitizeCategoryPatch } from '@/lib/catalog-edit'
import { verifyStaff } from '../../auth'

export const dynamic = 'force-dynamic'

function parseId(raw: string): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

/**
 * Editar tipo (MODO EDICIÓN). Whitelist: title, description, sortOrder,
 * active, image. Solo admin/staff.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params
  const id = parseId(rawId)
  if (id === null) {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }
  const patch = sanitizeCategoryPatch(body)
  if (!patch) {
    return NextResponse.json(
      { error: 'Sin cambios válidos para guardar' },
      { status: 400 },
    )
  }

  const verified = await verifyStaff(req)
  if ('error' in verified) return verified.error
  const { payload, user } = verified

  try {
    const existing = await payload
      .findByID({ collection: 'categories', id, depth: 0 })
      .catch(() => null)
    if (!existing) {
      return NextResponse.json(
        { error: 'Tipo no encontrado' },
        { status: 404 },
      )
    }
    if (patch.image !== undefined && patch.image !== null) {
      const media = await payload
        .findByID({ collection: 'media', id: patch.image, depth: 0 })
        .catch(() => null)
      if (!media) {
        return NextResponse.json({ error: 'Imagen inválida' }, { status: 400 })
      }
    }
    // Cambiar el orden reubica al tipo entre sus hermanos y renumera todos
    // (consecutivo, sin duplicados).
    const parentId = existing.parent
    if (patch.sortOrder !== undefined && typeof parentId === 'number') {
      const siblings = await payload.find({
        collection: 'categories',
        where: { parent: { equals: parentId } },
        limit: 200,
        depth: 0,
        pagination: false,
        sort: 'sortOrder',
      } as never)
      const current = new Map<number, number>()
      for (const d of siblings.docs as unknown as Array<{ id: number; sortOrder?: number }>) {
        current.set(d.id, typeof d.sortOrder === 'number' ? d.sortOrder : 0)
      }
      const next = reorderSiblings(
        Array.from(current, ([sid, sortOrder]) => ({ id: sid, sortOrder })),
        id,
        patch.sortOrder,
      )
      patch.sortOrder = next.get(id) ?? patch.sortOrder
      for (const [sid, order] of Array.from(next)) {
        if (sid === id || current.get(sid) === order) continue
        await payload.update({
          collection: 'categories',
          id: sid,
          data: { sortOrder: order },
          user: user as never,
          overrideAccess: false,
        })
      }
    }
    const updated = (await payload.update({
      collection: 'categories',
      id,
      data: patch,
      user: user as never,
      overrideAccess: false,
    })) as { id: number; title: string; slug: string }
    revalidateCatalog('categories')
    return NextResponse.json(
      { id: updated.id, title: updated.title, slug: updated.slug },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { error: 'No se pudo guardar el tipo' },
      { status: 500 },
    )
  }
}

/**
 * Eliminar tipo (MODO EDICIÓN). Vacío → borrado físico. Con productos →
 * se desactiva (active=false, reversible) para no dejar huérfanos.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params
  const id = parseId(rawId)
  if (id === null) {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }

  const verified = await verifyStaff(req)
  if ('error' in verified) return verified.error
  const { payload, user } = verified

  try {
    const existing = await payload
      .findByID({ collection: 'categories', id, depth: 0 })
      .catch(() => null)
    if (!existing) {
      return NextResponse.json(
        { error: 'Tipo no encontrado' },
        { status: 404 },
      )
    }
    const inUse = await payload.find({
      collection: 'products',
      where: { category: { equals: id } },
      limit: 1,
      depth: 0,
      pagination: false,
    } as never)
    if (inUse.docs.length > 0) {
      await payload.update({
        collection: 'categories',
        id,
        data: { active: false },
        user: user as never,
        overrideAccess: false,
      })
      revalidateCatalog('categories')
      return NextResponse.json(
        { deactivated: true },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }
    await payload.delete({
      collection: 'categories',
      id,
      user: user as never,
      overrideAccess: false,
    })
    revalidateCatalog('categories')
    return NextResponse.json(
      { deleted: true },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { error: 'No se pudo eliminar el tipo' },
      { status: 500 },
    )
  }
}
