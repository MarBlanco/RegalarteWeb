'use client'

import { useCallback, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { refreshStorefrontAction } from '@/app/actions/refresh-storefront'

/** Espera máxima por el refresco antes de seguir (no bloquea el cierre). */
const MAX_WAIT_MS = 6000
/** Si el refresco nunca llega a quedar "pendiente", no se espera más que esto. */
const NOT_STARTED_MS = 120

/**
 * Refresco de la página después de guardar una edición (MODO EDICIÓN).
 *
 * 1. Una Server Action expira el caché del servidor en el acto (el dato nuevo
 *    ya está disponible).
 * 2. `router.refresh()` dentro de una transición re-renderiza la página con el
 *    dato nuevo, y la promesa devuelta se resuelve recién cuando esa
 *    transición terminó: el editor puede quedarse en "Guardando…" hasta que la
 *    tarjeta/página ya muestra el cambio, sin F5 ni parpadeo del dato viejo.
 *
 * Si la acción falla igual se refresca (el guardado ya ocurrió).
 */
export function useRefreshStorefront(): () => Promise<void> {
  const router = useRouter()
  const token = useAuth((s) => s.token)
  const [isPending, startTransition] = useTransition()
  const pendingRef = useRef(false)
  const sawPending = useRef(false)
  const waiter = useRef<(() => void) | null>(null)

  // Si el componente se desmonta (ej. la tarjeta desaparece al ocultar el
  // producto) no habrá más transiciones que observar: se libera la espera.
  useEffect(() => {
    return () => {
      waiter.current?.()
      waiter.current = null
    }
  }, [])

  useEffect(() => {
    pendingRef.current = isPending
    if (isPending) sawPending.current = true
    else if (sawPending.current && waiter.current) {
      waiter.current()
      waiter.current = null
    }
  }, [isPending])

  return useCallback(async () => {
    if (token) {
      try {
        await refreshStorefrontAction(token)
      } catch {
        /* se refresca igual */
      }
    }
    await new Promise<void>((resolve) => {
      sawPending.current = false
      const done = () => {
        clearTimeout(maxTimer)
        clearTimeout(startTimer)
        waiter.current = null
        resolve()
      }
      const maxTimer = setTimeout(done, MAX_WAIT_MS)
      const startTimer = setTimeout(() => {
        // El refresco terminó tan rápido que nunca se vio como pendiente.
        if (!sawPending.current && !pendingRef.current) done()
      }, NOT_STARTED_MS)
      waiter.current = done
      startTransition(() => {
        router.refresh()
      })
    })
  }, [router, token])
}
