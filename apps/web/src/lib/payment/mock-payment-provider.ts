/**
 * Payment: implementacion mock de PaymentProvider.
 *
 * Simula latencia de red y devuelve resultados predecibles para que
 * el flujo de checkout pueda ejercitarse end-to-end sin un proveedor
 * real. NO usar fetch, NO usar SDKs externos, NO usar window.location.
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

export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock'

  async initiate(input: PaymentInitInput): Promise<PaymentInitResult> {
    await new Promise((resolve) => setTimeout(resolve, INIT_LATENCY_MS))

    if (!input.redirectUrl) {
      // El flujo previo ya valida redirectUrl, pero mantenemos la
      // guarda para no romper la invariante del provider.
      throw new Error('MockPaymentProvider: redirectUrl is required')
    }

    const externalId = `mock_${input.orderId ?? 'no-order'}_${Date.now()}`

    return {
      status: 'ready',
      externalId,
      redirectUrl: input.redirectUrl,
    }
  }

  async getStatus(externalId: string): Promise<PaymentStatusResult> {
    await new Promise((resolve) => setTimeout(resolve, READ_LATENCY_MS))
    return { status: 'pending', externalId }
  }

  async cancel(externalId: string): Promise<PaymentCancelResult> {
    await new Promise((resolve) => setTimeout(resolve, READ_LATENCY_MS))
    return { status: 'cancelled', externalId }
  }
}
