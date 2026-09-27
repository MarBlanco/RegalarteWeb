'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'

/**
 * Valida la sesión persistida al arrancar (y cuando cambia el token).
 *
 * Causa real del "You are not allowed" en /profile: el JWT expira a las
 * 2h (`tokenExpiration: 7200`) pero el store persistido conserva usuario y
 * token vencido. La UI parece logueada (nombre, Hola) pero el backend ve
 * `req.user = null` y deniega todo con 403. Al detectar token inválido se
 * limpia la sesión para que los guards existentes lleven al login.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setLoading, token, logout } = useAuth()
  const checked = useRef<string | null>(null)

  useEffect(() => {
    setLoading(false)
    if (!token || checked.current === token) return
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
  }, [token, setLoading, logout])

  return <>{children}</>
}
