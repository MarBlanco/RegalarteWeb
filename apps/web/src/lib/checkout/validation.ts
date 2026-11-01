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
 *     guiones y parentesis); sin letras ni otros simbolos.
 *   - Direccion, ciudad y provincia: deben contener letras (no "x" ni "1").
 *   - Codigo postal argentino: 4 digitos, con letra previa y sufijo de 3
 *     letras opcionales (3280, C1414, C1414ABC).
 */

import type { CheckoutFormValues } from './types'
import { CUSTOMER_FIELDS, ADDRESS_FIELDS } from './fields'
import { getFieldValue, type CheckoutFieldKey } from './form-helpers'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DIGITS_ONLY = /\d/g
const PHONE_CHARS = /^[\d\s()+\-.]+$/
const HAS_LETTER = /[A-Za-zÀ-ɏ]/
const AR_POSTAL_CODE = /^[A-Za-z]?\d{4}\s?[A-Za-z]{0,3}$/

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value)
}

function hasEnoughDigits(value: string, min = 6): boolean {
  const digits = value.match(DIGITS_ONLY)
  return Boolean(digits) && digits!.length >= min
}

/** Teléfono: solo dígitos y separadores habituales, con al menos 6 dígitos. */
export function isValidPhone(value: string): boolean {
  const v = value.trim()
  return PHONE_CHARS.test(v) && hasEnoughDigits(v)
}

function isValidAddressValue(id: string, value: string): string | null {
  const v = value.trim()
  if (id === 'address.postalCode') {
    return AR_POSTAL_CODE.test(v) ? null : 'Código postal inválido'
  }
  if (id === 'address.street') {
    return v.length >= 3 && HAS_LETTER.test(v) ? null : 'Dirección inválida'
  }
  if (id === 'address.city') {
    return v.length >= 2 && HAS_LETTER.test(v) ? null : 'Ciudad inválida'
  }
  if (id === 'address.province') {
    return HAS_LETTER.test(v) ? null : 'Provincia inválida'
  }
  return null
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
    if (field.type === 'tel' && value.trim().length > 0 && !isValidPhone(value)) {
      errors[field.id] = 'Teléfono inválido'
    }
  }

  for (const field of ADDRESS_FIELDS) {
    const value = getFieldValue(values, field.id as CheckoutFieldKey)
    if (field.required && value.trim().length === 0) {
      errors[field.id] = 'Requerido'
      continue
    }
    const invalid = isValidAddressValue(field.id, value)
    if (invalid) errors[field.id] = invalid
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
