'use client'

import Link from 'next/link'
import { CartLineRow } from '@/components/cart/cart-line-row'
import { CartSummary as CartSummaryCard } from '@/components/cart/cart-summary'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import {
  selectItemCount,
  selectTotals,
  selectUnitPrice,
  useCartStore,
} from '@/lib/cart'
import { formatPrice } from '@/lib/format'

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const mode = useCartStore((s) => s.mode)
  const hydrated = useCartStore((s) => s.hydrated)
  const clearCart = useCartStore((s) => s.clearCart)
  const itemCount = useCartStore(selectItemCount)
  const totals = useCartStore((s) =>
    selectTotals({ items: s.items, mode: s.mode }),
  )

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
              <li className="font-medium text-foreground">Carrito</li>
            </ol>
          </nav>

          <header className="mb-8 lg:mb-12">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Carrito
            </h1>
            <p className="mt-2 text-muted-foreground">
              {hydrated
                ? itemCount === 0
                  ? 'Tu carrito está vacío.'
                  : `${itemCount} ${
                      itemCount === 1 ? 'producto' : 'productos'
                    } listos para checkout.`
                : 'Cargando carrito…'}
            </p>
          </header>

          {!hydrated ? (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-32 animate-pulse rounded-lg border bg-card"
                    aria-hidden
                  />
                ))}
              </div>
              <div className="h-72 animate-pulse rounded-lg border bg-card" aria-hidden />
            </div>
          ) : items.length === 0 ? (
            <CartEmptyState />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <section aria-label="Productos en el carrito">
                <ul className="space-y-4">
                  {items.map((item) => (
                    <CartLineRow
                      key={item.id}
                      id={item.id}
                      slug={item.slug}
                      name={item.name}
                      image={item.image ?? null}
                      quantity={item.quantity}
                      unitPrice={selectUnitPrice(item, mode)}
                    />
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <Button
                    asChild
                    type="button"
                    variant="outline"
                    size="sm"
                  >
                    <Link href="/catalogo">Seguir comprando</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Vaciar carrito
                  </Button>
                </div>
              </section>
              <aside aria-label="Resumen de compra" className="lg:sticky lg:top-24 lg:self-start">
                <CartSummaryCard />
                <div className="mt-4 flex flex-col gap-2">
                  <Button asChild size="lg" className="w-full">
                    <Link href="/checkout">Continuar con el checkout</Link>
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    Te pediremos datos de envío tras confirmar el pedido.
                  </p>
                </div>
                <div className="sr-only" aria-live="polite">
                  Subtotal {formatPrice(totals.subtotal)}
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function CartEmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <span
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
        </span>
        <h2 className="text-lg font-semibold">Tu carrito está vacío</h2>
        <p className="text-sm text-muted-foreground">
          Descubrí productos especiales para cada ocasión. Te esperan ideas de regalo
          con curaduría REGALARTE.
        </p>
        <div className="mt-2">
          <Button asChild size="lg">
            <Link href="/catalogo">Explorar catálogo</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
