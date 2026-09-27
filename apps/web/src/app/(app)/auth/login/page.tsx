'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { useEditMode } from '@/hooks/use-edit-mode'

function MailIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function LockIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function EyeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <path d="m2 2 20 20" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { setUser, setToken } = useAuth()
  const setViewAsClient = useEditMode((s) => s.setViewAsClient)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.errors?.[0]?.message || 'Email o contraseña incorrectos')
      }

      // Payload 3 responde al login con `{ token, user, exp }` (sin `doc`).
      const loggedUser = data.user
      if (!loggedUser || !data.token) {
        throw new Error('Email o contraseña incorrectos')
      }

      setUser({
        id: loggedUser.id,
        email: loggedUser.email,
        name: loggedUser.name,
        role: loggedUser.role,
        customer_type: loggedUser.customer_type,
        business_name: loggedUser.business_name,
        cuit: loggedUser.cuit,
        phone: loggedUser.phone,
        phoneAlt: loggedUser.phoneAlt,
        address: loggedUser.address ?? null,
        addresses: loggedUser.addresses ?? [],
        province: loggedUser.province,
        city: loggedUser.city,
        whatsapp: loggedUser.whatsapp,
      })
      setToken(data.token)
      // Al ingresar, siempre arrancar en el modo correspondiente al rol
      // (evita heredar "ver como cliente" de una sesión anterior).
      setViewAsClient(false)

      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col lg:grid lg:grid-cols-2">
      {/* Panel visual */}
      <div className="relative h-52 w-full overflow-hidden sm:h-64 lg:h-auto lg:min-h-full">
        <Image
          src="/assets/hero/hero-solistica-2.jpeg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#F9F5F0]/80 via-[#F9F5F0]/25 to-transparent"
        />
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 lg:px-16">
          <h2 className="font-serif text-4xl font-normal tracking-tight text-[#38271D] sm:text-5xl lg:text-[56px] lg:leading-[1.05]">
            Bienvenida
          </h2>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#5A4A3E] sm:max-w-sm sm:text-[15px]">
            Ingresá a tu cuenta y seguí creando momentos especiales.
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex w-full items-center justify-center bg-[#F7F1E9] px-4 py-10 sm:px-8 lg:py-14">
        <div className="w-full max-w-md rounded-2xl bg-white px-6 py-8 shadow-[0_8px_30px_rgba(56,39,29,0.08)] sm:px-10 sm:py-10">
          <div className="flex flex-col items-center text-center">
            <span className="relative block h-12 w-12">
              <Image
                src="/assets/branding/solistica-logo.webp"
                alt="Solística"
                fill
                sizes="48px"
                className="object-contain"
              />
            </span>
            <span className="mt-1.5 font-serif text-[11px] font-medium uppercase leading-none tracking-[0.24em] text-[#38271D]">
              Solística
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#1F1B16]">
              Iniciar sesión
            </h1>
            <p className="mt-1.5 text-sm text-[#7A6A5D]">
              Ingresá a tu cuenta para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#9A8A7A]">
                    <MailIcon />
                  </span>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-xl pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#9A8A7A]">
                    <LockIcon />
                  </span>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 rounded-xl pl-10 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-2 flex w-8 items-center justify-center rounded-md text-[#9A8A7A] transition-colors hover:text-[#38271D]"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="text-sm text-destructive bg-destructive/10 p-3 rounded-md"
                >
                  {error}
                </div>
              )}

              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-[#A15C38] underline-offset-4 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="h-12 w-full rounded-xl text-sm font-semibold uppercase tracking-wider"
              >
                {isLoading ? 'Ingresando...' : 'Iniciar sesión'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                ¿No tenés cuenta?{' '}
                <Link
                  href="/auth/register"
                  className="font-medium text-[#A15C38] underline-offset-4 hover:underline"
                >
                  Crear cuenta
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
