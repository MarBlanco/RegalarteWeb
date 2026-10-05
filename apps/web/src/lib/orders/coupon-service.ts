/**
 * Búsqueda de cupones en la colección `coupons` (solo servidor).
 * Usa la Local API con `overrideAccess`: la colección es admin-only y el
 * storefront nunca la lee directamente.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import {
  couponFromDoc,
  normalizeCouponCode,
  type CouponDef,
} from './coupons'

/** Cupón activo con ese código (normalizado) o null. */
export async function findActiveCoupon(code: unknown): Promise<CouponDef | null> {
  const normalized = normalizeCouponCode(code)
  if (!normalized) return null
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'coupons',
    where: {
      and: [
        { code: { equals: normalized } },
        { active: { equals: true } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return couponFromDoc(docs[0])
}
