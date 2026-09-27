import { NextResponse } from 'next/server'
import { sanitizeFilterTagPatch } from '@/lib/catalog-edit'
import { verifyStaff } from '../../auth'

export const dynamic = 'force-dynamic'

function parseId(raw: string): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

/**
 * Editar opción de filtro Aroma/Ritual (MODO EDICIÓN).
 * Whitelist estricta: nombre, color y activo. Nunca slug ni grupo.
 * Solo admin/staff verificados por JWT.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params
  const id = parseId(rawId)
  if (id === null) {
    return NextResponse.json({ error: 'Opción inválida' }, { status: 400 })
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }
  const patch = sanitizeFilterTagPatch(body)
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
      .findByID({ collection: 'product-tags', id, depth: 0 })
      .catch(() => null)
    if (!existing) {
      return NextResponse.json(
        { error: 'Opción no encontrada' },
        { status: 404 },
      )
    }
    const updated = (await payload.update({
      collection: 'product-tags',
      id,
      data: patch,
      user: user as never,
      overrideAccess: false,
    })) as { id: number }
    return NextResponse.json(
      { id: updated.id },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { error: 'No se pudo guardar la opción' },
      { status: 500 },
    )
  }
}

/**
 * Eliminar opción de filtro (MODO EDICIÓN).
 * Con productos vinculados NO se borra: se oculta (active=false, el mismo
 * mecanismo comercial que "Quitar producto"). Vacía se elimina del todo.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params
  const id = parseId(rawId)
  if (id === null) {
    return NextResponse.json({ error: 'Opción inválida' }, { status: 400 })
  }

  const verified = await verifyStaff(req)
  if ('error' in verified) return verified.error
  const { payload, user } = verified

  try {
    const existing = await payload
      .findByID({ collection: 'product-tags', id, depth: 0 })
      .catch(() => null)
    if (!existing) {
      return NextResponse.json(
        { error: 'Opción no encontrada' },
        { status: 404 },
      )
    }
    const linked = await payload.find({
      collection: 'products',
      where: { tags: { contains: id } },
      limit: 1,
      depth: 0,
      pagination: false,
    } as never)
    if (linked.docs.length > 0) {
      await payload.update({
        collection: 'product-tags',
        id,
        data: { active: false },
        user: user as never,
        overrideAccess: false,
      })
      return NextResponse.json(
        { id, deactivated: true },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }
    await payload.delete({
      collection: 'product-tags',
      id,
      user: user as never,
      overrideAccess: false,
    })
    return NextResponse.json(
      { id, deleted: true },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { error: 'No se pudo eliminar la opción' },
      { status: 500 },
    )
  }
}
