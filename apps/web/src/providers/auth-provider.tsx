'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setLoading, token } = useAuth()

  useEffect(() => {
    if (token) {
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [token, setLoading])

  return <>{children}</>
}
