import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  fetchCategories,
  fetchProducts,
  type ProductWithImage,
} from '@/lib/catalog'
import {
  getCategoryTipos,
  mockTipoProducts,
  type Tipo,
} from '@/components/catalog/catalog-tipos'
import { formatPrice } from '@/lib/format'
import type { ProductTag } from '@/payload-types'

export function SunEmblem({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
    </svg>
  )
}

export function DecorativeDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="h-[1px] w-8 sm:w-10 bg-[#C45A37]/50" />
      <span className="h-1.5 w-1.5 rotate-45 bg-[#C45A37]" />
      <span className="h-[1px] w-8 sm:w-10 bg-[#C45A37]/50" />
    </div>
  )
}

export interface HomeCategoryMeta {
  id: string
  title: string
  description: string
  categorySlug: 'velas' | 'aromas' | 'wax-melts' | 'quemadores' | 'packs' | 'regalarte'
}

const CATEGORIES_META: HomeCategoryMeta[] = [
  { id: 'velas', title: 'VELAS', description: 'Luz cálida para momentos únicos.', categorySlug: 'velas' },
  { id: 'aromas', title: 'AROMAS', description: 'Fragancias que acompañan tu día.', categorySlug: 'aromas' },
  { id: 'wax-melts', title: 'WAX-MELTS', description: 'Esencias pequeñas que duran más.', categorySlug: 'wax-melts' },
  { id: 'quemadores', title: 'QUEMADORES', description: 'Belleza y calidez en cada detalle.', categorySlug: 'quemadores' },
  { id: 'packs', title: 'PACKS', description: 'Regalos listos para emocionar.', categorySlug: 'packs' },
  { id: 'regalarte', title: 'REGALARTE', description: 'Detalles que dicen todo.', categorySlug: 'regalarte' },
]

function tagNames(tags: ProductWithImage['tags']): string[] {
  if (!Array.isArray(tags)) return []
  const names: string[] = []
  for (const t of tags) {
    if (typeof t === 'object' && t && 'name' in t) {
      names.push((t as ProductTag).name)
    }
  }
  return names
}

export interface HomeShowcaseProduct {
  id: number | string
  slug: string
  title: string
  subtitle: string
  price: number
  imageUrl: string | null
  imageAlt: string
}

function toShowcaseProduct(
  product: ProductWithImage,
  fallback: Pick<Tipo, 'image' | 'tagline'>,
): HomeShowcaseProduct {
  const featured = product.featuredImage
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    subtitle:
      tagNames(product.tags).slice(0, 3).join(' · ') ||
      product.seoDescription ||
      fallback.tagline,
    price: product.price,
    imageUrl: featured?.url ?? fallback.image,
    imageAlt: featured?.alt ?? product.title,
  }
}

/**
 * Productos del showcase EXACTAMENTE como el catálogo: reales primero
 * (misma fuente `fetchProducts` + mismo mapping) y relleno mock del tipo.
 */
async function getShowcaseProducts(
  categorySlug: string,
  tipo: Tipo,
  take = 4,
): Promise<HomeShowcaseProduct[]> {
  const real = await fetchProducts(
    { categorySlug: tipo.real ? tipo.slug : categorySlug, sort: '-featured,sortOrder,-createdAt' },
    1,
    take,
  ).catch(() => null)
  const docs = real?.docs ?? []
  if (docs.length >= take) {
    return docs.slice(0, take).map((d) => toShowcaseProduct(d, tipo))
  }
  const mock = mockTipoProducts(categorySlug, tipo.slug, tipo.name, take)
  const realSlugs = new Set(docs.map((d) => d.slug))
  const fill = mock.products
    .filter((m) => !realSlugs.has(m.slug))
    .slice(0, take - docs.length)
  return [...docs, ...fill].map((d) => toShowcaseProduct(d, tipo))
}

export function CategoryProductCard({ product }: { product: HomeShowcaseProduct }) {
  return (
    <div className="group flex flex-col">
      <Link href={`/catalogo/${product.slug}`} className="block">
        <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#EDE6DC]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt}
              fill
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 35vw, 45vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-[#9A8A7A]">
              Sin imagen
            </span>
          )}
        </span>
      </Link>
      <div className="mt-2 flex flex-col text-left">
        <Link href={`/catalogo/${product.slug}`}>
          <h3 className="font-serif text-[14px] sm:text-[15px] font-normal text-[#38271D] group-hover:text-[#C45A37] transition-colors leading-snug">
            {product.title}
          </h3>
        </Link>
        {product.subtitle ? (
          <p className="text-[11px] sm:text-xs text-[#8A786A] mt-0.5 min-h-[1rem]">
            {product.subtitle}
          </p>
        ) : (
          <div className="min-h-[1rem]" />
        )}
        <p className="text-sm font-bold text-[#C45A37] mt-0.5">
          {formatPrice(product.price)}
        </p>
      </div>
    </div>
  )
}

