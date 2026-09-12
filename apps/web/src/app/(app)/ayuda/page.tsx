import type { Metadata } from 'next'
import Link from 'next/link'
import { AyudaAccordion } from '@/components/help/ayuda-accordion'

export const metadata: Metadata = {
  title: 'Ayuda',
  description: 'Cómo comprar, envíos, cambios y devoluciones, preguntas frecuentes y contacto.',
  alternates: {
    canonical: '/ayuda',
  },
}

export default function AyudaPage() {
  return (
    <main className="bg-[#FDFBF7]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
        <nav aria-label="Breadcrumb" className="text-xs text-[#9A8A7A]">
          <Link href="/" className="transition-colors hover:text-[#C45A37]">
            Inicio
          </Link>
          <span aria-hidden="true" className="mx-1.5">
            &gt;
          </span>
          <span className="text-[#38271D]">Ayuda</span>
        </nav>

        <header className="mt-3 text-center">
          <h1 className="font-serif text-3xl font-normal tracking-tight text-[#38271D] sm:text-4xl">
            Ayuda
          </h1>
          <span aria-hidden="true" className="mx-auto mt-3 flex items-center justify-center gap-2">
            <span className="block h-px w-10 bg-[#C45A37]/50" />
            <span className="block h-1.5 w-1.5 rotate-45 bg-[#C45A37]" />
            <span className="block h-px w-10 bg-[#C45A37]/50" />
          </span>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[#7A6A5D]">
            Encontrá respuestas sobre tu compra, envíos y contacto.
          </p>
        </header>

        <div className="mt-8">
          <AyudaAccordion />
        </div>
      </div>
    </main>
  )
}
