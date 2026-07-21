'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    // TODO: Implement profile update
    await new Promise((r) => setTimeout(r, 1000))
    setIsLoading(false)
  }

  if (!user) {
    return (
      <div className="container flex items-center justify-center min-h-[80vh] py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>No iniciaste sesión</CardTitle>
            <CardDescription>
              Necesitás iniciar sesión para ver tu perfil.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi cuenta</h1>
          <p className="text-muted-foreground mt-1">
            Gestioná tu información personal
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información personal</CardTitle>
            <CardDescription>
              Actualizá tus datos de contacto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    defaultValue={user.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user.email}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    defaultValue={user.phone || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    defaultValue={user.whatsapp || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Provincia</Label>
                  <Input
                    id="province"
                    defaultValue={user.province || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    defaultValue={user.city || ''}
                  />
                </div>
              </div>

              {user.customer_type === 'WHOLESALE' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Razón social</Label>
                    <Input
                      id="business_name"
                      defaultValue={user.business_name || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cuit">CUIT</Label>
                    <Input
                      id="cuit"
                      defaultValue={user.cuit || ''}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar cambios'}
                </Button>
                <Button type="button" variant="outline" onClick={logout}>
                  Cerrar sesión
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
