import Link from 'next/link'
import Image from 'next/image'

export interface CategoryHeroProps {
  title: string
  description?: string | null
  imageUrl?: string | null
}

/**
 * Hero de categoría: 35% contenido / 65% imagen en desktop (~150px),
 * vertical en mobile (breadcrumb arriba, imagen debajo).
 * Reutilizable para cualquier categoría: título/descripción/imagen por props.
 */
export function CategoryHero({ title, description, imageUrl }: CategoryHeroProps) {
  return (
    <section className="overflow-hidden border-b border-[#E5DDD1] bg-[#F4EDE4]">
      <div className="flex flex-col md:h-[150px] md:flex-row">
        {/* Contenido izquierdo (~35%) */}
        <div className="flex w-full flex-col justify-center px-7 py-5 md:w-[35%] md:py-0">
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
          <h1 className="mt-1 font-serif text-3xl font-normal tracking-tight text-[#38271D] sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-[420px] text-sm leading-snug text-[#7A6A5D]">
              {description}
            </p>
          ) : null}
          <span
            aria-hidden="true"
            className="mt-3 block h-px w-8 bg-[#C45A37]/40"
          />
        </div>

        {/* Imagen derecha (~65%) */}
        <div className="relative h-28 w-full md:h-full md:w-[65%]">
          <Image
            src={imageUrl ?? '/assets/hero/hero-solistica-1.jpeg'}
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 65vw, 100vw"
            className="object-cover"
          />
          {/* Transición suave contenido → imagen */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 hidden w-14 bg-gradient-to-r from-[#F4EDE4] to-transparent md:block"
          />
        </div>
      </div>
    </section>
  )
}