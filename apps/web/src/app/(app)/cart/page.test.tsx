import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CartPage from './page'
import { useCartStore } from '@/lib/cart'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/cart/shipping'

const ITEM_A = {
  id: 'a1',
  productId: 'a1',
  slug: 'vela-a',
  name: 'Vela A',
  price: 30000,
  compareAtPrice: null,
  wholesalePrice: null,
  isWholesaleAvailable: false,
  image: null,
  quantity: 1,
}

const ITEM_B = {
  id: 'b2',
  productId: 'b2',
  slug: 'vela-b',
  name: 'Vela B',
  price: 20000,
  compareAtPrice: null,
  wholesalePrice: null,
  isWholesaleAvailable: false,
  image: null,
  quantity: 2,
}

function seed() {
  useCartStore.setState({
    items: [ITEM_A, ITEM_B],
    mode: 'RETAIL',
    hydrated: true,
  })
}

beforeEach(() => {
  useCartStore.setState({ items: [], mode: 'RETAIL', hydrated: false })
})

describe('CartPage', () => {
  it('muestra líneas, subtotal y progreso de envío', () => {
    seed()
    render(<CartPage />)
    expect(screen.getByText('Tu carrito')).toBeInTheDocument()
    expect(screen.getByText('Vela A')).toBeInTheDocument()
    expect(screen.getByText('Vela B')).toBeInTheDocument()
    // subtotal 30000 + 2*20000 = 70000 → faltan 35000
    const remaining = screen.getAllByText(/35\.000/)
    expect(remaining.length).toBeGreaterThanOrEqual(1)
    expect(
      screen.getByText(/del envío gratis/),
    ).toBeInTheDocument()
    const cta = screen.getByText(/^Continuar →$/)
    expect(cta.closest('a')).toHaveAttribute('href', '/checkout')
  })

  it('incrementa cantidad y pide confirmación antes de eliminar', () => {
    seed()
    render(<CartPage />)
    const plusButtons = screen.getAllByLabelText('Aumentar cantidad')
    fireEvent.click(plusButtons[0])
    expect(useCartStore.getState().items[0].quantity).toBe(2)

    // El tachito NO elimina de inmediato: abre el diálogo.
    const deleteButtons = screen.getAllByLabelText(/Eliminar Vela B/)
    fireEvent.click(deleteButtons[0])
    expect(
      useCartStore.getState().items.find((i) => i.id === 'b2'),
    ).toBeDefined()
    expect(screen.getByText('¿Eliminar producto?')).toBeInTheDocument()

    // Cancelar conserva el producto.
    fireEvent.click(screen.getByText('Cancelar'))
    expect(
      useCartStore.getState().items.find((i) => i.id === 'b2'),
    ).toBeDefined()
    expect(screen.queryByText('¿Eliminar producto?')).not.toBeInTheDocument()

    // Eliminar lo quita definitivamente.
    fireEvent.click(screen.getAllByLabelText(/Eliminar Vela B/)[0])
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(
      useCartStore.getState().items.find((i) => i.id === 'b2'),
    ).toBeUndefined()
  })

  it('vacía el carrito y enlaza al checkout', () => {
    seed()
    render(<CartPage />)
    const cta = screen.getByText(/^Continuar →$/)
    expect(cta.closest('a')).toHaveAttribute('href', '/checkout')
    fireEvent.click(screen.getByText('Vaciar carrito'))
    expect(useCartStore.getState().items).toHaveLength(0)
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument()
  })
})
