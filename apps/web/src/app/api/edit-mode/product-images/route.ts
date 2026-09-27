import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { canEditHomeContent } from '@/lib/home-content'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 6 * 1024 * 1024

function extractToken(req: Request): string | null {
  const header =
    req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!header) return null
  const parts = header.trim().split(/\s+/)
  const token = parts.length > 1 ? parts[parts.length - 1] : parts[0]
  return token || null
}

/**
 * Subida de imagen comercial (MODO EDICIÓN, storefront).
 * Vive bajo `/api/edit-mode/*` a propósito: NO debe interceptar el endpoint
 * nativo `POST /api/product-images` de Payload, que usa el /admin.
 * Solo admin/staff verificados por JWT. Reutiliza la colección existente
 * `product-images` (mismo mecanismo del /admin). Límite 6MB, solo imagen.
 */
export async function POST(req: Request) {
  const token = extractToken(req)
  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let file: File | null = null
  let alt = ''
  try {
    const form = await req.formData()
    const candidate = form.get('file')
    alt = String(form.get('alt') ?? '')
    if (candidate instanceof File) file = candidate
  } catch {
    return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 })
  }
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json(
      { error: 'Solo se permiten imágenes' },
      { status: 400 },
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'La imagen supera los 6MB' },
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

    const buffer = Buffer.from(await file.arrayBuffer())
    const created = (await payload.create({
      collection: 'product-images',
      data: { alt: alt.trim().slice(0, 200) || file.name },
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
      user: user as never,
      overrideAccess: false,
    })) as { id: number; url?: string | null }

    return NextResponse.json(
      { id: created.id, url: created.url ?? null },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { error: 'No se pudo subir la imagen' },
      { status: 500 },
    )
  }
}
