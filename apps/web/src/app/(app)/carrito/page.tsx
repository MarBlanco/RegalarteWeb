'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import {
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  ChevronRight,
  Shield,
  Truck,
  RotateCcw,
  AlertCircle,
} from 'lucide-react'

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export default function CartPage() {
  const { items, getTotal, getItemCount, updateQuantity, removeItem, clearCart } = useCart()
  const { isWholesale } = useAuth()
  const [showWholesaleNotice, setShowWholesaleNotice] = useState(false)

  const isWholesaleUser = isWholesale()
  const subtotal = getTotal()
  const itemCount = getItemCount()
  const shipping = subtotal > 50000 ? 0 : 4500
  const total = subtotal + shipping

  useEffect(() => {
    if (items.length > 0 && isWholesaleUser) {
      const hasWholesaleItems = items.some((item) => item.wholesalePrice)
      if (hasWholesaleItems) {
        setShowWholesaleNotice(true)
        setTimeout(() => setShowWholesaleNotice(false), 5000)
      }
    }
  }, [items, isWholesaleUser])

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Tu carrito está vacío</h1>
          <p className="text-muted-foreground mb-6">
            Agregá productos para empezar tu compra
          </p>
          <Button asChild size="lg">
            <Link href="/catalogo">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ir al catálogo
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Carrito de compras</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col sm:flex-row">
              <CardHeader className="p-4 sm:w-24 sm:h-24 sm:flex-shrink-0">
                {item.image ? (
                  <Link href={`/producto/${item.slug || item.id}`} className="relative aspect-square overflow-hidden rounded-lg">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </Link>
                ) : (
                  <div className="aspect-square bg-muted flex items-center justify-center rounded-lg">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <Link href={`/producto/${item.slug || item.id}`} className="font-medium hover:text-primary transition-colors">
                    {item.name}
                  </Link>
                  {item.variant && (
                    <p className="text-sm text-muted-foreground">{item.variant}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-primary">{formatPrice(isWholesaleUser && item.wholesalePrice ? item.wholesalePrice : item.price)}</span>
                    {isWholesaleUser && item.wholesalePrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(item.price)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label="Disminuir cantidad"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label="Eliminar producto"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {showWholesaleNotice && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 animate-slide-in">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Precios mayoristas aplicados</p>
                <p className="text-sm text-amber-700">
                  Se muestran los precios especiales para tu cuenta mayorista
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={clearCart} disabled={items.length === 0}>
              Vaciar carrito
            </Button>
            <Button variant="outline" asChild>
              <Link href="/catalogo">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Seguir comprando
              </Link>
            </Button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <h2 className="text-xl font-bold">Resumen del pedido</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Envío</span>
                <span className="font-medium">
                  {shipping === 0 ? (
                    <span className="text-green-600">Gratis</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Envío gratis en compras mayores a $50.000
                </p>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>

              {isWholesaleUser && subtotal < 150000 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Pedido mínimo mayorista:</strong> $150.000
                    <br />
                    Te faltan {formatPrice(150000 - subtotal)} para completar el pedido
                  </p>
                </div>
              )}

              <Button className="w-full" size="lg" disabled={isWholesaleUser && subtotal < 150000}>
                {isWholesaleUser && subtotal < 150000
                  ? 'Completar pedido mínimo mayorista'
                  : 'Proceder al pago'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Pago seguro con Mercado Pago
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3">
                  <Shield className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-xs font-medium">Pago seguro</p>
                  <p className="text-xs text-muted-foreground">SSL 256-bit</p>
                </div>
                <div className="p-3">
                  <Truck className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-xs font-medium">Envío rápido</p>
                  <p className="text-xs text-muted-foreground">3-5 días</p>
                </div>
                <div className="p-3">
                  <RotateCcw className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-xs font-medium">Devoluciones</p>
                  <p className="text-xs text-muted-foreground">30 días</p>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}