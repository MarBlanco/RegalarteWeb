'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '-featured,sortOrder,-createdAt', label: 'Destacados' },
  { value: '-createdAt', label: 'Más recientes' },
  { value: 'price', label: 'Precio: menor a mayor' },
  { value: '-price', label: 'Precio: mayor a menor' },
  { value: 'title', label: 'Título (A-Z)' },
]

/** Selector de orden del encabezado de tipo (mock: "Destacados"). */
export function TipoSortSelect() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const sort = searchParams.get('sort') ?? '-featured,sortOrder,-createdAt'

  function onChange(value: string) {
    const next = new URLSearchParams(searchParams.toString())
    if (value === '-featured,sortOrder,-createdAt') {
      next.delete('sort')
    } else {
      next.set('sort', value)
    }
    next.delete('page')
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`)
    })
  }

  return (
    <label className="flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-2 text-xs text-[#7A6A5D]">
      <span className="shrink-0 whitespace-nowrap">Ordenar por:</span>
      <span className="relative inline-flex max-w-full items-center">
        <select
          value={sort}
          onChange={(e) => onChange(e.target.value)}
          disabled={isPending}
          className="h-[30px] w-auto max-w-full cursor-pointer appearance-none truncate rounded-full border border-[#E5DDD1] bg-background pl-3 pr-8 text-xs text-[#38271D] outline-none focus-visible:ring-2 focus-visible:ring-[#B85C33]/40 disabled:cursor-wait disabled:opacity-60"
          aria-label="Ordenar por"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[#7A6A5D]"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </label>
  )
}
