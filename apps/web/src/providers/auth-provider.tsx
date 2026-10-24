'use client'

import { useEffect, useRef } from 'react'
import { useAuth, type User } from '@/hooks/use-auth'

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

  useEffect(() => {
    setLoading(false)
    if (!token) {
      let cancelled = false
      const adoptCookieSession = async () => {
        try {
          const res = await fetch('/api/users/me', { credentials: 'same-origin', cache: 'no-store' })
          if (!res.ok) return
          const data = (await res.json()) as { user?: User | null; token?: string }
          if (cancelled || !data?.user || !data.token) return
          setUser(data.user)
          setToken(data.token)
        } catch {
          // sin sesión de panel: la tienda queda como visitante
        }
      }
      void adoptCookieSession()
      return () => {
        cancelled = true
      }
    }
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
  }, [token, setLoading, logout, setUser, setToken])

  return <>{children}</>
}
