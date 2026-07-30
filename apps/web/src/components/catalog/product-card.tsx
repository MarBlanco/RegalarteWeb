import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import type { ProductWithImage } from '@/lib/catalog'
import { formatPrice } from '@/lib/format'

export interface ProductCardProps {
  product: ProductWithImage
}

export function ProductCard({ product }: ProductCardProps) {
  const featured = product.featuredImage
  const wholesalePrice =
    typeof product.wholesalePrice === 'number' ? product.wholesalePrice : null
  const showWholesale = product.isWholesaleAvailable && wholesalePrice !== null

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <Link
        href={`/catalogo/${product.slug}`}
        className="flex h-full flex-col"
      >
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {featured?.url ? (
            <Image
              src={featured.url}
              alt={featured.alt ?? product.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Sin imagen
            </div>
          )}
          {product.isSolistica ? (
            <span className="absolute top-2 left-2 rounded-full bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
              Solística
            </span>
          ) : null}
          {showWholesale ? (
            <span className="absolute top-2 right-2 rounded-full bg-wholesale px-2 py-1 text-xs font-medium text-wholesale-foreground">
              Mayorista
            </span>
          ) : null}
        </div>
        <CardContent className="flex flex-1 flex-col gap-1 p-4">
          <h3 className="line-clamp-2 text-base font-medium leading-tight group-hover:text-primary">
            {product.title}
          </h3>
          <div className="mt-auto flex items-baseline gap-2 pt-2">
            <span className="text-lg font-semibold">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice &&
            product.compareAtPrice > product.price ? (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            ) : null}
          </div>
          {showWholesale && wholesalePrice !== null ? (
            <p className="text-xs text-muted-foreground">
              Mayorista: {formatPrice(wholesalePrice)}
            </p>
          ) : null}
        </CardContent>
      </Link>
    </Card>
  )
}
