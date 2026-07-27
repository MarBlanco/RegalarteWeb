'use client'

import { QueryProvider } from './query-provider'
import { AuthProvider } from './auth-provider'
import { CartProvider } from '@/components/cart/cart-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
