'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import type { ProductTag } from '@/payload-types'

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '-createdAt', label: 'Más recientes' },
  { value: '-featured,sortOrder,-createdAt', label: 'Destacados' },
  { value: 'price', label: 'Precio: menor a mayor' },
  { value: '-price', label: 'Precio: mayor a menor' },
  { value: 'title', label: 'Título (A-Z)' },
]

export interface SubcategoryBarProps {
  tags: ProductTag[]
  totalDocs: number
  currentCategory?: string
}

export function SubcategoryBar({ tags, totalDocs, currentCategory }: SubcategoryBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const activeTag = searchParams.get('tag') ?? ''
  const sort = searchParams.get('sort') ?? '-featured,sortOrder,-createdAt'

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString())
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    next.delete('page')
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`)
    })
  }

  const visualPills = [
    { id: 'visual-vela-clasica', slug: 'vela-clasica', name: 'Vela Clásica', isVisual: true },
    { id: 'visual-vela-bubble', slug: 'vela-bubble', name: 'Vela Bubble', isVisual: true },
    { id: 'visual-vela-en-lata', slug: 'vela-en-lata', name: 'Vela en Lata', isVisual: true },
    { id: 'visual-vela-de-soja', slug: 'vela-de-soja', name: 'Vela de Soja', isVisual: true },
    { id: 'visual-sets-regalos', slug: 'sets-regalos', name: 'Sets & Regalos', isVisual: true },
  ] as const

  const allPills = currentCategory === 'velas'
    ? [...visualPills, ...tags]
    : tags

  const pillBase =
    'inline-flex h-[30px] flex-shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 text-[12px] transition-colors duration-150'
  const countNode = (
    <span className="whitespace-nowrap text-xs text-[#7A6A5D]">
      {totalDocs} {totalDocs === 1 ? 'producto' : 'productos'}
    </span>
  )
  const sortNode = (
    <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-[#7A6A5D]">
      Ordenar por:
      <select
        value={sort}
        onChange={(e) =>
          setParam(
            'sort',
            e.target.value === '-featured,sortOrder,-createdAt' ? null : e.target.value,
          )
        }
        disabled={isPending}
        className="h-[30px] rounded-full border border-[#E5DDD1] bg-background pl-2.5 pr-1.5 text-xs text-[#38271D] outline-none"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <div className="border-b border-[#EBDFD1] bg-[#FBF7F1]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-2 sm:px-6 lg:h-[48px] lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:py-0">
        <nav
          aria-label="Subcategorías"
          className="-mx-1 flex flex-1 items-center gap-2 overflow-x-auto px-1 py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:overflow-visible [&::-webkit-scrollbar]:hidden"
        >
          <button
            type="button"
            onClick={() => setParam('tag', null)}
            aria-pressed={!activeTag}
            className={`${pillBase} ${
              !activeTag
                ? 'border-[#B85C33] bg-[#B85C33] font-semibold text-white'
                : 'border-[#E5DDD1] bg-transparent text-[#7A6A5D] hover:border-[#C45A37]/50 hover:text-[#38271D]'
            }`}
          >
            Todos
          </button>
          {allPills.map((tag) => {
            const active = activeTag === tag.slug
            const isVisual = 'isVisual' in tag && tag.isVisual
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => setParam('tag', active ? null : tag.slug)}
                aria-pressed={active}
                className={`${pillBase} ${
                  active
                    ? 'border-[#B85C33] bg-[#B85C33] font-semibold text-white'
                    : isVisual
                      ? 'cursor-default border-[#E5DDD1] bg-transparent text-[#7A6A5D] opacity-70'
                      : 'border-[#E5DDD1] bg-transparent text-[#7A6A5D] hover:border-[#C45A37]/50 hover:text-[#38271D]'
                }`}
                disabled={isVisual}
              >
                {tag.name}
              </button>
            )
          })}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {countNode}
          {sortNode}
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 pb-2.5 sm:px-6 lg:hidden">
        {countNode}
        {sortNode}
      </div>
    </div>
  )
}