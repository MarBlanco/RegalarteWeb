'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { useAuth } from '@/hooks/use-auth'

export default function RegisterPage() {
  const router = useRouter()
  const { setUser, setToken } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [customerType, setCustomerType] = useState<'RETAIL' | 'WHOLESALE'>('RETAIL')
  const [businessName, setBusinessName] = useState('')
  const [cuit, setCuit] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          role: 'retail',
          customer_type: customerType,
          business_name: customerType === 'WHOLESALE' ? businessName : undefined,
          cuit: customerType === 'WHOLESALE' ? cuit : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.errors?.[0]?.message || 'Error al crear la cuenta')
      }

      const loginRes = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const loginData = await loginRes.json()

      if (!loginRes.ok) {
        throw new Error(loginData.errors?.[0]?.message || 'Error al iniciar sesión')
      }

      setUser({
        id: loginData.doc.id,
        email: loginData.doc.email,
        name: loginData.doc.name,
        role: loginData.doc.role,
        customer_type: loginData.doc.customer_type,
        business_name: loginData.doc.business_name,
        cuit: loginData.doc.cuit,
        phone: loginData.doc.phone,
        province: loginData.doc.province,
        city: loginData.doc.city,
        whatsapp: loginData.doc.whatsapp,
      })
      setToken(loginData.token)

      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta')
    } finally {
      setIsLoading(false)
    }
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

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            {customerType === 'WHOLESALE' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="business_name">Razón social</Label>
                  <Input
                    id="business_name"
                    type="text"
                    placeholder="Razón social"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuit">CUIT</Label>
                  <Input
                    id="cuit"
                    type="text"
                    placeholder="XX-XXXXXXXX-X"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
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
