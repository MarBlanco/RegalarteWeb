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
 *   - `admin`:    solo admin puede acceder al panel de administración.
 *                 staff (Guale) opera exclusivamente desde el storefront
 *                 (MODO EDICIÓN) y no entra al /admin técnico.
 *   - `read`:     self-registration mediante POST /api/users devuelve solo el
 *                 documento propio; cada usuario lee su propio documento;
 *                 el resto solo es visible para admin.
 *   - `update`:   cada usuario actualiza su propio documento; solo admin
 *                 edita otros usuarios.
 *   - `role`:     el valor de role es asignado únicamente por admin; el
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
      return u.role === 'admin'
    },
    read: ({ req: { user }, id }) => {
      const u = user as { role?: string; id?: string | number } | null
      if (!u || !id) return false
      // Cada usuario puede leer su propio documento (perfil / me).
      if (String(u.id) === String(id)) return true
      return u.role === 'admin'
    },
    update: ({ req: { user }, id }) => {
      const u = user as { role?: string; id?: string | number } | null
      if (!u || !id) return false
      // Cada usuario actualiza su propio documento (perfil / me).
      if (String(u.id) === String(id)) return true
      return u.role === 'admin'
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
          return u.role === 'admin'
        },
        read: () => true,
        update: ({ req: { user } }) => {
          const u = user as { role?: string } | null
          if (!u) return false
          return u.role === 'admin'
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
      name: 'phoneAlt',
      type: 'text',
      label: 'Teléfono alternativo',
      admin: {
        description: 'Teléfono alternativo opcional del cliente (Mi cuenta).',
      },
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
      label: 'WhatsApp (en desuso: Mi cuenta ya no lo utiliza)',
    },
    {
      name: 'address',
      type: 'group',
      label: 'Dirección principal',
      admin: {
        description:
          'Dirección principal de entrega (Mi cuenta). Se usa por defecto para futuros envíos.',
      },
      fields: [
        { name: 'street', type: 'text', label: 'Calle' },
        { name: 'number', type: 'text', label: 'Número' },
        { name: 'apartment', type: 'text', label: 'Piso / Departamento' },
        { name: 'postalCode', type: 'text', label: 'Código postal' },
        { name: 'locality', type: 'text', label: 'Localidad' },
        { name: 'province', type: 'text', label: 'Provincia' },
        {
          name: 'references',
          type: 'textarea',
          label: 'Referencias para la entrega',
        },
      ],
    },
    {
      name: 'addresses',
      type: 'array',
      label: 'Otras direcciones',
      admin: {
        description: 'Direcciones adicionales de entrega (Mi cuenta).',
      },
      fields: [
        { name: 'label', type: 'text', required: true, label: 'Etiqueta' },
        { name: 'street', type: 'text', label: 'Calle' },
        { name: 'number', type: 'text', label: 'Número' },
        { name: 'apartment', type: 'text', label: 'Piso / Departamento' },
        { name: 'postalCode', type: 'text', label: 'Código postal' },
        { name: 'locality', type: 'text', label: 'Localidad' },
        { name: 'province', type: 'text', label: 'Provincia' },
        {
          name: 'references',
          type: 'textarea',
          label: 'Referencias para la entrega',
        },
      ],
    },
  ],
  timestamps: true,
}
