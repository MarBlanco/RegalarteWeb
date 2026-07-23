'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { useCart } from '@/hooks/use-cart'
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Shield,
  Truck,
  RotateCcw,
  Minus,
  Plus,
  ShoppingCart,
  Heart,
  Share2,
  Tag,
  Package,
  Layers,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  shortDescription?: string
  price: number
  wholesalePrice?: number
  isWholesaleAvailable: boolean
  images?: Array<{ image: { url: string; alt?: string }; isPrimary?: boolean }>
  category?: { name: string; slug: string }
  tags?: Array<{ name: string; color?: string }>
  attributes?: Array<{ name: string; value: string; unit?: string; group?: string }>
  sku?: string
  stock?: number
  isActive: boolean
  isFeatured: boolean
}

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const { isWholesale } = useAuth()
  const { addItem } = useCart()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await fetch(`/api/products/${slug}`)
      if (!res.ok) throw new Error('Producto no encontrado')
      return res.json()
    },
    enabled: !!slug,
  })

  const wholesaleUser = isWholesale()
  const showWholesale = wholesaleUser && product?.isWholesaleAvailable && product?.wholesalePrice
  const displayPrice = showWholesale ? product!.wholesalePrice! : product!.price
  const primaryImage = product?.images?.find((img) => img.isPrimary) || product?.images?.[0]

  function formatPrice(price: number) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-muted/50 rounded-xl animate-pulse" />
          <div className="space-y-6">
            <div className="h-8 w-1/2 bg-muted/50 rounded animate-pulse" />
            <div className="h-6 w-3/4 bg-muted/50 rounded animate-pulse" />
            <div className="h-10 w-1/3 bg-muted/50 rounded animate-pulse" />
            <div className="h-40 bg-muted/50 rounded animate-pulse" />
            <div className="h-12 w-full bg-muted/50 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product || !product.isActive) {
    return (
      <div className="container py-16 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Producto no encontrado</h1>
        <p className="text-muted-foreground mb-6">El producto que buscas no existe o no está disponible.</p>
        <Button asChild>
          <Link href="/catalogo">Volver al catálogo</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <nav className="mb-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
          </li>
          <li className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <Link href="/catalogo" className="hover:text-primary transition-colors">Catálogo</Link>
          </li>
          {product.category && (
            <li className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              <Link href={`/catalogo?category=${product.category.slug}`} className="hover:text-primary transition-colors">
                {product.category.name}
              </Link>
            </li>
          )}
          <li className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
          </li>
        </ol>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="aspect-square rounded-xl overflow-hidden bg-muted/50 relative">
            {primaryImage?.image?.url && (
              <Image
                src={primaryImage.image.url}
                alt={primaryImage.image.alt || product.name}
                fill
                className="object-cover"
                priority
                sizes="50vw"
              />
            )}
            {showWholesale && (
              <div className="absolute top-4 left-4">
                <Badge variant="secondary" className="bg-amber-600 text-amber-50 gap-1">
                  <Tag className="h-3 w-3" />
                  Mayorista
                </Badge>
              </div>
            )}
            {product.isFeatured && (
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  Destacado
                </Badge>
              </div>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    idx === selectedImage ? 'border-primary' : 'border-transparent hover:border-muted-foreground/50'
                  }`}
                  aria-label={`Ver imagen ${idx + 1}`}
                  aria-current={idx === selectedImage ? 'true' : 'false'}
                >
                  <Image
                    src={img.image.url}
                    alt={img.image.alt || `${product.name} ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {product.tags.map((tag) => (
                  <Badge
                    key={tag.name}
                    variant="outline"
                    className="gap-1"
                    style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            {product.shortDescription && (
              <p className="text-muted-foreground mt-2">{product.shortDescription}</p>
            )}
          </div>

          <div className="flex items-baseline gap-4">
            <span className="text-3xl font-bold text-primary">{formatPrice(displayPrice)}</span>
            {showWholesale && (
              <>
                <span className="text-xl text-muted-foreground line-through">{formatPrice(product.price)}</span>
                <Badge variant="secondary" className="bg-amber-600 text-amber-50">
                  Precio mayorista
                </Badge>
              </>
            )}
          </div>

          {showWholesale && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Precio exclusivo para clientes mayoristas registrados
            </p>
          )}

          <Separator />

          {product.description && (
            <div className="prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold mb-3">Descripción</h3>
              <div dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          )}

          {product.attributes && product.attributes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Especificaciones</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.attributes.map((attr, idx) => (
                  <div key={idx} className="flex justify-between py-2 border-b border-muted">
                    <span className="text-muted-foreground">{attr.name}</span>
                    <span className="font-medium">
                      {attr.value}{attr.unit && ` ${attr.unit}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center gap-4">
            <label htmlFor="quantity" className="font-medium">Cantidad:</label>
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Disminuir cantidad"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <input
                id="quantity"
                type="number"
                min="1"
                max={product.stock || 999}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center border-x border-y-0 focus:outline-none"
                aria-label="Cantidad"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(product.stock || 999, quantity + 1))}
                aria-label="Aumentar cantidad"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {(product.stock || 0) < 10 && product.stock !== undefined && (
              <span className="text-sm text-amber-600">
                ¡Solo {product.stock} unidades disponibles!
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 sm:flex-none gap-2"
              size="lg"
              onClick={() => {
                addItem({
                  id: product.id,
                  productId: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  wholesalePrice: product.wholesalePrice,
                  quantity,
                  image: primaryImage?.image?.url,
                })
              }}
            >
              <ShoppingCart className="h-5 w-5" />
              Agregar al carrito
            </Button>
            <Button variant="outline" size="lg" className="flex-1 sm:flex-none" aria-label="Agregar a favoritos">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="flex-1 sm:flex-none" aria-label="Compartir producto">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-muted/50">
              <Truck className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium">Envío a todo el país</p>
              <p className="text-xs text-muted-foreground">Entrega en 3-5 días hábiles</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <Shield className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium">Compra segura</p>
              <p className="text-xs text-muted-foreground">SSL certificado 256-bit</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <RotateCcw className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium">Devoluciones fáciles</p>
              <p className="text-xs text-muted-foreground">30 días para cambios</p>
            </div>
          </div>
        </div>
      </div>

      {product.tags && product.tags.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">También te puede interesar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {product.tags.slice(0, 4).map((tag) => (
              <Card key={tag.name} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4 text-center">
                  <Badge variant="outline" className="mb-2" style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}>
                    {tag.name}
                  </Badge>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href={`/catalogo?tag=${tag.name.toLowerCase().replace(/\s+/g, '-')}`}>Ver productos</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}