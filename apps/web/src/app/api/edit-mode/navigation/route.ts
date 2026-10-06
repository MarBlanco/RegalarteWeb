import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import type { getPayload } from 'payload'
import { NAVIGATION_TAG } from '@/lib/navigation-server'
import { sanitizeNavItems } from '@/lib/navigation'
import { verifyStaff } from '../auth'

export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'no-store' }

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>

async function topLevelCategories(payload: PayloadInstance) {
  const found = await payload.find({
    collection: 'categories',
    where: {
      and: [{ parent: { exists: false } }, { active: { equals: true } }],
    },
    limit: 100,
    depth: 0,
    pagination: false,
    sort: 'title',
  } as never)
  return (found.docs as unknown as Array<{ id: number; slug: string; title: string }>).map(
    (c) => ({ id: c.id, slug: c.slug, title: c.title }),
  )
}

/**
 * Datos del editor de navegación (MODO EDICIÓN): opciones guardadas
 * (incluye las desactivadas) y categorías disponibles como destino.
 * Solo admin/staff.
 */
export async function GET(req: Request) {
  const verified = await verifyStaff(req)
  if ('error' in verified) return verified.error
  const { payload } = verified
  try {
    const stored = await payload.findGlobal({
      slug: 'navigation',
      depth: 1,
      overrideAccess: true,
    })
    const categories = await topLevelCategories(payload)
    return NextResponse.json(
      { stored, categories },
      { headers: NO_STORE },
    )
  } catch {
    return NextResponse.json(
      { error: 'No se pudo cargar la navegación' },
      { status: 500 },
    )
  }
}

/**
 * Guardar la navegación completa (orden, textos, destinos y estado). El
 * permiso se valida en el SERVIDOR con el JWT; los destinos de categoría se
 * validan contra las categorías reales.
 */
export async function PUT(req: Request) {
  const verified = await verifyStaff(req)
  if ('error' in verified) return verified.error
  const { payload } = verified

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  try {
    const categories = await topLevelCategories(payload)
    const result = sanitizeNavItems(body, new Set(categories.map((c) => c.id)))
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    const stored = await payload.updateGlobal({
      slug: 'navigation',
      data: { items: result.items },
      depth: 1,
      overrideAccess: true,
    } as never)
    revalidateTag(NAVIGATION_TAG, { expire: 0 })
    return NextResponse.json({ stored, categories }, { headers: NO_STORE })
  } catch {
    return NextResponse.json(
      { error: 'No se pudo guardar la navegación' },
      { status: 500 },
    )
  }
}
