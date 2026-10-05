import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OrderConfirmation } from './order-confirmation'

describe('OrderConfirmation', () => {
  it('muestra número, estado y total del pedido con salidas a compras y catálogo', () => {
    render(
      <OrderConfirmation
        order={{ orderNumber: 'RG-0001', status: 'pending', total: 12500 }}
      />,
    )
    expect(screen.getByText('Pedido RG-0001')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Estamos preparando tu pedido' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Estado: Pendiente/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver mis compras' })).toHaveAttribute(
      'href',
      '/orders',
    )
    expect(
      screen.getByRole('link', { name: 'Volver al catálogo' }),
    ).toHaveAttribute('href', '/catalogo')
  })
})
