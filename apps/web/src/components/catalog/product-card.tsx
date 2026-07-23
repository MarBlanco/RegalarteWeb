'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { useAuth } from '@/hooks/use-auth'
import { useCart } from '@/hooks/use-cart'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    wholesalePrice?: number
    isWholesaleAvailable?: boolean
    images?: Array<{ image: { url: string; alt?: string }; isPrimary?: boolean }>
    shortDescription?: string
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const { isWholesale } = useAuth()
  const { addItem } = useCart()
  const isWholesaleUser = isWholesale()
  const showWholesale = product.isWholesaleAvailable && isWholesaleUser && product.wholesalePrice
  const price = showWholesale ? product.wholesalePrice! : product.price
  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0]

  function handleAddToCart() {
    addItem({
      id: product.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      wholesalePrice: product.wholesalePrice || undefined,
      quantity: 1,
      image: primaryImage?.image?.url,
    })
  }

  return (
    <Card className="group flex flex-col h-full transition-shadow hover:shadow-lg">
      <CardHeader className="p-0 relative overflow-hidden aspect-[4/3]">
        {primaryImage?.image?.url && (
          <Image
            src={primaryImage.image.url}
            alt={primaryImage.image.alt || product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        )}
        {showWholesale && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-amber-600 text-amber-50">
              Mayorista
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4">
        <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.name}</h3>
        {product.shortDescription && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
            {product.shortDescription}
          </p>
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">
            ${price.toLocaleString('es-AR')}
          </span>
          {!showWholesale && product.isWholesaleAvailable && product.wholesalePrice && (
            <span className="text-xs text-muted-foreground line-through">
              ${product.price.toLocaleString('es-AR')}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full" size="sm" onClick={handleAddToCart}>
          Agregar al carrito
        </Button>
      </CardFooter>
    </Card>
  )
}