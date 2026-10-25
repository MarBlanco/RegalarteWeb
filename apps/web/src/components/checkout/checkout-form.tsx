'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CUSTOMER_FIELDS,
  EMPTY_CHECKOUT_FORM,
  NOTES_FIELDS,
  applyDelivery,
  checkoutDefaultsFromProfile,
  continueCheckout,
  fieldErrorsToMessage,
  isAddressComplete,
  shippingQuote,
  submitCheckout,
  validateCheckoutForm,
  type CheckoutFlowDecision,
  type CheckoutFormValues,
  type CheckoutSubmitStatus,
  type DeliveryMethod,
  type SubmitResult,
} from '@/lib/checkout'
import { syncCartWithOrder } from '@/lib/cart/cart-sync'
import { selectTotals, useCartStore } from '@/lib/cart'
import { getSubtotal } from '@/lib/cart/pricing'
import { trackPurchase } from '@/lib/analytics/ga'
import { useAuth } from '@/hooks/use-auth'
import { useFreeShippingThreshold } from '@/lib/site-content-client'
import { getPaymentProvider } from '@/lib/payment'
import { useShallow } from 'zustand/react/shallow'
import { CheckoutFormFields } from './checkout-form-fields'
import { CheckoutLineList } from './checkout-line-list'
import { CheckoutSummary } from './checkout-summary'
import { DeliverySection } from './delivery-section'
import { PaymentMethodSection } from './payment-method-section'

const isBlank = (value: string) => value.trim() === ''

/**
 * Checkout al estilo del de Mercado Pago (solo funcionalidad): productos, forma de entrega
 * (Envío / Retiro, con la dirección guardada y "Cambiar dirección"), datos de contacto, medio
 * de pago y un resumen con cupón opcional y el botón "Pagar y finalizar", que crea el pedido y
 * redirige a Mercado Pago.
 */
