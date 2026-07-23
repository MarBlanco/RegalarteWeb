'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    shortDescription?: string
    price: number
    wholesalePrice?: number
    isWholesaleAvailable: boolean
    isFeatured?: boolean
    images?: Array<{
      image: { url: string; alt?: string }
      isPrimary?: boolean
    }>
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const { isWholesale } = useAuth()
  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0]
  const showWholesale = isWholesale() && product.isWholesaleAvailable && product.wholesalePrice
  const displayPrice = showWholesale ? product.wholesalePrice! : product.price

  function formatPrice(price: number) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Card className="flex flex-col h-full group">
      <Link href={`/producto/${product.slug}`} className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-muted/50">
        {primaryImage?.image?.url ? (
          <Image
            src={primaryImage.image.url}
            alt={primaryImage.image.alt || product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Sin imagen
          </div>
        )}
        {(product.isWholesaleAvailable || product.isFeatured) && (
          <div className="absolute top-2 left-2 flex gap-1">
            {product.isFeatured && (
              <Badge variant="secondary" className="gap-1">
                <span className="text-xs">★</span> Destacado
              </Badge>
            )}
            {product.isWholesaleAvailable && (
              <Badge variant="outline" className="gap-1">
                <span className="text-xs">🏷</span> Mayorista
              </Badge>
            )}
          </div>
        )}
      </Link>
      <CardContent className="flex-1 flex flex-col p-4">
        <h3 className="font-medium text-sm line-clamp-2 mb-2">
          <Link href={`/producto/${product.slug}`} className="hover:text-primary transition-colors">
            {product.name}
          </Link>
        </h3>
        {product.shortDescription && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
            {product.shortDescription}
          </p>
        )}
        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-bold text-primary">{formatPrice(displayPrice)}</span>
            {showWholesale && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          {showWholesale && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
              Precio mayorista aplicado
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full" asChild>
          <Link href={`/producto/${product.slug}`}>Ver detalles</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}