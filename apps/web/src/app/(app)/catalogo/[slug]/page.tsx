import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ImageGallery } from '@/components/catalog/image-gallery'
import { fetchProductBySlugRaw } from '@/lib/product-by-slug'
import type {
  Category,
  Product,
  ProductAttribute,
  ProductImage,
  ProductTag,
} from '@/payload-types'
import { formatPrice } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AddToCartButton } from '@/components/cart/add-to-cart-button'

interface PageProps {
  params?: Promise<{ slug: string }>
}

export const revalidate = 60

type ProductDetail = Product & {
  imagesDetail: Array<{
    id: number
    url: string | null
    alt: string
    filename: string | null
    caption: string | null
  }>
  categoryDetail:
    | (Pick<Category, 'id' | 'title' | 'slug'> & {
        parent?: number | Category | null
      })
    | null
  tagsDetail: Array<Pick<ProductTag, 'id' | 'name' | 'slug'>>
  attributesDetail: Array<
    Pick<ProductAttribute, 'id' | 'name' | 'slug' | 'values'>
  >
}

function buildDetail(product: Product): ProductDetail | null {
  const imagesDetail = (Array.isArray(product.images) ? product.images : [])
    .filter((image): image is ProductImage => typeof image !== 'number' && !!image)
    .map((image) => ({
      id: image.id,
      url: image.url ?? null,
      alt: image.alt ?? product.title,
      filename: image.filename ?? null,
      caption:
        typeof image.caption === 'string'
          ? image.caption
          : (image.caption as unknown as string | null) ?? null,
    }))

  const categoryDetail =
    !Array.isArray(product.category) &&
    typeof product.category !== 'number' &&
    product.category
      ? {
          id: product.category.id,
          title: product.category.title,
          slug: product.category.slug,
          parent: product.category.parent ?? null,
        }
      : null

  const tagsDetail = (Array.isArray(product.tags) ? product.tags : [])
    .filter((tag): tag is ProductTag => typeof tag !== 'number' && !!tag)
    .map((tag) => ({ id: tag.id, name: tag.name, slug: tag.slug }))

  const attributesDetail = (
    Array.isArray(product.attributes) ? product.attributes : []
  )
    .filter((attr): attr is ProductAttribute => typeof attr !== 'number' && !!attr)
    .map((attr) => ({
      id: attr.id,
      name: attr.name,
      slug: attr.slug,
      values: Array.isArray(attr.values)
        ? attr.values.map((item) => ({
            value: item.value,
            sortOrder: item.sortOrder ?? null,
            id: item.id ?? null,
          }))
        : [],
    }))

  return {
    ...product,
    imagesDetail,
    categoryDetail,
    tagsDetail,
    attributesDetail,
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = (await params) ?? { slug: '' }
  const result = await fetchProductBySlugRaw(slug)
  const product = result.docs.length > 0 ? buildDetail(result.docs[0]) : null
  if (!product) {
    return {
      title: 'Producto no encontrado · Regalarte',
      robots: { index: false, follow: false },
    }
  }

  const title = product.seoTitle ?? product.title
  const description =
    product.seoDescription ??
    `Descubrí ${product.title} en el catálogo de Regalarte.`

  const featuredImage =
    product.imagesDetail.find(
      (image) => typeof image.url === 'string' && image.url.length > 0,
    ) ?? null

  const ogImages = featuredImage?.url
    ? [
        {
          url: featuredImage.url,
          width: 1200,
          height: 630,
          alt: featuredImage.alt ?? product.title,
        },
      ]
    : [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: product.title,
        },
      ]

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      siteName: 'Regalarte',
      locale: 'es_AR',
      url: `/catalogo/${product.slug}`,
      title,
      description,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: featuredImage?.url ? [featuredImage.url] : ['/opengraph-image'],
    },
  }
}

function stockLabel(stock: number | null | undefined) {
  if (stock === null || stock === undefined) return 'Sin stock'
  if (stock <= 0) return 'Sin stock'
  if (stock <= 3) return `Casi sin stock (${stock} disponibles)`
  if (stock <= 10) return `Stock limitado (${stock} disponibles)`
  return `Disponible (${stock} disponibles)`
}

