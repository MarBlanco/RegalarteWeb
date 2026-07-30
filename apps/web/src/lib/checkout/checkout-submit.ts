/**
 * Checkout: servicio publico de submit del formulario.
 *
 * Contrato:
 *   submitCheckout(values) -> Promise<SubmitResult>
 *
 * SubmitResult es una union discriminada por `status`:
 *   - 'success' { redirectUrl?, orderId? }
 *   - 'error'   { message, fieldErrors? }
 *
 * Esta capa aísla al UI del backend. Hoy delega a POST /api/orders.
 */

import type { CheckoutFormValues } from './types'
import type {
  CreateOrderError,
  CreateOrderResult,
} from '@/lib/orders/types'
import type { CartItem, CartMode } from '@/lib/cart/types'
import { useCartStore } from '@/lib/cart/store'

export type CheckoutSubmitStatus =
  | 'idle'
  | 'submitting'
  | 'success'
  | 'error'

export interface CheckoutSubmitSuccess {
  status: 'success'
  redirectUrl?: string
  orderId?: string
}

export interface CheckoutSubmitError {
  status: 'error'
  message: string
  fieldErrors?: Partial<Record<string, string>>
}

export type SubmitResult = CheckoutSubmitSuccess | CheckoutSubmitError

function indexFieldErrors(
  errors: ReadonlyArray<{ path: string; message: string }>,
): Partial<Record<string, string>> {
  const map: Partial<Record<string, string>> = {}
  for (const { path, message } of errors) {
    if (!path) continue
    if (!map[path]) map[path] = message
  }
  return map
}

function mapCreateOrderError(error: CreateOrderError): SubmitResult {
  return {
    status: 'error',
    message: error.message,
    fieldErrors: error.fieldErrors
      ? indexFieldErrors(error.fieldErrors)
      : undefined,
  }
}

export async function submitCheckout(
  values: CheckoutFormValues,
): Promise<SubmitResult> {
  const cart = useCartStore.getState()
  const items: CartItem[] = cart.items
  const mode: CartMode = cart.mode

  if (items.length === 0) {
    return {
      status: 'error',
      message: 'Tu carrito está vacío. Volvé al catálogo para elegir productos.',
    }
  }

  const body = {
    customer: values.customer,
    address: values.address,
    notes: values.notes,
    mode,
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      price: item.price,
      compareAtPrice: item.compareAtPrice,
      wholesalePrice: item.wholesalePrice,
      isWholesaleAvailable: item.isWholesaleAvailable,
      image: item.image,
      quantity: item.quantity,
    })),
  }

  let response: Response
  try {
    response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return {
      status: 'error',
      message:
        'No pudimos procesar tu pedido. Revisá tu conexión e intentá de nuevo.',
    }
  }

  let payload: CreateOrderResult
  try {
    payload = (await response.json()) as CreateOrderResult
  } catch {
    return {
      status: 'error',
      message: 'Respuesta inesperada del servidor. Intentá de nuevo.',
    }
  }

  if (!response.ok || payload.status === 'error') {
    if (payload.status === 'error') return mapCreateOrderError(payload)
    return {
      status: 'error',
      message: 'No pudimos procesar tu pedido. Intentá de nuevo.',
    }
  }

  return {
    status: 'success',
    orderId: payload.orderId,
    redirectUrl: payload.redirectUrl,
  }
}
