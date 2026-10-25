/**
 * Checkout: forma de entrega (Envío / Retiro) al estilo de Mercado Pago.
 *
 * El pedido (Orders) exige una dirección completa y no tiene un campo de método de
 * entrega, así que un retiro se guarda con el punto de retiro del local como dirección y
 * una marca al inicio de las observaciones. No requiere migración: el equipo lo ve
 * en el admin como "Retiro en local".
 */
import type { CheckoutAddress, CheckoutFormValues } from './types'

export type DeliveryMethod = 'shipping' | 'pickup'

export const PICKUP_NOTE_PREFIX = 'RETIRO EN LOCAL'

/** Punto de retiro: el mismo que muestra el pie de la tienda (Colón, Entre Ríos). */
export const PICKUP_POINT = {
  name: 'Colón, Entre Ríos',
  address: {
    province: 'Entre Ríos',
    city: 'Colón',
    street: 'Retiro en local',
    postalCode: '3280',
  } satisfies CheckoutAddress,
} as const

/** Aplica la forma de entrega elegida a los valores que se envían al backend. */
export function applyDelivery(
  values: CheckoutFormValues,
  method: DeliveryMethod,
): CheckoutFormValues {
  if (method !== 'pickup') return values
  const message = values.notes.message.trim()
  return {
    ...values,
    address: { ...PICKUP_POINT.address },
    notes: {
      message: message ? `${PICKUP_NOTE_PREFIX} — ${message}` : PICKUP_NOTE_PREFIX,
    },
  }
}

export function isAddressComplete(address: CheckoutAddress): boolean {
  return (
    address.street.trim() !== '' &&
    address.city.trim() !== '' &&
    address.province.trim() !== '' &&
    address.postalCode.trim() !== ''
  )
}

/** "Lugones 5, Colón, Entre Ríos (3280)" — omite lo que esté vacío. */
export function formatAddressLine(address: CheckoutAddress): string {
  const place = [address.city, address.province]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ')
  const postal = address.postalCode.trim() ? `(${address.postalCode.trim()})` : ''
  return [address.street.trim(), [place, postal].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')
}

export interface ShippingQuote {
  /** Texto para mostrar: "Gratis" o "A coordinar". */
  label: string
  free: boolean
}

/**
 * El backend no calcula costo de envío (siempre 0): se muestra "Gratis" en retiro o cuando
 * el subtotal alcanza el umbral de envío gratis de la tienda; si no, "A coordinar".
 */
export function shippingQuote(
  method: DeliveryMethod,
  subtotal: number,
  freeShippingThreshold: number,
): ShippingQuote {
  if (method === 'pickup' || subtotal >= freeShippingThreshold) {
    return { label: 'Gratis', free: true }
  }
  return { label: 'A coordinar', free: false }
}

interface ProfileLike {
  name?: string
  email?: string
  phone?: string
  address?: {
    street?: string
    number?: string
    postalCode?: string
    locality?: string
    province?: string
  } | null
  province?: string
  city?: string
}

/** Datos guardados en la cuenta para precargar el checkout (solo lo que exista). */
export function checkoutDefaultsFromProfile(user: ProfileLike): {
  customer: { firstName: string; lastName: string; email: string; phone: string }
  address: CheckoutAddress
} {
  const [firstName = '', ...rest] = (user.name ?? '').trim().split(/\s+/)
  const a = user.address ?? {}
  const street = [a.street, a.number].map((p) => (p ?? '').trim()).filter(Boolean).join(' ')
  return {
    customer: {
      firstName,
      lastName: rest.join(' '),
      email: user.email ?? '',
      phone: user.phone ?? '',
    },
    address: {
      street,
      city: (a.locality ?? user.city ?? '').trim(),
      province: (a.province ?? user.province ?? '').trim(),
      postalCode: (a.postalCode ?? '').trim(),
    },
  }
}
