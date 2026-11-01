import { describe, it, expect } from 'vitest'
import { buildProductJsonLd, serializeJsonLd } from './product-jsonld'

const base = {
  siteUrl: 'https://tienda.example',
  slug: 'vela-uno',
  title: 'Vela Uno',
  description: 'Una vela.',
  imageUrls: ['/api/product-images/file/a.jpg', 'https://cdn.example/b.jpg'],
  price: 30000,
  soldOut: false,
}

describe('buildProductJsonLd', () => {
  it('arma un Product con oferta en ARS y URLs absolutas', () => {
    const ld = buildProductJsonLd(base)
    expect(ld['@type']).toBe('Product')
    expect(ld.url).toBe('https://tienda.example/catalogo/vela-uno')
    expect(ld.image).toEqual([
      'https://tienda.example/api/product-images/file/a.jpg',
      'https://cdn.example/b.jpg',
    ])
    expect(ld.offers).toMatchObject({ priceCurrency: 'ARS', price: 30000, availability: 'https://schema.org/InStock' })
  })

  it('agotado: OutOfStock; sin imágenes: omite image', () => {
    const ld = buildProductJsonLd({ ...base, soldOut: true, imageUrls: [] })
    expect(ld.offers.availability).toBe('https://schema.org/OutOfStock')
    expect('image' in ld).toBe(false)
  })

  it('sin siteUrl configurado deja las rutas relativas', () => {
    expect(buildProductJsonLd({ ...base, siteUrl: '' }).url).toBe('/catalogo/vela-uno')
  })
})

describe('serializeJsonLd', () => {
  it('escapa "<" para que un dato no pueda cerrar el <script>', () => {
    const out = serializeJsonLd({ name: '</script><script>alert(1)</script>' })
    expect(out).not.toContain('</script>')
    expect(JSON.parse(out).name).toBe('</script><script>alert(1)</script>')
  })
})
