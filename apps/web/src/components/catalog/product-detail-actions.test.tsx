import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductDetailActions } from './product-detail-actions'
import { useCartStore } from '@/lib/cart'

const product = { id: 9, slug: 'vela-9', title: 'Vela 9', price: 1000 }

beforeEach(() => {
  useCartStore.getState().clearCart()
  useCartStore.setState({ hydrated: true })
})

describe('PDP — compra por estado', () => {
  it('Activo: el botón agrega al carrito', () => {
    render(<ProductDetailActions product={product} stock={5} soldOut={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Agregar al carrito' }))
    expect(useCartStore.getState().items.map((i) => i.slug)).toEqual(['vela-9'])
  })

  it('Agotado manual: botón "Agotado" deshabilitado, sin selector de cantidad y no agrega', () => {
    render(<ProductDetailActions product={product} stock={5} soldOut />)
    const button = screen.getByRole('button', { name: 'Agotado' })
    expect(button).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Aumentar cantidad' })).toBeNull()
    fireEvent.click(button)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('sin stock: también bloqueado', () => {
    render(<ProductDetailActions product={product} stock={0} />)
    expect(screen.getByRole('button', { name: 'Agotado' })).toBeDisabled()
  })
})
