import type { OrderStatus } from './transitions'

/**
 * Historial "Mis compras": etiquetas y estilos de los ESTADOS REALES del
 * sistema (ver `transitions.ts`). No se inventan estados ni tracking.
 */
export interface OrderStatusMeta {
  label: string
  headline: (order: { createdAt: string }) => string
  subline: string
  badgeClass: string
}

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  pending: {
    label: 'Pendiente',
    headline: () => 'Estamos preparando tu pedido',
    subline: 'Te avisaremos cuando sea enviado.',
    badgeClass: 'bg-[#F6E9D8] text-[#8A5A33]',
  },
  paid: {
    label: 'Pagado',
    headline: () => 'Tu pago fue confirmado',
    subline: 'Ya estamos preparando tu pedido.',
    badgeClass: 'bg-[#E4ECF7] text-[#2F4E8A]',
  },
  fulfilled: {
    label: 'Entregado',
    headline: () => 'Tu pedido fue entregado',
    subline: 'Esperamos que lo disfrutes.',
    badgeClass: 'bg-[#E3EFE3] text-[#2F6B33]',
  },
  rejected: {
    label: 'Rechazado',
    headline: () => 'El pago fue rechazado',
    subline: 'Probá con otro medio de pago.',
    badgeClass: 'bg-[#F6DFDF] text-[#8A3333]',
  },
  cancelled: {
    label: 'Cancelado',
    headline: () => 'El pedido fue cancelado',
    subline: 'Si necesitás ayuda, escribinos.',
    badgeClass: 'bg-[#ECE7E0] text-[#7A6A5D]',
  },
}

export type DateFilter = 'all' | 'last30' | 'last90' | 'year'

export interface HistoryOrderItem {
  product: number
  slug: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  imageUrl: string | null
}

export interface HistoryOrder {
  id: number
  orderNumber: string
  status: OrderStatus
  createdAt: string
  items: HistoryOrderItem[]
  total: number
  subtotal: number
  shipping: number
  city: string
  province: string
}

export interface HistoryFilters {
  query: string
  status: OrderStatus | 'all'
  date: DateFilter
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Filtra pedidos en memoria (búsqueda por producto/número + estado +
 * fecha). Puro y testeable; no toca backend.
 */
export function filterHistoryOrders(
  orders: HistoryOrder[],
  filters: HistoryFilters,
  now: number = Date.now(),
): HistoryOrder[] {
  const q = filters.query.trim().toLowerCase()
  return orders.filter((order) => {
    if (filters.status !== 'all' && order.status !== filters.status) {
      return false
    }
    if (filters.date !== 'all') {
      const created = new Date(order.createdAt).getTime()
      if (Number.isNaN(created)) return false
      const diff = now - created
      if (diff < 0) return false
      if (filters.date === 'last30' && diff > 30 * DAY_MS) return false
      if (filters.date === 'last90' && diff > 90 * DAY_MS) return false
      if (filters.date === 'year') {
        const d = new Date(created)
        const n = new Date(now)
        if (d.getFullYear() !== n.getFullYear()) return false
      }
    }
    if (q) {
      const haystack =
        `${order.orderNumber} ${order.items.map((i) => i.name).join(' ')}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

export function formatOrderDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ]
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`
}
