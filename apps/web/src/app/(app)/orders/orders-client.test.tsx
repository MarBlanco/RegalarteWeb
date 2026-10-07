import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { useCartStore } from '@/lib/cart/store'
import { OrdersClient } from './orders-client'

const ORDER = {
  id: 1,
  orderNumber: 'RG-000124',
  status: 'fulfilled',
  createdAt: '2026-09-23T10:00:00.000Z',
  total: 42980,
  subtotal: 37000,
  shipping: 5980,
  city: 'CABA',
  province: 'Buenos Aires',
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
}

beforeEach(() => {
  useAuth.setState({ user: null, token: null, isLoading: false })
  vi.unstubAllGlobals()
})

function login() {
  useAuth.setState({
    user: {
      id: '3',
      email: 'c@example.com',
      name: 'Cli',
      role: 'retail',
      customer_type: 'RETAIL',
    },
    token: 'tok',
    isLoading: false,
  })
}

describe('Mis compras — estados de página', () => {
  it('sin sesión redirige al login', () => {
    render(<OrdersClient />)
    expect(
      screen.getByText('Redirigiendo al inicio de sesión…'),
    ).toBeInTheDocument()
  })

  it('sin pedidos muestra vacío real con CTA', async () => {
    login()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ docs: [] }),
      }),
    )
    render(<OrdersClient />)
    expect(await screen.findByText('Todavía no tenés pedidos')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Explorar catálogo' }),
    ).toBeInTheDocument()
  })

  it('lista pedidos agrupados con total y detalle expandible', async () => {
    login()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ docs: [ORDER] }),
      }),
    )
    render(<OrdersClient />)
    expect(await screen.findByText('Pedido #RG-000124')).toBeInTheDocument()
    expect(screen.getByText('Vela Vainilla & Ámbar')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Vela Vainilla & Ámbar' })).toHaveAttribute(
      'href',
      '/catalogo/vela-vainilla-ambar',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ver pedido' }))
    expect(screen.getByText('Destino')).toBeInTheDocument()
  })

  it('filtros por estado y búsqueda funcionan', async () => {
    login()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ docs: [ORDER] }),
      }),
    )
    render(<OrdersClient />)
    await screen.findByText('Pedido #RG-000124')
    fireEvent.change(screen.getByLabelText('Estado'), {
      target: { value: 'pending' },
    })
    expect(screen.queryByText('Pedido #RG-000124')).toBeNull()
    expect(
      screen.getByText('Ningún pedido coincide con los filtros.'),
    ).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Estado'), {
      target: { value: 'all' },
    })
    expect(screen.getByText('Pedido #RG-000124')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Buscar en tus pedidos'), {
      target: { value: 'difusor' },
    })
    expect(screen.queryByText('Pedido #RG-000124')).toBeNull()
  })

  function stubOrdersAndProducts(products: Array<Record<string, unknown>> | 'fail') {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (String(url).startsWith('/api/products')) {
          return products === 'fail'
            ? Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
            : Promise.resolve({ ok: true, json: () => Promise.resolve({ docs: products }) })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ docs: [ORDER] }) })
      }),
    )
  }

  async function clickBuyAgain() {
    render(<OrdersClient />)
    await screen.findByText('Pedido #RG-000124')
    fireEvent.click(screen.getByRole('button', { name: 'Volver a comprar' }))
  }

  it('volver a comprar con producto Activo lo agrega al carrito', async () => {
    login()
    useCartStore.getState().clearCart()
    stubOrdersAndProducts([{ id: 4, active: true, soldOut: false, stock: 10 }])
    await clickBuyAgain()
    await waitFor(() => {
      expect(useCartStore.getState().items.map((i) => i.slug)).toContain('vela-vainilla-ambar')
    })
  })

  it('volver a comprar NO agrega un producto Agotado (manual o sin stock) y avisa', async () => {
    for (const product of [
      { id: 4, active: true, soldOut: true, stock: 10 },
      { id: 4, active: true, soldOut: false, stock: 0 },
    ]) {
      login()
      useCartStore.getState().clearCart()
      stubOrdersAndProducts([product])
      const { unmount } = render(<OrdersClient />)
      await screen.findByText('Pedido #RG-000124')
      fireEvent.click(screen.getByRole('button', { name: 'Volver a comprar' }))
      expect(await screen.findByRole('status')).toHaveTextContent('Sin disponibilidad')
      expect(useCartStore.getState().items).toHaveLength(0)
      unmount()
    }
  })

  it('volver a comprar mantiene el comportamiento para un producto Oculto: tampoco se agrega', async () => {
    login()
    useCartStore.getState().clearCart()
    stubOrdersAndProducts([{ id: 4, active: false, soldOut: false, stock: 10 }])
    await clickBuyAgain()
    expect(await screen.findByRole('status')).toHaveTextContent('Sin disponibilidad')
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('un producto borrado del catálogo se informa y no se agrega', async () => {
    login()
    useCartStore.getState().clearCart()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) =>
        String(url).startsWith('/api/products')
          ? Promise.resolve({ ok: true, json: () => Promise.resolve({ docs: [] }) })
          : Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  docs: [{ ...ORDER, items: [{ ...ORDER.items[0], product: null }] }],
                }),
            }),
      ),
    )
    await clickBuyAgain()
    expect(await screen.findByRole('status')).toHaveTextContent('Vela Vainilla & Ámbar')
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('dos clics seguidos no suman el producto dos veces', async () => {
    login()
    useCartStore.getState().clearCart()
    stubOrdersAndProducts([{ id: 4, active: true, soldOut: false, stock: 10 }])
    await clickBuyAgain()
    const button = screen.getByRole('button', { name: 'Volver a comprar' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    await waitFor(() => expect(useCartStore.getState().items).toHaveLength(1))
    expect(useCartStore.getState().items[0].quantity).toBe(2)
  })

  it('si no se puede verificar la disponibilidad no agrega nada', async () => {
    login()
    useCartStore.getState().clearCart()
    stubOrdersAndProducts('fail')
    await clickBuyAgain()
    expect(await screen.findByRole('status')).toHaveTextContent('No pudimos verificar')
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})
