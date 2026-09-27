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

  it('volver a comprar lleva al carrito', async () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'Volver a comprar' }))
    await waitFor(() => {
      expect(
        useCartStore.getState().items.map((i) => i.slug),
      ).toContain('vela-vainilla-ambar')
    })
  })
})
