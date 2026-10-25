import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CheckoutSummary } from './checkout-summary'
import { useCartStore } from '@/lib/cart'
import { useCouponStore } from '@/lib/checkout/coupon-store'

const ITEMS = [
  {
    id: '1',
    productId: '1',
    slug: 'vela',
    name: 'Vela',
    price: 10000,
    compareAtPrice: null,
    wholesalePrice: null,
    isWholesaleAvailable: false,
    image: null,
    quantity: 1,
  },
  {
    id: '2',
    productId: '2',
    slug: 'box',
    name: 'Box',
    price: 4500,
    compareAtPrice: null,
    wholesalePrice: null,
    isWholesaleAvailable: false,
    image: null,
    quantity: 2,
  },
]

function stubCoupons(valid: Record<string, number>) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async (_url: string, init: { body: string }) => {
      const code = JSON.parse(init.body).code as string
      const percent = valid[code]
      return percent
        ? { ok: true, json: async () => ({ valid: true, code, percent }) }
        : { ok: false, json: async () => ({ valid: false }) }
    }),
  )
}

beforeEach(() => {
  vi.unstubAllGlobals()
  stubCoupons({ REGALARTE10: 10 })
  useCartStore.setState({ items: ITEMS, mode: 'RETAIL', hydrated: true } as never)
  useCouponStore.getState().clear()
})

describe('CheckoutSummary — cupón opcional', () => {
  it('muestra el botón de cupón (campo cerrado) y el botón Pagar y finalizar', () => {
    render(<CheckoutSummary />)
    expect(screen.getByText('Resumen de compra')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Ingresar código de cupón' }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Código de cupón')).toBeNull()
    expect(screen.getByRole('button', { name: 'Pagar y finalizar' })).toHaveAttribute(
      'type',
      'submit',
    )
    expect(screen.getAllByText(/19\.000/).length).toBeGreaterThanOrEqual(1)
  })

  it('el cupón es opcional: sin usarlo el total es el subtotal y se puede pagar directo', () => {
    render(<CheckoutSummary />)
    expect(screen.queryByText(/Descuento/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Pagar y finalizar' })).toBeEnabled()
  })

  it('cupón válido actualiza descuento y total', async () => {
    render(<CheckoutSummary />)
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar código de cupón' }))
    fireEvent.change(screen.getByLabelText('Código de cupón'), {
      target: { value: 'regalarte10' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByText(/Descuento \(REGALARTE10\)/)).toBeInTheDocument()
    expect(screen.getAllByText(/1\.900/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/17\.100/).length).toBeGreaterThanOrEqual(1)
  })

  it('Enter en el campo aplica el cupón y NO envía el pedido', async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <CheckoutSummary />
      </form>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar código de cupón' }))
    const input = screen.getByLabelText('Código de cupón')
    fireEvent.change(input, { target: { value: 'regalarte10' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(await screen.findByText(/Descuento \(REGALARTE10\)/)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('cupón inválido muestra error sin tocar el total', async () => {
    render(<CheckoutSummary />)
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar código de cupón' }))
    fireEvent.change(screen.getByLabelText('Código de cupón'), {
      target: { value: 'TRUCHO' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/inválido/i)
    expect(screen.queryByText(/Descuento/)).toBeNull()
  })

  it('muestra el envío y bloquea el botón mientras se procesa', () => {
    const { rerender } = render(<CheckoutSummary shipping={{ label: 'Gratis', free: true }} />)
    expect(screen.getByText('Gratis')).toBeInTheDocument()
    rerender(<CheckoutSummary shipping={{ label: 'Gratis', free: true }} status="submitting" />)
    expect(screen.getByRole('button', { name: /Procesando/ })).toBeDisabled()
  })
})
