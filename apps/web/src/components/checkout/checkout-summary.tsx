'use client'

import { useCartStore, selectTotals } from '@/lib/cart'
import { formatPrice } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'
import { useShallow } from 'zustand/react/shallow'

export function CheckoutSummary() {
  const mode = useCartStore((s) => s.mode)
  const hydrated = useCartStore((s) => s.hydrated)
  const totals = useCartStore(
    useShallow((s) => selectTotals({ items: s.items, mode: s.mode })),
  )

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
        </dl>
        <div className="flex items-center justify-between border-t pt-3 text-base">
          <span className="font-semibold">Total</span>
          <span className="font-semibold tabular-nums">
            {formatPrice(totals.subtotal)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Los precios están expresados en pesos argentinos.
        </p>
      </CardContent>
    </Card>
  )
}
