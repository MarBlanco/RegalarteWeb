/**
 * Checkout: helpers de paths tipados para el form controlado.
 */

import type { CheckoutFormValues } from './types'

type DeepKeys<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends string
        ? `${Prefix}${K}`
        : DeepKeys<T[K], `${Prefix}${K}.`>
    }[keyof T & string]
  : never

export type CheckoutFieldKey = DeepKeys<CheckoutFormValues>

export function getFieldValue(
  form: CheckoutFormValues,
  key: CheckoutFieldKey,
): string {
  const segments = key.split('.') as Array<keyof CheckoutFormValues | string>
  let cursor: unknown = form
  for (const seg of segments) {
    if (cursor && typeof cursor === 'object') {
      cursor = (cursor as Record<string, unknown>)[seg]
    } else {
      return ''
    }
  }
  return typeof cursor === 'string' ? cursor : ''
}

export function setFieldValue<K extends CheckoutFieldKey>(
  form: CheckoutFormValues,
  key: K,
  value: string,
): CheckoutFormValues {
  const segments = key.split('.')
  if (segments.length === 0) return form
  const next: CheckoutFormValues = structuredClone(form)
  let cursor: Record<string, unknown> = next as unknown as Record<string, unknown>
  for (let i = 0; i < segments.length - 1; i += 1) {
    const seg = segments[i]
    const child = cursor[seg]
    if (!child || typeof child !== 'object') {
      cursor[seg] = {}
    }
    cursor = cursor[seg] as Record<string, unknown>
  }
  cursor[segments[segments.length - 1]] = value
  return next
}
