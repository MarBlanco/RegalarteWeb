/**
 * Payment: contratos publicos de proveedores de pago.
 *
 * Esta capa es provider-agnostic. Checkout y el resto del UI consumen
 * SOLO la interfaz `PaymentProvider`. Las implementaciones concretas
 * (mock, MercadoPago, Stripe, etc.) viven fuera de este archivo y se
 * inyectan a traves del factory `getPaymentProvider()` en `index.ts`.
 *
 * Cualquier cambio aqui impacta a TODOS los proveedores: mantener los
 * tipos tan estables como sea posible.
 */

/**
 * Input que recibe el proveedor al iniciar un pago.
 *
 *  - `orderId`     : identificador de la orden creada por el backend
 *                    (TICKET-009). Opcional en mock; requerido por MP.
 *  - `redirectUrl` : URL de retorno / callback que el proveedor debe
 *                    resolver cuando el pago finalize.
 */
export interface PaymentInitInput {
  orderId?: string
  redirectUrl?: string
}

/**
 * Resultado de iniciar un pago. Si `status === 'ready'`, el proveedor
 * devolvio una URL a la que el UI debe enviar al cliente.
 */
export interface PaymentInitResult {
  status: 'ready'
  /** Identificador externo del pago (preference id, intent id, etc.). */
  externalId: string
  /** URL a la que el UI debe navegar (pasarela / wallet). */
  redirectUrl: string
}

/**
 * Estados posibles de un pago segun el proveedor. Mantener como union
 * cerrada para que el UI pueda ramificar de forma exhaustiva.
 */
export type PaymentStatus =
  | 'pending'
  | 'in_process'
  | 'approved'
  | 'rejected'
  | 'cancelled'

export interface PaymentStatusResult {
  status: PaymentStatus
  externalId: string
}

export interface PaymentCancelResult {
  status: 'cancelled'
  externalId: string
}

/**
 * Contrato publico que cualquier proveedor de pago debe implementar.
 *
 * El UI depende solo de esta interfaz; nunca de una clase concreta.
 */
export interface PaymentProvider {
  /** Identificador legible del proveedor (para logs / debug). */
  readonly name: string

  /**
   * Inicia un pago. Devuelve `PaymentInitResult` con la URL a la que
   * el UI debe enviar al cliente. Puede tirar errores de inicializacion
   * (red, configuracion, etc.) que el caller debe traducir.
   */
  initiate(input: PaymentInitInput): Promise<PaymentInitResult>

  /**
   * Consulta el estado actual de un pago a partir de su id externo.
   */
  getStatus(externalId: string): Promise<PaymentStatusResult>

  /**
   * Cancela un pago en curso. Placeholder: la implementacion real
   * depende del proveedor.
   */
  cancel(externalId: string): Promise<PaymentCancelResult>
}