export function CheckoutForm() {
  const [values, setValues] = useState<CheckoutFormValues>(EMPTY_CHECKOUT_FORM)
  const [delivery, setDelivery] = useState<DeliveryMethod>('shipping')
  const [prefilledAddress, setPrefilledAddress] = useState(false)
  const [status, setStatus] = useState<CheckoutSubmitStatus>('idle')
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [flow, setFlow] = useState<CheckoutFlowDecision | null>(null)
  const isLocked = status === 'submitting' || status === 'success'
  const fieldErrors =
    status === 'error' && result?.status === 'error' ? result.fieldErrors : undefined

  const subtotal = useCartStore(
    useShallow((s) => selectTotals({ items: s.items, mode: s.mode })),
  ).subtotal
  const threshold = useFreeShippingThreshold()
  const quote = shippingQuote(delivery, subtotal, threshold)
  const simulatedPayment = getPaymentProvider().name !== 'mercadopago'

  // Precarga los datos guardados de la cuenta (una sola vez, solo en campos vacíos).
  const authUser = useAuth((s) => s.user)
  const prefilled = useRef(false)
  useEffect(() => {
    if (prefilled.current || !authUser) return
    prefilled.current = true
    const defaults = checkoutDefaultsFromProfile(authUser)
    setValues((current) => ({
      ...current,
      customer: {
        firstName: current.customer.firstName || defaults.customer.firstName,
        lastName: current.customer.lastName || defaults.customer.lastName,
        email: current.customer.email || defaults.customer.email,
        phone: current.customer.phone || defaults.customer.phone,
      },
      address: Object.values(current.address).every(isBlank)
        ? defaults.address
        : current.address,
    }))
    if (isAddressComplete(defaults.address)) setPrefilledAddress(true)
  }, [authUser])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isLocked) return

    const toSend = applyDelivery(values, delivery)
    const clientErrors = validateCheckoutForm(toSend)
    if (Object.keys(clientErrors).length > 0) {
      setStatus('error')
      setResult({
        status: 'error',
        message: fieldErrorsToMessage(clientErrors),
        fieldErrors: clientErrors,
      })
      return
    }

    setStatus('submitting')
    setResult(null)
    setFlow(null)

    try {
      const submitResult = await submitCheckout(toSend)
      setResult(submitResult)
      setStatus(submitResult.status)

      if (submitResult.status === 'success') {
        // TICKET-022: evento GA4 `purchase` con el snapshot de lo comprado.
        const { items, mode } = useCartStore.getState()
        trackPurchase(
          submitResult.orderId ?? 'unknown',
          items,
          getSubtotal(items, mode),
        )

        const decision = await continueCheckout(submitResult, undefined, {
          payerEmail: values.customer.email,
        })
        setFlow(decision)

        // El carrito se vacía solo cuando el pago quedó iniciado: si Mercado Pago falla, el
        // cliente conserva sus productos y puede reintentar.
        if (decision.kind === 'redirect') {
          syncCartWithOrder(submitResult.orderId)
          // Pago externo (Mercado Pago): redirección real fuera de la app.
          window.location.assign(decision.url)
        }
      }
    } catch {
      setStatus('error')
      setResult({
        status: 'error',
        message: 'No pudimos procesar tu pedido. Intentá de nuevo en unos minutos.',
      })
    }
  }

  function handleResetStatus() {
    setStatus('idle')
    setResult(null)
    setFlow(null)
  }

  return (
    <form
      id="checkout-form"
      onSubmit={handleSubmit}
      noValidate
      aria-busy={isLocked}
      className="space-y-6"
    >
      {status === 'success' && result?.status === 'success' ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
        >
          <svg
            aria-hidden
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 flex-shrink-0"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <div className="flex-1 space-y-1">
            <p className="font-medium">Pedido enviado correctamente</p>
            <p className="text-xs opacity-90">
              {flow?.kind === 'redirect'
                ? 'Redirigiendo a Mercado Pago…'
                : flow?.kind === 'error'
                  ? 'No se pudo iniciar el pago. Tus productos siguen en el carrito: podés volver a intentarlo.'
                  : 'Preparando el siguiente paso…'}
            </p>
          </div>
          {flow?.kind !== 'redirect' ? (
            <Button type="button" variant="ghost" size="sm" onClick={handleResetStatus}>
              Volver a intentar
            </Button>
          ) : null}
        </div>
      ) : null}

      {status === 'error' && result?.status === 'error' ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <svg
            aria-hidden
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 flex-shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="flex-1 font-medium">{result.message}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardContent className="p-5 sm:p-6">
              <CheckoutLineList />
            </CardContent>
          </Card>

          <DeliverySection
            method={delivery}
            onMethodChange={setDelivery}
            values={values}
            onValuesChange={setValues}
            shippingQuote={quote}
            prefilledAddress={prefilledAddress}
            disabled={isLocked}
            fieldErrors={fieldErrors}
          />

          <Card>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <header>
                <h2 className="text-base font-semibold">Datos de contacto</h2>
                <p className="text-xs text-muted-foreground">
                  Los usamos para confirmar tu pedido y avisarte por cualquier consulta.
                </p>
              </header>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {CUSTOMER_FIELDS.map((field) => (
                  <CheckoutFormFields
                    key={field.id}
                    field={field}
                    form={values}
                    onChange={setValues}
                    disabled={isLocked}
                    error={fieldErrors?.[field.id]}
                  />
                ))}
              </div>
              <div className="space-y-4">
                {NOTES_FIELDS.map((field) => (
                  <CheckoutFormFields
                    key={field.id}
                    field={field}
                    form={values}
                    onChange={setValues}
                    disabled={isLocked}
                    error={fieldErrors?.[field.id]}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <PaymentMethodSection />
        </div>

        <aside
          aria-label="Resumen de compra"
          className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start"
        >
          <CheckoutSummary
            shipping={quote}
            status={status}
            simulatedPayment={simulatedPayment}
          />
        </aside>
      </div>
    </form>
  )
}
