import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ImageGallery } from '@/components/catalog/image-gallery'
import { ProductDetailActions } from '@/components/catalog/product-detail-actions'
import { ProductNotesCard } from '@/components/catalog/product-notes-card'
import { ProductTabs } from '@/components/catalog/product-tabs'
import { RelatedSlider } from '@/components/catalog/related-slider'
import { BenefitsBlock } from '@/components/catalog/benefits-block'
import { fetchProductBySlugRaw } from '@/lib/product-by-slug'
import { fetchProducts } from '@/lib/catalog'
import {
  MOCK_BADGES,
  MOCK_CATEGORY,
  MOCK_PRODUCTS,
  mockDetailImages,
  type MockBadge,
} from '@/components/catalog/catalog-mock'
import { mockBadgeForSlug, resolveMockDetail } from '@/components/catalog/catalog-tipos'
import type {
  Category,
  Product,
  ProductAttribute,
  ProductImage,
  ProductTag,
} from '@/payload-types'
import { formatPrice } from '@/lib/format'
import { ViewItemTracker } from '@/components/analytics/view-item-tracker'

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

/**
 * Detalle para slugs MOCK: misma estructura que el real, construida desde
 * catalog-mock.ts sin tocar el CMS. La categoría representativa es Velas y
 * las notas/tabs usan los fallbacks mock existentes.
 */
