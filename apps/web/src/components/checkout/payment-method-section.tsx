'use client'

import { Card, CardContent } from '@/components/ui/card'
import { getPaymentProvider } from '@/lib/payment'

/**
 * "Medio de pago" (como en el checkout de Mercado Pago). El pago real lo resuelve Mercado Pago
 * en su propia pantalla: ahí el cliente elige tarjeta, dinero en cuenta u otro medio. Si el
 * proveedor activo es el simulado, se avisa que no hay cobro real.
 */
export function PaymentMethodSection() {
  const simulated = getPaymentProvider().name !== 'mercadopago'

  return (
    <Card>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <h2 className="text-base font-semibold">Medio de pago</h2>
        <div
          role="radiogroup"
          aria-label="Medio de pago"
          className="rounded-lg border border-[#B85C33]/60 p-4"
        >
          <div role="radio" aria-checked="true" className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#B85C33]"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#B85C33]" />
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                Mercado Pago
                {simulated ? (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                    Modo prueba
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {simulated
                  ? 'Pago simulado: no se realiza ningún cobro.'
                  : 'Elegís cómo pagar al continuar: tarjetas, dinero en cuenta y otros medios disponibles en Mercado Pago.'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
