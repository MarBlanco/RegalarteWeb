import type { CollectionConfig } from 'payload'

/**
 * Orders: coleccion transaccional de pedidos creados por el checkout.
 *
 * Cada Order contiene un snapshot inmutable de los items del carrito
 * y los datos del cliente en el momento de la compra, alineado con
 * `lib/cart/types.ts` (CartItem snapshot) y los docs 13 (Database
 * Design) y 18 (Wholesale Strategy).
 *
 * `paymentProvider` y `paymentExternalId` son completados por el
 * provider de pago tras la inicializacion (TICKET-010). El campo
 * `status` refleja el ciclo de vida de la orden.
 *
 * Gestion administrativa (TICKET-014):
 *   - `read` y `update` permiten acceso a usuarios admin/staff.
 *   - El POST publico desde /api/orders (checkout) sigue funcionando
 *     porque `create` se mantiene abierto para todos.
 *   - `delete` permanece bloqueado: una Order nunca se borra, solo
 *     se anula cambiando `status` a cancelled.
 */
export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    description:
      'Pedidos generados por el checkout. El admin puede ver y actualizar el estado (p. ej. pending → paid). El storefront solo crea orders via POST /api/orders; nunca las lee.',
    defaultColumns: [
      'orderNumber',
      'status',
      'mode',
      'customer.email',
      'total',
      'paymentProvider',
      'createdAt',
    ],
    group: 'Operación',
    listSearchableFields: [
      'orderNumber',
      'customer.email',
      'customer.phone',
      'paymentExternalId',
    ],
  },
  access: {
    read: ({ req: { user } }) => {
      const u = user as { role?: string } | null
      if (!u) return false
      return u.role === 'admin' || u.role === 'staff'
    },
    create: () => true,
    update: ({ req: { user } }) => {
      const u = user as { role?: string } | null
      if (!u) return false
      return u.role === 'admin' || u.role === 'staff'
    },
    delete: () => false,
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Número de orden',
      admin: {
        position: 'sidebar',
        description: 'Identificador público human-readable (ej. RG-2026-00001).',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      label: 'Estado',
      options: [
        { label: 'Pendiente', value: 'pending' },
        { label: 'Pagada', value: 'paid' },
        { label: 'Rechazada', value: 'rejected' },
        { label: 'Cancelada', value: 'cancelled' },
        { label: 'Completada', value: 'fulfilled' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'mode',
      type: 'select',
      required: true,
      label: 'Modo de precios',
      options: [
        { label: 'Minorista', value: 'RETAIL' },
        { label: 'Mayorista', value: 'WHOLESALE' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'customer',
      type: 'group',
      label: 'Datos del cliente',
      fields: [
        { name: 'firstName', type: 'text', required: true, label: 'Nombre' },
        { name: 'lastName', type: 'text', required: true, label: 'Apellido' },
        { name: 'email', type: 'email', required: true, label: 'Email' },
        { name: 'phone', type: 'text', required: true, label: 'Teléfono' },
      ],
    },
    {
      name: 'address',
      type: 'group',
      label: 'Dirección de envío',
      fields: [
        { name: 'province', type: 'text', required: true, label: 'Provincia' },
        { name: 'city', type: 'text', required: true, label: 'Ciudad' },
        { name: 'street', type: 'text', required: true, label: 'Dirección' },
        { name: 'postalCode', type: 'text', required: true, label: 'Código postal' },
      ],
    },
    {
      name: 'notes',
      type: 'group',
      label: 'Observaciones',
      fields: [
        { name: 'message', type: 'textarea', label: 'Mensaje' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      label: 'Items',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
          label: 'Producto',
        },
        {
          name: 'slug',
          type: 'text',
          required: true,
          label: 'Slug',
        },
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'Nombre',
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
          label: 'Cantidad',
        },
        {
          name: 'unitPrice',
          type: 'number',
          required: true,
          min: 0,
          label: 'Precio unitario',
        },
        {
          name: 'lineTotal',
          type: 'number',
          required: true,
          min: 0,
          label: 'Subtotal línea',
        },
      ],
    },
    {
      name: 'subtotal',
      type: 'number',
      required: true,
      min: 0,
      label: 'Subtotal',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'shipping',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      label: 'Envío',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'total',
      type: 'number',
      required: true,
      min: 0,
      label: 'Total',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'paymentProvider',
      type: 'select',
      required: false,
      label: 'Proveedor de pago',
      options: [
        { label: 'Mock', value: 'mock' },
        { label: 'Mercado Pago', value: 'mercadopago' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Completado por el provider tras la inicialización del pago.',
      },
    },
    {
      name: 'paymentExternalId',
      type: 'text',
      required: false,
      index: true,
      label: 'ID externo del pago',
      admin: {
        position: 'sidebar',
        description:
          'Identificador devuelto por el provider (preference_id, etc.).',
      },
    },
  ],
  timestamps: true,
}
