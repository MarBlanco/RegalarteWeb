import { Suspense } from 'react'
import { Metadata } from 'next'
import {
  fetchCategories,
  fetchProductTags,
  fetchProducts,
  type CatalogFilters,
} from '@/lib/catalog'
import { CatalogFilters as FiltersPanel } from '@/components/catalog/catalog-filters'
import { CatalogPagination } from '@/components/catalog/catalog-pagination'
import { ProductGrid } from '@/components/catalog/product-grid'
import { CategoryHero } from '@/components/catalog/category-hero'
import { SubcategoryBar } from '@/components/catalog/subcategory-bar'
import { EditorialBlock } from '@/components/catalog/editorial-block'
import { BenefitsBlock } from '@/components/catalog/benefits-block'
import type { Media } from '@/payload-types'

export const metadata: Metadata = {
  title: 'Catálogo',
  description:
    'Descubrí todos los regalos y propuestas de Regalarte. Filtrá por categoría, etiqueta y precio.',
  openGraph: {
    title: 'Catálogo · Regalarte',
    description:
      'Descubrí todos los regalos y propuestas de Regalarte. Filtrá por categoría, etiqueta y precio.',
    url: '/catalogo',
    siteName: 'Regalarte',
    locale: 'es_AR',
    type: 'website',
    images: [
      {
        url: '/catalogo/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Catálogo · Regalarte',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catálogo · Regalarte',
    description:
      'Descubrí todos los regalos y propuestas de Regalarte. Filtrá por categoría, etiqueta y precio.',
    images: ['/catalogo/opengraph-image'],
  },
}

export const revalidate = 30

interface PageProps {
  searchParams?: Promise<{
    page?: string
    q?: string
    category?: string
    tag?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
  }>
}

function parsePage(value: string | undefined): number {
  const n = Number(value ?? 1)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.floor(n)
}

function parsePrice(value: string | undefined): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

/**
 * Descripciones editoriales de fallback por categoría.
 * Si el CMS define `description`, esa toma precedencia.
 */
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  velas: 'Luz cálida para transformar tus espacios y acompañar cada momento.',
  aromas: 'Fragancias que acompañan tu día y renuevan tus espacios.',
  'wax-melts': 'Esencias pequeñas que duran mucho más.',
  quemadores: 'Belleza y calidez en cada detalle.',
  packs: 'Regalos listos para emocionar.',
  regalarte: 'Detalles que dicen todo.',
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const page = parsePage(params.page)
  const filters: CatalogFilters = {
    q: params.q,
    categorySlug: params.category,
    tagSlug: params.tag,
    minPrice: parsePrice(params.minPrice),
    maxPrice: parsePrice(params.maxPrice),
    sort: (params.sort as CatalogFilters['sort']) ?? '-featured,sortOrder,-createdAt',
  }

  const [products, categories, tags] = await Promise.all([
    fetchProducts(filters, page),
    fetchCategories(),
    fetchProductTags(),
  ])

  const category = params.category
    ? categories.find((c) => c.slug === params.category)
    : undefined
  const categoryImage =
    category?.image && typeof category.image === 'object'
      ? (category.image as Media)
      : null
  const heroTitle = category?.title ?? 'Catálogo'
  const heroDescription =
    category?.description ??
    (params.category ? CATEGORY_DESCRIPTIONS[params.category] : undefined) ??
    'Explorá todas nuestras propuestas para encontrar el regalo ideal.'

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* HERO DE CATEGORÍA */}
      <CategoryHero
        title={heroTitle}
        description={heroDescription}
        imageUrl={categoryImage?.url ?? null}
      />

      {/* BARRA DE SUBCATEGORÍAS */}
      <Suspense fallback={null}>
        <SubcategoryBar tags={tags} totalDocs={products.totalDocs} currentCategory={params.category} />
      </Suspense>

      {/* CATÁLOGO: FILTROS + GRID */}
      <div className="flex-1 px-7 py-4">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 lg:flex-row">
          <aside className="lg:w-[20%] lg:flex-shrink-0">
            <Suspense fallback={null}>
              <FiltersPanel categories={categories} tags={tags} />
            </Suspense>
          </aside>

          <section className="min-w-0 flex-1">
            {products.docs.length === 0 ? (
              <div className="rounded-md border border-[#E5DDD1] bg-card p-12 text-center">
                <h2 className="text-lg font-semibold">
                  No encontramos productos
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Probá ajustar los filtros o limpiarlos para ver todo el
                  catálogo.
                </p>
              </div>
            ) : (
              <>
                <ProductGrid products={products.docs} />
                <CatalogPagination
                  page={products.page}
                  totalPages={products.totalPages}
                />
              </>
            )}
          </section>
        </div>
      </div>

      {/* BLOQUE EDITORIAL */}
      <EditorialBlock />

      {/* BLOQUE DE BENEFICIOS */}
      <BenefitsBlock />
    </div>
  )
}