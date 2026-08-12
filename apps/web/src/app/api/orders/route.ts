/**
 * Orders: route handler `POST /api/orders`.
 *
 * Valida el payload recibido del checkout, llama a `createOrder()` y
 * devuelve `CreateOrderResult` mapeado a HTTP.
 *
 * Este endpoint es server-only: nunca debe ser invocado directamente
 * por el cliente sin pasar por `submitCheckout()` (que es quien arma
 * el snapshot desde el carrito).
 */

import { NextResponse, type NextRequest } from 'next/server'

import { createOrder, OrderRejectedError } from '@/lib/orders/service'
import type { CreateOrderInput, CreateOrderResult } from '@/lib/orders/types'

const REQUIRED_CUSTOMER_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
] as const

const REQUIRED_ADDRESS_FIELDS = [
  'province',
  'city',
  'street',
  'postalCode',
] as const

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value)
}

function validate(input: unknown): {
  ok: true
  value: CreateOrderInput
} | {
  ok: false
  errors: { path: string; message: string }[]
} {
  const errors: { path: string; message: string }[] = []

  if (!input || typeof input !== 'object') {
    return { ok: false, errors: [{ path: '', message: 'Body invalido' }] }
  }

  const body = input as Record<string, unknown>

  const customer = (body.customer ?? {}) as Record<string, unknown>
  for (const field of REQUIRED_CUSTOMER_FIELDS) {
    if (!isNonEmptyString(customer[field])) {
      errors.push({ path: `customer.${field}`, message: 'Requerido' })
    }
  }
  if (
    isNonEmptyString(customer.email) &&
    !isValidEmail(String(customer.email))
  ) {
    errors.push({ path: 'customer.email', message: 'Email invalido' })
  }

  const address = (body.address ?? {}) as Record<string, unknown>
  for (const field of REQUIRED_ADDRESS_FIELDS) {
    if (!isNonEmptyString(address[field])) {
      errors.push({ path: `address.${field}`, message: 'Requerido' })
    }
  }

  const mode = body.mode
  if (mode !== 'RETAIL' && mode !== 'WHOLESALE') {
    errors.push({ path: 'mode', message: 'Modo invalido' })
  }

  const rawItems = body.items
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    errors.push({ path: 'items', message: 'Carrito vacio' })
    return { ok: false, errors }
  }

  const items = rawItems.map((rawItem, index) => {
    const item = (rawItem ?? {}) as Record<string, unknown>
    if (!isNonEmptyString(item.productId)) {
      errors.push({ path: `items.${index}.productId`, message: 'Requerido' })
    }
    if (!isNonEmptyString(item.slug)) {
      errors.push({ path: `items.${index}.slug`, message: 'Requerido' })
    }
    if (!isNonEmptyString(item.name)) {
      errors.push({ path: `items.${index}.name`, message: 'Requerido' })
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      errors.push({
        path: `items.${index}.quantity`,
        message: 'Cantidad invalida',
      })
    }
    if (typeof item.price !== 'number' || item.price < 0) {
      errors.push({
        path: `items.${index}.price`,
        message: 'Precio invalido',
      })
    }
    return item
  })

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      customer: {
        firstName: String(customer.firstName),
        lastName: String(customer.lastName),
        email: String(customer.email),
        phone: String(customer.phone),
      },
      address: {
        province: String(address.province),
        city: String(address.city),
        street: String(address.street),
        postalCode: String(address.postalCode),
      },
      notes: {
        message:
          typeof (body.notes as Record<string, unknown> | undefined)?.message ===
          'string'
            ? String((body.notes as Record<string, unknown>).message)
            : '',
      },
      mode: mode as 'RETAIL' | 'WHOLESALE',
      items: items.map((item) => ({
        id: String(item.id ?? item.productId ?? ''),
        productId: String(item.productId),
        slug: String(item.slug),
        name: String(item.name),
        price: Number(item.price),
        compareAtPrice:
          typeof item.compareAtPrice === 'number' ? item.compareAtPrice : null,
        wholesalePrice:
          typeof item.wholesalePrice === 'number' ? item.wholesalePrice : null,
        isWholesaleAvailable: Boolean(item.isWholesaleAvailable),
        image:
          (item.image as { url?: string | null; alt?: string | null } | null) ??
          null,
        quantity: Number(item.quantity),
      })),
    },
  }
}

function mapFieldErrorsToMessage(
  errors: { path: string; message: string }[],
): string {
  return errors.length === 1
    ? errors[0].message
    : 'Revisá los datos obligatorios antes de continuar.'
}

const NO_STORE: ResponseInit['headers'] = {
  'Cache-Control': 'no-store, max-age=0',
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Body invalido',
      } satisfies CreateOrderResult,
      { status: 400, headers: NO_STORE },
    )
  }

  const result = validate(payload)
  if (!result.ok) {
    return NextResponse.json(
      {
        status: 'error',
        message: mapFieldErrorsToMessage(result.errors),
        fieldErrors: result.errors,
      } satisfies CreateOrderResult,
      { status: 400, headers: NO_STORE },
    )
  }

  try {
    const created = await createOrder(result.value)
    return NextResponse.json(created, { status: 201, headers: NO_STORE })
  } catch (err) {
    if (err instanceof OrderRejectedError) {
      return NextResponse.json(
        {
          status: 'error',
          message:
            'Algunos productos de tu carrito ya no están disponibles. Revisá el catálogo e intentá nuevamente.',
        } satisfies CreateOrderResult,
        { status: 409, headers: NO_STORE },
      )
    }
    return NextResponse.json(
      {
        status: 'error',
        message:
          'No pudimos crear tu pedido. Intentá de nuevo en unos minutos.',
      } satisfies CreateOrderResult,
      { status: 500, headers: NO_STORE },
    )
  }
}
