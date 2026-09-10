import { Suspense } from 'react'
import { Metadata } from 'next'
import {
  fetchProducts,
  fetchCategories,
  fetchProductTags,
  type CatalogFilters,
} from '@/lib/catalog'
import { CatalogFilters as FiltersPanel } from '@/components/catalog/catalog-filters'
import { CatalogPagination } from '@/components/catalog/catalog-pagination'
import { ProductGrid } from '@/components/catalog/product-grid'

export const metadata: Metadata = {
  title: 'Buscar',
  description: 'Buscá productos en Regalarte. Encontrá el regalo perfecto filtrando por nombre, categoría, precio y más.',
}

interface PageProps {
  searchParams?: Promise<{
    q?: string
    page?: string
    category?: string
    tag?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
  }>
}

function parseNum(value: string | undefined): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const page = Number(params.page ?? 1)
  const filters: CatalogFilters = {
    q: params.q,
    categorySlug: params.category,
    tagSlug: params.tag,
    minPrice: parseNum(params.minPrice),
    maxPrice: parseNum(params.maxPrice),
    sort: params.sort as CatalogFilters['sort'],
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
            Buscar
          </h1>
          {params.q && (
            <p className="mt-2 text-muted-foreground">
              {products.totalDocs === 0
                ? `No se encontraron resultados para "${params.q}".`
                : `${products.totalDocs} ${
                    products.totalDocs === 1 ? 'resultado' : 'resultados'
                  } para "${params.q}"`}
            </p>
          )}
        </header>

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="lg:w-64 lg:flex-shrink-0">
            <Suspense fallback={null}>
              <FiltersPanel
                categories={categories}
                tags={tags}
                initialQ={params.q}
                showSort
              />
            </Suspense>
          </aside>

          <section className="flex-1">
            {products.docs.length === 0 ? (
              <div className="rounded-xl border bg-card p-12 text-center">
                <h2 className="text-lg font-semibold">
                  {params.q
                    ? `No se encontraron productos para "${params.q}".`
                    : 'No hay productos para mostrar.'}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {params.q
                    ? 'Probá con otros términos o limpiá los filtros.'
                    : 'Probá ajustar los filtros o limpiarlos para ver todo el catálogo.'}
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