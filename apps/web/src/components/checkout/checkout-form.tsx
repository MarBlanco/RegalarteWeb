'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ADDRESS_FIELDS,
  CUSTOMER_FIELDS,
  EMPTY_CHECKOUT_FORM,
  NOTES_FIELDS,
  continueCheckout,
  fieldErrorsToMessage,
  submitCheckout,
  validateCheckoutForm,
  type CheckoutFlowDecision,
  type CheckoutFormValues,
  type CheckoutSubmitStatus,
  type SubmitResult,
} from '@/lib/checkout'
import { syncCartWithOrder } from '@/lib/cart/cart-sync'
import { useCartStore } from '@/lib/cart/store'
import { getSubtotal } from '@/lib/cart/pricing'
import { trackPurchase } from '@/lib/analytics/ga'
import { CheckoutFormFields } from './checkout-form-fields'

export function CheckoutForm() {
  const [values, setValues] = useState<CheckoutFormValues>(EMPTY_CHECKOUT_FORM)
  const [status, setStatus] = useState<CheckoutSubmitStatus>('idle')
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [flow, setFlow] = useState<CheckoutFlowDecision | null>(null)

  const isLocked = status === 'submitting' || status === 'success'
  const fieldErrors =
    status === 'error' && result?.status === 'error'
      ? result.fieldErrors
      : undefined

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isLocked) return

    const clientErrors = validateCheckoutForm(values)
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
      const submitResult = await submitCheckout(values)
      setResult(submitResult)
      setStatus(submitResult.status)

      if (submitResult.status === 'success') {
        // TICKET-022: emitir el evento GA4 `purchase` antes de vaciar el
        // carrito. Capturamos el snapshot de items + subtotal aca para que
        // el evento refleje exactamente lo que el usuario compro.
        const { items, mode } = useCartStore.getState()
        trackPurchase(
          submitResult.orderId ?? 'unknown',
          items,
          getSubtotal(items, mode),
        )

        // TICKET-009 + TICKET-011: vaciar el carrito solo despues de que
        // la Order se persistio. La operacion se delega a la capa de
        // sync (lib/cart/cart-sync) para mantener un solo punto de
        // sincronizacion Cart <-> Orders.
        syncCartWithOrder(submitResult.orderId)

        const decision = await continueCheckout(submitResult)
        setFlow(decision)
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
    <form className="space-y-6" onSubmit={handleSubmit} noValidate aria-busy={isLocked}>
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
                ? 'Redirigiendo al operador de pago… (mock — ver TICKET-010).'
                : flow?.kind === 'error'
                  ? 'No se pudo iniciar el pago. Podés volver a editar y reintentar.'
                  : 'Preparando el siguiente paso…'}
            </p>
          </div>
          {flow?.kind !== 'redirect' ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetStatus}
            >
              Editar de nuevo
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

      <Card>
        <CardContent className="space-y-4 p-6">
          <header>
            <h2 className="text-base font-semibold">Datos del cliente</h2>
            <p className="text-xs text-muted-foreground">
              Usaremos esta información para confirmar tu pedido y contactarte por
              cualquier consulta.
            </p>
          </header>
          <div className="grid gap-4 sm:grid-cols-2">
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <header>
            <h2 className="text-base font-semibold">Dirección de envío</h2>
            <p className="text-xs text-muted-foreground">
              Necesaria para calcular costos y plazos de entrega.
            </p>
          </header>
          <div className="grid gap-4 sm:grid-cols-2">
            {ADDRESS_FIELDS.map((field) => (
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

      <Card>
        <CardContent className="space-y-4 p-6">
          <header>
            <h2 className="text-base font-semibold">Observaciones</h2>
            <p className="text-xs text-muted-foreground">
              Opcional. Indicaciones especiales, dedicatoria, horario preferido.
            </p>
          </header>
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

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isLocked}
      >
        {status === 'submitting' ? (
          <span className="inline-flex items-center" aria-live="polite">
            <svg
              aria-hidden="true"
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Procesando…
          </span>
        ) : status === 'success' ? (
          'Pedido enviado'
        ) : (
          'Continuar al pago'
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Te redireccionaremos al operador de pago (Mercado Pago) en el siguiente paso.
      </p>
    </form>
  )
}
