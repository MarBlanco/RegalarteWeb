'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ProductCard } from '@/components/catalog/product-card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ChevronDown, ChevronUp, Filter, X, ShoppingBag, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  wholesalePrice?: number
  isWholesaleAvailable?: boolean
  images?: Array<{ image: { url: string; alt?: string }; isPrimary?: boolean }>
  shortDescription?: string
  category?: { slug: string; name: string }
}

interface ProductsResponse {
  docs: Product[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

const ITEMS_PER_PAGE = 12

export default function CatalogoPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isWholesale } = useAuth()

  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)

  const wholesaleUser = isWholesale()

  const { data, isLoading, error } = useQuery<ProductsResponse>({
    queryKey: ['products', { category, sort, page, limit: ITEMS_PER_PAGE }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        page: page.toString(),
        sort: sort,
        ...(category && { 'category.slug': category }),
      })
      const res = await fetch(`/api/products?${params}`)
      if (!res.ok) throw new Error('Error al cargar productos')
      return res.json()
    },
  })

  const products = data?.docs || []
  const totalProducts = data?.totalDocs || 0
  const totalPages = data?.totalPages || 1

  function updateParams(newParams: Record<string, string | number | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    router.push(`/catalogo?${params.toString()}`)
  }

  function handleCategoryChange(value: string) {
    setCategory(value)
    setPage(1)
    updateParams({ category: value, page: 1 })
  }

  function handleSortChange(value: string) {
    setSort(value)
    updateParams({ sort: value })
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    updateParams({ page: newPage })
  }

  function clearFilters() {
    setCategory('')
    setSort('newest')
    updateParams({ category: '', sort: 'newest' })
  }

  const sortOptions = [
    { value: 'newest', label: 'Más recientes' },
    { value: 'price-asc', label: 'Precio: menor a mayor' },
    { value: 'price-desc', label: 'Precio: mayor a menor' },
    { value: 'name-asc', label: 'Nombre: A-Z' },
    { value: 'name-desc', label: 'Nombre: Z-A' },
  ]

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-16 text-center">
        <p className="text-destructive">Error al cargar los productos</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Categorías</h3>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las categorías</SelectItem>
                  <SelectItem value="regalos-para-ella">Regalos para ella</SelectItem>
                  <SelectItem value="regalos-para-el">Regalos para él</SelectItem>
                  <SelectItem value="experiencias">Experiencias</SelectItem>
                  <SelectItem value="personalizados">Personalizados</SelectItem>
                  <SelectItem value="cajas-sorpresa">Cajas sorpresa</SelectItem>
                  <SelectItem value="armatu-regalo">Armá tu regalo</SelectItem>
                  <SelectItem value="solistica">Solística</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Ordenar por</h3>
                {sort !== 'newest' && (
                  <Button variant="ghost" size="sm" onClick={() => handleSortChange('newest')}>
                    <X className="h-3 w-3 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>
              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {category && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Filtros activos</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="gap-1">
                    {category}
                    <X className="h-3 w-3 cursor-pointer" onClick={clearFilters} />
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Catálogo</h1>
              <p className="text-muted-foreground">
                {totalProducts} {totalProducts === 1 ? 'producto' : 'productos'} encontrados
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay productos</h3>
              <p className="text-muted-foreground mb-6">
                {category ? 'Prueba cambiando los filtros' : 'No hay productos disponibles aún'}
              </p>
              {category && (
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div
                className={`grid gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1'
                }`}
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-4 text-sm">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}