function stockTone(stock: number | null | undefined) {
  if (!stock || stock <= 0) return 'destructive'
  if (stock <= 3) return 'destructive'
  if (stock <= 10) return 'wholesale'
  return 'secondary'
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = (await params) ?? { slug: '' }
  const result = await fetchProductBySlugRaw(slug)
  if (result.docs.length === 0) {
    notFound()
  }
  const product = buildDetail(result.docs[0])
  if (!product) {
    notFound()
  }

  const wholesalePrice =
    typeof product.wholesalePrice === 'number' ? product.wholesalePrice : null
  const showWholesale =
    product.isWholesaleAvailable === true && wholesalePrice !== null

  const galleryImages = product.imagesDetail.map((image) => ({
    id: image.id,
    url: image.url,
    alt: image.alt ?? product.title,
    caption: image.caption,
  }))

  return (
    <article className="bg-background">
      <div className="container py-8 lg:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm">
          <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground">
                Inicio
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/catalogo" className="hover:text-foreground">
                Catálogo
              </Link>
            </li>
            {product.categoryDetail ? (
              <>
                <li aria-hidden>/</li>
                <li>
                  <Link
                    href={`/catalogo?category=${product.categoryDetail.slug}`}
                    className="hover:text-foreground"
                  >
                    {product.categoryDetail.title}
                  </Link>
                </li>
              </>
            ) : null}
            <li aria-hidden>/</li>
            <li className="font-medium text-foreground">{product.title}</li>
          </ol>
        </nav>

        <div className="flex flex-col gap-10 lg:flex-row">
          <div className="flex-1">
            <ImageGallery
              images={galleryImages}
              fallbackAlt={product.title}
            />
          </div>

          <div className="flex-1 space-y-6">
            <header className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {product.featured === true ? (
                  <Badge variant="default">Destacado</Badge>
                ) : null}
                {product.isSolistica === true ? (
                  <Badge variant="accent">Solística</Badge>
                ) : null}
                {showWholesale ? (
                  <Badge variant="wholesale">Mayorista disponible</Badge>
                ) : null}
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {product.title}
              </h1>
              {product.sku ? (
                <p className="text-xs text-muted-foreground">
                  SKU: {product.sku}
                </p>
              ) : null}
            </header>

            <Card>
              <CardContent className="space-y-2 p-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-semibold">
                    {formatPrice(product.price)}
                  </span>
                  {typeof product.compareAtPrice === 'number' &&
                  product.compareAtPrice > product.price ? (
                    <span className="text-base text-muted-foreground line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  ) : null}
                </div>

                {showWholesale ? (
                  <p className="text-sm text-muted-foreground">
                    Precio mayorista:{' '}
                    <span className="font-medium text-foreground">
                      {formatPrice(wholesalePrice!)}
                    </span>
                  </p>
                ) : null}

                <div className="pt-2">
                  <Badge variant={stockTone(product.stock) as never}>
                    {stockLabel(product.stock)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <AddToCartButton
                  product={{
                    id: product.id,
                    slug: product.slug,
                    title: product.title,
                    price: product.price,
                    compareAtPrice: product.compareAtPrice ?? null,
                    wholesalePrice: wholesalePrice,
                    isWholesaleAvailable:
                      product.isWholesaleAvailable === true,
                    featuredImage: galleryImages[0]
                      ? {
                          url: galleryImages[0].url ?? null,
                          alt:
                            galleryImages[0].alt ?? product.title,
                        }
                      : null,
                  }}
                  stock={product.stock ?? null}
                />
              </CardContent>
            </Card>

            {product.description ? (
              <Card>
                <CardContent className="p-6">
                  <ProductDescription content={product.description} />
                </CardContent>
              </Card>
            ) : null}

            {product.tagsDetail.length > 0 ? (
              <section aria-label="Tags">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Tags
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {product.tagsDetail.map((tag) => (
                    <li key={tag.id}>
                      <Link
                        href={`/catalogo?tag=${tag.slug}`}
                        className="inline-flex items-center rounded-md border bg-card px-2 py-1 text-xs hover:border-primary/50"
                      >
                        {tag.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {product.attributesDetail.length > 0 ? (
              <section aria-label="Atributos">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Atributos
                </h2>
                <ul className="space-y-2">
                  {product.attributesDetail.map((attribute) => (
                    <li
                      key={attribute.id}
                      className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2"
                    >
                      <span className="text-sm font-medium">
                        {attribute.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {attribute.values
                          .map((v) => v.value)
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

function ProductDescription({ content }: { content: unknown }) {
  interface LexicalNode {
    type?: string
    text?: string
    tag?: string
    listType?: 'bullet' | 'number' | undefined
    children?: LexicalNode[]
  }
  function renderNode(node: LexicalNode, key: number) {
    if (typeof node.text === 'string') {
      return <span key={key}>{node.text}</span>
    }
    const children = (node.children ?? [])
      .filter((child): child is LexicalNode => !!child)
      .map((child, i) => renderNode(child, i))
    switch (node.type) {
      case 'heading':
        return (
          <h3 key={key} className="text-lg font-semibold">
            {children}
          </h3>
        )
      case 'list':
        if (node.listType === 'number') {
          return (
            <ol key={key} className="ml-5 list-decimal">
              {children}
            </ol>
          )
        }
        return (
          <ul key={key} className="ml-5 list-disc">
            {children}
          </ul>
        )
      case 'listitem':
        return <li key={key}>{children}</li>
      case 'quote':
        return (
          <blockquote
            key={key}
            className="border-l-2 pl-3 italic text-muted-foreground"
          >
            {children}
          </blockquote>
        )
      case 'link':
        return (
          <a
            key={key}
            className="text-primary underline-offset-4 hover:underline"
            href={(node as unknown as { fields?: { url?: string } }).fields?.url ?? '#'}
          >
            {children}
          </a>
        )
      default:
        return (
          <p key={key} className="text-sm leading-relaxed text-foreground">
            {children}
          </p>
        )
    }
  }

  const root = (content as { root?: { children?: LexicalNode[] } } | null)
    ?.root
  const rendered = root?.children
    ? root.children.map((node, i) => renderNode(node, i))
    : null

  if (!rendered || rendered.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Producto sin descripción.</p>
    )
  }
  return <div className="space-y-3">{rendered}</div>
}

