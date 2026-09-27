import { NextResponse } from 'next/server'
import { slugify, sanitizeFilterTagCreate } from '@/lib/catalog-edit'
import { verifyStaff, uniqueSlug } from '../auth'

export const dynamic = 'force-dynamic'

/**
 * Crear opción de filtro Aroma/Ritual (MODO EDICIÓN).
 * Whitelist estricta: nombre, grupo y color. Slug único generado en
 * servidor; la opción nace activa. Solo admin/staff por JWT.
 */
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }
  const data = sanitizeFilterTagCreate(body)
  if (!data) {
    return NextResponse.json(
      { error: 'Nombre y grupo válidos son requeridos' },
      { status: 400 },
    )
  }

  const verified = await verifyStaff(req)
  if ('error' in verified) return verified.error
  const { payload, user } = verified

  try {
    const slug = await uniqueSlug(
      payload,
      'product-tags',
      slugify(data.name) || 'opcion',
    )
    const created = (await payload.create({
      collection: 'product-tags',
      data: {
        name: data.name,
        slug,
        kind: data.kind,
        ...(data.color !== undefined ? { color: data.color } : {}),
        active: true,
      },
      user: user as never,
      overrideAccess: false,
    })) as { id: number; slug: string }
    return NextResponse.json(
      { id: created.id, slug: created.slug },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { error: 'No se pudo crear la opción' },
      { status: 500 },
    )
  }
}
