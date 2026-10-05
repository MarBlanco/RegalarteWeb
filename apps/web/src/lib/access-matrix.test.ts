import { describe, it, expect } from 'vitest'
import { Users } from '@/collections/Users'
import { Products } from '@/collections/Products'
import { Media } from '@/collections/Media'
import { Orders } from '@/collections/Orders'
import { Categories } from '@/collections/Categories'
import { CommerceSettings } from '@/globals/CommerceSettings'
import { HomeContent } from '@/globals/HomeContent'
import { PdpContent } from '@/globals/PdpContent'

/**
 * Matriz de permisos por rol (verificación de la cuenta Guale / staff).
 *
 * Invariantes exigidas:
 * - admin: acceso total (storefront, MODO EDICIÓN, /admin, usuarios, roles).
 * - staff (Guale): contenido comercial (productos, media, home, settings),
 *   sin /admin técnico, sin usuarios, sin roles, sin borrados de usuarios.
 * - retail/visitante/anonimo: sin edición ni /admin.
 */
const admin = { id: '1', role: 'admin' }
const staff = { id: '2', role: 'staff' }
const retail = { id: '3', role: 'retail' }

function call(
  fn: ((args: any) => unknown) | undefined,
  user: unknown,
  extra: Record<string, unknown> = {},
): unknown {
  if (!fn) return undefined
  return fn({ req: { user }, ...extra })
}

describe('Matriz de permisos — admin conserva acceso total', () => {
  it('admin: panel, usuarios, catálogo, settings y home', () => {
    expect(call(Users.access?.admin, admin)).toBe(true)
    expect(call(Users.access?.delete, admin)).toBe(true)
    expect(call(Users.access?.update, admin, { id: '9' })).toBe(true)
    expect(call(Products.access?.create, admin)).toBe(true)
    expect(call(Products.access?.update, admin)).toBe(true)
    expect(call(Products.access?.delete, admin)).toBe(true)
    expect(call(Media.access?.update, admin)).toBe(true)
    expect(call(Orders.access?.read, admin)).toBe(true)
    expect(call(Orders.access?.update, admin)).toBe(true)
    expect(call(CommerceSettings.access?.update, admin)).toBe(true)
    expect(call(HomeContent.access?.update, admin)).toBe(true)
    expect(call(PdpContent.access?.update, admin)).toBe(true)
  })
})

describe('Matriz de permisos — staff (Guale) solo comercial', () => {
  it('staff: edita productos, media, settings y home', () => {
    expect(call(Products.access?.create, staff)).toBe(true)
    expect(call(Products.access?.update, staff)).toBe(true)
    expect(call(Media.access?.create, staff)).toBe(true)
    expect(call(HomeContent.access?.update, staff)).toBe(true)
    expect(call(PdpContent.access?.update, staff)).toBe(true)
    expect(call(CommerceSettings.access?.update, staff)).toBe(true)
    expect(call(Orders.access?.read, staff)).toBe(true)
    expect(call(Orders.access?.update, staff)).toBe(true)
  })

  it('staff: administra tipos (categorías) comerciales', () => {
    expect(call(Categories.access?.create, staff)).toBe(true)
    expect(call(Categories.access?.update, staff)).toBe(true)
    expect(call(Categories.access?.delete, staff)).toBe(true)
    expect(call(Categories.access?.read, null)).toBe(true)
  })

  it('staff: no entra al /admin técnico', () => {
    expect(call(Users.access?.admin, staff)).toBe(false)
  })

  it('staff: no administra usuarios ni roles (sin escalada)', () => {
    expect(call(Users.access?.delete, staff)).toBe(false)
    expect(call(Users.access?.read, staff, { id: '9' })).toBe(false)
    expect(call(Users.access?.update, staff, { id: '9' })).toBe(false)
    const roleField = Users.fields.find((f: any) => f.name === 'role') as any
    expect(call(roleField?.access?.create, staff)).toBe(false)
    expect(call(roleField?.access?.update, staff)).toBe(false)
  })

  it('staff: conserva su propio perfil (login / me)', () => {
    expect(call(Users.access?.read, staff, { id: '2' })).toBe(true)
    expect(call(Users.access?.update, staff, { id: '2' })).toBe(true)
  })
})

describe('Matriz de permisos — clientes y anónimos sin edición', () => {
  it('retail: sin crear/editar/borrar nada, sin panel', () => {
    expect(call(Users.access?.admin, retail)).toBe(false)
    expect(call(Users.access?.delete, retail)).toBe(false)
    expect(call(Products.access?.create, retail)).toBe(false)
    expect(call(Products.access?.update, retail)).toBe(false)
    expect(call(Products.access?.delete, retail)).toBe(false)
    expect(call(Media.access?.update, retail)).toBe(false)
    expect(call(Orders.access?.update, retail)).toBe(false)
    expect(call(CommerceSettings.access?.update, retail)).toBe(false)
    expect(call(HomeContent.access?.update, retail)).toBe(false)
    expect(call(PdpContent.access?.update, retail)).toBe(false)
    expect(call(Categories.access?.create, retail)).toBe(false)
    expect(call(Categories.access?.update, retail)).toBe(false)
    expect(call(Categories.access?.delete, retail)).toBe(false)
  })

  it('retail: solo su propio perfil', () => {
    expect(call(Users.access?.read, retail, { id: '3' })).toBe(true)
    expect(call(Users.access?.update, retail, { id: '3' })).toBe(true)
    expect(call(Users.access?.read, retail, { id: '2' })).toBe(false)
  })

  it('anónimo: todo denegado salvo lectura pública', () => {
    expect(call(Users.access?.admin, null)).toBe(false)
    expect(call(Products.access?.create, null)).toBe(false)
    expect(call(HomeContent.access?.update, null)).toBe(false)
    expect(call(CommerceSettings.access?.read, null)).toBe(true)
    expect(call(HomeContent.access?.read, null)).toBe(true)
    expect(call(Products.access?.read, null)).toBe(true)
  })
})

describe('Registro público de clientes', () => {
  it('cualquiera puede registrarse, pero ninguno puede asignarse un rol', () => {
    expect(call(Users.access?.create, null)).toBe(true)
    const roleField = Users.fields.find((f: any) => f.name === 'role') as any
    expect(call(roleField?.access?.create, null)).toBe(false)
    expect(call(roleField?.access?.create, retail)).toBe(false)
    expect(call(roleField?.access?.create, staff)).toBe(false)
    expect(call(roleField?.access?.create, admin)).toBe(true)
    expect(roleField?.defaultValue).toBe('retail')
  })
})

describe('Usuarios — listado en el panel y aislamiento de datos', () => {
  it('admin lista y edita a todos los usuarios (sin id)', () => {
    expect(call(Users.access?.read, admin)).toBe(true)
    expect(call(Users.access?.update, admin)).toBe(true)
  })

  it('staff y cliente solo ven/editan su propio documento, también en listados', () => {
    for (const u of [staff, retail]) {
      expect(call(Users.access?.read, u)).toEqual({ id: { equals: u.id } })
      expect(call(Users.access?.update, u)).toEqual({ id: { equals: u.id } })
    }
  })

  it('anónimo no lee ni edita usuarios', () => {
    expect(call(Users.access?.read, null)).toBe(false)
    expect(call(Users.access?.update, null)).toBe(false)
  })
})
