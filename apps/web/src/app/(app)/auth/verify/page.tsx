'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (token) {
      // TODO: Implement Payload CMS email verification
      setTimeout(() => setStatus('success'), 1000)
    } else {
      setStatus('error')
    }
  }, [token])

  if (status === 'loading') {
    return (
      <div className="container flex items-center justify-center min-h-[80vh] py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Verificando email...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="container flex items-center justify-center min-h-[80vh] py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>
              Este link de verificación no es válido o expiró.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full" variant="outline">
              <Link href="/auth/login">Iniciar sesión</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center min-h-[80vh] py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Email verificado</CardTitle>
          <CardDescription>
            Tu email fue verificado correctamente.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/auth/login">Iniciar sesión</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
