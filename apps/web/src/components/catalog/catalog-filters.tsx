'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useTransition, FormEvent, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Category, ProductTag } from '@/payload-types'

export interface CatalogFiltersProps {
  categories: Category[]
  tags: ProductTag[]
  initialQ?: string
  /** Mostrar selector de orden dentro del panel (usado en /buscar). */
  showSort?: boolean
}

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '-createdAt', label: 'Más recientes' },
  { value: 'sortOrder', label: 'Destacados' },
  { value: 'price', label: 'Precio: menor a mayor' },
  { value: '-price', label: 'Precio: mayor a menor' },
  { value: 'title', label: 'Título (A-Z)' },
]

function parseNum(value: string | null): number | undefined {
  if (value === null || value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function FilterSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-md border border-[#E5DDD1] bg-background/60"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#38271D] [&::-webkit-details-marker]:hidden">
        {title}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5 text-[#9A8A7A] transition-transform duration-200 group-open:rotate-180"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>
      <div className="border-t border-[#E5DDD1] px-3 py-3">{children}</div>
    </details>
  )
}

export function CatalogFilters({
  categories,
  tags,
  initialQ = '',
  showSort = false,
}: CatalogFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [q, setQ] = useState(() => searchParams.get('q') ?? initialQ)
  const [categorySlug, setCategorySlug] = useState(
    searchParams.get('category') ?? '',
  )
  const [tagSlug, setTagSlug] = useState(searchParams.get('tag') ?? '')
  const [minPrice, setMinPrice] = useState(
    searchParams.get('minPrice') ?? '',
  )
  const [maxPrice, setMaxPrice] = useState(
    searchParams.get('maxPrice') ?? '',
  )
  const [sort, setSort] = useState(searchParams.get('sort') ?? '-createdAt')

  useEffect(() => {
    setQ(searchParams.get('q') ?? initialQ)
    setCategorySlug(searchParams.get('category') ?? '')
    setTagSlug(searchParams.get('tag') ?? '')
    setMinPrice(searchParams.get('minPrice') ?? '')
    setMaxPrice(searchParams.get('maxPrice') ?? '')
    setSort(searchParams.get('sort') ?? '-createdAt')
  }, [searchParams, initialQ])

  function applyFilters(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault()
    const next = new URLSearchParams()
    if (q.trim()) next.set('q', q.trim())
    if (categorySlug) next.set('category', categorySlug)
    if (tagSlug) next.set('tag', tagSlug)
    const min = parseNum(minPrice)
    const max = parseNum(maxPrice)
    if (min !== undefined) next.set('minPrice', String(min))
    if (max !== undefined) next.set('maxPrice', String(max))
    // El orden se gestiona en la barra superior; se conserva si ya estaba seteado.
    const effectiveSort = showSort ? sort : searchParams.get('sort')
    if (effectiveSort && effectiveSort !== '-createdAt') {
      next.set('sort', effectiveSort)
    }
    startTransition(() => {
      router.push(`${pathname}${next.toString() ? `?${next}` : ''}`)
    })
  }

  function clearFilters() {
    setQ('')
    setCategorySlug('')
    setTagSlug('')
    setMinPrice('')
    setMaxPrice('')
    setSort('-createdAt')
    startTransition(() => {
      router.push(pathname)
    })
  }

  function toggleTag(slug: string) {
    setTagSlug((current) => (current === slug ? '' : slug))
  }

  return (
    <form
      onSubmit={applyFilters}
      className="space-y-2.5 rounded-md border border-[#E5DDD1] bg-[#F4EDE4]/70 p-3"
    >
      {/* Búsqueda */}
      <div className="space-y-1.5">
        <Label htmlFor="q" className="text-xs text-[#38271D]">
          Buscar
        </Label>
        <Input
          id="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nombre del producto"
          className="h-8 rounded-md border-[#E5DDD1] bg-background text-xs"
        />
      </div>

      {/* Etiquetas (checkboxes, selección única) */}
      {tags.length > 0 ? (
        <FilterSection title="Tipo" defaultOpen>
          <div className="space-y-1.5">
            {tags.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-2 text-xs text-[#7A6A5D] transition-colors hover:text-[#38271D]"
              >
                <input
                  type="checkbox"
                  checked={tagSlug === t.slug}
                  onChange={() => toggleTag(t.slug)}
                  className="h-3.5 w-3.5 rounded-sm accent-[#C45A37]"
                />
                {t.name}
              </label>
            ))}
          </div>
        </FilterSection>
      ) : null}

      {/* Categoría */}
      <FilterSection title="Categoría">
        <select
          id="category"
          value={categorySlug}
          onChange={(e) => setCategorySlug(e.target.value)}
          className="flex h-8 w-full rounded-md border border-[#E5DDD1] bg-background px-2 text-xs"
          aria-label="Categoría"
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.title}
            </option>
          ))}
        </select>
      </FilterSection>

      {/* Precio */}
      <FilterSection title="Precio">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="minPrice" className="text-xs text-[#7A6A5D]">
              Mín
            </Label>
            <Input
              id="minPrice"
              type="number"
              min={0}
              inputMode="numeric"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              className="h-8 rounded-md border-[#E5DDD1] bg-background text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="maxPrice" className="text-xs text-[#7A6A5D]">
              Máx
            </Label>
            <Input
              id="maxPrice"
              type="number"
              min={0}
              inputMode="numeric"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="∞"
              className="h-8 rounded-md border-[#E5DDD1] bg-background text-xs"
            />
          </div>
        </div>
      </FilterSection>

      {/* Orden (solo cuando el panel es el único control, p. ej. /buscar) */}
      {showSort ? (
        <FilterSection title="Ordenar por">
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="flex h-8 w-full rounded-md border border-[#E5DDD1] bg-background px-2 text-xs"
            aria-label="Ordenar por"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FilterSection>
      ) : null}

      <div className="flex flex-col gap-2 pt-1">
        <Button
          type="submit"
          disabled={isPending}
          className="h-8 rounded-md text-xs font-semibold uppercase tracking-wider"
        >
          {isPending ? 'Aplicando...' : 'Aplicar filtros'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={clearFilters}
          disabled={isPending}
          className="h-8 rounded-md text-xs"
        >
          Limpiar
        </Button>
      </div>
    </form>
  )
}