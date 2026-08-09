/**
 * Checkout: validacion general client-side.
 *
 * Complementa la validacion server-side de POST /api/orders (que sigue
 * siendo la autoridad final). Esta capa evita un round-trip cuando el
 * formulario tiene datos invalidos, reutilizando la misma fuente de
 * verdad de campos (CUSTOMER_FIELDS / ADDRESS_FIELDS) y devolviendo
 * errores en el mismo formato que el server: { path: message } indexado
 * como Partial<Record<string, string>> con claves "customer.email", etc.
 *
 * Reglas (sin inventar funcionalidad):
 *   - Campos marcados required en FieldDef: no pueden estar vacios.
 *   - Campos type email: formato basico de email.
 *   - Campos type tel: al menos 6 digitos (pueden incluir +, espacios,
 *     guiones y parentesis).
 */

import type { CheckoutFormValues } from './types'
import { CUSTOMER_FIELDS, ADDRESS_FIELDS } from './fields'
import { getFieldValue, type CheckoutFieldKey } from './form-helpers'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DIGITS_ONLY = /\d/g

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value)
}

function hasEnoughDigits(value: string, min = 6): boolean {
  const digits = value.match(DIGITS_ONLY)
  return Boolean(digits) && digits!.length >= min
}

export function validateCheckoutForm(
  values: CheckoutFormValues,
): Partial<Record<string, string>> {
  const errors: Partial<Record<string, string>> = {}

  for (const field of CUSTOMER_FIELDS) {
    const value = getFieldValue(values, field.id as CheckoutFieldKey)
    if (field.required && value.trim().length === 0) {
      errors[field.id] = 'Requerido'
      continue
    }
    if (field.type === 'email' && value.trim().length > 0 && !isValidEmail(value)) {
      errors[field.id] = 'Email inválido'
    }
    if (field.type === 'tel' && value.trim().length > 0 && !hasEnoughDigits(value)) {
      errors[field.id] = 'Teléfono inválido'
    }
  }

  for (const field of ADDRESS_FIELDS) {
    const value = getFieldValue(values, field.id as CheckoutFieldKey)
    if (field.required && value.trim().length === 0) {
      errors[field.id] = 'Requerido'
    }
  }

  return errors
}

export function fieldErrorsToMessage(
  errors: Partial<Record<string, string>>,
): string {
  const entries = Object.values(errors).filter(Boolean)
  return entries.length <= 1
    ? (entries[0] ?? 'Revisá los datos antes de continuar.')
    : 'Revisá los datos obligatorios antes de continuar.'
}
