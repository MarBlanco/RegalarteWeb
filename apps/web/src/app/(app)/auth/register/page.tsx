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

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [customerType, setCustomerType] = useState<'RETAIL' | 'WHOLESALE'>('RETAIL')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    // TODO: Implement Payload CMS registration
    await new Promise((r) => setTimeout(r, 1000))
    setIsLoading(false)
  }

  return (
    <div className="container flex items-center justify-center min-h-[80vh] py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>
            Registrate para empezar a descubrir regalos
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de cliente</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={customerType === 'RETAIL' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setCustomerType('RETAIL')}
                >
                  Minorista
                </Button>
                <Button
                  type="button"
                  variant={customerType === 'WHOLESALE' ? 'wholesale' : 'outline'}
                  className="flex-1"
                  onClick={() => setCustomerType('WHOLESALE')}
                >
                  Mayorista
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
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

            {customerType === 'WHOLESALE' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="business_name">Razón social</Label>
                  <Input
                    id="business_name"
                    type="text"
                    placeholder="Razón social"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuit">CUIT</Label>
                  <Input
                    id="cuit"
                    type="text"
                    placeholder="XX-XXXXXXXX-X"
                    required
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Ya tenés cuenta?{' '}
              <Link
                href="/auth/login"
                className="text-primary hover:underline underline-offset-4 font-medium"
              >
                Iniciá sesión
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
