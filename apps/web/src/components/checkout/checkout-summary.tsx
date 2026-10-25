'use client'

import { useState } from 'react'
import { useCartStore, selectTotals } from '@/lib/cart'
import { formatPrice } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useShallow } from 'zustand/react/shallow'
import { useCouponStore } from '@/lib/checkout/coupon-store'
import { couponDiscount } from '@/lib/orders/coupons'
import type { ShippingQuote } from '@/lib/checkout'

function TicketIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path d="M3 9a2 2 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 1 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z" />
      <path d="M13 5v2M13 17v2M13 11v2" />
    </svg>
  )
}

/**
 * Cupón opcional, como en Mercado Pago: un botón "Ingresar código de cupón" abre el campo; si
 * no se usa, el cliente paga directamente. Enter aplica el cupón y NO envía el pedido.
 */
function CouponBlock() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const code = useCouponStore((s) => s.code)
  const percent = useCouponStore((s) => s.percent)
  const status = useCouponStore((s) => s.status)
  const checking = status === 'checking'
  const apply = useCouponStore((s) => s.apply)
  const clear = useCouponStore((s) => s.clear)

  if (status === 'applied' && code) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
        <span className="font-semibold uppercase tracking-wide">
          {code}
          <span className="ml-1.5 font-normal normal-case text-muted-foreground">
            −{percent}%
          </span>
        </span>
        <button
          type="button"
          onClick={() => {
            clear()
            setInput('')
            setOpen(false)
          }}
          className="inline-flex min-h-11 shrink-0 items-center text-xs text-muted-foreground underline-offset-2 hover:underline sm:min-h-0"
        >
          Quitar
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#B85C33] hover:underline sm:min-h-0"
      >
        <TicketIcon />
        Ingresar código de cupón
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            if (!checking && input.trim()) void apply(input)
          }}
          placeholder="Código"
          aria-label="Código de cupón"
          className="h-9"
          autoComplete="off"
          autoFocus
        />
        <Button
          type="button"
          onClick={() => void apply(input)}
          disabled={checking || !input.trim()}
          className="h-9 shrink-0"
        >
          Aplicar
        </Button>
      </div>
      {status === 'invalid' ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          Cupón inválido. Revisá el código e intentá de nuevo.
        </p>
      ) : null}
    </div>
  )
}

interface CheckoutSummaryProps {
  shipping?: ShippingQuote
  /** Estado del envío del pedido: bloquea el botón y cambia su texto. */
  status?: 'idle' | 'submitting' | 'success' | 'error'
  /** true cuando el proveedor activo es el simulado (no hay cobro real). */
  simulatedPayment?: boolean
}

/** "Resumen de compra" con el botón principal "Pagar y finalizar". */
export function CheckoutSummary({
  shipping = { label: 'A coordinar', free: false },
  status = 'idle',
  simulatedPayment = false,
}: Readonly<CheckoutSummaryProps>) {
  const hydrated = useCartStore((s) => s.hydrated)
  const totals = useCartStore(
    useShallow((s) => selectTotals({ items: s.items, mode: s.mode })),
  )
  const couponCode = useCouponStore((s) => s.code)
  const couponPercent = useCouponStore((s) => s.percent)
  const coupon = couponCode ? { code: couponCode, percent: couponPercent } : null
  const discount = coupon ? couponDiscount(totals.subtotal, coupon) : 0
  const total = Math.max(0, totals.subtotal - discount)
  const locked = status === 'submitting' || status === 'success'

  return (
    <Card>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <h2 className="text-base font-semibold">Resumen de compra</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">
              Productos{hydrated ? ` (${totals.itemCount})` : ''}
            </dt>
            <dd className="font-medium tabular-nums">{formatPrice(totals.subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Envío</dt>
            <dd
              className={`font-medium ${shipping.free ? 'text-emerald-600' : 'text-muted-foreground'}`}
            >
              {shipping.label}
            </dd>
          </div>
          {discount > 0 && coupon ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Descuento ({coupon.code})</dt>
              <dd className="font-medium tabular-nums">−{formatPrice(discount)}</dd>
            </div>
          ) : null}
        </dl>

        <CouponBlock />

        <div className="flex items-center justify-between border-t pt-3 text-base">
          <span className="font-semibold">Total</span>
          <span className="font-semibold tabular-nums">{formatPrice(total)}</span>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={locked}>
          {status === 'submitting' ? (
            <span className="inline-flex items-center" aria-live="polite">
              <svg
                aria-hidden="true"
                className="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Procesando…
            </span>
          ) : status === 'success' ? (
            'Redirigiendo…'
          ) : (
            'Pagar y finalizar'
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {simulatedPayment
            ? 'Modo prueba: no se realiza ningún cobro.'
            : 'Te llevamos a Mercado Pago para completar el pago de forma segura.'}{' '}
          Precios en pesos argentinos.
        </p>
      </CardContent>
    </Card>
  )
}