function buildMockDetail(slug: string): (ProductDetail & { mockBadge: string | null }) | null {
  const resolved = resolveMockDetail(slug)
  if (!resolved) return null
  const mock = resolved.product
  const tagNames = (mock.seoDescription ?? '')
    .split('·')
    .map((t) => t.trim())
    .filter(Boolean)
  return {
    ...mock,
    mockBadge: resolved.badge,
    imagesDetail: mockDetailImages(mock.title),
    categoryDetail: { ...MOCK_CATEGORY, parent: null },
    tagsDetail: tagNames.map((name, i) => ({
      id: 92000 + i,
      name,
      slug: name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-'),
    })),
    attributesDetail: [],
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = (await params) ?? { slug: '' }
  const mockDetail = buildMockDetail(slug)
  if (mockDetail) {
    const title = `${mockDetail.title} · Regalarte`
    const description =
      mockDetail.seoDescription ??
      `Descubrí ${mockDetail.title} en el catálogo de Regalarte.`
    return { title, description }
  }
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

const PDP_BENEFITS = [
  { title: 'Listo para regalar', description: 'Packaging premium con papel de seda.' },
  { title: 'Envíos a todo el país', description: 'Rápidos, seguros y con seguimiento.' },
  { title: 'Compra 100% segura', description: 'Tus datos y pagos están protegidos.' },
  { title: 'Atención personalizada', description: 'Estamos para ayudarte siempre.' },
]

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = (await params) ?? { slug: '' }
  // Los slugs mock se resuelven en local sin consultar el CMS.
  let product: ProductDetail | null = buildMockDetail(slug)
  if (!product) {
    const result = await fetchProductBySlugRaw(slug)
    if (result.docs.length === 0) {
      notFound()
    }
    product = buildDetail(result.docs[0])
    if (!product) {
      notFound()
    }
  }

  const wholesalePrice =
    typeof product.wholesalePrice === 'number' ? product.wholesalePrice : null

  const galleryImages = product.imagesDetail.map((image) => ({
    id: image.id,
    url: image.url,
    alt: image.alt ?? product.title,
    caption: image.caption,
  }))

  const badge =
    product.featured === true
      ? 'MÁS VENDIDA'
      : product.isSolistica === true
        ? 'SOLÍSTICA'
        : (product.categoryDetail?.title ?? 'Producto').toUpperCase()

  const fee = product.price / 3
  const outOfStock =
    typeof product.stock === 'number' && Number.isFinite(product.stock) && product.stock <= 0

  const tagChips = product.tagsDetail.slice(0, 2)
  const characteristics = product.attributesDetail.map((a) => ({
    name: a.name,
    values: a.values
      .map((v) => v.value)
      .filter(Boolean)
      .join(', '),
  }))
  const noteAttributes = product.attributesDetail.map((a) => ({
    name: a.name,
    values: a.values.map((v) => v.value).filter(Boolean),
  }))

  // Relacionados: reales de la misma categoría con imagen primero,
  // mock para completar hasta 8 (sin placeholders "Sin imagen").
  const relatedCategorySlug = product.categoryDetail?.slug
  const relatedResult = relatedCategorySlug
    ? await fetchProducts({ categorySlug: relatedCategorySlug }, 1, 9).catch(() => null)
    : null
  const relatedReal = (relatedResult?.docs ?? [])
    .filter((d) => d.slug !== product.slug && d.featuredImage?.url)
    .slice(0, 8)
  const relatedRealSlugs = new Set(relatedReal.map((d) => d.slug))
  const related =
    relatedReal.length >= 8
      ? relatedReal
      : [
          ...relatedReal,
          ...MOCK_PRODUCTS.filter((m) => !relatedRealSlugs.has(m.slug)).slice(
            0,
            8 - relatedReal.length,
          ),
        ]
  const relatedBadges: Record<number | string, MockBadge> = {}
  for (const rel of related) {
    const badge =
      mockBadgeForSlug(rel.slug, MOCK_BADGES, rel.id) ??
      (rel.featured ? ('FAVORITO' as const) : null)
    if (badge) relatedBadges[rel.id] = badge
  }

  return (
    <article className="bg-[#FDFBF7]">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
        <nav aria-label="Breadcrumb" className="text-xs text-[#9A8A7A]">
          <Link href="/" className="transition-colors hover:text-[#C45A37]">
            Inicio
          </Link>
          {product.categoryDetail ? (
            <>
              <span aria-hidden="true" className="mx-1.5">
                &gt;
              </span>
              <Link
                href={`/catalogo?category=${product.categoryDetail.slug}`}
                className="transition-colors hover:text-[#C45A37]"
              >
                {product.categoryDetail.title}
              </Link>
            </>
          ) : null}
          <span aria-hidden="true" className="mx-1.5">
            &gt;
          </span>
          <span className="text-[#38271D]">{product.title}</span>
        </nav>

        <ViewItemTracker
          id={product.id}
          title={product.title}
          price={product.price}
          compareAtPrice={product.compareAtPrice ?? null}
          categoryTitle={product.categoryDetail?.title ?? null}
        />

        {/* Principal: galería | info | notas */}
        <div className="mt-5 grid gap-8 lg:grid-cols-12 lg:gap-6 xl:gap-8">
          <div className="lg:col-span-5">
            <ImageGallery images={galleryImages} fallbackAlt={product.title} />
          </div>

          <div className="lg:col-span-4">
            <span className="inline-block rounded-full bg-[#F3EADB] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A6A2F]">
              {badge}
            </span>
            <h1 className="mt-3 font-serif text-3xl font-normal tracking-tight text-[#38271D] sm:text-4xl">
              {product.title}
            </h1>
            {product.seoDescription ? (
              <p className="mt-3 text-sm leading-relaxed text-[#5C4A3D]">
                {product.seoDescription}
              </p>
            ) : null}

            {tagChips.length > 0 ? (
              <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {tagChips.map((tag, i) => (
                  <li
                    key={tag.id}
                    className="flex items-center gap-1.5 text-xs text-[#7A6A5D]"
                  >
                    {i === 0 ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-[#B85C33]" aria-hidden="true">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-[#B85C33]" aria-hidden="true">
                        <path d="M11 20A7 7 0 0 1 4 13c0-4 3-8 8-10 5-2 8-1 8-1s1 3-1 8c-2 5-6 8-8 10z" />
                        <path d="M4 21c4-4 7-7 12-12" />
                      </svg>
                    )}
                    {tag.name}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-5 border-t border-[#EBDFD1] pt-4">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <span className="text-[28px] font-bold text-[#38271D]">
                  {formatPrice(product.price)}
                </span>
                {typeof product.compareAtPrice === 'number' &&
                product.compareAtPrice > product.price ? (
                  <span className="text-sm text-[#9A8A7A] line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-[#7A6A5D]">
                3 cuotas sin interés de {formatPrice(fee)}
              </p>
              <Link
                href="#detalles"
                className="mt-0.5 inline-block text-xs text-[#B85C33] underline-offset-2 hover:underline"
              >
                Ver medios de pago
              </Link>

              <div className="mt-4">
                <ProductDetailActions
                  product={{
                    id: product.id,
                    slug: product.slug,
                    title: product.title,
                    price: product.price,
                    compareAtPrice: product.compareAtPrice ?? null,
                    wholesalePrice,
                    isWholesaleAvailable: product.isWholesaleAvailable === true,
                    featuredImage: galleryImages[0]
                      ? {
                          url: galleryImages[0].url ?? null,
                          alt: galleryImages[0].alt ?? product.title,
                        }
                      : null,
                  }}
                  stock={product.stock ?? null}
                />
              </div>
              {outOfStock ? (
                <p className="mt-2 text-xs font-medium text-red-700">
                  Sin stock por el momento.
                </p>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-3">
            <ProductNotesCard attributes={noteAttributes} />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-10 max-w-3xl rounded-lg border border-[#EBDFD1] bg-[#FFFDF9] p-5 sm:p-6">
          <ProductTabs
            description={
              product.description ? (
                <ProductDescription content={product.description} />
              ) : (
                <p className="text-sm text-[#7A6A5D]">Producto sin descripción.</p>
              )
            }
            characteristics={characteristics}
          />
        </div>

        {/* También te puede gustar */}
        <div className="mt-10">
          <RelatedSlider products={related} badges={relatedBadges} />
        </div>
      </div>

      <div className="mt-10">
        <BenefitsBlock items={PDP_BENEFITS} />
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
