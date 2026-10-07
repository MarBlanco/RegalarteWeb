'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { useCartStore } from '@/lib/cart/store'
import { isAgotado } from '@/lib/catalog'
import { formatPrice } from '@/lib/format'
import {
  ORDER_STATUS_META,
  filterHistoryOrders,
  formatOrderDate,
  type DateFilter,
  type HistoryFilters,
  type HistoryOrder,
} from '@/lib/orders/history'
import type { OrderStatus } from '@/lib/orders/transitions'

function StatusIcon({ status, className = 'h-3.5 w-3.5' }: { status: OrderStatus; className?: string }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  }
  switch (status) {
    case 'fulfilled':
      return (
        <svg {...common}>
          <path d="M1 8h13v9H1z" />
          <path d="M14 11h4l3 3v3h-7z" />
          <circle cx="5.5" cy="17.5" r="1.8" />
          <circle cx="17.5" cy="17.5" r="1.8" />
        </svg>
      )
    case 'paid':
      return (
        <svg {...common}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      )
    case 'pending':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    case 'rejected':
    case 'cancelled':
      return (
        <svg {...common}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      )
  }
}

/**
 * Ids de productos que hoy NO se pueden comprar (agotados, sin stock o
 * despublicados). Un producto que ya no existe también se considera no
 * disponible. Lanza si no se puede consultar.
 */
async function findUnavailableProducts(ids: number[]): Promise<Set<number>> {
  if (ids.length === 0) return new Set()
  const res = await fetch(
    `/api/products?where[id][in]=${ids.join(',')}&limit=${ids.length}&depth=0`,
  )
  if (!res.ok) throw new Error('availability')
  const data = (await res.json()) as {
    docs?: Array<{ id: number; active?: boolean | null; soldOut?: boolean | null; stock?: number | null }>
  }
  const available = new Set(
    (data.docs ?? [])
      .filter((p) => p.active !== false && !isAgotado(p))
      .map((p) => p.id),
  )
  return new Set(ids.filter((id) => !available.has(id)))
}

