/**
 * Disponibilidad real de los productos del carrito.
 *
 * El carrito guarda un snapshot del producto; si después el producto pasa a
 * Agotado, se queda sin stock, se despublica o se elimina, el snapshot sigue
 * ahí. Estas funciones consultan el estado actual (REST público de Payload) y
 * clasifican cada ítem con la MISMA regla que usa el servidor al crear la
 * orden (`lib/orders/lines.ts`): inactivo, agotado manual o sin stock.
 */

import { isAgotado } from '@/lib/catalog'

export type UnavailableReason = 'soldout' | 'nostock' | 'hidden' | 'deleted'

export interface AvailabilityDoc {
  id: number
  active?: boolean | null
  soldOut?: boolean | null
  stock?: number | null
}

/** Motivo por el que un producto no se puede comprar, o `null` si se puede. */
export function unavailableReason(
  doc: AvailabilityDoc | undefined,
): UnavailableReason | null {
  if (!doc) return 'deleted'
  if (doc.active === false) return 'hidden'
  if (doc.soldOut === true) return 'soldout'
  return isAgotado({ stock: doc.stock }) ? 'nostock' : null
}

/** Mensaje claro para el usuario según el motivo. */
export function unavailableMessage(reason: UnavailableReason): string {
  switch (reason) {
    case 'soldout':
      return 'Agotado: este producto ya no está disponible para comprar.'
    case 'nostock':
      return 'Sin stock: este producto ya no está disponible para comprar.'
    default:
      return 'Este producto ya no está disponible.'
  }
}

/** Ids numéricos de producto (los ids no numéricos no existen en el CMS). */
export function numericProductIds(ids: ReadonlyArray<string>): number[] {
  const out = new Set<number>()
  for (const id of ids) {
    const n = Number(id)
    if (Number.isInteger(n) && n > 0) out.add(n)
  }
  return Array.from(out)
}

/**
 * Consulta el estado actual de los productos y devuelve los NO comprables
 * (id → motivo). Lanza si no se pudo consultar: el llamador decide qué hacer
 * (el servidor igual rechaza la orden).
 */
export async function fetchUnavailable(
  ids: ReadonlyArray<number>,
): Promise<Map<number, UnavailableReason>> {
  const unique = Array.from(new Set(ids))
  if (unique.length === 0) return new Map()
  const res = await fetch(
    `/api/products?where[id][in]=${unique.join(',')}&limit=${unique.length}&depth=0`,
    { cache: 'no-store' },
  )
  if (!res.ok) throw new Error('availability')
  const data = (await res.json()) as { docs?: AvailabilityDoc[] }
  const byId = new Map((data.docs ?? []).map((d) => [d.id, d]))
  const out = new Map<number, UnavailableReason>()
  for (const id of unique) {
    const reason = unavailableReason(byId.get(id))
    if (reason) out.set(id, reason)
  }
  return out
}