export function HomeCategorySection({
  meta,
  products,
}: {
  meta: HomeCategoryMeta
  products: HomeShowcaseProduct[]
}) {
  return (
    <section className="py-6 sm:py-8 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Left Column - Category Summary */}
        <div className="w-full lg:w-[180px] xl:w-[200px] flex-shrink-0 flex flex-col items-start text-left lg:pt-1">
          <h2 className="font-serif text-xl sm:text-2xl font-normal uppercase tracking-wider text-[#38271D]">
            {meta.title}
          </h2>
          <DecorativeDivider className="my-2.5" />
          <p className="text-[13px] sm:text-sm text-[#7A6A5D] leading-relaxed">
            {meta.description}
          </p>
          <Link
            href={`/catalogo?category=${meta.categorySlug}`}
            className="inline-flex items-center text-[11px] sm:text-xs font-medium tracking-wider text-[#C45A37] hover:text-[#9E4024] uppercase mt-3 gap-1 transition-colors"
          >
            VER COLECCIÓN <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {/* Right Column - 4 Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 flex-1 min-w-0">
          {products.map((product) => (
            <CategoryProductCard key={`${meta.id}-${product.id}`} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function EditorialSeparator({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="w-full bg-[#EFE7DD] py-7 sm:py-9 px-4 my-4 sm:my-6 relative overflow-hidden text-center">
      {/* Subtle Leaf Pattern Background Effect */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#38271D_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 flex flex-col items-center">
        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#38271D] leading-snug tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[13px] sm:text-sm text-[#7A6A5D] mt-1.5 font-normal">
            {subtitle}
          </p>
        )}
        <DecorativeDivider className="mt-3 justify-center" />
      </div>
    </div>
  )
}

export async function HomeBody() {
  const categories = await fetchCategories().catch(() => [])
  const sections = await Promise.all(
    CATEGORIES_META.map(async (meta) => {
      const tipos = getCategoryTipos(meta.categorySlug, categories)
      const tipo = tipos[0]
      const products = tipo
        ? await getShowcaseProducts(meta.categorySlug, tipo, 4)
        : []
      return { meta, products }
    }),
  )

  return (
    <div className="w-full bg-[#F9F5F0] text-[#38271D]">
      {/* Intro Section below Hero */}
      <section className="py-8 sm:py-10 text-center px-4 max-w-4xl mx-auto">
        <div className="flex justify-center mb-2">
          <SunEmblem className="w-6 h-6 text-[#C45A37]" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#38271D] leading-snug tracking-tight">
          Aromas que transforman lo cotidiano.
        </h2>
        <DecorativeDivider className="my-3 justify-center mx-auto" />
        <p className="text-[13px] sm:text-sm text-[#7A6A5D] font-normal max-w-2xl mx-auto">
          Pequeños rituales para disfrutar, regalar y hacer de tu hogar un
          lugar especial.
        </p>
      </section>

      {/* Category 1: VELAS */}
      <HomeCategorySection meta={sections[0].meta} products={sections[0].products} />

      {/* Editorial Separator 1 */}
      <EditorialSeparator title="Una luz encendida cambia el momento." />

      {/* Category 2: AROMAS */}
      <HomeCategorySection meta={sections[1].meta} products={sections[1].products} />

      {/* Editorial Separator 2 */}
      <EditorialSeparator
        title="El perfume también cuenta historias."
        subtitle="Encontrá el aroma que querés que habite tus espacios."
      />

      {/* Category 3: WAX-MELTS */}
      <HomeCategorySection meta={sections[2].meta} products={sections[2].products} />

      {/* Editorial Separator 3 */}
      <EditorialSeparator title="El ritual empieza cuando encendés." />

      {/* Category 4: QUEMADORES */}
      <HomeCategorySection meta={sections[3].meta} products={sections[3].products} />

      {/* Editorial Separator 4 */}
      <EditorialSeparator
        title="Hay momentos que merecen algo más."
        subtitle="Combinaciones pensadas para regalar, compartir o disfrutar."
      />

      {/* Category 5: PACKS */}
      <HomeCategorySection meta={sections[4].meta} products={sections[4].products} />

      {/* Editorial Separator 5 */}
      <EditorialSeparator title="Y cuando el aroma se convierte en regalo..." />

      {/* Category 6: REGALARTE */}
      <HomeCategorySection meta={sections[5].meta} products={sections[5].products} />
    </div>
  )
}
