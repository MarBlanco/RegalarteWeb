'use server'

import { updateTag } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { canEditHomeContent } from '@/lib/home-content'

/**
 * Refresco inmediato del storefront tras una edición comercial.
 *
 * `updateTag` (solo disponible en Server Actions) expira el dato en el acto
 * (read-your-own-writes), a diferencia de `revalidateTag` desde un handler de
 * ruta, que deja servir una vez más la versión anterior. Las rutas de edición
 * ya purgan las páginas con `revalidateCatalog`; esta acción asegura que el
 * `router.refresh()` posterior del editor lea datos nuevos.
 *
 * Las ediciones llegan con JWT en un header (no cookies), así que el token se
 * recibe como argumento y se verifica acá: solo admin/staff pueden disparar
 * la purga.
 */
export async function refreshStorefrontAction(
  token: string,
): Promise<{ ok: boolean }> {
  if (typeof token !== 'string' || token.length === 0) return { ok: false }
  try {
    const payload = await getPayload({ config })
    const auth = await payload.auth({
      headers: new Headers({ Authorization: `JWT ${token}` }),
    })
    if (!canEditHomeContent(auth.user as { role?: string } | null)) {
      return { ok: false }
    }
  } catch {
    return { ok: false }
  }
  updateTag('products')
  updateTag('categories')
  updateTag('product-tags')
  return { ok: true }
}
