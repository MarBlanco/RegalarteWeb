'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.errors?.[0]?.message || 'Error al restablecer la contraseña')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restablecer la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="container flex items-center justify-center min-h-[80vh] py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>
              Este link de recuperación no es válido o expiró.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full" variant="outline">
              <Link href="/auth/forgot-password">Solicitar nuevo link</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container flex items-center justify-center min-h-[80vh] py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Contraseña actualizada</CardTitle>
            <CardDescription>
              Tu contraseña se actualizó correctamente.
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

  return (
    <div className="container flex items-center justify-center min-h-[80vh] py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Nueva contraseña</CardTitle>
          <CardDescription>
            Ingresá tu nueva contraseña
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
