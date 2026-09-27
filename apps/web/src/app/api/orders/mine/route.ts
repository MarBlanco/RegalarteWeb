import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

function extractToken(req: Request): string | null {
  const header =
    req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!header) return null
  const parts = header.trim().split(/\s+/)
  const token = parts.length > 1 ? parts[parts.length - 1] : parts[0]
  return token || null
}

interface OrderRow {
  id: number
  orderNumber: string
  status: string
  createdAt: string
  total: number
  subtotal: number
  shipping: number
  address?: { city?: unknown; province?: unknown } | null
  items?: Array<{
    product?: unknown
    slug?: unknown
    name?: unknown
    quantity?: unknown
    unitPrice?: unknown
    lineTotal?: unknown
  }> | null
}

/**
 * GET /api/orders/mine — historial del usuario autenticado.
 * Filtra por `customer.email` del JWT: cada cliente ve SOLO sus pedidos
 * (staff/admin ven los propios, igual que un cliente).
 */
export async function GET(req: Request) {
  const token = extractToken(req)
  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    let email: string | null = null
    try {
      const auth = await payload.auth({
        headers: new Headers({ Authorization: `JWT ${token}` }),
      })
      const user = auth.user as { email?: unknown } | null
      // Cualquier rol autenticado: el filtro por email propio es el control.
      if (user && typeof user.email === 'string' && user.email) {
        email = user.email
      }
    } catch {
      email = null
    }
    if (!email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const found = await payload.find({
      collection: 'orders',
      where: { 'customer.email': { equals: email } },
      limit: 100,
      depth: 1,
      pagination: false,
      sort: '-createdAt',
    } as never)

    const docs = (found.docs as unknown as OrderRow[]).map((d) => {
      const address =
        d.address && typeof d.address === 'object' ? d.address : {}
      const items = (Array.isArray(d.items) ? d.items : []).map((item) => {
        const product = item.product
        const productId =
          typeof product === 'number'
            ? product
            : product !== null && typeof product === 'object' && 'id' in product
              ? (product as { id: unknown }).id
              : null
        let imageUrl: string | null = null
        if (
          product !== null &&
          typeof product === 'object' &&
          'images' in product
        ) {
          const images = (product as { images?: unknown }).images
          if (Array.isArray(images) && images.length > 0) {
            const first = images[0]
            if (first !== null && typeof first === 'object' && 'url' in first) {
              const url = (first as { url?: unknown }).url
              if (typeof url === 'string') imageUrl = url
            }
          }
        }
        return {
          product: typeof productId === 'number' ? productId : null,
          slug: typeof item.slug === 'string' ? item.slug : '',
          name: typeof item.name === 'string' ? item.name : 'Producto',
          quantity: typeof item.quantity === 'number' ? item.quantity : 1,
          unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : 0,
          lineTotal: typeof item.lineTotal === 'number' ? item.lineTotal : 0,
          imageUrl,
        }
      })
      return {
        id: d.id,
        orderNumber: d.orderNumber,
        status: d.status,
        createdAt: d.createdAt,
        total: d.total,
        subtotal: d.subtotal,
        shipping: d.shipping,
        city: typeof address.city === 'string' ? address.city : '',
        province:
          typeof address.province === 'string' ? address.province : '',
        items,
      }
    })

    return NextResponse.json(
      { docs },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { error: 'No se pudo cargar el historial' },
      { status: 500 },
    )
  }
}
