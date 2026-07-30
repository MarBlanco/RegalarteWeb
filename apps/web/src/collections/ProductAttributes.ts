import type { CollectionConfig } from 'payload'

export const ProductAttributes: CollectionConfig = {
  slug: 'product-attributes',
  admin: {
    useAsTitle: 'name',
    group: 'Catálogo',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nombre del atributo',
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
      name: 'values',
      type: 'array',
      required: true,
      minRows: 1,
      label: 'Valores',
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
          label: 'Valor',
        },
        {
          name: 'sortOrder',
          type: 'number',
          defaultValue: 0,
          label: 'Orden',
        },
      ],
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
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Activo',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
