'use client'

import {
  selectItemCount,
  selectTotals,
  selectUnitPrice,
  useCartStore,
} from '@/lib/cart'
import { formatPrice } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'
import { useShallow } from 'zustand/react/shallow'

export function CartSummary() {
  const items = useCartStore((s) => s.items)
  const mode = useCartStore((s) => s.mode)
  const hydrated = useCartStore((s) => s.hydrated)
  const itemCount = useCartStore(selectItemCount)
  const totals = useCartStore(
    useShallow((s) => selectTotals({ items: s.items, mode: s.mode })),
  )

  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <h2 className="text-base font-semibold">Resumen de compra</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Productos</dt>
            <dd className="tabular-nums">
              {hydrated ? itemCount : '—'}
            </dd>
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
        </dl>
        <div className="flex items-center justify-between border-t pt-3 text-base">
          <span className="font-semibold">Total</span>
          <span className="font-semibold tabular-nums">
            {formatPrice(totals.subtotal)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Los envíos y los impuestos se calcularán en el checkout.
        </p>
        <p className="text-[11px] text-muted-foreground">
          Totalizado únicamente sobre {totals.items.length} línea
          {totals.items.length === 1 ? '' : 's'} con pricing{' '}
          {mode === 'WHOLESALE' ? 'mayorista' : 'minorista'}.
          Item comercializado al precio unitario{' '}
          {items.length > 0 && mode === 'WHOLESALE'
            ? formatPrice(
                selectUnitPrice(
                  items[items.length - 1] as Parameters<typeof selectUnitPrice>[0],
                  mode,
                ),
              )
            : '—'}
          .
        </p>
      </CardContent>
    </Card>
  )
}
