import { NextResponse } from 'next/server'
import { revalidateStorefrontPages } from '@/lib/revalidate-catalog'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  canEditHomeContent,
  getHomeContent,
  sanitizeHomeContentPatch,
} from '@/lib/home-content'

export const dynamic = 'force-dynamic'

/** Lectura pública del contenido comercial de la Home. */
export async function GET() {
  const content = await getHomeContent()
  return NextResponse.json(content, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

function extractToken(req: Request): string | null {
  const header =
    req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!header) return null
  const parts = header.trim().split(/\s+/)
  // Acepta "JWT <token>" (Payload) y "Bearer <token>".
  const token = parts.length > 1 ? parts[parts.length - 1] : parts[0]
  return token || null
}

/**
 * Guardado del Modo Edición. El permiso se valida en el SERVIDOR:
 * el JWT se verifica con `payload.auth()` y se exige rol admin/staff.
 * Ocultar los botones en el cliente no otorga ningún acceso.
 */
export async function PUT(req: Request) {
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

  const patch = sanitizeHomeContentPatch(body)
  if (!patch) {
    return NextResponse.json(
      { error: 'Sin cambios válidos para guardar' },
      { status: 400 },
    )
  }

  try {
    const payload = await getPayload({ config })
    let user: { role?: string } | null = null
    try {
      const auth = await payload.auth({
        headers: new Headers({ Authorization: `JWT ${token}` }),
      })
      user = auth.user as { role?: string } | null
    } catch {
      user = null
    }
    if (!canEditHomeContent(user)) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }

    await payload.updateGlobal({
      slug: 'home-content',
      data: patch,
    })
    revalidateStorefrontPages()
  } catch {
    return NextResponse.json(
      { error: 'No se pudo guardar el contenido' },
      { status: 500 },
    )
  }

  const content = await getHomeContent()
  return NextResponse.json(content, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
