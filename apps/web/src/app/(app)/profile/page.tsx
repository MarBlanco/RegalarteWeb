'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const { user, token, setUser, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)

      const res = await fetch(`/api/users/${user!.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          name: formData.get('name'),
          phone: formData.get('phone'),
          whatsapp: formData.get('whatsapp'),
          province: formData.get('province'),
          city: formData.get('city'),
          ...(user!.customer_type === 'WHOLESALE'
            ? {
                business_name: formData.get('business_name'),
                cuit: formData.get('cuit'),
              }
            : {}),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.errors?.[0]?.message || 'Error al guardar')
      }

      setUser({
        ...user!,
        name: data.doc.name,
        phone: data.doc.phone,
        whatsapp: data.doc.whatsapp,
        province: data.doc.province,
        city: data.doc.city,
        business_name: data.doc.business_name,
        cuit: data.doc.cuit,
      })

      setSuccess('Perfil actualizado correctamente')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsLoading(false)
    }
  }

  function handleLogout() {
    logout()
    router.push('/')
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
                <Button type="button" variant="outline" onClick={handleLogout}>
                  Cerrar sesión
                </Button>
              </div>
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                  {success}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
