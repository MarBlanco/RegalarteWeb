'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCartStore, selectUnitPrice } from '@/lib/cart'
import { formatPrice } from '@/lib/format'

export function CheckoutLineRow({
  id,
  slug,
  name,
  image,
  quantity,
  unitPrice,
}: {
  id: string
  slug: string
  name: string
  image?: { url?: string | null; alt?: string | null } | null
  quantity: number
  unitPrice: number
}) {
  return (
    <li className="flex items-center gap-3 py-2">
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt ?? name}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] text-muted-foreground">
            s/i
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Link
          href={`/catalogo/${slug}`}
          className="block truncate text-sm hover:text-primary"
        >
          {name}
        </Link>
        <p className="text-xs text-muted-foreground">
          {quantity} × {formatPrice(unitPrice)}
        </p>
      </div>
      <span className="whitespace-nowrap text-sm font-medium tabular-nums">
        {formatPrice(unitPrice * quantity)}
      </span>
    </li>
  )
}

export function CheckoutLineList() {
  const items = useCartStore((s) => s.items)
  const mode = useCartStore((s) => s.mode)

  return (
    <ul className="divide-y">
      {items.map((item) => (
        <CheckoutLineRow
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
  )
}
