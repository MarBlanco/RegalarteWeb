import { ProductCard } from './product-card'
import type { ProductWithImage } from '@/lib/catalog'

export interface ProductGridProps {
  products: ProductWithImage[]
}

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
