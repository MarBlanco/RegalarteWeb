import { Suspense } from 'react'
import { Metadata } from 'next'
import {
  fetchCategories,
  fetchFilterFacets,
  fetchProductTags,
  fetchProducts,
  type CatalogFilters,
  type FilterFacets,
  type ProductWithImage,
} from '@/lib/catalog'
import { CatalogAsideFilters } from '@/components/catalog/catalog-aside'
import { CatalogPagination } from '@/components/catalog/catalog-pagination'
import { ProductGrid } from '@/components/catalog/product-grid'
import { CategoryHero } from '@/components/catalog/category-hero'
import { SubcategoryBar } from '@/components/catalog/subcategory-bar'
import { BenefitsBlock } from '@/components/catalog/benefits-block'
import { TipoSelector } from '@/components/catalog/tipo-selector'
import { TipoSortSelect } from '@/components/catalog/tipo-sort-select'
import { ProductAddButton } from '@/components/edit-mode/product-edit-modal'
import { HiddenProductsStrip } from '@/components/edit-mode/hidden-products-strip'
import {
  getCategoryTipos,
  mockCategoryName,
  mockTipoName,
} from '@/components/catalog/catalog-tipos'
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
    aroma?: string
    ritual?: string
    tipo?: string
    completa?: string
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
  velas: 'Luz cálida para transformar tus espacios\ny acompañar cada momento.',
  aromas: 'Fragancias que acompañan tu día y renuevan tus espacios.',
  'wax-melts': 'Esencias pequeñas que duran mucho más.',
  quemadores: 'Belleza y calidez en cada detalle.',
  packs: 'Regalos listos para emocionar.',
  regalarte: 'Detalles que dicen todo.',
}

