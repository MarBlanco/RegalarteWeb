import type { CollectionConfig } from 'payload'

/**
 * Categories — árbol jerárquico de categorías del catálogo REGALARTE.
 *
 * Se modela como una colección auto-referenciada vía el campo `parent`,
 * dando soporte a subcategorías arbitrarias. Es el eje de navegación del
 * storefront (`/catalogo?categoria=...`) y de la organización de productos.
 *
 * Gestión administrativa (TICKET-016):
 *  - `read` público: el storefront y la API REST consumen categorías sin
 *    autenticación (`/api/categories`, `where[category.slug][equals]`).
 *  - `create`/`update` restringidos a admin/staff: el storefront nunca
 *    crea categorías, sólo el panel administración.
 *  - `delete` sólo admin con guard anti auto-borrado: eliminar una
 *    categoría con `parent` rompería el árbol y dejaría huérfanos a los
 *    productos que la referencian; el curso correcto es desactivar
 *    (`active = false`) en su lugar.
 *
 * Sin cambios de schema. Sin migraciones. Sin arquitectura nueva.
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    group: 'Catálogo',
    description:
      'Árbol jerárquico de categorías del catálogo. El storefront las lee públicamente; crear/editar requiere staff/admin. Para retirar una categoría del catálogo, desactivarla (active=false) en lugar de borrarla: preserva el árbol y los productos asociados.',
    defaultColumns: [
      'title',
      'slug',
      'parent',
      'sortOrder',
      'featured',
      'active',
      'createdAt',
    ],
    listSearchableFields: ['title', 'slug', 'seoTitle'],
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
    delete: ({ req: { user }, id }) => {
      const u = user as { role?: string; id?: string | number } | null
      if (!u) return false
      if (u.role !== 'admin') return false
      if (u.id !== undefined && String(u.id) === String(id)) return false
      return true
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
