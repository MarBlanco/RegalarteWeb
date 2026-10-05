import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  OrderConfirmation,
  type OrderConfirmationData,
} from '@/components/checkout/order-confirmation'
import { verifyOrderSig } from '@/lib/mercadopago/return-urls'
import { isOrderStatus } from '@/lib/orders/transitions'

export const dynamic = 'force-dynamic'

interface PageProps {
  params?: Promise<{ id?: string }>
  searchParams?: Promise<{ sig?: string }>
}

/**
 * Confirmación del pedido registrado por el checkout. El id viaja con una
 * firma HMAC (secreto server-only), igual que el retorno de Mercado Pago:
 * sin firma válida no se puede consultar el pedido de otra persona.
 */
export default async function OrdenPage({
  params,
  searchParams,
}: Readonly<PageProps>) {
  const { id } = (await params) ?? {}
  const query = (await searchParams) ?? {}
  const orderId = Number(id)
  const sig = typeof query.sig === 'string' ? query.sig : null
  const secret = process.env.PAYLOAD_SECRET
  if (!Number.isInteger(orderId) || orderId <= 0 || !secret) notFound()
  if (!verifyOrderSig(orderId, sig, secret)) notFound()

  const payload = await getPayload({ config })
  const order = (await payload
    .findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
    .catch(() => null)) as
    | { orderNumber: string; status: string; total: number }
    | null
  if (!order || !isOrderStatus(order.status)) notFound()

  const data: OrderConfirmationData = {
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
  }
  return <OrderConfirmation order={data} />
}
