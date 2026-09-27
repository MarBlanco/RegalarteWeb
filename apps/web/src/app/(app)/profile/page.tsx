'use client'

import { useEffect, useState } from 'react'
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
import { useEditMode, useIsStaff } from '@/hooks/use-edit-mode'
import {
  EMPTY_ADDRESS,
  PROVINCES,
  buildProfileForm,
  isProfileDirty,
  snapshotProfile,
  validateExtraAddress,
  type AddressErrors,
  type ProfileForm,
} from '@/lib/profile'

function UserIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  )
}

function HomeIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  )
}

function PinIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function TrashIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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

interface AddressValue {
  label?: string
  street?: string
  number?: string
  apartment?: string
  postalCode?: string
  locality?: string
  province?: string
  references?: string
}

function AddressFields({
  idPrefix,
  value,
  onChange,
  errors,
  showLabel,
}: {
  idPrefix: string
  value: AddressValue
  onChange: (patch: Partial<AddressValue>) => void
  errors?: AddressErrors
  showLabel?: boolean
}) {
  const inputCls =
    'h-10 rounded-xl border-[#E5DDD1] bg-[#FFFEFB] text-sm'
  const errCls = 'text-xs text-red-700'
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {showLabel ? (
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-label`}>Etiqueta</Label>
          <Input
            id={`${idPrefix}-label`}
            value={value.label ?? ''}
            maxLength={40}
            placeholder="Ej. Trabajo"
            onChange={(e) => onChange({ label: e.target.value })}
            className={inputCls}
          />
          {errors?.label ? <p className={errCls}>{errors.label}</p> : null}
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-street`}>Calle</Label>
        <Input
          id={`${idPrefix}-street`}
          value={value.street ?? ''}
          maxLength={120}
          onChange={(e) => onChange({ street: e.target.value })}
          className={inputCls}
        />
        {errors?.street ? <p className={errCls}>{errors.street}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-number`}>Número</Label>
        <Input
          id={`${idPrefix}-number`}
          value={value.number ?? ''}
          maxLength={20}
          onChange={(e) => onChange({ number: e.target.value })}
          className={inputCls}
        />
        {errors?.number ? <p className={errCls}>{errors.number}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-apartment`}>
          Piso / Departamento <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id={`${idPrefix}-apartment`}
          value={value.apartment ?? ''}
          maxLength={60}
          onChange={(e) => onChange({ apartment: e.target.value })}
          className={inputCls}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-postalCode`}>Código postal</Label>
        <Input
          id={`${idPrefix}-postalCode`}
          value={value.postalCode ?? ''}
          maxLength={20}
          onChange={(e) => onChange({ postalCode: e.target.value })}
          className={inputCls}
        />
        {errors?.postalCode ? <p className={errCls}>{errors.postalCode}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-locality`}>Localidad</Label>
        <Input
          id={`${idPrefix}-locality`}
          value={value.locality ?? ''}
          maxLength={80}
          onChange={(e) => onChange({ locality: e.target.value })}
          className={inputCls}
        />
        {errors?.locality ? <p className={errCls}>{errors.locality}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-province`}>Provincia</Label>
        <select
          id={`${idPrefix}-province`}
          value={value.province ?? ''}
          onChange={(e) => onChange({ province: e.target.value })}
          className="flex h-10 w-full rounded-xl border border-input bg-[#FFFEFB] px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Seleccionar…</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {errors?.province ? <p className={errCls}>{errors.province}</p> : null}
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-references`}>
          Referencias para la entrega <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <textarea
          id={`${idPrefix}-references`}
          value={value.references ?? ''}
          rows={3}
          maxLength={250}
          onChange={(e) => onChange({ references: e.target.value })}
          className="flex min-h-[72px] w-full rounded-xl border border-input bg-[#FFFEFB] px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <p className="text-right text-[11px] tabular-nums text-muted-foreground">
          {(value.references ?? '').length}/250
        </p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, token, setUser, logout, isLoading: authLoading } = useAuth()
  const setViewAsClient = useEditMode((s) => s.setViewAsClient)
  const viewAsClient = useEditMode((s) => s.viewAsClient)
  const isStaff = useIsStaff()

  const [form, setForm] = useState<ProfileForm | null>(null)
  const [saved, setSaved] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [draft, setDraft] = useState({ ...EMPTY_ADDRESS, label: '' })
  const [draftErrors, setDraftErrors] = useState<AddressErrors>({})
  const [editingKey, setEditingKey] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && !form) {
      const initial = buildProfileForm(user)
      setForm(initial)
      setSaved(snapshotProfile(initial))
    }
  }, [user, form])

  function handleLogout() {
    logout()
    setViewAsClient(false)
    router.push('/')
  }

  if (authLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[80vh] py-12">
        <p className="text-sm text-muted-foreground">Cargando tu sesión…</p>
      </div>
    )
  }

  if (!user || !form) {
    return (
      <div className="container flex items-center justify-center min-h-[80vh] py-12">
        <p className="text-sm text-muted-foreground">Redirigiendo al inicio de sesión…</p>
      </div>
    )
  }

  const dirty = isProfileDirty(form, saved)

  function patch(p: Partial<ProfileForm>) {
    setForm((f) => (f ? { ...f, ...p } : f))
    setSuccess('')
  }

  async function handleSave() {
    if (!form || !dirty || isLoading) return
    const currentUser = user
    if (!currentUser) return
    if (!form.name.trim()) {
      setError('El nombre es requerido')
      return
    }
    setIsLoading(true)
    setError('')
    setSuccess('')
    try {
      const addresses = form.addresses.map((a) => ({
        label: (a.label ?? '').trim(),
        street: (a.street ?? '').trim(),
        number: (a.number ?? '').trim(),
        apartment: (a.apartment ?? '').trim(),
        postalCode: (a.postalCode ?? '').trim(),
        locality: (a.locality ?? '').trim(),
        province: (a.province ?? '').trim(),
        references: (a.references ?? '').trim().slice(0, 250),
      }))
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          phoneAlt: form.showAltPhone ? form.phoneAlt.trim() : '',
          business_name: form.businessName.trim(),
          cuit: form.cuit.trim(),
          address: {
            street: form.address.street.trim(),
            number: form.address.number.trim(),
            apartment: form.address.apartment.trim(),
            postalCode: form.address.postalCode.trim(),
            locality: form.address.locality.trim(),
            province: form.address.province.trim(),
            references: form.address.references.trim().slice(0, 250),
          },
          addresses,
          city: form.address.locality.trim(),
          province: form.address.province.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Tu sesión venció. Volvé a iniciar sesión.')
        }
        throw new Error(data.errors?.[0]?.message || 'Error al guardar')
      }
      const doc = data.doc ?? {}
      setUser({
        ...currentUser,
        name: doc.name ?? form.name.trim(),
        phone: doc.phone ?? form.phone.trim(),
        phoneAlt: doc.phoneAlt ?? (form.showAltPhone ? form.phoneAlt.trim() : ''),
        business_name: doc.business_name ?? form.businessName.trim(),
        cuit: doc.cuit ?? form.cuit.trim(),
        address: doc.address ?? null,
        addresses: Array.isArray(doc.addresses) ? doc.addresses : addresses,
        city: doc.city ?? form.address.locality.trim(),
        province: doc.province ?? form.address.province.trim(),
      })
      const fresh = buildProfileForm({
        ...currentUser,
        name: doc.name ?? form.name.trim(),
        phone: doc.phone ?? form.phone.trim(),
        phoneAlt: doc.phoneAlt ?? (form.showAltPhone ? form.phoneAlt.trim() : ''),
        business_name: doc.business_name ?? form.businessName.trim(),
        cuit: doc.cuit ?? form.cuit.trim(),
        address: doc.address ?? null,
        addresses: Array.isArray(doc.addresses) ? doc.addresses : addresses,
      })
      setForm(fresh)
      setSaved(snapshotProfile(fresh))
      setSuccess('Cambios guardados correctamente')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsLoading(false)
    }
  }

  function addDraftAddress() {
    if (!form) return
    const errs = validateExtraAddress(draft)
    setDraftErrors(errs)
    if (Object.keys(errs).length > 0) return
    setForm({
      ...form,
      addresses: [
        ...form.addresses,
        {
          label: draft.label.trim(),
          street: draft.street.trim(),
          number: draft.number.trim(),
          apartment: draft.apartment.trim(),
          postalCode: draft.postalCode.trim(),
          locality: draft.locality.trim(),
          province: draft.province.trim(),
          references: draft.references.trim().slice(0, 250),
          _key: `nuevo-${Date.now()}`,
        },
      ],
    })
    setDraft({ ...EMPTY_ADDRESS, label: '' })
    setDraftErrors({})
    setShowNewAddress(false)
  }

  const inputCls = 'h-10 rounded-xl border-[#E5DDD1] bg-[#FFFEFB] text-sm'

  return (
    <div className="bg-[#FBF7F1]">
      <div className="mx-auto w-full max-w-[880px] px-4 py-8 sm:px-6 lg:py-10">
        <h1 className="font-serif text-3xl font-normal tracking-tight text-[#1F1B16] sm:text-4xl">
          Mi cuenta
        </h1>
        <p className="mt-1.5 text-sm text-[#7A6A5D] sm:text-[15px]">
          Gestioná tus datos personales y tus direcciones de entrega.
        </p>

        {isStaff && viewAsClient ? (
          <Card className="mt-5">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <p className="text-sm text-muted-foreground">
                Estás viendo la tienda como cliente.
              </p>
              <Button type="button" onClick={() => setViewAsClient(false)}>
                Volver a Modo Edición
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="mt-5 space-y-4">
          {/* Datos personales */}
          <Card className="border-[#EBDFD1] shadow-[0_4px_16px_rgba(56,39,29,0.05)]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3EADB] text-[#B85C33]" aria-hidden="true">
                  <UserIcon />
                </span>
                <div>
                  <CardTitle className="font-serif text-xl font-medium">Datos personales</CardTitle>
                  <CardDescription>
                    Esta información se utiliza para gestionar tu cuenta y tus pedidos.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nombre y apellido</Label>
                  <Input
                    id="name"
                    value={form.name}
                    maxLength={120}
                    onChange={(e) => patch({ name: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      disabled
                      aria-describedby="email-locked"
                      className={`${inputCls} bg-[#F5EFE7] pr-10 text-[#9A8A7A]`}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#9A8A7A]" aria-hidden="true">
                      <LockIcon />
                    </span>
                  </div>
                  <p id="email-locked" className="text-[11px] text-muted-foreground">
                    El email no se puede modificar desde aquí.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Teléfono principal</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    maxLength={40}
                    onChange={(e) => patch({ phone: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phoneAlt">
                    Teléfono alternativo <span className="font-normal text-muted-foreground">(opcional)</span>
                  </Label>
                  {form.showAltPhone ? (
                    <div className="flex items-center gap-2">
                      <Input
                        id="phoneAlt"
                        value={form.phoneAlt}
                        maxLength={40}
                        onChange={(e) => patch({ phoneAlt: e.target.value })}
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => patch({ showAltPhone: false, phoneAlt: '' })}
                        aria-label="Eliminar teléfono alternativo"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E5DDD1] text-[#8A3A33] transition-colors hover:bg-[#F9EFE2]"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => patch({ showAltPhone: true })}
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#C9A24B] px-3.5 text-xs font-semibold text-[#8A5A33] transition-colors hover:bg-[#F9EFE2]"
                    >
                      <span aria-hidden="true" className="text-sm leading-none">+</span>
                      Agregar otro teléfono
                    </button>
                  )}
                </div>
              </div>

              {user.customer_type === 'WHOLESALE' ? (
                <div className="mt-3 grid grid-cols-1 gap-3 border-t border-[#EBDFD1] pt-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="business_name">Razón social</Label>
                    <Input
                      id="business_name"
                      value={form.businessName}
                      maxLength={120}
                      onChange={(e) => patch({ businessName: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cuit">CUIT</Label>
                    <Input
                      id="cuit"
                      value={form.cuit}
                      maxLength={20}
                      onChange={(e) => patch({ cuit: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Dirección principal */}
          <Card className="border-[#EBDFD1] shadow-[0_4px_16px_rgba(56,39,29,0.05)]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3EADB] text-[#B85C33]" aria-hidden="true">
                  <HomeIcon />
                </span>
                <div>
                  <CardTitle className="font-serif text-xl font-medium">Dirección principal</CardTitle>
                  <CardDescription>
                    Esta será tu dirección por defecto para los envíos.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AddressFields
                idPrefix="addr-main"
                value={form.address}
                onChange={(p) => patch({ address: { ...form.address, ...p } })}
              />
            </CardContent>
          </Card>

          {/* Otras direcciones */}
          <Card className="border-[#EBDFD1] shadow-[0_4px_16px_rgba(56,39,29,0.05)]">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3EADB] text-[#B85C33]" aria-hidden="true">
                    <PinIcon />
                  </span>
                  <div>
                    <CardTitle className="font-serif text-xl font-medium">Otras direcciones</CardTitle>
                    <CardDescription>
                      Guardá direcciones adicionales para usar en futuros pedidos.
                    </CardDescription>
                  </div>
                </div>
                {!showNewAddress ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDraft({ ...EMPTY_ADDRESS, label: '' })
                      setDraftErrors({})
                      setShowNewAddress(true)
                    }}
                    className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#C9A24B] px-3.5 text-xs font-semibold text-[#8A5A33] transition-colors hover:bg-[#F9EFE2]"
                  >
                    <span aria-hidden="true" className="text-sm leading-none">+</span>
                    Agregar otra dirección
                  </button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {form.addresses.length === 0 && !showNewAddress ? (
                  <p className="text-sm text-muted-foreground">
                    Todavía no guardaste direcciones adicionales.
                  </p>
                ) : null}
                {form.addresses.map((a) => (
                  <div
                    key={a._key}
                    className="rounded-xl border border-[#E5DDD1] bg-[#FFFEFB] p-4"
                  >
                    {editingKey === a._key ? (
                      <div>
                        <AddressFields
                          idPrefix={`addr-${a._key}`}
                          value={a}
                          showLabel
                          errors={undefined}
                          onChange={(p) =>
                            patch({
                              addresses: form.addresses.map((x) =>
                                x._key === a._key ? { ...x, ...p } : x,
                              ),
                            })
                          }
                        />
                        <div className="mt-3 flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setEditingKey(null)}
                          >
                            Listo
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3EADB] text-[#B85C33]" aria-hidden="true">
                            <HomeIcon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#38271D]">
                              {a.label || 'Sin etiqueta'}
                            </p>
                            <p className="mt-0.5 text-[13px] text-[#5C4A3D]">
                              {[a.street, a.number].filter(Boolean).join(' ')}
                            </p>
                            <p className="text-[13px] text-[#5C4A3D]">
                              {[a.locality, a.province].filter(Boolean).join(', ')}
                            </p>
                            {a.postalCode ? (
                              <p className="text-[13px] text-[#5C4A3D]">
                                CP {a.postalCode}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingKey(a._key)}
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#E5DDD1] px-3 text-xs font-medium text-[#5C4A3D] transition-colors hover:bg-[#F5EFE7]"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            </svg>
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              patch({
                                addresses: form.addresses.filter(
                                  (x) => x._key !== a._key,
                                ),
                              })
                            }
                            aria-label={`Eliminar dirección ${a.label || ''}`}
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#E5C9A8] bg-[#F9EFE2] px-3 text-xs font-medium text-[#8A3A33] transition-colors hover:bg-[#F3E2CC]"
                          >
                            <TrashIcon />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {showNewAddress ? (
                  <div className="rounded-xl border border-dashed border-[#C9A24B] bg-[#FFFEFB] p-4">
                    <AddressFields
                      idPrefix="addr-new"
                      value={draft}
                      showLabel
                      errors={draftErrors}
                      onChange={(p) => setDraft((d) => ({ ...d, ...p }))}
                    />
                    <div className="mt-3 flex gap-2">
                      <Button type="button" size="sm" onClick={addDraftAddress}>
                        Agregar dirección
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowNewAddress(false)
                          setDraftErrors({})
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {error ? (
            <div
              role="alert"
              aria-live="assertive"
              className="text-sm text-destructive bg-destructive/10 p-3 rounded-md"
            >
              {error}
            </div>
          ) : null}
          {success ? (
            <div
              role="status"
              aria-live="polite"
              className="text-sm text-green-700 bg-green-50 p-3 rounded-md"
            >
              {success}
            </div>
          ) : null}

          <div className="flex flex-col items-stretch gap-2 border-t border-[#EBDFD1] pt-5 sm:items-end">
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={!dirty || isLoading}
              className="h-11 rounded-xl px-8 text-xs font-semibold uppercase tracking-wider disabled:bg-[#D8CFC2] disabled:text-white disabled:opacity-100"
            >
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
            {!dirty && !isLoading ? (
              <p className="text-[11px] text-muted-foreground">
                Realizá cambios en algún campo para poder guardar.
              </p>
            ) : null}
          </div>

          <div className="flex justify-start">
            <Button type="button" variant="outline" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

}
