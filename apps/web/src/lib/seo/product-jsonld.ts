/**
 * SEO: datos estructurados schema.org `Product` para la ficha de producto.
 * Módulo puro (sin acceso a Payload) para poder testearlo.
 */

export interface ProductJsonLdInput {
  /** Origen absoluto del sitio sin barra final; vacío si no está configurado. */
  siteUrl: string
  slug: string
  title: string
  description: string
  imageUrls: string[]
  price: number
  soldOut: boolean
}

const absolute = (siteUrl: string, url: string) =>
  /^https?:\/\//i.test(url) || !siteUrl ? url : `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}`

export function buildProductJsonLd(input: ProductJsonLdInput) {
  const url = absolute(input.siteUrl, `/catalogo/${input.slug}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.title,
    description: input.description,
    url,
    ...(input.imageUrls.length > 0
      ? { image: input.imageUrls.map((u) => absolute(input.siteUrl, u)) }
      : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'ARS',
      price: input.price,
      availability: input.soldOut
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    },
  }
}

/** Serializa para `<script type="application/ld+json">` sin permitir cerrar el tag desde un dato. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
