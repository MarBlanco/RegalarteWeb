/**
 * Payment: implementacion estructural de MercadoPagoProvider.
 *
 * Esta clase cumple la interfaz `PaymentProvider` y esta lista para ser
 * inyectada en lugar de `MockPaymentProvider`. Su cuerpo sigue siendo
 * un mock temporal: NO usa el SDK oficial, NO hace fetch, NO consume
 * credenciales. Cuando se conecte el proveedor real, solo hay que
 * reescribir el cuerpo de los metodos respetando el contrato publico.
 *
 * TODO(TICKET-010): Reemplazar la simulacion por la integracion real
 * utilizando el endpoint de Orders y el SDK oficial.
 *   1. `initiate`: crear una preference en el backend (TICKET-009) y
 *      devolver `redirectUrl = init_point`, `externalId = preference_id`.
 *      El backend debe orquestar la llamada al SDK de Mercado Pago;
 *      este provider NO debe instanciar el SDK directamente (separacion
 *      de capas: secretos fuera del bundle del cliente).
 *   2. `getStatus`: consultar el estado del pago contra el backend,
 *      que traduce la respuesta del SDK a `PaymentStatus`.
 *   3. `cancel`: cancelar la preference via backend.
 *   4. Mantener la interfaz `PaymentProvider` intacta: ni el flow ni
 *      el UI deben requerir cambios al conectar el provider real.
 *   5. Pasar credenciales / configuracion via el factory del provider,
 *      NO hardcodearlas aqui.
 *
 * Restricciones actuales:
 *   - Sin SDK.
 *   - Sin fetch.
 *   - Sin credenciales / tokens / public keys.
 *   - Sin dependencias adicionales.
 *   - Mismo contrato publico que `MockPaymentProvider`.
 */

import type {
  PaymentCancelResult,
  PaymentInitInput,
  PaymentInitResult,
  PaymentProvider,
  PaymentStatusResult,
} from './types'

const INIT_LATENCY_MS = 800
const READ_LATENCY_MS = 200

export class MercadoPagoProvider implements PaymentProvider {
  readonly name = 'mercadopago'

  /**
   * Inicia un pago contra Mercado Pago.
   *
   * Hoy (mock): simula latencia y devuelve una URL dummy.
   * Real (TICKET-010): el backend crea la preference y devuelve la URL
   * `init_point` de la wallet / checkout de MP.
   */
  async initiate(input: PaymentInitInput): Promise<PaymentInitResult> {
    await new Promise((resolve) => setTimeout(resolve, INIT_LATENCY_MS))

    if (!input.redirectUrl) {
      throw new Error('MercadoPagoProvider: redirectUrl is required')
    }

    const externalId = `mp_${input.orderId ?? 'no-order'}_${Date.now()}`

    return {
      status: 'ready',
      externalId,
      redirectUrl: input.redirectUrl,
    }
  }

  /**
   * Consulta el estado de un pago.
   *
   * Hoy (mock): devuelve siempre `pending` despues de una pequena
   * latencia simulada.
   * Real (TICKET-010): el backend traduce la respuesta de MP
   * (`approved`, `pending`, `in_process`, `rejected`, `cancelled`)
   * a `PaymentStatus`.
   */
  async getStatus(externalId: string): Promise<PaymentStatusResult> {
    await new Promise((resolve) => setTimeout(resolve, READ_LATENCY_MS))
    return { status: 'pending', externalId }
  }

  /**
   * Cancela un pago en curso.
   *
   * Hoy (mock): devuelve `cancelled` sin tocar nada.
   * Real (TICKET-010): el backend llama a la API de MP para cancelar
   * la preference / payment asociado.
   */
  async cancel(externalId: string): Promise<PaymentCancelResult> {
    await new Promise((resolve) => setTimeout(resolve, READ_LATENCY_MS))
    return { status: 'cancelled', externalId }
  }
}
