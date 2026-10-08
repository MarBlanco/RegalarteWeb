import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import CheckoutPage from './page'
import { useCartStore } from '@/lib/cart'

vi.mock('@/components/checkout/checkout-form', () => ({
  CheckoutForm: () => <div data-testid="checkout-form" />,
}))
vi.mock('@/components/checkout/checkout-summary', () => ({
  CheckoutSummary: () => <div />,
}))
vi.mock('@/components/checkout/checkout-line-list', () => ({
  CheckoutLineList: () => <div />,
}))
vi.mock('@/lib/analytics/ga', () => ({ trackBeginCheckout: vi.fn() }))

const line = (id: number, name: string) => ({
  id: String(id),
  productId: String(id),
  slug: `p-${id}`,
  name,
  price: 1000,
  compareAtPrice: null,
  wholesalePrice: null,
  isWholesaleAvailable: false,
  image: null,
  quantity: 1,
})

let catalog: Array<Record<string, unknown>> = []

beforeEach(() => {
  catalog = [
    { id: 1, active: true, stock: 5 },
    { id: 2, active: true, stock: 5 },
  ]
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => ({ ok: true, json: async () => ({ docs: catalog }) })),
  )
  useCartStore.setState({
    items: [line(1, 'Vela Uno'), line(2, 'Vela Dos')],
    mode: 'RETAIL',
    hydrated: true,
  })
})

afterEach(() => vi.unstubAllGlobals())

describe('Checkout — productos no disponibles', () => {
  it('todo comprable → muestra el formulario', async () => {
    render(<CheckoutPage />)
    expect(await screen.findByTestId('checkout-form')).toBeInTheDocument()
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it.each([
    ['Agotado', { id: 2, active: true, soldOut: true, stock: 5 }, /Agotado/],
    ['Sin stock', { id: 2, active: true, stock: 0 }, /Sin stock/],
    ['Oculto', { id: 2, active: false, stock: 5 }, /ya no está disponible/],
  ])('%s → no se puede finalizar: sin formulario y con enlace al carrito', async (_n, doc, message) => {
    catalog = [catalog[0], doc]
    render(<CheckoutPage />)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No podemos finalizar tu pedido todavía')
    expect(alert).toHaveTextContent('Vela Dos')
    expect(alert).toHaveTextContent(message)
    expect(screen.queryByTestId('checkout-form')).toBeNull()
    expect(screen.getByRole('link', { name: 'Volver al carrito' })).toHaveAttribute('href', '/cart')
  })

  it('producto eliminado → no se puede finalizar', async () => {
    catalog = [catalog[0]]
    render(<CheckoutPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Vela Dos')
    expect(screen.queryByTestId('checkout-form')).toBeNull()
  })
})
