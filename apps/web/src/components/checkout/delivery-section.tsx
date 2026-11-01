'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ADDRESS_FIELDS,
  PICKUP_POINT,
  formatAddressLine,
  isAddressComplete,
  type CheckoutFormValues,
  type DeliveryMethod,
  type ShippingQuote,
} from '@/lib/checkout'
import { CheckoutFormFields } from './checkout-form-fields'

interface DeliverySectionProps {
  method: DeliveryMethod
  onMethodChange: (method: DeliveryMethod) => void
  values: CheckoutFormValues
  onValuesChange: (next: CheckoutFormValues) => void
  shippingQuote: ShippingQuote
  /** true cuando la dirección vino precargada desde la cuenta: se muestra como tarjeta. */
  prefilledAddress?: boolean
  disabled?: boolean
  fieldErrors?: Partial<Record<string, string>>
}

const OPTIONS: Array<{ id: DeliveryMethod; title: string }> = [
  { id: 'shipping', title: 'Envío' },
  { id: 'pickup', title: 'Retiro' },
]

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0 text-[#B85C33]"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

/**
 * "Forma de entrega" (como en el checkout de Mercado Pago): Envío / Retiro, la dirección
 * guardada con "Cambiar dirección" y, en retiro, el punto de retiro.
 */
export function DeliverySection({
  method,
  onMethodChange,
  values,
  onValuesChange,
  shippingQuote,
  prefilledAddress = false,
  disabled = false,
  fieldErrors,
}: Readonly<DeliverySectionProps>) {
  const complete = isAddressComplete(values.address)
  const [editing, setEditing] = useState(!complete)
  const addressErrors = Object.keys(fieldErrors ?? {}).some((k) => k.startsWith('address.'))

  // Si la validación marca la dirección, se abre el formulario para que se vea el error.
  useEffect(() => {
    if (addressErrors) setEditing(true)
  }, [addressErrors])

  // Una dirección precargada de la cuenta se muestra como tarjeta (no al tipear a mano).
  useEffect(() => {
    if (prefilledAddress) setEditing(false)
  }, [prefilledAddress])

  const subtitle = (id: DeliveryMethod) =>
    id === 'pickup' ? 'Gratis' : shippingQuote.label

  return (
    <Card>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <h2 className="text-base font-semibold">Forma de entrega</h2>

        <div
          role="radiogroup"
          aria-label="Forma de entrega"
          className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:inline-grid sm:min-w-[320px]"
        >
          {OPTIONS.map((option) => {
            const selected = method === option.id
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => onMethodChange(option.id)}
                className={`flex min-h-[48px] flex-col items-center justify-center rounded-md border px-4 py-1.5 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected
                    ? 'border-[#B85C33] bg-background shadow-sm'
                    : 'border-transparent hover:bg-background/60'
                }`}
              >
                <span className="text-sm font-semibold">{option.title}</span>
                <span className="text-xs font-semibold text-emerald-600">
                  {subtitle(option.id)}
                </span>
              </button>
            )
          })}
        </div>

        {method === 'pickup' ? (
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <PinIcon />
            <div className="min-w-0">
              <p className="text-sm font-semibold">Retirás en {PICKUP_POINT.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Te avisamos cuando tu pedido esté listo para retirar.
              </p>
            </div>
          </div>
        ) : editing ? (
          <div className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-semibold">Dirección de envío</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ADDRESS_FIELDS.map((field) => (
                <CheckoutFormFields
                  key={field.id}
                  field={field}
                  form={values}
                  onChange={onValuesChange}
                  disabled={disabled}
                  error={fieldErrors?.[field.id]}
                />
              ))}
            </div>
            {complete ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
                disabled={disabled}
              >
                Usar esta dirección
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-[#B85C33]/60 p-4">
            <PinIcon />
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-semibold">
                {formatAddressLine(values.address)}
              </p>
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={disabled}
                className="mt-1 inline-flex min-h-11 items-center text-xs font-medium text-[#B85C33] hover:underline disabled:opacity-60 sm:min-h-0"
              >
                Cambiar dirección
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
