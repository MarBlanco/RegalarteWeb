import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { fetchProducts } from '@/lib/catalog'
import { ProductGrid } from '@/components/catalog/product-grid'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Solística',
  description:
    'Solística es el universo sensorial de Regalarte: velas, difusores, home sprays, aromas y bienestar para transformar espacios.',
  alternates: {
    canonical: '/solistica',
  },
}

export const revalidate = 30

const categories = [
  { title: 'Velas', description: 'Luz, calma y ritual para cada momento.' },
  { title: 'Difusores', description: 'Aromas que acompañan tu espacio.' },
  { title: 'Home Sprays', description: 'Frescor y bienestar para el hogar.' },
  { title: 'Aromas', description: 'Esencias que transforman la atmósfera.' },
  { title: 'Bienestar', description: 'Rituales para pausar y respirar.' },
]

export default async function SolisticaPage() {
  const products = await fetchProducts({ isSolistica: true, sort: 'sortOrder' }, 1, 12)

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden">
        <div className="relative h-[420px] w-full sm:h-[520px] lg:h-[600px]">
          <Image
            src="/images/hero/hero-solistica.webp"
            alt="Solística · universo sensorial de Regalarte"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/20 to-background" />
          <div className="container relative flex h-full flex-col items-center justify-center text-center">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Universo sensorial de Regalarte
            </p>
            <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Solística
            </h1>
            <p className="mt-4 max-w-xl text-base text-foreground/80 sm:text-lg">
              Creá experiencias sensoriales. Transformá espacios. Generá
              bienestar.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="xl" variant="secondary">
                <Link href="#productos">Descubrir aromas</Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link href="/catalogo">Ver catálogo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Rituales para cada espacio
          </p>
          <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            Una pausa contemplativa
          </h2>
          <p className="mt-4 text-muted-foreground">
            Solística propone un ritmo más lento, más contemplativo. Velas,
            aromas y objetos que convierten tu hogar en un refugio sensorial.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.title}
              href={`/catalogo?category=${encodeURIComponent(category.title)}`}
              className="group flex flex-col justify-between rounded-xl border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <h3 className="font-serif text-lg font-semibold">
                {category.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section
        id="productos"
        className="border-t bg-muted/30 py-16 lg:py-24"
      >
        <div className="container">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
                Curaduría Solística
              </p>
              <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight">
                Nuestros aromas
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/catalogo">Ver todo el catálogo</Link>
            </Button>
          </div>

          {products.docs.length === 0 ? (
            <div className="mt-12 rounded-xl border bg-card p-12 text-center">
              <h3 className="text-lg font-semibold">
                Muy pronto, más aromas
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Estamos curando la colección Solística. Volvé pronto para
                descubrirla.
              </p>
            </div>
          ) : (
            <div className="mt-10">
              <ProductGrid products={products.docs} />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}