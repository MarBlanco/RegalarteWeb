'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Tipo } from './catalog-tipos'
import { cn } from '@/lib/utils'
import { TipoAddButton, TipoItemControls, HiddenTiposStrip } from '@/components/edit-mode/tipo-edit-controls'

interface TipoSelectorProps {
  categorySlug: string
  tipos: Tipo[]
  activeSlug: string | null
  /** Id de la categoría padre: habilita el "+" en MODO EDICIÓN. */
  editCategoryId?: number
}

function TipoCard({
  categorySlug,
  tipo,
  active,
}: {
  categorySlug: string
  tipo: Tipo
  active: boolean
}) {
  return (
    <Link
      href={`/catalogo?category=${categorySlug}&tipo=${tipo.slug}`}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors',
        active
          ? 'border-[#B85C33] bg-[#FFFDF9] shadow-sm'
          : 'border-[#EBDFD1] bg-[#FCF8F1] hover:border-[#C45A37]/50',
      )}
    >
      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[#F4EDE4]">
        {tipo.image ? (
          <Image
            src={tipo.image}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-serif text-[15px] font-medium text-[#38271D]">
          {tipo.name}
        </span>
        {tipo.tagline ? (
          <span className="block truncate text-[11px] text-[#9A8A7A]">
            {tipo.tagline}
          </span>
        ) : null}
      </span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          'h-4 w-4 shrink-0',
          active ? 'text-[#B85C33]' : 'text-[#C4B8A8]',
        )}
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  )
}

const NAV_CLASS =
  '-mx-1 flex gap-3 overflow-x-auto px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:gap-4 [&::-webkit-scrollbar]:hidden'

/**
 * Selector horizontal de tipos/colecciones de la categoría.
 * La selección viaja en el parámetro `tipo` de la URL: una sola fila con
 * scroll, sinWrap. En MODO EDICIÓN el "+" vive FUERA del scroll (siempre
 * visible, sin solape posible) y cada tarjeta real lleva sus controles.
 */
export function TipoSelector({ categorySlug, tipos, activeSlug, editCategoryId }: TipoSelectorProps) {
  const scrollRef = useRef<HTMLElement>(null)

  function scrollBy(direction: -1 | 1) {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.8, 240), behavior: 'smooth' })
  }

  const arrowCls =
    'hidden h-9 w-9 shrink-0 items-center justify-center self-center rounded-full border border-[#EBDFD1] bg-[#FCF8F1] text-[#7A6A5D] shadow-sm transition-colors hover:border-[#C45A37]/50 hover:text-[#38271D] sm:inline-flex'

  if (tipos.length === 0 && editCategoryId === undefined) return null

  if (editCategoryId === undefined) {
    return (
      <div className="flex items-stretch gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Ver tipos anteriores"
          className={arrowCls}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <nav ref={scrollRef} aria-label="Tipos de la categoría" className={cn(NAV_CLASS, 'min-w-0 flex-1')}>
          {tipos.map((tipo) => (
            <div
              key={tipo.slug}
              className="relative w-[210px] shrink-0 sm:w-[230px]"
            >
              <TipoCard
                categorySlug={categorySlug}
                tipo={tipo}
                active={activeSlug === tipo.slug}
              />
            </div>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Ver tipos siguientes"
          className={arrowCls}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-stretch gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Ver tipos anteriores"
          className={arrowCls}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <nav
          ref={scrollRef}
          aria-label="Tipos de la categoría"
          className={cn(NAV_CLASS, 'min-w-0 flex-1')}
        >
          {tipos.map((tipo, index) => (
            <div
              key={tipo.slug}
              className="relative w-[210px] shrink-0 sm:w-[230px]"
            >
              <TipoCard
                categorySlug={categorySlug}
                tipo={tipo}
                active={activeSlug === tipo.slug}
              />
              <TipoItemControls tipo={tipo} tipos={tipos} index={index} />
            </div>
          ))}
        </nav>
        <TipoAddButton categoryId={editCategoryId} />
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Ver tipos siguientes"
          className={arrowCls}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
      <HiddenTiposStrip parentId={editCategoryId} />
    </div>
  )
}
