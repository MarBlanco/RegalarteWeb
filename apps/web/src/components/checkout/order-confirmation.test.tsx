import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OrderConfirmation } from './order-confirmation'

describe('OrderConfirmation', () => {
  it('muestra número, estado y total del pedido con salidas a compras e inicio', () => {
    render(
      <OrderConfirmation
        order={{ orderNumber: 'RG-0001', status: 'pending', total: 12500 }}
      />,
    )
    expect(screen.getByText('Pedido RG-0001')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Recibimos tu pedido' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Estado: Pendiente/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver mis compras' })).toHaveAttribute(
      'href',
      '/orders',
    )
    expect(
      screen.getByRole('link', { name: 'Volver al inicio' }),
    ).toHaveAttribute('href', '/')
  })

  it('pago simulado: avisa que no hay cobro y no dice que se está preparando', () => {
    render(
      <OrderConfirmation
        simulated
        order={{ orderNumber: 'RG-0002', status: 'pending', total: 9000 }}
      />,
    )
    expect(
      screen.getByRole('heading', { name: 'Pedido registrado (modo prueba)' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/no se realizó ningún cobro/i)
    expect(screen.queryByText('Recibimos tu pedido')).toBeNull()
  })

  it('pago simulado no altera un pedido ya pagado', () => {
    render(
      <OrderConfirmation
        simulated
        order={{ orderNumber: 'RG-0003', status: 'paid', total: 9000 }}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Tu pago fue confirmado' })).toBeInTheDocument()
    expect(screen.queryByRole('status')).toBeNull()
  })
})
