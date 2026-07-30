'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCartStore, selectItemCount, selectTotals } from '@/lib/cart'
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

  const stockCap =
    typeof stock === 'number' && Number.isFinite(stock) && stock > 0
      ? stock
      : undefined

  const onDec = () => updateQuantity(id, Math.max(0, quantity - 1))
  const onInc = () =>
    updateQuantity(id, Math.min(stockCap ?? Number.POSITIVE_INFINITY, quantity + 1))

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
            className="h-8 w-8 rounded-none"
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
            className="h-8 w-8 rounded-none"
            onClick={onInc}
            disabled={typeof stockCap === 'number' && quantity >= stockCap}
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
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          Eliminar
        </Button>
      </div>
    </li>
  )
}
