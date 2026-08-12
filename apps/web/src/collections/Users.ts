import type { CollectionConfig } from 'payload'

/**
 * TICKET-015 — Gestión de Clientes (administración).
 *
 * Esta colección representa tanto a clientes como a usuarios internos.
 * Para administración se exponen únicamente mejoras nativas de Payload:
 *
 *  - admin.description: contexto en el sidebar del panel.
 *  - admin.defaultColumns: columnas relevantes para identificar clientes.
 *  - admin.listSearchableFields: búsqueda nativa por email/nombre/teléfono/cuit/razón social.
 *  - access.delete: protegido (admin). Se desactiva en lugar de borrar para
 *    preservar integridad referencial con Orders. Los clientes se registran
 *    públicamente vía POST /api/users (self-registration).
 *
 * AUDIT-003 (seguridad):
 *   - `admin`:    solo admin/staff pueden acceder al panel de administración.
 *   - `read`:     self-registration mediante POST /api/users devuelve solo el
 *                 documento propio; el resto solo es visible para admin/staff.
 *   - `update`:   cada usuario actualiza su propio documento; admin/staff el resto.
 *   - `role`:     el valor de role es asignado únicamente por admin/staff; el
 *                 registro público queda con defaultValue 'retail' (evita
 *                 escalada de privilegios enviando role: 'admin' en el POST).
 *
 * No se modifican flujos públicos ni se introduce arquitectura nueva.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 7200,
    verify: false,
    forgotPassword: {
      generateEmailSubject: () => 'Regalarte - Restablecer contraseña',
      generateEmailHTML: (args: any) => {
        const token = args?.token || ''
        return `<a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}">Resetear contraseña</a>`
      },
    },
  },
  admin: {
    useAsTitle: 'email',
    group: 'Usuarios',
    description:
      'Gestión de clientes y usuarios internos. Los clientes se registran desde el storefront. Solo admin puede eliminar registros para preservar historial de pedidos.',
    defaultColumns: [
      'email',
      'name',
      'customer_type',
      'role',
      'phone',
      'city',
      'province',
      'createdAt',
    ],
    listSearchableFields: [
      'email',
      'name',
      'phone',
      'whatsapp',
      'cuit',
      'business_name',
      'city',
    ],
  },
  access: {
    admin: ({ req: { user } }) => {
      const u = user as { role?: string } | null
      if (!u) return false
      return u.role === 'admin' || u.role === 'staff'
    },
    read: ({ req: { user }, id }) => {
      const u = user as { role?: string; id?: string | number } | null
      if (!u || !id) return false
      // Cada usuario puede leer su propio documento (perfil / me).
      if (String(u.id) === String(id)) return true
      return u.role === 'admin' || u.role === 'staff'
    },
    update: ({ req: { user }, id }) => {
      const u = user as { role?: string; id?: string | number } | null
      if (!u || !id) return false
      // Cada usuario actualiza su propio documento (perfil / me).
      if (String(u.id) === String(id)) return true
      return u.role === 'admin' || u.role === 'staff'
    },
    delete: ({ req: { user } }) => {
      const u = user as { role?: string } | null
      if (!u) return false
      return u.role === 'admin'
    },
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'retail',
      options: [
        { label: 'Visitante', value: 'visitor' },
        { label: 'Minorista', value: 'retail' },
        { label: 'Mayorista', value: 'wholesale' },
        { label: 'Staff', value: 'staff' },
        { label: 'Admin', value: 'admin' },
      ],
      access: {
        create: ({ req: { user } }) => {
          const u = user as { role?: string } | null
          if (!u) return false
          return u.role === 'admin' || u.role === 'staff'
        },
        read: () => true,
        update: ({ req: { user } }) => {
          const u = user as { role?: string } | null
          if (!u) return false
          return u.role === 'admin' || u.role === 'staff'
        },
      },
    },
    {
      name: 'customer_type',
      type: 'select',
      required: true,
      defaultValue: 'RETAIL',
      options: [
        { label: 'Minorista', value: 'RETAIL' },
        { label: 'Mayorista', value: 'WHOLESALE' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nombre completo',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Teléfono',
    },
    {
      name: 'business_name',
      type: 'text',
      label: 'Razón social',
      admin: {
        condition: (data) => data?.customer_type === 'WHOLESALE',
      },
    },
    {
      name: 'cuit',
      type: 'text',
      label: 'CUIT',
      admin: {
        condition: (data) => data?.customer_type === 'WHOLESALE',
      },
    },
    {
      name: 'province',
      type: 'text',
      label: 'Provincia',
    },
    {
      name: 'city',
      type: 'text',
      label: 'Ciudad',
    },
    {
      name: 'whatsapp',
      type: 'text',
      label: 'WhatsApp',
    },
  ],
  timestamps: true,
}
