import { ProductCard } from './product-card'
import type { ProductWithImage } from '@/lib/catalog'

export interface ProductGridProps {
  products: ProductWithImage[]
  /** Badges explícitos por id de producto (mock visual). */
  badges?: Record<number | string, 'FAVORITO' | 'NUEVO' | 'IDEAL PARA REGALAR'>
  /** Fallbacks visuales (datos administrables) si el producto no trae propios. */
  fallbackImage?: string | null
  fallbackSubtitle?: string | null
}

export function ProductGrid({ products, badges, fallbackImage, fallbackSubtitle }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:gap-5">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          badge={badges?.[product.id] ?? null}
          fallbackImage={fallbackImage}
          fallbackSubtitle={fallbackSubtitle}
        />
      ))}
    </div>
  )
}
