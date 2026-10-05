import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'
import { ORDER_STATUS_META } from '@/lib/orders/history'
import type { OrderStatus } from '@/lib/orders/transitions'

export interface OrderConfirmationData {
  orderNumber: string
  status: OrderStatus
  total: number
}

/**
 * Destino del checkout cuando el pedido se registra sin pasarela externa
 * (provider mock). Textos y estados salen de `ORDER_STATUS_META`.
 */
export function OrderConfirmation({ order }: { order: OrderConfirmationData }) {
  const meta = ORDER_STATUS_META[order.status]
  return (
    <main className="flex-1 bg-background">
      <div className="container max-w-xl py-8 lg:py-12">
        <Card>
          <CardContent className="space-y-4 p-6 text-center sm:p-8">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Pedido {order.orderNumber}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              {meta.headline({ createdAt: '' })}
            </h1>
            <p className="text-sm text-muted-foreground">{meta.subline}</p>
            <p className="text-sm font-medium tabular-nums">
              Estado: {meta.label} · Total: {formatPrice(order.total)}
            </p>
            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href="/orders">Ver mis compras</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/catalogo">Volver al catálogo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
