import Link from 'next/link'
import Image from 'next/image'

export interface EditorialBlockProps {
  title?: string
  text?: string
  ctaLabel?: string
  ctaHref?: string
  imageUrl?: string
}

/**
 * Bloque editorial bajo el catálogo: imagen decorativa pequeña + título,
 * texto y CTA. Fondo crema más oscuro, radius 6px, horizontal en desktop.
 */
export function EditorialBlock({
  title = 'Una luz encendida cambia el momento.',
  text = 'Rituales simples para disfrutar, regalar y transformar tu hogar.',
  ctaLabel = 'Descubrí más',
  ctaHref = '/solistica',
  imageUrl = '/assets/hero/hero-solistica-2.jpeg',
}: EditorialBlockProps) {
  return (
    <section className="px-7 pb-10 pt-2">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 rounded-md border border-[#E5DDD1] bg-[#F0E7DB] p-4 sm:gap-6 sm:p-5">
        <div className="relative hidden h-14 w-14 flex-shrink-0 overflow-hidden rounded-md sm:block md:h-16 md:w-16">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h2 className="font-serif text-base font-normal text-[#38271D] sm:text-lg">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-[#7A6A5D] sm:text-sm">{text}</p>
          </div>
          <Link
            href={ctaHref}
            className="inline-flex h-9 flex-shrink-0 items-center justify-center rounded-md bg-primary px-5 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-[#9E4024]"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}