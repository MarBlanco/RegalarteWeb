import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'
import {
  isReturnResult,
  verifyOrderSig,
} from '@/lib/mercadopago/return-urls'

export const dynamic = 'force-dynamic'

interface PageProps {
  params?: Promise<{ resultado?: string }>
  searchParams?: Promise<{ order?: string; sig?: string }>
}

interface ReturnOrder {
  id: number
  orderNumber: string
  status: string
  total: number
}

/**
 * Retorno desde Mercado Pago (success/failure/pending).
 *
 * El contenido deriva EXCLUSIVAMENTE del estado de NUESTRA orden
 * (pending/paid/…): los query params solo aportan el id + firma, que se
 * verifica con secreto server-only. El retorno del navegador jamás
 * determina el pago; eso solo lo hace el webhook validado.
 */
export default async function PagoRetornoPage({ params, searchParams }: PageProps) {
  const { resultado } = (await params) ?? {}
  const query = (await searchParams) ?? {}
  if (!isReturnResult(resultado)) notFound()

  const orderId = Number(query.order)
  const sig = typeof query.sig === 'string' ? query.sig : null
  const secret = process.env.PAYLOAD_SECRET
  if (!Number.isInteger(orderId) || orderId <= 0 || !secret) notFound()
  if (!verifyOrderSig(orderId, sig, secret)) notFound()

  const payload = await getPayload({ config })
  const order = (await payload
    .findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
    .catch(() => null)) as ReturnOrder | null
  if (!order) notFound()

  const paid = order.status === 'paid'
  const pending = order.status === 'pending'

  return (
    <main className="flex-1 bg-background">
      <div className="container max-w-xl py-8 lg:py-12">
        <Card>
          <CardContent className="space-y-4 p-6 text-center sm:p-8">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Pedido {order.orderNumber}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              {paid
                ? '¡Pago acreditado!'
                : pending
                  ? 'Estamos confirmando tu pago'
                  : 'Tu pedido necesita revisión'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {paid
                ? `Recibimos tu pago de ${formatPrice(order.total)}. Te avisaremos por email cuando lo preparemos.`
                : pending
                  ? 'Mercado Pago está procesando el pago. Esta página refleja el estado real de tu pedido.'
                  : 'El pedido no quedó pagado. Si se debitó algún monto, se reversa automáticamente.'}
            </p>
            {!paid ? (
              <p className="text-sm font-medium tabular-nums">
                Total del pedido: {formatPrice(order.total)}
              </p>
            ) : null}
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
