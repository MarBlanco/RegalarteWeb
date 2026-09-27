import { describe, it, expect } from 'vitest'
import {
  ORDER_STATUS_META,
  filterHistoryOrders,
  formatOrderDate,
  type HistoryOrder,
} from './history'

const ORDERS: HistoryOrder[] = [
  {
    id: 1,
    orderNumber: 'RG-000124',
    status: 'fulfilled',
    createdAt: '2026-09-23T10:00:00.000Z',
    items: [
      {
        product: 4,
        slug: 'vela-vainilla-ambar',
        name: 'Vela Vainilla & Ámbar',
        quantity: 2,
        unitPrice: 18500,
        lineTotal: 37000,
        imageUrl: null,
      },
    ],
    total: 42980,
    subtotal: 37000,
    shipping: 5980,
    city: 'CABA',
    province: 'Buenos Aires',
  },
  {
    id: 2,
    orderNumber: 'RG-000110',
    status: 'pending',
    createdAt: '2026-09-05T10:00:00.000Z',
    items: [
      {
        product: 5,
        slug: 'difusor-x',
        name: 'Difusor X',
        quantity: 1,
        unitPrice: 21900,
        lineTotal: 21900,
        imageUrl: null,
      },
    ],
    total: 21900,
    subtotal: 21900,
    shipping: 0,
    city: '',
    province: '',
  },
]

const NOW = new Date('2026-09-24T12:00:00.000Z').getTime()

describe('Mis compras — estados reales', () => {
  it('cubre los 5 estados del sistema sin inventar', () => {
    expect(Object.keys(ORDER_STATUS_META).sort()).toEqual(
      ['cancelled', 'fulfilled', 'paid', 'pending', 'rejected'].sort(),
    )
    for (const meta of Object.values(ORDER_STATUS_META)) {
      expect(meta.label).toBeTruthy()
      expect(meta.headline({ createdAt: '' })).toBeTruthy()
    }
  })
})

describe('Mis compras — filtros', () => {
  it('sin filtros devuelve todo', () => {
    expect(
      filterHistoryOrders(ORDERS, { query: '', status: 'all', date: 'all' }, NOW),
    ).toHaveLength(2)
  })

  it('filtra por estado real', () => {
    expect(
      filterHistoryOrders(
        ORDERS,
        { query: '', status: 'fulfilled', date: 'all' },
        NOW,
      ).map((o) => o.orderNumber),
    ).toEqual(['RG-000124'])
  })

  it('busca por producto y por número', () => {
    expect(
      filterHistoryOrders(
        ORDERS,
        { query: 'vainilla', status: 'all', date: 'all' },
        NOW,
      ).map((o) => o.orderNumber),
    ).toEqual(['RG-000124'])
    expect(
      filterHistoryOrders(
        ORDERS,
        { query: 'RG-000110', status: 'all', date: 'all' },
        NOW,
      ).map((o) => o.orderNumber),
    ).toEqual(['RG-000110'])
    expect(
      filterHistoryOrders(
        ORDERS,
        { query: 'inexistente', status: 'all', date: 'all' },
        NOW,
      ),
    ).toHaveLength(0)
  })

  it('filtra por fecha', () => {
    expect(
      filterHistoryOrders(
        ORDERS,
        { query: '', status: 'all', date: 'last30' },
        NOW,
      ).map((o) => o.orderNumber),
    ).toEqual(['RG-000124', 'RG-000110'])
    const old = { ...ORDERS[1], createdAt: '2026-01-05T10:00:00.000Z' }
    expect(
      filterHistoryOrders(
        [ORDERS[0], old],
        { query: '', status: 'all', date: 'last30' },
        NOW,
      ).map((o) => o.orderNumber),
    ).toEqual(['RG-000124'])
    expect(
      filterHistoryOrders(
        [ORDERS[0], old],
        { query: '', status: 'all', date: 'year' },
        NOW,
      ),
    ).toHaveLength(2)
  })

  it('formatea fecha en español', () => {
    expect(formatOrderDate('2026-09-23T10:00:00.000Z')).toBe(
      '23 de septiembre de 2026',
    )
  })
})
