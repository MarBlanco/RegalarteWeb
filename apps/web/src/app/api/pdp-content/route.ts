import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { canEditHomeContent } from '@/lib/home-content'
import { getPdpContent, sanitizePdpContentPatch } from '@/lib/pdp-content'

export const dynamic = 'force-dynamic'

/** Lectura pública del contenido editorial de las pestañas del PDP. */
export async function GET() {
  const content = await getPdpContent()
  return NextResponse.json(content, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

function extractToken(req: Request): string | null {
  const header =
    req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!header) return null
  const parts = header.trim().split(/\s+/)
  const token = parts.length > 1 ? parts[parts.length - 1] : parts[0]
  return token || null
}

/**
 * Guardado del Modo Edición (mismo patrón que `/api/home-content`):
 * JWT verificado con `payload.auth()` y rol admin/staff exigido.
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

  const patch = sanitizePdpContentPatch(body)
  if (!patch) {
    return NextResponse.json(
      { error: 'Sin cambios válidos para guardar' },
      { status: 400 },
    )
  }

  try {
    const payload = await getPayload({ config })
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

    await payload.updateGlobal({
      slug: 'pdp-content',
      data: patch,
    })
  } catch {
    return NextResponse.json(
      { error: 'No se pudo guardar el contenido' },
      { status: 500 },
    )
  }

  const content = await getPdpContent()
  return NextResponse.json(content, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
