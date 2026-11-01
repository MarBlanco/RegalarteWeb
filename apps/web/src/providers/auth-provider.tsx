'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth, waitForLogout, type User } from '@/hooks/use-auth'

/**
 * Valida la sesión persistida al arrancar (y cuando cambia el token).
 *
 * Causa real del "You are not allowed" en /profile: el JWT expira a las
 * 2h (`tokenExpiration: 7200`) pero el store persistido conserva usuario y
 * token vencido. La UI parece logueada (nombre, Hola) pero el backend ve
 * `req.user = null` y deniega todo con 403. Al detectar token inválido se
 * limpia la sesión para que los guards existentes lleven al login.
 *
 * Sin token en el store, adopta la sesión del panel (/admin): Payload guarda
 * el JWT en una cookie httpOnly del mismo origen, así quien ya ingresó al
 * panel entra a la tienda logueado sin repetir el login. `logout` del store
 * también cierra la cookie, para que cerrar sesión no se deshaga solo.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setLoading, token, logout, setUser, setToken } = useAuth()
  const checked = useRef<string | null>(null)
  // El store persistido puede hidratarse después del primer render: hasta entonces `token` no es fiable.
  // En el servidor no hay localStorage y `persist` no existe: ahí no corren efectos.
  const [hydrated, setHydrated] = useState(() => useAuth.persist?.hasHydrated() ?? true)

  useEffect(() => {
    if (hydrated) return
    return useAuth.persist?.onFinishHydration(() => setHydrated(true))
  }, [hydrated])

  useEffect(() => {
    if (!hydrated) return
    if (!token) {
      let cancelled = false
      const adoptCookieSession = async () => {
        try {
          // Tras cerrar sesión la cookie sigue viva hasta que responde el logout: sin esperar,
          // se readoptaba la sesión recién cerrada y se disparaba un segundo logout (400).
          await waitForLogout()
          const res = await fetch('/api/users/me', { credentials: 'same-origin', cache: 'no-store' })
          if (!res.ok) return
          const data = (await res.json()) as { user?: User | null; token?: string }
          if (cancelled || !data?.user || !data.token) return
          setUser(data.user)
          setToken(data.token)
        } catch {
          // sin sesión de panel: la tienda queda como visitante
        } finally {
          // `isLoading` baja recién con la sesión resuelta: si bajara antes, los guards
          // (/orders, /profile) verían `user: null` y redirigirían al login pese a haber cookie.
          // Una ejecución descartada (StrictMode, cambio de token) no decide: lo hace la vigente.
          if (!cancelled) setLoading(false)
        }
      }
      void adoptCookieSession()
      return () => {
        cancelled = true
      }
    }
    setLoading(false)
    if (checked.current === token) return
    checked.current = token
    let cancelled = false
    async function validate() {
      try {
        const res = await fetch('/api/users/me', {
          headers: { Authorization: `JWT ${token}` },
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('invalid')
        const data = (await res.json()) as { user?: unknown }
        if (!data || !data.user) throw new Error('invalid')
      } catch {
        if (!cancelled) logout()
      }
    }
    void validate()
    return () => {
      cancelled = true
    }
  }, [hydrated, token, setLoading, logout, setUser, setToken])

  return <>{children}</>
}
