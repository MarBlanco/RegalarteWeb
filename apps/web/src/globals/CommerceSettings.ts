import type { GlobalConfig } from 'payload'

/**
 * TICKET-018 — Configuración básica de la tienda.
 *
 * Singleton (Global) para parámetros administrativos de la tienda.
 * Campos aprobados en docs/13_DATABASE_DESIGN.md (sección "Commerce Settings"):
 *
 *   - minimum_wholesale_order
 *   - wholesale_enabled
 *
 * Acceso:
 *   - read:  público (la storefront debe poder leerlo para gating mayorista).
 *   - update: admin/staff (consistente con el patrón aplicado en Orders/Users).
 *
 * Sin endpoints custom, sin hooks, sin dependencias.
 */
export const CommerceSettings: GlobalConfig = {
  slug: 'commerce-settings',
  label: 'Configuración de la tienda',
  admin: {
    group: 'Configuración',
    description:
      'Parámetros administrativos de la tienda. Modificables únicamente por admin y staff.',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => {
      const u = user as { role?: string } | null
      if (!u) return false
      return u.role === 'admin' || u.role === 'staff'
    },
  },
  fields: [
    {
      name: 'wholesale_enabled',
      type: 'checkbox',
      required: true,
      defaultValue: false,
      label: 'Mayorista habilitado',
      admin: {
        description:
          'Habilita el canal mayorista en la storefront. Cuando está deshabilitado, los mayoristas no pueden comprar.',
      },
    },
    {
      name: 'minimum_wholesale_order',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      label: 'Pedido mínimo mayorista',
      admin: {
        description:
          'Monto mínimo (en ARS) que debe alcanzar un pedido para ser aceptado en el canal mayorista.',
      },
    },
  ],
}
