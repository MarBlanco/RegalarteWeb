import type { CollectionConfig } from 'payload'

export const ProductTags: CollectionConfig = {
  slug: 'product-tags',
  admin: {
    useAsTitle: 'name',
    group: 'Catálogo',
    defaultColumns: ['name', 'slug', 'color'],
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
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Descripción',
    },
    {
      name: 'color',
      type: 'text',
      label: 'Color (hex)',
      admin: {
        description: 'Color para UI, ej: #FF6B6B',
      },
    },
  ],
  timestamps: true,
}