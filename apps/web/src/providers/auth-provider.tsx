'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setLoading, token } = useAuth()

  useEffect(() => {
    setLoading(false)
  }, [token, setLoading])

  return <>{children}</>
}
