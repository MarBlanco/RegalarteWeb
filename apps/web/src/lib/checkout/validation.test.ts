import { describe, it, expect } from 'vitest'
import { validateCheckoutForm, fieldErrorsToMessage } from '@/lib/checkout/validation'
import type { CheckoutFormValues } from '@/lib/checkout/types'

const makeValidForm = (overrides: Partial<CheckoutFormValues> = {}): CheckoutFormValues => ({
  customer: {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
    phone: '+5491112345678',
  },
  address: {
    province: 'Buenos Aires',
    city: 'CABA',
    street: 'Av. Corrientes 1234',
    postalCode: '1043',
  },
  notes: { message: '' },
  ...overrides,
})

describe('Checkout Validation', () => {
  describe('validateCheckoutForm', () => {
    it('returns empty errors for valid form', () => {
      const form = makeValidForm()
      const errors = validateCheckoutForm(form)
      expect(Object.keys(errors)).toHaveLength(0)
    })

    it('requires customer firstName', () => {
      const form = makeValidForm({ customer: { ...makeValidForm().customer, firstName: '' } })
      const errors = validateCheckoutForm(form)
      expect(errors['customer.firstName']).toBe('Requerido')
    })

    it('requires customer lastName', () => {
      const form = makeValidForm({ customer: { ...makeValidForm().customer, lastName: '' } })
      const errors = validateCheckoutForm(form)
      expect(errors['customer.lastName']).toBe('Requerido')
    })

    it('requires customer email', () => {
      const form = makeValidForm({ customer: { ...makeValidForm().customer, email: '' } })
      const errors = validateCheckoutForm(form)
      expect(errors['customer.email']).toBe('Requerido')
    })

    it('validates email format', () => {
      const form = makeValidForm({ customer: { ...makeValidForm().customer, email: 'invalid-email' } })
      const errors = validateCheckoutForm(form)
      expect(errors['customer.email']).toBe('Email inválido')
    })

    it('requires customer phone', () => {
      const form = makeValidForm({ customer: { ...makeValidForm().customer, phone: '' } })
      const errors = validateCheckoutForm(form)
      expect(errors['customer.phone']).toBe('Requerido')
    })

    it('validates phone has at least 6 digits', () => {
      const form = makeValidForm({ customer: { ...makeValidForm().customer, phone: '123' } })
      const errors = validateCheckoutForm(form)
      expect(errors['customer.phone']).toBe('Teléfono inválido')
    })

    it('accepts phone with spaces, dashes, parentheses', () => {
      const form = makeValidForm({ customer: { ...makeValidForm().customer, phone: '+54 (9) 11 1234-5678' } })
      const errors = validateCheckoutForm(form)
      expect(errors['customer.phone']).toBeUndefined()
    })

    it('requires address province', () => {
      const form = makeValidForm({ address: { ...makeValidForm().address, province: '' } })
      const errors = validateCheckoutForm(form)
      expect(errors['address.province']).toBe('Requerido')
    })

    it('requires address city', () => {
      const form = makeValidForm({ address: { ...makeValidForm().address, city: '' } })
      const errors = validateCheckoutForm(form)
      expect(errors['address.city']).toBe('Requerido')
    })

    it('requires address street', () => {
      const form = makeValidForm({ address: { ...makeValidForm().address, street: '' } })
      const errors = validateCheckoutForm(form)
      expect(errors['address.street']).toBe('Requerido')
    })

    it('requires address postalCode', () => {
      const form = makeValidForm({ address: { ...makeValidForm().address, postalCode: '' } })
      const errors = validateCheckoutForm(form)
      expect(errors['address.postalCode']).toBe('Requerido')
    })

    it('returns multiple errors when multiple fields missing', () => {
      const form = makeValidForm({
        customer: { firstName: '', lastName: '', email: '', phone: '' },
        address: { province: '', city: '', street: '', postalCode: '' },
      })
      const errors = validateCheckoutForm(form)
      expect(Object.keys(errors).length).toBeGreaterThan(1)
    })
  })

  describe('fieldErrorsToMessage', () => {
    it('returns single error message for one error', () => {
      const errors = { 'customer.email': 'Email inválido' }
      expect(fieldErrorsToMessage(errors)).toBe('Email inválido')
    })

    it('returns generic message for multiple errors', () => {
      const errors = { 'customer.email': 'Email inválido', 'customer.phone': 'Teléfono inválido' }
      expect(fieldErrorsToMessage(errors)).toBe('Revisá los datos obligatorios antes de continuar.')
    })

    it('returns default message for empty errors', () => {
      expect(fieldErrorsToMessage({})).toBe('Revisá los datos antes de continuar.')
    })
  })
})