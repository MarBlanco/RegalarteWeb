import { Suspense } from 'react'
import { Metadata } from 'next'
import {
  fetchCategories,
  fetchProductTags,
  fetchProducts,
  type CatalogFilters,
  type ProductWithImage,
} from '@/lib/catalog'
import { CatalogSidebar } from '@/components/catalog/catalog-sidebar'
import { CatalogPagination } from '@/components/catalog/catalog-pagination'
import { ProductGrid } from '@/components/catalog/product-grid'
import { CategoryHero } from '@/components/catalog/category-hero'
import { SubcategoryBar } from '@/components/catalog/subcategory-bar'
import { BenefitsBlock } from '@/components/catalog/benefits-block'
import { TipoSelector } from '@/components/catalog/tipo-selector'
import { TipoSortSelect } from '@/components/catalog/tipo-sort-select'
import { TipoCta } from '@/components/catalog/tipo-cta'
import {
  MOCK_BADGES,
  MOCK_GRID_SIZE,
  MOCK_PRODUCTS,
} from '@/components/catalog/catalog-mock'
import {
  getCategoryTipos,
  mockCategoryName,
  mockTipoName,
  mockTipoProducts,
} from '@/components/catalog/catalog-tipos'
import type { MockBadge } from '@/components/catalog/catalog-mock'
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

  // Tipos administrables: hijas del CMS o mock (nunca hardcodeados).
  const tipos = categorySlug ? getCategoryTipos(categorySlug, categories) : []
  const activeTipo =
    tipos.find((t) => t.slug === params.tipo) ?? tipos[0] ?? null

  const hasActiveFilters = Boolean(
    params.q?.trim() || params.tag || params.minPrice || params.maxPrice,
  )
  const isFullListing = params.completa === '1' || hasActiveFilters

  // ---- Modo A: showcase por tipo (mock) ----
  let showcaseDocs: ProductWithImage[] = []
  let showcaseBadges: Record<number, MockBadge> = {}
  let showcaseTotal = 0
  if (categorySlug && activeTipo && !isFullListing) {
    // Reales primero: del tipo si es real del CMS, si no de la categoría.
    const real = await fetchProducts(
      { categorySlug: activeTipo.real ? activeTipo.slug : categorySlug, sort },
      1,
      MOCK_GRID_SIZE,
    )
    showcaseDocs = real.docs
    showcaseTotal = real.totalDocs
    if (showcaseDocs.length < MOCK_GRID_SIZE) {
      const mock = mockTipoProducts(
        categorySlug,
        activeTipo.slug,
        activeTipo.name,
        MOCK_GRID_SIZE,
      )
      const realSlugs = new Set(showcaseDocs.map((d) => d.slug))
      const fill = mock.products.filter((m) => !realSlugs.has(m.slug)).slice(
        0,
        MOCK_GRID_SIZE - showcaseDocs.length,
      )
      showcaseDocs = [...showcaseDocs, ...fill]
      showcaseBadges = { ...MOCK_BADGES, ...mock.badges }
      if (fill.length > 0) showcaseTotal = Math.max(showcaseTotal, activeTipo.count)
    }
  }

  // ---- Modo B: listado completo / filtrado ----
  let listing: Awaited<ReturnType<typeof fetchProducts>> | null = null
  let listingDocs: ProductWithImage[] = []
  if (!categorySlug || isFullListing) {
    const tipoSlugForListing =
      isFullListing && params.tipo && activeTipo?.real ? params.tipo : undefined
    const filters: CatalogFilters = {
      q: params.q,
      categorySlug: tipoSlugForListing ?? categorySlug,
      tagSlug: params.tag,
      minPrice: parsePrice(params.minPrice),
      maxPrice: parsePrice(params.maxPrice),
      sort,
    }
    listing = await fetchProducts(filters, page)
    listingDocs = listing.docs
    const onlyTipoFilter =
      isFullListing && !params.q?.trim() && !params.tag && !params.minPrice && !params.maxPrice
    if (onlyTipoFilter && activeTipo && listingDocs.length < MOCK_GRID_SIZE) {
      const mock = mockTipoProducts(
        categorySlug ?? '',
        activeTipo.slug,
        activeTipo.name,
        MOCK_GRID_SIZE,
      )
      const realSlugs = new Set(listingDocs.map((d) => d.slug))
      listingDocs = [
        ...listingDocs,
        ...mock.products.filter((m) => !realSlugs.has(m.slug)).slice(
          0,
          MOCK_GRID_SIZE - listingDocs.length,
        ),
      ]
      showcaseBadges = { ...MOCK_BADGES, ...mock.badges }
    } else if (
      !hasActiveFilters &&
      !params.tipo &&
      listingDocs.length < MOCK_GRID_SIZE
    ) {
      // Vista general sin filtros: relleno visual legacy.
      const realSlugs = new Set(listingDocs.map((d) => d.slug))
      listingDocs = [
        ...listingDocs,
        ...MOCK_PRODUCTS.filter((m) => !realSlugs.has(m.slug)).slice(
          0,
          MOCK_GRID_SIZE - listingDocs.length,
        ),
      ]
      showcaseBadges = MOCK_BADGES
    }
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
              />
            </Suspense>
          </div>

          <div className="flex-1 px-4 py-6 sm:px-6">
            <div className="mx-auto flex max-w-[1400px] flex-col gap-5 lg:flex-row lg:gap-6">
              <aside className="lg:w-[220px] lg:flex-shrink-0 xl:w-[230px]">
                <div className="lg:sticky lg:top-32">
                  <Suspense fallback={null}>
                    <CatalogSidebar />
                  </Suspense>
                </div>
              </aside>

              <section className="min-w-0 flex-1" aria-label={activeTipo.name}>
                <div className="flex flex-wrap items-end justify-between gap-3">
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
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="whitespace-nowrap text-xs text-[#7A6A5D]">
                      Mostrando {showcaseDocs.length} de {showcaseTotal} productos
                    </span>
                    <Suspense fallback={null}>
                      <TipoSortSelect />
                    </Suspense>
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
                      badges={showcaseBadges}
                      fallbackImage={activeTipo.image}
                      fallbackSubtitle={activeTipo.tagline}
                    />
                  </div>
                )}

                <TipoCta
                  categorySlug={categorySlug}
                  tipoSlug={activeTipo.slug}
                  tipoName={activeTipo.name}
                />
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
              <aside className="lg:w-[220px] lg:flex-shrink-0 xl:w-[230px]">
                <div className="lg:sticky lg:top-32">
                  <Suspense fallback={null}>
                    <CatalogSidebar />
                  </Suspense>
                </div>
              </aside>

              <section className="min-w-0 flex-1">
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
                    <ProductGrid products={listingDocs} badges={showcaseBadges} />
                    <CatalogPagination
                      page={listing?.page ?? 1}
                      totalPages={listing?.totalPages ?? 1}
                    />
                  </>
                )}
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
