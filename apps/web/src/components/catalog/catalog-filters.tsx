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
}

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '-createdAt', label: 'Más recientes' },
  { value: 'price', label: 'Precio: menor a mayor' },
  { value: '-price', label: 'Precio: mayor a menor' },
  { value: 'title', label: 'Título (A-Z)' },
]

function parseNum(value: string | null): number | undefined {
  if (value === null || value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

export function CatalogFilters({ categories, tags }: CatalogFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [q, setQ] = useState(searchParams.get('q') ?? '')
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
    setQ(searchParams.get('q') ?? '')
    setCategorySlug(searchParams.get('category') ?? '')
    setTagSlug(searchParams.get('tag') ?? '')
    setMinPrice(searchParams.get('minPrice') ?? '')
    setMaxPrice(searchParams.get('maxPrice') ?? '')
    setSort(searchParams.get('sort') ?? '-createdAt')
  }, [searchParams])

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
    if (sort && sort !== '-createdAt') next.set('sort', sort)
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

  return (
    <form
      onSubmit={applyFilters}
      className="space-y-4 rounded-xl border bg-card p-5"
    >
      <div className="space-y-2">
        <Label htmlFor="q">Buscar</Label>
        <Input
          id="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nombre del producto"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <select
          id="category"
          value={categorySlug}
          onChange={(e) => setCategorySlug(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tag">Tag</Label>
        <select
          id="tag"
          value={tagSlug}
          onChange={(e) => setTagSlug(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          {tags.map((t) => (
            <option key={t.id} value={t.slug}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="minPrice">Precio min</Label>
          <Input
            id="minPrice"
            type="number"
            min={0}
            inputMode="numeric"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxPrice">Precio max</Label>
          <Input
            id="maxPrice"
            type="number"
            min={0}
            inputMode="numeric"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="∞"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sort">Ordenar por</Label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Aplicando...' : 'Aplicar filtros'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={clearFilters}
          disabled={isPending}
        >
          Limpiar
        </Button>
      </div>
    </form>
  )
}
