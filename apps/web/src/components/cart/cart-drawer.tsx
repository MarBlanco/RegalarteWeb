'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  selectItemCount,
  selectTotals,
  selectUnitPrice,
  useCartStore,
} from '@/lib/cart'
import { useCartUIStore } from '@/lib/cart/ui-store'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface CartDrawerProps {
  className?: string
}

export function CartDrawer({ className }: CartDrawerProps) {
  const isOpen = useCartUIStore((s) => s.isOpen)
  const close = useCartUIStore((s) => s.close)

  const items = useCartStore((s) => s.items)
  const mode = useCartStore((s) => s.mode)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const hydrated = useCartStore((s) => s.hydrated)

  const itemCount = useCartStore(selectItemCount)
  const totals = useCartStore((s) => selectTotals({ items: s.items, mode: s.mode }))

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  const handleDecrement = useCallback(
    (id: string, currentQty: number) => {
      updateQuantity(id, Math.max(0, currentQty - 1))
    },
    [updateQuantity],
  )
  const handleIncrement = useCallback(
    (id: string, currentQty: number) => {
      updateQuantity(id, currentQty + 1)
    },
    [updateQuantity],
  )

  return (
    <div
      aria-hidden={!isOpen}
      className={cn('pointer-events-none fixed inset-0 z-50', className)}
    >
      <div
        onClick={close}
        className={cn(
          'absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrito"
        className={cn(
          'pointer-events-auto absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l bg-background shadow-xl transition-transform duration-200 ease-out sm:max-w-lg',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
          <div>
            <h2 className="text-base font-semibold">Tu carrito</h2>
            <p className="text-xs text-muted-foreground">
              {hydrated
                ? itemCount === 0
                  ? 'Aún no agregaste productos'
                  : `${itemCount} ${
                      itemCount === 1 ? 'producto' : 'productos'
                    } en el carrito`
                : 'Cargando carrito…'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={close} aria-label="Cerrar">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {hydrated && items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">
                Tu carrito está vacío.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/catalogo" onClick={close}>
                  Explorar catálogo
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const unitPrice = selectUnitPrice(item, mode)
                const lineTotal = unitPrice * item.quantity
                return (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-lg border bg-card p-3"
                  >
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.image?.url ? (
                        <Image
                          src={item.image.url}
                          alt={item.image.alt ?? item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/catalogo/${item.slug}`}
                        onClick={close}
                        className="block truncate text-sm font-medium hover:text-primary"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Unitario: {formatPrice(unitPrice)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDecrement(item.id, item.quantity)}
                          aria-label="Disminuir cantidad"
                        >
                          <span className="text-base leading-none">−</span>
                        </Button>
                        <span
                          className="min-w-6 text-center text-sm tabular-nums"
                          aria-live="polite"
                        >
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleIncrement(item.id, item.quantity)}
                          aria-label="Aumentar cantidad"
                        >
                          <span className="text-base leading-none">+</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-auto text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatPrice(lineTotal)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ×{item.quantity}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <footer className="border-t px-4 py-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular-nums">
              {formatPrice(totals.subtotal)}
            </span>
          </div>
          <div className="mb-4 flex items-center justify-between text-base">
            <span className="font-semibold">Total</span>
            <span className="font-semibold tabular-nums">
              {formatPrice(totals.subtotal)}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              asChild
              size="lg"
              className="w-full"
              disabled={!hydrated || items.length === 0}
            >
              <Link href="/cart" onClick={close}>
                Ir al carrito
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearCart}
              disabled={!hydrated || items.length === 0}
            >
              Vaciar carrito
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Los envíos y el checkout se calculan en el siguiente paso.
            </p>
          </div>
        </footer>
      </aside>
    </div>
  )
}
