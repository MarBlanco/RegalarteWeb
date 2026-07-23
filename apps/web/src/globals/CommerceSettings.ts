import type { GlobalConfig } from 'payload'

export const CommerceSettings: GlobalConfig = {
  slug: 'commerce-settings',
  label: 'Configuración de Comercio',
  admin: {
    group: 'Configuración',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'minimumWholesaleOrder',
      type: 'number',
      required: true,
      defaultValue: 150000,
      min: 0,
      label: 'Pedido mínimo mayorista (ARS)',
      admin: {
        step: 1000,
        description: 'Monto mínimo para pedidos mayoristas',
      },
    },
    {
      name: 'wholesaleEnabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Canal mayorista habilitado',
    },
    {
      name: 'defaultCurrency',
      type: 'text',
      defaultValue: 'ARS',
      label: 'Moneda por defecto',
    },
  ],
}