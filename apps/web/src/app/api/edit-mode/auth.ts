import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { canEditHomeContent } from '@/lib/home-content'

export function extractToken(req: Request): string | null {
  const header =
    req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!header) return null
  const parts = header.trim().split(/\s+/)
  const token = parts.length > 1 ? parts[parts.length - 1] : parts[0]
  return token || null
}

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>

/**
 * Verifica JWT y rol comercial (admin/staff). Devuelve el payload listo y
 * el usuario, o la respuesta de error correspondiente (401/403).
 */
export async function verifyStaff(
  req: Request,
): Promise<
  { payload: PayloadInstance; user: unknown } | { error: NextResponse }
> {
  const token = extractToken(req)
  if (!token) {
    return {
      error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }),
    }
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
      return {
        error: NextResponse.json({ error: 'Sin permiso' }, { status: 403 }),
      }
    }
    return { payload, user }
  } catch {
    return {
      error: NextResponse.json(
        { error: 'No se pudo verificar la sesión' },
        { status: 500 },
      ),
    }
  }
}

/** Slug único dentro de una colección (`base`, `base-2`, …). */
export async function uniqueSlug(
  payload: PayloadInstance,
  collection: 'categories' | 'products' | 'product-tags',
  base: string,
): Promise<string> {
  let slug = base || 'item'
  for (let i = 2; i <= 20; i++) {
    const found = await payload.find({
      collection,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      pagination: false,
    } as never)
    if (found.docs.length === 0) return slug
    slug = `${base}-${i}`
  }
  return `${base}-${Date.now().toString(36)}`
}
