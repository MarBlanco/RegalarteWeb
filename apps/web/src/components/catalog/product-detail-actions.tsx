'use client'

import { useState } from 'react'
import type { CartItemInput } from '@/lib/cart'
import { useCartStore, useCartUIStore } from '@/lib/cart'
import { useWishlistStore } from '@/lib/wishlist/store'
import { trackAddToCart } from '@/lib/analytics/ga'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface DetailProductInput {
  id: number | string
  slug: string
  title: string
  price: number
  compareAtPrice?: number | null
  wholesalePrice?: number | null
  isWholesaleAvailable?: boolean | null
  featuredImage?: { url?: string | null; alt?: string | null } | null
}

interface ProductDetailActionsProps {
  product: DetailProductInput
  stock?: number | null
}

/**
 * Acciones del PDP: stepper de cantidad, CTA terracota y círculo de
 * wishlist. Usa las acciones reales del carrito/wishlist.
 */
export function ProductDetailActions({ product, stock = null }: ProductDetailActionsProps) {
  const addItem = useCartStore((s) => s.addItem)
  const hydrated = useCartStore((s) => s.hydrated)
  const openCart = useCartUIStore((s) => s.open)
  const toggleWishlist = useWishlistStore((s) => s.toggleItem)
  const inWishlist = useWishlistStore((s) =>
    s.items.some((i) => i.id === String(product.id)),
  )
  const [quantity, setQuantity] = useState(1)
  const [justAdded, setJustAdded] = useState(false)

  const isOutOfStock =
    typeof stock === 'number' && Number.isFinite(stock) && stock <= 0
  const stockCap =
    typeof stock === 'number' && Number.isFinite(stock) && stock > 0
      ? stock
      : undefined
  const clamp = (v: number) => {
    const cap = stockCap ?? Number.POSITIVE_INFINITY
    return Math.max(1, Math.min(cap, Math.floor(v)))
  }

  const handleAdd = () => {
    const input: CartItemInput = {
      id: String(product.id),
      productId: String(product.id),
      slug: product.slug,
      name: product.title,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      wholesalePrice: product.wholesalePrice ?? null,
      isWholesaleAvailable: Boolean(product.isWholesaleAvailable),
      image: product.featuredImage
        ? {
            url: product.featuredImage.url ?? null,
            alt: product.featuredImage.alt ?? null,
          }
        : null,
      quantity,
    }
    addItem(input)
    trackAddToCart(input)
    setJustAdded(true)
    openCart()
    window.setTimeout(() => setJustAdded(false), 1600)
  }

  const handleToggleWishlist = () => {
    toggleWishlist({
      id: String(product.id),
      productId: String(product.id),
      slug: product.slug,
      name: product.title,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      wholesalePrice: product.wholesalePrice ?? null,
      isWholesaleAvailable: Boolean(product.isWholesaleAvailable),
      image: product.featuredImage?.url ?? null,
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <span className="text-xs text-[#7A6A5D]">Cantidad</span>
        <div className="mt-1.5 inline-flex items-center rounded-md border border-[#E5DDD1] bg-background">
          <button
            type="button"
            onClick={() => setQuantity((q) => clamp(q - 1))}
            disabled={quantity <= 1}
            aria-label="Disminuir cantidad"
            className="flex h-9 w-9 items-center justify-center text-[#38271D] disabled:opacity-40"
          >
            <span className="text-base leading-none">−</span>
          </button>
          <span
            className="w-8 text-center text-sm tabular-nums text-[#38271D]"
            aria-live="polite"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => clamp(q + 1))}
            disabled={typeof stockCap === 'number' && quantity >= stockCap}
            aria-label="Aumentar cantidad"
            className="flex h-9 w-9 items-center justify-center text-[#38271D] disabled:opacity-40"
          >
            <span className="text-base leading-none">+</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={handleAdd}
          disabled={!hydrated || isOutOfStock}
          className="h-11 flex-1 rounded-md bg-[#B85C33] text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#9E4E2B]"
        >
          {isOutOfStock
            ? 'Sin stock'
            : justAdded
              ? 'Agregado ✓'
              : 'Agregar al carrito'}
        </Button>
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={inWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          aria-pressed={inWishlist}
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors',
            inWishlist
              ? 'border-[#C45A37]/50 text-[#C45A37]'
              : 'border-[#E5DDD1] text-[#7A6A5D] hover:border-[#C45A37]/50 hover:text-[#C45A37]',
          )}
        >
          <svg
            viewBox="0 0 24 24"
            fill={inWishlist ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
