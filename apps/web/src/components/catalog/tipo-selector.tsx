import Link from 'next/link'
import Image from 'next/image'
import type { Tipo } from './catalog-tipos'
import { cn } from '@/lib/utils'

interface TipoSelectorProps {
  categorySlug: string
  tipos: Tipo[]
  activeSlug: string | null
}

/**
 * Selector horizontal de tipos/colecciones de la categoría (mock).
 * La selección viaja en el parámetro `tipo` de la URL.
 */
export function TipoSelector({ categorySlug, tipos, activeSlug }: TipoSelectorProps) {
  if (tipos.length === 0) return null
  return (
    <nav
      aria-label="Tipos de la categoría"
      className="-mx-1 flex gap-3 overflow-x-auto px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:gap-4 [&::-webkit-scrollbar]:hidden"
    >
      {tipos.map((tipo) => {
        const active = activeSlug === tipo.slug
        return (
          <Link
            key={tipo.slug}
            href={`/catalogo?category=${categorySlug}&tipo=${tipo.slug}`}
            aria-current={active ? 'true' : undefined}
            className={cn(
              'flex w-[210px] shrink-0 items-center gap-3 rounded-lg border p-2.5 text-left transition-colors sm:w-[230px]',
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
      })}
    </nav>
  )
}
