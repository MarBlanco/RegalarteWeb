'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCartStore, selectItemCount, selectTotals } from '@/lib/cart'
import { quantityCap } from '@/lib/cart/pricing'
import { formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function CartLineRow({
  id,
  slug,
  name,
  image,
  quantity,
  unitPrice,
  stock = undefined,
}: {
  id: string
  slug: string
  name: string
  image?: { url?: string | null; alt?: string | null } | null
  quantity: number
  unitPrice: number
  stock?: number | null
}) {
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  const stockCap = quantityCap(stock)

  const onDec = () => updateQuantity(id, Math.max(0, quantity - 1))
  const onInc = () =>
    updateQuantity(id, Math.min(stockCap, quantity + 1))

  return (
    <li className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt ?? name}
            fill
            sizes="96px"
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
          href={`/catalogo/${slug}`}
          className="block truncate text-sm font-medium hover:text-primary"
        >
          {name}
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">
          Unitario: <span className="tabular-nums">{formatPrice(unitPrice)}</span>
        </p>
        <div className="mt-3 inline-flex items-center rounded-md border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-none sm:h-8 sm:w-8"
            onClick={onDec}
            aria-label="Disminuir cantidad"
          >
            <span className="text-base leading-none">−</span>
          </Button>
          <span className="min-w-8 border-x px-2 text-center text-sm tabular-nums">
            {quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-none sm:h-8 sm:w-8"
            onClick={onInc}
            disabled={quantity >= stockCap}
            aria-label="Aumentar cantidad"
          >
            <span className="text-base leading-none">+</span>
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
        <span className="whitespace-nowrap text-base font-semibold tabular-nums">
          {formatPrice(unitPrice * quantity)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => removeItem(id)}
          className="min-h-11 text-xs text-muted-foreground hover:text-destructive sm:min-h-0"
        >
          Eliminar
        </Button>
      </div>
    </li>
  )
}
