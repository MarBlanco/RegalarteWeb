import type { Metadata } from 'next'
import Link from 'next/link'
import { AyudaView } from '@/components/help/ayuda-view'

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

        <div className="mt-8">
          <AyudaView />
        </div>
      </div>
    </main>
  )
}
