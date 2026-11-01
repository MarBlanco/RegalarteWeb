import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from './store'

const input = (quantity: number) => ({
  id: 'p1',
  productId: 'p1',
  slug: 'vela',
  name: 'Vela',
  price: 1000,
  quantity,
})

describe('cart store — tope por producto', () => {
  beforeEach(() => useCartStore.setState({ items: [], mode: 'RETAIL', hydrated: true } as never))

  it('addItem no pasa de 10 unidades al sumar sobre una línea existente', () => {
    useCartStore.getState().addItem(input(8))
    useCartStore.getState().addItem(input(5))
    expect(useCartStore.getState().items[0].quantity).toBe(10)
  })

  it('addItem de una línea nueva con más de 10 se acota a 10', () => {
    useCartStore.getState().addItem(input(25))
    expect(useCartStore.getState().items[0].quantity).toBe(10)
  })

  it('updateQuantity se acota a 10', () => {
    useCartStore.getState().addItem(input(1))
    useCartStore.getState().updateQuantity('p1', 99)
    expect(useCartStore.getState().items[0].quantity).toBe(10)
  })
})