function OrderCard({ order }: Readonly<{ order: HistoryOrder }>) {
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)
  const [expanded, setExpanded] = useState(false)
  const [notice, setNotice] = useState('')
  const [checking, setChecking] = useState(false)
  const meta = ORDER_STATUS_META[order.status]
  const mainImage = order.items.find((i) => i.imageUrl)?.imageUrl ?? null
  const thumbs = order.items
    .map((i) => i.imageUrl)
    .filter((u): u is string => !!u && u !== mainImage)
    .slice(0, 2)
  const count = order.items.reduce((acc, i) => acc + i.quantity, 0)

  async function buyAgain() {
    // Un solo intento a la vez: sin esto, dos clics seguidos sumarían doble.
    if (checking) return
    setChecking(true)
    setNotice('')
    const ids = order.items.flatMap((i) => (i.product === null ? [] : [i.product]))
    let unavailable: Set<number>
    try {
      unavailable = await findUnavailableProducts(ids)
    } catch {
      setNotice('No pudimos verificar la disponibilidad. Intentá de nuevo.')
      setChecking(false)
      return
    }
    setChecking(false)
    const skipped: string[] = []
    for (const item of order.items) {
      // Producto borrado del catálogo: ya no se puede comprar.
      if (item.product === null || unavailable.has(item.product)) {
        skipped.push(item.name)
        continue
      }
      addItem({
        id: String(item.product),
        productId: String(item.product),
        slug: item.slug,
        name: item.name,
        price: item.unitPrice,
        quantity: item.quantity,
        image: item.imageUrl ? { url: item.imageUrl, alt: item.name } : null,
      })
    }
    if (skipped.length > 0) {
      setNotice(
        `Sin disponibilidad, no se agregó: ${skipped.join(', ')}. Lo demás ya está en tu carrito.`,
      )
      return
    }
    router.push('/cart')
  }

  return (
    <article className="overflow-hidden rounded-xl border border-[#EBDFD1] bg-white shadow-[0_4px_16px_rgba(56,39,29,0.05)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#F1E9DD] px-4 py-3 sm:px-5">
        <p className="text-sm font-bold text-[#1F1B16]">
          {formatOrderDate(order.createdAt)}
        </p>
        <p className="flex shrink-0 items-center gap-1 text-[13px] text-[#5C4A3D]">
          Pedido #{order.orderNumber}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </p>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row">
        <div className="flex shrink-0 gap-2.5">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainImage}
              alt=""
              className="h-28 w-28 rounded-lg border border-[#EBDFD1] object-cover sm:h-36 sm:w-36"
            />
          ) : (
            <span className="flex h-28 w-28 items-center justify-center rounded-lg border border-dashed border-[#E5DDD1] text-[11px] text-[#9A8A7A] sm:h-36 sm:w-36">
              Sin imagen
            </span>
          )}
          {thumbs.length > 0 ? (
            <span className="flex flex-col gap-2.5">
              {thumbs.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="h-[52px] w-[52px] rounded-lg border border-[#EBDFD1] object-cover sm:h-16 sm:w-16"
                />
              ))}
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.badgeClass}`}
          >
            <StatusIcon status={order.status} />
            {meta.label}
          </span>
          <h3 className="mt-2 font-serif text-lg font-medium text-[#1F1B16]">
            {meta.headline(order)}
          </h3>
          <p className="mt-0.5 text-[13px] text-[#7A6A5D]">{meta.subline}</p>
          <ul className="mt-3 space-y-1">
            {order.items.map((item, i) => (
              <li
                key={`${item.slug}-${i}`}
                className="flex items-baseline justify-between gap-3 text-[13px]"
              >
                <Link
                  href={`/catalogo/${item.slug}`}
                  className="truncate text-[#5C4A3D] hover:text-[#C45A37] hover:underline underline-offset-2"
                >
                  {item.name}
                </Link>
                <span className="shrink-0 tabular-nums text-[#7A6A5D]">
                  {item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}
                </span>
              </li>
            ))}
          </ul>

          {expanded ? (
            <dl className="mt-3 space-y-1 rounded-lg bg-[#FBF7F1] p-3 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-[#7A6A5D]">Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#7A6A5D]">Envío</dt>
                <dd className="tabular-nums">{formatPrice(order.shipping)}</dd>
              </div>
              {[order.province, order.city].filter(Boolean).length > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-[#7A6A5D]">Destino</dt>
                  <dd className="text-right">
                    {[order.city, order.province].filter(Boolean).join(', ')}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-[#F1E9DD] pt-4 lg:w-44 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <p className="text-xs text-[#7A6A5D]">Total</p>
          <p className="text-xl font-bold tabular-nums text-[#1F1B16]">
            {formatPrice(order.total)}
          </p>
          <p className="text-xs text-[#7A6A5D]">
            {count} {count === 1 ? 'producto' : 'productos'}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="h-10 w-full rounded-lg bg-[#B85C33] text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#9E4E2B]"
            >
              {expanded ? 'Ocultar detalle' : 'Ver pedido'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void buyAgain()}
              disabled={checking}
              className="h-10 w-full rounded-lg border-[#C9A24B] text-xs font-semibold uppercase tracking-wider text-[#8A5A33] hover:bg-[#F9EFE2]"
            >
              Volver a comprar
            </Button>
            {notice ? (
              <output className="block text-xs text-[#7A6A5D]">{notice}</output>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

/**
 * Historial "Mis compras" (cliente). Sin sesión redirige al login
 * (mismo patrón que /profile).
 */
export function OrdersClient() {
  const router = useRouter()
  const user = useAuth((s) => s.user)
  const token = useAuth((s) => s.token)
  const authLoading = useAuth((s) => s.isLoading)
  const [orders, setOrders] = useState<HistoryOrder[] | null>(null)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<HistoryFilters>({
    query: '',
    status: 'all',
    date: 'all',
  })

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/login')
  }, [user, authLoading, router])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!token) return
      try {
        const res = await fetch('/api/orders/mine', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('No se pudo cargar el historial')
        const data = (await res.json()) as { docs?: HistoryOrder[] }
        if (!cancelled) setOrders(Array.isArray(data.docs) ? data.docs : [])
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'No se pudo cargar',
          )
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [token])

  const visible = useMemo(
    () => filterHistoryOrders(orders ?? [], filters),
    [orders, filters],
  )

  if (authLoading || !user) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        {authLoading ? 'Cargando tu sesión…' : 'Redirigiendo al inicio de sesión…'}
      </p>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#9A8A7A]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <Input
            value={filters.query}
            onChange={(e) =>
              setFilters((f) => ({ ...f, query: e.target.value }))
            }
            placeholder="Buscar por producto, número de pedido..."
            aria-label="Buscar en tus pedidos"
            className="h-11 rounded-xl bg-white pl-10"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:w-auto lg:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="orders-status" className="sr-only">
              Estado
            </Label>
            <select
              id="orders-status"
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  status: e.target.value as HistoryFilters['status'],
                }))
              }
              className="flex h-11 w-full rounded-xl border border-input bg-white px-3 text-sm text-[#38271D] outline-none lg:w-40"
            >
              <option value="all">Estado</option>
              <option value="pending">Pendiente</option>
              <option value="paid">Pagado</option>
              <option value="fulfilled">Entregado</option>
              <option value="rejected">Rechazado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="orders-date" className="sr-only">
              Fecha
            </Label>
            <select
              id="orders-date"
              value={filters.date}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  date: e.target.value as DateFilter,
                }))
              }
              className="flex h-11 w-full rounded-xl border border-input bg-white px-3 text-sm text-[#38271D] outline-none lg:w-40"
            >
              <option value="all">Fecha</option>
              <option value="last30">Últimos 30 días</option>
              <option value="last90">Últimos 90 días</option>
              <option value="year">Este año</option>
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {orders === null && !error ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Cargando tus pedidos…
        </p>
      ) : null}

      {orders !== null && orders.length === 0 ? (
        <div className="mt-4 rounded-xl border border-[#EBDFD1] bg-white p-10 text-center shadow-[0_4px_16px_rgba(56,39,29,0.05)]">
          <p className="font-serif text-xl text-[#38271D]">
            Todavía no tenés pedidos
          </p>
          <p className="mt-1 text-sm text-[#7A6A5D]">
            Cuando compres, vas a ver acá el estado y detalle de cada pedido.
          </p>
          <Button
            type="button"
            onClick={() => router.push('/catalogo')}
            className="mt-5 h-11 rounded-xl bg-[#B85C33] px-8 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#9E4E2B]"
          >
            Explorar catálogo
          </Button>
        </div>
      ) : null}

      {orders !== null && orders.length > 0 && visible.length === 0 ? (
        <p className="mt-4 rounded-xl border border-[#EBDFD1] bg-white p-10 text-center text-sm text-[#7A6A5D]">
          Ningún pedido coincide con los filtros.
        </p>
      ) : null}

      <div className="mt-4 space-y-4">
        {visible.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  )
}
