'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.errors?.[0]?.message || 'Error al enviar el email')
      }

      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el email')
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="container flex items-center justify-center min-h-[80vh] py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Email enviado</CardTitle>
            <CardDescription>
              Si existe una cuenta con ese email, vas a recibir instrucciones para
              restablecer tu contraseña.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full" variant="outline">
              <Link href="/auth/login">Volver a iniciar sesión</Link>
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
          <CardTitle>Recuperar contraseña</CardTitle>
          <CardDescription>
            Te enviaremos un link para restablecer tu contraseña
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar instrucciones'}
            </Button>
            <Link
              href="/auth/login"
              className="text-sm text-muted-foreground hover:text-foreground text-center"
            >
              Recordé mi contraseña
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
