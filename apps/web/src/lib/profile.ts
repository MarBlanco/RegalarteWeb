import type { UserAddress, UserExtraAddress } from '@/hooks/use-auth'

/**
 * Mi cuenta: snapshot del formulario, comparación y validación.
 * Funciones puras y testeables; el PUT vive en la página.
 */

export interface ProfileForm {
  name: string
  phone: string
  phoneAlt: string
  showAltPhone: boolean
  businessName: string
  cuit: string
  address: Required<Omit<UserAddress, 'references'>> & { references: string }
  addresses: Array<UserExtraAddress & { _key: string }>
}

export const EMPTY_ADDRESS = {
  street: '',
  number: '',
  apartment: '',
  postalCode: '',
  locality: '',
  province: '',
  references: '',
}

export function buildProfileForm(user: {
  name: string
  phone?: string
  phoneAlt?: string
  business_name?: string
  cuit?: string
  address?: UserAddress | null
  addresses?: UserExtraAddress[]
}): ProfileForm {
  const address = user.address ?? {}
  const addresses = Array.isArray(user.addresses) ? user.addresses : []
  return {
    name: user.name ?? '',
    phone: user.phone ?? '',
    phoneAlt: user.phoneAlt ?? '',
    showAltPhone: !!(user.phoneAlt && user.phoneAlt.trim()),
    businessName: user.business_name ?? '',
    cuit: user.cuit ?? '',
    address: {
      street: address.street ?? '',
      number: address.number ?? '',
      apartment: address.apartment ?? '',
      postalCode: address.postalCode ?? '',
      locality: address.locality ?? '',
      province: address.province ?? '',
      references: address.references ?? '',
    },
    addresses: addresses.map((a, i) => ({
      id: a.id,
      label: a.label ?? '',
      street: a.street ?? '',
      number: a.number ?? '',
      apartment: a.apartment ?? '',
      postalCode: a.postalCode ?? '',
      locality: a.locality ?? '',
      province: a.province ?? '',
      references: a.references ?? '',
      _key: a.id ? `id-${a.id}` : `nuevo-${i}-${Date.now()}`,
    })),
  }
}

function normalizeAddress(a: {
  street?: string
  number?: string
  apartment?: string
  postalCode?: string
  locality?: string
  province?: string
  references?: string
}) {
  return {
    street: (a.street ?? '').trim(),
    number: (a.number ?? '').trim(),
    apartment: (a.apartment ?? '').trim(),
    postalCode: (a.postalCode ?? '').trim(),
    locality: (a.locality ?? '').trim(),
    province: (a.province ?? '').trim(),
    references: (a.references ?? '').trim().slice(0, 250),
  }
}

/** Snapshot comparable (sin claves efímeras ni espacios sobrantes). */
export function snapshotProfile(form: ProfileForm): string {
  return JSON.stringify({
    name: form.name.trim(),
    phone: form.phone.trim(),
    phoneAlt: form.showAltPhone ? form.phoneAlt.trim() : '',
    businessName: form.businessName.trim(),
    cuit: form.cuit.trim(),
    address: normalizeAddress(form.address),
    addresses: form.addresses.map((a) => ({
      id: a.id,
      label: a.label.trim(),
      ...normalizeAddress(a),
    })),
  })
}

export function isProfileDirty(current: ProfileForm, saved: string): boolean {
  return snapshotProfile(current) !== saved
}

export interface AddressErrors {
  label?: string
  street?: string
  number?: string
  postalCode?: string
  locality?: string
  province?: string
}

/** Valida una dirección adicional antes de agregarla/guardarla. */
export function validateExtraAddress(a: {
  label: string
  street: string
  number: string
  postalCode: string
  locality: string
  province: string
}): AddressErrors {
  const errors: AddressErrors = {}
  if (!a.label.trim()) errors.label = 'Poné una etiqueta (ej. Trabajo)'
  if (!a.street.trim()) errors.street = 'Requerido'
  if (!a.number.trim()) errors.number = 'Requerido'
  if (!a.postalCode.trim()) errors.postalCode = 'Requerido'
  if (!a.locality.trim()) errors.locality = 'Requerido'
  if (!a.province.trim()) errors.province = 'Requerido'
  return errors
}

export const PROVINCES = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
]
