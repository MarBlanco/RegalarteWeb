/**
 * Admin Dashboard: vista resumen para el panel de Payload.
 *
 * Server component renderizado por Payload cuando un usuario admin
 * (o staff) ingresa a /admin. Muestra KPIs basicos del negocio:
 *
 *  - Total de Orders persistidas.
 *  - Orders pendientes de pago (status=pending).
 *  - Ingresos confirmados (status in [paid, fulfilled]).
 *  - Productos activos.
 *  - Listado de las 5 ultimas orders.
 *
 * Reutiliza:
 *  - shadcn Card/CardContent (apps/web/src/components/ui/card)
 *  - lib/format (formatPrice)
 *
 * No modifica ninguna coleccion, schema ni contrato existente.
 * Los datos se leen via Payload Local API (getPayload) en server.
 */

import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/lib/format'

export async function AdminDashboard() {
  const payload = await getPayload({ config })

  const [
    ordersTotal,
    ordersPending,
    ordersPaidAgg,
    ordersRecent,
    productsTotal,
    productsActive,
  ] = await Promise.all([
    payload.count({ collection: 'orders' }),
    payload.count({ collection: 'orders', where: { status: { equals: 'pending' } } }),
    payload.find({
      collection: 'orders',
      where: { status: { in: ['paid', 'fulfilled'] } },
      limit: 0,
      depth: 0,
    }),
    payload.find({
      collection: 'orders',
      sort: '-createdAt',
      limit: 5,
      depth: 0,
    }),
    payload.count({ collection: 'products' }),
    payload.count({
      collection: 'products',
      where: { active: { equals: true } },
    }),
  ])

  const revenue = ordersPaidAgg.docs.reduce(
    (acc: number, order) => acc + (order.total ?? 0),
    0,
  )

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Resumen</h1>
        <p className="text-sm text-muted-foreground">
          Vista general del estado actual del catálogo y las orders.
        </p>
      </header>

      <section
        aria-label="Indicadores"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orders totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {ordersTotal.totalDocs}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes de pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {ordersPending.totalDocs}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos confirmados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatPrice(revenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Productos activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {productsActive.totalDocs}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / {productsTotal.totalDocs}
              </span>
            </p>
          </CardContent>
        </Card>
      </section>

      <section aria-label="Ultimas orders" className="space-y-3">
        <header>
          <h2 className="text-base font-semibold">Últimas orders</h2>
          <p className="text-xs text-muted-foreground">
            Las 5 más recientes, ordenadas por fecha de creación.
          </p>
        </header>

        {ordersRecent.docs.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Aún no hay orders registradas.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Orden</th>
                    <th className="px-4 py-2 font-medium">Estado</th>
                    <th className="px-4 py-2 font-medium">Modo</th>
                    <th className="px-4 py-2 font-medium text-right">Total</th>
                    <th className="px-4 py-2 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersRecent.docs.map((order) => (
                    <tr key={order.id} className="border-b last:border-b-0">
                      <td className="px-4 py-2">
                        <Link
                          href={`/admin/collections/orders/${order.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-2 capitalize text-muted-foreground">
                        {order.status}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {order.mode === 'WHOLESALE' ? 'Mayorista' : 'Minorista'}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {formatPrice(order.total ?? 0)}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
