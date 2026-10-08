import { revalidatePath, revalidateTag } from 'next/cache'

export type CatalogTag = 'products' | 'categories' | 'product-tags'

/**
 * Invalidación del storefront tras una edición comercial (MODO EDICIÓN).
 *
 * Las páginas del catálogo/PDP/Home son ISR (`revalidate = 30/60`). En un
 * handler de ruta, `revalidateTag` expira los datos pero la página ya
 * renderizada se sirve UNA vez más desactualizada mientras se regenera: el
 * `router.refresh()` posterior mostraba el estado anterior (un paso atrás) y el
 * cambio recién aparecía en la siguiente carga (F5). Verificado en build de
 * producción: purgar solo `/`, `/catalogo` y `/catalogo/[slug]` NO alcanza (los
 * datos cacheados del layout y de otras rutas siguen sirviéndose); purgar el
 * layout raíz sí hace que el refresco inmediato traiga el dato nuevo. Se hacen
 * ambas: el tag para los datos y el path para todas las páginas.
 */
export function revalidateCatalog(...tags: CatalogTag[]): void {
  for (const tag of tags) revalidateTag(tag, { expire: 0 })
  revalidateStorefrontPages()
}

/** Purga todas las páginas de la tienda (layout raíz). */
export function revalidateStorefrontPages(): void {
  revalidatePath('/', 'layout')
}
