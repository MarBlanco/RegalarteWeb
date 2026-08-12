/**
 * Orders: tests del calculo server-side de lineas/totales (AUDIT-004).
 *
 * Verifica que los precios de la orden provienen de la DB (no del payload
 * del cliente), que los productos inexistentes/inactivos rechazan la orden
 * y que cantidades/totales se normalizan correctamente.
 */

import { describe, expect, it } from 'vitest'

import type { CartItem, CartMode } from '@/lib/cart/types'
import type { CreateOrderInput } from './types'
import {
  buildLinesFromProducts,
  buildTotals,
  OrderRejectedError,
  type ProductPricingSource,
} from './lines'

function makeItem(overrides: Partial<CartItem> & { productId: string }): CartItem {
  return {
    id: `line-${overrides.productId}`,
    slug: 'slug-test',
    name: 'Producto test',
    price: 1, // precio mentiroso enviado por el cliente
    compareAtPrice: null,
    wholesalePrice: 0.01, // precio mentiroso enviado por el cliente
    isWholesaleAvailable: true,
    image: null,
    quantity: 2,
    ...overrides,
  }
}

function makeInput(
  items: CartItem[],
  mode: CartMode = 'RETAIL',
): CreateOrderInput {
  return {
    customer: {
      firstName: 'Juan',
      lastName: 'Perez',
      email: 'juan@example.com',
      phone: '+5491100000000',
    },
    address: {
      province: 'Buenos Aires',
      city: 'CABA',
      street: 'Av. Siempre Viva 742',
      postalCode: 'C1414',
    },
    mode,
    items,
  }
}

const retailProduct: ProductPricingSource = {
  id: 1,
  title: 'Vela Premium',
  slug: 'vela-premium',
  price: 100,
  compareAtPrice: 120,
  wholesalePrice: 90,
  isWholesaleAvailable: true,
  active: true,
}

const plainRetailProduct: ProductPricingSource = {
  id: 2,
  title: 'Box Basico',
  slug: 'box-basico',
  price: 50,
  wholesalePrice: null,
  isWholesaleAvailable: false,
  active: true,
}

const inactiveProduct: ProductPricingSource = {
  id: 3,
  title: 'Dado de baja',
  slug: 'dado-de-baja',
  price: 999,
  isWholesaleAvailable: false,
  active: false,
}

describe('buildLinesFromProducts (AUDIT-004)', () => {
  it('usa el precio minorista de la DB, ignorando el precio del cliente', () => {
    const products = new Map<number, ProductPricingSource>([
      [1, retailProduct],
    ])
    const input = makeInput([makeItem({ productId: '1', price: 1 })])

    const lines = buildLinesFromProducts(input, products)

    expect(lines).toHaveLength(1)
    expect(lines[0].unitPrice).toBe(100)
    expect(lines[0].slug).toBe('vela-premium')
    expect(lines[0].name).toBe('Vela Premium')
    expect(lines[0].lineTotal).toBe(200)
  })

  it('aplica el precio mayorista de la DB en modo WHOLESALE', () => {
    const products = new Map<number, ProductPricingSource>([
      [1, retailProduct],
    ])
    const input = makeInput(
      [makeItem({ productId: '1', wholesalePrice: 0.01 })],
      'WHOLESALE',
    )

    const lines = buildLinesFromProducts(input, products)

    expect(lines[0].unitPrice).toBe(90)
    expect(lines[0].lineTotal).toBe(180)
  })

  it('hace fallback a retail cuando el producto no es mayorista', () => {
    const products = new Map<number, ProductPricingSource>([
      [2, plainRetailProduct],
    ])
    const input = makeInput(
      [makeItem({ productId: '2', wholesalePrice: 0.01 })],
      'WHOLESALE',
    )

    const lines = buildLinesFromProducts(input, products)

    expect(lines[0].unitPrice).toBe(50)
  })

  it('rechaza la orden si el producto no esta activo', () => {
    const products = new Map<number, ProductPricingSource>([
      [3, inactiveProduct],
    ])
    const input = makeInput([makeItem({ productId: '3' })])

    expect(() => buildLinesFromProducts(input, products)).toThrow(
      OrderRejectedError,
    )
  })

  it('rechaza la orden si el producto no existe en la DB', () => {
    const products = new Map<number, ProductPricingSource>()
    const input = makeInput([makeItem({ productId: '9999' })])

    expect(() => buildLinesFromProducts(input, products)).toThrow(
      OrderRejectedError,
    )
  })

  it('normaliza cantidades (floor, minimo 1) y redondea totales', () => {
    const products = new Map<number, ProductPricingSource>([
      [1, retailProduct],
    ])
    const input = makeInput([
      makeItem({ productId: '1', quantity: 2.6 }),
    ])

    const lines = buildLinesFromProducts(input, products)

    expect(lines[0].quantity).toBe(2)
    expect(lines[0].lineTotal).toBe(200)
  })

  it('calcula totales redondeados a 2 decimales', () => {
    const totals = buildTotals([
      { productId: '1', slug: 'a', name: 'A', quantity: 1, unitPrice: 10.999, lineTotal: 10.999 },
    ])

    expect(totals.subtotal).toBe(11)
    expect(totals.total).toBe(11)
  })
})