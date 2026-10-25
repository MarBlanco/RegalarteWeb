import { describe, it, expect } from 'vitest'
import {
  PICKUP_NOTE_PREFIX,
  PICKUP_POINT,
  applyDelivery,
  checkoutDefaultsFromProfile,
  formatAddressLine,
  isAddressComplete,
  shippingQuote,
} from './delivery'
import { EMPTY_CHECKOUT_FORM, type CheckoutFormValues } from './types'
import { validateCheckoutForm } from './validation'

const FORM: CheckoutFormValues = {
  customer: {
    firstName: 'Ana',
    lastName: 'Gómez',
    email: 'ana@mail.com',
    phone: '+54 11 5555 5555',
  },
  address: {
    province: 'Buenos Aires',
    city: 'CABA',
    street: 'Av. Siempre Viva 742',
    postalCode: 'C1414',
  },
  notes: { message: 'Tocar timbre' },
}

describe('applyDelivery', () => {
  it('envío: no modifica los valores', () => {
    expect(applyDelivery(FORM, 'shipping')).toBe(FORM)
  })

  it('retiro: usa el punto de retiro y marca las observaciones', () => {
    const out = applyDelivery(FORM, 'pickup')
    expect(out.address).toEqual(PICKUP_POINT.address)
    expect(out.notes.message).toBe(`${PICKUP_NOTE_PREFIX} — Tocar timbre`)
    expect(out.customer).toEqual(FORM.customer)
  })

  it('retiro sin observaciones deja solo la marca', () => {
    const out = applyDelivery({ ...FORM, notes: { message: '  ' } }, 'pickup')
    expect(out.notes.message).toBe(PICKUP_NOTE_PREFIX)
  })

  it('retiro pasa la validación aunque no haya dirección cargada', () => {
    const noAddress = { ...FORM, address: EMPTY_CHECKOUT_FORM.address }
    expect(Object.keys(validateCheckoutForm(noAddress))).toContain('address.street')
    expect(validateCheckoutForm(applyDelivery(noAddress, 'pickup'))).toEqual({})
  })
})

describe('dirección', () => {
  it('isAddressComplete exige los 4 campos', () => {
    expect(isAddressComplete(FORM.address)).toBe(true)
    expect(isAddressComplete({ ...FORM.address, postalCode: ' ' })).toBe(false)
  })

  it('formatAddressLine omite lo vacío', () => {
    expect(formatAddressLine(FORM.address)).toBe(
      'Av. Siempre Viva 742, CABA, Buenos Aires (C1414)',
    )
    expect(
      formatAddressLine({ province: '', city: 'Colón', street: 'Lugones 5', postalCode: '' }),
    ).toBe('Lugones 5, Colón')
  })
})

describe('shippingQuote', () => {
  it('retiro es gratis siempre', () => {
    expect(shippingQuote('pickup', 0, 105000)).toEqual({ label: 'Gratis', free: true })
  })

  it('envío gratis desde el umbral; si no, a coordinar', () => {
    expect(shippingQuote('shipping', 105000, 105000).free).toBe(true)
    expect(shippingQuote('shipping', 104999, 105000)).toEqual({
      label: 'A coordinar',
      free: false,
    })
  })
})

describe('checkoutDefaultsFromProfile', () => {
  it('precarga contacto y dirección guardada', () => {
    const d = checkoutDefaultsFromProfile({
      name: 'Martín Blanco Pérez',
      email: 'm@mail.com',
      phone: '3447 111111',
      address: {
        street: 'Lugones',
        number: '5',
        postalCode: '3280',
        locality: 'Colón',
        province: 'Entre Ríos',
      },
    })
    expect(d.customer).toEqual({
      firstName: 'Martín',
      lastName: 'Blanco Pérez',
      email: 'm@mail.com',
      phone: '3447 111111',
    })
    expect(d.address).toEqual({
      street: 'Lugones 5',
      city: 'Colón',
      province: 'Entre Ríos',
      postalCode: '3280',
    })
    expect(isAddressComplete(d.address)).toBe(true)
  })

  it('cuenta sin dirección: dirección vacía, sin romper', () => {
    const d = checkoutDefaultsFromProfile({ name: 'Ana', email: 'a@b.co' })
    expect(d.address).toEqual({ street: '', city: '', province: '', postalCode: '' })
    expect(d.customer.lastName).toBe('')
  })
})
