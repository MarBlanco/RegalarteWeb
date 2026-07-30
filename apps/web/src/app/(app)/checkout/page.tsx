'use client'

import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { CheckoutSummary } from '@/components/checkout/checkout-summary'
import { CheckoutLineList } from '@/components/checkout/checkout-line-list'
import { CheckoutEmptyState } from '@/components/checkout/checkout-empty'
import { useCartStore } from '@/lib/cart'

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const hydrated = useCartStore((s) => s.hydrated)

  return (
    <>
      <Header />
      <main className="flex-1 bg-background">
        <div className="container py-8 lg:py-12">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm">
            <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Inicio
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href="/cart" className="hover:text-foreground">
                  Carrito
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="font-medium text-foreground">Checkout</li>
            </ol>
          </nav>

          <header className="mb-8 lg:mb-12">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Checkout
            </h1>
            <p className="mt-2 text-muted-foreground">
              Confirmá tus datos y dirección para finalizar el pedido.
            </p>
          </header>

          {!hydrated ? (
            <CheckoutSkeleton />
          ) : items.length === 0 ? (
            <CheckoutEmptyState />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <section aria-label="Datos de envío y pago">
                <CheckoutForm />
              </section>
              <aside
                aria-label="Resumen de compra"
                className="space-y-4 lg:sticky lg:top-24 lg:self-start"
              >
                <CheckoutLineList />
                <CheckoutSummary />
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="space-y-6" aria-hidden>
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="space-y-3 p-6">
              <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
              <div className="h-3 w-64 animate-pulse rounded-md bg-muted" />
              <div className="grid gap-4 sm:grid-cols-2">
                {[0, 1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="h-10 animate-pulse rounded-md bg-muted"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        <div className="h-12 animate-pulse rounded-md bg-muted" />
      </section>
      <aside className="space-y-4" aria-hidden>
        <div className="h-48 animate-pulse rounded-lg border bg-card" />
        <div className="h-72 animate-pulse rounded-lg border bg-card" />
      </aside>
    </div>
  )
}
