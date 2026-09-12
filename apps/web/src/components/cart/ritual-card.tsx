'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { CartItemInput } from '@/lib/cart'
import { useCartStore, useCartUIStore } from '@/lib/cart'
import { trackAddToCart } from '@/lib/analytics/ga'
import { formatPrice } from '@/lib/format'

export interface RitualProduct {
  id: string
  slug: string
  name: string
  price: number
  image: string | null
}

/**
 * Mini card "Completá tu ritual": imagen, nombre, precio y botón + que
 * agrega al carrito (acción real). Todo clickeable al PDP.
 */
export function RitualCard({ product }: { product: RitualProduct }) {
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartUIStore((s) => s.open)

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const input: CartItemInput = {
      id: product.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      compareAtPrice: null,
      wholesalePrice: null,
      isWholesaleAvailable: false,
      image: product.image ? { url: product.image, alt: product.name } : null,
      quantity: 1,
    }
    addItem(input)
    trackAddToCart(input)
    openCart()
  }

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-lg border border-[#EBDFD1] bg-[#FFFDF9]">
      <Link
        href={`/catalogo/${product.slug}`}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-[#F4EDE4]"
        aria-label={product.name}
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 45vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs text-[#9A8A7A]">
            Sin imagen
          </span>
        )}
      </Link>
      <div className="flex flex-1 items-start justify-between gap-2 p-3">
        <div className="min-w-0">
          <Link href={`/catalogo/${product.slug}`}>
            <h3 className="truncate text-[13px] font-medium text-[#38271D] group-hover:text-[#C45A37]">
              {product.name}
            </h3>
          </Link>
          <p className="mt-0.5 text-[13px] font-bold tabular-nums text-[#38271D]">
            {formatPrice(product.price)}
          </p>
        </div>
        <button
          type="button"
          onClick={handleQuickAdd}
          aria-label={`Agregar ${product.name} al carrito`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#E5DDD1] text-[#B85C33] transition-colors hover:border-[#C45A37]/60 hover:text-[#C45A37]"
        >
          <span className="text-base leading-none">+</span>
        </button>
      </div>
    </div>
  )
}
