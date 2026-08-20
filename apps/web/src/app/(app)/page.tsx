import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Inicio',
  description:
    'Encontrá el regalo perfecto. Ideas únicas para cada persona, ocasión y presupuesto. Universo Solística y Regalarte.',
  alternates: {
    canonical: '/',
  },
}

export default function HomePage() {
  return (
    <section className="relative h-[560px] w-full overflow-hidden sm:h-[600px] lg:h-[650px]">
      <Image
        src="/assets/hero-solistica.webp"
        alt="Velas y aromas de Solística para transformar tu casa"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 z-10 flex items-center">
        <div className="w-full px-6 sm:px-10 lg:pl-[6.8vw] lg:pr-0">
          <div className="max-w-[500px]">
            <span aria-hidden className="mb-6 block h-[2px] w-[48px] bg-primary" />
            <h1 className="font-serif text-[44px] font-normal leading-[1.05] tracking-tight text-white sm:text-[48px] lg:text-[54px]">
              Aromas que transforman tu casa en tu lugar feliz.
            </h1>
            <p className="mt-6 max-w-[500px] text-[17px] leading-[1.5] text-white sm:text-[18px]">
              Velas, home sprays, difusores y wax melts para rituales
              cotidianos, perfumar tus espacios y regalar bienestar.
            </p>
            <Button
              asChild
              className="mt-8 h-[52px] w-[190px] uppercase tracking-wider"
            >
              <Link href="/solistica">Ver colección</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
