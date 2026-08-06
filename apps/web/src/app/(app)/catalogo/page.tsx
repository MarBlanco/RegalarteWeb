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

export default async function CatalogPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const page = parsePage(params.page)
  const filters: CatalogFilters = {
    q: params.q,
    categorySlug: params.category,
    tagSlug: params.tag,
    minPrice: parsePrice(params.minPrice),
    maxPrice: parsePrice(params.maxPrice),
    sort: (params.sort as CatalogFilters['sort']) ?? '-createdAt',
  }

  const [products, categories, tags] = await Promise.all([
    fetchProducts(filters, page),
    fetchCategories(),
    fetchProductTags(),
  ])

  return (
    <div className="bg-background">
      <div className="container py-8 lg:py-12">
        <header className="mb-8 lg:mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Catálogo
          </h1>
          <p className="mt-2 text-muted-foreground">
            {products.totalDocs === 0
              ? 'Explorá todas nuestras propuestas para encontrar el regalo ideal.'
              : `${products.totalDocs} ${
                  products.totalDocs === 1 ? 'producto encontrado' : 'productos encontrados'
                }`}
          </p>
        </header>

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="lg:w-64 lg:flex-shrink-0">
            <Suspense fallback={null}>
              <FiltersPanel categories={categories} tags={tags} />
            </Suspense>
          </aside>

          <section className="flex-1">
            {products.docs.length === 0 ? (
              <div className="rounded-xl border bg-card p-12 text-center">
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
    </div>
  )
}
