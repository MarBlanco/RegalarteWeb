import { NextResponse } from 'next/server'
import { verifyStaff } from '../auth'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 6 * 1024 * 1024

/**
 * Subida a la biblioteca `media` (MODO EDICIÓN, p. ej. imagen de tipo).
 * Solo admin/staff. Límite 6MB, solo imagen.
 */
export async function POST(req: Request) {
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

  const verified = await verifyStaff(req)
  if ('error' in verified) return verified.error
  const { payload, user } = verified

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const created = (await payload.create({
      collection: 'media',
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
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { error: 'No se pudo subir la imagen' },
      { status: 500 },
    )
  }
}
