import Link from 'next/link'
import Image from 'next/image'

interface TipoCtaProps {
  categorySlug: string
  tipoSlug: string
  tipoName: string
}

/**
 * CTA "Conocé todas las [tipo]" del mock. Abre el listado completo del tipo.
 */
export function TipoCta({ categorySlug, tipoSlug, tipoName }: TipoCtaProps) {
  return (
    <section
      aria-label={`Ver todas las ${tipoName}`}
      className="relative mt-8 overflow-hidden rounded-lg border border-[#EBDFD1] bg-[#F3EADB]"
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-7">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden="true"
            className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#B85C33]/10 text-[#B85C33] sm:flex"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <rect x="3" y="8" width="18" height="4" />
              <path d="M5 12v9h14v-9" />
              <path d="M12 8v13" />
              <path d="M12 8c-4 0-5.5-1.5-5.5-3.5C6.5 3 8 2.5 9 3.5 10.5 5 12 8 12 8z" />
              <path d="M12 8c4 0 5.5-1.5 5.5-3.5 0-1.5-1.5-2-2.5-1C13.5 5 12 8 12 8z" />
            </svg>
          </span>
          <div className="min-w-0">
            <h2 className="font-serif text-xl font-normal text-[#38271D] sm:text-2xl">
              ¿Querés ver todas las {tipoName}?
            </h2>
            <p className="mt-1 text-xs text-[#7A6A5D] sm:text-sm">
              Descubrí la colección completa y encontrá tu aroma ideal.
            </p>
          </div>
        </div>
        <Link
          href={`/catalogo?category=${categorySlug}&tipo=${tipoSlug}&completa=1`}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-[#B85C33] px-6 text-[11px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#9E4E2B]"
        >
          Ver todas las {tipoName}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-40 opacity-40 md:block" aria-hidden="true">
        <Image
          src="/assets/hero/hero-solistica-3.jpeg"
          alt=""
          fill
          sizes="160px"
          className="object-cover [mask-image:linear-gradient(to_left,black,transparent)]"
        />
      </div>
    </section>
  )
}
