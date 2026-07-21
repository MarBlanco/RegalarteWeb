import type { CollectionConfig } from 'payload'

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
        create: () => true,
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
