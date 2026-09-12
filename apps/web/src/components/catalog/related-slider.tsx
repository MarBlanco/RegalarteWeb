'use client'

import { useRef } from 'react'
import { ProductCard } from './product-card'
import type { ProductWithImage } from '@/lib/catalog'
import type { MockBadge } from './catalog-mock'

interface RelatedSliderProps {
  products: ProductWithImage[]
  badges?: Record<number | string, MockBadge>
}

/**
 * "También te puede gustar" del mock: título serif con detalle decorativo,
 * flechas de navegación y fila con scroll-snap (4 visibles en desktop).
 */
export function RelatedSlider({ products, badges }: RelatedSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  if (products.length === 0) return null

  function scrollByPage(direction: 1 | -1) {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <section aria-label="También te puede gustar">
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex min-w-0 items-center gap-3 font-serif text-2xl font-normal tracking-tight text-[#38271D] sm:text-[28px]">
          <span className="truncate">También te puede gustar</span>
          <span aria-hidden="true" className="hidden h-px w-10 shrink-0 bg-[#C45A37]/60 sm:block" />
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label="Ver anteriores"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5DDD1] text-[#7A6A5D] transition-colors hover:border-[#C45A37]/50 hover:text-[#C45A37]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label="Ver siguientes"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5DDD1] text-[#7A6A5D] transition-colors hover:border-[#C45A37]/50 hover:text-[#C45A37]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 pt-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[68%] shrink-0 snap-start sm:w-[31.5%] lg:w-[23.4%]"
          >
            <ProductCard
              product={product}
              badge={badges?.[product.id] ?? (product.featured ? 'FAVORITO' : null)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
