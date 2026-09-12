'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { ProductTag } from '@/payload-types'
import type { ProductWithImage } from '@/lib/catalog'
import { formatPrice } from '@/lib/format'
import { useWishlistStore } from '@/lib/wishlist/store'
import { AddToCartButton } from '@/components/cart/add-to-cart-button'

export interface ProductCardProps {
  product: ProductWithImage
  /** Badge explícito (mock visual). Si se omite, `featured` → FAVORITO. */
  badge?: 'FAVORITO' | 'NUEVO' | 'IDEAL PARA REGALAR' | null
  /**
   * Fallbacks visuales cuando el producto no trae dato propio (misma ruta
   * de render). Provienen de datos administrables (p. ej. imagen/tagline
   * del tipo), nunca hardcodeados en la UI.
   */
  fallbackImage?: string | null
  fallbackSubtitle?: string | null
}

function tagNames(tags: ProductWithImage['tags']): string[] {
  if (!Array.isArray(tags)) return []
  const names: string[] = []
  for (const t of tags) {
    if (typeof t === 'object' && t && 'name' in t) {
      names.push((t as ProductTag).name)
    }
  }
  return names
}

export function ProductCard({ product, badge, fallbackImage, fallbackSubtitle }: ProductCardProps) {
  const featured = product.featuredImage
  const imageUrl = featured?.url ?? fallbackImage ?? null
  const imageAlt = featured?.alt ?? product.title

  const productId = String(product.id)
  const toggleItem = useWishlistStore((state) => state.toggleItem)
  const inWishlist = useWishlistStore((state) =>
    state.items.some((i) => i.id === productId),
  )

  const aromas = tagNames(product.tags).slice(0, 3).join(' · ')
  const subtitle = aromas || product.seoDescription || fallbackSubtitle || ''

  const wishlistItem = {
    id: productId,
    productId,
    slug: product.slug,
    name: product.title,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    wholesalePrice: product.wholesalePrice ?? null,
    isWholesaleAvailable: Boolean(product.isWholesaleAvailable),
    image: imageUrl,
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleItem(wishlistItem)
  }

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[10px] border border-[#EBDFD1] bg-[#FFFDF9] transition-colors duration-200 hover:border-[#C45A37]/40">
      {/* Imagen */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#F4EDE4]">
        <Link href={`/catalogo/${product.slug}`} aria-label={product.title}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
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

        {/* Badge superior izquierdo: NUEVO, FAVORITO y Mayorista no se renderizan */}
        {badge && badge !== 'NUEVO' && badge !== 'FAVORITO' ? (
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#38271D] shadow-sm">
            {badge}
          </span>
        ) : null}

        {/* Favorito arriba a la derecha */}
        <button
          type="button"
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center text-white transition-colors hover:text-[#C45A37] drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]"
          onClick={handleToggleWishlist}
          aria-label={inWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          aria-pressed={inWishlist}
        >
          <svg
            className={`h-5 w-5 ${inWishlist ? 'fill-[#C45A37] text-[#C45A37]' : 'fill-black/10 stroke-current'}`}
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
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <Link href={`/catalogo/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-[2.6rem] font-serif text-[15px] font-medium leading-snug text-[#38271D] transition-colors group-hover:text-[#C45A37]">
            {product.title}
          </h3>
        </Link>
        <p className="line-clamp-1 min-h-4 text-xs text-[#9A8A7A]">{subtitle}</p>
        <div className="mt-1 flex min-h-[1.75rem] items-baseline gap-1.5">
          <span className="text-[15px] font-bold text-[#38271D]">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <span className="text-xs text-[#9A8A7A] line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          ) : null}
        </div>
        <div className="mt-auto pt-2">
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
              featuredImage: imageUrl
                ? { url: imageUrl, alt: imageAlt }
                : null,
            }}
          />
        </div>
      </div>
    </div>
  )
}
