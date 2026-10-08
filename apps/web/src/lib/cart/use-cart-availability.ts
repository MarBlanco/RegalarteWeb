'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCartStore } from './store'
import {
  fetchUnavailable,
  numericProductIds,
  type UnavailableReason,
} from './availability'

/** Cada cuánto se vuelve a consultar mientras el carrito está a la vista. */
export const AVAILABILITY_POLL_MS = 30_000

export interface CartAvailability {
  /** Motivo por ítem del carrito (clave = `item.id`); solo los NO comprables. */
  reasons: ReadonlyMap<string, UnavailableReason>
  hasUnavailable: boolean
  /** Ya hubo al menos una consulta exitosa. */
  checked: boolean
  /** La última consulta falló (se conserva el último resultado conocido). */
  failed: boolean
  refresh: () => Promise<void>
}

/**
 * Mantiene sincronizada la disponibilidad de los ítems del carrito con el
 * estado real de los productos: consulta al montar, cuando cambian los ítems,
 * al volver a la pestaña/ventana y periódicamente mientras `enabled`.
 * Un ítem no comprable nunca se quita solo: se informa y se bloquea la compra.
 */
export function useCartAvailability(enabled = true): CartAvailability {
  const items = useCartStore((s) => s.items)
  const hydrated = useCartStore((s) => s.hydrated)
  const [byProduct, setByProduct] = useState<ReadonlyMap<number, UnavailableReason>>(
    new Map(),
  )
  const [checked, setChecked] = useState(false)
  const [failed, setFailed] = useState(false)
  const latest = useRef(0)

  const idsKey = items.map((i) => i.productId).sort().join(',')

  const refresh = useCallback(async () => {
    const ids = numericProductIds(idsKey ? idsKey.split(',') : [])
    const ticket = ++latest.current
    try {
      const result = await fetchUnavailable(ids)
      if (ticket !== latest.current) return
      setByProduct(result)
      setChecked(true)
      setFailed(false)
    } catch {
      if (ticket === latest.current) setFailed(true)
    }
  }, [idsKey])

  useEffect(() => {
    if (!enabled || !hydrated) return
    void refresh()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    const timer = window.setInterval(() => void refresh(), AVAILABILITY_POLL_MS)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
      window.clearInterval(timer)
    }
  }, [enabled, hydrated, refresh])

  const reasons = useMemo(() => {
    const map = new Map<string, UnavailableReason>()
    for (const item of items) {
      const reason = byProduct.get(Number(item.productId))
      if (reason) map.set(item.id, reason)
    }
    return map
  }, [items, byProduct])

  return { reasons, hasUnavailable: reasons.size > 0, checked, failed, refresh }
}
