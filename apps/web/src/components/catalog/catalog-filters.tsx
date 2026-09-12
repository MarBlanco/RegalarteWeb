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
      className="group border-b border-[#EBDFD1] pb-3 last:border-b-0 last:pb-0"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#38271D] [&::-webkit-details-marker]:hidden">
        {title}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3 w-3 text-[#9A8A7A] transition-transform duration-200 group-open:rotate-180"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>
      <div className="pt-2">{children}</div>
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
  const [showAllTags, setShowAllTags] = useState(false)

  const visibleTags = showAllTags ? tags : tags.slice(0, 5)

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
      className="space-y-3 rounded-lg border border-[#EBDFD1] bg-[#FCF8F1] p-4"
    >
      {/* Búsqueda */}
      <div className="space-y-1.5">
        <Label htmlFor="q" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#38271D]">
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
          <div className="space-y-2">
            {visibleTags.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-2 text-xs text-[#5C4A3D] transition-colors hover:text-[#38271D]"
              >
                <input
                  type="checkbox"
                  checked={tagSlug === t.slug}
                  onChange={() => toggleTag(t.slug)}
                  className="h-3.5 w-3.5 shrink-0 rounded-sm accent-[#B85C33]"
                />
                {t.color ? (
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: t.color }}
                  />
                ) : null}
                <span className="truncate">{t.name}</span>
              </label>
            ))}
          </div>
          {tags.length > 5 ? (
            <button
              type="button"
              onClick={() => setShowAllTags((v) => !v)}
              className="mt-2 text-[11px] font-medium text-[#7A6A5D] transition-colors hover:text-[#C45A37]"
            >
              {showAllTags ? 'Ver menos' : 'Ver más'}
            </button>
          ) : null}
        </FilterSection>
      ) : null}

      {/* Categoría */}
      <FilterSection title="Categoría">
        <select
          id="category"
          value={categorySlug}
          onChange={(e) => setCategorySlug(e.target.value)}
          className="flex h-8 w-full rounded-md border border-[#E5DDD1] bg-background px-2 text-xs text-[#5C4A3D]"
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
      <FilterSection title="Rango de precio">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="minPrice" className="text-[11px] text-[#7A6A5D]">
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
            <Label htmlFor="maxPrice" className="text-[11px] text-[#7A6A5D]">
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
          className="h-9 w-full rounded-md bg-[#B85C33] text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#9E4E2B]"
        >
          {isPending ? 'Aplicando...' : 'Aplicar filtros'}
        </Button>
        <button
          type="button"
          onClick={clearFilters}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-1.5 py-1 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-[#7A6A5D] transition-colors hover:text-[#C45A37] disabled:opacity-50"
        >
          Limpiar filtros
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
            aria-hidden="true"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <polyline points="3 4 3 9 8 9" />
          </svg>
        </button>
      </div>
    </form>
  )
}