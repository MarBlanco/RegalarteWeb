import type { GlobalConfig } from 'payload'

/**
 * Navegación principal de la tienda (header).
 *
 * Cada opción apunta a una categoría existente (`categories`, única fuente de
 * verdad de los slugs) o a una ruta interna. Una opción desactivada se
 * conserva pero no se muestra. Sin opciones guardadas se usa la navegación
 * por defecto (ver `lib/navigation`), idéntica a la que estaba en código.
 *
 * Acceso (mismo patrón que SiteSettings): lectura pública; edición
 * admin/staff.
 */
const internalPath = (value: unknown) => {
  if (value === undefined || value === null || value === '') return true
  return typeof value === 'string' && /^\/(?!\/)[^\s]*$/.test(value)
    ? true
    : 'Debe ser una ruta interna que empiece con / (ej: /catalogo?category=velas)'
}

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navegación principal',
  admin: {
    group: 'Contenido',
    description:
      'Opciones del menú principal. También se editan desde la tienda con "Editar navegación". Sin opciones guardadas se usa el menú por defecto.',
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
      name: 'items',
      type: 'array',
      label: 'Opciones',
      labels: { singular: 'Opción', plural: 'Opciones' },
      admin: { initCollapsed: true },
      fields: [
        { name: 'label', type: 'text', label: 'Texto', required: true, maxLength: 40 },
        {
          name: 'destinationType',
          type: 'select',
          label: 'Destino',
          defaultValue: 'category',
          required: true,
          options: [
            { label: 'Categoría', value: 'category' },
            { label: 'Ruta interna', value: 'path' },
          ],
        },
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: false,
          label: 'Categoría',
          admin: { condition: (_, sibling) => sibling?.destinationType === 'category' },
        },
        {
          name: 'path',
          type: 'text',
          label: 'Ruta interna',
          validate: internalPath,
          admin: { condition: (_, sibling) => sibling?.destinationType === 'path' },
        },
        { name: 'active', type: 'checkbox', label: 'Activa', defaultValue: true },
        {
          name: 'accent',
          type: 'checkbox',
          label: 'Destacada (color y regalo)',
          defaultValue: false,
        },
      ],
    },
  ],
}
