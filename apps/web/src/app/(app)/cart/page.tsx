'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RitualCard } from '@/components/cart/ritual-card'
import { BenefitsBlock } from '@/components/catalog/benefits-block'
import {
  freeShippingProgress,
  selectItemCount,
  selectTotals,
  selectUnitPrice,
  useCartStore,
} from '@/lib/cart'
import { MOCK_PRODUCTS } from '@/components/catalog/catalog-mock'
import { formatPrice } from '@/lib/format'
import { useShallow } from 'zustand/react/shallow'

function TrashIcon({ className = 'h-[18px] w-[18px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const mode = useCartStore((s) => s.mode)
  const hydrated = useCartStore((s) => s.hydrated)
  const clearCart = useCartStore((s) => s.clearCart)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const itemCount = useCartStore(selectItemCount)
  const totals = useCartStore(
    useShallow((s) => selectTotals({ items: s.items, mode: s.mode })),
  )

  const ship = freeShippingProgress(totals.subtotal)
  const ritualProducts = MOCK_PRODUCTS.slice(0, 5).map((p) => ({
    id: String(p.id),
    slug: p.slug,
    name: p.title,
    price: p.price,
    image: p.featuredImage?.url ?? null,
  }))

  return (
    <main className="flex-1 bg-[#FDFBF7]">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
        <nav aria-label="Breadcrumb" className="text-xs text-[#9A8A7A]">
          <Link href="/" className="transition-colors hover:text-[#C45A37]">
            Inicio
          </Link>
          <span aria-hidden="true" className="mx-1.5">
            &gt;
          </span>
          <span className="text-[#38271D]">Carrito</span>
        </nav>

        <header className="mt-2">
          <h1 className="flex items-center gap-2 font-serif text-3xl font-normal tracking-tight text-[#38271D] sm:text-4xl">
            Tu carrito
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-[#B85C33]" aria-hidden="true">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </h1>
          <p className="mt-1.5 text-sm text-[#7A6A5D]">
            {!hydrated
              ? 'Cargando carrito…'
              : itemCount === 0
                ? 'Tu carrito está vacío.'
                : 'Revisá tus productos y continuá con tu compra.'}
          </p>
        </header>

        {!hydrated ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="h-64 animate-pulse rounded-lg border border-[#EBDFD1] bg-[#FCF8F1]" aria-hidden />
            <div className="h-72 animate-pulse rounded-lg border border-[#EBDFD1] bg-[#FCF8F1]" aria-hidden />
          </div>
        ) : items.length === 0 ? (
          <CartEmptyState />
        ) : (
          <>
            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
              <section aria-label="Productos en el carrito" className="min-w-0">
                {/* Barra de envío gratis */}
                <div className="rounded-lg border border-[#EBDFD1] bg-[#FCF8F1] p-4">
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 text-[#B85C33]" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
                        <path d="M1 8h13v9H1z" />
                        <path d="M14 11h4l3 3v3h-7z" />
                        <circle cx="5.5" cy="17.5" r="1.8" />
                        <circle cx="17.5" cy="17.5" r="1.8" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[#38271D]">
                        {ship.reached ? (
                          <>¡Tenés envío gratis!</>
                        ) : (
                          <>¡Estás a {formatPrice(ship.remaining)} del envío gratis!</>
                        )}
                      </p>
                      <div
                        className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E5DDD1]"
                        role="progressbar"
                        aria-valuenow={ship.pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Progreso hacia el envío gratis"
                      >
                        <div
                          className="h-full rounded-full bg-[#B85C33] transition-all"
                          style={{ width: `${ship.pct}%` }}
                        />
                      </div>
                    </div>
                    {!ship.reached ? (
                      <p className="hidden shrink-0 text-xs text-[#7A6A5D] sm:block">
                        Te faltan {formatPrice(ship.remaining)}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Tabla de líneas */}
                <div className="mt-4 overflow-hidden rounded-lg border border-[#EBDFD1] bg-[#FFFDF9]">
                  <div
                    aria-hidden="true"
                    className="hidden grid-cols-[1fr_120px_140px_100px_40px] items-center gap-3 border-b border-[#EBDFD1] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9A8A7A] md:grid"
                  >
                    <span>Producto</span>
                    <span className="text-center">Precio unitario</span>
                    <span className="text-center">Cantidad</span>
                    <span className="text-right">Subtotal</span>
                    <span />
                  </div>
                  <ul className="divide-y divide-[#EBDFD1]/70">
                    {items.map((item) => {
                      const unit = selectUnitPrice(item, mode)
                      const lineTotal = unit * item.quantity
                      return (
                        <li
                          key={item.id}
                          className="grid grid-cols-[72px_1fr] gap-3 px-4 py-4 sm:grid-cols-[88px_1fr_auto] md:grid-cols-[1fr_120px_140px_100px_40px] md:items-center"
                        >
                          <div className="flex gap-3 md:contents">
                            <Link
                              href={`/catalogo/${item.slug}`}
                              className="relative block h-[72px] w-[72px] shrink-0 overflow-hidden rounded-md bg-[#F4EDE4] sm:h-[88px] sm:w-[88px]"
                              aria-label={item.name}
                            >
                              {item.image?.url ? (
                                <Image
                                  src={item.image.url}
                                  alt={item.image.alt ?? item.name}
                                  fill
                                  sizes="88px"
                                  className="object-cover"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-[#9A8A7A]">
                                  Sin imagen
                                </span>
                              )}
                            </Link>
                            <div className="min-w-0">
                              <Link
                                href={`/catalogo/${item.slug}`}
                                className="block text-sm font-medium leading-snug text-[#38271D] hover:text-[#C45A37]"
                              >
                                {item.name}
                              </Link>
                              {item.wholesalePrice != null && item.isWholesaleAvailable ? (
                                <p className="mt-0.5 text-xs tabular-nums text-[#7A6A5D]">
                                  Mayorista: {formatPrice(item.wholesalePrice)}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <p className="hidden whitespace-nowrap text-center text-sm tabular-nums text-[#38271D] md:block">
                            {formatPrice(unit)}
                          </p>

                          <div className="col-span-2 flex items-center gap-3 sm:col-span-1 md:col-auto md:justify-center">
                            <div className="inline-flex items-center rounded-md border border-[#E5DDD1] bg-background">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                aria-label="Disminuir cantidad"
                                className="flex h-8 w-8 items-center justify-center text-[#B85C33]"
                              >
                                <span className="text-base leading-none">−</span>
                              </button>
                              <span
                                className="w-7 text-center text-sm tabular-nums text-[#38271D]"
                                aria-live="polite"
                              >
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                aria-label="Aumentar cantidad"
                                className="flex h-8 w-8 items-center justify-center text-[#B85C33]"
                              >
                                <span className="text-base leading-none">+</span>
                              </button>
                            </div>
                            <p className="whitespace-nowrap text-sm font-bold tabular-nums text-[#38271D] md:hidden">
                              {formatPrice(lineTotal)}
                            </p>
                          </div>

                          <p className="hidden whitespace-nowrap text-right text-sm font-bold tabular-nums text-[#38271D] md:block">
                            {formatPrice(lineTotal)}
                          </p>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            aria-label={`Eliminar ${item.name} del carrito`}
                            className="col-start-2 row-start-1 self-start justify-self-end text-[#B85C33] transition-colors hover:text-[#9E4E2B] md:col-auto md:row-auto md:self-center md:justify-self-end"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href="/catalogo"
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#B85C33] hover:text-[#9E4E2B]"
                  >
                    <span aria-hidden="true">←</span> Seguir comprando
                  </Link>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#B85C33] hover:text-[#9E4E2B]"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Vaciar carrito
                  </button>
                </div>
              </section>

              <aside aria-label="Resumen del pedido" className="lg:sticky lg:top-32">
                <div className="rounded-lg border border-[#EBDFD1] bg-[#FCF8F1] p-5">
                  <h2 className="font-serif text-lg font-medium text-[#38271D]">
                    Resumen del pedido
                  </h2>
                  <dl className="mt-4 space-y-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-[#5C4A3D]">Productos ({itemCount})</dt>
                      <dd className="font-medium tabular-nums text-[#38271D]">
                        {formatPrice(totals.subtotal)}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-[#5C4A3D]">
                        Envío
                        <span className="block text-[11px] text-[#9A8A7A]">
                          {ship.reached
                            ? 'Llega entre 2 y 4 días hábiles'
                            : 'Se calcula en el checkout'}
                        </span>
                      </dt>
                      <dd className="font-medium tabular-nums text-[#38271D]">
                        {ship.reached ? 'Gratis' : 'A calcular'}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex items-center justify-between border-t border-[#EBDFD1] pt-4">
                    <span className="font-serif text-lg text-[#38271D]">Total</span>
                    <span className="text-xl font-bold tabular-nums text-[#B85C33]">
                      {formatPrice(totals.subtotal)}
                    </span>
                  </div>
                  <Button
                    asChild
                    size="lg"
                    className="mt-4 h-11 w-full rounded-md bg-[#B85C33] text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#9E4E2B]"
                  >
                    <Link href="/checkout">Continuar →</Link>
                  </Button>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#7A6A5D]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                      <rect x="4" y="10" width="16" height="10" rx="1.5" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                    Compra 100% segura
                  </p>
                </div>
              </aside>
            </div>

            {/* Completá tu ritual */}
            <section aria-label="Completá tu ritual" className="mt-12">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-normal tracking-tight text-[#38271D] sm:text-[28px]">
                    Completá tu ritual
                  </h2>
                  <p className="mt-1 text-[13px] text-[#7A6A5D]">
                    Elegí estos productos para que tu experiencia sea aún más especial.
                  </p>
                </div>
                <Link
                  href="/catalogo"
                  className="shrink-0 text-[13px] font-medium text-[#B85C33] hover:text-[#9E4E2B]"
                >
                  Ver todos →
                </Link>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                {ritualProducts.map((p) => (
                  <RitualCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <div className="mt-12">
        <BenefitsBlock />
      </div>
    </main>
  )
}

function CartEmptyState() {
  return (
    <div className="mt-6 rounded-lg border border-[#EBDFD1] bg-[#FFFDF9] p-12 text-center">
      <h2 className="font-serif text-2xl font-normal text-[#38271D]">
        Tu carrito está vacío
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[#7A6A5D]">
        Descubrí productos especiales para cada ocasión.
      </p>
      <Button
        asChild
        className="mt-5 h-11 rounded-md bg-[#B85C33] px-8 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#9E4E2B]"
      >
        <Link href="/catalogo">Explorar catálogo</Link>
      </Button>
    </div>
  )
}
