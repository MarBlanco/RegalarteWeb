'use client'

import { useState } from 'react'
import { useCartStore, selectTotals } from '@/lib/cart'
import { formatPrice } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useShallow } from 'zustand/react/shallow'
import { useCouponStore } from '@/lib/checkout/coupon-store'
import { couponDiscount, getCoupon } from '@/lib/orders/coupons'

function CouponBlock() {
  const [input, setInput] = useState('')
  const code = useCouponStore((s) => s.code)
  const percent = useCouponStore((s) => s.percent)
  const status = useCouponStore((s) => s.status)
  const apply = useCouponStore((s) => s.apply)
  const clear = useCouponStore((s) => s.clear)

  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-sm font-medium">¿Tenés un cupón?</p>
      {status === 'applied' && code ? (
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
            }}
            className="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Quitar
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Código"
              aria-label="Código de cupón"
              className="h-9"
              autoComplete="off"
            />
            <Button
              type="button"
              onClick={() => apply(input)}
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
        </>
      )}
    </div>
  )
}

export function CheckoutSummary() {
  const mode = useCartStore((s) => s.mode)
  const hydrated = useCartStore((s) => s.hydrated)
  const totals = useCartStore(
    useShallow((s) => selectTotals({ items: s.items, mode: s.mode })),
  )
  const couponCode = useCouponStore((s) => s.code)

  const coupon = couponCode ? getCoupon(couponCode) : null
  const discount = coupon ? couponDiscount(totals.subtotal, coupon) : 0
  const total = Math.max(0, totals.subtotal - discount)

  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <h2 className="text-base font-semibold">Resumen</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Productos</dt>
            <dd className="tabular-nums">{hydrated ? totals.itemCount : '—'}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Modo de precios</dt>
            <dd className="text-xs uppercase tracking-wide">
              {mode === 'WHOLESALE' ? 'Mayorista' : 'Minorista'}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-medium tabular-nums">
              {formatPrice(totals.subtotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Envío</dt>
            <dd className="text-xs text-muted-foreground">Calculado por el operador</dd>
          </div>
          {discount > 0 && coupon ? (
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">
                Descuento ({coupon.code})
              </dt>
              <dd className="font-medium tabular-nums">
                −{formatPrice(discount)}
              </dd>
            </div>
          ) : null}
        </dl>
        <CouponBlock />
        <div className="flex items-center justify-between border-t pt-3 text-base">
          <span className="font-semibold">Total</span>
          <span className="font-semibold tabular-nums">
            {formatPrice(total)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Los precios están expresados en pesos argentinos.
        </p>
      </CardContent>
    </Card>
  )
}
