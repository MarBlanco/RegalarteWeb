import type { CollectionConfig } from 'payload'

/**
 * Cupones de descuento del checkout (porcentaje sobre el subtotal).
 *
 * Antes vivían hardcodeados en `lib/orders/coupons.ts` (un único cupón de
 * lanzamiento, REGALARTE10 al 10 %); la migración lo siembra tal cual.
 *
 * Acceso: solo admin (afecta precios). El storefront nunca lee la colección:
 * valida códigos a través de `/api/coupons/validate` y el servidor revalida
 * al crear la orden (AUDIT-004).
 */
const adminOnly = ({ req: { user } }: { req: { user: unknown } }) =>
  (user as { role?: string } | null)?.role === 'admin'

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  labels: { singular: 'Cupón', plural: 'Cupones' },
  admin: {
    useAsTitle: 'code',
    group: 'Operación',
    description:
      'Cupones de descuento porcentual aplicables en el checkout. Solo admin.',
    defaultColumns: ['code', 'percent', 'active', 'updatedAt'],
  },
  access: {
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && typeof data.code === 'string') {
          // Mismo normalizado que `normalizeCouponCode` (mayúsculas, sin espacios).
          data.code = data.code.trim().toUpperCase().replace(/\s+/g, '')
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Código',
      admin: {
        description: 'Se guarda en mayúsculas y sin espacios.',
      },
    },
    {
      name: 'percent',
      type: 'number',
      required: true,
      min: 1,
      max: 100,
      label: 'Descuento (%)',
      admin: {
        description: 'Porcentaje sobre el subtotal del pedido (1 a 100).',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Activo',
      admin: {
        description: 'Un cupón inactivo se rechaza en el checkout.',
      },
    },
  ],
}
