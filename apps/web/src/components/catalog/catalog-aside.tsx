'use client'

import { Suspense, useEffect, useState } from 'react'
import { CatalogSidebar } from './catalog-sidebar'
import type { FilterFacets } from '@/lib/catalog'

const EMPTY_FACETS: FilterFacets = {
  aromas: [],
  rituales: [],
  bounds: { min: 0, max: 0 },
}

/**
 * Columna de filtros del catálogo.
 * - Desktop (lg+): fija, siempre visible (se abre por efecto).
 * - Mobile/tablet: botón "Filtros" colapsable, cerrado por defecto.
 * Render condicional (sin utilidades display en conflicto) y un solo
 * render de `CatalogSidebar` (sin ids duplicados).
 */
export function CatalogAsideFilters({ facets }: { facets?: FilterFacets }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(min-width: 1024px)').matches
    ) {
      setOpen(true)
    }
  }, [])

  return (
    <aside className="lg:w-[220px] lg:flex-shrink-0 xl:w-[230px]">
      <div className="lg:sticky lg:top-32">
        <p className="mb-2 hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#38271D] lg:flex">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filtrar productos
        </p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full cursor-pointer list-none items-center justify-between rounded-lg border border-[#EBDFD1] bg-[#FCF8F1] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#38271D] lg:hidden"
        >
          <span>Filtros</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-3.5 w-3.5 text-[#9A8A7A] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {open ? (
          <div className="mt-2 lg:mt-0">
            <Suspense fallback={null}>
              <CatalogSidebar facets={facets ?? EMPTY_FACETS} />
            </Suspense>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
