'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { ProductWithImage } from '@/lib/catalog'
import { formatPrice } from '@/lib/format'
import { useWishlistStore } from '@/lib/wishlist/store'
import { AddToCartButton } from '@/components/cart/add-to-cart-button'

export interface ProductCardProps {
  product: ProductWithImage
}

export function ProductCard({ product }: ProductCardProps) {
  const featured = product.featuredImage
  const wholesalePrice =
    typeof product.wholesalePrice === 'number' ? product.wholesalePrice : null
  const showWholesale = product.isWholesaleAvailable && wholesalePrice !== null

  const { items, toggleItem } = useWishlistStore((state) => ({
    items: state.items,
    toggleItem: state.toggleItem,
  }))

  const inWishlist = items.some((i) => i.id === String(product.id))

  const wishlistItem = {
    id: String(product.id),
    productId: String(product.id),
    slug: product.slug,
    name: product.title,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    wholesalePrice: product.wholesalePrice ?? null,
    isWholesaleAvailable: Boolean(product.isWholesaleAvailable),
    image: featured?.url ?? null,
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleItem(wishlistItem)
  }

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-md border border-[#E5DDD1] bg-card transition-colors duration-200 hover:border-[#C45A37]/50">
      {/* Imagen (~65% de la altura visual de la card) */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F4EDE4]">
        <Link href={`/catalogo/${product.slug}`} aria-label={product.title}>
          {featured?.url ? (
            <Image
              src={featured.url}
              alt={featured.alt ?? product.title}
              fill
              sizes="(min-width: 1200px) 22vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-[#9A8A7A]">
              Sin imagen
            </span>
          )}
        </Link>

        {/* Badges discretos */}
        {product.isSolistica ? (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-[#F4EDE4]/95 px-2 py-0.5 text-[10px] font-medium text-[#C45A37]">
            Solística
          </span>
        ) : null}
        {showWholesale ? (
          <span className="absolute bottom-1.5 left-1.5 rounded-full bg-[#F4EDE4]/95 px-2 py-0.5 text-[10px] font-medium text-[#8A6A2F]">
            Mayorista
          </span>
        ) : null}

        {/* Corazón Wishlist (esquina superior derecha) */}
        <button
          type="button"
          className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground transition-colors hover:text-destructive"
          onClick={handleToggleWishlist}
          aria-label={inWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          aria-pressed={inWishlist}
        >
          <svg
            className={`h-4 w-4 transition-colors ${inWishlist ? 'fill-current text-destructive' : 'fill-none stroke-current'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.16-1.16a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06a2 2 0 0 0 2.83 0L12 8.67l5.16 5.16a2 2 0 0 0 2.83 0l1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link href={`/catalogo/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-[2.1rem] text-sm font-medium leading-snug text-[#38271D] transition-colors group-hover:text-[#C45A37]">
            {product.title}
          </h3>
        </Link>
        {product.seoDescription ? (
          <p className="line-clamp-1 text-xs text-[#9A8A7A]">
            {product.seoDescription}
          </p>
        ) : null}
        <div className="mt-auto flex items-baseline gap-1.5 pt-1">
          <span className="text-sm font-bold text-[#C45A37]">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <span className="text-xs text-[#9A8A7A] line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          ) : null}
        </div>
        <AddToCartButton
          compact
          product={{
            id: product.id,
            slug: product.slug,
            title: product.title,
            price: product.price,
            compareAtPrice: product.compareAtPrice ?? null,
            wholesalePrice: product.wholesalePrice ?? null,
            isWholesaleAvailable: Boolean(product.isWholesaleAvailable),
            featuredImage: featured
              ? { url: featured.url ?? null, alt: featured.alt ?? null }
              : null,
          }}
          className="mt-2"
        />
      </div>
    </div>
  )
}