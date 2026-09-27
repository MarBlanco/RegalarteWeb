'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'
import type { FacetOption, FilterFacets } from '@/lib/catalog'
import {
  FilterTagAddButton,
  FilterTagRowControls,
} from '@/components/edit-mode/filter-tag-edit-controls'

function SidebarSection({
  title,
  children,
  defaultOpen = true,
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

function CheckRow({
  option,
  checked,
  onChange,
  kind,
}: {
  option: FacetOption
  checked: boolean
  onChange: () => void
  kind: 'aroma' | 'ritual'
}) {
  return (
    <div className="flex items-center gap-1">
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-xs text-[#5C4A3D] transition-colors hover:text-[#38271D]">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="h-3.5 w-3.5 shrink-0 rounded-sm accent-[#B85C33]"
        />
        {option.color ? (
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10"
            style={{ backgroundColor: option.color }}
          />
        ) : null}
        <span className="min-w-0 flex-1 truncate">{option.name}</span>
        <span className="shrink-0 tabular-nums text-[#9A8A7A]">({option.count})</span>
      </label>
      <FilterTagRowControls
        tag={{ id: option.id, name: option.name, color: option.color }}
        kind={kind}
      />
    </div>
  )
}

/**
 * Sidebar del catálogo con la estética del mock.
 * Los tipos viven SOLO en el selector horizontal superior; aquí van
 * Buscar, Aroma, Ritual/Momento y Rango de precio.
 * - Aroma/Ritual: opciones reales (tags kind) con contadores calculados
 *   desde los productos vinculados; se combinan con AND (?aroma=&ritual=).
 * - Precio: límites reales del `price` de productos; el filtro usa el
 *   precio real del producto (minPrice/maxPrice).
 * Los filtros se preparan en local y se aplican con el botón.
 */
export function CatalogSidebar({ facets }: { facets: FilterFacets }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const bounds = facets.bounds
  const [q, setQ] = useState(() => searchParams.get('q') ?? '')
  const [aroma, setAroma] = useState(() => searchParams.get('aroma') ?? '')
  const [ritual, setRitual] = useState(() => searchParams.get('ritual') ?? '')
  const [showAllAromas, setShowAllAromas] = useState(false)

  const [minVal, setMinVal] = useState(() =>
    Number(searchParams.get('minPrice') ?? bounds.min),
  )
  const [maxVal, setMaxVal] = useState(() =>
    Number(searchParams.get('maxPrice') ?? bounds.max),
  )
  const [front, setFront] = useState<'min' | 'max'>('max')

  useEffect(() => {
    setQ(searchParams.get('q') ?? '')
    setAroma(searchParams.get('aroma') ?? '')
    setRitual(searchParams.get('ritual') ?? '')
    setMinVal(Number(searchParams.get('minPrice') ?? bounds.min))
    setMaxVal(Number(searchParams.get('maxPrice') ?? bounds.max))
  }, [searchParams, bounds.min, bounds.max])

  function pushParams(next: URLSearchParams) {
    next.delete('page')
    startTransition(() => {
      router.push(`${pathname}${next.toString() ? `?${next}` : ''}`)
    })
  }

  function toggleSingle(
    value: string,
    set: (v: string) => void,
    current: string,
  ) {
    set(current === value ? '' : value)
  }

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault()
    const next = new URLSearchParams(searchParams.toString())
    if (q.trim()) {
      next.set('q', q.trim())
    } else {
      next.delete('q')
    }
    if (aroma) {
      next.set('aroma', aroma)
    } else {
      next.delete('aroma')
    }
    if (ritual) {
      next.set('ritual', ritual)
    } else {
      next.delete('ritual')
    }
    const lo = Math.max(bounds.min, Math.min(minVal, maxVal))
    const hi = Math.min(bounds.max, Math.max(minVal, maxVal))
    if (lo <= bounds.min) {
      next.delete('minPrice')
    } else {
      next.set('minPrice', String(lo))
    }
    if (hi >= bounds.max) {
      next.delete('maxPrice')
    } else {
      next.set('maxPrice', String(hi))
    }
    pushParams(next)
  }

  function clearFilters() {
    setQ('')
    setAroma('')
    setRitual('')
    setMinVal(bounds.min)
    setMaxVal(bounds.max)
    const next = new URLSearchParams(searchParams.toString())
    next.delete('q')
    next.delete('aroma')
    next.delete('ritual')
    next.delete('minPrice')
    next.delete('maxPrice')
    pushParams(next)
  }

  const visibleAromas = showAllAromas ? facets.aromas : facets.aromas.slice(0, 5)
  const range = bounds.max - bounds.min
  const loPct =
    range > 0 ? ((Math.min(minVal, maxVal) - bounds.min) / range) * 100 : 0
  const hiPct =
    range > 0 ? ((Math.max(minVal, maxVal) - bounds.min) / range) * 100 : 0

  const thumbCls =
    'pointer-events-none absolute inset-x-0 top-1/2 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#B85C33] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#B85C33] [&::-moz-range-thumb]:bg-white'

  return (
    <form
      className="space-y-3 rounded-lg border border-[#EBDFD1] bg-[#FCF8F1] p-4"
      onSubmit={applyFilters}
    >
      <div className="space-y-1.5">
        <Label
          htmlFor="sidebar-q"
          className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#38271D]"
        >
          Buscar
        </Label>
        <Input
          id="sidebar-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nombre del producto"
          className="h-8 rounded-md border-[#E5DDD1] bg-background text-xs"
        />
      </div>

      <SidebarSection title="Aroma">
        <div className="space-y-2">
          {visibleAromas.map((opt) => (
            <CheckRow
              key={opt.slug}
              option={opt}
              kind="aroma"
              checked={aroma === opt.slug}
              onChange={() => toggleSingle(opt.slug, setAroma, aroma)}
            />
          ))}
        </div>
        {facets.aromas.length > 5 ? (
          <button
            type="button"
            onClick={() => setShowAllAromas((v) => !v)}
            className="mt-2 text-[11px] font-medium text-[#7A6A5D] transition-colors hover:text-[#C45A37]"
          >
            {showAllAromas ? 'Ver menos' : 'Ver más'}
          </button>
        ) : null}
        <FilterTagAddButton kind="aroma" />
      </SidebarSection>

      <SidebarSection title="Ritual / Momento">
        <div className="space-y-2">
          {facets.rituales.map((opt) => (
            <CheckRow
              key={opt.slug}
              option={opt}
              kind="ritual"
              checked={ritual === opt.slug}
              onChange={() => toggleSingle(opt.slug, setRitual, ritual)}
            />
          ))}
        </div>
        <FilterTagAddButton kind="ritual" />
      </SidebarSection>

      <SidebarSection title="Rango de precio">
        <div className="px-0.5">
          <div className="relative h-6">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#E5DDD1]"
            />
            <div
              aria-hidden="true"
              className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#B85C33]"
              style={{ left: `${loPct}%`, width: `${Math.max(hiPct - loPct, 0)}%` }}
            />
            <input
              type="range"
              min={bounds.min}
              max={bounds.max}
              step={100}
              value={minVal}
              aria-label="Precio mínimo"
              className={thumbCls}
              style={{ zIndex: front === 'min' ? 5 : 3 }}
              onPointerDown={() => setFront('min')}
              onChange={(e) => setMinVal(Number(e.target.value))}
            />
            <input
              type="range"
              min={bounds.min}
              max={bounds.max}
              step={100}
              value={maxVal}
              aria-label="Precio máximo"
              className={thumbCls}
              style={{ zIndex: front === 'max' ? 5 : 4 }}
              onPointerDown={() => setFront('max')}
              onChange={(e) => setMaxVal(Number(e.target.value))}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] tabular-nums text-[#7A6A5D]">
            <span>{formatPrice(bounds.min)}</span>
            <span>{formatPrice(bounds.max)}</span>
          </div>
        </div>
      </SidebarSection>

      <div className="flex flex-col gap-1 pt-1">
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
