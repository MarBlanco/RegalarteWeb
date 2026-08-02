import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Regalarte',
  description:
    'Encontrá el regalo perfecto. Ideas únicas para cada persona, ocasión y presupuesto.',
  openGraph: {
    title: 'Regalarte',
    description:
      'Encontrá el regalo perfecto. Ideas únicas para cada persona, ocasión y presupuesto.',
    url: '/',
    siteName: 'Regalarte',
    locale: 'es_AR',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Regalarte',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Regalarte',
    description:
      'Encontrá el regalo perfecto. Ideas únicas para cada persona, ocasión y presupuesto.',
    images: ['/opengraph-image'],
  },
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-balance">
              Encontrá el{' '}
              <span className="text-primary">regalo perfecto</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto">
              No sabés qué regalar? Descubrí ideas únicas para cada persona, ocasión y
              presupuesto.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="xl">
              <Link href="/gift-finder">Descubrir regalos</Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link href="/catalogo">Ver catálogo</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mt-12">
            {[
              { label: 'Por personalidad', href: '/personalidad' },
              { label: 'Por ocasión', href: '/ocasion' },
              { label: 'Armá tu regalo', href: '/armatu-regalo' },
              { label: 'Caja sorpresa', href: '/caja-sorpresa' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-center rounded-xl border bg-card p-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
