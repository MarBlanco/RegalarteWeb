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
 * Esta capa aisla al UI del backend. Hoy contiene un mock con
 * latencia simulada; el reemplazo por la llamada real al endpoint
 * de Orders vive en TICKET-009 (Orders).
 */

import type { CheckoutFormValues } from './types'

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
  /**
   * Errores por campo indexados por la misma key que usa el form
 * (ej. "customer.email"). Solo presente cuando el backend (o el mock)
 * devuelve errores por campo. Las keys vacias se ignoran en el render.
   */
  fieldErrors?: Partial<Record<string, string>>
}

export type SubmitResult = CheckoutSubmitSuccess | CheckoutSubmitError

// TODO(TICKET-009): reemplazar este mock por una llamada real al endpoint
// de Orders (coleccion de Payload + servicio de Payments). El contrato
// publico (submitCheckout / SubmitResult) se mantiene, solo cambia el
// cuerpo de la funcion. Tambien conviene mover la validacion de campos
// al backend y traducir la respuesta a SubmitResult aqui.
export async function submitCheckout(
  values: CheckoutFormValues,
): Promise<SubmitResult> {
  // Latencia simulada para poder validar el UX de loading.
  await new Promise((resolve) => setTimeout(resolve, 1200))

  const fieldErrors: Record<string, string> = {}
  if (!values.customer.email) fieldErrors['customer.email'] = 'Requerido'
  if (!values.customer.firstName)
    fieldErrors['customer.firstName'] = 'Requerido'
  if (!values.customer.lastName)
    fieldErrors['customer.lastName'] = 'Requerido'
  if (!values.address.province)
    fieldErrors['address.province'] = 'Requerido'
  if (!values.address.city) fieldErrors['address.city'] = 'Requerido'
  if (!values.address.street)
    fieldErrors['address.street'] = 'Requerido'

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: 'error',
      message: 'Revisá los datos obligatorios antes de continuar.',
      fieldErrors,
    }
  }

  return {
    status: 'success',
    orderId: 'mock-order-id',
    redirectUrl: '/checkout?status=mock-success',
  }
}
