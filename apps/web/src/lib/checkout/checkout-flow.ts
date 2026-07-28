/**
 * Checkout: capa de orquestacion posterior al submit.
 *
 * Esta capa existe para desacoplar al UI del proveedor de pago.
 * El UI nunca debe conocer el proveedor (Mercado Pago, etc.):
 * solo debe actuar sobre la decision tipada devuelta por
 * continueCheckout().
 *
 * Mantener este contrato estable al swap del proveedor en TICKET-010.
 */

import type { SubmitResult } from './checkout-submit'

/**
 * Decision que el UI aplica tras un submit exitoso.
 *
 *   - 'redirect'  -> navegar a `url` (pago externo / pasarela).
 *   - 'pending'   -> quedarse en la pantalla mostrando un loader
 *                    (p.ej. cuando el proveedor devuelve un poll URL).
 *   - 'error'     -> el submit fue exitoso pero el flujo posterior
 *                    fallo; el UI debe mostrar feedback y permitir
 *                    reintentar / volver.
 */
export type CheckoutFlowDecision =
  | { kind: 'redirect'; url: string; orderId?: string }
  | { kind: 'pending'; orderId?: string }
  | { kind: 'error'; reason: 'invalid_submit_result' | 'missing_redirect_url' }

/**
 * Encapsula la logica posterior al submit del checkout.
 *
 * Hoy (mock):
 *   - valida que el submit result sea exitoso
 *   - valida que venga un `redirectUrl`
 *   - emite una decision tipada que el UI puede aplicar
 *
 * TODO(TICKET-010): Integrar el proveedor de pago (Mercado Pago).
 * Reemplazar el cuerpo de esta funcion por:
 *   1. Crear la preference / intent de pago contra la API del proveedor,
 *      usando el orderId devuelto por submitCheckout (TICKET-009).
 *   2. Devolver { kind: 'redirect', url: <init_point>, orderId } con la
 *      URL real del checkout del proveedor.
 *   3. Si el proveedor soporta flujo asincrono/poll, devolver 'pending'.
 *   4. NO modificar el contrato publico (CheckoutFlowDecision) para
 *      que el UI no requiera cambios al conectar el proveedor.
 *
 * Restricciones actuales:
 *   - Sin fetch.
 *   - Sin window.location.
 *   - Sin dependencias adicionales.
 *   - El UI no debe ser modificado para entender al proveedor.
 */
export async function continueCheckout(
  result: SubmitResult,
): Promise<CheckoutFlowDecision> {
  if (result.status !== 'success') {
    return { kind: 'error', reason: 'invalid_submit_result' }
  }

  if (!result.redirectUrl) {
    return { kind: 'error', reason: 'missing_redirect_url' }
  }

  // Punto de integracion para TICKET-010.
  // Cuando se conecte el proveedor real, la construccion de la URL de
  // redirect ocurrira aqui. El UI permanece invariante.
  return {
    kind: 'redirect',
    url: result.redirectUrl,
    orderId: result.orderId,
  }
}
