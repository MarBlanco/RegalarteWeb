'use client'

import { useState } from 'react'
import type { CartItemInput } from '@/lib/cart'
import { useCartStore, useCartUIStore } from '@/lib/cart'
import { Button } from '@/components/ui/button'

export interface AddToCartButtonProps {
  product: {
    id: number | string
    slug: string
    title: string
    price: number
    compareAtPrice?: number | null
    wholesalePrice?: number | null
    isWholesaleAvailable?: boolean | null
    featuredImage?: {
      url?: string | null
      alt?: string | null
    } | null
  }
  /** Stock opcional; si se provee, limita la cantidad maxima seleccionable. */
  stock?: number | null
  /** Cantidad inicial (default 1). */
  defaultQuantity?: number
  className?: string
}

export function AddToCartButton({
  product,
  stock = null,
  defaultQuantity = 1,
  className,
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem)
  const hydrated = useCartStore((s) => s.hydrated)
  const openCart = useCartUIStore((s) => s.open)
  const [quantity, setQuantity] = useState<number>(defaultQuantity)
  const [justAdded, setJustAdded] = useState(false)

  const isOutOfStock =
    typeof stock === 'number' && Number.isFinite(stock) && stock <= 0
  const stockCap =
    typeof stock === 'number' && Number.isFinite(stock) && stock > 0
      ? stock
      : undefined

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
    setJustAdded(true)
    openCart()
    window.setTimeout(() => setJustAdded(false), 1600)
  }

  return (
    <div className={className}>
      <div className="mb-3 flex items-center gap-3">
        <label
          htmlFor={`quantity-${product.id}`}
          className="text-sm font-medium"
        >
          Cantidad
        </label>
        <div className="inline-flex items-center rounded-md border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-none"
            onClick={() =>
              setQuantity((q) => Math.max(1, q - 1))
            }
            disabled={quantity <= 1}
            aria-label="Disminuir cantidad"
          >
            <span className="text-base leading-none">−</span>
          </Button>
          <input
            id={`quantity-${product.id}`}
            type="number"
            min={1}
            max={stockCap}
            value={quantity}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (!Number.isFinite(v)) return
              const cap = stockCap ?? Number.POSITIVE_INFINITY
              setQuantity(Math.max(1, Math.min(cap, Math.floor(v))))
            }}
            className="h-9 w-12 border-x bg-background text-center text-sm tabular-nums outline-none"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-none"
            onClick={() =>
              setQuantity((q) => {
                const cap = stockCap ?? Number.POSITIVE_INFINITY
                return Math.min(cap, q + 1)
              })
            }
            disabled={typeof stockCap === 'number' && quantity >= stockCap}
            aria-label="Aumentar cantidad"
          >
            <span className="text-base leading-none">+</span>
          </Button>
        </div>
        {typeof stockCap === 'number' ? (
          <span className="text-xs text-muted-foreground">
            Máx: {stockCap}
          </span>
        ) : null}
      </div>
      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={handleAdd}
        disabled={!hydrated || isOutOfStock}
      >
        {isOutOfStock
          ? 'Sin stock'
          : justAdded
            ? 'Agregado ✓'
            : 'Agregar al carrito'}
      </Button>
    </div>
  )
}
