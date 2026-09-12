import Link from 'next/link'
import Image from 'next/image'

export interface CategoryHeroProps {
  title: string
  description?: string | null
  imageUrl?: string | null
}

/**
 * Hero de categoría: en desktop (~240px) contenido a la izquierda sobre
 * fondo crema e imagen a la derecha (~50%); en mobile apilado vertical.
 * Reutilizable para cualquier categoría: título/descripción/imagen por props.
 */
export function CategoryHero({ title, description, imageUrl }: CategoryHeroProps) {
  return (
    <section className="overflow-hidden border-b border-[#EBDFD1] bg-[#FAF5EC]">
      <div className="flex flex-col md:h-[240px] md:flex-row">
        {/* Contenido izquierdo (~50%) */}
        <div className="flex w-full flex-col justify-center px-6 py-8 sm:px-10 md:w-1/2 md:py-0 lg:pl-[max(2.5rem,calc((100vw-1400px)/2+2.5rem))] lg:pr-10">
          <nav aria-label="Breadcrumb" className="text-xs text-[#9A8A7A]">
            <Link
              href="/"
              className="transition-colors hover:text-[#C45A37]"
            >
              Inicio
            </Link>
            <span aria-hidden="true" className="mx-1.5">
              &gt;
            </span>
            <span className="text-[#38271D]">{title}</span>
          </nav>
          <h1 className="mt-2 font-serif text-4xl font-normal tracking-tight text-[#38271D] sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-[420px] whitespace-pre-line text-sm leading-relaxed text-[#5C4A3D] sm:text-[15px]">
              {description}
            </p>
          ) : null}
          <span
            aria-hidden="true"
            className="mt-4 flex items-center gap-2"
          >
            <span className="block h-px w-16 bg-[#C45A37]/40" />
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-3 w-3 text-[#C45A37]/70"
              aria-hidden="true"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <span className="block h-px w-16 bg-[#C45A37]/40" />
          </span>
        </div>

        {/* Imagen derecha (~50%) */}
        <div className="relative h-48 w-full sm:h-56 md:h-full md:w-1/2">
          <Image
            src={imageUrl ?? '/assets/hero/hero-solistica-1.jpeg'}
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
          {/* Transición suave contenido → imagen */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 hidden w-20 bg-gradient-to-r from-[#FAF5EC] to-transparent md:block"
          />
        </div>
      </div>
    </section>
  )
}
