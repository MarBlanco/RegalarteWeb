/**
 * Checkout: capa de orquestacion posterior al submit.
 *
 * Esta capa existe para desacoplar al UI del proveedor de pago.
 * El UI nunca debe conocer el proveedor: solo debe actuar sobre la
 * decision tipada devuelta por `continueCheckout()`.
 *
 * El flow depende UNICAMENTE de la interfaz `PaymentProvider`
 * (de `@/lib/payment`). La implementacion concreta se inyecta a
 * traves de `getPaymentProvider()` y se reemplazara en TICKET-010.
 */

import { getPaymentProvider, type PaymentProvider } from '@/lib/payment'
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
  | {
      kind: 'error'
      reason:
        | 'invalid_submit_result'
        | 'missing_redirect_url'
        | 'provider_init_failed'
    }

/**
 * Encapsula la logica posterior al submit del checkout.
 *
 * Hoy:
 *   - valida que el submit result sea exitoso
 *   - valida que venga un `redirectUrl`
 *   - delega la inicializacion del pago al `PaymentProvider` inyectado
 *   - traduce la respuesta del provider a una `CheckoutFlowDecision`
 *     que el UI puede aplicar
 *
 * El segundo parametro `provider` es opcional y resuelve por defecto al
 * provider activo via `getPaymentProvider()`. Esto permite:
 *   - Que `checkout-form.tsx` no requiera cambios al swap del provider.
 *   - Que tests / integraciones inyecten un provider alternativo sin
 *     tocar el factory global.
 *
 * TODO(TICKET-010): Integrar el proveedor de pago (Mercado Pago).
 *   - `MercadoPagoProvider` ya delega en el backend propio, que crea la
 *     Order en MP y devuelve el checkout_url. El contrato público
 *     (`PaymentProvider`, `CheckoutFlowDecision`) se mantiene.
 *
 * Restricciones actuales:
 *   - Sin fetch.
 *   - Sin window.location.
 *   - Sin router.push.
 *   - Sin dependencias adicionales.
 *   - El UI no debe ser modificado para entender al proveedor.
 */
export async function continueCheckout(
  result: SubmitResult,
  provider: PaymentProvider = getPaymentProvider(),
  initExtra?: { payerEmail?: string },
): Promise<CheckoutFlowDecision> {
  if (result.status !== 'success') {
    return { kind: 'error', reason: 'invalid_submit_result' }
  }

  if (!result.redirectUrl) {
    return { kind: 'error', reason: 'missing_redirect_url' }
  }

  try {
    const init = await provider.initiate({
      orderId: result.orderId,
      redirectUrl: result.redirectUrl,
      ...(initExtra?.payerEmail ? { payerEmail: initExtra.payerEmail } : {}),
    })

    return {
      kind: 'redirect',
      url: init.redirectUrl,
      orderId: init.externalId,
    }
  } catch {
    return { kind: 'error', reason: 'provider_init_failed' }
  }
}