const CATEGORY_TITLES: Record<string, string> = {
  velas: 'Velas',
  aromas: 'Aromas',
  'wax-melts': 'Wax-Melts',
  quemadores: 'Quemadores',
  packs: 'Packs',
  regalarte: 'Regalarte',
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const page = parsePage(params.page)
  const sort = (params.sort as CatalogFilters['sort']) ?? '-featured,sortOrder,-createdAt'

  const [categories, tags] = await Promise.all([
    fetchCategories(),
    fetchProductTags(),
  ])

  const categorySlug = params.category
  const category = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined

  // Facetas reales del sidebar (opciones + contadores + rango de precios).
  const facets: FilterFacets = await fetchFilterFacets(categorySlug)

  // Tipos administrables: hijas del CMS o mock (nunca hardcodeados).
  const tipos = categorySlug ? getCategoryTipos(categorySlug, categories) : []
  const activeTipo =
    tipos.find((t) => t.slug === params.tipo) ?? tipos[0] ?? null

  const hasActiveFilters = Boolean(
    params.q?.trim() ||
      params.tag ||
      params.aroma ||
      params.ritual ||
      params.minPrice ||
      params.maxPrice,
  )
  const isFullListing = params.completa === '1' || hasActiveFilters

  // ---- Modo A: showcase por tipo (100% real, sin límite ni relleno) ----
  let showcaseDocs: ProductWithImage[] = []
  let showcaseTotal = 0
  if (categorySlug && activeTipo && !isFullListing) {
    // Reales del tipo si es real del CMS, si no de la categoría.
    const real = await fetchProducts(
      { categorySlug: activeTipo.real ? activeTipo.slug : categorySlug, sort },
      1,
      100,
    )
    showcaseDocs = real.docs
    showcaseTotal = real.totalDocs
  }

  // ---- Modo B: listado completo / filtrado (100% real, sin límite ni relleno) ----
  let listing: Awaited<ReturnType<typeof fetchProducts>> | null = null
  let listingDocs: ProductWithImage[] = []
  if (!categorySlug || isFullListing) {
    const tipoSlugForListing =
      isFullListing && params.tipo && activeTipo?.real ? params.tipo : undefined
    const filters: CatalogFilters = {
      q: params.q,
      categorySlug: tipoSlugForListing ?? categorySlug,
      tagSlug: params.tag,
      aromaSlug: params.aroma,
      ritualSlug: params.ritual,
      minPrice: parsePrice(params.minPrice),
      maxPrice: parsePrice(params.maxPrice),
      sort,
    }
    listing = await fetchProducts(filters, page, 100)
    listingDocs = listing.docs
  }

  const heroTitle =
    category?.title ??
    (categorySlug
      ? (CATEGORY_TITLES[categorySlug] ?? mockCategoryName(categorySlug) ?? mockTipoName(categorySlug) ?? 'Catálogo')
      : 'Catálogo')
  const categoryImage =
    category?.image && typeof category.image === 'object'
      ? (category.image as Media)
      : null
  const heroDescription =
    category?.description ??
    (categorySlug ? CATEGORY_DESCRIPTIONS[categorySlug] : undefined) ??
    'Explorá todas nuestras propuestas para encontrar el regalo ideal.'

  const showShowcase = categorySlug !== undefined && activeTipo !== null && !isFullListing

  // Alta de producto en MODO EDICIÓN: al tipo real si existe, si no a la categoría.
  const addProductCategoryId =
    showShowcase && activeTipo?.real && activeTipo.categoryId !== undefined
      ? activeTipo.categoryId
      : category?.id

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF7F1]">
      {/* HERO DE CATEGORÍA */}
      <CategoryHero
        title={heroTitle}
        description={heroDescription}
        imageUrl={categoryImage?.url ?? null}
      />

      {showShowcase && categorySlug && activeTipo ? (
        <>
          {/* SHOWCASE POR TIPO */}
          <div className="mx-auto w-full max-w-[1400px] px-4 pt-5 sm:px-6">
            <Suspense fallback={null}>
              <TipoSelector
                categorySlug={categorySlug}
                tipos={tipos}
                activeSlug={activeTipo.slug}
                editCategoryId={category?.id}
                categoryTitle={category?.title}
              />
            </Suspense>
          </div>

          <div className="flex-1 px-4 py-6 sm:px-6">
            <div className="mx-auto flex max-w-[1400px] flex-col gap-5 lg:flex-row lg:gap-6">
              <CatalogAsideFilters facets={facets} />

              <section className="min-w-0 flex-1" aria-label={activeTipo.name}>
                <div className="min-w-0">
                  <h2 className="font-serif text-2xl font-normal tracking-tight text-[#38271D] sm:text-[28px]">
                    {activeTipo.name}
                  </h2>
                  {activeTipo.description ? (
                    <p className="mt-1 max-w-xl text-[13px] text-[#7A6A5D]">
                      {activeTipo.description}
                    </p>
                  ) : null}
                </div>
                <div className="mt-3 flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <span className="shrink-0 whitespace-nowrap text-xs text-[#7A6A5D]">
                    Mostrando {showcaseDocs.length} de {showcaseTotal} productos
                  </span>
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2">
                    <Suspense fallback={null}>
                      <TipoSortSelect />
                    </Suspense>
                    <ProductAddButton categoryId={addProductCategoryId} />
                  </div>
                </div>

                {showcaseDocs.length === 0 ? (
                  <div className="mt-5 rounded-md border border-[#E5DDD1] bg-card p-12 text-center">
                    <h3 className="text-lg font-semibold">No encontramos productos</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Probá con otro tipo o limpiá los filtros.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5">
                    <ProductGrid
                      products={showcaseDocs}
                      fallbackImage={activeTipo.image}
                      fallbackSubtitle={activeTipo.tagline}
                    />
                  </div>
                )}
                <HiddenProductsStrip categoryId={addProductCategoryId} />
              </section>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* BARRA DE SUBCATEGORÍAS */}
          <Suspense fallback={null}>
            <SubcategoryBar tags={tags} totalDocs={listing?.totalDocs ?? 0} currentCategory={categorySlug} />
          </Suspense>

          {/* CATÁLOGO: FILTROS + GRID */}
          <div className="flex-1 px-4 py-6 sm:px-6">
            <div className="mx-auto flex max-w-[1400px] flex-col gap-5 lg:flex-row lg:gap-6">
              <CatalogAsideFilters facets={facets} />

              <section className="min-w-0 flex-1">
                <ProductAddButton categoryId={category?.id} />
                {listingDocs.length === 0 ? (
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
                    <ProductGrid products={listingDocs} />
                    <Suspense fallback={null}>
                      <CatalogPagination
                        page={listing?.page ?? 1}
                        totalPages={listing?.totalPages ?? 1}
                      />
                    </Suspense>
                  </>
                )}
                <HiddenProductsStrip
                  categoryId={
                    isFullListing && params.tipo && activeTipo?.real
                      ? activeTipo.categoryId
                      : category?.id
                  }
                />
              </section>
            </div>
          </div>
        </>
      )}

      {/* BLOQUE DE BENEFICIOS */}
      <BenefitsBlock />
    </div>
  )
}
