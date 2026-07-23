import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    group: 'Catálogo',
    defaultColumns: ['name', 'category', 'price', 'wholesalePrice', 'isActive', 'isWholesaleAvailable'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'staff',
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'staff',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nombre',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Slug',
      admin: {
        description: 'URL amigable (ej: caja-sorpresa-cumpleanos)',
      },
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Descripción',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      label: 'Categoría',
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      label: 'Etiquetas',
    },
    {
      name: 'attributes',
      type: 'relationship',
      relationTo: 'attributes',
      hasMany: true,
      label: 'Atributos',
    },
    {
      name: 'images',
      type: 'array',
      label: 'Imágenes',
      minRows: 1,
      maxRows: 10,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'alt',
          type: 'text',
          label: 'Texto alternativo',
        },
        {
          name: 'isPrimary',
          type: 'checkbox',
          defaultValue: false,
          label: 'Principal',
        },
      ],
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      label: 'Precio minorista (ARS)',
      admin: {
        step: 1,
      },
    },
    {
      name: 'wholesalePrice',
      type: 'number',
      min: 0,
      label: 'Precio mayorista (ARS)',
      admin: {
        step: 1,
        condition: (data) => data?.isWholesaleAvailable,
      },
    },
    {
      name: 'isWholesaleAvailable',
      type: 'checkbox',
      defaultValue: false,
      label: 'Disponible para mayoristas',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sku',
      type: 'text',
      label: 'SKU',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'stock',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Stock',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Activo',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Destacado',
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
  ],
  timestamps: true,
}