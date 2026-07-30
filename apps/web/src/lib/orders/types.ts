/**
 * Orders: tipos compartidos entre cliente y servidor.
 *
 * El cliente envia un `CreateOrderInput` con los datos del form + un
 * snapshot del carrito. El servidor valida, calcula totales y persiste
 * un documento `Orders` en Payload.
 */

import type { CartItem, CartMode } from '@/lib/cart/types'

export type CreateOrderInput = {
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  address: {
    province: string
    city: string
    street: string
    postalCode: string
  }
  notes?: {
    message: string
  }
  mode: CartMode
  items: ReadonlyArray<CartItem>
}

export type OrderItemLine = {
  productId: string
  slug: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type OrderTotals = {
  subtotal: number
  shipping: number
  total: number
}

export type CreateOrderSuccess = {
  status: 'success'
  orderId: string
  redirectUrl: string
}

export type CreateOrderFieldError = {
  path: string
  message: string
}

export type CreateOrderError = {
  status: 'error'
  message: string
  fieldErrors?: ReadonlyArray<CreateOrderFieldError>
}

export type CreateOrderResult = CreateOrderSuccess | CreateOrderError
