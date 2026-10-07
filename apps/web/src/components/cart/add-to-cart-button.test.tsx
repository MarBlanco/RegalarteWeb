import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddToCartButton } from './add-to-cart-button'
import { useCartStore } from '@/lib/cart'

const product = {
  id: 9,
  slug: 'vela-9',
  title: 'Vela 9',
  price: 1000,
}

beforeEach(() => {
  useCartStore.getState().clearCart()
  useCartStore.setState({ hydrated: true })
})

describe('AddToCartButton — compra por estado', () => {
  it.each([true, false])('Activo (compact=%s): agrega al carrito', (compact) => {
    render(<AddToCartButton product={product} stock={5} soldOut={false} compact={compact} />)
    const button = screen.getByRole('button', { name: 'Agregar al carrito' })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(useCartStore.getState().items.map((i) => i.slug)).toEqual(['vela-9'])
  })

  it.each([true, false])('Agotado (compact=%s): deshabilitado y no agrega', (compact) => {
    render(<AddToCartButton product={product} stock={5} soldOut compact={compact} />)
    const button = screen.getByRole('button', { name: 'Agotado' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('sin stock también queda bloqueado', () => {
    render(<AddToCartButton product={product} stock={0} compact />)
    expect(screen.getByRole('button', { name: 'Sin stock' })).toBeDisabled()
  })
})
