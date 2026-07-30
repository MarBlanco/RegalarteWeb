/**
 * Payment: capa de acceso al proveedor de pagos.
 *
 * El checkout consume un `PaymentProvider` a traves del factory
 * `getPaymentProvider()`. El provider activo se selecciona por
 * configuracion via `NEXT_PUBLIC_PAYMENT_PROVIDER`.
 *
 * Providers soportados:
 *   - mock (default)
 *   - mercadopago
 *
 * TODO(TICKET-009): Cuando TICKET-009 este listo, bastara con cambiar
 * la configuracion a `NEXT_PUBLIC_PAYMENT_PROVIDER=mercadopago` para
 * utilizar `MercadoPagoProvider`.
 *
 * Restricciones actuales:
 *   - Sin fetch.
 *   - Sin SDK externo.
 *   - Sin window.location / router.push.
 *   - Sin dependencias adicionales.
 */

import { MercadoPagoProvider } from './mercadopago-provider'
import { MockPaymentProvider } from './mock-payment-provider'
import type { PaymentProvider } from './types'

const SUPPORTED_PROVIDERS = ['mock', 'mercadopago'] as const

type ProviderName = (typeof SUPPORTED_PROVIDERS)[number]

function getConfiguredProvider(): ProviderName {
  const env = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER?.toLowerCase()
  if (env && SUPPORTED_PROVIDERS.includes(env as ProviderName)) {
    return env as ProviderName
  }
  return 'mock'
}

let cachedProvider: PaymentProvider | null = null

/**
 * Devuelve el proveedor de pagos activo.
 *
 * El provider se selecciona por NEXT_PUBLIC_PAYMENT_PROVIDER.
 * Si la variable no esta definida o es invalida, se usa 'mock'.
 *
 * Implementacion:
 *   - mock -> MockPaymentProvider (default)
 *   - mercadopago -> MercadoPagoProvider
 *
 * Cachea la instancia para evitar reinstanciaciones innecesarias.
 */
export function getPaymentProvider(): PaymentProvider {
  if (!cachedProvider) {
    const providerName = getConfiguredProvider()
    cachedProvider =
      providerName === 'mercadopago'
        ? new MercadoPagoProvider()
        : new MockPaymentProvider()
  }
  return cachedProvider
}

/**
 * Resetea el cache del provider. Util para tests y para escenarios donde
 * se necesite reinstanciar el provider (p.ej. cambio de configuracion).
 */
export function __resetPaymentProviderForTesting(): void {
  cachedProvider = null
}

export type {
  PaymentProvider,
  PaymentInitInput,
  PaymentInitResult,
  PaymentStatus,
  PaymentStatusResult,
  PaymentCancelResult,
} from './types'
