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
    <label className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-[#7A6A5D]">
      Ordenar por:
      <select
        value={sort}
        onChange={(e) => onChange(e.target.value)}
        disabled={isPending}
        className="h-[30px] rounded-full border border-[#E5DDD1] bg-background pl-2.5 pr-1.5 text-xs text-[#38271D] outline-none"
        aria-label="Ordenar por"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}
