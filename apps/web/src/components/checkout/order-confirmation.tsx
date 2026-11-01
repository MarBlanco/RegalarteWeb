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
export function OrderConfirmation({
  order,
  simulated = false,
}: Readonly<{
  order: OrderConfirmationData
  /** true cuando el pago es simulado (sin pasarela): el pedido NO está pagado. */
  simulated?: boolean
}>) {
  const meta = ORDER_STATUS_META[order.status]
  const testOrder = simulated && order.status === 'pending'
  return (
    <div className="flex-1 bg-background">
      <div className="container max-w-xl py-8 lg:py-12">
        <Card>
          <CardContent className="space-y-4 p-6 text-center sm:p-8">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Pedido {order.orderNumber}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              {testOrder ? 'Pedido registrado (modo prueba)' : meta.headline({ createdAt: '' })}
            </h1>
            {testOrder ? (
              <p
                role="status"
                className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
              >
                El pago está simulado: no se realizó ningún cobro y este pedido no está pagado.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{meta.subline}</p>
            )}
            <p className="text-sm font-medium tabular-nums">
              Estado: {meta.label} · Total: {formatPrice(order.total)}
            </p>
            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href="/orders">Ver mis compras</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Volver al inicio</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
