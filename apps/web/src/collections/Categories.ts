import type { CollectionConfig } from 'payload'

/**
 * TICKET-016 — Gestión de Categorías (administración).
 *
 * Mejoras nativas de Payload aplicadas al panel admin:
 *
 *  - admin.description: contexto en el sidebar del panel.
 *  - admin.defaultColumns: columnas relevantes para identificar categorías.
 *  - admin.listSearchableFields: búsqueda nativa por título/slug/descripción/SEO.
 *
 * El campo `parent` (self-relationship), `featured`, `active`, `sortOrder`
 * y los campos SEO ya estaban presentes. No se modifican fields, no se
 * agregan hooks, endpoints, plugins ni migraciones. La storefront sigue
 * leyendo categorías vía `access.read: () => true`.
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    group: 'Catálogo',
    description:
      'Jerarquía de categorías del catálogo. Soporta sub-categorías vía campo parent y orden manual vía sortOrder.',
    defaultColumns: ['title', 'slug', 'parent', 'featured', 'active', 'sortOrder', 'updatedAt'],
    listSearchableFields: ['title', 'slug', 'description', 'seoTitle', 'seoDescription'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      const u = user as { role?: string } | null
      if (!u) return false
      return u.role === 'admin' || u.role === 'staff'
    },
    update: ({ req: { user } }) => {
      const u = user as { role?: string } | null
      if (!u) return false
      return u.role === 'admin' || u.role === 'staff'
    },
    delete: ({ req: { user } }) => {
      const u = user as { role?: string } | null
      if (!u) return false
      return u.role === 'admin' || u.role === 'staff'
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Título',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Slug',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Descripción',
    },
    {
      name: 'image',
      type: 'relationship',
      relationTo: 'media',
      hasMany: false,
      label: 'Imagen',
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: false,
      label: 'Categoría padre',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      label: 'Orden',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Destacada',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Activa',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'seoTitle',
      type: 'text',
      label: 'SEO · Título',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      label: 'SEO · Descripción',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
