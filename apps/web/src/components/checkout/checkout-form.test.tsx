import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CheckoutForm } from './checkout-form'
import { useCartStore } from '@/lib/cart'
import { useCouponStore } from '@/lib/checkout/coupon-store'
import { useAuth } from '@/hooks/use-auth'

// Proveedor de pago controlable (Mercado Pago simulado en memoria; sin red).
const provider = { name: 'mercadopago', initiate: vi.fn(), getStatus: vi.fn(), cancel: vi.fn() }
vi.mock('@/lib/payment', () => ({ getPaymentProvider: () => provider }))

const ITEM = {
  id: '4',
  productId: '4',
  slug: 'vela-uno',
  name: 'Vela Uno',
  price: 30000,
  compareAtPrice: null,
  wholesalePrice: null,
  isWholesaleAvailable: false,
  image: null,
  quantity: 1,
}

let orderBodies: Array<Record<string, any>> = []
const assign = vi.fn()

beforeEach(() => {
  orderBodies = []
  assign.mockReset()
  provider.initiate.mockReset()
  provider.initiate.mockResolvedValue({
    status: 'ready',
    externalId: 'mp-1',
    redirectUrl: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref=1',
  })
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, assign },
  })
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async (url: string, init?: { body?: string }) => {
      if (String(url).includes('/api/orders')) {
        orderBodies.push(JSON.parse(init?.body ?? '{}'))
        return {
          ok: true,
          json: async () => ({
            status: 'success',
            orderId: 'ord-1',
            redirectUrl: '/checkout/orden/ord-1',
          }),
        }
      }
      return { ok: false, json: async () => ({}) }
    }),
  )
  useCartStore.setState({ items: [ITEM], mode: 'RETAIL', hydrated: true } as never)
  useCouponStore.getState().clear()
  useAuth.setState({ user: null, token: null })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function fillContact() {
  fireEvent.change(screen.getByLabelText(/^Nombre/), { target: { value: 'Ana' } })
  fireEvent.change(screen.getByLabelText(/^Apellido/), { target: { value: 'Gómez' } })
  fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'ana@mail.com' } })
  fireEvent.change(screen.getByLabelText(/^Teléfono/), { target: { value: '+54 11 5555 5555' } })
}

const pay = () => fireEvent.click(screen.getByRole('button', { name: 'Pagar y finalizar' }))

describe('CheckoutForm — estilo Mercado Pago', () => {
  it('muestra producto, forma de entrega, medio de pago y resumen con el botón de pago', () => {
    render(<CheckoutForm />)
    expect(screen.getByText('Vela Uno')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Forma de entrega' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Envío/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: /Retiro/ })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('radiogroup', { name: 'Medio de pago' })).toHaveTextContent('Mercado Pago')
    expect(screen.getByRole('button', { name: 'Ingresar código de cupón' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pagar y finalizar' })).toBeInTheDocument()
  })

  it('retiro: no pide dirección, envía el punto de retiro y redirige a Mercado Pago', async () => {
    render(<CheckoutForm />)
    fireEvent.click(screen.getByRole('radio', { name: /Retiro/ }))
    expect(screen.queryByLabelText(/^Dirección/)).toBeNull()
    expect(screen.getByText(/Retirás en Colón, Entre Ríos/)).toBeInTheDocument()
    fillContact()
    pay()

    await waitFor(() => expect(assign).toHaveBeenCalled())
    expect(assign).toHaveBeenCalledWith(
      'https://www.mercadopago.com.ar/checkout/v1/redirect?pref=1',
    )
    expect(orderBodies).toHaveLength(1)
    expect(orderBodies[0].address).toEqual({
      province: 'Entre Ríos',
      city: 'Colón',
      street: 'Retiro en local',
      postalCode: '3280',
    })
    expect(orderBodies[0].notes.message).toBe('RETIRO EN LOCAL')
    // El carrito se vacía recién cuando el pago quedó iniciado.
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('envío sin dirección: marca los errores y abre el formulario de dirección', async () => {
    render(<CheckoutForm />)
    fillContact()
    pay()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getAllByText('Requerido').length).toBeGreaterThanOrEqual(1)
    expect(orderBodies).toHaveLength(0)
    expect(useCartStore.getState().items).toHaveLength(1)
  })

  it('si Mercado Pago falla al iniciar el pago, el carrito se conserva', async () => {
    provider.initiate.mockRejectedValue(new Error('MP caído'))
    render(<CheckoutForm />)
    fireEvent.click(screen.getByRole('radio', { name: /Retiro/ }))
    fillContact()
    pay()

    expect(await screen.findByText(/No se pudo iniciar el pago/)).toBeInTheDocument()
    expect(assign).not.toHaveBeenCalled()
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Volver a intentar' })).toBeInTheDocument()
  })

  it('cuenta con dirección guardada: se muestra como tarjeta y "Cambiar dirección" abre el formulario', async () => {
    useAuth.setState({
      token: 't',
      user: {
        id: '1',
        email: 'm@mail.com',
        name: 'Martín Blanco',
        role: 'retail',
        customer_type: 'RETAIL',
        phone: '3447 111111',
        address: {
          street: 'Lugones',
          number: '5',
          postalCode: '3280',
          locality: 'Colón',
          province: 'Entre Ríos',
        },
      },
    })
    render(<CheckoutForm />)
    expect(await screen.findByText(/Lugones 5, Colón, Entre Ríos/)).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Dirección/)).toBeNull()
    expect(screen.getByLabelText(/^Nombre/)).toHaveValue('Martín')
    expect(screen.getByLabelText(/^Email/)).toHaveValue('m@mail.com')

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar dirección' }))
    expect(screen.getByLabelText(/^Dirección/)).toHaveValue('Lugones 5')
  })

  it('el cupón es opcional: sin usarlo se paga directo sin enviar cupón', async () => {
    render(<CheckoutForm />)
    fireEvent.click(screen.getByRole('radio', { name: /Retiro/ }))
    fillContact()
    pay()
    await waitFor(() => expect(orderBodies).toHaveLength(1))
    expect(orderBodies[0].couponCode).toBeUndefined()
  })
})
