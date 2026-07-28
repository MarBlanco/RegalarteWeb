/**
 * Checkout: tipos publicos del formulario.
 *
 * Alineado con docs (Backend Handoff - Checkout flow):
 *  - Datos del cliente (nombre, apellido, email, telefono)
 *  - Direccion de envio (provincia, ciudad, direccion, codigo postal)
 *  - Observaciones (nota libre, opcional)
 *
 * No incluye: numeros de tarjeta, validaciones complejas ni persistencia.
 * Esos vienen en pasos posteriores (Mercado Pago, Orders).
 */

export interface CheckoutCustomer {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface CheckoutAddress {
  province: string
  city: string
  street: string
  postalCode: string
}

export interface CheckoutNotes {
  message: string
}

export interface CheckoutFormValues {
  customer: CheckoutCustomer
  address: CheckoutAddress
  notes: CheckoutNotes
}

export const EMPTY_CHECKOUT_FORM: CheckoutFormValues = {
  customer: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  },
  address: {
    province: '',
    city: '',
    street: '',
    postalCode: '',
  },
  notes: {
    message: '',
  },
}
