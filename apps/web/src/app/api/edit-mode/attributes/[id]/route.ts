import { NextResponse } from 'next/server'
import { sanitizeAttributeValues } from '@/lib/product-edit'
import { verifyStaff } from '../../auth'

export const dynamic = 'force-dynamic'

function parseId(raw: string): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

/**
 * Editar valores de una nota aromática (atributo) del PDP (MODO EDICIÓN).
 * Whitelist estricta: solo `values`. Nunca nombre, slug, flags ni nada
 * técnico. Solo admin/staff verificados por JWT.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params
  const id = parseId(rawId)
  if (id === null) {
    return NextResponse.json({ error: 'Atributo inválido' }, { status: 400 })
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }
  const values = sanitizeAttributeValues(body)
  if (!values) {
    return NextResponse.json(
      { error: 'Sin valores válidos para guardar' },
      { status: 400 },
    )
  }

  const verified = await verifyStaff(req)
  if ('error' in verified) return verified.error
  const { payload, user } = verified

  try {
    const existing = await payload
      .findByID({ collection: 'product-attributes', id, depth: 0 })
      .catch(() => null)
    if (!existing) {
      return NextResponse.json(
        { error: 'Atributo no encontrado' },
        { status: 404 },
      )
    }
    const updated = (await payload.update({
      collection: 'product-attributes',
      id,
      data: { values },
      user: user as never,
      overrideAccess: false,
    })) as { id: number }
    return NextResponse.json(
      { id: updated.id },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { error: 'No se pudo guardar la nota' },
      { status: 500 },
    )
  }
}
